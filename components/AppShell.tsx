"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { UserOnboarding } from "@/components/UserOnboarding";

export function AppShell({ children }: { children: React.ReactNode }) {
  const selectedUserId = useAppStore((state) => state.selectedUserId);
  const setSelectedMonthYear = useAppStore((state) => state.setSelectedMonthYear);

  useEffect(() => {
    const today = new Date();
    setSelectedMonthYear(today.getFullYear(), today.getMonth() + 1);
  }, [setSelectedMonthYear]);

  if (!selectedUserId) {
    return <UserOnboarding />;
  }

  return <>{children}</>;
}
