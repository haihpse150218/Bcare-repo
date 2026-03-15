"use client";

import { useEffect, useState } from "react";
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

export function TopDoctorsSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Doctor[]>("/api/doctors?limit=8&sort=rating&order=desc")
      .then(setDoctors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && doctors.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Bác sĩ nổi bật</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))
            : doctors.map((d) => (
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
      </div>
    </section>
  );
}
