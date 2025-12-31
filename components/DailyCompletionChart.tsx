"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function DailyCompletionChart({
  data
}: {
  data: { day: number; count: number }[];
}) {
  return (
    <div className="card flex h-full flex-col p-4">
      <p className="section-title">Daily Completion</p>
      <div className="mt-3 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8dbdf7" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8dbdf7" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#7cb7f2"
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-500">
        {data.map((item) => (
          <div key={`count-${item.day}`} className="w-6 text-center">
            {item.count}
          </div>
        ))}
      </div>
    </div>
  );
}
