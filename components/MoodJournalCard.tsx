"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";

const moodScale = [
  { value: 1, emoji: "😞", label: "Low" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" }
];

export function MoodJournalCard() {
  const month = useAppStore((state) =>
    state.selectedUserId
      ? state.monthsByUser[state.selectedUserId]?.[
          `${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`
        ]
      : undefined
  );
  const setMoodForDay = useAppStore((state) => state.setMoodForDay);
  const updateJournalEntry = useAppStore((state) => state.updateJournalEntry);

  const todayIndex = useMemo(() => {
    const today = new Date();
    const isCurrent =
      month &&
      today.getFullYear() === month.year &&
      today.getMonth() + 1 === month.month;
    return isCurrent ? today.getDate() - 1 : 0;
  }, [month]);

  if (!month) {
    return null;
  }

  const moodValue = month.moodByDay[todayIndex] ?? 3;
  const journalValue = month.journalEntries[todayIndex] ?? "";

  return (
    <div className="card space-y-6 p-4">
      <div>
        <p className="section-title">Today&apos;s Mood</p>
        <p className="mt-2 text-xs text-slate-500">
          Your mood is a personal input and isn&apos;t tied to task completion.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {moodScale.map((mood) => (
            <div key={mood.value} className="flex flex-col items-center text-xs text-slate-500">
              <span
                className={`text-2xl ${moodValue === mood.value ? "scale-110" : "opacity-50"}`}
                aria-hidden="true"
              >
                {mood.emoji}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em]">
                {mood.label}
              </span>
            </div>
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={moodValue}
          onChange={(event) => setMoodForDay(todayIndex, Number(event.target.value))}
          className="mt-4 w-full"
        />
      </div>
      <div>
        <p className="section-title">Quick Journal</p>
        <textarea
          className="mt-3 h-32 w-full resize-none border border-gridLine bg-white p-3 text-sm"
          value={journalValue}
          onChange={(event) => updateJournalEntry(todayIndex, event.target.value)}
          placeholder="Capture today&apos;s wins, reflections, or gratitude..."
        />
      </div>
    </div>
  );
}
