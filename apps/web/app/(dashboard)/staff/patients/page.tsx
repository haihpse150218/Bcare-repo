"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

interface Patient {
  fullName: string;
  phone: string;
  avatarUrl: string | null;
}

export default function StaffPatientsPage() {
  const { token } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // Get unique patients from appointment list
    api<any[]>("/api/appointments?limit=100", { token })
      .then((appointments) => {
        const seen = new Set<string>();
        const unique: Patient[] = [];
        for (const a of appointments) {
          if (a.patient && !seen.has(a.patient.fullName)) {
            seen.add(a.patient.fullName);
            unique.push(a.patient);
          }
        }
        setPatients(unique);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton className="h-64 rounded-lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Danh sách bệnh nhân</h1>
      {patients.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Chưa có bệnh nhân nào.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-sm text-gray-500">{p.phone}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
