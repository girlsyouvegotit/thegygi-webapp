import type { ChangeEvent, KeyboardEvent, Ref, WheelEvent } from "react";

/** Block minus / scientific notation keys in amount inputs. */
export function blockNegativeNumberKeys(
  e: KeyboardEvent<HTMLInputElement>,
): void {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
    e.preventDefault();
  }
}

/**
 * Coerce an amount field to a non-negative number (or empty while typing).
 * Use with react-hook-form Controller `field`.
 */
export function onNonNegativeAmountChange(
  raw: string,
  onChange: (value: number | string) => void,
): void {
  if (raw === "") {
    onChange("");
    return;
  }
  const n = Number(raw);
  if (Number.isNaN(n)) return;
  onChange(Math.max(0, n));
}

export function nonNegativeAmountInputProps(field: {
  value: unknown;
  onChange: (value: number | string) => void;
  onBlur: () => void;
  name: string;
  ref: Ref<HTMLInputElement>;
}) {
  return {
    type: "number" as const,
    min: 0,
    step: "0.01",
    inputMode: "decimal" as const,
    name: field.name,
    ref: field.ref,
    onBlur: field.onBlur,
    value:
      field.value === undefined || field.value === null || field.value === ""
        ? ""
        : String(field.value),
    onKeyDown: blockNegativeNumberKeys,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      onNonNegativeAmountChange(e.target.value, field.onChange);
    },
    onWheel: (e: WheelEvent<HTMLInputElement>) => {
      // Prevent scroll from accidentally changing amount
      e.currentTarget.blur();
    },
  };
}
