"use client";

import React from "react";

interface AnimatedLoadingDotsProps {
  className?: string;
  dotClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function AnimatedLoadingDots({
  className = "",
  dotClassName = "bg-teal-600",
  size = "md",
}: AnimatedLoadingDotsProps) {
  const sizeClass = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 py-1 ${className}`}
      aria-label="Đang tải..."
      role="status"
    >
      <span
        className={`${sizeClass} rounded-full ${dotClassName} animate-bounce`}
        style={{ animationDelay: "-0.32s", animationDuration: "1s" }}
      />
      <span
        className={`${sizeClass} rounded-full ${dotClassName} animate-bounce`}
        style={{ animationDelay: "-0.16s", animationDuration: "1s" }}
      />
      <span
        className={`${sizeClass} rounded-full ${dotClassName} animate-bounce`}
        style={{ animationDelay: "0s", animationDuration: "1s" }}
      />
    </span>
  );
}

export default AnimatedLoadingDots;
