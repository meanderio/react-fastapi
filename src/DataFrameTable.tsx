import React, { useMemo, useState } from "react";

type CellValue = string | number | boolean | null | undefined;

type SortDirection = "asc" | "desc";

interface DataTableProps {
  columns: string[];
  rows: CellValue[][];
  caption?: string;
  showRowIndex?: boolean;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (column: string) => void;
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
                  onClick={sortable ? function () {
                    if (onSort) onSort(col);
                  } : undefined}
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
                    return (
                      <td
                        key={col + colIndex}
                        className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap text-gray-700 dark:text-gray-200"
                      >
                        {formatCell(value)}
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

function formatCell(value: CellValue): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 dark:text-gray-600">—</span>;
  }
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Smart wrapper: search, sort, pagination over record data           */
/* ------------------------------------------------------------------ */

interface DataFrameTableProps {
  /** Array of objects, e.g. from `df.to_dict(orient="records")` */
  data: Record<string, CellValue>[];
  caption?: string;
  showRowIndex?: boolean;
  /** Rows-per-page options shown in the select */
  rowsPerPageOptions?: number[];
  /** Default rows per page */
  defaultRowsPerPage?: number;
  /** Initial sort column key */
  initialSortKey?: string;
  /** Initial sort direction */
  initialSortDirection?: SortDirection;
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

        // Handle nullish first
        const aNull = va === null || va === undefined;
        const bNull = vb === null || vb === undefined;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;

        // Try numeric compare if both look like numbers
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

        {/* Rows per page + pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
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
      />

      {/* Footer summary */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Showing{" "}
        {totalRows === 0
          ? 0
          : safePage * rowsPerPage + 1}{" "}
        –{" "}
        {Math.min(
          (safePage + 1) * rowsPerPage,
          totalRows
        )}{" "}
        of {totalRows} rows
      </div>
    </div>
  );
}
