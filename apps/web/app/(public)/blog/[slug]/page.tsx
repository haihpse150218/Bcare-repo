"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<any>(`/api/posts/${slug}`);
        setPost(data);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    load();
  }, [slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-8 bg-gray-100 rounded w-2/3 mb-4 animate-pulse" /><div className="h-64 bg-gray-100 rounded animate-pulse" /></div>;
  if (!post) return <div className="max-w-3xl mx-auto px-4 py-8"><p>Bài viết không tồn tại.</p><Link href="/blog"><Button variant="outline" className="mt-4">Quay lại Blog</Button></Link></div>;

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/blog" className="text-sm text-primary hover:underline mb-4 inline-block">← Quay lại Blog</Link>
      {post.thumbnailUrl && <img src={post.thumbnailUrl} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-6" />}
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
        <span>{post.author?.fullName}</span>
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
        {post.category && <Badge variant="outline">{post.category.name}</Badge>}
      </div>
      {post.tags?.length > 0 && (
        <div className="flex gap-1 mb-6">{post.tags.map((t: any) => <Badge key={t.tag.slug} variant="secondary">{t.tag.name}</Badge>)}</div>
      )}
      <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap">{post.content}</div>
    </article>
  );
}
