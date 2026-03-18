"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api, apiWithMeta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const limit = 20;

  useEffect(() => { loadUsers(); }, [page, roleFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      const result = await apiWithMeta<any[]>(`/api/admin/users?${params}`, { token: token! });
      setUsers(result.data);
      setTotal(result.meta?.total || 0);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  async function toggleVerify(userId: string, current: boolean) {
    try {
      await api(`/api/admin/users/${userId}`, { method: "PATCH", token: token!, body: JSON.stringify({ isVerified: !current }) });
      toast.success("Cập nhật thành công");
      loadUsers();
    } catch (err: any) { toast.error(err.message); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý người dùng</h1>
      <div className="flex gap-2 mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="max-w-xs" onKeyDown={(e) => e.key === "Enter" && loadUsers()} />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Tất cả</option>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
          <option value="CLINIC">Clinic</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button variant="outline" onClick={loadUsers}>Tìm</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
              <div>
                <p className="font-medium">{u.fullName}</p>
                <p className="text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant="outline">{u.role}</Badge>
              <Badge variant={u.isVerified ? "default" : "secondary"}>{u.isVerified ? "Verified" : "Unverified"}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleVerify(u.id, u.isVerified)}>
                {u.isVerified ? "Hủy xác minh" : "Xác minh"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
          <span className="text-sm self-center">Trang {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
