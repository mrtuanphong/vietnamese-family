"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({
  message = "Đang tải dữ liệu...",
  className = "",
}: PageLoadingProps) {
  return (
    <div className={`flex-1 bg-white flex items-center justify-center py-24 ${className}`}>
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

export default PageLoading;
