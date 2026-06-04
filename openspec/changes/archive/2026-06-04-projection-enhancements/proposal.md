## Why

The MVP answers "when can I retire" with a single deterministic path. Three gaps remain from the earlier discussion: it can't show **Coast FIRE** (whether current assets alone will coast to the target), it ignores **one-off cashflows** (bonus, house down-payment, childbirth) that materially bend the curve, and it gives no sense of **risk** — a single return assumption hides how likely the plan actually is to succeed.

## What Changes

- 新增 **Coast FIRE 指標**：算出「現在停止存錢、光靠現有投資複利成長，到指定年齡（預設 65）能否達到退休目標」，顯示 Coast 數字、已達成/差額，以及「若今天起不再存錢，資產會在幾歲達標」。
- 新增 **不規則大筆收支事件**：使用者可在特定年齡加入一次性流入（年終、繼承）或流出（買房頭期、生小孩、買車），以今日購買力輸入；投影在該年度套用，流出不足時由現金桶補。事件納入逐年明細與曲線。
- 新增 **蒙地卡羅成功率**：以可調報酬波動度，對年化報酬抽樣跑多次（預設 1000 次）模擬累積＋提領全程，回報「計畫成功機率」與結束資產的分位數（p10/p50/p90）。
- 修改 **退休規劃引擎**：投影納入不規則事件；新增 Coast FIRE 計算；保持既有確定性投影與測試行為不變（無事件、無 MC 時結果相同）。

## Non-Goals

（rejected approaches 與 scope 排除記於 design.md。）

## Capabilities

### New Capabilities

- `cashflow-events`: 一次性收支事件的資料模型、輸入 UI、與其在投影中的套用規則。
- `monte-carlo-simulation`: 報酬抽樣模擬、成功率與結束資產分位數的計算與呈現。

### Modified Capabilities

- `retirement-projection`: 投影納入不規則事件；新增 Coast FIRE 指標需求。

## Impact

- 既有前端專案；改動 `src/lib/finance.ts`（投影、Coast FIRE）、新增 `src/lib/montecarlo.ts`，新增對應元件。
- 資料模型新增 `cashflowEvents` 與 MC/Coast 假設欄位；沿用 localStorage schema 合併（向後相容，舊備份仍可載入）。
- 無新增外部相依。
