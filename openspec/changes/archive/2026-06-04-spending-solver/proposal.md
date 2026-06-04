## Why

The tool can tell you the success rate for a given spending level, but the more useful question is the inverse: "**how much can I safely spend?**" Users who are over-funded (e.g. 30M left at 95) have no easy way to quantify their headroom. A solver that, given a target success rate, returns the maximum sustainable retirement spending answers this directly.

## What Changes

- 新增**可花上限求解器**：給定目標成功率（預設 90%），用二分搜尋對「退休後年支出」反推出能達到該成功率的**最高年支出**，並回報其達成的實際成功率。
- 求解時沿用目前的所有假設（報酬、波動、提領策略含動態護欄、勞保勞退保證收入），讓結果與主畫面一致。
- 新增 UI：輸入目標成功率 → 顯示「可花上限 ＝ XX 萬/年」，並與目前設定的退休後年支出對比（多／少多少）。
- 教學新增一節說明這個反推用法。

## Non-Goals

（rejected approaches 記於 design.md。）

## Capabilities

### New Capabilities

- `spending-solver`: 給定成功率反推最高可持續退休年支出的計算與呈現。

## Impact

- 新增 `solveMaxSpending` 於 `src/lib/montecarlo.ts`（沿用 `runMonteCarlo`），新增一個面板元件。
- 無資料模型變更（求解時暫時覆寫 `retirementSpendingOverride` 跑模擬，不寫回狀態）。
- 無新增外部相依。
