import { AppState } from "../types";
import { coastFire } from "../lib/finance";
import { twd } from "../lib/format";
import { NumberInput } from "./ui";

export function CoastFireCard({
  state,
  update,
}: {
  state: AppState;
  update: (patch: (d: AppState) => void) => void;
}) {
  const c = coastFire(state);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700">Coast FIRE</h2>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>目標年齡</span>
          <div className="w-20">
            <NumberInput
              value={state.assumptions.coastAge}
              suffix="歲"
              onChange={(n) => update((d) => (d.assumptions.coastAge = n))}
            />
          </div>
        </div>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        若「現在起不再存錢」，光靠現有投資複利成長，到目標年齡能否達到退休目標。
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500">Coast FIRE 數字</div>
          <div className="text-xl font-bold tabular-nums text-slate-800">
            {twd(c.coastNumber)}
          </div>
          <div className="text-xs text-slate-500">目前投資 {twd(c.invested)}</div>
        </div>
        <div>
          {c.reached ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              ✅ 已達成 Coast FIRE，現在停止存錢也能在 {state.assumptions.coastAge} 歲達標。
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              還差 <span className="font-semibold">{twd(c.shortfall)}</span> 才到 Coast FIRE。
              {c.ageReachesTarget !== null && (
                <div className="mt-1 text-xs text-slate-500">
                  （即使不再存錢，現有投資約於 {c.ageReachesTarget} 歲達到退休目標）
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
