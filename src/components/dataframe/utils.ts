// src/components/dataframe/utils.ts

import type { CellValue, ColumnType } from "./types";

export function isRangeTypeFromType(type: ColumnType): boolean {
  return (
    type === "number" ||
    type === "integer" ||
    type === "currency" ||
    type === "percent" ||
    type === "date" ||
    type === "datetime"
  );
}

export function passesNumericRangeFilter(
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

export function passesDateRangeFilter(
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

export function formatValueWithType(
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

export function inferColumnType(
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
