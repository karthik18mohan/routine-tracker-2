"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [sliderValue, setSliderValue] = useState(moodValue);
  const activeMood = Math.round(sliderValue);
  const journalValue = month.journalEntries[todayIndex] ?? "";

  useEffect(() => {
    setSliderValue(moodValue);
  }, [moodValue]);

  const commitMood = (value: number) => {
    const rounded = Math.round(value);
    setSliderValue(rounded);
    if (rounded !== moodValue) {
      setMoodForDay(todayIndex, rounded);
    }
  };

  return (
    <div className="card space-y-6 p-4">
      <div>
        <p className="section-title">Today&apos;s Mood</p>
        <p className="mt-2 text-xs text-slate-500">
          Your mood is a personal input and isn&apos;t tied to task completion.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {moodScale.map((mood) => {
            const distance = Math.abs(sliderValue - mood.value);
            const normalized = Math.max(0, 1 - distance / 2);
            const scale = 1 + normalized * 0.35;
            return (
              <div key={mood.value} className="flex flex-col items-center text-xs text-slate-500">
                <span
                  className={`text-2xl transition-transform duration-150 ease-out ${
                    activeMood === mood.value ? "" : "opacity-70"
                  }`}
                  style={{ transform: `scale(${scale})` }}
                  aria-hidden="true"
                >
                  {mood.emoji}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.2em]">
                  {mood.label}
                </span>
              </div>
            );
          })}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={0.01}
          value={sliderValue}
          onChange={(event) => setSliderValue(Number(event.target.value))}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
          }}
          onTouchStart={(event) => {
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
          }}
          onPointerUp={(event) => commitMood(Number(event.currentTarget.value))}
          onTouchEnd={(event) => commitMood(Number(event.currentTarget.value))}
          onKeyUp={(event) => commitMood(Number(event.currentTarget.value))}
          className="mt-4 w-full touch-none"
          style={{ touchAction: "none" }}
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
