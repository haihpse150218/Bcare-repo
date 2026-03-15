"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const DAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

interface DoctorScheduleProps {
  doctorId: string;
}

function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (current + duration <= endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += duration;
  }
  return slots;
}

export function DoctorSchedule({ doctorId }: DoctorScheduleProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Schedule[]>(`/api/doctors/${doctorId}/schedules`)
      .then((data) => {
        setSchedules(data);
        if (data.length > 0) setSelectedDay(data[0].dayOfWeek);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return null;
  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-text-light">
          Bác sĩ chưa có lịch khám.
        </CardContent>
      </Card>
    );
  }

  const currentSchedule = schedules.find((s) => s.dayOfWeek === selectedDay);
  const slots = currentSchedule ? generateSlots(currentSchedule.startTime, currentSchedule.endTime, currentSchedule.slotDuration) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch khám</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {schedules.map((s) => (
            <Button
              key={s.dayOfWeek}
              variant={selectedDay === s.dayOfWeek ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(s.dayOfWeek)}
            >
              {DAYS[s.dayOfWeek]}
            </Button>
          ))}
        </div>
        {currentSchedule && (
          <div>
            <p className="text-sm text-text-light mb-3">
              {currentSchedule.startTime} - {currentSchedule.endTime}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slots.map((slot) => (
                <Button key={slot} variant="outline" size="sm" className="text-xs">
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
