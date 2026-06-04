import { useState } from "react";
import { AppState, Currency, newId } from "../types";
import { summarizePortfolio } from "../lib/finance";
import { detectCurrency, refreshQuotes } from "../lib/quotes";
import { twd } from "../lib/format";
import {
  Card,
  Field,
  IconButton,
  NumberInput,
  PrimaryButton,
  TextInput,
} from "./ui";

type View = "account" | "ticker";

export function PortfolioPanel({
  state,
  update,
}: {
  state: AppState;
  update: (patch: (d: AppState) => void) => void;
}) {
  const summary = summarizePortfolio(state);
  const [view, setView] = useState<View>("account");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function doRefresh() {
    setLoading(true);
    setStatus(null);
    const tickers = state.positions.map((p) => ({
      ticker: p.ticker,
      currency: p.currency,
    }));
    const result = await refreshQuotes(tickers);
    update((d) => {
      for (const [t, q] of Object.entries(result.quotes)) {
        // Don't clobber a manual override with auto data.
        if (!d.quoteCache[t]?.manual) d.quoteCache[t] = q;
      }
      if (result.usdTwdRate) d.usdTwdRate = result.usdTwdRate;
    });
    const parts: string[] = [];
    if (Object.keys(result.quotes).length)
      parts.push(`已更新 ${Object.keys(result.quotes).length} 檔收盤價`);
    if (result.unavailable.length)
      parts.push(`需手動輸入：${result.unavailable.join("、")}`);
    if (result.error) parts.push(`錯誤：${result.error}`);
    setStatus(parts.join("；") || "沒有可更新的標的");
    setLoading(false);
  }

  function addPosition() {
    update((d) => {
      d.positions.push({
        id: newId(),
        account: "",
        ticker: "",
        shares: 0,
        currency: "TWD",
      });
    });
  }

  function addCash() {
    update((d) => {
      d.cashAccounts.push({ id: newId(), label: "", amountTwd: 0 });
    });
  }

  return (
    <Card
      title="資產"
      right={
        <PrimaryButton onClick={doRefresh} disabled={loading}>
          {loading ? "更新中…" : "抓取收盤價"}
        </PrimaryButton>
      }
    >
      {/* Net worth headline */}
      <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-center">
        <Stat label="投資部位" value={twd(summary.investedTwd)} />
        <Stat label="現金" value={twd(summary.cashTwd)} />
        <Stat label="總淨值" value={twd(summary.netWorthTwd)} strong />
      </div>

      {status && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {status}
        </p>
      )}

      {/* Positions */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-600">持股</h3>
      </div>
      <div className="space-y-2">
        {state.positions.map((p) => {
          const quote = state.quoteCache[p.ticker];
          return (
            <div key={p.id} className="grid grid-cols-12 items-center gap-2">
              <input
                className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                placeholder="證券戶"
                value={p.account}
                onChange={(e) =>
                  update((d) => {
                    d.positions.find((x) => x.id === p.id)!.account =
                      e.target.value;
                  })
                }
              />
              <input
                className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                placeholder="代號"
                value={p.ticker}
                onChange={(e) =>
                  update((d) => {
                    d.positions.find((x) => x.id === p.id)!.ticker =
                      e.target.value.trim();
                  })
                }
              />
              <input
                type="number"
                className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
                placeholder="股數"
                value={p.shares || ""}
                onChange={(e) =>
                  update((d) => {
                    d.positions.find((x) => x.id === p.id)!.shares =
                      parseFloat(e.target.value) || 0;
                  })
                }
              />
              <select
                className="col-span-2 rounded-md border border-slate-300 px-1 py-1.5 text-sm"
                value={p.currency}
                onChange={(e) =>
                  update((d) => {
                    d.positions.find((x) => x.id === p.id)!.currency = e.target
                      .value as Currency;
                  })
                }
              >
                <option value="TWD">台股</option>
                <option value="USD">美股</option>
              </select>
              <input
                type="number"
                className="col-span-2 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
                placeholder="股價"
                value={quote?.price ?? ""}
                title="手動輸入或覆寫股價"
                onChange={(e) =>
                  update((d) => {
                    const price = parseFloat(e.target.value);
                    if (!isFinite(price)) {
                      delete d.quoteCache[p.ticker];
                      return;
                    }
                    d.quoteCache[p.ticker] = {
                      price,
                      asOf: new Date().toISOString().slice(0, 10),
                      currency: detectCurrency(p.ticker),
                      manual: true,
                    };
                  })
                }
              />
              <div className="col-span-1 flex justify-end">
                <IconButton
                  title="刪除"
                  onClick={() =>
                    update((d) => {
                      d.positions = d.positions.filter((x) => x.id !== p.id);
                    })
                  }
                >
                  ✕
                </IconButton>
              </div>
            </div>
          );
        })}
        {state.positions.length === 0 && (
          <p className="text-sm text-slate-400">尚未新增持股。</p>
        )}
      </div>
      <button
        onClick={addPosition}
        className="mt-2 text-sm text-indigo-600 hover:underline"
      >
        + 新增持股
      </button>

      {/* Cash */}
      <div className="mb-2 mt-5">
        <h3 className="text-sm font-semibold text-slate-600">現金 / 存款</h3>
      </div>
      <div className="space-y-2">
        {state.cashAccounts.map((c) => (
          <div key={c.id} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-5">
              <TextInput
                value={c.label}
                placeholder="帳戶（活存 / 定存…）"
                onChange={(v) =>
                  update((d) => {
                    d.cashAccounts.find((x) => x.id === c.id)!.label = v;
                  })
                }
              />
            </div>
            <div className="col-span-6">
              <NumberInput
                value={c.amountTwd}
                step={10000}
                suffix="元"
                onChange={(n) =>
                  update((d) => {
                    d.cashAccounts.find((x) => x.id === c.id)!.amountTwd = n;
                  })
                }
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <IconButton
                title="刪除"
                onClick={() =>
                  update((d) => {
                    d.cashAccounts = d.cashAccounts.filter((x) => x.id !== c.id);
                  })
                }
              >
                ✕
              </IconButton>
            </div>
          </div>
        ))}
        {state.cashAccounts.length === 0 && (
          <p className="text-sm text-slate-400">尚未新增現金帳戶。</p>
        )}
      </div>
      <button
        onClick={addCash}
        className="mt-2 text-sm text-indigo-600 hover:underline"
      >
        + 新增帳戶
      </button>

      {/* Grouping views */}
      {state.positions.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex gap-2">
            <ViewTab active={view === "account"} onClick={() => setView("account")}>
              依證券戶
            </ViewTab>
            <ViewTab active={view === "ticker"} onClick={() => setView("ticker")}>
              依代號合併
            </ViewTab>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {view === "account"
                ? summary.byAccount.map((a) => (
                    <tr key={a.account} className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-600">
                        {a.account || "（未命名）"}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {twd(a.valueTwd)}
                      </td>
                    </tr>
                  ))
                : summary.byTicker.map((t) => (
                    <tr key={t.ticker} className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-600">
                        {t.ticker || "（未填）"}
                        <span className="ml-2 text-xs text-slate-400">
                          {t.totalShares} 股
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {t.valueTwd === null ? "需報價" : twd(t.valueTwd)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <Field label="" hint="">
        <p className="mt-3 text-xs text-slate-400">
          收盤價來自證交所 OpenAPI（前一日收盤）；上櫃、美股或查無代號者請於「股價」欄手動輸入。USD→TWD 匯率：{state.usdTwdRate}
        </p>
      </Field>
    </Card>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={
          strong
            ? "text-lg font-bold text-indigo-700"
            : "text-base font-semibold text-slate-700"
        }
      >
        {value}
      </div>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700"
          : "rounded-md px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
      }
    >
      {children}
    </button>
  );
}
