import { ScheduleManager } from "@/components/doctor/schedule-manager";

export default function DoctorSchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý lịch làm việc</h1>
      <ScheduleManager />
    </div>
  );
}
