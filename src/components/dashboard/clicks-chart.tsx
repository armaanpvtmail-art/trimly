"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  label: string;
  clicks: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  unitOne,
  unitMany,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unitOne: string;
  unitMany: string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-soft">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {v} {v === 1 ? unitOne : unitMany}
      </p>
    </div>
  );
}

export function ClicksChart({
  data,
  unitOne = "click",
  unitMany = "clicks",
}: {
  data: Point[];
  unitOne?: string;
  unitMany?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="currentColor"
          className="text-border"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="currentColor"
          className="text-muted-foreground"
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={32}
          stroke="currentColor"
          className="text-muted-foreground"
        />
        <Tooltip
          content={<CustomTooltip unitOne={unitOne} unitMany={unitMany} />}
          cursor={{ stroke: "#6366f1", strokeOpacity: 0.2 }}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#clicksGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
