import React, { useMemo, useState } from "react";

type CellValue = string | number | boolean | null | undefined;
type SortDirection = "asc" | "desc";

type ColumnType =
  | "string"
  | "number"
  | "integer"
  | "currency"
  | "percent"
  | "date"
  | "datetime"
  | "boolean";

interface DataTableProps {
  columns: string[];
  rows: CellValue[][];
  caption?: string;
  showRowIndex?: boolean;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (column: string) => void;
  formatCellFn?: (
    value: CellValue,
    columnKey: string,
    rowIndex: number
  ) => React.ReactNode;
}

export function DataTable(props: DataTableProps) {
  const {
    columns,
    rows,
    caption,
    showRowIndex = false,
    sortKey,
    sortDirection,
    onSort,
    formatCellFn,
  } = props;

  function renderSortIndicator(column: string): React.ReactNode {
    if (!sortKey || sortKey !== column) {
      return (
        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
          ↕
        </span>
      );
    }
    if (sortDirection === "asc") {
      return (
        <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">
          ▲
        </span>
      );
    }
    return (
      <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">
        ▼
      </span>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        {caption && (
          <caption className="text-left text-gray-700 dark:text-gray-300 font-medium mb-2">
            {caption}
          </caption>
        )}

        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {showRowIndex && (
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-right font-semibold text-gray-500 dark:text-gray-400 w-12">
                #
              </th>
            )}
            {columns.map(function (col) {
              const sortable = Boolean(onSort);
              return (
                <th
                  key={col}
                  className={
                    "px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-200" +
                    (sortable ? " cursor-pointer select-none" : "")
                  }
                  onClick={
                    sortable
                      ? function () {
                          if (onSort) onSort(col);
                        }
                      : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col}
                    {sortable && renderSortIndicator(col)}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (showRowIndex ? 1 : 0)}
                className="px-3 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                No data
              </td>
            </tr>
          ) : (
            rows.map(function (row, rowIndex) {
              return (
                <tr
                  key={rowIndex}
                  className={
                    rowIndex % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/60"
                  }
                >
                  {showRowIndex && (
                    <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 text-right text-gray-400 dark:text-gray-500">
                      {rowIndex + 1}
                    </td>
                  )}
                  {columns.map(function (col, colIndex) {
                    const value = row[colIndex];
                    const content = formatCellFn
                      ? formatCellFn(value, col, rowIndex)
                      : defaultFormatCell(value);
                    return (
                      <td
                        key={col + colIndex}
                        className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap text-gray-700 dark:text-gray-200"
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function defaultFormatCell(value: CellValue): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 dark:text-gray-600">—</span>;
  }
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Smart wrapper: search, sort, pagination, type formatting, CSV      */
/* ------------------------------------------------------------------ */

interface DataFrameTableProps {
  /** Array of objects, e.g. from `df.to_dict(orient="records")` */
  data: Record<string, CellValue>[];
  caption?: string;
  showRowIndex?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  initialSortKey?: string;
  initialSortDirection?: SortDirection;

  /** Optional explicit column type overrides */
  columnTypes?: Partial<Record<string, ColumnType>>;

  /** Locale for formatting numbers/dates (default "en-US") */
  locale?: string;
  /** Default currency code for currency columns (default "USD") */
  currency?: string;
  /** Max fraction digits for percent formatting (default 2) */
  percentDigits?: number;
}

export default function DataFrameTable(props: DataFrameTableProps) {
  const {
    data,
    caption,
    showRowIndex = false,
    rowsPerPageOptions = [10, 25, 50],
    defaultRowsPerPage = 10,
    initialSortKey,
    initialSortDirection = "asc",
    columnTypes,
    locale = "en-US",
    currency = "USD",
    percentDigits = 2,
  } = props;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<string | null>(
    initialSortKey ?? null
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);
  const [rowsPerPage, setRowsPerPage] = useState<number>(defaultRowsPerPage);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const columns = useMemo(function () {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Infer column types (merged with overrides)
  const columnTypeByKey = useMemo(
    function () {
      const result: Record<string, ColumnType> = {};

      columns.forEach(function (col) {
        const values = data.map(function (row) {
          return row[col];
        });
        const inferred = inferColumnType(col, values);
        const override = columnTypes && columnTypes[col];
        result[col] = override ?? inferred;
      });

      return result;
    },
    [columns, data, columnTypes]
  );

  // Filter
  const filteredData = useMemo(
    function () {
      if (!searchQuery) return data;

      const q = searchQuery.toLowerCase();

      return data.filter(function (row) {
        return Object.values(row).some(function (value) {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(q);
        });
      });
    },
    [data, searchQuery]
  );

  // Sort
  const sortedData = useMemo(
    function () {
      if (!sortKey) return filteredData;

      const copy = filteredData.slice();

      copy.sort(function (a, b) {
        const va = a[sortKey];
        const vb = b[sortKey];

        const aNull = va === null || va === undefined;
        const bNull = vb === null || vb === undefined;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;

        const na = Number(va);
        const nb = Number(vb);
        const bothNumeric = !Number.isNaN(na) && !Number.isNaN(nb);

        let cmp: number;
        if (bothNumeric) {
          cmp = na - nb;
        } else {
          cmp = String(va).localeCompare(String(vb));
        }

        return sortDirection === "asc" ? cmp : -cmp;
      });

      return copy;
    },
    [filteredData, sortKey, sortDirection]
  );

  // Pagination
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages - 1);

  const pageData = useMemo(
    function () {
      const start = safePage * rowsPerPage;
      const end = start + rowsPerPage;
      return sortedData.slice(start, end);
    },
    [sortedData, safePage, rowsPerPage]
  );

  const rowsMatrix: CellValue[][] = useMemo(
    function () {
      if (!columns.length) return [];
      return pageData.map(function (row) {
        return columns.map(function (col) {
          return row[col];
        });
      });
    },
    [columns, pageData]
  );

  function handleSort(column: string) {
    setCurrentPage(0);
    if (sortKey === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(column);
      setSortDirection("asc");
    }
  }

  function handleSearchChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setSearchQuery(event.target.value);
    setCurrentPage(0);
  }

  function handleRowsPerPageChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = Number(event.target.value);
    setRowsPerPage(value);
    setCurrentPage(0);
  }

  function goToPreviousPage() {
    setCurrentPage(function (prev) {
      return Math.max(0, prev - 1);
    });
  }

  function goToNextPage() {
    setCurrentPage(function (prev) {
      return Math.min(totalPages - 1, prev + 1);
    });
  }

  // Type-aware formatter wired into DataTable
  const typedFormatCell = useMemo(
    function () {
      return function (
        value: CellValue,
        columnKey: string,
        _rowIndex: number
      ): React.ReactNode {
        if (value === null || value === undefined) {
          return (
            <span className="text-gray-400 dark:text-gray-600">—</span>
          );
        }

        const type = columnTypeByKey[columnKey] ?? "string";
        const str = formatValueWithType(
          value,
          type,
          locale,
          currency,
          percentDigits
        );

        return str;
      };
    },
    [columnTypeByKey, locale, currency, percentDigits]
  );

  // CSV export (uses filtered + sorted data, not just current page)
  function exportToCsv() {
    if (!columns.length) return;

    const rows = sortedData; // already filtered & sorted

    let csv = "";

    // Header
    csv += columns.join(",") + "\n";

    // Rows
    rows.forEach(function (row) {
      const cells = columns.map(function (col) {
        const raw = row[col];
        if (raw === null || raw === undefined) return "";

        const type = columnTypeByKey[col] ?? "string";
        const formatted = formatValueWithType(
          raw,
          type,
          locale,
          currency,
          percentDigits
        );

        // Escape for CSV
        const safe = String(formatted).replace(/"/g, '""');
        if (/[",\n]/.test(safe)) {
          return `"${safe}"`;
        }
        return safe;
      });

      csv += cells.join(",") + "\n";
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="w-full sm:w-64">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Filter rows..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          {/* Export button */}
          <button
            type="button"
            onClick={exportToCsv}
            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            Export CSV
          </button>

          {/* Rows per page */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {rowsPerPageOptions.map(function (opt) {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>
              Page {safePage + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={safePage === 0}
                className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs disabled:opacity-40 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={safePage >= totalPages - 1}
                className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs disabled:opacity-40 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rowsMatrix}
        caption={caption}
        showRowIndex={showRowIndex}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={columns.length ? handleSort : undefined}
        formatCellFn={typedFormatCell}
      />

      {/* Footer summary */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Showing{" "}
        {totalRows === 0 ? 0 : safePage * rowsPerPage + 1} –{" "}
        {Math.min((safePage + 1) * rowsPerPage, totalRows)} of {totalRows} rows
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Type helpers                                                       */
/* ------------------------------------------------------------------ */

function formatValueWithType(
  value: CellValue,
  type: ColumnType,
  locale: string,
  currency: string,
  percentDigits: number
): string {
  if (value === null || value === undefined) return "";

  // Boolean
  if (type === "boolean" || typeof value === "boolean") {
    return value ? "True" : "False";
  }

  // Dates
  if (type === "date" || type === "datetime") {
    const d = new Date(value as any);
    if (isNaN(d.getTime())) return String(value);

    if (type === "date") {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(d);
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }

  // Numeric-ish
  if (
    type === "integer" ||
    type === "number" ||
    type === "currency" ||
    type === "percent"
  ) {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);

    if (type === "integer") {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(n);
    }

    if (type === "currency") {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(n);
    }

    if (type === "percent") {
      return new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: percentDigits,
      }).format(n); // assumes 0–1 range
    }

    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(n);
  }

  // Default string
  return String(value);
}

function inferColumnType(
  columnKey: string,
  values: CellValue[]
): ColumnType {
  const nonNull = values.filter(function (v) {
    return v !== null && v !== undefined;
  });
  if (nonNull.length === 0) return "string";

  const sample = nonNull.slice(0, 20);
  const lowerKey = columnKey.toLowerCase();

  // Booleans
  if (
    sample.every(function (v) {
      return typeof v === "boolean";
    })
  ) {
    return "boolean";
  }

  // Date-like strings
  const stringValues = sample.filter(function (v) {
    return typeof v === "string";
  }) as string[];
  if (stringValues.length > 0) {
    const dateLike = stringValues.filter(function (s) {
      return !Number.isNaN(Date.parse(s));
    });
    if (dateLike.length === stringValues.length) {
      const hasTime = stringValues.some(function (s) {
        return s.includes("T") || s.includes(":");
      });
      return hasTime ? "datetime" : "date";
    }
  }

  // Numeric / currency / percent
  const numericParsable = sample.every(function (v) {
    const n = Number(v as any);
    return !Number.isNaN(n);
  });

  if (numericParsable) {
    const nums = sample.map(function (v) {
      return Number(v as any);
    });

    const allInts = nums.every(function (n) {
      return Number.isInteger(n);
    });

    const inZeroOne = nums.every(function (n) {
      return n >= 0 && n <= 1;
    });

    const keyLooksPercent =
      lowerKey.includes("percent") ||
      lowerKey.includes("pct") ||
      lowerKey.includes("rate") ||
      lowerKey.includes("ratio");

    const keyLooksCurrency =
      lowerKey.includes("price") ||
      lowerKey.includes("amount") ||
      lowerKey.includes("cost") ||
      lowerKey.includes("revenue") ||
      lowerKey.includes("rev");

    if (keyLooksPercent || inZeroOne) return "percent";
    if (keyLooksCurrency) return "currency";
    if (allInts) return "integer";
    return "number";
  }

  return "string";
}
