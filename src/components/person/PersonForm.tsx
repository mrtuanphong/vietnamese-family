"use client";

import { useState } from "react";
import type { Person, Gender, UserRole } from "@/types";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type PersonFormData = Omit<Person, "id">;

interface PersonFormProps {
  initial?: Partial<Person>;
  defaultLastName?: string;
  clanLastName?: string | null;
  placeSuggestions?: string[];
  onSubmit: (data: PersonFormData) => Promise<void>;
  onCancel: () => void;
  formId?: string;
  hideButtons?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

interface DateParts {
  year: string;
  month: string;
  day: string;
}

function parseDateParts(dateStr: string | null | undefined): DateParts {
  if (!dateStr) return { year: "", month: "", day: "" };
  const [y, m, d] = dateStr.split("-");
  return { year: y ?? "", month: m ?? "", day: d ?? "" };
}

function buildDateString(parts: DateParts): string {
  if (!parts.month || !parts.day) {
    if (!parts.year) return "";
    return parts.year;
  }
  const y = parts.year || "0001";
  return `${y}-${parts.month.padStart(2, "0")}-${parts.day.padStart(2, "0")}`;
}

function buildDeathDateString(parts: DateParts): string {
  if (!parts.month || !parts.day) return "";
  const y = parts.year || "0001";
  const m = parts.month.padStart(2, "0");
  const d = parts.day.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDeathDateParts(dateStr: string | null | undefined): DateParts {
  if (!dateStr) return { year: "", month: "", day: "" };
  const [y, m, d] = dateStr.split("-");
  return { year: y ?? "", month: m ?? "", day: d ?? "" };
}

function makeEmpty(defaultLastName?: string): PersonFormData {
  return {
    firstName: "",
    lastName: defaultLastName ?? "",
    middleName: "",
    gender: "male",
    birthDate: "",
    birthPlace: "",
    deathPlace: "",
    phone: "",
    currentAddress: "",
    photoUrl: "",
    bio: "",
    generation: null,
    childOrder: null,
    isClanMember: true,
    deathDateLunar: null,
    role: "member",
    password: "12345678",
  };
}

export default function PersonForm({ initial, defaultLastName, clanLastName, placeSuggestions = [], onSubmit, onCancel, formId, hideButtons, onLoadingChange }: PersonFormProps) {
  const { canEditClan } = useAccess();
  const [form, setForm] = useState<PersonFormData>({
    ...makeEmpty(defaultLastName),
    ...initial,
    role: initial?.role || "member",
    password: initial?.password || "12345678",
  });
  const [birthParts, setBirthParts] = useState<DateParts>(() => parseDateParts(initial?.birthDate));
  const [deathParts, setDeathParts] = useState<DateParts>(() =>
    parseDeathDateParts(initial?.deathDateLunar)
  );
  const [loading, setLoading] = useState(false);

  const set = (field: keyof PersonFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onLoadingChange?.(true);
    try {
      await onSubmit({
        ...form,
        birthDate: buildDateString(birthParts) || "",
        deathDateLunar: buildDeathDateString(deathParts) || null,
      });
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Tabs defaultValue="basic">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1">Cơ bản</TabsTrigger>
          <TabsTrigger value="places" className="flex-1">Địa điểm</TabsTrigger>
          <TabsTrigger value="other" className="flex-1">Thông tin khác</TabsTrigger>
        </TabsList>

        {/* ── Cơ bản ── */}
        <TabsContent value="basic" className="flex flex-col gap-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium block mb-1">Họ</label>
              <Input value={form.lastName} onChange={set("lastName")} placeholder={clanLastName ?? "Nguyễn"} />
            </div>
            <div>
              <label className="font-medium block mb-1">Đệm</label>
              <Input value={form.middleName ?? ""} onChange={set("middleName")} placeholder="Văn" />
            </div>
            <div>
              <label className="font-medium block mb-1">Tên *</label>
              <Input required value={form.firstName} onChange={set("firstName")} placeholder="An" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium block mb-1">Giới tính *</label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm((prev) => ({ ...prev, gender: v as Gender }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="unknown">Không rõ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="font-medium block mb-1">Thứ tự con trong gia đình</label>
              <Input
                type="number"
                min={1}
                value={form.childOrder ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    childOrder: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                placeholder="VD: 1 (con cả)"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="font-medium">Thành viên trong dòng họ</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tắt nếu là Dâu hoặc Rể</p>
            </div>
            <Switch
              checked={form.isClanMember !== false}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, isClanMember: v }))}
            />
          </div>

          <div>
            <label className="font-medium block mb-1">Ngày sinh <span className="text-muted-foreground font-normal">(Dương lịch)</span></label>
            <div className="flex gap-1.5">
              <Input className="flex-1 min-w-0" type="number" min={1} max={31} value={birthParts.day} onChange={(e) => setBirthParts({ ...birthParts, day: e.target.value })} placeholder="Ngày" />
              <Input className="flex-1 min-w-0" type="number" min={1} max={12} value={birthParts.month} onChange={(e) => setBirthParts({ ...birthParts, month: e.target.value })} placeholder="Tháng" />
              <Input className="flex-1 min-w-0" type="number" min={1} max={9999} value={birthParts.year} onChange={(e) => setBirthParts({ ...birthParts, year: e.target.value })} placeholder="Năm" />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 [&_input]:bg-background">
            <label className="font-medium block mb-1">Ngày mất (Âm lịch)</label>
            <div className="flex gap-1.5">
              <Input className="flex-1 min-w-0" type="number" min={1} max={31} value={deathParts.day} onChange={(e) => setDeathParts({ ...deathParts, day: e.target.value })} placeholder="Ngày" />
              <Input className="flex-1 min-w-0" type="number" min={1} max={12} value={deathParts.month} onChange={(e) => setDeathParts({ ...deathParts, month: e.target.value })} placeholder="Tháng" />
              <Input className="flex-1 min-w-0" type="number" min={1} max={9999} value={deathParts.year} onChange={(e) => setDeathParts({ ...deathParts, year: e.target.value })} placeholder="Năm" />
            </div>
          </div>

          <div>
            <label className="font-medium block mb-1 text-muted-foreground">Đời (thế hệ)</label>
            <Input
              type="text"
              value={form.generation != null ? `Đời ${form.generation}` : ""}
              disabled
              placeholder="Tự động tính toán"
              className="bg-muted text-muted-foreground"
            />
          </div>
        </TabsContent>

        {/* ── Địa điểm ── */}
        <TabsContent value="places" className="flex flex-col gap-4 mt-4">
          <div>
            <label className="font-medium block mb-1">Nơi sinh</label>
            <Input value={form.birthPlace ?? ""} onChange={set("birthPlace")} placeholder="Xã, huyện, tỉnh..." />
          </div>

          <div>
            <label className="font-medium block mb-1">Địa chỉ thường trú</label>
            <Input value={form.currentAddress ?? ""} onChange={set("currentAddress")} placeholder="Xã, huyện, tỉnh..." />
          </div>

          <div>
            <label className="font-medium block mb-1">Nơi mất</label>
            <Input value={form.deathPlace ?? ""} onChange={set("deathPlace")} placeholder="Xã, huyện, tỉnh..." />
          </div>
        </TabsContent>

        {/* ── Thông tin khác ── */}
        <TabsContent value="other" className="flex flex-col gap-4 mt-4">
          <div>
            <label className="font-medium block mb-1">Số điện thoại</label>
            <Input value={form.phone ?? ""} onChange={set("phone")} type="tel" placeholder="0912 345 678" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="font-medium block mb-1">Vai trò (Phân quyền)</label>
              <Select
                value={form.role ?? "member"}
                onValueChange={(v) => setForm((prev) => ({ ...prev, role: v as UserRole }))}
                disabled={form.role === "super_admin"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Thành viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  {form.role === "super_admin" && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                {form.role === "super_admin" ? "Tài khoản Super Admin tối cao" : "Quyền hạn truy cập của thành viên"}
              </p>
            </div>

            <div>
              <label className="font-medium block mb-1">Mật khẩu</label>
              <Input
                type="text"
                value={form.password ?? "12345678"}
                onChange={set("password")}
                placeholder="12345678"
              />
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                Tự động điền sẵn 12345678 (có thể sửa)
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <label className="font-medium block mb-1">Tiểu sử</label>
            <Textarea value={form.bio ?? ""} onChange={set("bio")} className="resize-none h-32" />
          </div>
        </TabsContent>
      </Tabs>

      {!hideButtons && (
        <div className="flex gap-2 pt-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
            Huỷ
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
            {loading ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      )}
    </form>
  );
}
