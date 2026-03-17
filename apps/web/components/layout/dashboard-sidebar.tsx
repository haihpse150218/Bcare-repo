"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Bell,
  User,
  Clock,
  Users,
  Star,
  FileText,
  CreditCard,
  Settings,
  Heart,
  BarChart3,
  Building,
  UserPlus,
  FileDown,
} from "lucide-react";

const NAV_BY_ROLE: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  PATIENT: [
    { label: "Dashboard", href: "/patient/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Lịch hẹn", href: "/patient/appointments", icon: <Calendar className="w-5 h-5" /> },
    { label: "Thông báo", href: "/patient/notifications", icon: <Bell className="w-5 h-5" /> },
    { label: "Cá nhân", href: "/patient/profile", icon: <User className="w-5 h-5" /> },
    { label: "Hồ sơ bệnh án", href: "/patient/medical-records", icon: <FileText className="w-5 h-5" /> },
    { label: "Thông tin sức khỏe", href: "/patient/profile/medical", icon: <Heart className="w-5 h-5" /> },
    { label: "Lịch sử thanh toán", href: "/patient/payments", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Cài đặt thông báo", href: "/settings/notifications", icon: <Settings className="w-5 h-5" /> },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Lịch hẹn", href: "/doctor/appointments", icon: <Calendar className="w-5 h-5" /> },
    { label: "Lịch làm việc", href: "/doctor/schedule", icon: <Clock className="w-5 h-5" /> },
    { label: "Đánh giá", href: "/doctor/reviews", icon: <Star className="w-5 h-5" /> },
    { label: "Hồ sơ", href: "/doctor/profile", icon: <FileText className="w-5 h-5" /> },
  ],
  CLINIC: [
    { label: "Tổng quan", href: "/clinic/dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Hồ sơ phòng khám", href: "/clinic/profile", icon: <Building className="w-5 h-5" /> },
    { label: "Quản lý bác sĩ", href: "/clinic/doctors", icon: <UserPlus className="w-5 h-5" /> },
    { label: "Quản lý nhân viên", href: "/clinic/staff", icon: <Users className="w-5 h-5" /> },
    { label: "Báo cáo", href: "/clinic/reports", icon: <FileDown className="w-5 h-5" /> },
  ],
  STAFF: [
    { label: "Dashboard", href: "/staff/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Lịch hẹn", href: "/staff/appointments", icon: <Calendar className="w-5 h-5" /> },
    { label: "Bệnh nhân", href: "/staff/patients", icon: <Users className="w-5 h-5" /> },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  ],
};

export function DashboardSidebar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  const items = NAV_BY_ROLE[user.role] || [];

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border min-h-screen">
      <div className="p-6 border-b border-border">
        <Link href="/" className="text-xl font-bold text-primary">BCare</Link>
        <p className="text-sm text-text-light mt-1">{user.fullName}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href
                ? "bg-primary-50 text-primary font-medium"
                : "text-text-light hover:bg-gray-50 hover:text-text"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
