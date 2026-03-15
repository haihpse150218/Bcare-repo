"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
        <h2 className="text-2xl font-bold">Đã có lỗi xảy ra</h2>
        <p className="text-text-light max-w-md">
          Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc quay lại trang chủ.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Thử lại</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
