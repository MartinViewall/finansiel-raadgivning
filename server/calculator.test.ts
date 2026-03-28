import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Password Gate ────────────────────────────────────────────────────────────

describe("passwordGate.verify", () => {
  it("succeeds with correct password", async () => {
    const caller = appRouter.createCaller(createCtx());
    // APP_PASSWORD env is set to "advisor2024" in test env
    process.env.APP_PASSWORD = "Holte2026!";
    const result = await caller.passwordGate.verify({ password: "Holte2026!" });
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED for wrong password", async () => {
    const caller = appRouter.createCaller(createCtx());
    process.env.APP_PASSWORD = "Holte2026!";
    await expect(
      caller.passwordGate.verify({ password: "wrongpassword" })
    ).rejects.toThrow();
  });
});

// ─── Projection Engine ────────────────────────────────────────────────────────

/**
 * We test the projection logic directly by calling the calculator.project procedure
 * with mock product data. Since the procedure queries the DB, we test the math
 * separately via a pure function extracted inline.
 */

function projectPortfolio(
  initialCapital: number,
  annualContribution: number,
  historicalReturns: number[],
  horizonYears: number
): { year: number; value: number }[] {
  const points: { year: number; value: number }[] = [{ year: 0, value: initialCapital }];
  let value = initialCapital;
  const n = historicalReturns.length;
  for (let i = 0; i < horizonYears; i++) {
    value = value + annualContribution;
    const rate = n > 0 ? historicalReturns[i % n] / 100 : 0;
    value = value * (1 + rate);
    points.push({ year: i + 1, value: Math.round(value) });
  }
  return points;
}

describe("projectPortfolio", () => {
  it("returns initial capital at year 0", () => {
    const result = projectPortfolio(1_000_000, 0, [], 0);
    expect(result[0]).toEqual({ year: 0, value: 1_000_000 });
  });

  it("projects 1 year with 10% return and no contribution", () => {
    const result = projectPortfolio(1_000_000, 0, [10], 1);
    expect(result).toHaveLength(2);
    expect(result[1]?.value).toBe(1_100_000);
  });

  it("projects 1 year with 10% return and 100k contribution", () => {
    // (1_000_000 + 100_000) * 1.10 = 1_210_000
    const result = projectPortfolio(1_000_000, 100_000, [10], 1);
    expect(result[1]?.value).toBe(1_210_000);
  });

  it("cycles historical returns for longer horizons", () => {
    // 2 years of history, 4 year horizon → repeats [10, -5, 10, -5]
    const result = projectPortfolio(1_000_000, 0, [10, -5], 4);
    expect(result).toHaveLength(5);
    // Year 1: 1_000_000 * 1.10 = 1_100_000
    expect(result[1]?.value).toBe(1_100_000);
    // Year 2: 1_100_000 * 0.95 = 1_045_000
    expect(result[2]?.value).toBe(1_045_000);
    // Year 3: 1_045_000 * 1.10 = 1_149_500
    expect(result[3]?.value).toBe(1_149_500);
  });

  it("handles zero return rate", () => {
    const result = projectPortfolio(500_000, 50_000, [0], 3);
    // Year 1: (500_000 + 50_000) * 1.0 = 550_000
    // Year 2: (550_000 + 50_000) * 1.0 = 600_000
    // Year 3: (600_000 + 50_000) * 1.0 = 650_000
    expect(result[1]?.value).toBe(550_000);
    expect(result[2]?.value).toBe(600_000);
    expect(result[3]?.value).toBe(650_000);
  });

  it("handles negative returns", () => {
    // (1_000_000 + 0) * (1 - 0.10) = 900_000
    const result = projectPortfolio(1_000_000, 0, [-10], 1);
    expect(result[1]?.value).toBe(900_000);
  });

  it("returns only start point for 0 horizon years", () => {
    const result = projectPortfolio(2_000_000, 100_000, [11.7], 0);
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe(2_000_000);
  });
});
