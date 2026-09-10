import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, minDecimals: number = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value < 1 ? 4 : minDecimals,
    maximumFractionDigits: value < 1 ? 6 : minDecimals,
  });
}
