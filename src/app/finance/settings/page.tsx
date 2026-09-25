"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WalletCards,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Calendar,
  CheckCircle2,
  DollarSign,
  Receipt,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { fundsApi, usersApi } from "@/lib/api";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageLoading } from "@/components/ui/PageLoading";
import { formatVND } from "@/lib/utils";
import type { Fund, AppUser } from "@/types";

const POPULAR_BANKS = [
  { code: "MB", name: "MB Bank (Quân Đội)" },
  { code: "VCB", name: "Vietcombank (Ngoại thương)" },
  { code: "TCB", name: "Techcombank (Kỹ thương)" },
  { code: "CTG", name: "VietinBank (Công thương)" },
  { code: "BIDV", name: "BIDV (Đầu tư và Phát triển)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { code: "VIB", name: "VIB (Quốc tế)" },
];

export default function FinanceSettingsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [financeAdmins, setFinanceAdmins] = useState<AppUser[]>([]);
  const [bankName, setBankName] = useState<string>("MB");
  const [bankAccount, setBankAccount] = useState<string>("0988889999");
  const [accountHolder, setAccountHolder] = useState<string>("THU QUY DONG HO");
  const [cycleType, setCycleType] = useState<string>("1_YEAR");
  const [cycleName, setCycleName] = useState<string>("Hàng năm (1 năm / lần)");
  const [amountPerCycle, setAmountPerCycle] = useState<number>(500000);
  const [currentCycle, setCurrentCycle] = useState<string>("Năm 2026");
  const [syncToAllFunds, setSyncToAllFunds] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { isSuperAdmin, role, canManageFinance } = useAccess();
  const router = useRouter();

  const isSuper = isSuperAdmin || role === "super_admin";
  const hasAccess = isSuper || role === "admin" || canManageFinance;

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace("/");
    }
  }, [loading, hasAccess, router]);

  const loadData = async () => {
    try {
      const [fundsData, usersData] = await Promise.all([
        fundsApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
      ]);

      if (Array.isArray(fundsData) && fundsData.length > 0) {
        setFunds(fundsData);
        // Use primary fund info as initial defaults
        const primary = fundsData[0];
        if (primary.bankName) setBankName(primary.bankName);
        if (primary.bankAccount) setBankAccount(primary.bankAccount);
        if (primary.accountHolder) setAccountHolder(primary.accountHolder);
        if (primary.cycleType) setCycleType(primary.cycleType);
        if (primary.cycleName) setCycleName(primary.cycleName);
        if (primary.amountPerCycle) setAmountPerCycle(primary.amountPerCycle);
        if (primary.currentCycle) setCurrentCycle(primary.currentCycle);
      }

      if (Array.isArray(usersData)) {
        const admins = usersData.filter((u) => {
          if (u.role === "super_admin") return true;
          return u.adminModules?.includes("finance") || u.adminModules?.includes("*");
        });
        setFinanceAdmins(admins);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCycleTypeChange = (val: string) => {
    setCycleType(val);
    if (val === "1_YEAR") setCycleName("Hàng năm (1 năm / lần)");
    else if (val === "QUARTER") setCycleName("Hàng quý (3 tháng / lần)");
    else if (val === "MONTH") setCycleName("Hàng tháng (1 tháng / lần)");
    else if (val === "EVENT") setCycleName("Vận động theo sự kiện");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) return;

    if (!bankAccount.trim() || !accountHolder.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin tài khoản ngân hàng.");
      return;
    }

    setSaving(true);
    const tid = toast.loading("Đang lưu thiết lập tài chính...");
    try {
      if (funds.length > 0) {
        const targets = syncToAllFunds ? funds : [funds[0]];
        await Promise.all(
          targets.map((f) =>
            fundsApi.update(f.id, {
              bankName,
              bankAccount: bankAccount.trim(),
              accountHolder: accountHolder.trim().toUpperCase(),
              cycleType,
              cycleName,
              amountPerCycle: Number(amountPerCycle) || 0,
              currentCycle,
            })
          )
        );
      }

      toast.success("Đã lưu thiết lập tài chính & ngân quỹ thành công!", { id: tid });
      await loadData();
    } catch (err) {
      toast.error("Lưu thiết lập thất bại: " + String(err), { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const previewQrUrl = bankAccount
    ? `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${amountPerCycle}&addInfo=DONG%20QUY%20HO`
    : null;

  if (loading) return <PageLoading message="Đang tải thiết lập tài chính..." />;

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        {!isSuper && !canManageFinance && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 mb-5">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Chỉ <strong>Super Admin</strong> hoặc <strong>Thủ quỹ (Quản trị viên Tài Chính)</strong> mới có quyền chỉnh sửa thiết lập này.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 sm:border sm:rounded-xl sm:p-6">
            {/* Header section */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <WalletCards className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Thiết Lập Tài Chính & Ngân Quỹ</h2>
                <p className="text-xs text-slate-500">
                  Cấu hình tài khoản ngân hàng mặc định nhận tiền VietQR, chu kỳ và định mức thu quỹ
                </p>
              </div>
            </div>

            {/* Tài khoản ngân hàng VietQR */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Tài khoản ngân hàng mặc định nhận chuyển khoản VietQR</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-xs text-slate-700">Ngân hàng thụ hưởng *</label>
                  <Select value={bankName} onValueChange={setBankName}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Chọn ngân hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_BANKS.map((b) => (
                        <SelectItem key={b.code} value={b.code}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-medium text-xs text-slate-700">Số tài khoản ngân hàng *</label>
                  <Input
                    required
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="VD: 0988889999"
                    className="mt-1 font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-xs text-slate-700">Tên chủ tài khoản (In hoa không dấu) *</label>
                <Input
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  placeholder="VD: THU QUY DONG HO hoặc DO VAN AN"
                  className="mt-1 font-mono uppercase font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Khớp với tên tài khoản hiển thị trên ứng dụng ngân hàng khi người đóng quét mã QR.
                </p>
              </div>

              {/* QR Code preview */}
              {previewQrUrl && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                    <img
                      src={previewQrUrl}
                      alt="VietQR Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                      <QrCode className="w-3 h-3" />
                      <span>Xem trước mã VietQR tự động</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {accountHolder || "CHỦ TÀI KHOẢN"}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      {bankName} • {bankAccount}
                    </div>
                    <div className="text-xs text-emerald-600 font-semibold">
                      Định mức: {formatVND(amountPerCycle)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chu kỳ đóng góp & Mức thu mặc định */}
            <div className="border-t pt-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Chu kỳ đóng góp & Định mức quỹ mặc định</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-xs text-slate-700">Loại chu kỳ thu quỹ</label>
                  <Select value={cycleType} onValueChange={handleCycleTypeChange}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Chọn chu kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_YEAR">Hàng năm (1 năm / lần)</SelectItem>
                      <SelectItem value="QUARTER">Hàng quý (3 tháng / lần)</SelectItem>
                      <SelectItem value="MONTH">Hàng tháng (1 tháng / lần)</SelectItem>
                      <SelectItem value="EVENT">Vận động theo sự kiện</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-medium text-xs text-slate-700">Mức đóng mặc định (VNĐ) *</label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={amountPerCycle}
                    onChange={(e) => setAmountPerCycle(Number(e.target.value) || 0)}
                    placeholder="500000"
                    className="mt-1 font-bold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Bằng chữ: {formatVND(amountPerCycle)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-medium text-xs text-slate-700">Tên chu kỳ hiện tại</label>
                <Input
                  value={currentCycle}
                  onChange={(e) => setCurrentCycle(e.target.value)}
                  placeholder="VD: Năm 2026 hoặc Niên khóa 2025 - 2026"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Đồng bộ cho tất cả các quỹ */}
            <div className="border-t pt-5 space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70">
                <div>
                  <span className="font-semibold text-xs text-blue-950 block">
                    Đồng bộ thông tin ngân hàng cho toàn bộ các Quỹ hiện có ({funds.length} quỹ)
                  </span>
                  <span className="text-[11px] text-blue-800/80 block mt-0.5">
                    Tất cả các quỹ thành viên sẽ cùng nhận tiền về tài khoản ngân hàng này khi quét VietQR
                  </span>
                </div>
                <Switch
                  checked={syncToAllFunds}
                  onCheckedChange={setSyncToAllFunds}
                />
              </div>
            </div>

            {/* Danh sách Thủ quỹ / Ban Tài chính */}
            <div className="border-t pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Thủ quỹ & Quản trị viên phân hệ Tài Chính ({financeAdmins.length})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Được Super Admin chỉ định quyền lập phiếu thu, lập phiếu chi và quản lý các quỹ
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {financeAdmins.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Chưa chỉ định thủ quỹ riêng (Mặc định Super Admin quản lý).
                  </span>
                ) : (
                  financeAdmins.map((u) => (
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
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold cursor-pointer text-white"
            >
              {saving ? "Đang lưu cấu hình tài chính..." : "Lưu thiết lập tài chính & Ngân quỹ"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
