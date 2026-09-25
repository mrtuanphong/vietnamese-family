"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Layers,
  ShieldCheck,
  Users,
  X,
  Plus,
  Trash2,
  Building2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { clanApi, personsApi, usersApi, workspacesApi } from "@/lib/api";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageLoading } from "@/components/ui/PageLoading";
import type { Person, AppUser, UserRole } from "@/types";
import {
  SYSTEM_MODULES,
  CATEGORIES,
  ModuleCategory,
  DEFAULT_ENABLED_MODULES,
} from "@/config/modules";

type OrgForm = {
  name: string;
  address: string | null;
  description: string | null;
  enabled: boolean;
  enabledModules: string[];
};

const defaultForm: OrgForm = {
  name: "",
  address: "",
  description: "",
  enabled: true,
  enabledModules: DEFAULT_ENABLED_MODULES,
};

function fullName(p: Person | Partial<Person>) {
  return [p.lastName || "—", p.middleName, p.firstName].filter(Boolean).join(" ");
}

export default function SettingsPage() {
  const [form, setForm] = useState<OrgForm>(defaultForm);
  const [persons, setPersons] = useState<Person[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryAdmins, setCategoryAdmins] = useState<Record<string, string[]>>({
    community: [],
    finance: [],
    games: [],
  });

  // Create User Modal/Form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("12345678");
  const [newName, setNewName] = useState("");
  const [newPersonId, setNewPersonId] = useState<string>("none");
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [creatingUser, setCreatingUser] = useState(false);

  const { isSuperAdmin, role, updateEnabledModules, refreshClan, activeWorkspaceId, refreshWorkspaces } = useAccess();
  const router = useRouter();

  const isSuper = isSuperAdmin || role === "super_admin";
  const hasAccess = isSuper || role === "admin";

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace("/");
    }
  }, [loading, hasAccess, router]);

  const loadAllData = async () => {
    try {
      const [clan, ps, membersRes] = await Promise.all([
        clanApi.get(),
        personsApi.getAll().catch(() => []),
        activeWorkspaceId
          ? workspacesApi.getMembers(activeWorkspaceId).catch(() => [])
          : usersApi.getAll().catch(() => []),
      ]);

      if (clan) {
        setForm({
          name: clan.name || "Gia Đình Việt",
          address: clan.address ?? "",
          description: clan.description ?? "",
          enabled: clan.enabled ?? true,
          enabledModules: (clan.enabledModules as string[]) ?? DEFAULT_ENABLED_MODULES,
        });
      }
      if (Array.isArray(ps)) {
        setPersons(ps);
      }
      if (Array.isArray(membersRes)) {
        const normalizedUsers: any[] = membersRes.map((m: any) => ({
          id: m.userId || m.id,
          memberId: m.id,
          phone: m.user?.phone || m.phone || "",
          fullName: m.user?.fullName || m.fullName || "Thành viên",
          role: m.role || "member",
          status: m.user?.status || m.status || "active",
          adminModules: m.adminModules || [],
          personId: m.personId || null,
          person: m.person || null,
        }));
        setUsers(normalizedUsers);

        const initialMap: Record<string, string[]> = {
          community: [],
          finance: [],
          games: [],
        };
        normalizedUsers.forEach((u) => {
          if (u.adminModules && Array.isArray(u.adminModules)) {
            u.adminModules.forEach((cat: string) => {
              if (initialMap[cat]) {
                initialMap[cat].push(u.id);
              }
            });
          }
        });
        setCategoryAdmins(initialMap);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeWorkspaceId]);

  const handleAddCategoryAdmin = (category: string, userId: string) => {
    if (!userId || userId === "none") return;
    setCategoryAdmins((prev) => {
      const currentList = prev[category] ?? [];
      if (currentList.includes(userId)) return prev;
      return {
        ...prev,
        [category]: [...currentList, userId],
      };
    });
  };

  const handleRemoveCategoryAdmin = (category: string, userId: string) => {
    setCategoryAdmins((prev) => {
      const currentList = prev[category] ?? [];
      return {
        ...prev,
        [category]: currentList.filter((id) => id !== userId),
      };
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newPassword.trim() || !newName.trim()) {
      toast.error("Vui lòng điền đầy đủ Số điện thoại, Mật khẩu và Họ tên.");
      return;
    }

    setCreatingUser(true);
    const tid = toast.loading("Đang thêm tài khoản vào tổ chức...");
    try {
      if (activeWorkspaceId) {
        await workspacesApi.addMember(activeWorkspaceId, {
          phone: newPhone.trim(),
          password: newPassword.trim(),
          fullName: newName.trim(),
          role: newRole,
          adminModules: [],
          personId: newPersonId === "none" ? null : newPersonId,
        });
      } else {
        await usersApi.create({
          phone: newPhone.trim(),
          password: newPassword.trim(),
          fullName: newName.trim(),
          role: newRole,
          personId: newPersonId === "none" ? null : newPersonId,
        });
      }

      toast.success("Thêm tài khoản vào tổ chức thành công!", { id: tid });
      setShowAddUser(false);
      setNewPhone("");
      setNewPassword("12345678");
      setNewName("");
      setNewPersonId("none");
      setNewRole("member");
      await loadAllData();
      if (refreshWorkspaces) await refreshWorkspaces();
    } catch (err) {
      toast.error("Không thể thêm tài khoản: " + String(err), { id: tid });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userPhone: string, memberId?: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản [${userPhone}] khỏi tổ chức này?`)) {
      return;
    }

    const tid = toast.loading("Đang xóa thành viên khỏi tổ chức...");
    try {
      if (activeWorkspaceId && memberId) {
        await workspacesApi.removeMember(activeWorkspaceId, memberId);
      } else if (activeWorkspaceId) {
        await workspacesApi.removeMember(activeWorkspaceId, userId);
      } else {
        await usersApi.delete(userId);
      }
      toast.success("Đã xóa thành viên khỏi tổ chức.", { id: tid });
      await loadAllData();
      if (refreshWorkspaces) await refreshWorkspaces();
    } catch (err) {
      toast.error("Xóa thất bại: " + String(err), { id: tid });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuper) return;

    setSaving(true);
    const tid = toast.loading("Đang lưu cấu hình tổ chức...");
    try {
      // 1. Save organization info & module flags
      if (activeWorkspaceId) {
        await workspacesApi.update({
          id: activeWorkspaceId,
          name: form.name,
          address: form.address,
          description: form.description,
          enabled: form.enabled,
          enabledModules: form.enabledModules,
        });
      } else {
        await clanApi.upsert(form);
      }
      if (updateEnabledModules && form.enabledModules) {
        updateEnabledModules(form.enabledModules);
      }
      if (refreshClan) {
        await refreshClan();
      }
      if (refreshWorkspaces) {
        await refreshWorkspaces();
      }

      // 2. Save user module admin assignments
      const updatePromises = users.map((u) => {
        const assignedCategories = (Object.keys(categoryAdmins) as ModuleCategory[]).filter(
          (cat) => categoryAdmins[cat]?.includes(u.id)
        );
        const oldModules = (u.adminModules ?? []).slice().sort().join(",");
        const newModules = assignedCategories.slice().sort().join(",");

        if (oldModules !== newModules) {
          const newRole = u.role === "super_admin" ? "super_admin" : (assignedCategories.length > 0 ? "admin" : "member");
          return usersApi.update(u.id, {
            adminModules: assignedCategories,
            role: newRole,
          });
        }
        return null;
      }).filter(Boolean);

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      toast.success("Đã lưu thông tin tổ chức & phân quyền quản trị", { id: tid });
    } catch (err) {
      toast.error("Lưu thất bại: " + String(err), { id: tid });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading message="Đang tải cấu hình tổ chức & hệ thống..." />;

  if (!hasAccess) {
    return null;
  }

  const manageableCategories: ModuleCategory[] = ["community", "finance", "games"];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        {/* Scrollable form body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!isSuper && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Bạn đang xem với quyền <strong>Quản trị viên phân hệ</strong>. Chỉ tài khoản <strong>Super Admin</strong> mới có quyền chỉnh sửa cấu hình hệ thống và phân quyền.
                </p>
              </div>
            )}

            {/* Header section */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Cài Đặt Tổ Chức & Hệ Thống</h2>
                <p className="text-xs text-slate-500">
                  Cấu hình thông tin tổ chức, người dùng truy cập và tính năng dùng chung
                </p>
              </div>
            </div>

            {/* Main Section Content WITHOUT OUTER BORDER */}
            <div className="flex flex-col gap-6">
              {/* Thông tin Tổ Chức */}
              <div className="space-y-4">
                <div>
                  <label className="font-medium text-sm text-slate-800">Tên tổ chức / Tiêu đề hiển thị *</label>
                  <Input
                    required
                    disabled={!isSuper}
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ví dụ: Họ Đỗ Quảng Tái, CLB Doanh Nhân, Hội Đồng Hương..."
                    className="mt-1"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tên tổ chức đại diện hiển thị ở thanh điều hướng và đầu trang.
                  </p>
                </div>

                <div>
                  <label className="font-medium text-sm text-slate-800">Địa chỉ trụ sở / Địa điểm sinh hoạt</label>
                  <Input
                    disabled={!isSuper}
                    value={form.address ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value || null }))}
                    placeholder="Ví dụ: Làng Quảng Tái, Xã Ứng Hòa, Hà Nội"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="font-medium text-sm text-slate-800">Giới thiệu & Mô tả tổ chức</label>
                  <Textarea
                    disabled={!isSuper}
                    value={form.description ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Tóm tắt về lịch sử, mục đích thành lập hoặc thông điệp của tổ chức..."
                    className="mt-1 resize-none"
                  />
                </div>
              </div>

              {/* Quản lý Tài khoản Ứng dụng (App Users) */}
              <div className="border-t pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-semibold text-base text-gray-900">
                        Tài khoản Ứng dụng ({users.length})
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Danh sách tài khoản đăng nhập và phân quyền truy cập hệ thống
                      </p>
                    </div>
                  </div>
                  {isSuper && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddUser(!showAddUser)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm tài khoản</span>
                    </Button>
                  )}
                </div>

                {/* Form thêm tài khoản mới */}
                {showAddUser && isSuper && (
                  <div className="bg-slate-50 border border-teal-200 rounded-2xl p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-teal-900">Cấp mới tài khoản truy cập</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Số điện thoại đăng nhập *</label>
                        <Input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="mt-1 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Mật khẩu khởi tạo *</label>
                        <Input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="12345678"
                          className="mt-1 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Tên hiển thị người dùng *</label>
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="VD: Nguyễn Văn A"
                          className="mt-1 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Vai trò ban đầu</label>
                        <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                          <SelectTrigger className="mt-1 text-xs h-9 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Thành viên</SelectItem>
                            <SelectItem value="admin">Quản trị viên</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700">Liên kết hồ sơ thành viên (Tùy chọn)</label>
                      <Select value={newPersonId} onValueChange={setNewPersonId}>
                        <SelectTrigger className="mt-1 text-xs h-9 bg-white">
                          <SelectValue placeholder="— Chọn thành viên (nếu có) —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Không liên kết (Tài khoản độc lập) —</SelectItem>
                          {persons.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {fullName(p)} {p.generation ? `(Đời ${p.generation})` : ""} {p.phone ? ` - ${p.phone}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddUser(false)}
                        className="text-xs"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingUser}
                        onClick={handleCreateUser}
                        className="text-xs"
                      >
                        {creatingUser ? "Đang tạo..." : "Xác nhận tạo"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Danh sách các tài khoản */}
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Chưa có tài khoản nào được đăng ký.</p>
                  ) : (
                    users.map((u) => {
                      const linkedPerson = persons.find((p) => p.id === u.personId) || u.person;
                      const isUserSuper = u.role === "super_admin";

                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 truncate">
                                {u.fullName || u.phone}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  isUserSuper
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : u.role === "admin"
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {isUserSuper ? "Super Admin" : u.role === "admin" ? "Quản trị viên" : "Thành viên"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span>SĐT: <strong className="text-slate-700">{u.phone}</strong></span>
                              <span>•</span>
                              {linkedPerson ? (
                                <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                                  <LinkIcon className="w-3 h-3" />
                                  <span>Hồ sơ: {fullName(linkedPerson)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Chưa liên kết hồ sơ</span>
                              )}
                            </div>
                          </div>

                          {isSuper && !isUserSuper && (
                            <button
                              type="button"
                              title="Xóa tài khoản này"
                              onClick={() => handleDeleteUser(u.id, u.phone, (u as any).memberId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Phân quyền Quản trị viên Phân hệ (Granular RBAC) */}
              <div className="border-t pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-semibold text-base text-gray-900">
                      Phân quyền Quản trị Phân hệ (Module Leads)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Super Admin chỉ định tài khoản người dùng chuyên trách cho từng nhóm tính năng
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {manageableCategories.map((catKey) => {
                    const cat = CATEGORIES[catKey];
                    const currentAdminIds = categoryAdmins[catKey] ?? [];
                    const assignedUsers = users.filter((u) => currentAdminIds.includes(u.id));
                    const unassignedUsers = users.filter((u) => !currentAdminIds.includes(u.id));

                    return (
                      <div
                        key={catKey}
                        className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {cat.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}
                          >
                            {assignedUsers.length} quản trị viên
                          </span>
                        </div>

                        <p className="text-xs text-slate-500">{cat.description}</p>

                        {/* List of current assigned admins */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {assignedUsers.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                              Chưa chỉ định quản trị viên (Mặc định Super Admin quản lý)
                            </span>
                          ) : (
                            assignedUsers.map((u) => (
                              <span
                                key={u.id}
                                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                <span>{u.fullName || u.phone}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({u.phone})</span>
                                {isSuper && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCategoryAdmin(catKey, u.id)}
                                    className="w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Add new admin selector from users */}
                        {isSuper && unassignedUsers.length > 0 && (
                          <div className="pt-2 flex items-center gap-2">
                            <Select
                              onValueChange={(val) => {
                                if (val && val !== "none") {
                                  handleAddCategoryAdmin(catKey, val);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full text-xs h-9 bg-white">
                                <SelectValue placeholder={`+ Chọn tài khoản làm quản trị cho ${cat.name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— Chọn tài khoản —</SelectItem>
                                {unassignedUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.fullName || u.phone} ({u.phone}) {u.role === "super_admin" ? "- Super Admin" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quản lý Phân hệ & Modules On/Off (Feature Flag System) */}
              <div className="border-t pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-semibold text-base text-gray-900">Quản lý Bật / Tắt Modules</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Bật hoặc tắt từng tính năng để tối ưu hóa theo mô hình từng tổ chức
                      </p>
                    </div>
                  </div>
                </div>

                {(Object.keys(CATEGORIES) as ModuleCategory[]).map((catKey) => {
                  const cat = CATEGORIES[catKey];
                  const catModules = SYSTEM_MODULES.filter((m) => m.category === catKey);
                  if (catModules.length === 0) return null;

                  const enabledCount = catModules.filter((m) =>
                    form.enabledModules?.includes(m.id)
                  ).length;

                  return (
                    <div
                      key={catKey}
                      className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}
                        >
                          {enabledCount} / {catModules.length} đang bật
                        </span>
                      </div>

                      <div className="space-y-2.5 divide-y divide-slate-100">
                        {catModules.map((m) => {
                          const isEnabled = form.enabledModules?.includes(m.id) ?? false;
                          const isCoreSettings = m.id === "settings";

                          return (
                            <div
                              key={m.id}
                              className="pt-2.5 first:pt-0 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {m.href}
                                  </span>
                                  {isCoreSettings && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-medium">
                                      Hệ thống cốt lõi
                                    </span>
                                  )}
                                  {m.status === "coming_soon" && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-medium">
                                      Sắp ra mắt
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {m.description}
                                </p>
                              </div>
                              <Switch
                                disabled={!isSuper || isCoreSettings}
                                checked={isEnabled || isCoreSettings}
                                onCheckedChange={(checked) => {
                                  if (isCoreSettings) return;
                                  const current = form.enabledModules ?? DEFAULT_ENABLED_MODULES;
                                  const next = checked
                                    ? Array.from(new Set([...current, m.id]))
                                    : current.filter((id) => id !== m.id);
                                  setForm((prev) => ({ ...prev, enabledModules: next }));
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quyền truy cập toàn hệ thống */}
              {isSuper && (
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="font-medium text-sm text-slate-800">Cho phép truy cập hệ thống</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tắt để chuyển hệ thống sang chế độ bảo trì, chỉ Super Admin mới truy cập được</p>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm((prev) => ({ ...prev, enabled: v }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar for Save Button */}
        {isSuper && (
          <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-8 py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 hidden sm:inline-block">
                Các thay đổi sẽ được cập nhật và đồng bộ theo thời gian thực ngay sau khi lưu.
              </span>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-w-[160px] h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md cursor-pointer ml-auto"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
