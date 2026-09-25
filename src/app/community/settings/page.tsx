"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldAlert,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  GitFork,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { clanApi, personsApi, usersApi } from "@/lib/api";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLoading } from "@/components/ui/PageLoading";
import type { Person, AppUser } from "@/types";

function fullName(p: Person | Partial<Person>) {
  return [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ");
}

export default function ClanSettingsPage() {
  const [clanLastName, setClanLastName] = useState<string>("");
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [superAdminGeneration, setSuperAdminGeneration] = useState<number | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [communityAdmins, setCommunityAdmins] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isSuperAdmin, role, canManageCommunity, refreshClan } = useAccess();
  const router = useRouter();

  const isSuper = isSuperAdmin || role === "super_admin";
  const hasAccess = isSuper || role === "admin" || canManageCommunity;

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace("/");
    }
  }, [loading, hasAccess, router]);

  const loadData = async () => {
    try {
      const [clan, ps, us] = await Promise.all([
        clanApi.get(),
        personsApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
      ]);

      if (clan) {
        setClanLastName(clan.clanLastName ?? "");
        setSuperAdminId(clan.superAdminId ?? null);
        setSuperAdminGeneration(clan.superAdminGeneration ?? null);
      }
      if (Array.isArray(ps)) {
        setPersons(ps);
      }
      if (Array.isArray(us)) {
        const admins = us.filter((u) => {
          if (u.role === "super_admin") return true;
          return u.adminModules?.includes("community") || u.adminModules?.includes("*");
        });
        setCommunityAdmins(admins);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) return;

    setSaving(true);
    const tid = toast.loading("Đang lưu thiết lập dòng họ & tính toán lại phả hệ...");
    try {
      const currentClan = await clanApi.get();
      await clanApi.upsert({
        name: currentClan?.name || "Gia Đình Việt",
        address: currentClan?.address ?? null,
        description: currentClan?.description ?? null,
        enabled: currentClan?.enabled ?? true,
        enabledModules: currentClan?.enabledModules ?? null,
        clanLastName: clanLastName.trim() || null,
        superAdminId: superAdminId || null,
        superAdminGeneration: superAdminGeneration || null,
      });

      if (refreshClan) {
        await refreshClan();
      }

      toast.success("Đã lưu thiết lập dòng họ thành công!", { id: tid });
    } catch (err) {
      toast.error("Lưu thất bại: " + String(err), { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const superAdmin = persons.find((p) => p.id === superAdminId);

  if (loading) return <PageLoading message="Đang tải thiết lập dòng họ..." />;

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        {!isSuper && !canManageCommunity && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 mb-5">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Chỉ <strong>Super Admin</strong> hoặc <strong>Quản trị viên Cộng Đồng & Gia Tộc</strong> mới có quyền chỉnh sửa thiết lập này.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 sm:border sm:rounded-xl sm:p-6">
            {/* Header section */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Thiết Lập Dòng Họ & Gia Tộc</h2>
                <p className="text-xs text-slate-500">
                  Cấu hình họ của tộc, người tham chiếu tính đời và quy chuẩn thế hệ phả hệ
                </p>
              </div>
            </div>

            {/* Họ của dòng họ */}
            <div className="space-y-4">
              <div>
                <label className="font-medium text-sm text-slate-800">Họ của dòng họ / Gia tộc *</label>
                <Input
                  required
                  value={clanLastName}
                  onChange={(e) => setClanLastName(e.target.value)}
                  placeholder="Chỉ nhập họ, VD: Đỗ / Nguyễn / Phạm / Trần / Lê..."
                  className="mt-1"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dùng để tự động điền họ mặc định khi thêm con cháu mới và nhận diện con dâu/con rể trong phả đồ.
                </p>
              </div>

              {/* Thành viên tham chiếu tính đời */}
              <div className="pt-2">
                <label className="font-medium text-sm text-slate-800">Thành viên tham chiếu tính đời</label>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">
                  Chọn 1 thành viên trên Cây Gia Phả làm mốc gốc để hệ thống tự động suy ra đời thứ cho toàn bộ các đời trước và đời sau
                </p>

                {persons.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có người nào trong danh sách. Hãy thêm người trên Cây Gia Phả trước.</p>
                ) : (
                  <Select
                    value={superAdminId ?? "none"}
                    onValueChange={(v) => setSuperAdminId(v === "none" ? null : v)}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="— Chọn thành viên mốc —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Chưa chọn —</SelectItem>
                      {persons.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {fullName(p)} {p.generation ? `(Đời ${p.generation})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {superAdmin && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                    <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${superAdmin.gender === "female" ? "bg-pink-100 text-pink-500" : "bg-teal-100 text-teal-600"}`}>
                      <UserIcon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900">{fullName(superAdmin)}</p>
                      <p className="text-xs text-emerald-700 font-medium">Thành viên mốc tham chiếu</p>
                    </div>
                  </div>
                )}

                {superAdmin && (
                  <div className="mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="font-medium text-sm text-slate-800">
                      {fullName(superAdmin)} thuộc đời thứ mấy? *
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5 mb-2">
                      Ví dụ nhập số <strong>5</strong> nghĩa là người này thuộc đời thứ 5. Cha mẹ của người này sẽ là đời 4, con cái là đời 6.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={superAdminGeneration ?? ""}
                        onChange={(e) =>
                          setSuperAdminGeneration(e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="VD: 5"
                        className="w-28 bg-white font-bold"
                      />
                      <span className="text-sm font-semibold text-emerald-700">
                        {superAdminGeneration ? `→ Đời ${superAdminGeneration}` : "Chưa nhập số đời"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Giải thích cơ chế tính đời tự động */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                  <GitFork className="w-4 h-4 text-blue-600" />
                  <span>Cơ chế suy luận thế hệ tự động (Auto Generation Recalculation)</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Khi lưu thông tin mốc tham chiếu, hệ thống sử dụng thuật toán duyệt đồ thị phả hệ (BFS Graph Traversal) để tự động cập nhật số đời cho từng cá nhân:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-900 font-medium pt-1">
                  <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-lg border border-blue-200/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Con cái: Thế hệ = Đời cha/mẹ + 1</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1.5 rounded-lg border border-blue-200/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Cha mẹ: Thế hệ = Đời con - 1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quản trị viên phụ trách phân hệ này */}
            <div className="border-t pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Quản trị viên phụ trách Cộng Đồng & Gia Tộc ({communityAdmins.length})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Được Super Admin phân quyền quản lý cây gia phả, thành viên và các sự kiện
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {communityAdmins.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Chưa chỉ định quản trị viên riêng (Mặc định Super Admin quản lý).
                  </span>
                ) : (
                  communityAdmins.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      <span>{u.fullName || u.phone}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({u.phone})</span>
                      {u.role === "super_admin" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">Super Admin</span>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold cursor-pointer text-white"
            >
              {saving ? "Đang lưu và tính toán..." : "Lưu thiết lập dòng họ"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
