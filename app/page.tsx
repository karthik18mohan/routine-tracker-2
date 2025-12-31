"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { ProgressDonut } from "@/components/ProgressDonut";
import { HabitGrid } from "@/components/HabitGrid";
import { ProgressTable } from "@/components/ProgressTable";
import { TopHabitsTable } from "@/components/TopHabitsTable";
import { WeeklyHabitsSection } from "@/components/WeeklyHabitsSection";
import { WeeklyGoalsSection } from "@/components/WeeklyGoalsSection";
import { MoodJournalCard } from "@/components/MoodJournalCard";
import { MoodLineChart } from "@/components/MoodLineChart";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { UserPicker } from "@/components/UserPicker";
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
    state.selectedUserId
      ? state.monthsByUser[state.selectedUserId]?.[
          `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`
        ]
      : undefined
  );
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const ensureMonth = useAppStore((state) => state.ensureMonth);
  const isMonthLoading = useAppStore((state) => state.isMonthLoading);

  useEffect(() => {
    ensureMonth(selectedYear, selectedMonth);
  }, [ensureMonth, selectedMonth, selectedYear]);

  if (!month) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
          <div className="card p-6 text-center text-sm text-slate-500">
            {isMonthLoading ? "Loading your habits..." : "No habit data available yet."}
          </div>
        </div>
      </main>
    );
  }

  const metrics = calculateMonthMetrics(month);
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;
  const todayIndex = isCurrentMonth ? today.getDate() - 1 : null;
  const dailyTotal = month.dailyHabits.length;
  const dailyCompleted =
    todayIndex === null
      ? 0
      : month.dailyHabits.reduce((sum, habit) => {
          const checked = month.checks[habit.id]?.[todayIndex] ?? false;
          return sum + (checked ? 1 : 0);
        }, 0);
  const dailyProgressPct =
    dailyTotal === 0 ? 0 : (dailyCompleted / dailyTotal) * 100;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="card flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serifDisplay text-3xl uppercase tracking-[0.2em] text-slate-700 sm:text-4xl sm:tracking-[0.4em]">
                {monthOptions[selectedMonth - 1]}
              </h1>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs sm:tracking-[0.4em]">
                Habit Tracker Dashboard
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <MonthYearPicker />
              <UserPicker />
              <Link
                href="/monthly"
                className="rounded-full border border-gridLine px-4 py-1 text-xs uppercase tracking-[0.2em]"
              >
                Monthly View
              </Link>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:ml-auto lg:max-w-[520px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Daily Progress
                </p>
                <p className="text-3xl font-semibold text-slate-700">
                  {Math.round(dailyProgressPct)}%
                </p>
                <p className="text-xs text-slate-500">
                  HABITS {dailyCompleted}/{dailyTotal}
                </p>
              </div>
              <ProgressDonut
                percent={dailyProgressPct}
                size={100}
                stroke={10}
                label="Today"
                sublabel={`${dailyCompleted}/${dailyTotal}`}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Overall Progress
                </p>
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

        <section className="space-y-6">
          <HabitGrid />
          <ProgressTable stats={metrics.perHabitStats} daysInMonth={metrics.daysInMonth} />
          <MoodJournalCard />
          <DailySummaryCard
            percent={dailyProgressPct}
            completed={dailyCompleted}
            incomplete={Math.max(dailyTotal - dailyCompleted, 0)}
            dailyGoal={month.dailyGoalTarget}
          />
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-2">
          <DailyCompletionChart
            data={metrics.dailyCounts.map((count, index) => ({ day: index + 1, count }))}
          />
          <MoodLineChart
            data={month.moodByDay.map((mood, index) => ({ day: index + 1, mood }))}
          />
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <WeeklyGoalsSection />
          <TopHabitsTable habits={metrics.topHabits} />
        </section>

        <section className="space-y-4">
          <WeeklyHabitsSection />
        </section>
      </div>
    </main>
  );
}
