import { NextResponse } from "next/server";

import {
  getStaticOccupationPathway,
  isPublicOccupationPathwayRpcRow,
  normalizePublicOccupationPathway,
} from "@/lib/i-want-to-become/occupations";
import { createClient } from "@/lib/supabase/server";

const cacheHeaders = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
};

function isSafeSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function fallbackResponse(slug: string) {
  const pathway = getStaticOccupationPathway(slug);
  if (!pathway) return NextResponse.json({ message: "That occupation is not in the public catalogue." }, { status: 404 });
  return NextResponse.json({ pathway, source: "fallback" }, { headers: cacheHeaders });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NextResponse.json({ message: "That occupation is not in the public catalogue." }, { status: 404 });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_occupation_pathway", { occupation_slug: slug });
    const row = Array.isArray(data) && data.length === 1 ? data[0] : null;
    if (!error && row && isPublicOccupationPathwayRpcRow(row)) {
      return NextResponse.json({ pathway: normalizePublicOccupationPathway(row), source: "live" }, { headers: cacheHeaders });
    }
    if (process.env.NODE_ENV !== "production" && error) console.warn("[pdbg] occupation pathway RPC unavailable; using static fallback", error);
    return fallbackResponse(slug);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[pdbg] occupation pathway request failed; using static fallback", error);
    return fallbackResponse(slug);
  }
}
