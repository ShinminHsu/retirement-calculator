// Taiwan labor-pension (勞退新制) and labor-insurance (勞保老年年金) estimators.
//
// Statutory figures are as of 民國115年 / 2026 (effective 2026-01-01):
//   - 勞保 ordinary-event insured-salary cap: 45,800
//   - 勞退 monthly-contribution-wage table cap: 150,000
//   - 老年年金 pension-claim age: 65 (fully phased in from 民國115年起)
// These are inputs/defaults below so the math stays explicit and auditable.

export const LABOR_PENSION_DATA_YEAR = "民國115年（2026）";

/** 勞保普通事故月投保薪資上限。 */
export const LABOR_INSURANCE_SALARY_CAP = 45_800;
/** 勞退新制月提繳工資上限（分級表最高級）。 */
export const PENSION_WAGE_CAP = 150_000;
/** 雇主法定強制提繳率。 */
export const EMPLOYER_RATE = 0.06;

// ---------- 勞退新制：個人專戶推估 ----------

export interface PensionAccountInput {
  /** 目前專戶餘額（雇主提繳累計 + 收益累計）。 */
  currentBalance: number;
  /** 月提繳工資（分級表級距，非實領薪資）。 */
  monthlyWage: number;
  /** 勞工自願提繳率，0–0.06。雇主 6% 為法定固定值。 */
  voluntaryRate: number;
  /** 距離請領（60 歲）還有幾年。 */
  yearsToClaim: number;
  /** 預估年化報酬率（保證收益不低於兩年定存利率）。 */
  annualReturn: number;
  /** 月退時將一次餘額攤提的年數（粗估用）。 */
  payoutYears: number;
}

export interface PensionAccountResult {
  /** 每月實際提繳金額（雇主 + 自願）。 */
  monthlyContribution: number;
  /** 請領時的預估專戶總額。 */
  projectedBalance: number;
  /** 一次領金額（= 專戶總額）。 */
  lumpSum: number;
  /** 月退估算（依攤提年數與報酬率粗估，非勞保局年金生命表）。 */
  estimatedMonthlyPayout: number;
}

export function projectPensionAccount(input: PensionAccountInput): PensionAccountResult {
  const wage = Math.min(Math.max(input.monthlyWage, 0), PENSION_WAGE_CAP);
  const rate = EMPLOYER_RATE + clamp(input.voluntaryRate, 0, 0.06);
  const monthlyContribution = wage * rate;

  const r = input.annualReturn;
  const n = Math.max(input.yearsToClaim, 0);
  const annualContribution = monthlyContribution * 12;

  // Future value of current balance + a growing-from-zero annuity of yearly contributions.
  const grownBalance = input.currentBalance * Math.pow(1 + r, n);
  const fvContrib =
    Math.abs(r) < 1e-9
      ? annualContribution * n
      : annualContribution * ((Math.pow(1 + r, n) - 1) / r);
  const projectedBalance = grownBalance + fvContrib;

  // Amortize the lump sum into a level monthly payout over payoutYears.
  const monthlyPayout = amortizedMonthlyPayment(
    projectedBalance,
    r,
    Math.max(input.payoutYears, 1),
  );

  return {
    monthlyContribution,
    projectedBalance,
    lumpSum: projectedBalance,
    estimatedMonthlyPayout: monthlyPayout,
  };
}

/** Level monthly payment that exhausts `principal` over `years` at annual rate `r`. */
export function amortizedMonthlyPayment(principal: number, r: number, years: number): number {
  const i = r / 12;
  const N = years * 12;
  if (N <= 0) return 0;
  if (Math.abs(i) < 1e-9) return principal / N;
  return (principal * i) / (1 - Math.pow(1 + i, -N));
}

// ---------- 勞保：老年年金試算 ----------

export interface LaborInsuranceInput {
  /** 平均月投保薪資（最高 60 個月平均，上限 45,800）。 */
  avgInsuredSalary: number;
  /** 投保年資（年）。 */
  years: number;
  /** 相對標準請領年齡（65 歲）提前(−)/延後(+)的年數，−5 ~ +5。 */
  claimAgeOffset: number;
}

export interface LaborInsuranceResult {
  /** A 式：平均薪資 × 年資 × 0.775% + 3000。 */
  formulaA: number;
  /** B 式：平均薪資 × 年資 × 1.55%。 */
  formulaB: number;
  /** 兩式取大者（調整前）。 */
  baseMonthly: number;
  /** 提前/延後調整係數。 */
  adjustFactor: number;
  /** 調整後實際月領金額。 */
  monthly: number;
}

export function estimateLaborInsurancePension(
  input: LaborInsuranceInput,
): LaborInsuranceResult {
  const salary = Math.min(Math.max(input.avgInsuredSalary, 0), LABOR_INSURANCE_SALARY_CAP);
  const years = Math.max(input.years, 0);

  const formulaA = salary * years * 0.00775 + 3000;
  const formulaB = salary * years * 0.0155;
  const baseMonthly = Math.max(formulaA, formulaB);

  // ±4% per year, capped at ±20% (≦5 年).
  const offset = clamp(input.claimAgeOffset, -5, 5);
  const adjustFactor = 1 + 0.04 * offset;
  const monthly = baseMonthly * adjustFactor;

  return { formulaA, formulaB, baseMonthly, adjustFactor, monthly };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
