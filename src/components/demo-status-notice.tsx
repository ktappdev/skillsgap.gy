"use client";

import { useEffect, useRef } from "react";

export function DemoStatusNotice() {
  const noticeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const notice = noticeRef.current;
    if (!notice) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty("--demo-notice-height", `${notice.getBoundingClientRect().height}px`);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(notice);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--demo-notice-height");
    };
  }, []);

  return (
    <aside ref={noticeRef} aria-label="Site launch status" className="sticky top-0 z-30 bg-demo-surface px-4 py-2 text-center text-sm leading-5 text-foreground">
      <p><strong className="font-semibold">Demo mode</strong> — SkillsGap.gy has not officially launched.</p>
    </aside>
  );
}
