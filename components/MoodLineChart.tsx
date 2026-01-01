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

export function MoodLineChart({ data }: { data: { day: number; mood: number }[] }) {
  return (
    <div className="card flex min-h-[320px] flex-col p-4">
      <p className="section-title">Mood Over the Month</p>
      <div className="mt-3 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              fontSize={10}
              tickFormatter={(value) => (value === 5 ? "Happy" : value)}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMood)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-500">
        {data.map((item) => (
          <div key={`mood-${item.day}`} className="w-6 text-center">
            {item.mood}
          </div>
        ))}
      </div>
    </div>
  );
}
