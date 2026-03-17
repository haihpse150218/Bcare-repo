"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function ExportForm() {
  const { token } = useAuthStore();
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`${API_URL}/api/clinics/my/stats/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report.${format === "csv" ? "csv" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất báo cáo thành công");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xuất báo cáo");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xuất báo cáo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Từ ngày</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Đến ngày</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Định dạng</Label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "pdf")}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF (Text)</option>
          </select>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? "Đang xuất..." : "Tải báo cáo"}
        </Button>
      </CardContent>
    </Card>
  );
}
