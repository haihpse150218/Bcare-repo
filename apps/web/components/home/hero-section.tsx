"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function HeroSection() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/doctors?search=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
          Đặt lịch khám dễ dàng, nhanh chóng
        </h1>
        <p className="text-lg text-text-light mb-8 max-w-2xl mx-auto">
          Tìm bác sĩ phù hợp, đặt lịch hẹn trực tuyến và quản lý sức khỏe của bạn mọi lúc, mọi nơi.
        </p>
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <Input
              placeholder="Tìm bác sĩ, chuyên khoa, triệu chứng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button type="submit" className="h-12 px-8 bg-primary hover:bg-primary-600">
            Tìm kiếm
          </Button>
        </form>
      </div>
    </section>
  );
}
