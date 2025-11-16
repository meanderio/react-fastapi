// src/components/dataframe/DataFrameTable.tsx

import React, { useMemo, useState } from "react";
import { DataTable } from "./DataTable";
import type {
  CellValue,
  ColumnConfig,
  ColumnFilterState,
  ColumnType,
  SortDirection,
} from "./types";
import {
  formatValueWithType,
  inferColumnType,
  isRangeTypeFromType,
  passesDateRangeFilter,
  passesNumericRangeFilter,
} from "./utils";

interface DataFrameTableProps {
  data: Record<string, CellValue>[];
  caption?: string;
  showRowIndex?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
  /** Optional global column type overrides */
  columnTypes?: Partial<Record<string, ColumnType>>;
  /** Optional full columns config */
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
  const [rowsPerPage, setRowsPerPage] =
    useState<number>(defaultRowsPerPage);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [columnFilters, setColumnFilters] = useState<
    Record<string, ColumnFilterState>
  >({});

  const dataKeys = useMemo(
    function () {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]);
    },
    [data]
  );

  // Normalize columns config
  const columns = useMemo(
    function (): ColumnConfig[] {
      if (columnsProp && columnsProp.length > 0) {
        return columnsProp.map(function (c) {
          return {
            ...c,
            label: c.label ?? c.key,
            visible: c.visible !== false,
            sortable: c.sortable !== false,
          };
        });
      }

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

  // Infer types
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

  // Filter
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
        if (hasGlobal) {
          const matchesGlobal = columns.some(function (col) {
            if (col.visible === false) return false;
            const cell = row[col.key];
            if (cell === null || cell === undefined) return false;
            return String(cell).toLowerCase().includes(globalQuery);
          });

          if (!matchesGlobal) return false;
        }

        if (hasAnyColumnFilter) {
          for (const col of columns) {
            const state = columnFilters[col.key];
            if (!state) continue;

            const type = columnTypeByKey[col.key] ?? "string";
            const isRange = col.filter
              ? col.filter === "range"
              : isRangeTypeFromType(type);
            const cell = row[col.key];

            if (!isRange && state.text && state.text.trim() !== "") {
              if (cell === null || cell === undefined) return false;
              const cellStr = String(cell).toLowerCase();
              if (!cellStr.includes(state.text.toLowerCase())) {
                return false;
              }
            }

            if (isRange && (state.min || state.max)) {
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

        {/* Right controls */}
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
