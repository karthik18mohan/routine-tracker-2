import { ProgressDonut } from "@/components/ProgressDonut";

export function DailySummaryCard({
  percent,
  completed,
  incomplete,
  dailyGoal
}: {
  percent: number;
  completed: number;
  incomplete: number;
  dailyGoal: number;
}) {
  return (
    <div className="card flex flex-col gap-4 p-4">
      <p className="section-title">Daily Summary</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ProgressDonut percent={percent} size={120} stroke={10} label="Completed" />
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center justify-between gap-6">
            <span>% Completed</span>
            <span className="font-semibold text-slate-700">
              {Math.round(percent)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span>Completed</span>
            <span className="font-semibold text-slate-700">{completed}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span>Incomplete</span>
            <span className="font-semibold text-slate-700">{incomplete}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span>Daily Goal</span>
            <span className="font-semibold text-slate-700">{dailyGoal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
