import { ReactNode, useMemo, useState } from "react";
import { twd } from "../lib/format";
import {
  LABOR_INSURANCE_SALARY_CAP,
  LABOR_PENSION_DATA_YEAR,
  PENSION_WAGE_CAP,
  estimateLaborInsurancePension,
  projectPensionAccount,
} from "../lib/laborPension";

// Plain-language explainer + two estimators for Taiwan's two retirement systems:
// 勞保 (labor insurance, a social-insurance annuity) and 勞退 (labor pension, a
// personal account). Statutory figures sourced as of 民國115年 / 2026.
export function LaborPensionTab() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <Intro />

      <Section n={1} title="勞保 vs 勞退：最常被搞混的兩件事">
        <P>
          它們名字像，其實是兩套<B>完全獨立</B>的制度，退休時是<B>兩筆分開的錢</B>：
        </P>
        <table className="my-3 w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left"></th>
              <th className="px-3 py-2 text-left">勞保（勞工保險）</th>
              <th className="px-3 py-2 text-left">勞退（勞工退休金）</th>
            </tr>
          </thead>
          <tbody>
            <Row k="本質" a="一種社會保險" b="你的個人退休帳戶" />
            <Row k="錢哪來" a="你 + 雇主 + 政府繳保費" b="雇主提繳為主，可自願加碼" />
            <Row k="怎麼領" a="依公式算「老年年金」" b="領你專戶累積的本金 + 收益" />
            <Row k="領多少看" a="平均投保薪資 × 年資" b="帳戶裡實際存了多少" />
          </tbody>
        </table>
        <P>
          一句話：<B>勞退是「存錢」，勞保是「保險」</B>。下面分開講。
        </P>
      </Section>

      <Section n={2} title="勞退新制：一個保證不虧的個人帳戶">
        <UL>
          <li>
            <B>雇主每月強制提繳 6%</B>：以「月提繳工資」（分級表級距，不是實領薪水）計算，存進你的專屬帳戶，<B>不能少</B>。
          </li>
          <li>
            <B>你可自願再提繳 0–6%</B>：這部分可從當年薪資所得中<B>扣除節稅</B>。
          </li>
          <li>
            <B>政府保證收益</B>：帳戶拿去投資，但保證不低於「兩年期定存利率」，<B>不會虧本</B>。
          </li>
          <li>
            <B>年滿 60 歲請領</B>：年資滿 15 年可選「月領（年金）」或「一次領」；未滿 15 年只能一次領。
          </li>
        </UL>
        <Formula>帳戶總額 ≈ 目前餘額 ×(1+報酬)^年數 + 每月提繳累積</Formula>
      </Section>

      <Section n={3} title="勞保老年年金：終身月領的年金">
        <P>退休後每月固定領、領到過世。金額用兩條公式<B>取大者</B>：</P>
        <Formula>A 式 = 平均月投保薪資 × 年資 × 0.775% + 3,000</Formula>
        <Formula>B 式 = 平均月投保薪資 × 年資 × 1.55%</Formula>
        <UL>
          <li>
            <B>平均月投保薪資</B>：取你投保期間<B>最高 60 個月</B>的平均。
          </li>
          <li>
            <B>投保薪資有上限 {twd(LABOR_INSURANCE_SALARY_CAP)}</B>：薪水再高，勞保也只用這個數字算。
          </li>
          <li>
            <B>請領年齡（民國115年起）為 65 歲</B>：每<B>提前</B>1 年減 4%（最多 −20%）；每<B>延後</B>1 年增 4%（最多 +20%）。
          </li>
        </UL>
        <P className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
          ⚠️ 還有第三個「災保（職災保險）」上限 {twd(72_800)}，但<B>只跟工作受傷／職業病有關</B>，正常退休用不到，這裡不算它。
        </P>
      </Section>

      <Section n={4} title="什麼時候才領得到？60 歲是硬門檻">
        <P>
          最多人誤會的一點：<B>「退休（不工作）」和「領勞退」是兩件事</B>。請領條件如下：
        </P>
        <table className="my-3 w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">你的狀況</th>
              <th className="px-3 py-2 text-left">能不能領</th>
              <th className="px-3 py-2 text-left">怎麼領</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-t border-slate-100">
              <td className="px-3 py-2">滿 60 歲 + 提繳年資 ≥ 15 年</td>
              <td className="px-3 py-2 text-emerald-600">✅</td>
              <td className="px-3 py-2">月領或一次領，自己選</td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-3 py-2">滿 60 歲 + 提繳年資 &lt; 15 年</td>
              <td className="px-3 py-2 text-emerald-600">✅</td>
              <td className="px-3 py-2">只能一次領</td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-3 py-2">未滿 60 歲</td>
              <td className="px-3 py-2 text-rose-500">❌</td>
              <td className="px-3 py-2">錢留帳戶繼續滾，等到 60 歲</td>
            </tr>
          </tbody>
        </table>
        <UL>
          <li>
            <B>60 歲是硬門檻</B>，一定要到；「15 年」只決定你<B>能不能選月領</B>，不是能不能領。
          </li>
          <li>
            <B>提早退休那幾年要自己撐</B>：你 45、50 歲想不工作，隨時可以離職，但勞退這筆錢<B>不會跟著解鎖</B>，得靠自己的存款／投資過渡到 60 歲。
          </li>
        </UL>
        <P className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
          ⚠️ 少數例外可未滿 60 歲提前領：領取勞保<B>失能年金／一次失能給付</B>（完全或嚴重失能）、國保身心障礙給付，或<B>死亡</B>由遺屬請領。正常退休用不到。
        </P>
        <P>
          所以在「試算」分頁，勞保／勞退是 <B>60（或 65）歲後</B>才進場的現金流；<B>60 歲前的生活費要自己準備</B>，這正是規劃提早退休最關鍵、也最多人忽略的一點。
        </P>
      </Section>

      <PensionAccountCalculator />
      <LaborInsuranceCalculator />

      <p className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        法定數字依{LABOR_PENSION_DATA_YEAR}制度（2026-01-01 生效）整理，僅供概念試算；
        實際金額以勞動部勞工保險局核定為準。
      </p>
    </div>
  );
}

// ---------- 勞退試算機 ----------

function PensionAccountCalculator() {
  // Defaults seeded from a typical high-earner profile; all editable.
  const [currentBalance, setCurrentBalance] = useState(295_744);
  const [monthlyWage, setMonthlyWage] = useState(126_300);
  const [voluntaryRate, setVoluntaryRate] = useState(0); // percent points
  const [yearsToClaim, setYearsToClaim] = useState(25);
  const [annualReturn, setAnnualReturn] = useState(3); // percent
  const [payoutYears, setPayoutYears] = useState(20);

  const result = useMemo(
    () =>
      projectPensionAccount({
        currentBalance,
        monthlyWage,
        voluntaryRate: voluntaryRate / 100,
        yearsToClaim,
        annualReturn: annualReturn / 100,
        payoutYears,
      }),
    [currentBalance, monthlyWage, voluntaryRate, yearsToClaim, annualReturn, payoutYears],
  );

  return (
    <CalcCard title="🧮 勞退新制試算機">
      <div className="grid gap-4 sm:grid-cols-2">
        <Num
          label="目前專戶餘額"
          hint="雇主提繳 + 收益累計"
          value={currentBalance}
          onChange={setCurrentBalance}
          step={1000}
          suffix="元"
        />
        <Num
          label="月提繳工資"
          hint={`分級表級距，上限 ${PENSION_WAGE_CAP.toLocaleString()}`}
          value={monthlyWage}
          onChange={setMonthlyWage}
          step={100}
          suffix="元"
        />
        <Num
          label="自願提繳率"
          hint="雇主固定 6%，你可加 0–6%"
          value={voluntaryRate}
          onChange={setVoluntaryRate}
          step={1}
          suffix="%"
        />
        <Num
          label="距 60 歲還有"
          value={yearsToClaim}
          onChange={setYearsToClaim}
          step={1}
          suffix="年"
        />
        <Num
          label="預估年化報酬"
          hint="保證不低於兩年定存"
          value={annualReturn}
          onChange={setAnnualReturn}
          step={0.5}
          suffix="%"
        />
        <Num
          label="月退攤提年數"
          hint="估月領用，非官方生命表"
          value={payoutYears}
          onChange={setPayoutYears}
          step={1}
          suffix="年"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat
          label="每月提繳"
          value={twd(result.monthlyContribution)}
          sub={`月提繳工資 ×（6% + ${voluntaryRate}%）`}
        />
        <Stat
          label="60 歲時專戶總額"
          value={twd(result.projectedBalance)}
          highlight
          sub="一次領就是這個數字"
        />
        <Stat
          label="估月領"
          value={twd(result.estimatedMonthlyPayout)}
          sub={`總額分 ${payoutYears} 年攤提（粗估）`}
        />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        「估月領」是把專戶總額用設定的報酬率與年數攤提的粗估值；勞保局實際月退是依
        <B>年金生命表</B>與規定利率計算，金額會略有差異。
      </p>
    </CalcCard>
  );
}

// ---------- 勞保試算機 ----------

const OFFSET_OPTIONS = [
  { v: -5, label: "60 歲（提前5年）" },
  { v: -4, label: "61 歲" },
  { v: -3, label: "62 歲" },
  { v: -2, label: "63 歲" },
  { v: -1, label: "64 歲" },
  { v: 0, label: "65 歲（標準）" },
  { v: 1, label: "66 歲" },
  { v: 2, label: "67 歲" },
  { v: 3, label: "68 歲" },
  { v: 4, label: "69 歲" },
  { v: 5, label: "70 歲（延後5年）" },
];

function LaborInsuranceCalculator() {
  const [avgInsuredSalary, setAvgInsuredSalary] = useState(45_800);
  const [years, setYears] = useState(30);
  const [claimAgeOffset, setClaimAgeOffset] = useState(0);

  const result = useMemo(
    () => estimateLaborInsurancePension({ avgInsuredSalary, years, claimAgeOffset }),
    [avgInsuredSalary, years, claimAgeOffset],
  );

  const useA = result.baseMonthly === result.formulaA;

  return (
    <CalcCard title="🧮 勞保老年年金試算機">
      <div className="grid gap-4 sm:grid-cols-2">
        <Num
          label="平均月投保薪資"
          hint={`最高60月平均，上限 ${LABOR_INSURANCE_SALARY_CAP.toLocaleString()}`}
          value={avgInsuredSalary}
          onChange={setAvgInsuredSalary}
          step={100}
          suffix="元"
        />
        <Num label="投保年資" value={years} onChange={setYears} step={1} suffix="年" />
        <label className="block sm:col-span-2">
          <div className="mb-1 text-sm font-medium text-slate-600">請領年齡</div>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={claimAgeOffset}
            onChange={(e) => setClaimAgeOffset(Number(e.target.value))}
          >
            {OFFSET_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
                {o.v < 0 ? `（減${Math.abs(o.v) * 4}%）` : o.v > 0 ? `（增${o.v * 4}%）` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat
          label={`A 式${useA ? "（採用）" : ""}`}
          value={twd(result.formulaA)}
          sub="× 0.775% + 3,000"
        />
        <Stat
          label={`B 式${!useA ? "（採用）" : ""}`}
          value={twd(result.formulaB)}
          sub="× 1.55%"
        />
        <Stat
          label="實際月領"
          value={twd(result.monthly)}
          highlight
          sub={`取大者 ×${result.adjustFactor.toFixed(2)}`}
        />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        勞保局自動以對你較有利的算式給付；年資越長通常 B 式較高。月領金額領到身故。
      </p>
    </CalcCard>
  );
}

// ---------- shared UI ----------

function Intro() {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
      <h2 className="text-lg font-bold text-slate-800">勞保 & 勞退 是什麼？</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        這兩個是你退休現金流的<B>地基</B>——政府／半政府的終身保障。先用白話分清楚兩者差別，
        再用下面的試算機估出「我大概能領多少」，把數字填回「試算」分頁的<B>每月保證收入</B>，整份規劃就更準。
        <span className="mt-2 block text-xs text-emerald-700">
          法定數字依 {LABOR_PENSION_DATA_YEAR} 制度整理。
        </span>
      </p>
    </div>
  );
}

function CalcCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

function Num({
  label,
  hint,
  value,
  onChange,
  step,
  suffix,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="shrink-0 text-sm text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-indigo-300 bg-white p-3"
          : "rounded-lg border border-slate-200 bg-white p-3"
      }
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={
          highlight
            ? "mt-1 text-lg font-bold tabular-nums text-indigo-700"
            : "mt-1 text-lg font-semibold tabular-nums text-slate-700"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function Row({ k, a, b }: { k: string; a: string; b: string }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2 font-medium text-slate-500">{k}</td>
      <td className="px-3 py-2 text-slate-700">{a}</td>
      <td className="px-3 py-2 text-slate-700">{b}</td>
    </tr>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-700">
          {n}
        </span>
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-slate-800">{children}</strong>;
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
}
function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 rounded-lg bg-slate-50 px-4 py-3 text-center font-mono text-sm text-indigo-700">
      {children}
    </div>
  );
}
