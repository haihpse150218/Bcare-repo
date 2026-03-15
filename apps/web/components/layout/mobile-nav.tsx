"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

const NAV_ITEMS = [
  { label: "Tìm bác sĩ", href: "/doctors" },
  { label: "Phòng khám", href: "/clinics" },
  { label: "Chuyên khoa", href: "/specialties" },
];

interface MobileNavProps {
  onClose: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="md:hidden border-t border-border bg-white px-4 py-4 space-y-3">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block py-2 text-text-light hover:text-primary transition-colors"
          onClick={onClose}
        >
          {item.label}
        </Link>
      ))}
      <div className="pt-3 border-t border-border space-y-2">
        {user ? (
          <>
            <Link href={`/${user.role.toLowerCase()}/dashboard`} onClick={onClose}>
              <Button variant="outline" className="w-full" size="sm">
                {user.fullName}
              </Button>
            </Link>
            <Button variant="ghost" className="w-full" size="sm" onClick={() => { logout(); onClose(); }}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={onClose}>
              <Button variant="outline" className="w-full" size="sm">Đăng nhập</Button>
            </Link>
            <Link href="/register" onClick={onClose}>
              <Button className="w-full bg-primary hover:bg-primary-600" size="sm">Đăng ký</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
