"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { DoctorProfile } from "@/components/doctors/doctor-profile";
import { DoctorSchedule } from "@/components/doctors/doctor-schedule";
import { DoctorReviews } from "@/components/doctors/doctor-reviews";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any>(`/api/doctors/${slug}`)
      .then(setDoctor)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-text-light text-lg">Không tìm thấy bác sĩ.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <DoctorProfile doctor={doctor} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DoctorSchedule doctorId={doctor.id} />
        <DoctorReviews doctorId={doctor.id} />
      </div>
    </div>
  );
}
