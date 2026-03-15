import { AppointmentList } from "@/components/appointments/appointment-list";

export default function PatientAppointmentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lịch hẹn của tôi</h1>
      <AppointmentList />
    </div>
  );
}
