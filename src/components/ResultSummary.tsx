import { ProjectionResult } from "../lib/finance";
import { twd, wan } from "../lib/format";

export function ResultSummary({
  result,
  ageDelta,
}: {
  result: ProjectionResult;
  ageDelta: number | null; // change in retirement age vs previous settings
}) {
  const { target, retirementAge, yearsToRetire, shortfall, depletionAge } =
    result;

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Big label="退休目標金額" value={twd(target)} sub={wan(target)} />
        {retirementAge !== null ? (
          <Big
            label="預計可退休年齡"
            value={`${retirementAge} 歲`}
            sub={`還要 ${yearsToRetire} 年`}
            accent
            delta={ageDelta}
          />
        ) : (
          <Big
            label="退休缺口"
            value={twd(shortfall)}
            sub="期限內未達標"
            warn
          />
        )}
        <Big
          label="資產可撐到"
          value={depletionAge !== null ? `${depletionAge} 歲耗盡` : "預期壽命內無虞"}
          sub={depletionAge !== null ? "需調整計畫" : ""}
          warn={depletionAge !== null}
        />
      </div>

      {depletionAge !== null && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          ⚠️ 以目前設定，資產會在 {depletionAge} 歲耗盡，無法支撐到預期壽命。可考慮：晚點退休、降低退休後支出、提高儲蓄，或調整提領率。
        </p>
      )}
    </div>
  );
}

function Big({
  label,
  value,
  sub,
  accent,
  warn,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
  delta?: number | null;
}) {
  const color = warn
    ? "text-rose-700"
    : accent
      ? "text-indigo-700"
      : "text-slate-800";
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
        {delta !== null && delta !== undefined && delta !== 0 && (
          <span
            className={
              delta > 0
                ? "text-xs font-medium text-rose-600"
                : "text-xs font-medium text-emerald-600"
            }
          >
            {delta > 0 ? `延後 ${delta} 年` : `提前 ${-delta} 年`}
          </span>
        )}
      </div>
    </div>
  );
}
