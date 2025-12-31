import { HabitStat } from "@/lib/metrics";

export function ProgressTable({
  stats,
  daysInMonth
}: {
  stats: HabitStat[];
  daysInMonth: number;
}) {
  return (
    <div className="card flex flex-col">
      <div className="border-b border-gridLine bg-panelPink px-4 py-3">
        <p className="section-title">Progress</p>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-headerBlue text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="border border-gridLine px-2 py-2 text-left">Habit</th>
              <th className="border border-gridLine px-2 py-2">Goal</th>
              <th className="border border-gridLine px-2 py-2">Percentage</th>
              <th className="border border-gridLine px-2 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => {
              const goal =
                stat.habit.goalType === "perDay"
                  ? daysInMonth
                  : stat.habit.goalValue;
              return (
                <tr key={stat.habit.id}>
                  <td className="border border-gridLine px-2 py-2 text-left">
                    {stat.habit.name}
                  </td>
                  <td className="border border-gridLine px-2 py-2 text-center">
                    {goal}
                  </td>
                  <td className="border border-gridLine px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-accentFill"
                          style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {Math.round(stat.percentage)}%
                      </span>
                    </div>
                  </td>
                  <td className="border border-gridLine px-2 py-2 text-center">
                    {stat.count} / {goal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
