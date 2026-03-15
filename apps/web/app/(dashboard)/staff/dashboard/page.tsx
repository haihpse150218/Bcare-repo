"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Clock } from "lucide-react";

export default function StaffDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    api<any[]>("/api/appointments?limit=10", { token })
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (a) => a.date?.startsWith(today) && a.status !== "CANCELLED"
  );
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Xin chào, {user?.fullName}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <Calendar className="w-10 h-10 text-primary" />
            <div>
              <p className="text-2xl font-bold">{todayAppointments.length}</p>
              <p className="text-sm text-text-light">Lịch hẹn hôm nay</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <Clock className="w-10 h-10 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-text-light">Chờ xác nhận</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="w-10 h-10 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{appointments.length}</p>
              <p className="text-sm text-text-light">Tổng lịch hẹn</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <p className="text-text-light text-center py-4">Không có lịch hẹn hôm nay.</p>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((a) => (
                <AppointmentCard key={a.id} appointment={a} showActions={false} linkPrefix="/staff/appointments" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
