import { Suspense } from "react";
import { DoctorFilters } from "@/components/doctors/doctor-filters";
import { DoctorList } from "@/components/doctors/doctor-list";

export default function DoctorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tìm bác sĩ</h1>
      <Suspense fallback={null}>
        <DoctorFilters />
        <DoctorList />
      </Suspense>
    </div>
  );
}
