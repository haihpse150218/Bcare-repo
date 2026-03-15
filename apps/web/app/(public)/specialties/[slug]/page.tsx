"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { DoctorCard } from "@/components/shared/doctor-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Doctor {
  slug: string;
  title: string;
  ratingAvg: number;
  consultationFee: number;
  user: { fullName: string; avatarUrl: string | null };
  specialty: { name: string; slug: string };
  clinic: { name: string; city: string } | null;
  _count: { reviews: number };
}

export default function SpecialtyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Doctor[]>(`/api/doctors?specialty=${slug}&limit=50`)
      .then(setDoctors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 capitalize">{slug.replace(/-/g, " ")}</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <p className="text-text-light text-center py-12">Không có bác sĩ nào trong chuyên khoa này.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {doctors.map((d) => (
            <DoctorCard
              key={d.slug}
              slug={d.slug}
              name={d.user.fullName}
              title={d.title}
              avatarUrl={d.user.avatarUrl}
              specialty={d.specialty.name}
              clinicName={d.clinic?.name || null}
              city={d.clinic?.city || null}
              ratingAvg={d.ratingAvg}
              reviewCount={d._count.reviews}
              consultationFee={d.consultationFee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
