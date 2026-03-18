import type { Metadata } from "next";
import BlogPostContent from "./blog-post-content";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/api/posts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const post = json.data;
    return {
      title: post.title,
      description: post.metaDescription || post.content?.slice(0, 160),
      openGraph: {
        title: post.title,
        description: post.metaDescription || post.content?.slice(0, 160),
        type: "article",
        publishedTime: post.createdAt,
        modifiedTime: post.updatedAt,
        images:
          post.metaImage || post.thumbnailUrl
            ? [{ url: post.metaImage || post.thumbnailUrl }]
            : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostContent slug={slug} />;
}
