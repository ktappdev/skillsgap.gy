import { NextResponse } from "next/server";

import {
  buildPreview,
  claimPreview,
  getSkillPreviewAdmin,
  hashIp,
  parseProcessorPreview,
  readOrCreateVisitorId,
  skillPreviewCookieName,
  type SkillPreview,
  type SkillPreviewFinding,
} from "@/lib/i-want-to-become/skill-preview";

const unavailableMessage = "Skill preview is not available right now.";
const invalidTextMessage = "Describe your work in your own words to see matching skills.";
const processorTimeoutMs = 30_000;
const minimumTextLength = 10;
const maximumTextLength = 2000;
const visitorCookieMaxAgeSeconds = 60 * 60 * 24 * 365;

/**
 * Anonymous skill preview for the signup screen. The browser only ever talks to
 * this route: the processor URL, its shared secret, and the service-role client
 * stay on the server.
 */
export async function POST(request: Request) {
  const processorUrl = process.env.SKILL_PREVIEW_PROCESSOR_URL?.trim();
  const processorSecret = process.env.SKILL_PREVIEW_PROCESSOR_SECRET;
  if (!processorUrl || !processorSecret) {
    return NextResponse.json({ message: unavailableMessage }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: invalidTextMessage }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { text?: unknown }).text !== "string") {
    return NextResponse.json({ message: invalidTextMessage }, { status: 400 });
  }
  const text = (body as { text: string }).text.trim();
  const characterCount = [...text].length;
  if (characterCount < minimumTextLength || characterCount > maximumTextLength) {
    return NextResponse.json({ message: "Describe your work in 10 to 2000 characters." }, { status: 400 });
  }

  const admin = getSkillPreviewAdmin();
  if (!admin) return NextResponse.json({ message: unavailableMessage }, { status: 503 });

  // The quota is claimed before the model runs and there is no refund RPC, so a
  // preview that fails upstream still costs an attempt. For a first-time visitor
  // that cost is invisible: the cookie is only set on the success path, so the
  // burned id is never persisted and the next request starts clean, leaving the
  // global daily counter to absorb it. The burn genuinely bites a returning
  // visitor, who keeps the cookie and loses one of their five.
  const visitorId = readOrCreateVisitorId(request);
  const claim = await claimPreview(admin, visitorId, hashIp(request));
  if (claim.status === "unavailable") return NextResponse.json({ message: unavailableMessage }, { status: 503 });
  if (claim.status === "denied") return deniedResponse(claim.reason);

  const extracted = await readProcessorPreview(processorUrl, processorSecret, text);
  if (!extracted) return NextResponse.json({ message: unavailableMessage }, { status: 503 });

  let preview: SkillPreview;
  try {
    preview = await buildPreview(admin, [...new Set(extracted.findings.flatMap((finding) => finding.slugs))], extracted.unmappedTerms);
  } catch {
    return NextResponse.json({ message: unavailableMessage }, { status: 503 });
  }

  const response = NextResponse.json({ preview, remaining: claim.remaining, resetAt: claim.resetAt });
  response.cookies.set(skillPreviewCookieName, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: visitorCookieMaxAgeSeconds,
  });
  return response;
}

function deniedResponse(reason: "quota_exhausted" | "in_flight" | "global_cap_reached") {
  if (reason === "quota_exhausted") {
    return NextResponse.json(
      { message: "You've used your 5 free previews for today. Create a free account to keep going." },
      { status: 429 },
    );
  }
  if (reason === "in_flight") {
    // The lease is not released when a preview finishes, so this also covers the
    // cooldown immediately after a completed preview: the copy must read true for
    // both the in-flight and the just-finished cases.
    return NextResponse.json({ message: "Give it a minute and try again." }, { status: 429 });
  }
  return NextResponse.json(
    { message: "Previews are very popular right now. Try again a little later." },
    { status: 503 },
  );
}

async function readProcessorPreview(
  processorUrl: string,
  processorSecret: string,
  text: string,
): Promise<{ findings: SkillPreviewFinding[]; unmappedTerms: string[] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), processorTimeoutMs);
  try {
    const upstream = await fetch(new URL("/public/skill-preview", processorUrl), {
      method: "POST",
      headers: { "X-Skill-Preview-Secret": processorSecret, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!upstream.ok) return null;
    return parseProcessorPreview(await upstream.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
