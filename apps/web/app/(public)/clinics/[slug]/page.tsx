"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { DoctorCard } from "@/components/shared/doctor-card";
import { MapPin, Phone, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClinicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any>(`/api/clinics/${slug}`)
      .then(setClinic)
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

  if (!clinic) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-text-light text-lg">Không tìm thấy phòng khám.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-card p-6 mb-8">
        <h1 className="text-2xl font-bold">{clinic.name}</h1>
        <div className="flex flex-col gap-2 mt-3 text-sm text-text-light">
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {clinic.address}, {clinic.district}, {clinic.city}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {clinic.phone}
          </p>
        </div>
        {clinic.description && (
          <p className="mt-4 text-text-light">{clinic.description}</p>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Bác sĩ ({clinic._count?.doctors || clinic.doctors?.length || 0})</h2>
      {clinic.doctors && clinic.doctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {clinic.doctors.map((d: any) => (
            <DoctorCard
              key={d.slug}
              slug={d.slug}
              name={d.user.fullName}
              title={d.title}
              avatarUrl={d.user.avatarUrl}
              specialty={d.specialty.name}
              clinicName={clinic.name}
              city={clinic.city}
              ratingAvg={d.ratingAvg}
              reviewCount={0}
              consultationFee={d.consultationFee}
            />
          ))}
        </div>
      ) : (
        <p className="text-text-light">Chưa có bác sĩ nào.</p>
      )}
    </div>
  );
}
