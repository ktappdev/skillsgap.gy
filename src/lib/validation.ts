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

  // Reject browser normalization and nested authentication destinations.
  const pathname = value.split(/[?#]/, 1)[0];
  if (/[\s%]/.test(pathname) || [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || pathname.split("/").some((segment) => segment === "." || segment === "..")) {
    return fallback;
  }

  const url = new URL(value, "https://redirect.invalid");
  if ([...url.searchParams.keys()].some((key) => /^(next|redirect|redirect_to|returnTo|returnUrl|callbackUrl|code|token_hash|state|error_description)$/i.test(key))) {
    return fallback;
  }

  return value;
}

/** Password recovery has one intentional nesting level for its final destination. */
export function getSafeAuthCallbackPath(value: string | null | undefined) {
  if (!value?.startsWith("/update-password?")) return getSafeRedirectPath(value, "");
  const url = new URL(value, "https://redirect.invalid");
  if (url.hash || [...url.searchParams.keys()].length !== 1 || !url.searchParams.has("next")) return "";
  const next = getSafeRedirectPath(url.searchParams.get("next"), "");
  return next ? `/update-password?next=${encodeURIComponent(next)}` : "";
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
