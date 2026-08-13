export function BarList({
  data,
  valueFormatter,
}: {
  data: { label: string; value: number }[];
  valueFormatter: (value: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <p className="p-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <div className="space-y-3 p-4">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex items-center gap-3"
          title={`${d.label}: ${valueFormatter(d.value)}`}
        >
          <span className="w-36 shrink-0 truncate text-sm text-muted-foreground">
            {d.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
          <span className="w-28 shrink-0 text-right text-sm font-medium tabular-nums">
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
