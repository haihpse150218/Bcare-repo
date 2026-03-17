"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DoctorManager() {
  const { token } = useAuthStore();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadDoctors(); }, []);

  async function loadDoctors() {
    try {
      const data = await api<any[]>("/api/clinics/my/doctors", { token: token! });
      setDoctors(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  async function addDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      await api("/api/clinics/my/doctors", { method: "POST", token: token!, body: JSON.stringify({ email: email.trim() }) });
      toast.success("Thêm bác sĩ thành công");
      setEmail("");
      loadDoctors();
    } catch (err: any) { toast.error(err.message); } finally { setAdding(false); }
  }

  async function removeDoctor(doctorId: string) {
    if (!confirm("Xác nhận xóa bác sĩ khỏi phòng khám?")) return;
    try {
      await api(`/api/clinics/my/doctors/${doctorId}`, { method: "DELETE", token: token! });
      toast.success("Đã xóa bác sĩ");
      loadDoctors();
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý bác sĩ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addDoctor} className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email bác sĩ" type="email" />
          <Button type="submit" disabled={adding}>{adding ? "Đang thêm..." : "Thêm"}</Button>
        </form>

        {loading ? (
          <div className="animate-pulse space-y-2">{[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}</div>
        ) : doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có bác sĩ nào</p>
        ) : (
          <div className="space-y-2">
            {doctors.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{doc.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{doc.user.email} · {doc.specialty?.name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeDoctor(doc.id)}>Xóa</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
