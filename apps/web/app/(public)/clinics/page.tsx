"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  description: string | null;
  _count: { doctors: number };
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api<Clinic[]>(`/api/clinics${params}`)
      .then(setClinics)
      .catch(() => setClinics([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Phòng khám</h1>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
        <Input
          placeholder="Tìm phòng khám..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <p className="text-text-light text-center py-12">Không tìm thấy phòng khám nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((c) => (
            <ClinicCard
              key={c.id}
              slug={c.slug}
              name={c.name}
              address={c.address}
              city={c.city}
              doctorCount={c._count.doctors}
              description={c.description}
            />
          ))}
        </div>
      )}
    </div>
  );
}
