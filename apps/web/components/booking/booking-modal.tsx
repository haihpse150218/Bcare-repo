"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeSlotPicker } from "./time-slot-picker";
import { BookingConfirmation } from "./booking-confirmation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

interface BookingModalProps {
  doctorId: string;
  doctorName: string;
}

export function BookingModal({ doctorId, doctorName }: BookingModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState("");
  const [symptomNote, setSymptomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const { token } = useAuthStore();

  function reset() {
    setStep("select");
    setDate("");
    setSelectedSlot(null);
    setScheduleId("");
    setSymptomNote("");
    setAppointment(null);
  }

  function handleSlotSelect(time: string, sid: string) {
    setSelectedSlot(time);
    setScheduleId(sid);
  }

  async function handleBook() {
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt lịch");
      return;
    }
    setLoading(true);
    try {
      const result = await api<any>("/api/appointments", {
        method: "POST",
        token,
        body: JSON.stringify({
          doctorId,
          scheduleId,
          date,
          timeSlot: selectedSlot,
          symptomNote: symptomNote || undefined,
        }),
      });
      setAppointment(result);
      setStep("success");
      toast.success("Đặt lịch thành công!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger>
        <Button className="w-full bg-primary hover:bg-primary-600">
          <CalendarDays className="w-4 h-4 mr-2" />
          Đặt lịch khám
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "success" ? "Xác nhận" : `Đặt lịch với ${doctorName}`}
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chọn ngày</Label>
              <Input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Chọn giờ</Label>
              <TimeSlotPicker
                doctorId={doctorId}
                date={date}
                selectedSlot={selectedSlot}
                onSelect={handleSlotSelect}
              />
            </div>
            <div className="space-y-2">
              <Label>Triệu chứng (tùy chọn)</Label>
              <Input
                placeholder="Mô tả triệu chứng..."
                value={symptomNote}
                onChange={(e) => setSymptomNote(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary-600"
              disabled={!date || !selectedSlot || loading}
              onClick={handleBook}
            >
              {loading ? "Đang đặt..." : "Xác nhận đặt lịch"}
            </Button>
          </div>
        )}

        {step === "success" && appointment && (
          <BookingConfirmation
            appointment={appointment}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
