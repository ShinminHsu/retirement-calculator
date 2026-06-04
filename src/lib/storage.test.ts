// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { defaultState } from "../types";
import { importStateFromFile } from "./storage";

describe("export/import round-trip", () => {
  it("re-imports an exported backup intact", async () => {
    const state = defaultState();
    state.positions.push({
      id: "p1",
      account: "玉山",
      ticker: "0050",
      shares: 100,
      currency: "TWD",
    });
    state.income.annualIncome = 1_234_567;

    const json = JSON.stringify(state, null, 2);
    const file = new File([json], "backup.json", { type: "application/json" });
    const imported = await importStateFromFile(file);

    expect(imported.positions).toHaveLength(1);
    expect(imported.positions[0].ticker).toBe("0050");
    expect(imported.income.annualIncome).toBe(1_234_567);
  });

  it("rejects a non-backup file", async () => {
    const file = new File(['{"foo":1}'], "bad.json", {
      type: "application/json",
    });
    await expect(importStateFromFile(file)).rejects.toThrow();
  });
});
