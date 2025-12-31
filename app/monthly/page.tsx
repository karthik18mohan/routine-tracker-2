"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { MonthlyHabitsView } from "@/components/MonthlyHabitsView";
import { useAppStore } from "@/store/useAppStore";
import { monthOptions } from "@/lib/date";

export default function MonthlyPage() {
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const ensureMonth = useAppStore((state) => state.ensureMonth);

  useEffect(() => {
    ensureMonth(selectedYear, selectedMonth);
  }, [ensureMonth, selectedMonth, selectedYear]);

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <header className="card flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serifDisplay text-4xl uppercase tracking-[0.4em] text-slate-700">
                {monthOptions[selectedMonth - 1]}
              </h1>
              <p className="mt-2 text-xs uppercase tracking-[0.4em] text-slate-500">
                Monthly Habits & Goals
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <MonthYearPicker />
              <Link
                href="/"
                className="rounded-full border border-gridLine px-4 py-1 text-xs uppercase tracking-[0.2em]"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </header>
        <MonthlyHabitsView />
      </div>
    </main>
  );
}
