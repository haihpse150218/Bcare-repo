"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const DAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: 1, startTime: "08:00", endTime: "17:00", slotDuration: 30 });
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    api<Schedule[]>("/api/my-schedules", { token })
      .then(setSchedules)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAdd() {
    if (!token) return;
    setAdding(true);
    try {
      const schedule = await api<Schedule>("/api/my-schedules", {
        method: "POST",
        token,
        body: JSON.stringify(newSchedule),
      });
      setSchedules((prev) => [...prev, schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
      toast.success("Đã thêm lịch");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await api(`/api/my-schedules/${id}`, { method: "DELETE", token });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast.success("Đã xóa lịch");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loading) return <Skeleton className="h-64 rounded-lg" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lịch làm việc hiện tại</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-text-light">Chưa có lịch làm việc.</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{DAYS[s.dayOfWeek]}</span>
                    <span className="text-text-light ml-3">{s.startTime} - {s.endTime}</span>
                    <span className="text-text-light ml-3">({s.slotDuration} phút/slot)</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thêm lịch mới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Ngày</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={newSchedule.dayOfWeek}
                onChange={(e) => setNewSchedule((p) => ({ ...p, dayOfWeek: parseInt(e.target.value) }))}
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Bắt đầu</Label>
              <Input type="time" value={newSchedule.startTime} onChange={(e) => setNewSchedule((p) => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Kết thúc</Label>
              <Input type="time" value={newSchedule.endTime} onChange={(e) => setNewSchedule((p) => ({ ...p, endTime: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Slot (phút)</Label>
              <Input type="number" value={newSchedule.slotDuration} onChange={(e) => setNewSchedule((p) => ({ ...p, slotDuration: parseInt(e.target.value) || 30 }))} />
            </div>
          </div>
          <Button className="mt-4 bg-primary hover:bg-primary-600" onClick={handleAdd} disabled={adding}>
            <Plus className="w-4 h-4 mr-2" />
            {adding ? "Đang thêm..." : "Thêm lịch"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
