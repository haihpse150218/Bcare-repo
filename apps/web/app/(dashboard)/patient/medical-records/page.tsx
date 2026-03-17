"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { apiWithMeta } from "@/lib/api";
import { MedicalNoteCard } from "@/components/medical/medical-note-card";
import { Button } from "@/components/ui/button";

export default function PatientMedicalRecordsPage() {
  const { token } = useAuthStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => { loadNotes(); }, [page]);

  async function loadNotes() {
    setLoading(true);
    try {
      const result = await apiWithMeta<any[]>(`/api/my-medical-notes?page=${page}&limit=${limit}`, { token: token! });
      setNotes(result.data);
      setTotal(result.meta?.total || 0);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hồ sơ bệnh án</h1>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-muted-foreground">Chưa có hồ sơ bệnh án nào.</p>
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
  );
}
