import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function assert<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message);
  return value;
}

export function safeJson<T>(value: unknown, fallback: T): T {
  try {
    if (typeof value === "string") return JSON.parse(value) as T;
    if (value && typeof value === "object") return value as T;
  } catch {
    // fall through
  }
  return fallback;
}
