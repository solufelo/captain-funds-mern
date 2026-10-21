import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "../interfaces";
import { formatMoney } from "../lib/format";
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

/** The daily average as a knocked-out pill on the right-hand axis, centred on its dashed line. */
function AvgTag({ viewBox, value }: { viewBox?: { x: number; y: number; width: number }; value?: string }) {
  if (!viewBox || !value) return null;
  const w = Math.round(value.length * 6.3 + 18);
  const x = viewBox.x + viewBox.width + 6;
  return (
    <g>
      <rect x={x} y={viewBox.y - 11} width={w} height={22} rx={11} fill="#102525" stroke="#fffdf9" strokeWidth={3} paintOrder="stroke" />
      <text x={x + w / 2} y={viewBox.y + 4} textAnchor="middle" fill="#f7f4ee" fontSize={11} fontWeight={600} style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </text>
    </g>
  );
}

const axisMoney = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`);

/** 30-day giving: one bar per day (the best day in full amber), gifts in the tooltip, dashed daily average. */
export default function GivingChart({ data, height = 240 }: { data: DailyPoint[]; height?: number }) {
  const reduced = useReducedMotion();
  const avg = data.length ? data.reduce((s, d) => s + d.amount, 0) / data.length : 0;
  const best = data.reduce<DailyPoint | null>((b, d) => (d.amount > (b?.amount ?? 0) ? d : b), null);
  return (
    <div style={{ height }} className="w-full" data-testid="giving-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="#ece6da" />
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
            orientation="right"
            tickFormatter={axisMoney}
            tick={{ fill: "#65716d", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={78}
            tickCount={4}
            tickMargin={10}
          />
          <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(16,37,37,0.05)", radius: 4 }} />
          <Bar
            dataKey="amount"
            radius={[4, 4, 1, 1]}
            maxBarSize={22}
            isAnimationActive={!reduced}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((d) => (
              <Cell key={d.date} fill={d === best ? "#e48f1d" : "#f5c784"} />
            ))}
          </Bar>
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#102525"
              strokeOpacity={0.45}
              strokeDasharray="4 5"
              label={<AvgTag value={`avg ${formatMoney(avg)}`} />}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Trend strip for stat cards: one thin bar per day, matching the main chart, spanning the card's bottom edge. */
export function Sparkline({ values, className = "", fill = "#f0a43a" }: { values: number[]; className?: string; fill?: string }) {
  const max = Math.max(1, ...values);
  if (!values.length) return null;
  const step = 160 / values.length;
  return (
    <svg viewBox="0 0 160 48" preserveAspectRatio="none" className={className} aria-hidden>
      {values.map((v, i) => {
        const h = Math.max(1.5, (Math.max(0, v) / max) * 40);
        return <rect key={i} x={i * step + step * 0.2} y={48 - h} width={step * 0.6} height={h} rx={0.8} fill={fill} opacity={i === values.length - 1 ? 1 : 0.55} />;
      })}
    </svg>
  );
}
