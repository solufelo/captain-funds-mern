import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "../interfaces";
import { formatMoney } from "../lib/format";

const shortDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

/** 30-day giving area chart: amount per day, donations count in the tooltip. */
export default function GivingChart({ data, height = 240 }: { data: DailyPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full" data-testid="giving-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="giving-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0a43a" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#f0a43a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e3dccd" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: "#8a9592", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
            tick={{ fill: "#8a9592", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "#1a3636", strokeDasharray: "3 3" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e3dccd", background: "#fffdf9" }}
            labelFormatter={(d) => shortDate(String(d))}
            formatter={(value: number, _name, item) => [`${formatMoney(value)} · ${item.payload.count} gifts`, "Raised"]}
          />
          <Area type="monotone" dataKey="amount" stroke="#c97a12" strokeWidth={2.2} fill="url(#giving-fill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
