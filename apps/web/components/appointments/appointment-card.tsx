"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin } from "lucide-react";
import { formatDate, formatVND } from "@/lib/utils";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xác nhận", variant: "outline" },
  CONFIRMED: { label: "Đã xác nhận", variant: "default" },
  IN_PROGRESS: { label: "Đang khám", variant: "secondary" },
  COMPLETED: { label: "Hoàn thành", variant: "secondary" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  UNPAID: { label: "Chưa thanh toán", className: "bg-orange-100 text-orange-700" },
  PAID: { label: "Đã thanh toán", className: "bg-green-100 text-green-700" },
  REFUNDED: { label: "Đã hoàn tiền", className: "bg-blue-100 text-blue-700" },
};

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    timeSlot: string;
    status: string;
    paymentStatus?: string;
    amount: number | null;
    doctor: {
      user: { fullName: string; avatarUrl: string | null };
      specialty: { name: string };
    };
    clinic: { name: string; address: string } | null;
  };
  onCancel?: (id: string) => void;
  showActions?: boolean;
  linkPrefix?: string;
}

export function AppointmentCard({ appointment, onCancel, showActions = true, linkPrefix = "/patient/appointments" }: AppointmentCardProps) {
  const status = STATUS_MAP[appointment.status] || { label: appointment.status, variant: "outline" as const };
  const canCancel = ["PENDING", "CONFIRMED"].includes(appointment.status);

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={appointment.doctor.user.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary-50 text-primary">
              {appointment.doctor.user.fullName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{appointment.doctor.user.fullName}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              {appointment.paymentStatus && appointment.paymentStatus !== "UNPAID" && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_STATUS[appointment.paymentStatus]?.className || ""}`}>
                  {PAYMENT_STATUS[appointment.paymentStatus]?.label || appointment.paymentStatus}
                </span>
              )}
            </div>
            <p className="text-sm text-text-light">{appointment.doctor.specialty.name}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-text-light">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(appointment.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {appointment.timeSlot}
              </span>
              {appointment.clinic && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {appointment.clinic.name}
                </span>
              )}
              {appointment.amount && (
                <span className="text-sm text-gray-500">{appointment.amount.toLocaleString("vi-VN")}đ</span>
              )}
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 mt-3 justify-end">
            <Link href={`${linkPrefix}/${appointment.id}`}>
              <Button variant="outline" size="sm">Chi tiết</Button>
            </Link>
            {canCancel && onCancel && (
              <Button variant="destructive" size="sm" onClick={() => onCancel(appointment.id)}>
                Hủy lịch
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
