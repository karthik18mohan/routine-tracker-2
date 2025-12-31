"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDaysInMonth, getWeekOfMonth } from "@/lib/date";
import { useAppStore } from "@/store/useAppStore";

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

const getDayLabel = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const dow = (date.getDay() + 6) % 7;
  return dayLabels[dow];
};

export function HabitGrid() {
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const ensureMonth = useAppStore((state) => state.ensureMonth);
  const month = useAppStore((state) =>
    state.selectedUserId
      ? state.monthsByUser[state.selectedUserId]?.[
          `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`
        ]
      : undefined
  );
  const toggleDailyCheck = useAppStore((state) => state.toggleDailyCheck);
  const renameDailyHabit = useAppStore((state) => state.renameDailyHabit);
  const removeDailyHabit = useAppStore((state) => state.removeDailyHabit);
  const addDailyHabit = useAppStore((state) => state.addDailyHabit);

  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureMonth(selectedYear, selectedMonth);
  }, [ensureMonth, selectedMonth, selectedYear]);

  useEffect(() => {
    const stopDragging = () => {
      setIsDragging(false);
      setDragValue(null);
    };
    window.addEventListener("mouseup", stopDragging);
    return () => window.removeEventListener("mouseup", stopDragging);
  }, []);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;
  const todayIndex = isCurrentMonth ? today.getDate() - 1 : null;

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  const weekSegments = useMemo(() => {
    const segments: { week: number; span: number }[] = [];
    let day = 1;
    while (day <= daysInMonth) {
      const week = getWeekOfMonth(day, selectedYear, selectedMonth);
      let span = 0;
      while (
        day + span <= daysInMonth &&
        getWeekOfMonth(day + span, selectedYear, selectedMonth) === week
      ) {
        span += 1;
      }
      segments.push({ week, span });
      day += span;
    }
    return segments;
  }, [daysInMonth, selectedMonth, selectedYear]);

  useEffect(() => {
    if (todayIndex === null || !month) {
      return;
    }
    const container = gridRef.current;
    if (!container) {
      return;
    }
    requestAnimationFrame(() => {
      const target = container.querySelector<HTMLButtonElement>(
        `[data-row='0'][data-col='${todayIndex}']`
      );
      target?.scrollIntoView({ block: "nearest", inline: "center" });
    });
  }, [todayIndex, selectedMonth, selectedYear, month]);

  if (!month) {
    return null;
  }

  const handleCellToggle = (habitId: string, dayIndex: number) => {
    toggleDailyCheck(habitId, dayIndex);
  };

  const handleCellKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    rowIndex: number,
    colIndex: number,
    habitId: string
  ) => {
    const key = event.key;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      handleCellToggle(habitId, colIndex);
      return;
    }
    let nextRow = rowIndex;
    let nextCol = colIndex;
    if (key === "ArrowRight") {
      nextCol += 1;
    } else if (key === "ArrowLeft") {
      nextCol -= 1;
    } else if (key === "ArrowDown") {
      nextRow += 1;
    } else if (key === "ArrowUp") {
      nextRow -= 1;
    } else {
      return;
    }
    event.preventDefault();
    const target = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-row='${nextRow}'][data-col='${nextCol}']`
    );
    target?.focus();
  };

  const handleMouseDown = (habitId: string, dayIndex: number) => {
    const current = month.checks[habitId]?.[dayIndex] ?? false;
    const nextValue = !current;
    setIsDragging(true);
    setDragValue(nextValue);
    toggleDailyCheck(habitId, dayIndex);
  };

  const handleMouseEnter = (habitId: string, dayIndex: number) => {
    if (!isDragging || dragValue === null) {
      return;
    }
    const current = month.checks[habitId]?.[dayIndex] ?? false;
    if (current !== dragValue) {
      toggleDailyCheck(habitId, dayIndex);
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gridLine bg-panelPink px-4 py-3">
        <div>
          <p className="section-title">Daily Habits</p>
          <p className="text-xs text-slate-500">Click or drag to toggle</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border border-gridLine bg-white px-2 py-1 text-xs"
            placeholder="New habit"
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
          />
          <button
            className="rounded-full border border-gridLine px-3 py-1 text-xs uppercase tracking-[0.2em]"
            onClick={() => {
              if (!newHabitName.trim()) {
                return;
              }
              addDailyHabit(newHabitName.trim());
              setNewHabitName("");
            }}
          >
            Add
          </button>
        </div>
      </div>
      <div
        ref={gridRef}
        className="scrollbar-thin max-h-[65vh] overflow-auto bg-white"
      >
        <table className="min-w-max border-collapse text-xs">
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-30 w-48 border border-gridLine bg-headerBlue px-3 py-2 text-left"
              >
                HABIT
              </th>
              {weekSegments.map((segment) => (
                <th
                  key={`week-${segment.week}`}
                  className="sticky top-0 z-20 border border-gridLine bg-headerBlue px-2 py-2 text-center uppercase tracking-[0.2em]"
                  colSpan={segment.span}
                >
                  Week {segment.week}
                </th>
              ))}
            </tr>
            <tr>
              <th
                className="sticky left-0 top-7 z-30 w-48 border border-gridLine bg-white px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-slate-500"
              >
                Day
              </th>
              {Array.from({ length: daysInMonth }, (_, idx) => (
                <th
                  key={`dow-${idx}`}
                  className="sticky top-7 z-10 border border-gridLine bg-white px-2 py-1 text-[10px] uppercase text-slate-500"
                >
                  {getDayLabel(selectedYear, selectedMonth, idx + 1)}
                </th>
              ))}
            </tr>
            <tr>
              <th
                className="sticky left-0 top-14 z-30 w-48 border border-gridLine bg-white px-3 py-2 text-left text-[10px] uppercase tracking-[0.3em] text-slate-500"
              >
                Date
              </th>
              {Array.from({ length: daysInMonth }, (_, idx) => (
                <th
                  key={`date-${idx}`}
                  className="sticky top-14 z-10 border border-gridLine bg-white px-2 py-1 text-[10px] text-slate-500"
                >
                  {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {month.dailyHabits.map((habit, rowIndex) => (
              <tr key={habit.id}>
                <td className="sticky left-0 z-20 w-48 border border-gridLine bg-panelPink px-3 py-2 text-left">
                  {editingId === habit.id ? (
                    <input
                      className="w-full border border-gridLine bg-white px-2 py-1 text-xs"
                      value={habit.name}
                      autoFocus
                      onChange={(event) => renameDailyHabit(habit.id, event.target.value)}
                      onBlur={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        className="text-left text-xs text-slate-700"
                        onClick={() => setEditingId(habit.id)}
                      >
                        {rowIndex + 1}. {habit.name}
                      </button>
                      <button
                        className="text-[10px] uppercase tracking-[0.2em] text-rose-400"
                        onClick={() => removeDailyHabit(habit.id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </td>
                {Array.from({ length: daysInMonth }, (_, colIndex) => {
                  const checked = month.checks[habit.id]?.[colIndex] ?? false;
                  return (
                    <td key={`${habit.id}-${colIndex}`} className="border border-gridLine">
                      <button
                        type="button"
                        className={`flex h-7 w-7 items-center justify-center text-sm font-semibold transition ${
                          checked ? "bg-checkFill text-slate-700" : "bg-white"
                        }`}
                        data-row={rowIndex}
                        data-col={colIndex}
                        onMouseDown={() => handleMouseDown(habit.id, colIndex)}
                        onMouseEnter={() => handleMouseEnter(habit.id, colIndex)}
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, rowIndex, colIndex, habit.id)
                        }
                      >
                        {checked ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
