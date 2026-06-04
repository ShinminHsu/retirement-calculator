import { AppState, newId } from "../types";
import { retirementSpending, workingSpending } from "../lib/finance";
import { twd } from "../lib/format";
import { Card, Field, IconButton, NumberInput, TextInput } from "./ui";

export function IncomeBudgetPanel({
  state,
  update,
}: {
  state: AppState;
  update: (patch: (d: AppState) => void) => void;
}) {
  const inc = state.income;
  const working = workingSpending(inc);
  const retire = retirementSpending(inc);
  const annualSavings = inc.annualIncome - working;

  return (
    <Card title="收入與支出">
      <div className="grid grid-cols-2 gap-4">
        <Field label="目前年收入" hint="稅後可支配">
          <NumberInput
            value={inc.annualIncome}
            step={10000}
            suffix="元"
            onChange={(n) => update((d) => (d.income.annualIncome = n))}
          />
        </Field>
        <Field label="加薪率" hint="名目，每年">
          <NumberInput
            value={round2(inc.nominalRaiseRate * 100)}
            step={0.5}
            suffix="%"
            onChange={(n) =>
              update((d) => (d.income.nominalRaiseRate = n / 100))
            }
          />
        </Field>
      </div>

      {/* Working-life spending */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-600">
            工作期年支出
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={inc.useCategories}
              onChange={(e) =>
                update((d) => (d.income.useCategories = e.target.checked))
              }
            />
            分類填寫
          </label>
        </div>

        {!inc.useCategories ? (
          <NumberInput
            value={inc.workingSpending}
            step={10000}
            suffix="元"
            onChange={(n) => update((d) => (d.income.workingSpending = n))}
          />
        ) : (
          <div className="space-y-2">
            {inc.spendingCategories.map((c) => (
              <div key={c.id} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-5">
                  <TextInput
                    value={c.label}
                    placeholder="類別（居住 / 飲食…）"
                    onChange={(v) =>
                      update((d) => {
                        d.income.spendingCategories.find(
                          (x) => x.id === c.id,
                        )!.label = v;
                      })
                    }
                  />
                </div>
                <div className="col-span-6">
                  <NumberInput
                    value={c.amount}
                    step={10000}
                    suffix="元"
                    onChange={(n) =>
                      update((d) => {
                        d.income.spendingCategories.find(
                          (x) => x.id === c.id,
                        )!.amount = n;
                      })
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <IconButton
                    title="刪除"
                    onClick={() =>
                      update((d) => {
                        d.income.spendingCategories =
                          d.income.spendingCategories.filter(
                            (x) => x.id !== c.id,
                          );
                      })
                    }
                  >
                    ✕
                  </IconButton>
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                update((d) =>
                  d.income.spendingCategories.push({
                    id: newId(),
                    label: "",
                    amount: 0,
                  }),
                )
              }
              className="text-sm text-indigo-600 hover:underline"
            >
              + 新增類別
            </button>
            <p className="text-xs text-slate-500">
              合計：<span className="font-semibold">{twd(working)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Retirement spending */}
      <div className="mt-4">
        <Field
          label="退休後年支出"
          hint={
            inc.retirementSpendingOverride === null
              ? "預設＝工作期支出"
              : "已自訂"
          }
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={retire}
              step={10000}
              suffix="元"
              onChange={(n) =>
                update((d) => (d.income.retirementSpendingOverride = n))
              }
            />
            {inc.retirementSpendingOverride !== null && (
              <button
                onClick={() =>
                  update((d) => (d.income.retirementSpendingOverride = null))
                }
                className="shrink-0 text-xs text-indigo-600 hover:underline"
              >
                重設
              </button>
            )}
          </div>
        </Field>
      </div>

      {/* Derived savings */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">目前年儲蓄（收入 − 支出）</span>
          <span
            className={
              annualSavings < 0
                ? "font-semibold text-rose-600"
                : "font-semibold text-emerald-600"
            }
          >
            {twd(annualSavings)}
          </span>
        </div>
        {annualSavings < 0 && (
          <p className="mt-1 text-xs text-rose-600">
            ⚠️ 支出大於收入，目前處於負儲蓄，會延後或無法退休。
          </p>
        )}
      </div>
    </Card>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
