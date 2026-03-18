"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api, apiWithMeta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminBlogPage() {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", isPublished: false });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    try {
      const result = await apiWithMeta<any[]>("/api/posts?limit=50", { token: token! });
      setPosts(result.data);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) {
        await api(`/api/posts/${editId}`, { method: "PATCH", token: token!, body: JSON.stringify(form) });
        toast.success("Cập nhật bài viết thành công");
      } else {
        await api("/api/posts", { method: "POST", token: token!, body: JSON.stringify(form) });
        toast.success("Tạo bài viết thành công");
      }
      setShowForm(false); setEditId(null);
      setForm({ title: "", slug: "", content: "", isPublished: false });
      loadPosts();
    } catch (err: any) { toast.error(err.message); }
  }

  function startEdit(post: any) {
    setForm({ title: post.title, slug: post.slug, content: post.content, isPublished: post.isPublished });
    setEditId(post.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xóa bài viết?")) return;
    try {
      await api(`/api/posts/${id}`, { method: "DELETE", token: token! });
      toast.success("Đã xóa");
      loadPosts();
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý Blog</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: "", slug: "", content: "", isPublished: false }); }}>
          {showForm ? "Đóng" : "Tạo bài viết"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editId ? "Sửa bài viết" : "Bài viết mới"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Tiêu đề</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} className="mt-1" /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1" /></div>
              <div><Label>Nội dung</Label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1 w-full min-h-[200px] rounded-md border px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Xuất bản</label>
              <Button type="submit">{editId ? "Cập nhật" : "Tạo"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">Chưa có bài viết</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">{post.author?.fullName} · {new Date(post.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={post.isPublished ? "default" : "secondary"}>{post.isPublished ? "Published" : "Draft"}</Badge>
                <Button variant="outline" size="sm" onClick={() => startEdit(post)}>Sửa</Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)}>Xóa</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
