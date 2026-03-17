"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ClinicProfilePage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", district: "", city: "", phone: "", description: "" });

  useEffect(() => {
    async function load() {
      try {
        const clinic = await api<any>("/api/clinics/my", { token: token! });
        setForm({ name: clinic.name, address: clinic.address, district: clinic.district, city: clinic.city, phone: clinic.phone, description: clinic.description || "" });
      } catch { /* empty */ } finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/clinics/my", { method: "PUT", token: token!, body: JSON.stringify(form) });
      toast.success("Cập nhật thông tin thành công");
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  }

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hồ sơ phòng khám</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Tên phòng khám</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Địa chỉ</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quận/Huyện</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1" /></div>
              <div><Label>Thành phố</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Số điện thoại</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Cập nhật"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
