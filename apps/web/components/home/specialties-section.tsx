"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Brain, Eye, Baby, Bone, Stethoscope, Pill, Activity } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  "tim-mach": <Heart className="w-8 h-8 text-primary" />,
  "than-kinh": <Brain className="w-8 h-8 text-primary" />,
  "mat": <Eye className="w-8 h-8 text-primary" />,
  "nhi": <Baby className="w-8 h-8 text-primary" />,
  "co-xuong-khop": <Bone className="w-8 h-8 text-primary" />,
  "noi-tong-quat": <Stethoscope className="w-8 h-8 text-primary" />,
  "da-lieu": <Pill className="w-8 h-8 text-primary" />,
};

const DEFAULT_ICON = <Activity className="w-8 h-8 text-primary" />;

interface Specialty {
  id: string;
  name: string;
  slug: string;
  _count: { doctors: number };
}

export function SpecialtiesSection() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Specialty[]>("/api/specialties")
      .then(setSpecialties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Chuyên khoa</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))
            : specialties.slice(0, 8).map((s) => (
                <Link key={s.id} href={`/doctors?specialty=${s.slug}`}>
                  <Card className="shadow-card hover:shadow-hover transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3">
                        {ICON_MAP[s.slug] || DEFAULT_ICON}
                      </div>
                      <h3 className="font-medium text-text">{s.name}</h3>
                      <p className="text-sm text-text-light mt-1">{s._count.doctors} bác sĩ</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
