import { NextResponse } from "next/server";

import {
  getStaticCareerCatalogue,
  parsePublicCareerCatalogue,
} from "@/lib/i-want-to-become/occupations";
import { createClient } from "@/lib/supabase/server";

const cacheHeaders = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
};

function fallbackResponse() {
  return NextResponse.json(getStaticCareerCatalogue(), { headers: cacheHeaders });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const [occupationsResult, interestsResult] = await Promise.all([
      supabase.rpc("get_public_occupations"),
      supabase.rpc("get_public_career_interests"),
    ]);
    const catalogue = parsePublicCareerCatalogue({
      occupations: occupationsResult.data,
      interests: interestsResult.data,
    });
    if (occupationsResult.error || interestsResult.error || !catalogue || catalogue.occupations.length === 0) {
      if (process.env.NODE_ENV !== "production") console.warn("[pdbg] occupations/route.ts: using static catalogue fallback", occupationsResult.error ?? interestsResult.error);
      return fallbackResponse();
    }
    return NextResponse.json(catalogue, { headers: cacheHeaders });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[pdbg] occupations/route.ts: catalogue RPC unavailable", error);
    return fallbackResponse();
  }
}
