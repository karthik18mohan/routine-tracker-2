"use client";

import { monthOptions } from "@/lib/date";
import { useAppStore } from "@/store/useAppStore";

const yearRange = Array.from({ length: 5 }, (_, idx) => {
  const base = new Date().getFullYear() - 2;
  return base + idx;
});

export function MonthYearPicker() {
  const selectedMonth = useAppStore((state) => state.selectedMonth);
  const selectedYear = useAppStore((state) => state.selectedYear);
  const setSelectedMonthYear = useAppStore((state) => state.setSelectedMonthYear);

  return (
    <div className="flex items-center gap-2">
      <select
        className="border border-gridLine bg-white px-3 py-1 text-sm uppercase tracking-[0.2em]"
        value={selectedMonth}
        onChange={(event) =>
          setSelectedMonthYear(selectedYear, Number(event.target.value))
        }
      >
        {monthOptions.map((month, index) => (
          <option key={month} value={index + 1}>
            {month.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        className="border border-gridLine bg-white px-3 py-1 text-sm uppercase tracking-[0.2em]"
        value={selectedYear}
        onChange={(event) =>
          setSelectedMonthYear(Number(event.target.value), selectedMonth)
        }
      >
        {yearRange.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
