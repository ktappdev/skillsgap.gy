import { createHash, randomBytes } from "node:crypto";

const recruiterInvitationTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function createRecruiterInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function isRecruiterInvitationToken(value: string) {
  return recruiterInvitationTokenPattern.test(value);
}

export function hashRecruiterInvitationToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeRecruiterEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isRecruiterEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
