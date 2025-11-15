import React from "react";

type CellValue = string | number | boolean | null | undefined;

interface DataTableProps {
  columns: string[];
  rows: CellValue[][];
  caption?: string;
  showRowIndex?: boolean;
}

export function DataTable(props: DataTableProps) {
  const { columns, rows, caption, showRowIndex = false } = props;

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
              return (
                <th
                  key={col}
                  className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-200"
                >
                  {col}
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
  if (value === null || value === undefined)
    return <span className="text-gray-400 dark:text-gray-600">—</span>;
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Helper: table from array of records                                */
/* ------------------------------------------------------------------ */

interface RecordTableProps {
  data: Record<string, CellValue>[];
  caption?: string;
  showRowIndex?: boolean;
}

export function RecordTable(props: RecordTableProps) {
  const { data, caption, showRowIndex } = props;

  if (!data || data.length === 0) {
    return (
      <DataTable
        columns={[]}
        rows={[]}
        caption={caption}
        showRowIndex={showRowIndex}
      />
    );
  }

  const columns = Object.keys(data[0]);
  const rows: CellValue[][] = data.map(function (row) {
    return columns.map(function (col) {
      return row[col];
    });
  });

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption={caption}
      showRowIndex={showRowIndex}
    />
  );
}

export default function DataFrameTable(props: RecordTableProps) {
  return RecordTable(props);
}
