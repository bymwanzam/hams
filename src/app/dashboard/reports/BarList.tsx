// Lightweight horizontal bar breakdown — no charting library, just relative
// widths. Good enough for "counts by category" at this scale, and keeps the
// module dependency-free.

export default function BarList({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}) {
  if (items.length === 0) {
    return <p className="text-muted">No data yet.</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="text-sm">
          <div className="flex justify-between mb-0.5">
            <span className="text-muted">{item.label}</span>
            <span className="text-muted font-medium">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
          <div className="h-[6px] bg-[var(--color-neutral-200)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-500)]"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
