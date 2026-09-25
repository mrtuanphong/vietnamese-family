"use client";

import React, { useState } from "react";
import { X, QrCode, CheckCircle2, HeartHandshake, Copy, Check, Sparkles } from "lucide-react";
import type { Fund } from "@/types";
import { formatVND } from "@/lib/utils";
import { transactionsApi } from "@/lib/api";
import { toast } from "sonner";
import { useAccess } from "@/lib/AccessContext";

interface PaymentModalProps {
  fund: Fund;
  isOpen: boolean;
  onClose: () => void;
  isOnlyDonate?: boolean;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  fund,
  isOpen,
  onClose,
  isOnlyDonate = false,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { name: currentUserName, phone: currentUserPhone } = useAccess();

  const [selectedCycles, setSelectedCycles] = useState<number>(isOnlyDonate ? 0 : 1);
  const [customDonation, setCustomDonation] = useState<number>(0);
  const [senderName, setSenderName] = useState<string>(currentUserName || "");
  const [note, setNote] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);

  if (!isOpen) return null;

  const cycleFeeTotal = selectedCycles * fund.amountPerCycle;
  const grandTotal = cycleFeeTotal + customDonation;

  const quickDonations = [200000, 500000, 1000000, 2000000];

  const cleanFundCode = fund.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

  const cleanName = (senderName || "THANHVIEN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  const transferSyntax = `${cleanFundCode} ${cleanName} ${Math.round(grandTotal / 1000)}K`;

  const bankName = fund.bankName || "MB";
  const bankAccount = fund.bankAccount || "0988889999";
  const accountHolder = fund.accountHolder || "THU QUY DONG HO";

  const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(
    transferSyntax
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  const handleCopySyntax = () => {
    navigator.clipboard.writeText(transferSyntax);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmPaid = async () => {
    if (grandTotal <= 0) {
      toast.error("Vui lòng chọn số kỳ hoặc số tiền ủng hộ lớn hơn 0.");
      return;
    }

    setRecording(true);
    try {
      // Auto-record the transaction in the system
      const category = isOnlyDonate || customDonation > 0 && selectedCycles === 0
        ? "DONATION"
        : "CYCLE_FEE";
      const categoryName = category === "DONATION" ? "Công đức / Ủng hộ" : "Đóng quỹ thường niên";

      await transactionsApi.create({
        fundId: fund.id,
        type: "INCOME",
        category,
        categoryName,
        title: `${senderName || "Thành viên"} đóng ${categoryName.toLowerCase()} (${fund.name})`,
        amount: grandTotal,
        actorName: senderName || "Thành viên dòng họ",
        actorPhone: currentUserPhone || null,
        note: note || `Chuyển khoản VietQR: ${transferSyntax}`,
        isDonationSeparate: customDonation > 0,
      });

      setSubmitted(true);
      toast.success("Đã ghi nhận giao dịch vào sổ cái quỹ!");
      onPaymentSuccess?.();

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err) {
      toast.error("Không thể ghi nhận: " + String(err));
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {isOnlyDonate ? "Công đức / Ủng hộ quỹ" : "Nộp Quỹ & Đóng Góp"}
            </h3>
            <p className="text-xs text-teal-600 font-semibold">{fund.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-lg text-slate-900">Đã ghi nhận đóng quỹ thành công!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thông tin nộp quỹ của bạn đã được cập nhật tự động vào sổ cái thu - chi của dòng họ.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Tên người đóng góp */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Họ & Tên người đóng góp *
              </label>
              <input
                type="text"
                placeholder="VD: Đỗ Văn An (Chi 2)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="mt-1 w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Mục 1: Chọn kỳ nộp quỹ */}
            {!isOnlyDonate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    1. Mức đóng tiêu chuẩn ({formatVND(fund.amountPerCycle)}/kỳ)
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((cycles) => (
                    <button
                      key={cycles}
                      type="button"
                      onClick={() => setSelectedCycles(cycles)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                        selectedCycles === cycles
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cycles} kỳ ({Math.round((cycles * fund.amountPerCycle) / 1000)}k)
                    </button>
                  ))}
                </div>
                {selectedCycles > 1 && (
                  <p className="text-[11px] text-teal-600 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đóng trước {selectedCycles - 1} chu kỳ tiếp theo
                  </p>
                )}
              </div>
            )}

            {/* Mục 2: Khoản ủng hộ thêm / Công đức tùy tâm */}
            <div className="space-y-2.5 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <HeartHandshake className="w-4 h-4 text-amber-600" />
                <span>2. Công đức / Ủng hộ thêm (Tùy tâm)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Ghi danh bảng vàng công đức cho các dịp lễ hội, khuyến học hoặc tôn tạo từ đường.
              </p>

              {/* Gợi ý nhanh */}
              <div className="grid grid-cols-4 gap-1.5">
                {quickDonations.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCustomDonation(amount)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all ${
                      customDonation === amount
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50"
                    }`}
                  >
                    +{amount >= 1000000 ? `${amount / 1000000}Tr` : `${amount / 1000}k`}
                  </button>
                ))}
              </div>

              {/* Ô nhập số tiền tùy chọn */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Hoặc tự nhập số tiền ủng hộ (đ)"
                  value={customDonation > 0 ? customDonation : ""}
                  onChange={(e) => setCustomDonation(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {customDonation > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomDonation(0)}
                    className="text-xs text-amber-700 font-semibold px-2 py-1"
                  >
                    Xóa
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Lời nhắn / Ý nguyện (VD: Cúng dường tiền hoa quả giỗ tổ...)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Mục 3: Tổng cộng & Mã VietQR */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs text-slate-400">Tổng tiền chuyển khoản:</span>
                <span className="text-lg font-extrabold text-amber-400">
                  {formatVND(grandTotal)}
                </span>
              </div>

              {/* Thông tin tài khoản nhận */}
              <div className="text-xs space-y-1 bg-slate-800/70 p-2.5 rounded-xl border border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="font-semibold text-slate-200">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="font-mono font-bold text-teal-300">{bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-200 uppercase">{accountHolder}</span>
                </div>
              </div>

              {/* Mã VietQR */}
              <div className="bg-white p-3 rounded-xl text-center">
                <img
                  src={qrUrl}
                  alt="Mã VietQR"
                  className="w-48 h-48 mx-auto object-contain rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã
                </p>
              </div>

              {/* Cú pháp chuyển khoản */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-[10px] text-slate-400 block">Nội dung chuyển khoản chuẩn:</span>
                  <span className="font-mono font-bold text-amber-300 truncate block">
                    {transferSyntax}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySyntax}
                  className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-lg text-[11px] text-white font-medium shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            {/* Nút hành động hoàn tất */}
            <button
              type="button"
              disabled={grandTotal <= 0 || recording}
              onClick={handleConfirmPaid}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{recording ? "Đang ghi nhận..." : `Xác nhận đã chuyển ${formatVND(grandTotal)}`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
