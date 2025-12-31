"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { ProgressDonut } from "@/components/ProgressDonut";
import { StackedProgressBar } from "@/components/StackedProgressBar";
import { HabitGrid } from "@/components/HabitGrid";
import { ProgressTable } from "@/components/ProgressTable";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { TopHabitsTable } from "@/components/TopHabitsTable";
import { WeeklyHabitsSection } from "@/components/WeeklyHabitsSection";
import { ExportImportControls } from "@/components/ExportImportControls";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { calculateMonthMetrics } from "@/lib/metrics";
import { monthOptions } from "@/lib/date";

const DailyCompletionChart = dynamic(
  () => import("@/components/DailyCompletionChart").then((mod) => mod.DailyCompletionChart),
  { ssr: false }
);

export default function DashboardPage() {
  const month = useAppStore((state) =>
    state.months[`${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`]
  );
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const ensureMonth = useAppStore((state) => state.ensureMonth);

  useEffect(() => {
    ensureMonth(selectedYear, selectedMonth);
  }, [ensureMonth, selectedMonth, selectedYear]);

  if (!month) {
    return null;
  }

  const metrics = calculateMonthMetrics(month);
  const dailyGoal = month.dailyGoalTarget;
  const incomplete = metrics.totalPossible - metrics.completed;

  const stackedSegments = metrics.perHabitStats.map((stat, index) => ({
    value: stat.count,
    color: ["#d8c7ff", "#f9b5c8", "#b8e0d2", "#f8d7a8", "#b5d0ff"][
      index % 5
    ]
  }));

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="card flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serifDisplay text-4xl uppercase tracking-[0.4em] text-slate-700">
                {monthOptions[selectedMonth - 1]}
              </h1>
              <p className="mt-2 text-xs uppercase tracking-[0.4em] text-slate-500">
                Habit Tracker Dashboard
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <MonthYearPicker />
              <ExportImportControls />
              <Link
                href="/monthly"
                className="rounded-full border border-gridLine px-4 py-1 text-xs uppercase tracking-[0.2em]"
              >
                Monthly View
              </Link>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[220px_1fr_220px]">
            <div className="card flex flex-col justify-center gap-2 bg-white p-4 text-xs">
              <p className="section-title">Month</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="border border-gridLine p-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    Month
                  </p>
                  <p className="text-lg font-semibold text-slate-700">
                    {String(selectedMonth).padStart(2, "0")}
                  </p>
                </div>
                <div className="border border-gridLine p-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    Year
                  </p>
                  <p className="text-lg font-semibold text-slate-700">
                    {selectedYear}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4">
              <p className="section-title text-center">Overall Progress</p>
              <StackedProgressBar segments={stackedSegments} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Progress</p>
                <p className="text-3xl font-semibold text-slate-700">
                  {Math.round(metrics.progressPct)}%
                </p>
                <p className="text-xs text-slate-500">
                  HABITS {metrics.completed}/{metrics.totalPossible}
                </p>
              </div>
              <ProgressDonut
                percent={metrics.progressPct}
                size={100}
                stroke={10}
                label="Habits"
                sublabel={`${metrics.completed}/${metrics.totalPossible}`}
              />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <HabitGrid />
            <ProgressTable stats={metrics.perHabitStats} daysInMonth={metrics.daysInMonth} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr_320px]">
          <DailySummaryCard
            percent={metrics.progressPct}
            completed={metrics.completed}
            incomplete={incomplete}
            dailyGoal={dailyGoal}
          />
          <DailyCompletionChart
            data={metrics.dailyCounts.map((count, index) => ({ day: index + 1, count }))}
          />
          <TopHabitsTable habits={metrics.topHabits} />
        </section>

        <section className="space-y-4">
          <WeeklyHabitsSection />
        </section>
      </div>
    </main>
  );
}
