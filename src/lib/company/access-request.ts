export function normalizeCompanyWebsite(value: string) {
  const normalized = value.trim();
  if (!normalized) return { ok: true as const, value: null };
  if (normalized.length > 2048) return { ok: false as const };

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false as const };
    return { ok: true as const, value: url.toString() };
  } catch {
    return { ok: false as const };
  }
}

export function isCompanyDescription(value: string) {
  return value.length <= 2000;
}
