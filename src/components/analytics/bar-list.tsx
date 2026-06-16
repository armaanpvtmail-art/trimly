import { formatNumber } from "@/lib/utils";

interface Item {
  label: string;
  value: number;
}

export function BarList({
  items,
  emptyLabel = "No data yet",
}: {
  items: Item[];
  emptyLabel?: string;
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate pr-2 capitalize">{item.label.toLowerCase()}</span>
            <span className="font-medium tabular-nums">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
