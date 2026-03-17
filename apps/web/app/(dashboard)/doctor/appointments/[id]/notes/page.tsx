"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { MedicalNoteForm } from "@/components/medical/medical-note-form";
import { MedicalNoteCard } from "@/components/medical/medical-note-card";
import { Button } from "@/components/ui/button";

export default function DoctorAppointmentNotesPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const appointmentId = params.id as string;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => { loadNote(); }, [appointmentId]);

  async function loadNote() {
    setLoading(true);
    try {
      const data = await api<any>(`/api/medical-notes/appointment/${appointmentId}`, { token: token! });
      setNote(data);
    } catch {
      setNote(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ghi chú khám bệnh</h1>
        <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
      </div>

      {note && !editing ? (
        <div className="space-y-4">
          <MedicalNoteCard note={note} />
          <Button onClick={() => setEditing(true)}>Chỉnh sửa</Button>
        </div>
      ) : (
        <MedicalNoteForm
          appointmentId={appointmentId}
          existingNote={editing ? note : null}
          onSaved={() => { setEditing(false); loadNote(); }}
        />
      )}
    </div>
  );
}
