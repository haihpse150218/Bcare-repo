"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface MedicalNoteFormProps {
  appointmentId: string;
  existingNote?: {
    id: string;
    diagnosis: string;
    prescription?: string | null;
    notes?: string | null;
    followUpDate?: string | null;
  } | null;
  onSaved?: () => void;
}

export function MedicalNoteForm({ appointmentId, existingNote, onSaved }: MedicalNoteFormProps) {
  const { token } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState(existingNote?.diagnosis || "");
  const [prescription, setPrescription] = useState(existingNote?.prescription || "");
  const [notes, setNotes] = useState(existingNote?.notes || "");
  const [followUpDate, setFollowUpDate] = useState(
    existingNote?.followUpDate ? new Date(existingNote.followUpDate).toISOString().split("T")[0] : ""
  );

  const isEdit = !!existingNote;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim()) { toast.error("Vui lòng nhập chẩn đoán"); return; }
    setSaving(true);

    try {
      if (isEdit) {
        await api(`/api/medical-notes/${existingNote!.id}`, {
          method: "PUT",
          token: token!,
          body: JSON.stringify({
            diagnosis: diagnosis.trim(),
            prescription: prescription.trim() || undefined,
            notes: notes.trim() || undefined,
            followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
          }),
        });
        toast.success("Cập nhật ghi chú thành công");
      } else {
        await api("/api/medical-notes", {
          method: "POST",
          token: token!,
          body: JSON.stringify({
            appointmentId,
            diagnosis: diagnosis.trim(),
            prescription: prescription.trim() || undefined,
            notes: notes.trim() || undefined,
            followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
          }),
        });
        toast.success("Tạo ghi chú khám bệnh thành công");
      }
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Chỉnh sửa ghi chú" : "Ghi chú khám bệnh"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Chẩn đoán *</Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Nhập chẩn đoán..."
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Đơn thuốc</Label>
            <Textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="Nhập đơn thuốc..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Ghi chú thêm</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú bổ sung..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Ngày tái khám</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu ghi chú"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
