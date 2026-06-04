import { useState } from "react";
import { AppState } from "../types";
import { buildBreakdown } from "../lib/finance";
import { twd } from "../lib/format";

export function CalculationBreakdown({ state }: { state: AppState }) {
  const [open, setOpen] = useState(false);
  const { steps, years } = buildBreakdown(state);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-slate-700">
          計算明細（這些數字怎麼來的）
        </span>
        <span className="text-sm text-indigo-600">{open ? "收起 ▲" : "展開 ▼"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          {/* Steps */}
          <ol className="space-y-3">
            {steps.map((s) => (
              <li key={s.label} className="text-sm">
                <div className="font-medium text-slate-700">{s.label}</div>
                <div className="mt-0.5 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                  {s.formula}
                  <span className="mx-2 text-slate-400">=</span>
                  <span className="font-semibold text-indigo-700">{s.result}</span>
                </div>
                {s.note && (
                  <p className="mt-1 text-xs text-slate-400">{s.note}</p>
                )}
              </li>
            ))}
          </ol>

          {/* Year-by-year table */}
          <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-600">
            逐年明細（今日購買力）
          </h3>
          <div className="max-h-80 overflow-auto rounded-lg border border-slate-100">
            <table className="w-full text-right text-xs tabular-nums">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-2 py-1.5 text-left">年齡</th>
                  <th className="px-2 py-1.5">年初投資</th>
                  <th className="px-2 py-1.5">年初現金</th>
                  <th className="px-2 py-1.5">當年存/領</th>
                  <th className="px-2 py-1.5">年初淨值</th>
                  <th className="px-2 py-1.5 text-center">階段</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr
                    key={y.age}
                    className={
                      y.phase === "decumulation"
                        ? "border-t border-slate-100 bg-amber-50/40"
                        : "border-t border-slate-100"
                    }
                  >
                    <td className="px-2 py-1 text-left text-slate-600">{y.age}</td>
                    <td className="px-2 py-1">{twd(y.startInvested)}</td>
                    <td className="px-2 py-1">{twd(y.startCash)}</td>
                    <td
                      className={
                        y.flow < 0
                          ? "px-2 py-1 text-rose-600"
                          : "px-2 py-1 text-emerald-600"
                      }
                    >
                      {y.flow >= 0 ? "+" : "−"}
                      {twd(Math.abs(y.flow)).replace("$", "")}
                    </td>
                    <td className="px-2 py-1 font-medium">{twd(y.startNetWorth)}</td>
                    <td className="px-2 py-1 text-center text-slate-400">
                      {y.phase === "accumulation" ? "累積" : "提領"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            「年初淨值」是當年開始時的資產；當年再加上「存/領」與報酬，滾到隔年。橘底列為退休後提領期。
          </p>
        </div>
      )}
    </div>
  );
}
