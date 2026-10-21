import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "../interfaces";
import { formatMoney } from "../lib/format";
import { sparkPath } from "../lib/insights";
import { useReducedMotion } from "../lib/useMotion";

const shortDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
const longDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });

function ChartTip({ active, payload }: { active?: boolean; payload?: { payload: DailyPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl bg-ink px-4 py-3 text-paper shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper/55">{longDate(p.date)}</div>
      <div className="tabular mt-1 font-display text-2xl font-semibold leading-none tracking-[-0.02em]">{formatMoney(p.amount)}</div>
      <div className="mt-1 text-xs text-paper/70">
        {p.count} gift{p.count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

/** 30-day giving area chart: amount per day, gifts in the tooltip, dashed daily average. */
export default function GivingChart({ data, height = 240 }: { data: DailyPoint[]; height?: number }) {
  const reduced = useReducedMotion();
  const avg = data.length ? data.reduce((s, d) => s + d.amount, 0) / data.length : 0;
  return (
    <div style={{ height }} className="w-full" data-testid="giving-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: -6 }}>
          <defs>
            <linearGradient id="giving-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0a43a" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#f0a43a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e8e1d3" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: "#65716d", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={36}
            tickMargin={10}
          />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
            tick={{ fill: "#65716d", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickCount={4}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#102525"
              strokeOpacity={0.35}
              strokeDasharray="4 5"
              label={{ value: `avg ${formatMoney(avg)}/day`, position: "insideTopLeft", fill: "#65716d", fontSize: 11, dy: -14, dx: 4 }}
            />
          )}
          <Tooltip content={<ChartTip />} cursor={{ stroke: "#102525", strokeOpacity: 0.25, strokeWidth: 1 }} />
          <Area
            type="monotoneX"
            dataKey="amount"
            stroke="#d98a1c"
            strokeWidth={2.4}
            fill="url(#giving-fill)"
            activeDot={{ r: 6, fill: "#f0a43a", stroke: "#fffdf9", strokeWidth: 3 }}
            isAnimationActive={!reduced}
            animationDuration={1400}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny decorative trend line for stat cards. */
export function Sparkline({ values, className = "", stroke = "#f0a43a" }: { values: number[]; className?: string; stroke?: string }) {
  const { line, area } = sparkPath(values, 160, 48);
  if (!line) return null;
  return (
    <svg viewBox="0 0 160 48" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.8" vectorEffect="non-scaling-stroke" className="spark-draw" pathLength={1} />
    </svg>
  );
}
