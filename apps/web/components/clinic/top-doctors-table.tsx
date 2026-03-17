"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopDoctorsTableProps {
  doctors: { name: string; appointments: number; revenue: number }[];
}

export function TopDoctorsTable({ doctors }: TopDoctorsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top bác sĩ</CardTitle>
      </CardHeader>
      <CardContent>
        {doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Bác sĩ</th>
                <th className="text-right py-2">Lịch hẹn</th>
                <th className="text-right py-2">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{doc.name}</td>
                  <td className="text-right py-2">{doc.appointments}</td>
                  <td className="text-right py-2">{doc.revenue.toLocaleString("vi-VN")}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
