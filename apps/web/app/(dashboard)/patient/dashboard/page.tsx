"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search } from "lucide-react";
import Link from "next/link";

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    api<any[]>("/api/appointments?limit=5", { token })
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Xin chào, {user?.fullName}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/doctors">
          <Card className="shadow-card hover:shadow-hover transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Search className="w-10 h-10 text-primary" />
              <div>
                <h3 className="font-semibold">Tìm bác sĩ</h3>
                <p className="text-sm text-text-light">Đặt lịch khám mới</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/appointments">
          <Card className="shadow-card hover:shadow-hover transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="w-10 h-10 text-primary" />
              <div>
                <h3 className="font-semibold">Lịch hẹn</h3>
                <p className="text-sm text-text-light">Xem tất cả lịch hẹn</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-text-light text-center py-4">Chưa có lịch hẹn nào.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((a) => (
                <AppointmentCard key={a.id} appointment={a} showActions={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
