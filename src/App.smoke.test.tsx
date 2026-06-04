// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import App from "./App";

afterEach(cleanup);

describe("App smoke", () => {
  it("mounts the full component tree without throwing", () => {
    const { getByText, container } = render(<App />);
    expect(getByText("退休試算器")).toBeTruthy();
    // Result summary headline renders.
    expect(getByText("退休目標金額")).toBeTruthy();
    // Panels render.
    expect(getByText("資產")).toBeTruthy();
    expect(getByText("收入與支出")).toBeTruthy();
    expect(getByText("假設與情境")).toBeTruthy();
    expect(container).toBeTruthy();
  });

  it("adding a position via the button does not crash", () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText("+ 新增持股"));
    fireEvent.click(getByText("+ 新增帳戶"));
    // Still alive after state updates.
    expect(getByText("總淨值")).toBeTruthy();
  });
});
