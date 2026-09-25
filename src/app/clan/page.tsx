"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/PageLoading";

export default function ClanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/community/settings");
  }, [router]);

  return <PageLoading message="Đang chuyển hướng tới Thiết lập dòng họ..." />;
}
