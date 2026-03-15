"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DoctorProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Hồ sơ bác sĩ</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Họ và tên</Label>
            <Input value={user?.fullName || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <p className="text-sm text-text-light">Liên hệ admin để cập nhật hồ sơ bác sĩ.</p>
        </CardContent>
      </Card>
    </div>
  );
}
