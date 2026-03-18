"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiWithMeta } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => { loadPosts(); }, [page]);

  async function loadPosts() {
    setLoading(true);
    try {
      const result = await apiWithMeta<any[]>(`/api/posts?page=${page}&limit=${limit}`);
      setPosts(result.data);
      setTotal(result.meta?.total || 0);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog Sức khỏe</h1>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">Chưa có bài viết nào.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  {post.thumbnailUrl && (
                    <img src={post.thumbnailUrl} alt={post.title} className="w-full h-40 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="pt-4">
                    <p className="font-semibold mb-1">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{post.metaDescription?.slice(0, 100) || post.content.slice(0, 100)}...</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {post.author?.fullName} · {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
              <span className="text-sm self-center">Trang {page} / {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
