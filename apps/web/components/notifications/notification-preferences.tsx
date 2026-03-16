"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { Bell, Mail, Smartphone } from "lucide-react";

interface Prefs {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export function NotificationPreferences() {
  const { token } = useAuthStore();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<Prefs>("/api/notifications/preferences", { token: token! })
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function toggle(key: keyof Prefs) {
    if (!prefs || !token) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await api("/api/notifications/preferences", {
        method: "PUT",
        token: token!,
        body: JSON.stringify({ [key]: updated[key] }),
      });
      toast.success("Đã cập nhật");
    } catch {
      setPrefs(prefs);
      toast.error("Cập nhật thất bại");
    }
  }

  if (loading) return <Skeleton className="h-48 rounded-lg" />;
  if (!prefs) return null;

  const channels = [
    { key: "inApp" as const, label: "Thông báo trong ứng dụng", icon: Bell },
    { key: "email" as const, label: "Email", icon: Mail },
    { key: "sms" as const, label: "SMS", icon: Smartphone },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt thông báo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-gray-500" />
              <Label>{label}</Label>
            </div>
            <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
