export function ProgressDonut({
  percent,
  size = 120,
  stroke = 12,
  label,
  sublabel
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="text-slate-200">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#7cb7f2"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="fill-slate-700 text-lg font-semibold"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {label}
        </p>
        {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
      </div>
    </div>
  );
}
