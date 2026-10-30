import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://skillsgap.gy";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/faq", "/opportunities", "/training", "/i-want-to-become"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
