"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { api, apiWithMeta } from "@/lib/api";
import { PatientProfileView } from "@/components/medical/patient-profile-view";
import { MedicalNoteCard } from "@/components/medical/medical-note-card";
import { Button } from "@/components/ui/button";

export default function DoctorPatientPage() {
  const params = useParams();
  const { token } = useAuthStore();
  const patientId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => { loadData(); }, [patientId, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileData, notesData] = await Promise.all([
        api<any>(`/api/patients/${patientId}/profile`, { token: token! }),
        apiWithMeta<any[]>(`/api/medical-notes/patient/${patientId}?page=${page}&limit=${limit}`, { token: token! }),
      ]);
      setProfile(profileData);
      setNotes(notesData.data);
      setTotal(notesData.meta?.total || 0);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-40 bg-gray-200 rounded" /><div className="h-40 bg-gray-200 rounded" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ bệnh nhân</h1>

      {profile && <PatientProfileView profile={profile} patientName="Bệnh nhân" />}

      <div>
        <h2 className="text-xl font-semibold mb-4">Lịch sử khám</h2>
        {notes.length === 0 ? (
          <p className="text-muted-foreground">Chưa có ghi chú khám nào.</p>
        ) : (
          <>
            <div className="space-y-4">
              {notes.map((note) => <MedicalNoteCard key={note.id} note={note} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
                <span className="text-sm self-center">Trang {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
