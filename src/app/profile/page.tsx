"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from "react";
import { useAccess } from "@/lib/AccessContext";
import { usersApi, personsApi } from "@/lib/api";
import { AppUser, Person, UserRole } from "@/types";
import { toast } from "sonner";
import {
  User,
  KeyRound,
  Building2,
  Phone,
  Mail,
  Save,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Layers,
  Info,
  Heart,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/PageLoading";

export default function ProfilePage() {
  const {
    userId,
    personId: contextPersonId,
    name: contextName,
    phone: contextPhone,
    role: contextRole,
    isSuperAdmin,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    updateCurrentUser,
  } = useAccess();

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPerson, setSavingPerson] = useState(false);
  const [linkingPerson, setLinkingPerson] = useState(false);

  // Full User Data from API
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [personsList, setPersonsList] = useState<Person[]>([]);

  // Account Form State
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    avatarUrl: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Linked Person Form State
  const [personForm, setPersonForm] = useState<{
    id?: string;
    lastName: string;
    middleName: string;
    firstName: string;
    gender: "male" | "female" | "unknown";
    birthDate: string;
    birthPlace: string;
    phone: string;
    currentAddress: string;
    photoUrl: string;
    bio: string;
    generation?: number | null;
    childOrder?: number | null;
  }>({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "male",
    birthDate: "",
    birthPlace: "",
    phone: "",
    currentAddress: "",
    photoUrl: "",
    bio: "",
  });

  const [selectedPersonToLink, setSelectedPersonToLink] = useState("");

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [u, allPersons] = await Promise.all([
        usersApi.getOne(userId).catch(() => null),
        personsApi.getAll().catch(() => []),
      ]);

      if (u) {
        setUserData(u);
        setAccountForm({
          fullName: u.fullName || "",
          phone: u.phone || "",
          email: u.email || "",
          avatarUrl: u.avatarUrl || "",
        });

        if (u.person) {
          const p = u.person as Person;
          setPersonForm({
            id: p.id,
            lastName: p.lastName || "",
            middleName: p.middleName || "",
            firstName: p.firstName || "",
            gender: (p.gender as any) || "male",
            birthDate: p.birthDate || "",
            birthPlace: p.birthPlace || "",
            phone: p.phone || "",
            currentAddress: p.currentAddress || "",
            photoUrl: p.photoUrl || "",
            bio: p.bio || "",
            generation: p.generation,
            childOrder: p.childOrder,
          });
        }
      }

      setPersonsList(allPersons);
    } catch (err) {
      console.error("Lỗi khi tải thông tin hồ sơ:", err);
      toast.error("Không thể tải thông tin hồ sơ người dùng.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Account Update
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!accountForm.fullName.trim()) {
      toast.error("Vui lòng nhập Họ và tên.");
      return;
    }
    if (!accountForm.phone.trim()) {
      toast.error("Vui lòng nhập Số điện thoại.");
      return;
    }

    setSavingAccount(true);
    const tid = toast.loading("Đang lưu thông tin tài khoản...");
    try {
      const updated = await usersApi.update(userId, {
        fullName: accountForm.fullName.trim(),
        phone: accountForm.phone.trim(),
        email: accountForm.email.trim() || undefined,
        avatarUrl: accountForm.avatarUrl.trim() || undefined,
      });

      setUserData(updated);
      updateCurrentUser({
        name: updated.fullName,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl || undefined,
      });

      toast.success("Cập nhật thông tin tài khoản thành công!", { id: tid });
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật tài khoản thất bại.", { id: tid });
    } finally {
      setSavingAccount(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!passwordForm.currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSavingPassword(true);
    const tid = toast.loading("Đang cập nhật mật khẩu...");
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đổi mật khẩu thất bại.");
      }

      toast.success("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.", { id: tid });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Đổi mật khẩu thất bại.", { id: tid });
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Linked Person Update
  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPersonId = personForm.id || userData?.personId || contextPersonId;
    if (!currentPersonId) {
      toast.error("Tài khoản chưa được liên kết với hồ sơ thành viên nào.");
      return;
    }

    if (!personForm.firstName.trim()) {
      toast.error("Vui lòng nhập Tên thành viên.");
      return;
    }

    setSavingPerson(true);
    const tid = toast.loading("Đang lưu thông tin phả hệ...");
    try {
      const updatedPerson = await personsApi.update(currentPersonId, {
        lastName: personForm.lastName.trim(),
        middleName: personForm.middleName.trim() || null,
        firstName: personForm.firstName.trim(),
        gender: personForm.gender,
        birthDate: personForm.birthDate.trim() || null,
        birthPlace: personForm.birthPlace.trim() || null,
        phone: personForm.phone.trim() || null,
        currentAddress: personForm.currentAddress.trim() || null,
        photoUrl: personForm.photoUrl.trim() || null,
        bio: personForm.bio.trim() || null,
      });

      // Update full name in account if desired
      const fullNameCombined = [
        updatedPerson.lastName,
        updatedPerson.middleName,
        updatedPerson.firstName,
      ]
        .filter(Boolean)
        .join(" ");

      setPersonForm({
        id: updatedPerson.id,
        lastName: updatedPerson.lastName || "",
        middleName: updatedPerson.middleName || "",
        firstName: updatedPerson.firstName || "",
        gender: (updatedPerson.gender as any) || "male",
        birthDate: updatedPerson.birthDate || "",
        birthPlace: updatedPerson.birthPlace || "",
        phone: updatedPerson.phone || "",
        currentAddress: updatedPerson.currentAddress || "",
        photoUrl: updatedPerson.photoUrl || "",
        bio: updatedPerson.bio || "",
        generation: updatedPerson.generation,
        childOrder: updatedPerson.childOrder,
      });

      toast.success("Cập nhật hồ sơ phả hệ thành công!", { id: tid });
    } catch (err: any) {
      toast.error(err.message || "Cập nhật hồ sơ thất bại.", { id: tid });
    } finally {
      setSavingPerson(false);
    }
  };

  // Handle Linking Account to an Existing Person
  const handleLinkPerson = async () => {
    if (!userId || !selectedPersonToLink) {
      toast.error("Vui lòng chọn hồ sơ thành viên cần liên kết.");
      return;
    }

    setLinkingPerson(true);
    const tid = toast.loading("Đang liên kết hồ sơ gia phả...");
    try {
      const updated = await usersApi.update(userId, {
        personId: selectedPersonToLink,
      });

      setUserData(updated);
      updateCurrentUser({
        personId: selectedPersonToLink,
        name: updated.fullName,
      });

      await loadProfile();
      toast.success("Đã liên kết hồ sơ thành công!", { id: tid });
    } catch (err: any) {
      toast.error(err.message || "Liên kết hồ sơ thất bại.", { id: tid });
    } finally {
      setLinkingPerson(false);
    }
  };

  const getRoleBadge = (role?: UserRole | string | null, isSuper?: boolean) => {
    if (isSuper || role === "super_admin") {
      return {
        label: "Super Admin",
        color: "bg-brand-100 text-brand-800 border-brand-200",
        desc: "Toàn quyền quản trị hệ thống, cài đặt tổ chức, phân quyền và duyệt thành viên.",
      };
    }
    if (role === "admin") {
      return {
        label: "Quản trị viên",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        desc: "Quản lý phân hệ được giao quyền (Gia phả hoặc Sổ quỹ).",
      };
    }
    return {
      label: "Thành viên",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      desc: "Xem thông tin chung và chỉnh sửa hồ sơ bản thân, vợ/chồng, con cái.",
    };
  };

  const roleInfo = getRoleBadge(userData?.role || contextRole, isSuperAdmin);
  const displayName = accountForm.fullName || contextName || "Thành viên";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const linkedPerson = userData?.person as Person | undefined;

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <PageLoading message="Đang tải thông tin cá nhân..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* 1. Header Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {accountForm.avatarUrl ? (
              <img
                src={accountForm.avatarUrl}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/40 shadow-lg bg-brand-700"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl font-black shadow-lg text-white">
                {avatarLetter}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-white text-brand-700 p-1.5 rounded-full shadow-md">
              <UserCheck size={14} />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                {displayName}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/15 text-white border-white/30 backdrop-blur-xs`}>
                {roleInfo.label}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Đang hoạt động
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-brand-100/90">
              <div className="flex items-center gap-1.5">
                <Phone size={13} className="opacity-80" />
                <span>{accountForm.phone || contextPhone || "Chưa có SĐT"}</span>
              </div>
              {accountForm.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="opacity-80" />
                  <span>{accountForm.email}</span>
                </div>
              )}
              {linkedPerson && (
                <div className="flex items-center gap-1.5">
                  <Heart size={13} className="opacity-80 text-rose-300" />
                  <span>
                    Đời thứ {linkedPerson.generation ?? "—"}
                    {linkedPerson.childOrder ? ` (Con thứ ${linkedPerson.childOrder})` : ""}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-brand-100/80 leading-relaxed max-w-xl pt-0.5">
              {roleInfo.desc}
            </p>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-[-20px] bottom-[-30px] text-white/5 text-9xl font-black select-none pointer-events-none">
          🏛️
        </div>
      </div>

      {/* 2. Main Tabs View */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 sm:inline-flex w-full sm:w-auto h-auto">
          <TabsTrigger
            value="account"
            className="flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-xs"
          >
            <User size={15} />
            <span>Tài khoản &amp; Bảo mật</span>
          </TabsTrigger>
          <TabsTrigger
            value="genealogy"
            className="flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-xs"
          >
            <Layers size={15} />
            <span>Hồ sơ phả hệ</span>
          </TabsTrigger>
          <TabsTrigger
            value="workspaces"
            className="flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-xs"
          >
            <Building2 size={15} />
            <span>Tổ chức ({workspaces.length || 1})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TÀI KHOẢN & BẢO MẬT */}
        <TabsContent value="account" className="space-y-6">
          {/* Card: Thông tin tài khoản đăng nhập */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Thông tin tài khoản</h2>
                  <p className="text-xs text-slate-500">Cập nhật họ tên, số điện thoại và email cá nhân</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Họ và tên hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={accountForm.fullName}
                    onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số điện thoại đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder="0912345678"
                    required
                    className="h-10 text-sm rounded-xl font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dùng để đăng nhập vào toàn bộ hệ thống.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Địa chỉ Email liên hệ
                  </label>
                  <Input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="nguyenvana@gmail.com"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Đường dẫn ảnh đại diện (Avatar URL)
                  </label>
                  <Input
                    type="url"
                    value={accountForm.avatarUrl}
                    onChange={(e) => setAccountForm({ ...accountForm, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingAccount}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold h-10 px-5 rounded-xl gap-2 shadow-xs cursor-pointer"
                >
                  <Save size={15} />
                  <span>{savingAccount ? "Đang lưu..." : "Lưu thông tin tài khoản"}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Card: Đổi mật khẩu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Đổi mật khẩu</h2>
                  <p className="text-xs text-slate-500">Mật khẩu được mã hóa bảo mật với thuật toán scrypt</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPwd ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                      className="h-10 text-sm rounded-xl pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPwd ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Ít nhất 6 ký tự"
                      required
                      className="h-10 text-sm rounded-xl pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Khuyến nghị kết hợp chữ cái và số để tăng cường tính bảo mật.
                </span>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-10 px-5 rounded-xl gap-2 shadow-xs cursor-pointer ml-auto"
                >
                  <Lock size={15} />
                  <span>{savingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu mới"}</span>
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* TAB 2: HỒ SƠ PHẢ HỆ CÁ NHÂN */}
        <TabsContent value="genealogy" className="space-y-6">
          {linkedPerson ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      Hồ sơ phả hệ thành viên
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đã liên kết với:{" "}
                      <span className="font-semibold text-brand-700">
                        {[linkedPerson.lastName, linkedPerson.middleName, linkedPerson.firstName]
                          .filter(Boolean)
                          .join(" ")}
                      </span>{" "}
                      (Đời thứ {linkedPerson.generation ?? "—"})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã liên kết phả hệ
                  </span>
                </div>
              </div>

              <form onSubmit={handleSavePerson} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Họ <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={personForm.lastName}
                      onChange={(e) => setPersonForm({ ...personForm, lastName: e.target.value })}
                      placeholder="Nguyễn"
                      required
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tên đệm
                    </label>
                    <Input
                      type="text"
                      value={personForm.middleName}
                      onChange={(e) => setPersonForm({ ...personForm, middleName: e.target.value })}
                      placeholder="Văn"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tên chính <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={personForm.firstName}
                      onChange={(e) => setPersonForm({ ...personForm, firstName: e.target.value })}
                      placeholder="An"
                      required
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Giới tính
                    </label>
                    <select
                      value={personForm.gender}
                      onChange={(e) =>
                        setPersonForm({ ...personForm, gender: e.target.value as any })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="unknown">Khác / Chưa rõ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ngày sinh (Dương lịch)
                    </label>
                    <Input
                      type="text"
                      value={personForm.birthDate}
                      onChange={(e) => setPersonForm({ ...personForm, birthDate: e.target.value })}
                      placeholder="YYYY-MM-DD hoặc năm sinh"
                      className="h-10 text-sm rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Số điện thoại cá nhân
                    </label>
                    <Input
                      type="tel"
                      value={personForm.phone}
                      onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })}
                      placeholder="0912345678"
                      className="h-10 text-sm rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nơi sinh / Nguyên quán
                    </label>
                    <Input
                      type="text"
                      value={personForm.birthPlace}
                      onChange={(e) => setPersonForm({ ...personForm, birthPlace: e.target.value })}
                      placeholder="Hà Nội, Việt Nam"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Địa chỉ thường trú hiện nay
                    </label>
                    <Input
                      type="text"
                      value={personForm.currentAddress}
                      onChange={(e) =>
                        setPersonForm({ ...personForm, currentAddress: e.target.value })
                      }
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Đường dẫn ảnh chân dung (Photo URL)
                  </label>
                  <Input
                    type="url"
                    value={personForm.photoUrl}
                    onChange={(e) => setPersonForm({ ...personForm, photoUrl: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tiểu sử / Ghi chú cuộc đời
                  </label>
                  <textarea
                    rows={3}
                    value={personForm.bio}
                    onChange={(e) => setPersonForm({ ...personForm, bio: e.target.value })}
                    placeholder="Đôi nét về sự nghiệp, thành tựu, gia đình hoặc ghi chú tưởng niệm..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingPerson}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold h-10 px-5 rounded-xl gap-2 shadow-xs cursor-pointer"
                  >
                    <Save size={15} />
                    <span>{savingPerson ? "Đang lưu..." : "Lưu hồ sơ phả hệ"}</span>
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
                <Info size={24} className="text-amber-600 shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-sm">Chưa liên kết hồ sơ phả hệ</p>
                  <p className="text-amber-800 leading-relaxed">
                    Tài khoản của bạn hiện tại chưa được gắn với một vị trí thành viên nào trên Cây
                    gia phả. Hãy chọn một hồ sơ thành viên của bạn bên dưới để liên kết ngay.
                  </p>
                </div>
              </div>

              {/* Link selector */}
              <div className="space-y-4 max-w-lg">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn hồ sơ thành viên trong cây gia phả để liên kết:
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    value={selectedPersonToLink}
                    onChange={(e) => setSelectedPersonToLink(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Chọn hồ sơ của bạn trong danh sách --</option>
                    {personsList.map((p) => {
                      const pFullName = [p.lastName, p.middleName, p.firstName]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <option key={p.id} value={p.id}>
                          {pFullName} {p.generation ? `(Đời thứ ${p.generation})` : ""}{" "}
                          {p.phone ? `— SĐT: ${p.phone}` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <Button
                    onClick={handleLinkPerson}
                    disabled={!selectedPersonToLink || linkingPerson}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold h-10 px-4 rounded-xl shrink-0 cursor-pointer"
                  >
                    {linkingPerson ? "Đang liên kết..." : "Xác nhận liên kết"}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  💡 Sau khi liên kết, bạn sẽ có quyền tự chỉnh sửa hồ sơ của mình, vợ/chồng và các
                  con trên cây gia phả.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: TỔ CHỨC & KHÔNG GIAN LÀM VIỆC */}
        <TabsContent value="workspaces" className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Các tổ chức &amp; Dòng họ bạn đang tham gia
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bạn có thể trực tiếp chuyển đổi giữa các không gian làm việc bất kỳ lúc nào.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {workspaces.map((ws) => {
                const isActive = ws.workspaceId === activeWorkspaceId;
                const wsBadge = getRoleBadge(ws.role);

                return (
                  <div
                    key={ws.workspaceId}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      isActive
                        ? "bg-brand-50/50 border-brand-200 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                            🏛️
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 truncate">
                              {ws.workspaceName}
                            </h3>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {ws.workspaceType === "CLAN" ? "Dòng họ / Gia tộc" : "Tổ chức / Hội nhóm"}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white shadow-2xs">
                            Đang hoạt động
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${wsBadge.color}`}>
                          {wsBadge.label}
                        </span>
                        {ws.adminModules && ws.adminModules.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            • Phụ trách: {ws.adminModules.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchWorkspace(ws.workspaceId)}
                        className="w-full text-xs font-semibold h-8 rounded-lg text-brand-700 hover:bg-brand-50 hover:text-brand-800 border-brand-200 cursor-pointer"
                      >
                        Chuyển sang không gian này
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
