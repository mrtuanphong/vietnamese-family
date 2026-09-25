"use client";

import React from "react";

export interface DevBadgeProps {
  label?: string;
  size?: "xs" | "sm" | "md";
  pulse?: boolean;
  className?: string;
  title?: string;
}

export function DevBadge({
  label = "DEV",
  size = "md",
  pulse = true,
  className = "",
  title = "Môi trường phát triển & thử nghiệm",
}: DevBadgeProps) {
  const sizeConfig = {
    xs: {
      container: "px-1.5 py-0.2 text-[8px] gap-1",
      dot: "w-1 h-1",
    },
    sm: {
      container: "px-2 py-0.5 text-[9px] gap-1",
      dot: "w-1.5 h-1.5",
    },
    md: {
      container: "px-2.5 py-0.5 text-[10px] gap-1.5",
      dot: "w-1.5 h-1.5",
    },
  }[size];

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs select-none ${sizeConfig.container} ${className}`}
    >
      <span
        className={`rounded-full bg-amber-500 shrink-0 ${sizeConfig.dot} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <span className="tracking-wider leading-none">{label}</span>
    </span>
  );
}

export default DevBadge;
