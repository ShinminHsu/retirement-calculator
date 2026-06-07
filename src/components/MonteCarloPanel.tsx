import { useState } from "react";
import { AppState } from "../types";
import { runMonteCarlo, MonteCarloResult } from "../lib/montecarlo";
import { twd, pct } from "../lib/format";
import { NumberInput, PrimaryButton } from "./ui";

export function MonteCarloPanel({
  state,
  update,
}: {
  state: AppState;
  update: (patch: (d: AppState) => void) => void;
}) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);
  const a = state.assumptions;

  function run() {
    setRunning(true);
    // Defer so the button shows a running state before the synchronous work.
    setTimeout(() => {
      setResult(runMonteCarlo(state));
      setRunning(false);
    }, 0);
  }

  const rate = result?.successRate ?? 0;
  const rateColor =
    rate >= 0.85
      ? "text-emerald-600"
      : rate >= 0.6
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700">
          蒙地卡羅成功率
        </h2>
        <PrimaryButton onClick={run} disabled={running}>
          {running ? "模擬中…" : "執行模擬"}
        </PrimaryButton>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        對每年報酬隨機抽樣跑 {a.monteCarloRuns} 次，模擬市場有好有壞時，計畫成功（達標且資產撐到預期壽命）的機率。
      </p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="block">
          <div className="mb-1 text-xs text-slate-500">報酬波動度</div>
          <NumberInput
            value={round2(a.returnVolatility * 100)}
            step={1}
            suffix="%"
            onChange={(n) => update((d) => (d.assumptions.returnVolatility = n / 100))}
          />
          <p className="mt-1 text-xs text-slate-400">
            標準差，股債分散約 12–14%、純股票 15%+
          </p>
        </label>
        <label className="block">
          <div className="mb-1 text-xs text-slate-500">模擬次數</div>
          <NumberInput
            value={a.monteCarloRuns}
            step={100}
            suffix="次"
            onChange={(n) => update((d) => (d.assumptions.monteCarloRuns = n))}
          />
        </label>
      </div>

      {result ? (
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-slate-500">成功機率</span>
            <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
              {pct(result.successRate, 0)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-center text-sm">
            <Pctile label="悲觀 (p10)" value={twd(result.p10)} />
            <Pctile label="中位 (p50)" value={twd(result.p50)} />
            <Pctile label="樂觀 (p90)" value={twd(result.p90)} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            結束（預期壽命）時的資產分位數。p10 代表「最差 10% 情境」下大約剩多少。
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">按「執行模擬」計算成功率。</p>
      )}
    </div>
  );
}

function Pctile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold tabular-nums text-slate-700">{value}</div>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
