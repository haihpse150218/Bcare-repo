"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface PaymentButtonProps {
  appointmentId: string;
  amount: number;
}

export function PaymentButton({ appointmentId, amount }: PaymentButtonProps) {
  const { token } = useAuthStore();
  const [method, setMethod] = useState<"VNPAY" | "MOMO">("VNPAY");
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const result = await api<{ paymentUrl: string }>(`/api/payments/${appointmentId}/create`, {
        method: "POST",
        token,
        body: JSON.stringify({ method }),
      });
      window.location.href = result.paymentUrl;
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={method} onValueChange={(v) => setMethod(v as "VNPAY" | "MOMO")}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VNPAY">VNPay</SelectItem>
          <SelectItem value="MOMO">MoMo</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handlePay} disabled={loading}>
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? "Đang xử lý..." : `Thanh toán ${amount?.toLocaleString("vi-VN")}đ`}
      </Button>
    </div>
  );
}
