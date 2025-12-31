"use client";

import { useAppStore } from "@/store/useAppStore";

export function MonthlyHabitsView() {
  const month = useAppStore((state) =>
    state.months[`${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}`]
  );
  const toggleMonthlyCheck = useAppStore((state) => state.toggleMonthlyCheck);
  const updateNotes = useAppStore((state) => state.updateNotes);
  const toggleGoal = useAppStore((state) => state.toggleGoal);

  if (!month) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="card overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-headerBlue text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="border border-gridLine px-2 py-2 text-left">Habit</th>
              <th className="border border-gridLine px-2 py-2 text-center">Done</th>
            </tr>
          </thead>
          <tbody>
            {month.monthlyHabits.map((habit) => (
              <tr key={habit.id}>
                <td className="border border-gridLine px-2 py-2 text-left">
                  {habit.name}
                </td>
                <td className="border border-gridLine px-2 py-2 text-center">
                  <button
                    className={`mx-auto flex h-7 w-7 items-center justify-center border border-gridLine ${
                      habit.checked ? "bg-checkFill" : "bg-white"
                    }`}
                    onClick={() => toggleMonthlyCheck(habit.id)}
                  >
                    {habit.checked ? "✓" : ""}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-4">
          <p className="section-title">This Month's Goals</p>
          <div className="mt-4 space-y-3 text-sm">
            {month.goals.map((goal) => (
              <label
                key={goal.id}
                className="flex items-center gap-3 border-b border-dashed border-gridLine pb-2"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={goal.done ?? false}
                  onChange={() => toggleGoal(goal.id)}
                />
                <span className={goal.done ? "line-through text-slate-400" : ""}>
                  {goal.text}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <p className="section-title">Notes</p>
          <textarea
            className="mt-4 h-56 w-full resize-none border border-gridLine bg-white p-3 text-sm"
            value={month.notes}
            onChange={(event) => updateNotes(event.target.value)}
            placeholder="Write reflections, wins, or ideas for the month..."
          />
        </div>
      </div>
    </div>
  );
}
