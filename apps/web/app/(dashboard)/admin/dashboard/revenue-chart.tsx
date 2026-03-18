"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface RevenueData {
  labels: string[];
  revenue: number[];
  transactions: number[];
  totalRevenue: number;
  totalTransactions: number;
}

export function RevenueChart() {
  const { token } = useAuthStore();
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<RevenueData>(`/api/admin/reports?period=${period}`, { token: token! })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period, token]);

  const chartData =
    data?.labels.map((label, i) => ({
      name: label,
      revenue: data.revenue[i],
      transactions: data.transactions[i],
    })) ?? [];

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Doanh thu</h3>
          {data && (
            <p className="text-2xl font-bold text-primary">
              {formatVND(data.totalRevenue)}
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-sm ${
                period === p
                  ? "bg-primary text-white"
                  : "hover:bg-neutral-100"
              }`}
            >
              {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] animate-pulse rounded bg-neutral-100" />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis
              fontSize={12}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(0)}M`
                  : `${(v / 1_000).toFixed(0)}K`
              }
            />
            <Tooltip
              formatter={(value, name) => [
                name === "revenue" ? formatVND(Number(value)) : value,
                name === "revenue" ? "Doanh thu" : "Giao dịch",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "revenue" ? "Doanh thu" : "Giao dịch"
              }
            />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
