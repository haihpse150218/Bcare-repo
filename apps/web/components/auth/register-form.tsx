"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function RegisterForm() {
  const [form, setForm] = useState({ email: "", phone: "", password: "", fullName: "", role: "PATIENT" });
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ user: any; token: string; refreshToken: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAuth(data.user, data.token, data.refreshToken);
      toast.success("Đăng ký thành công!");
      router.push("/patient/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Đăng ký BCare</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" placeholder="0901234567" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Bạn là</Label>
            <Select value={form.role} onValueChange={(v) => v && update("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PATIENT">Bệnh nhân</SelectItem>
                <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                <SelectItem value="CLINIC">Phòng khám</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-text-light">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
