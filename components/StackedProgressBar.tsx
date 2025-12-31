export function StackedProgressBar({
  segments
}: {
  segments: { value: number; color: string }[];
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  return (
    <div className="h-4 w-full overflow-hidden rounded-full border border-gridLine bg-white">
      <div className="flex h-full w-full">
        {segments.map((segment, index) => (
          <div
            key={`${segment.color}-${index}`}
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color
            }}
          />
        ))}
      </div>
    </div>
  );
}
