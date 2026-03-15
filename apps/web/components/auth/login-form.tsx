"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ user: any; token: string; refreshToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.user, data.token, data.refreshToken);
      toast.success("Đăng nhập thành công!");

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        PATIENT: "/patient/dashboard",
        DOCTOR: "/doctor/dashboard",
        CLINIC: "/clinic/dashboard",
        STAFF: "/staff/dashboard",
        ADMIN: "/admin/dashboard",
      };
      router.push(redirectMap[data.user.role] || "/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Đăng nhập BCare</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-text-light">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Đăng ký
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
