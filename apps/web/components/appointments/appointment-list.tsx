"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { AppointmentCard } from "./appointment-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUSES = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

interface AppointmentListProps {
  linkPrefix?: string;
  showStatusFilter?: boolean;
}

export function AppointmentList({ linkPrefix = "/patient/appointments", showStatusFilter = true }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = status ? `?status=${status}` : "";
    api<any[]>(`/api/appointments${params}`, { token })
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [token, status]);

  async function handleCancel(id: string) {
    if (!token) return;
    try {
      await api(`/api/appointments/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "CANCELLED" } : a));
      toast.success("Đã hủy lịch hẹn");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      {showStatusFilter && (
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUSES.map((s) => (
            <Button
              key={s.value}
              variant={status === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <p className="text-center text-text-light py-8">Không có lịch hẹn nào.</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onCancel={handleCancel}
              linkPrefix={linkPrefix}
            />
          ))}
        </div>
      )}
    </div>
  );
}
