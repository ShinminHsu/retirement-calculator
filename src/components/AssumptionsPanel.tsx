import { ReactNode } from "react";
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
      </div>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-slate-600">退休後保證收入（勞退 / 勞保）</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="勞退月領" hint="預設 0">
            <NumberInput
              value={a.laborPensionMonthly}
              step={1000}
              suffix="元"
              onChange={(n) => update((d) => (d.assumptions.laborPensionMonthly = n))}
            />
          </Field>
          <Field label="勞退請領年齡" hint="60 歲可領">
            <NumberInput
              value={a.laborPensionStartAge}
              step={1}
              suffix="歲"
              onChange={(n) => update((d) => (d.assumptions.laborPensionStartAge = n))}
            />
          </Field>
          <Field label="勞保月領" hint="預設 0">
            <NumberInput
              value={a.laborInsuranceMonthly}
              step={1000}
              suffix="元"
              onChange={(n) => update((d) => (d.assumptions.laborInsuranceMonthly = n))}
            />
          </Field>
          <Field label="勞保請領年齡" hint="65 歲可領">
            <NumberInput
              value={a.laborInsuranceStartAge}
              step={1}
              suffix="歲"
              onChange={(n) => update((d) => (d.assumptions.laborInsuranceStartAge = n))}
            />
          </Field>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        勞退、勞保金額與請領年齡可至「勞保勞退」分頁試算，或查勞保局 App 後分別填入；不確定可填 0（偏保守）。
        若在請領年齡前提早退休，那幾年領不到，工具會要你自己的資產先撐過去。
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

        <div className="pt-2">
          <div className="mb-1 text-sm font-medium text-slate-600">退休後提領策略</div>
          <div className="flex gap-2">
            <StrategyTab
              active={a.withdrawalStrategy !== "guardrails"}
              onClick={() => update((d) => (d.assumptions.withdrawalStrategy = "fixed"))}
            >
              固定金額
            </StrategyTab>
            <StrategyTab
              active={a.withdrawalStrategy === "guardrails"}
              onClick={() => update((d) => (d.assumptions.withdrawalStrategy = "guardrails"))}
            >
              動態護欄
            </StrategyTab>
          </div>
          {a.withdrawalStrategy === "guardrails" ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Field label="護欄帶寬" hint="超出計畫率 ±此值就調整">
                  <NumberInput
                    value={r2(a.guardrailBand * 100)}
                    step={5}
                    suffix="%"
                    onChange={(n) => update((d) => (d.assumptions.guardrailBand = n / 100))}
                  />
                </Field>
                <Field label="每次調整幅度" hint="觸發時加/減的支出比例">
                  <NumberInput
                    value={r2(a.guardrailAdjust * 100)}
                    step={5}
                    suffix="%"
                    onChange={(n) => update((d) => (d.assumptions.guardrailAdjust = n / 100))}
                  />
                </Field>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                市場差、提領率衝太高 → 自動少花一段；市場好 → 多花一段。成功率會提高，代價是壞年的生活費較低。
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              每年提一樣多（不理會市場）。最單純，但遇到退休初期大跌最脆弱。
            </p>
          )}
        </div>
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

function StrategyTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700"
          : "rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
      }
    >
      {children}
    </button>
  );
}
