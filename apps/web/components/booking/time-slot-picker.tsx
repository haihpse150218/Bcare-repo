"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Slot {
  time: string;
  available: boolean;
  scheduleId: string;
}

interface TimeSlotPickerProps {
  doctorId: string;
  date: string;
  selectedSlot: string | null;
  onSelect: (time: string, scheduleId: string) => void;
}

export function TimeSlotPicker({ doctorId, date, selectedSlot, onSelect }: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    api<Slot[]>(`/api/doctors/${doctorId}/slots?date=${date}`)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  if (!date) return <p className="text-sm text-text-light">Vui lòng chọn ngày trước.</p>;

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return <p className="text-sm text-text-light">Không có lịch khám trong ngày này.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => (
        <Button
          key={slot.time}
          variant={selectedSlot === slot.time ? "default" : "outline"}
          size="sm"
          disabled={!slot.available}
          className={!slot.available ? "opacity-50 line-through" : ""}
          onClick={() => onSelect(slot.time, slot.scheduleId)}
        >
          {slot.time}
        </Button>
      ))}
    </div>
  );
}
