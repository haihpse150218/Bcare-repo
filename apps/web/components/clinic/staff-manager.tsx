"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function StaffManager() {
  const { token } = useAuthStore();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    try {
      const data = await api<any[]>("/api/clinics/my/staff", { token: token! });
      setStaffList(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !position.trim()) return;
    setAdding(true);
    try {
      await api("/api/clinics/my/staff", {
        method: "POST", token: token!,
        body: JSON.stringify({ email: email.trim(), position: position.trim(), permissions: [] }),
      });
      toast.success("Thêm nhân viên thành công");
      setEmail(""); setPosition("");
      loadStaff();
    } catch (err: any) { toast.error(err.message); } finally { setAdding(false); }
  }

  async function removeStaff(staffId: string) {
    if (!confirm("Xác nhận xóa nhân viên?")) return;
    try {
      await api(`/api/clinics/my/staff/${staffId}`, { method: "DELETE", token: token! });
      toast.success("Đã xóa nhân viên");
      loadStaff();
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý nhân viên</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addStaff} className="space-y-2">
          <div className="flex gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email nhân viên" type="email" />
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Chức vụ" />
            <Button type="submit" disabled={adding}>{adding ? "Đang thêm..." : "Thêm"}</Button>
          </div>
        </form>

        {loading ? (
          <div className="animate-pulse space-y-2">{[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}</div>
        ) : staffList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có nhân viên nào</p>
        ) : (
          <div className="space-y-2">
            {staffList.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{s.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{s.user.email} · {s.position}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeStaff(s.id)}>Xóa</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
