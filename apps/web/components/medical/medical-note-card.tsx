"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MedicalNoteCardProps {
  note: {
    id: string;
    diagnosis: string;
    prescription?: string | null;
    notes?: string | null;
    followUpDate?: string | null;
    createdAt: string;
    doctor: {
      user: { fullName: string; avatarUrl?: string | null };
      specialty: { name: string };
    };
    appointment: { date: string; timeSlot: string };
    attachments: { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }[];
  };
}

export function MedicalNoteCard({ note }: MedicalNoteCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{note.doctor.user.fullName}</CardTitle>
            <p className="text-sm text-muted-foreground">{note.doctor.specialty.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(note.appointment.date).toLocaleDateString("vi-VN")} - {note.appointment.timeSlot}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Chẩn đoán</p>
          <p className="text-sm">{note.diagnosis}</p>
        </div>
        {note.prescription && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Đơn thuốc</p>
            <p className="text-sm">{note.prescription}</p>
          </div>
        )}
        {note.notes && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
            <p className="text-sm">{note.notes}</p>
          </div>
        )}
        {note.followUpDate && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tái khám</p>
            <Badge variant="outline">{new Date(note.followUpDate).toLocaleDateString("vi-VN")}</Badge>
          </div>
        )}
        {note.attachments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">File đính kèm</p>
            <div className="space-y-1">
              {note.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span>{att.fileName}</span>
                  <span className="text-muted-foreground">({(att.fileSize / 1024).toFixed(0)} KB)</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
