"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Phone, ShieldCheck } from "lucide-react";
import { UserRole } from "@/types";

interface LoginGateProps {
  clanName: string;
  onGranted: (authData: {
    role: UserRole;
    name: string;
    personId: string;
    phone: string;
    editablePersonIds: string[];
    canEditClan: boolean;
    canEditTree: boolean;
  }) => void;
}

export default function LoginGate({ clanName, onGranted }: LoginGateProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: account.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.granted) {
        onGranted({
          role: data.role,
          name: data.name ?? "",
          personId: data.personId ?? "",
          phone: data.phone ?? account.trim(),
          editablePersonIds: data.editablePersonIds ?? [],
          canEditClan: !!data.canEditClan,
          canEditTree: !!data.canEditTree,
        });
      } else {
        setError(data.error || "Số điện thoại hoặc mật khẩu không chính xác.");
      }
    } catch {
      setError("Lỗi kết nối máy chủ, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 border border-brand-100 shadow-xs">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{clanName}</h1>
          <p className="text-sm text-gray-500 mt-1">Đăng nhập tài khoản để vào hệ thống</p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={account}
                  onChange={(e) => {
                    setAccount(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập số điện thoại"
                  autoFocus
                  required
                  className="pr-10"
                />
                <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Nhập mật khẩu"
                  required
                  className="pr-10"
                />
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium leading-relaxed">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? "Đang xác thực..." : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
