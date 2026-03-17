"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function PatientProfileForm() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await api<any>("/api/patients/my-profile", { token: token! });
      setBloodType(profile.bloodType || "");
      setAllergies(profile.allergies || []);
      setConditions(profile.conditions || []);
      setMedications(profile.medications || []);
      setNotes(profile.notes || "");
    } catch {
      // Profile may not exist yet
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/patients/my-profile", {
        method: "PUT",
        token: token!,
        body: JSON.stringify({
          bloodType: bloodType || undefined,
          allergies,
          conditions,
          medications,
          notes: notes || undefined,
        }),
      });
      toast.success("Cập nhật thông tin sức khỏe thành công");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addTag(list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed) && list.length < 20) {
      setList([...list, trimmed]);
      setInput("");
    }
  }

  function removeTag(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index));
  }

  function TagInput({ label, list, setList, input, setInput }: {
    label: string; list: string[]; setList: (v: string[]) => void; input: string; setInput: (v: string) => void;
  }) {
    return (
      <div>
        <Label>{label}</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(list, setList, input, setInput); } }}
            placeholder="Nhập và nhấn Enter"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => addTag(list, setList, input, setInput)}>
            Thêm
          </Button>
        </div>
        {list.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {list.map((item, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTag(list, setList, i)}>
                {item} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-32 bg-gray-200 rounded" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin sức khỏe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nhóm máu</Label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Chưa xác định</option>
              {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>

          <TagInput label="Dị ứng" list={allergies} setList={setAllergies} input={allergyInput} setInput={setAllergyInput} />
          <TagInput label="Bệnh nền" list={conditions} setList={setConditions} input={conditionInput} setInput={setConditionInput} />
          <TagInput label="Thuốc đang dùng" list={medications} setList={setMedications} input={medicationInput} setInput={setMedicationInput} />

          <div>
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú thêm..." className="mt-1" />
          </div>

          <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thông tin"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
