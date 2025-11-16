// src/components/dataframe/types.ts

export type CellValue = string | number | boolean | null | undefined;
export type SortDirection = "asc" | "desc";

export type ColumnType =
  | "string"
  | "number"
  | "integer"
  | "currency"
  | "percent"
  | "date"
  | "datetime"
  | "boolean";

export type ColumnFilterMode = "text" | "range" | "none";

export interface ColumnConfig {
  /** Key in the row object, e.g. "price" */
  key: string;
  /** Header label; defaults to key */
  label?: string;
  /** Semantic type; if omitted, inferred from data */
  type?: ColumnType;
  /** Sortable? Defaults to true */
  sortable?: boolean;
  /** Filter mode: "text", "range", or "none". Default derived from type */
  filter?: ColumnFilterMode;
  /** Alignment: left/center/right. Defaults: left; right for numeric-ish types */
  align?: "left" | "center" | "right";
  /** Visible? Defaults to true */
  visible?: boolean;
}

export interface ColumnFilterState {
  text?: string; // for text filters
  min?: string;  // for range filters
  max?: string;  // for range filters
}
