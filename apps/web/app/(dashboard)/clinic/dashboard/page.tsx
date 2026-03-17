"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { StatsCards } from "@/components/clinic/stats-cards";
import { TopDoctorsTable } from "@/components/clinic/top-doctors-table";

export default function ClinicDashboardPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<any>("/api/clinics/my/stats", { token: token! });
        setStats(data);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 bg-gray-100 rounded" /><div className="h-64 bg-gray-100 rounded" /></div>;

  if (!stats) return <p className="text-muted-foreground">Không thể tải dữ liệu</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan phòng khám</h1>
      <StatsCards stats={stats} />
      <TopDoctorsTable doctors={stats.topDoctors} />
    </div>
  );
}
