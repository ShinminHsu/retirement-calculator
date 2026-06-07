import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "./useAppState";
import { project } from "./lib/finance";
import { exportStateToFile, importStateFromFile } from "./lib/storage";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { IncomeBudgetPanel } from "./components/IncomeBudgetPanel";
import { AssumptionsPanel } from "./components/AssumptionsPanel";
import { ResultSummary } from "./components/ResultSummary";
import { ProjectionChart } from "./components/ProjectionChart";
import { CalculationBreakdown } from "./components/CalculationBreakdown";
import { CoastFireCard } from "./components/CoastFireCard";
import { MonteCarloPanel } from "./components/MonteCarloPanel";
import { CashflowEventsPanel } from "./components/CashflowEventsPanel";
import { SpendingSolverPanel } from "./components/SpendingSolverPanel";
import { TutorialTab } from "./components/TutorialTab";
import { LaborPensionTab } from "./components/LaborPensionTab";

type Tab = "calc" | "learn" | "labor";

export default function App() {
  const { state, setState, update, reset } = useAppState();
  const fileInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("calc");

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    try {
      const imported = await importStateFromFile(file);
      if (confirm("匯入會覆蓋目前所有資料，確定？")) setState(imported);
    } catch (err) {
      alert(`匯入失敗：${err instanceof Error ? err.message : "未知錯誤"}`);
    }
  }

  // Recompute projection reactively whenever inputs change (what-if).
  const result = useMemo(() => project(state), [state]);

  // Track retirement-age delta vs the previous settings.
  const prevAge = useRef<number | null>(result.retirementAge);
  const [ageDelta, setAgeDelta] = useState<number | null>(null);
  useEffect(() => {
    const before = prevAge.current;
    const now = result.retirementAge;
    if (before !== null && now !== null && before !== now) {
      setAgeDelta(now - before);
    } else {
      setAgeDelta(null);
    }
    prevAge.current = now;
  }, [result.retirementAge]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">退休試算器</h1>
          <p className="mt-1 text-sm text-slate-500">
            保底＋上漲框架 · 全程今日購買力 · 資料只存在你的瀏覽器
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => exportStateToFile(state)}
            className="text-slate-500 hover:text-indigo-600 hover:underline"
          >
            匯出備份
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="text-slate-500 hover:text-indigo-600 hover:underline"
          >
            匯入備份
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
          <button
            onClick={() => {
              if (confirm("確定清除所有資料？此動作無法復原。")) reset();
            }}
            className="text-slate-400 hover:text-rose-600 hover:underline"
          >
            清除所有資料
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>
          試算
        </TabButton>
        <TabButton active={tab === "learn"} onClick={() => setTab("learn")}>
          教學
        </TabButton>
        <TabButton active={tab === "labor"} onClick={() => setTab("labor")}>
          勞保勞退
        </TabButton>
      </div>

      {tab === "learn" ? (
        <TutorialTab />
      ) : tab === "labor" ? (
        <LaborPensionTab />
      ) : (
        <>
      <div className="mb-6">
        <ResultSummary result={result} ageDelta={ageDelta} />
      </div>

      <div className="mb-6">
        <ProjectionChart result={result} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <CoastFireCard state={state} update={update} />
        <MonteCarloPanel state={state} update={update} />
        <SpendingSolverPanel state={state} />
      </div>

      <div className="mb-6">
        <CalculationBreakdown state={state} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <PortfolioPanel state={state} update={update} />
          <CashflowEventsPanel state={state} update={update} />
        </div>
        <div className="space-y-6">
          <IncomeBudgetPanel state={state} update={update} />
          <AssumptionsPanel state={state} update={update} />
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        試算為單一報酬率的確定性估計，僅供規劃參考，非投資建議。
      </footer>
        </>
      )}
    </div>
  );
}

function TabButton({
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
          ? "-mb-px border-b-2 border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700"
          : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
      }
    >
      {children}
    </button>
  );
}
