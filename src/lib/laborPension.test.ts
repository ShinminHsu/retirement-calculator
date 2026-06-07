import { describe, expect, it } from "vitest";
import {
  amortizedMonthlyPayment,
  estimateLaborInsurancePension,
  projectPensionAccount,
} from "./laborPension";

describe("projectPensionAccount", () => {
  it("adds employer 6% + voluntary rate on the contribution", () => {
    const r = projectPensionAccount({
      currentBalance: 0,
      monthlyWage: 100_000,
      voluntaryRate: 0.06,
      yearsToClaim: 0,
      annualReturn: 0,
      payoutYears: 20,
    });
    // 12% of 100,000.
    expect(r.monthlyContribution).toBe(12_000);
  });

  it("caps the monthly wage at the table ceiling", () => {
    const r = projectPensionAccount({
      currentBalance: 0,
      monthlyWage: 500_000,
      voluntaryRate: 0,
      yearsToClaim: 0,
      annualReturn: 0,
      payoutYears: 20,
    });
    // 6% of capped 150,000.
    expect(r.monthlyContribution).toBe(9_000);
  });

  it("grows the balance and contributions with zero rate (pure sum)", () => {
    const r = projectPensionAccount({
      currentBalance: 100_000,
      monthlyWage: 100_000,
      voluntaryRate: 0,
      yearsToClaim: 10,
      annualReturn: 0,
      payoutYears: 20,
    });
    // 100k start + 6,000/mo * 12 * 10 yr = 100k + 720k.
    expect(r.projectedBalance).toBeCloseTo(820_000, 0);
  });

  it("compounds the current balance", () => {
    const r = projectPensionAccount({
      currentBalance: 100_000,
      monthlyWage: 0,
      voluntaryRate: 0,
      yearsToClaim: 10,
      annualReturn: 0.03,
      payoutYears: 20,
    });
    expect(r.projectedBalance).toBeCloseTo(100_000 * Math.pow(1.03, 10), 0);
  });
});

describe("amortizedMonthlyPayment", () => {
  it("splits evenly at zero rate", () => {
    expect(amortizedMonthlyPayment(240_000, 0, 20)).toBeCloseTo(1000, 6);
  });
});

describe("estimateLaborInsurancePension", () => {
  it("picks the larger of the two formulas (B式 for long tenure)", () => {
    const r = estimateLaborInsurancePension({
      avgInsuredSalary: 45_800,
      years: 30,
      claimAgeOffset: 0,
    });
    expect(r.formulaB).toBeCloseTo(45_800 * 30 * 0.0155, 6);
    expect(r.baseMonthly).toBe(r.formulaB);
    expect(r.monthly).toBe(r.baseMonthly);
  });

  it("caps the insured salary at 45,800", () => {
    const capped = estimateLaborInsurancePension({
      avgInsuredSalary: 80_000,
      years: 20,
      claimAgeOffset: 0,
    });
    const atCap = estimateLaborInsurancePension({
      avgInsuredSalary: 45_800,
      years: 20,
      claimAgeOffset: 0,
    });
    expect(capped.monthly).toBe(atCap.monthly);
  });

  it("reduces 4% per year early, max 20%", () => {
    const r = estimateLaborInsurancePension({
      avgInsuredSalary: 45_800,
      years: 30,
      claimAgeOffset: -5,
    });
    expect(r.adjustFactor).toBeCloseTo(0.8, 6);
  });

  it("adds 4% per year late, max 20%", () => {
    const r = estimateLaborInsurancePension({
      avgInsuredSalary: 45_800,
      years: 30,
      claimAgeOffset: 3,
    });
    expect(r.adjustFactor).toBeCloseTo(1.12, 6);
  });
});
