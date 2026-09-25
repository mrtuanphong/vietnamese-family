"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  WalletCards,
  Plus,
  QrCode,
  HeartHandshake,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { fundsApi } from "@/lib/api";
import type { Fund } from "@/types";
import { formatVND } from "@/lib/utils";
import { PaymentModal } from "@/components/finance/PaymentModal";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageLoading } from "@/components/ui/PageLoading";

export default function FundsPage() {
  const { isSuperAdmin, canManageFinance } = useAccess();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [isOnlyDonate, setIsOnlyDonate] = useState<boolean>(false);

  // Create/Edit fund modal
  const [showFundModal, setShowFundModal] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [fundName, setFundName] = useState("");
  const [fundDesc, setFundDesc] = useState("");
  const [amountPerCycle, setAmountPerCycle] = useState("500000");
  const [cycleName, setCycleName] = useState("Hàng năm (1 năm / lần)");
  const [currentCycle, setCurrentCycle] = useState("Năm 2026");
  const [bankName, setBankName] = useState("MB");
  const [bankAccount, setBankAccount] = useState("0988889999");
  const [accountHolder, setAccountHolder] = useState("THU QUY DONG HO");
  const [submitting, setSubmitting] = useState(false);

  const canManage = isSuperAdmin || canManageFinance;

  const loadFunds = async () => {
    try {
      const data = await fundsApi.getAll();
      setFunds(data);
    } catch (err) {
      toast.error("Không thể tải danh sách quỹ: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  const totalBalance = funds.reduce((acc, f) => acc + (f.balance || 0), 0);

  const handleOpenPay = (fund: Fund, onlyDonate = false) => {
    setSelectedFund(fund);
    setIsOnlyDonate(onlyDonate);
  };

  const handleOpenCreate = () => {
    setEditingFund(null);
    setFundName("");
    setFundDesc("");
    setAmountPerCycle("500000");
    setCycleName("Hàng năm (1 năm / lần)");
    setCurrentCycle("Năm 2026");
    setBankName("MB");
    setBankAccount("0988889999");
    setAccountHolder("THU QUY DONG HO");
    setShowFundModal(true);
  };

  const handleOpenEdit = (fund: Fund) => {
    setEditingFund(fund);
    setFundName(fund.name);
    setFundDesc(fund.description || "");
    setAmountPerCycle(String(fund.amountPerCycle));
    setCycleName(fund.cycleName);
    setCurrentCycle(fund.currentCycle);
    setBankName(fund.bankName || "MB");
    setBankAccount(fund.bankAccount || "");
    setAccountHolder(fund.accountHolder || "");
    setShowFundModal(true);
  };

  const handleSaveFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundName.trim()) {
      toast.error("Vui lòng nhập tên quỹ.");
      return;
    }

    setSubmitting(true);
    const tid = toast.loading("Đang lưu thông tin quỹ...");
    try {
      if (editingFund) {
        await fundsApi.update(editingFund.id, {
          name: fundName.trim(),
          description: fundDesc.trim(),
          amountPerCycle: Number(amountPerCycle) || 0,
          cycleName,
          currentCycle,
          bankName,
          bankAccount,
          accountHolder,
        });
        toast.success("Đã cập nhật quỹ.", { id: tid });
      } else {
        await fundsApi.create({
          name: fundName.trim(),
          description: fundDesc.trim(),
          amountPerCycle: Number(amountPerCycle) || 0,
          cycleName,
          currentCycle,
          bankName,
          bankAccount,
          accountHolder,
        });
        toast.success("Đã tạo quỹ mới thành công.", { id: tid });
      }
      setShowFundModal(false);
      await loadFunds();
    } catch (err) {
      toast.error("Lưu thất bại: " + String(err), { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFund = async (fundId: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa [${name}]? Quỹ chỉ có thể xóa khi chưa có giao dịch nào.`)) return;

    const tid = toast.loading("Đang xóa...");
    try {
      await fundsApi.delete(fundId);
      toast.success("Đã xóa quỹ.", { id: tid });
      await loadFunds();
    } catch (err) {
      toast.error("Không thể xóa: " + String(err), { id: tid });
    }
  };

  if (loading) {
    return <PageLoading message="Đang tải danh sách quỹ hội nhóm..." />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 sm:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-100 text-teal-700">
                <WalletCards className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Các Quỹ Dòng Họ
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Minh bạch ngân quỹ, tài trợ khuyến học và đóng góp tu bổ từ đường
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 bg-white">
                <span>Xem Sổ cái Thu - Chi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            {canManage && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="text-xs h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo quỹ mới</span>
              </Button>
            )}
          </div>
        </div>

        {/* Thống kê Tổng Ngân Quỹ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white p-5 rounded-3xl shadow-md sm:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-teal-100 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-teal-300" />
                Tổng Tài Sản Các Quỹ Dòng Họ
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
                {formatVND(totalBalance)}
              </div>
            </div>
            <p className="text-xs text-teal-100/90 mt-3 pt-3 border-t border-teal-500/40">
              Ngân quỹ minh bạch, phục vụ việc họ, hiếu hỷ, khuyến học và trùng tu từ đường
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Số lượng quỹ hoạt động
              </span>
              <div className="text-3xl font-black text-slate-800 mt-2">{funds.length} Quỹ</div>
            </div>
            <div className="text-xs text-teal-700 bg-teal-50 p-2.5 rounded-xl border border-teal-100 mt-2 font-medium">
              Tích hợp sẵn tạo mã VietQR động đóng quỹ 24/7
            </div>
          </div>
        </div>

        {/* Danh sách các Quỹ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funds.map((fund) => (
            <div
              key={fund.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {fund.cycleName}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{fund.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Chu kỳ: <strong className="text-slate-700">{fund.currentCycle}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Số dư quỹ</span>
                    <span className="text-lg font-black text-teal-700">
                      {formatVND(fund.balance)}
                    </span>
                  </div>
                </div>

                {fund.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    {fund.description}
                  </p>
                )}

                <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
                  <span className="text-slate-600">Mức đóng chuẩn:</span>
                  <span className="font-bold text-slate-900">
                    {fund.amountPerCycle > 0 ? `${formatVND(fund.amountPerCycle)} / kỳ` : "Tùy tâm tài trợ"}
                  </span>
                </div>

                {fund.bankAccount && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>Thủ quỹ: <strong className="text-slate-700">{fund.accountHolder}</strong></span>
                    <span className="font-mono text-teal-700 font-semibold">{fund.bankName} - {fund.bankAccount}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleOpenPay(fund, false)}
                    className="h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Nộp quỹ (VietQR)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPay(fund, true)}
                    className="h-10 bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 rounded-xl text-xs font-bold gap-1.5 transition-all cursor-pointer"
                  >
                    <HeartHandshake className="w-4 h-4 text-amber-600" />
                    <span>Công đức / Ủng hộ</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href={`/transactions?fundId=${fund.id}`}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                  >
                    <span>Xem lịch sử thu - chi của quỹ này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(fund)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="Chỉnh sửa quỹ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFund(fund.id, fund.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Xóa quỹ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Tạo/Sửa Quỹ */}
        {showFundModal && canManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">
                  {editingFund ? "Chỉnh sửa thông tin quỹ" : "Thêm Quỹ Mới Dòng Họ"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFund} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Tên quỹ *</label>
                  <Input
                    required
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    placeholder="VD: Quỹ Khuyến Học Dòng Họ"
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Mục đích / Diễn giải</label>
                  <Textarea
                    value={fundDesc}
                    onChange={(e) => setFundDesc(e.target.value)}
                    placeholder="Mục đích huy động, sử dụng quỹ..."
                    rows={2}
                    className="mt-1 text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Mức đóng tiêu chuẩn (VNĐ)</label>
                    <Input
                      type="number"
                      value={amountPerCycle}
                      onChange={(e) => setAmountPerCycle(e.target.value)}
                      placeholder="500000"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Tên chu kỳ thu</label>
                    <Input
                      value={cycleName}
                      onChange={(e) => setCycleName(e.target.value)}
                      placeholder="Hàng năm (1 năm / lần)"
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Mã ngân hàng</label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="MB / VCB / TCB..."
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Số tài khoản nhận</label>
                    <Input
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="0988889999"
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Tên chủ tài khoản thủ quỹ</label>
                  <Input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="THU QUY DONG HO"
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFundModal(false)}
                    className="text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {submitting ? "Đang lưu..." : "Lưu thông tin"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Nộp Quỹ */}
        {selectedFund && (
          <PaymentModal
            fund={selectedFund}
            isOpen={!!selectedFund}
            onClose={() => setSelectedFund(null)}
            isOnlyDonate={isOnlyDonate}
            onPaymentSuccess={loadFunds}
          />
        )}
      </main>
    </div>
  );
}
