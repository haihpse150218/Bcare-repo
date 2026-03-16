"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { DoctorCard } from "@/components/shared/doctor-card";
import { Button } from "@/components/ui/button";
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

export function DoctorList() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(limit));
    if (!params.has("page")) params.set("page", "1");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/doctors?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setDoctors(Array.isArray(json.data) ? json.data : []);
          setTotal(json.meta?.total || 0);
        }
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-light text-lg">Không tìm thấy bác sĩ nào.</p>
      </div>
    );
  }

  return (
    <>
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
      {total > limit && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button variant="outline" size="sm" onClick={() => window.location.search = `?page=${page - 1}`}>
              Trang trước
            </Button>
          )}
          {page * limit < total && (
            <Button variant="outline" size="sm" onClick={() => window.location.search = `?page=${page + 1}`}>
              Trang sau
            </Button>
          )}
        </div>
      )}
    </>
  );
}
