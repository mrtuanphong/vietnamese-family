"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { clanApi, personsApi } from "@/lib/api";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Clan, Person } from "@/types";

type ClanForm = Omit<Clan, "id">;

const defaultForm: ClanForm = {
  name: "",
  address: "",
  description: "",
  enabled: true,
  superAdminId: null,
  superAdminGeneration: null,
  clanLastName: null,
};

function fullName(p: Person) {
  return [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ");
}

export default function ClanPage() {
  const [form, setForm] = useState<ClanForm>(defaultForm);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { canViewClan, canEditClan, role } = useAccess();
  const router = useRouter();

  useEffect(() => {
    if (role === "member") {
      router.replace("/");
    }
  }, [role, router]);

  useEffect(() => {
    Promise.all([clanApi.get(), personsApi.getAll()]).then(([clan, ps]) => {
      if (clan) {
        setForm({
          name: clan.name,
          address: clan.address ?? "",
          description: clan.description ?? "",
          enabled: clan.enabled,
          superAdminId: clan.superAdminId ?? null,
          superAdminGeneration: clan.superAdminGeneration ?? null,
          clanLastName: clan.clanLastName ?? null,
        });
      }
      setPersons(ps);
      setLoading(false);
    });
  }, []);

  const set = (field: keyof ClanForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value || null }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditClan) return;

    setSaving(true);
    const tid = toast.loading("Đang lưu...");
    try {
      await clanApi.upsert(form);
      toast.success("Đã lưu thông tin dòng họ", { id: tid });
    } catch (err) {
      toast.error("Lưu thất bại: " + String(err), { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const superAdmin = persons.find((p) => p.id === form.superAdminId);

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400">Đang tải...</div>;

  if (role === "member" || !canViewClan) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        {!canEditClan && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 mb-5">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Bạn đang xem với quyền <strong>Quản trị viên</strong>. Chỉ tài khoản <strong>Super Admin</strong> mới được chỉnh sửa thông tin và cấu hình dòng họ.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 sm:border sm:rounded-xl sm:p-6">
            <div>
              <label className="font-medium">Họ của dòng họ *</label>
              <Input
                required
                disabled={!canEditClan}
                value={form.clanLastName ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, clanLastName: e.target.value || null }))}
                placeholder="Chỉ nhập họ, VD: Đỗ / Nguyễn / Phạm /..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-medium">Tiêu đề *</label>
              <Input
                required
                disabled={!canEditClan}
                value={form.name}
                onChange={set("name")}
                placeholder="Họ Đỗ Quảng Tái"
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-medium">Địa chỉ</label>
              <Input
                disabled={!canEditClan}
                value={form.address ?? ""}
                onChange={set("address")}
                placeholder="Làng Quảng Tái, Xã Ứng Hòa, Thành phố Hà Nội"
                className="mt-1"
              />
            </div>

            <div>
              <label className="font-medium">Mô tả</label>
              <Textarea
                disabled={!canEditClan}
                value={form.description ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Mô tả về nguồn gốc, lịch sử dòng họ..."
                className="mt-1 resize-none"
              />
            </div>

            {/* Super Admin section */}
            {canEditClan && (
              <div className="border-t pt-5">
                <label className="font-medium">Quản trị viên (Super Admin)</label>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">Chọn 1 người trong dòng họ làm quản trị viên workspace</p>

                {persons.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có người nào trong danh sách. Thêm người trước.</p>
                ) : (
                  <Select
                    value={form.superAdminId ?? "none"}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, superAdminId: v === "none" ? null : v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— Chưa chọn —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Chưa chọn —</SelectItem>
                      {persons.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{fullName(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {superAdmin && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-brand-50 border border-brand-100 rounded-lg">
                    <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${superAdmin.gender === "female" ? "bg-pink-100 text-pink-400" : "bg-gray-100 text-gray-500"}`}>
                      <User size={18} />
                    </span>
                    <div>
                      <p className="font-medium">{fullName(superAdmin)}</p>
                      <p className="text-xs text-brand-500">Tài khoản Super Admin</p>
                    </div>
                  </div>
                )}

                {superAdmin && (
                  <div className="mt-3">
                    <label className="font-medium">
                      {fullName(superAdmin)} thuộc đời thứ
                    </label>
                    <p className="text-xs text-gray-400 mt-0.5 mb-2">
                      Dùng làm tham chiếu tính đời cho toàn bộ dòng họ
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={form.superAdminGeneration ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            superAdminGeneration: e.target.value ? parseInt(e.target.value) : null,
                          }))
                        }
                        placeholder="VD: 5"
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">
                        {form.superAdminGeneration
                          ? `→ Đời ${form.superAdminGeneration}`
                          : "Chưa nhập"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {canEditClan && (
              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <p className="font-medium">Cho phép truy cập</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tắt để chỉ cho phép Super Admin truy cập hệ thống</p>
                </div>
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(v) => setForm((prev) => ({ ...prev, enabled: v }))}
                />
              </div>
            )}

          </div>

          {canEditClan && (
            <div className="flex flex-col gap-2 mt-4">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
