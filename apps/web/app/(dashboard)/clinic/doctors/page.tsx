import { DoctorManager } from "@/components/clinic/doctor-manager";

export default function ClinicDoctorsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý bác sĩ</h1>
      <DoctorManager />
    </div>
  );
}
