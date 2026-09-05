import { NextResponse } from "next/server";

import {
  isPublicOccupationRpcRow,
  normalizePublicOccupation,
  occupationCatalog,
} from "@/lib/i-want-to-become/occupations";
import { createClient } from "@/lib/supabase/server";

const cacheHeaders = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
};

function fallbackResponse() {
  return NextResponse.json({ occupations: occupationCatalog }, { headers: cacheHeaders });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_occupations");
    const rows = Array.isArray(data) ? data.filter(isPublicOccupationRpcRow) : [];
    if (error || rows.length === 0 || rows.length !== data?.length) {
      if (process.env.NODE_ENV !== "production") console.warn("[pdbg] occupations/route.ts: using static catalogue fallback", error);
      return fallbackResponse();
    }
    return NextResponse.json({ occupations: rows.map(normalizePublicOccupation) }, { headers: cacheHeaders });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[pdbg] occupations/route.ts: catalogue RPC unavailable", error);
    return fallbackResponse();
  }
}
