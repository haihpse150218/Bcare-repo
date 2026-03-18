import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bcare.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/doctors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/clinics`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/specialties`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/api/posts?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      blogPages = (json.data ?? []).map(
        (post: { slug: string; updatedAt: string }) => ({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })
      );
    }
  } catch {
    // API unavailable — return static pages only
  }

  return [...staticPages, ...blogPages];
}
