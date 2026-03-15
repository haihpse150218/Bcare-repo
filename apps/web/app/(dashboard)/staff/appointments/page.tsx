"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { AppointmentCard } from "@/components/appointments/appointment-card";
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

export default function StaffAppointmentsPage() {
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

  async function updateStatus(id: string, newStatus: string) {
    if (!token) return;
    try {
      await api(`/api/appointments/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      toast.success("Cập nhật thành công");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý lịch hẹn</h1>
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
            <div key={a.id}>
              <AppointmentCard appointment={a} showActions={false} linkPrefix="/staff/appointments" />
              {a.status === "PENDING" && (
                <div className="flex gap-2 mt-2 justify-end">
                  <Button size="sm" onClick={() => updateStatus(a.id, "CONFIRMED")}>Xác nhận</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(a.id, "CANCELLED")}>Từ chối</Button>
                </div>
              )}
              {a.status === "CONFIRMED" && (
                <div className="flex gap-2 mt-2 justify-end">
                  <Button size="sm" onClick={() => updateStatus(a.id, "COMPLETED")}>Hoàn thành</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
