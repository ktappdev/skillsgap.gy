import type { Json } from "@/lib/supabase/database.types";

export function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function getTrimmedFormString(formData: FormData, name: string) {
  return getFormString(formData, name).trim();
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function getSafeRedirectPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  return value;
}

export function isJsonValue(value: unknown): value is Json {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    return (
      (prototype === Object.prototype || prototype === null) &&
      Object.values(value).every(isJsonValue)
    );
  }

  return false;
}

type JsonParseResult = { ok: true; value: Json } | { ok: false; error: string };

export function parseJsonValue(input: string): JsonParseResult {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    return { ok: true, value: {} };
  }

  try {
    const parsedValue: unknown = JSON.parse(normalizedInput);

    if (!isJsonValue(parsedValue)) {
      return { ok: false, error: "Data must be valid JSON." };
    }

    return { ok: true, value: parsedValue };
  } catch {
    return { ok: false, error: "Data must be valid JSON." };
  }
}
