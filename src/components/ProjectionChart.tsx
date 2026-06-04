import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProjectionResult } from "../lib/finance";
import { twd, wan } from "../lib/format";

export function ProjectionChart({ result }: { result: ProjectionResult }) {
  const { series, retirementAge, target, depletionAge } = result;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-700">
        資產逐年走勢（今日購買力）
      </h2>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={series} margin={{ top: 24, right: 16, left: 8, bottom: 16 }}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis
            dataKey="age"
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(a) => `${a}`}
            label={{ value: "年齡", position: "insideBottom", offset: -12, fontSize: 12, fill: "#94a3b8" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(v) => wan(v as number)}
            width={64}
          />
          <Tooltip
            formatter={(v: number) => [twd(v), "淨值"]}
            labelFormatter={(a) => `${a} 歲`}
            contentStyle={{ fontSize: 13, borderRadius: 8 }}
          />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke="#f59e0b"
              strokeDasharray="5 4"
              label={{ value: `目標 ${wan(target)}`, position: "insideTopLeft", fontSize: 11, fill: "#d97706" }}
            />
          )}
          {retirementAge !== null && (
            <ReferenceLine
              x={retirementAge}
              stroke="#10b981"
              label={{ value: `退休 ${retirementAge}`, position: "insideTop", fontSize: 11, fill: "#059669" }}
            />
          )}
          {depletionAge !== null && (
            <ReferenceLine
              x={depletionAge}
              stroke="#ef4444"
              label={{ value: `耗盡 ${depletionAge}`, position: "insideTop", fontSize: 11, fill: "#dc2626" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-400">
        累積期資產成長至橘色目標線後即可退休（綠線）；退休後每年提領缺口，曲線下降。若紅線出現代表資產在該年齡耗盡。
      </p>
    </div>
  );
}
