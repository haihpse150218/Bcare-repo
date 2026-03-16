"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: { fullName: string };
}

interface Appointment {
  id: string;
  review: Review | null;
  patient: { fullName: string };
  date: string;
}

export default function DoctorReviewsPage() {
  const { token } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<any>("/api/appointments?status=COMPLETED&limit=50", { token })
      .then(() => {})
      .catch(() => {});

    // Fetch reviews via doctor profile endpoint
    api<any>("/api/auth/me", { token })
      .then(async (user) => {
        const doctors = await api<any[]>("/api/doctors?limit=50");
        const myDoctor = doctors.find((d: any) => d.userId === user.id);
        if (myDoctor) {
          const result = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/doctors/${myDoctor.id}/reviews`
          ).then((r) => r.json());
          if (result.success) setReviews(result.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton className="h-64 rounded-lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Đánh giá từ bệnh nhân</h1>
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Chưa có đánh giá nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
