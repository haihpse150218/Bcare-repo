"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Đang chờ", variant: "secondary" },
  PAID: { label: "Đã thanh toán", variant: "default" },
  FAILED: { label: "Thất bại", variant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "outline" },
  EXPIRED: { label: "Hết hạn", variant: "secondary" },
};

export function PaymentHistory() {
  const { token } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<any[]>("/api/payments/history", { token: token! })
      .then(setPayments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton className="h-48 rounded-lg" />;

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">Chưa có giao dịch nào.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const status = STATUS_MAP[p.status] || { label: p.status, variant: "secondary" as const };
        return (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.appointment?.doctor?.user?.fullName || "Bác sĩ"}</p>
                <p className="text-sm text-gray-500">
                  {new Date(p.appointment?.date).toLocaleDateString("vi-VN")} · {p.appointment?.timeSlot}
                </p>
                <p className="text-sm text-gray-500">{p.method}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{p.amount?.toLocaleString("vi-VN")}đ</p>
                <Badge variant={status.variant}>{status.label}</Badge>
                {p.refundAmount && (
                  <p className="text-xs text-gray-500 mt-1">Hoàn: {p.refundAmount.toLocaleString("vi-VN")}đ</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
