import { useState } from "react";
import { AppState } from "../types";
import { solveMaxSpending, SpendingSolution } from "../lib/montecarlo";
import { twd } from "../lib/format";
import { NumberInput, PrimaryButton } from "./ui";

export function SpendingSolverPanel({ state }: { state: AppState }) {
  const [target, setTarget] = useState(90); // percent
  const [solution, setSolution] = useState<SpendingSolution | null>(null);
  const [running, setRunning] = useState(false);

  function solve() {
    setRunning(true);
    setTimeout(() => {
      setSolution(solveMaxSpending(state, target / 100));
      setRunning(false);
    }, 0);
  }

  const diff = solution ? solution.maxSpending - solution.currentSpending : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700">可花上限試算</h2>
        <PrimaryButton onClick={solve} disabled={running}>
          {running ? "計算中…" : "計算"}
        </PrimaryButton>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        反過來問：給定你要的成功率，退休後一年最多能花多少？（沿用目前的報酬、波動、提領策略）
      </p>

      <label className="mb-4 block w-40">
        <div className="mb-1 text-xs text-slate-500">目標成功率</div>
        <NumberInput value={target} step={5} suffix="%" onChange={setTarget} />
      </label>

      {solution ? (
        <div>
          <div className="text-xs text-slate-500">可花上限</div>
          <div className="text-3xl font-bold tabular-nums text-indigo-700">
            {twd(solution.maxSpending)}
            <span className="ml-1 text-base font-normal text-slate-400">/年</span>
          </div>
          <div className="mt-1 text-sm text-slate-500">
            （每月約 {twd(solution.maxSpending / 12)}；該支出實際成功率{" "}
            {Math.round(solution.successAtMax * 100)}%）
          </div>
          <div
            className={
              diff >= 0
                ? "mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                : "mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
            }
          >
            {diff >= 0
              ? `比你目前設定的退休後年支出（${twd(solution.currentSpending)}）還能多花 ${twd(diff)}/年。`
              : `你目前設定的退休後年支出（${twd(solution.currentSpending)}）超過上限 ${twd(-diff)}/年，建議調低或提高儲蓄。`}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">按「計算」反推可花上限。</p>
      )}
    </div>
  );
}
