import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface BookingConfirmationProps {
  appointment: {
    id: string;
    date: string;
    timeSlot: string;
    doctor: { user: { fullName: string }; specialty: { name: string } };
    clinic: { name: string; address: string } | null;
  };
  onClose: () => void;
}

export function BookingConfirmation({ appointment, onClose }: BookingConfirmationProps) {
  return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-bold">Đặt lịch thành công!</h3>
      <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
        <p><span className="font-medium">Bác sĩ:</span> {appointment.doctor.user.fullName}</p>
        <p><span className="font-medium">Chuyên khoa:</span> {appointment.doctor.specialty.name}</p>
        <p><span className="font-medium">Ngày:</span> {formatDate(appointment.date)}</p>
        <p><span className="font-medium">Giờ:</span> {appointment.timeSlot}</p>
        {appointment.clinic && (
          <p><span className="font-medium">Phòng khám:</span> {appointment.clinic.name}</p>
        )}
      </div>
      <div className="flex gap-2 justify-center">
        <Link href="/patient/appointments">
          <Button variant="outline">Xem lịch hẹn</Button>
        </Link>
        <Button onClick={onClose}>Đóng</Button>
      </div>
    </div>
  );
}
