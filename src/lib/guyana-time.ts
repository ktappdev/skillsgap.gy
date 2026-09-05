const GUYANA_TIME_ZONE = "America/Guyana";
const GUYANA_UTC_OFFSET = "-04:00";

const guyanaDateTimePattern = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/;

/**
 * Converts the value from a datetime-local field into the intended Guyana
 * instant. Browser and deployment-server time zones must not change a fair.
 */
export function parseGuyanaDateTime(value: string): Date | null {
  const match = guyanaDateTimePattern.exec(value);
  if (!match) return null;

  const [year, month, day] = match[1].split("-").map(Number);
  const [hour, minute] = match[2].split(":").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
    || hour > 23
    || minute > 59
  ) return null;

  const date = new Date(`${match[1]}T${match[2]}:00${GUYANA_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatGuyanaDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: GUYANA_TIME_ZONE,
  }).format(new Date(value));
}

export function formatGuyanaTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: GUYANA_TIME_ZONE,
  }).format(new Date(value));
}

export function formatGuyanaDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GY", {
    dateStyle: "medium",
    timeZone: GUYANA_TIME_ZONE,
  }).format(new Date(value));
}
