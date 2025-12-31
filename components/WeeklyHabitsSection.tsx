"use client";

import { useMemo, useState } from "react";
import { ProgressDonut } from "@/components/ProgressDonut";
import { useAppStore } from "@/store/useAppStore";
import { calculateMonthMetrics } from "@/lib/metrics";

export function WeeklyHabitsSection() {
  const month = useAppStore((state) =>
    state.months[`${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`]
  );
  const toggleWeeklyCheck = useAppStore((state) => state.toggleWeeklyCheck);
  const [selectedWeek, setSelectedWeek] = useState("ALL");

  const metrics = useMemo(() => (month ? calculateMonthMetrics(month) : null), [month]);

  if (!month || !metrics) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="card flex flex-col items-center gap-4 p-4">
        <p className="section-title">Weekly Habits</p>
        <ProgressDonut
          percent={metrics.weeklyProgress}
          label="Weekly"
          sublabel={`${Math.round(metrics.weeklyProgress)}%`}
        />
        <div className="w-full">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Select Week
          </label>
          <select
            className="mt-2 w-full border border-gridLine bg-white px-3 py-2 text-xs"
            value={selectedWeek}
            onChange={(event) => setSelectedWeek(event.target.value)}
          >
            <option value="ALL">ALL</option>
            {[1, 2, 3, 4, 5].map((week) => (
              <option key={week} value={String(week)}>
                WEEK {week}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="card overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-headerBlue text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="border border-gridLine px-2 py-2 text-left">Habit</th>
              {[1, 2, 3, 4, 5].map((week) => (
                <th
                  key={`week-head-${week}`}
                  className={`border border-gridLine px-2 py-2 text-center ${
                    selectedWeek !== "ALL" && selectedWeek !== String(week)
                      ? "text-slate-300"
                      : ""
                  }`}
                >
                  Week {week}
                </th>
              ))}
              <th className="border border-gridLine px-2 py-2 text-center">Others</th>
            </tr>
          </thead>
          <tbody>
            {month.weeklyHabits.map((habit) => (
              <tr key={habit.id}>
                <td className="border border-gridLine px-2 py-2 text-left">
                  {habit.name}
                </td>
                {habit.checksByWeek.map((checked, idx) => {
                  const weekNumber = idx + 1;
                  const muted =
                    selectedWeek !== "ALL" && selectedWeek !== String(weekNumber);
                  return (
                    <td
                      key={`${habit.id}-${idx}`}
                      className={`border border-gridLine px-2 py-2 text-center ${
                        muted ? "text-slate-300" : ""
                      }`}
                    >
                      <button
                        className={`mx-auto flex h-7 w-7 items-center justify-center border border-gridLine ${
                          checked ? "bg-checkFill" : "bg-white"
                        }`}
                        onClick={() => toggleWeeklyCheck(habit.id, idx)}
                      >
                        {checked ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
                <td className="border border-gridLine px-2 py-2 text-center text-slate-300">
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
