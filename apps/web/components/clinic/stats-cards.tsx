"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    totalAppointments: number;
    totalRevenue: number;
    totalDoctors: number;
    totalPatients: number;
    completionRate: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: "Tổng lịch hẹn", value: stats.totalAppointments.toLocaleString("vi-VN") },
    { label: "Doanh thu", value: `${stats.totalRevenue.toLocaleString("vi-VN")}đ` },
    { label: "Bác sĩ", value: stats.totalDoctors.toString() },
    { label: "Bệnh nhân", value: stats.totalPatients.toString() },
    { label: "Tỉ lệ hoàn thành", value: `${stats.completionRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
