"use client";

import { useLayoutEffect } from "react";

export function AuthErrorHandoffScrubber({ hasPathwayHandoff }: { hasPathwayHandoff: boolean }) {
  useLayoutEffect(() => {
    if (!hasPathwayHandoff) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("next");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [hasPathwayHandoff]);

  return null;
}
