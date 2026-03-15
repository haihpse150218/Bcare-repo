"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Specialty {
  id: string;
  name: string;
  slug: string;
}

export function DoctorFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    api<Specialty[]>("/api/specialties").then(setSpecialties).catch(() => {});
  }, []);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/doctors?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", search || null);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <form onSubmit={handleSearch} className="flex gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <Input
            placeholder="Tìm bác sĩ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">Tìm</Button>
      </form>
      <Select
        value={searchParams.get("specialty") || "all"}
        onValueChange={(v) => updateParam("specialty", v)}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Chuyên khoa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
          {specialties.map((s) => (
            <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("sort") || "rating"}
        onValueChange={(v) => updateParam("sort", v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Đánh giá cao</SelectItem>
          <SelectItem value="experience">Kinh nghiệm</SelectItem>
          <SelectItem value="fee">Phí khám</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
