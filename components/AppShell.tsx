"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { UserOnboarding } from "@/components/UserOnboarding";

export function AppShell({ children }: { children: React.ReactNode }) {
  const selectedUserId = useAppStore((state) => state.selectedUserId);
  const setSelectedMonthYear = useAppStore((state) => state.setSelectedMonthYear);
  const initializeSupabase = useAppStore((state) => state.initializeSupabase);
  const supabaseReady = useAppStore((state) => state.supabaseReady);
  const supabaseError = useAppStore((state) => state.supabaseError);

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

  return (
    <>
      {supabaseError && (
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 md:px-8">
          <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Supabase sync issue</p>
            <p className="mt-1">{supabaseError}</p>
            <p className="mt-2 text-xs text-amber-800">
              Ensure your tables are publicly accessible or RLS is disabled for this project.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
