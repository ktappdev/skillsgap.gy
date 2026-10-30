import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://skillsgap.gy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: ["/dashboard/", "/interviews/", "/matches/", "/admin/", "/company/", "/provider/", "/api/", "/auth/", "/login", "/signup"] },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
