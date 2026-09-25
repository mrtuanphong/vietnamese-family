"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  HeartHandshake,
  Receipt,
  Plus,
  Filter,
  X,
  ExternalLink,
  WalletCards,
  Calendar,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { transactionsApi, fundsApi } from "@/lib/api";
import type { Transaction, Fund } from "@/types";
import { formatVND } from "@/lib/utils";
import { useAccess } from "@/lib/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageLoading } from "@/components/ui/PageLoading";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const initialFundId = searchParams.get("fundId") || "ALL";

  const { isSuperAdmin, canManageFinance } = useAccess();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFundId, setSelectedFundId] = useState<string>(initialFundId);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE" | "DONATION">("ALL");
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  // Create transaction modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formFundId, setFormFundId] = useState<string>("");
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [formCategory, setFormCategory] = useState<string>("CYCLE_FEE");
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formActorName, setFormActorName] = useState("");
  const [formActorPhone, setFormActorPhone] = useState("");
  const [formReceiptUrl, setFormReceiptUrl] = useState("");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canManage = isSuperAdmin || canManageFinance;

  const loadData = async () => {
    try {
      const [txList, fundList] = await Promise.all([
        transactionsApi.getAll(),
        fundsApi.getAll(),
      ]);
      setTransactions(txList);
      setFunds(fundList);
      if (fundList.length > 0 && !formFundId) {
        setFormFundId(fundList[0].id);
      }
    } catch (err) {
      toast.error("Không thể tải dữ liệu: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedFundId !== "ALL" && tx.fundId !== selectedFundId) return false;
      if (typeFilter === "INCOME") return tx.type === "INCOME" && tx.category !== "DONATION";
      if (typeFilter === "EXPENSE") return tx.type === "EXPENSE";
      if (typeFilter === "DONATION") return tx.category === "DONATION";
      return true;
    });
  }, [transactions, selectedFundId, typeFilter]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDonations = transactions
    .filter((t) => t.category === "DONATION")
    .reduce((acc, t) => acc + t.amount, 0);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFundId || !formTitle.trim() || !formAmount || !formActorName.trim()) {
      toast.error("Vui lòng điền đủ các thông tin bắt buộc.");
      return;
    }

    setSubmitting(true);
    const tid = toast.loading("Đang lập phiếu giao dịch...");
    try {
      const categoryNames: Record<string, string> = {
        CYCLE_FEE: "Đóng quỹ thường niên",
        DONATION: "Công đức / Ủng hộ",
        EVENT_EXPENSE: "Chi giỗ chạp / Lễ hội",
        VISIT_GIFT: "Thăm hỏi / Hiếu hỷ",
        SCHOLARSHIP: "Khen thưởng khuyến học",
        RENOVATION: "Tu bổ từ đường",
      };

      await transactionsApi.create({
        fundId: formFundId,
        type: formType,
        category: formCategory,
        categoryName: categoryNames[formCategory] || "Hoạt động dòng họ",
        title: formTitle.trim(),
        amount: Number(formAmount),
        actorName: formActorName.trim(),
        actorPhone: formActorPhone.trim() || null,
        receiptUrl: formReceiptUrl.trim() || null,
        note: formNote.trim() || null,
        isDonationSeparate: formCategory === "DONATION",
      });

      toast.success("Đã ghi nhận phiếu giao dịch thành công!", { id: tid });
      setShowCreateModal(false);
      setFormTitle("");
      setFormAmount("");
      setFormActorName("");
      setFormActorPhone("");
      setFormReceiptUrl("");
      setFormNote("");
      await loadData();
    } catch (err) {
      toast.error("Lập phiếu thất bại: " + String(err), { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn hủy phiếu [${title}]? Số dư quỹ tương ứng sẽ được tự động hoàn lại.`)) {
      return;
    }

    const tid = toast.loading("Đang hủy phiếu...");
    try {
      await transactionsApi.delete(id);
      toast.success("Đã xóa giao dịch và hoàn nguyên số dư quỹ.", { id: tid });
      await loadData();
    } catch (err) {
      toast.error("Không thể xóa: " + String(err), { id: tid });
    }
  };

  if (loading) {
    return <PageLoading message="Đang tải sổ cái thu - chi..." />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 sm:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Sổ Cái Thu - Chi Dòng Họ
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Minh bạch dòng tiền, hóa đơn chứng từ và lịch sử công đức
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/funds">
              <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5 bg-white">
                <WalletCards className="w-3.5 h-3.5" />
                <span>Quản lý Quỹ</span>
              </Button>
            </Link>

            {canManage && (
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="text-xs h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Lập phiếu thu / chi</span>
              </Button>
            )}
          </div>
        </div>

        {/* Thẻ Thống Kê 3 Cột */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white border border-emerald-200/90 p-4 rounded-3xl shadow-2xs">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Tổng thu thường niên
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              {formatVND(totalIncome - totalDonations)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tiền đóng quỹ nghĩa vụ hàng năm</p>
          </div>

          <div className="bg-white border border-amber-200/90 p-4 rounded-3xl shadow-2xs">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              Tổng công đức / Ủng hộ
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
              {formatVND(totalDonations)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tài trợ khuyến học & tu bổ từ đường</p>
          </div>

          <div className="bg-white border border-rose-200/90 p-4 rounded-3xl shadow-2xs">
            <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Tổng các khoản đã chi
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
              {formatVND(totalExpense)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Có kèm chứng từ / hóa đơn đối soát</p>
          </div>
        </div>

        {/* Bộ lọc Quỹ và Loại Giao Dịch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Lọc theo Quỹ */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 shrink-0">Lọc theo quỹ:</span>
            <Select value={selectedFundId} onValueChange={setSelectedFundId}>
              <SelectTrigger className="w-52 h-8 text-xs bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả các quỹ ({funds.length})</SelectItem>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo Loại */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "INCOME", label: "Tiền thu" },
              { key: "DONATION", label: "Công đức" },
              { key: "EXPENSE", label: "Khoản chi" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTypeFilter(item.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  typeFilter === item.key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách giao dịch */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              Không có giao dịch nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const isDonation = tx.category === "DONATION";

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isIncome
                            ? isDonation
                              ? "bg-amber-50 text-amber-600 border border-amber-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}
                      >
                        {isIncome ? (
                          isDonation ? (
                            <HeartHandshake className="w-5 h-5" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5" />
                          )
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-snug">
                          {tx.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-1">
                          <span className="font-medium text-slate-700">{tx.actorName}</span>
                          <span>•</span>
                          <span>{new Date(tx.createdAt || "").toLocaleDateString("vi-VN")}</span>
                          <span>•</span>
                          <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            {tx.fund?.name || "Quỹ dòng họ"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm md:text-base font-black block ${
                          isIncome ? "text-emerald-600" : "text-slate-900"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatVND(tx.amount)}
                      </span>
                      <span className="text-[10px] md:text-xs text-slate-400 font-medium">
                        {tx.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Note & Receipt button */}
                  {(tx.note || tx.receiptUrl || canManage) && (
                    <div className="bg-slate-50/90 rounded-2xl p-2.5 px-3.5 text-xs flex items-center justify-between border border-slate-100 gap-2">
                      <p className="text-[11px] md:text-xs text-slate-600 line-clamp-1 flex-1">
                        {tx.note || "Giao dịch đã được ghi nhận vào hệ thống."}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        {tx.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setViewReceipt(tx.receiptUrl!)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Xem chứng từ</span>
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id, tx.title)}
                            title="Xóa phiếu thu/chi này"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Xem Ảnh Hóa Đơn / Biên Lai */}
        {viewReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Ảnh hóa đơn / Biên lai chứng từ thực tế
                </span>
                <button
                  type="button"
                  onClick={() => setViewReceipt(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-[70vh] bg-slate-100 flex items-center justify-center">
                <img
                  src={viewReceipt}
                  alt="Hóa đơn chứng từ"
                  className="w-full h-auto max-h-[65vh] object-contain"
                />
              </div>

              <p className="text-xs text-slate-500 text-center">
                Ảnh chụp hóa đơn / biên nhận chuyển khoản do Ban quản lý quỹ dòng họ tải lên để công khai minh bạch
              </p>
            </div>
          </div>
        )}

        {/* Modal Lập Phiếu Thu / Chi Mới (Dành cho Thủ quỹ / Admin) */}
        {showCreateModal && canManage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">
                  Lập Phiếu Thu / Chi Dòng Họ Mới
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
                {/* Chọn Quỹ & Loại giao dịch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Chọn quỹ dòng họ *</label>
                    <Select value={formFundId} onValueChange={setFormFundId}>
                      <SelectTrigger className="mt-1 text-xs">
                        <SelectValue placeholder="— Chọn quỹ —" />
                      </SelectTrigger>
                      <SelectContent>
                        {funds.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Loại phiếu *</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("INCOME");
                          setFormCategory("CYCLE_FEE");
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          formType === "INCOME"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        + Phiếu Thu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormType("EXPENSE");
                          setFormCategory("EVENT_EXPENSE");
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          formType === "EXPENSE"
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        - Phiếu Chi
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danh mục thu/chi */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Danh mục thu / chi</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formType === "INCOME" ? (
                        <>
                          <SelectItem value="CYCLE_FEE">Đóng quỹ thường niên</SelectItem>
                          <SelectItem value="DONATION">Công đức / Tài trợ tùy tâm</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="EVENT_EXPENSE">Chi giỗ chạp / Lễ tết</SelectItem>
                          <SelectItem value="SCHOLARSHIP">Khen thưởng khuyến học</SelectItem>
                          <SelectItem value="RENOVATION">Tu bổ từ đường / Lăng mộ</SelectItem>
                          <SelectItem value="VISIT_GIFT">Thăm hỏi / Hiếu hỷ</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tiêu đề & Số tiền */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Tiêu đề diễn giải *</label>
                    <Input
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="VD: Gia đình bác Đỗ Văn An đóng quỹ 2026"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Số tiền (VNĐ) *</label>
                    <Input
                      type="number"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="500000"
                      className="mt-1 text-xs font-bold text-teal-700"
                    />
                  </div>
                </div>

                {/* Người nộp / Người nhận */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {formType === "INCOME" ? "Họ tên người nộp *" : "Người chi trả / Thủ quỹ *"}
                    </label>
                    <Input
                      required
                      value={formActorName}
                      onChange={(e) => setFormActorName(e.target.value)}
                      placeholder="VD: Đỗ Văn An"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Số điện thoại liên hệ</label>
                    <Input
                      value={formActorPhone}
                      onChange={(e) => setFormActorPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* Link ảnh hóa đơn / biên nhận */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Đường dẫn ảnh hóa đơn / Chứng từ (URL)
                  </label>
                  <Input
                    value={formReceiptUrl}
                    onChange={(e) => setFormReceiptUrl(e.target.value)}
                    placeholder="https://... (Ảnh chụp biên lai, hóa đơn đỏ, hợp đồng...)"
                    className="mt-1 text-xs font-mono"
                  />
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Ghi chú thêm</label>
                  <Textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Chi tiết nội dung, số biên nhận..."
                    rows={2}
                    className="mt-1 text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? "Đang lưu..." : "Xác nhận tạo phiếu"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
