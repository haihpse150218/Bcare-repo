"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminSpecialtiesPage() {
  const { token } = useAuthStore();
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await api<any[]>("/api/admin/specialties", { token: token! });
      setSpecialties(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    try {
      await api("/api/admin/specialties", { method: "POST", token: token!, body: JSON.stringify({ name, slug }) });
      toast.success("Thêm chuyên khoa thành công");
      setName(""); setSlug("");
      load();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xác nhận xóa?")) return;
    try {
      await api(`/api/admin/specialties/${id}`, { method: "DELETE", token: token! });
      toast.success("Đã xóa");
      load();
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý chuyên khoa</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} placeholder="Tên chuyên khoa" />
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" />
        <Button type="submit">Thêm</Button>
      </form>
      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {specialties.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-muted-foreground">/{s.slug} · {s._count?.doctors || 0} bác sĩ</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)}>Xóa</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
