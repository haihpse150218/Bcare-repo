"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { RevenueChart } from "./revenue-chart";

export default function AdminDashboardPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<any>("/api/admin/dashboard", { token: token! });
        setStats(data);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 bg-gray-100 rounded" /></div>;
  if (!stats) return <p className="text-muted-foreground">Không thể tải dữ liệu</p>;

  const cards = [
    { label: "Người dùng", value: stats.totalUsers },
    { label: "Bác sĩ", value: stats.totalDoctors },
    { label: "Phòng khám", value: stats.totalClinics },
    { label: "Lịch hẹn", value: stats.totalAppointments },
    { label: "Doanh thu", value: `${stats.totalRevenue.toLocaleString("vi-VN")}đ` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <RevenueChart />
      <div>
        <h2 className="text-lg font-semibold mb-3">Lịch hẹn gần đây</h2>
        <div className="space-y-2">
          {stats.recentAppointments.map((apt: any) => (
            <div key={apt.id} className="flex justify-between items-center p-3 border rounded-lg text-sm">
              <span>{apt.patient.fullName}</span>
              <span>{apt.doctor.user.fullName}</span>
              <span>{apt.status}</span>
              <span>{new Date(apt.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
