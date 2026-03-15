"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-xl font-bold">Đã có lỗi xảy ra</h2>
        <p className="text-text-light">Vui lòng thử lại.</p>
        <Button onClick={reset}>Thử lại</Button>
      </div>
    </div>
  );
}
