import { AppState } from "../types";
import { Card, Field, NumberInput, PercentSlider } from "./ui";

export function AssumptionsPanel({
  state,
  update,
}: {
  state: AppState;
  update: (patch: (d: AppState) => void) => void;
}) {
  const a = state.assumptions;
  return (
    <Card title="假設與情境">
      <div className="grid grid-cols-2 gap-4">
        <Field label="目前年齡">
          <NumberInput
            value={a.currentAge}
            onChange={(n) => update((d) => (d.assumptions.currentAge = n))}
          />
        </Field>
        <Field label="預期壽命（圖表終點）">
          <NumberInput
            value={a.lifeExpectancyAge}
            onChange={(n) => update((d) => (d.assumptions.lifeExpectancyAge = n))}
          />
        </Field>
        <Field label="投資名目報酬率" hint="建議保守 6–7%">
          <NumberInput
            value={r2(a.nominalReturn * 100)}
            step={0.5}
            suffix="%"
            onChange={(n) => update((d) => (d.assumptions.nominalReturn = n / 100))}
          />
        </Field>
        <Field label="通膨率" hint="台灣長期約 2.5–3%">
          <NumberInput
            value={r2(a.inflation * 100)}
            step={0.5}
            suffix="%"
            onChange={(n) => update((d) => (d.assumptions.inflation = n / 100))}
          />
        </Field>
        <Field label="現金實質報酬率" hint="預設 0%">
          <NumberInput
            value={r2(a.realCashReturn * 100)}
            step={0.5}
            suffix="%"
            onChange={(n) => update((d) => (d.assumptions.realCashReturn = n / 100))}
          />
        </Field>
        <Field label="退休後每月保證收入" hint="勞保+勞退，預設 0">
          <NumberInput
            value={a.guaranteedMonthlyIncome}
            step={1000}
            suffix="元"
            onChange={(n) =>
              update((d) => (d.assumptions.guaranteedMonthlyIncome = n))
            }
          />
        </Field>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        勞保＋勞退請至勞保局 e 化服務 / 行動服務 App 查詢實際金額後填入；不確定可填 0（偏保守）。
      </p>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <PercentSlider
          label="提領率（4% 法則）"
          value={a.withdrawalRate}
          min={0.025}
          max={0.06}
          step={0.0005}
          onChange={(n) => update((d) => (d.assumptions.withdrawalRate = n))}
        />
        <p className="text-xs text-slate-400">
          常用 4%；想保守或退得早用 3.5%。建議報酬率填 6–7% 各跑一次看區間，別用近年的高報酬當假設。
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          id="dca"
          type="checkbox"
          checked={a.useFixedDca}
          onChange={(e) => update((d) => (d.assumptions.useFixedDca = e.target.checked))}
        />
        <label htmlFor="dca" className="text-sm text-slate-600">
          改用固定定期定額（忽略收入−支出）
        </label>
      </div>
      {a.useFixedDca && (
        <div className="mt-2">
          <Field label="每月定期定額">
            <NumberInput
              value={a.fixedMonthlyDca}
              step={1000}
              suffix="元/月"
              onChange={(n) => update((d) => (d.assumptions.fixedMonthlyDca = n))}
            />
          </Field>
        </div>
      )}
    </Card>
  );
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
