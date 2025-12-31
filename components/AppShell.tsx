"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { UserOnboarding } from "@/components/UserOnboarding";

export function AppShell({ children }: { children: React.ReactNode }) {
  const selectedUserId = useAppStore((state) => state.selectedUserId);
  const setSelectedMonthYear = useAppStore((state) => state.setSelectedMonthYear);
  const initializeSupabase = useAppStore((state) => state.initializeSupabase);
  const supabaseReady = useAppStore((state) => state.supabaseReady);

  useEffect(() => {
    const today = new Date();
    setSelectedMonthYear(today.getFullYear(), today.getMonth() + 1);
  }, [setSelectedMonthYear]);

  useEffect(() => {
    initializeSupabase();
  }, [initializeSupabase]);

  if (!supabaseReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
        <div className="card w-full max-w-md p-6 text-center text-sm text-slate-500">
          Connecting to your workspace...
        </div>
      </main>
    );
  }

  if (!selectedUserId) {
    return <UserOnboarding />;
  }

  return <>{children}</>;
}
