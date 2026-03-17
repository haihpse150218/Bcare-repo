"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PatientProfileViewProps {
  profile: {
    bloodType?: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
    notes?: string | null;
  };
  patientName: string;
}

export function PatientProfileView({ profile, patientName }: PatientProfileViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin sức khỏe - {patientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Nhóm máu</p>
          <p className="text-sm">{profile.bloodType || "Chưa cập nhật"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dị ứng</p>
          {profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.allergies.map((a, i) => <Badge key={i} variant="destructive">{a}</Badge>)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Bệnh nền</p>
          {profile.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.conditions.map((c, i) => <Badge key={i} variant="secondary">{c}</Badge>)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Thuốc đang dùng</p>
          {profile.medications.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.medications.map((m, i) => <Badge key={i} variant="outline">{m}</Badge>)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có</p>
          )}
        </div>
        {profile.notes && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
            <p className="text-sm">{profile.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
