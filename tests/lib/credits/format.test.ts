import { describe, expect, it } from "vitest";

import {
  formatCreditBalance,
  formatCreditDelta,
  formatCreditEstimate,
} from "@/lib/credits/format";

describe("credit formatting", () => {
  it("formats balances, estimates, and signed ledger deltas from microcredits", () => {
    expect(formatCreditBalance(5_000_000)).toBe("5.00M");
    expect(formatCreditEstimate(210_720)).toBe("~0.2107M");
    expect(formatCreditDelta(-5_000)).toBe("-0.0050M");
    expect(formatCreditDelta(5_000)).toBe("+0.0050M");
    expect(formatCreditDelta(0)).toBe("0.0000M");
  });
});
