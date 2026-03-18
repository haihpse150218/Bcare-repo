import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcare.vn";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/patient/", "/doctor/", "/clinic/", "/staff/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
