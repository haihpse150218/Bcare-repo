"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatVND } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, Stethoscope } from "lucide-react";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewDisplay } from "@/components/reviews/review-display";
import { PaymentButton } from "@/components/payments/payment-button";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xác nhận", variant: "outline" },
  CONFIRMED: { label: "Đã xác nhận", variant: "default" },
  IN_PROGRESS: { label: "Đang khám", variant: "secondary" },
  COMPLETED: { label: "Hoàn thành", variant: "secondary" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [appointment, setAppointment] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    async function fetchData() {
      try {
        const appt = await api<any>(`/api/appointments/${id}`, { token: token! });
        setAppointment(appt);
        if (appt.status === "COMPLETED") {
          try {
            const reviews = await api<any[]>("/api/reviews/my", { token: token! });
            const existing = reviews.find((r: any) => r.appointmentId === id);
            if (existing) setReview(existing);
          } catch {}
        }
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [id, token]);

  async function handleCancel() {
    if (!token) return;
    try {
      await api(`/api/appointments/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setAppointment((prev: any) => ({ ...prev, status: "CANCELLED" }));
      toast.success("Đã hủy lịch hẹn");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 rounded-lg" />;
  }

  if (!appointment) {
    return <p className="text-text-light text-center py-8">Không tìm thấy lịch hẹn.</p>;
  }

  const status = STATUS_MAP[appointment.status] || { label: appointment.status, variant: "outline" as const };
  const canCancel = ["PENDING", "CONFIRMED"].includes(appointment.status);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Chi tiết lịch hẹn</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Thông tin lịch hẹn</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Bác sĩ</p>
                <p className="font-medium">{appointment.doctor?.user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Chuyên khoa</p>
                <p className="font-medium">{appointment.doctor?.specialty?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Ngày khám</p>
                <p className="font-medium">{formatDate(appointment.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Giờ khám</p>
                <p className="font-medium">{appointment.timeSlot}</p>
              </div>
            </div>
            {appointment.clinic && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-text-light" />
                <div>
                  <p className="text-sm text-text-light">Phòng khám</p>
                  <p className="font-medium">{appointment.clinic.name} - {appointment.clinic.address}</p>
                </div>
              </div>
            )}
          </div>
          {appointment.symptomNote && (
            <div>
              <p className="text-sm text-text-light">Triệu chứng</p>
              <p>{appointment.symptomNote}</p>
            </div>
          )}
          {appointment.amount && (
            <div>
              <p className="text-sm text-text-light">Phí khám</p>
              <p className="font-medium text-primary">{formatVND(appointment.amount)}</p>
            </div>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel}>Hủy lịch hẹn</Button>
          )}
        </CardContent>
      </Card>
      {appointment?.paymentStatus === "UNPAID" && appointment?.paymentMethod !== "CASH" && appointment?.status !== "CANCELLED" && (
        <div className="mt-4">
          <PaymentButton appointmentId={id} amount={appointment.amount || 0} />
        </div>
      )}
      {appointment?.status === "COMPLETED" && (
        <div className="mt-6">
          {review ? (
            <ReviewDisplay review={review} onUpdate={(r) => setReview(r)} />
          ) : (
            <ReviewForm appointmentId={id} onSubmit={(r) => setReview(r)} />
          )}
        </div>
      )}
    </div>
  );
}
