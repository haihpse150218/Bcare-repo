"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Brain, Eye, Baby, Bone, Stethoscope, Pill, Activity, Ear, Smile } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  "tim-mach": <Heart className="w-10 h-10 text-primary" />,
  "nha-khoa": <Smile className="w-10 h-10 text-primary" />,
  "mat": <Eye className="w-10 h-10 text-primary" />,
  "da-lieu": <Pill className="w-10 h-10 text-primary" />,
  "noi-khoa": <Stethoscope className="w-10 h-10 text-primary" />,
  "nhi-khoa": <Baby className="w-10 h-10 text-primary" />,
  "xuong-khop": <Bone className="w-10 h-10 text-primary" />,
  "tai-mui-hong": <Ear className="w-10 h-10 text-primary" />,
  "than-kinh": <Brain className="w-10 h-10 text-primary" />,
};

const DEFAULT_ICON = <Activity className="w-10 h-10 text-primary" />;

interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { doctors: number };
}

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Specialty[]>("/api/specialties")
      .then(setSpecialties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Chuyên khoa</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {specialties.map((s) => (
            <Link key={s.id} href={`/specialties/${s.slug}`}>
              <Card className="shadow-card hover:shadow-hover transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    {ICON_MAP[s.slug] || DEFAULT_ICON}
                  </div>
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  <p className="text-sm text-text-light mt-1">{s._count.doctors} bác sĩ</p>
                  {s.description && (
                    <p className="text-sm text-text-light mt-2 line-clamp-2">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
