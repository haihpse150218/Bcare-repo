"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    api<any>("/api/notifications", { token })
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function markAsRead(id: string) {
    if (!token) return;
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH", token });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function markAllAsRead() {
    if (!token) return;
    try {
      await api("/api/notifications/read-all", { method: "PATCH", token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          Đọc tất cả
        </Button>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-text-light mx-auto mb-3" />
          <p className="text-text-light">Không có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50 border-primary/20" : ""}`}
              onClick={() => !n.isRead && markAsRead(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`font-medium ${!n.isRead ? "text-primary" : ""}`}>{n.title}</h3>
                    <p className="text-sm text-text-light mt-1">{n.content}</p>
                    <p className="text-xs text-text-light mt-2">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <Badge variant="default" className="shrink-0">Mới</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
