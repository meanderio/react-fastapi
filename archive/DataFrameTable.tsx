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

type ColumnFilterMode = "text" | "range" | "none";

interface ColumnConfig {
  /** Key in the row object, e.g. "price" */
  key: string;
  /** Header label; defaults to key */
  label?: string;
  /** Semantic type; if omitted, inferred from data */
  type?: ColumnType;
  /** Sortable? Defaults to true */
  sortable?: boolean;
  /** Filter mode: "text", "range" (numeric/date), or "none". Default derived from type */
  filter?: ColumnFilterMode;
  /** Alignment: left/center/right. Defaults: left; right for numeric-ish types */
  align?: "left" | "center" | "right";
  /** Visible? Defaults to true */
  visible?: boolean;
}

interface ColumnFilterState {
  text?: string; // for text filters
  min?: string;  // for range filters
  max?: string;  // for range filters
}

interface DataTableProps {
  columns: ColumnConfig[];
  rows: CellValue[][];
  caption?: string;
  showRowIndex?: boolean;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (columnKey: string) => void;
  formatCellFn?: (
    value: CellValue,
    columnKey: string,
    rowIndex: number
  ) => React.ReactNode;

  columnFilters?: Record<string, ColumnFilterState>;
  onColumnFilterChange?: (
    columnKey: string,
    patch: Partial<ColumnFilterState>
  ) => void;
  columnTypeByKey?: Record<string, ColumnType>;
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
    columnFilters,
    onColumnFilterChange,
    columnTypeByKey,
  } = props;

  const visibleColumns = useMemo(
    function () {
      return columns.filter(function (c) {
        return c.visible !== false;
      });
    },
    [columns]
  );

  const hasColumnFilters = Boolean(onColumnFilterChange);

  function renderSortIndicator(columnKey: string): React.ReactNode {
    if (!sortKey || sortKey !== columnKey) {
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

  function isRangeType(col: ColumnConfig): boolean {
    const t = col.type ?? columnTypeByKey?.[col.key];
    return (
      t === "number" ||
      t === "integer" ||
      t === "currency" ||
      t === "percent" ||
      t === "date" ||
      t === "datetime"
    );
  }

  function getFilterMode(col: ColumnConfig): ColumnFilterMode {
    if (col.filter) return col.filter;
    if (isRangeType(col)) return "range";
    return "text";
  }

  function getAlignClass(col: ColumnConfig, isHeader: boolean): string {
    const align =
      col.align ??
      ((
        col.type ?? columnTypeByKey?.[col.key]
      ) === "number" ||
      col.type === "integer" ||
      col.type === "currency" ||
      col.type === "percent"
        ? "right"
        : "left");

    const base =
      "px-3 " +
      (isHeader ? "py-2 border-b " : "py-2 border-b ") +
      "border-gray-200 dark:border-gray-700";

    if (align === "center") {
      return base + " text-center";
    }
    if (align === "right") {
      return base + " text-right";
    }
    return base + " text-left";
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
          {/* Header row */}
          <tr>
            {showRowIndex && (
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-right font-semibold text-gray-500 dark:text-gray-400 w-12">
                #
              </th>
            )}
            {visibleColumns.map(function (col) {
              const columnKey = col.key;
              const sortable = col.sortable !== false && Boolean(onSort);
              const headerClass =
                getAlignClass(col, true) +
                " font-semibold text-gray-700 dark:text-gray-200" +
                (sortable ? " cursor-pointer select-none" : "");

              return (
                <th
                  key={columnKey}
                  className={headerClass}
                  onClick={
                    sortable
                      ? function () {
                          if (onSort) onSort(columnKey);
                        }
                      : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col.label ?? col.key}
                    {sortable && renderSortIndicator(columnKey)}
                  </span>
                </th>
              );
            })}
          </tr>

          {/* Column filter row */}
          {hasColumnFilters && (
            <tr className="bg-gray-50 dark:bg-gray-800/90">
              {showRowIndex && (
                <th className="px-3 py-1 border-b border-gray-200 dark:border-gray-700" />
              )}
              {visibleColumns.map(function (col) {
                const columnKey = col.key;
                const filterState = columnFilters?.[columnKey] || {};
                const mode = getFilterMode(col);

                if (mode === "none") {
                  return (
                    <th
                      key={columnKey}
                      className="px-3 py-1 border-b border-gray-200 dark:border-gray-700"
                    />
                  );
                }

                if (mode === "range") {
                  return (
                    <th
                      key={columnKey}
                      className="px-3 py-1 border-b border-gray-200 dark:border-gray-700 align-top"
                    >
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={filterState.min ?? ""}
                          onChange={function (e) {
                            onColumnFilterChange?.(columnKey, {
                              min: e.target.value,
                            });
                          }}
                          placeholder="Min"
                          className="w-1/2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <input
                          type="text"
                          value={filterState.max ?? ""}
                          onChange={function (e) {
                            onColumnFilterChange?.(columnKey, {
                              max: e.target.value,
                            });
                          }}
                          placeholder="Max"
                          className="w-1/2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                      </div>
                    </th>
                  );
                }

                // text mode
                return (
                  <th
                    key={columnKey}
                    className="px-3 py-1 border-b border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="text"
                      value={filterState.text ?? ""}
                      onChange={function (e) {
                        onColumnFilterChange?.(columnKey, {
                          text: e.target.value,
                        });
                      }}
                      placeholder="Filter…"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </th>
                );
              })}
            </tr>
          )}
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length + (showRowIndex ? 1 : 0)}
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
                  {visibleColumns.map(function (col, visibleIndex) {
                    // rows matrix is ordered by full column list; find its total index
                    const colIndex = columns.findIndex(function (c) {
                      return c.key === col.key;
                    });
                    const value =
                      colIndex >= 0 ? row[colIndex] : undefined;
                    const content = formatCellFn
                      ? formatCellFn(value, col.key, rowIndex)
                      : defaultFormatCell(value);
                    const alignClass =
                      getAlignClass(col, false) +
                      " border-gray-100 dark:border-gray-700 whitespace-nowrap text-gray-700 dark:text-gray-200";

                    return (
                      <td key={col.key + visibleIndex} className={alignClass}>
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
/* Smart wrapper                                                       */
/* ------------------------------------------------------------------ */

interface DataFrameTableProps {
  data: Record<string, CellValue>[];
  caption?: string;
  showRowIndex?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
  /** Optional global column overrides; useful as default types */
  columnTypes?: Partial<Record<string, ColumnType>>;
  /** Fully configurable columns definition (label, type, filter, etc.) */
  columns?: ColumnConfig[];
  locale?: string;
  currency?: string;
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
    columns: columnsProp,
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

  const [columnFilters, setColumnFilters] = useState<
    Record<string, ColumnFilterState>
  >({});

  // Base keys from data if no explicit columns provided
  const dataKeys = useMemo(
    function () {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]);
    },
    [data]
  );

  // Normalize columns config: apply defaults, fill in from data if missing
  const columns = useMemo(
    function (): ColumnConfig[] {
      if (columnsProp && columnsProp.length > 0) {
        // ensure keys from config
        return columnsProp.map(function (c) {
          return {
            ...c,
            label: c.label ?? c.key,
            visible: c.visible !== false,
            sortable: c.sortable !== false,
          };
        });
      }

      // auto-generate from data keys
      return dataKeys.map(function (key) {
        return {
          key,
          label: key,
          visible: true,
          sortable: true,
        } as ColumnConfig;
      });
    },
    [columnsProp, dataKeys]
  );

  // Infer types, merged with config + columnTypes prop
  const columnTypeByKey = useMemo(
    function () {
      const result: Record<string, ColumnType> = {};

      columns.forEach(function (col) {
        const key = col.key;
        const values = data.map(function (row) {
          return row[key];
        });

        const inferred = inferColumnType(key, values);
        const globalOverride = columnTypes && columnTypes[key];
        const colOverride = col.type;

        result[key] = colOverride ?? globalOverride ?? inferred;
      });

      return result;
    },
    [columns, data, columnTypes]
  );

  // Filter: global + per-column (range/text)
  const filteredData = useMemo(
    function () {
      const hasGlobal = Boolean(searchQuery);
      const hasAnyColumnFilter = Object.values(columnFilters).some(
        function (f) {
          return Boolean(f.text) || Boolean(f.min) || Boolean(f.max);
        }
      );

      if (!hasGlobal && !hasAnyColumnFilter) {
        return data;
      }

      const globalQuery = searchQuery.toLowerCase();

      return data.filter(function (row) {
        // Global search: OR across all visible columns
        if (hasGlobal) {
          const matchesGlobal = columns.some(function (col) {
            if (col.visible === false) return false;
            const cell = row[col.key];
            if (cell === null || cell === undefined) return false;
            return String(cell).toLowerCase().includes(globalQuery);
          });

          if (!matchesGlobal) return false;
        }

        // Per-column filters: AND across all configured columns
        if (hasAnyColumnFilter) {
          for (const col of columns) {
            const state = columnFilters[col.key];
            if (!state) continue;

            const type = columnTypeByKey[col.key] ?? "string";
            const mode: ColumnFilterMode =
              col.filter ??
              (isRangeTypeFromType(type) ? "range" : "text");

            const cell = row[col.key];

            if (mode === "text" && state.text && state.text.trim() !== "") {
              if (cell === null || cell === undefined) return false;
              const cellStr = String(cell).toLowerCase();
              if (!cellStr.includes(state.text.toLowerCase())) {
                return false;
              }
            }

            if (mode === "range" && (state.min || state.max)) {
              if (
                type === "number" ||
                type === "integer" ||
                type === "currency" ||
                type === "percent"
              ) {
                if (!passesNumericRangeFilter(cell, state.min, state.max)) {
                  return false;
                }
              } else if (type === "date" || type === "datetime") {
                if (!passesDateRangeFilter(cell, state.min, state.max)) {
                  return false;
                }
              }
            }
          }
        }

        return true;
      });
    },
    [data, searchQuery, columnFilters, columns, columnTypeByKey]
  );

  // Sort
  const sortedData = useMemo(
    function () {
      if (!sortKey) return filteredData;

      const colConfig = columns.find(function (c) {
        return c.key === sortKey;
      });
      if (colConfig && colConfig.sortable === false) {
        return filteredData;
      }

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
    [filteredData, sortKey, sortDirection, columns]
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

  // Build rows matrix (in full column order)
  const rowsMatrix: CellValue[][] = useMemo(
    function () {
      if (!columns.length) return [];
      return pageData.map(function (row) {
        return columns.map(function (col) {
          return row[col.key];
        });
      });
    },
    [columns, pageData]
  );

  function handleSort(columnKey: string) {
    setCurrentPage(0);
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(columnKey);
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

  function handleColumnFilterChange(
    columnKey: string,
    patch: Partial<ColumnFilterState>
  ) {
    setColumnFilters(function (prev) {
      const existing = prev[columnKey] ?? {};
      return {
        ...prev,
        [columnKey]: { ...existing, ...patch },
      };
    });
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

  // Typed formatter
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

  // CSV export: filtered + sorted data, visible columns only
  function exportToCsv() {
    const visibleColumns = columns.filter(function (c) {
      return c.visible !== false;
    });
    if (!visibleColumns.length) return;

    const rows = sortedData;

    let csv = "";
    csv +=
      visibleColumns
        .map(function (c) {
          return c.label ?? c.key;
        })
        .join(",") + "\n";

    rows.forEach(function (row) {
      const cells = visibleColumns.map(function (col) {
        const raw = row[col.key];
        if (raw === null || raw === undefined) return "";

        const type = columnTypeByKey[col.key] ?? "string";
        const formatted = formatValueWithType(
          raw,
          type,
          locale,
          currency,
          percentDigits
        );

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
        {/* Global search */}
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
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        columnTypeByKey={columnTypeByKey}
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
/* Filter helpers                                                      */
/* ------------------------------------------------------------------ */

function isRangeTypeFromType(type: ColumnType): boolean {
  return (
    type === "number" ||
    type === "integer" ||
    type === "currency" ||
    type === "percent" ||
    type === "date" ||
    type === "datetime"
  );
}

function passesNumericRangeFilter(
  cell: CellValue,
  minStr?: string,
  maxStr?: string
): boolean {
  if (cell === null || cell === undefined) return false;
  const n = Number(cell);
  if (Number.isNaN(n)) return false;

  if (minStr && minStr.trim() !== "") {
    const min = Number(minStr);
    if (!Number.isNaN(min) && n < min) return false;
  }

  if (maxStr && maxStr.trim() !== "") {
    const max = Number(maxStr);
    if (!Number.isNaN(max) && n > max) return false;
  }

  return true;
}

function passesDateRangeFilter(
  cell: CellValue,
  minStr?: string,
  maxStr?: string
): boolean {
  if (cell === null || cell === undefined) return false;
  const d = new Date(cell as any);
  if (isNaN(d.getTime())) return false;

  if (minStr && minStr.trim() !== "") {
    const min = new Date(minStr);
    if (!isNaN(min.getTime()) && d < min) return false;
  }

  if (maxStr && maxStr.trim() !== "") {
    const max = new Date(maxStr);
    if (!isNaN(max.getTime()) && d > max) return false;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/* Type helpers                                                        */
/* ------------------------------------------------------------------ */

function formatValueWithType(
  value: CellValue,
  type: ColumnType,
  locale: string,
  currency: string,
  percentDigits: number
): string {
  if (value === null || value === undefined) return "";

  if (type === "boolean" || typeof value === "boolean") {
    return value ? "True" : "False";
  }

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
      }).format(n);
    }

    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(n);
  }

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

  if (
    sample.every(function (v) {
      return typeof v === "boolean";
    })
  ) {
    return "boolean";
  }

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
