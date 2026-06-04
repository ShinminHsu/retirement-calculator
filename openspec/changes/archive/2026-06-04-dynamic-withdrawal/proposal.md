## Why

The Monte Carlo result looks alarming (e.g. 48% success, median $0) partly because the model withdraws a **fixed real amount every year regardless of the market** — the most failure-prone strategy. Real retirees cut spending in bad years and spend more in good years. Adding a dynamic-withdrawal option (Guyton-Klinger guardrails) makes the projection and success rate far more realistic.

## What Changes

- 新增**提領策略**選項：`固定金額`（現況）或`動態護欄`。動態護欄＝退休後每年依「目前提領率 vs 計畫提領率」調整當年支出：提領率衝破上護欄（計畫率 ×(1+帶寬)）就**減支出**一段；跌破下護欄（×(1−帶寬)）就**加支出**一段。帶寬與調整幅度可調（預設 ±20% 帶寬、每次 ±10%）。
- 修改**退休規劃引擎**：退休階段套用所選策略；固定金額策略行為與測試結果不變。
- 動態護欄自然提高**蒙地卡羅成功率**（壞年自動少花、避免在低點耗盡），代價是壞年支出較低——UI 會說明這個取捨。
- 教學新增一節解釋動態提領。

## Non-Goals

（rejected approaches 記於 design.md。）

## Capabilities

### Modified Capabilities

- `retirement-projection`: 新增提領策略（固定／動態護欄）需求，套用於退休階段與蒙地卡羅。

## Impact

- 改 `src/lib/finance.ts`（`SimContext`/`simulatePath` 退休階段提領邏輯）；蒙地卡羅自動沿用。
- 資料模型新增 `withdrawalStrategy`、`guardrailBand`、`guardrailAdjust`；localStorage 合併向後相容（預設 `固定金額`，舊行為不變）。
- 無新增外部相依。
