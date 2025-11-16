// src/components/dataframe/DataTable.tsx

import React, { useMemo } from "react";
import type {
  CellValue,
  ColumnConfig,
  ColumnFilterState,
  ColumnType,
  SortDirection,
} from "./types";

interface DataTableProps {
  columns: ColumnConfig[];               // full list (visible + hidden)
  rows: CellValue[][];                  // rows aligned with columns
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

  function getFilterMode(col: ColumnConfig): "text" | "range" | "none" {
    if (col.filter) return col.filter;
    const t = col.type ?? columnTypeByKey?.[col.key];
    if (
      t === "number" ||
      t === "integer" ||
      t === "currency" ||
      t === "percent" ||
      t === "date" ||
      t === "datetime"
    ) {
      return "range";
    }
    return "text";
  }

  function getAlignClass(col: ColumnConfig, isHeader: boolean): string {
    const numericLike =
      col.type === "number" ||
      col.type === "integer" ||
      col.type === "currency" ||
      col.type === "percent";

    const align =
      col.align ?? (numericLike ? "right" : "left");

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

  function defaultFormatCell(value: CellValue): React.ReactNode {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 dark:text-gray-600">—</span>;
    }
    if (typeof value === "boolean") return value ? "True" : "False";
    return String(value);
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

                // text filter
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
