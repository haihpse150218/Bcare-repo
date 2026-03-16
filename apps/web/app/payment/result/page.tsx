"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const ref = searchParams.get("ref");
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isSuccess ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle>{isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {isSuccess
              ? "Giao dịch đã được xử lý thành công."
              : "Giao dịch không thành công. Vui lòng thử lại."}
          </p>
          {ref && <p className="text-sm text-gray-400">Mã giao dịch: {ref}</p>}
          <div className="flex gap-3 justify-center">
            <Link href="/patient/dashboard">
              <Button variant={isSuccess ? "default" : "outline"}>Về trang chủ</Button>
            </Link>
            {!isSuccess && (
              <Link href="/patient/appointments">
                <Button>Thử lại</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
