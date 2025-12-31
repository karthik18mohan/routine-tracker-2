import { HabitStat } from "@/lib/metrics";

export function TopHabitsTable({ habits }: { habits: HabitStat[] }) {
  return (
    <div className="card flex h-full flex-col">
      <div className="border-b border-gridLine bg-panelPink px-4 py-3">
        <p className="section-title">Top 10 Most Consistent Habits</p>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-headerBlue text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="border border-gridLine px-2 py-2 text-left">Habit</th>
              <th className="border border-gridLine px-2 py-2 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((stat) => (
              <tr key={`top-${stat.habit.id}`}>
                <td className="border border-gridLine px-2 py-2 text-left">
                  {stat.habit.name}
                </td>
                <td className="border border-gridLine px-2 py-2 text-center">
                  {Math.round(stat.percentage)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
