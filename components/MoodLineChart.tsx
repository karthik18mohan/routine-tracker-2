"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function MoodLineChart({ data }: { data: { day: number; mood: number }[] }) {
  return (
    <div className="card flex h-full flex-col p-4">
      <p className="section-title">Mood Over the Month</p>
      <div className="mt-3 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis tickLine={false} axisLine={false} domain={[1, 5]} fontSize={10} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
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
