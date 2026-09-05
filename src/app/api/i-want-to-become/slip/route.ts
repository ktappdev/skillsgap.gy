import { NextResponse } from "next/server";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 8 * 1024 * 1024;
const rateWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 5;
const requestsByIp = new Map<string, number[]>();

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")?.trim()
    ?? "unknown";
}

function isRateLimited(request: Request, now = Date.now()) {
  const ip = clientIp(request);
  const recent = (requestsByIp.get(ip) ?? []).filter((timestamp) => timestamp > now - rateWindowMs);
  if (recent.length >= maxRequestsPerWindow) {
    requestsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

type ExtractedResult = { subject: string; grade: string; confidence?: number };

function isResult(value: unknown): value is ExtractedResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.subject === "string" && result.subject.trim().length > 0 && result.subject.length <= 120
    && typeof result.grade === "string" && result.grade.trim().length > 0 && result.grade.length <= 20
    && (result.confidence === undefined || (typeof result.confidence === "number" && result.confidence >= 0 && result.confidence <= 1));
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes + 32 * 1024) {
    return NextResponse.json({ message: "Use an image smaller than 8 MB." }, { status: 400 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ message: "Please wait a few minutes before trying another image." }, { status: 429 });
  }

  const processorUrl = process.env.CSEC_SLIP_PROCESSOR_URL?.trim();
  const processorSecret = process.env.CSEC_SLIP_PROCESSOR_SECRET;
  if (!processorUrl || !processorSecret) {
    return NextResponse.json({ message: "Automatic slip reading is not available." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Choose an image to continue." }, { status: 400 });
  }
  const slip = formData.get("slip");
  if (!(slip instanceof File) || !acceptedTypes.has(slip.type) || slip.size === 0 || slip.size > maxBytes) {
    return NextResponse.json({ message: "Use a JPEG, PNG, or WebP image smaller than 8 MB." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(new URL("/public/csec-result-slip", processorUrl), {
      method: "POST",
      headers: { "X-CSEC-Slip-Secret": processorSecret, "Content-Type": slip.type },
      body: slip,
      signal: controller.signal,
    });
    if (!upstream.ok) return NextResponse.json({ message: "Automatic slip reading is unavailable." }, { status: 503 });
    const payload: unknown = await upstream.json();
    const values = payload && typeof payload === "object" && Array.isArray((payload as { results?: unknown }).results)
      ? (payload as { results: unknown[] }).results.filter(isResult).slice(0, 30)
      : [];
    return NextResponse.json({ results: values });
  } catch {
    return NextResponse.json({ message: "Automatic slip reading is unavailable." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
