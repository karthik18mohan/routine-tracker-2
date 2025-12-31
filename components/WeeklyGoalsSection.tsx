"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function WeeklyGoalsSection() {
  const month = useAppStore((state) =>
    state.selectedUserId
      ? state.monthsByUser[state.selectedUserId]?.[
          `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`
        ]
      : undefined
  );
  const addWeeklyGoal = useAppStore((state) => state.addWeeklyGoal);
  const toggleWeeklyGoal = useAppStore((state) => state.toggleWeeklyGoal);
  const removeWeeklyGoal = useAppStore((state) => state.removeWeeklyGoal);
  const [weekFilter, setWeekFilter] = useState("ALL");
  const [goalText, setGoalText] = useState("");
  const [goalWeek, setGoalWeek] = useState("1");

  const filteredGoals = useMemo(() => {
    if (!month) {
      return [];
    }
    if (weekFilter === "ALL") {
      return month.weeklyGoals;
    }
    return month.weeklyGoals.filter((goal) => goal.week === Number(weekFilter));
  }, [month, weekFilter]);

  if (!month) {
    return null;
  }

  return (
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="section-title">Weekly Goals</p>
        <select
          className="border border-gridLine bg-white px-3 py-2 text-xs uppercase tracking-[0.2em]"
          value={weekFilter}
          onChange={(event) => setWeekFilter(event.target.value)}
        >
          <option value="ALL">All Weeks</option>
          {[1, 2, 3, 4, 5].map((week) => (
            <option key={`goal-week-${week}`} value={String(week)}>
              Week {week}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filteredGoals.length === 0 && (
          <p className="text-sm text-slate-500">No goals set yet. Add one below.</p>
        )}
        {filteredGoals.map((goal) => (
          <div
            key={goal.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-gridLine pb-2 text-sm"
          >
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={goal.done ?? false}
                onChange={() => toggleWeeklyGoal(goal.id)}
              />
              <span className={goal.done ? "line-through text-slate-400" : ""}>
                {goal.text}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-gridLine px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Week {goal.week}
              </span>
              <button
                className="text-[10px] uppercase tracking-[0.2em] text-rose-400"
                onClick={() => removeWeeklyGoal(goal.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-gridLine pt-3">
        <input
          className="flex-1 border border-gridLine bg-white px-3 py-2 text-sm"
          placeholder="Add a weekly goal"
          value={goalText}
          onChange={(event) => setGoalText(event.target.value)}
        />
        <select
          className="border border-gridLine bg-white px-3 py-2 text-xs uppercase tracking-[0.2em]"
          value={goalWeek}
          onChange={(event) => setGoalWeek(event.target.value)}
        >
          {[1, 2, 3, 4, 5].map((week) => (
            <option key={`goal-select-${week}`} value={String(week)}>
              Week {week}
            </option>
          ))}
        </select>
        <button
          className="rounded-full border border-gridLine px-4 py-2 text-xs uppercase tracking-[0.2em]"
          onClick={() => {
            if (!goalText.trim()) {
              return;
            }
            addWeeklyGoal(Number(goalWeek), goalText);
            setGoalText("");
          }}
        >
          Add Goal
        </button>
      </div>
    </div>
  );
}
