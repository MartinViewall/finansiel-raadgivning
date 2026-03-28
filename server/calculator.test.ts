import { describe, expect, it } from "vitest";
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
 * Mirror of the server-side projectPortfolio function.
 * Uses actual historical returns cyclically; contribution added at start of each year.
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
    const rate = n > 0 ? (historicalReturns[i % n] ?? 0) / 100 : 0;
    value = (value + annualContribution) * (1 + rate);
    points.push({ year: i + 1, value: Math.round(value) });
  }
  return points;
}

describe("projectPortfolio (cyclic actual returns)", () => {
  it("returns initial capital at year 0", () => {
    const result = projectPortfolio(1_000_000, 0, [], 0);
    expect(result[0]).toEqual({ year: 0, value: 1_000_000 });
  });

  it("projects 1 year with 10% return and no contribution", () => {
    // (1_000_000 + 0) * 1.10 = 1_100_000
    const result = projectPortfolio(1_000_000, 0, [10], 1);
    expect(result).toHaveLength(2);
    expect(result[1]?.value).toBe(1_100_000);
  });

  it("projects 1 year with 10% return and 100k contribution", () => {
    // (1_000_000 + 100_000) * 1.10 = 1_210_000
    const result = projectPortfolio(1_000_000, 100_000, [10], 1);
    expect(result[1]?.value).toBe(1_210_000);
  });

  it("applies actual yearly returns sequentially (the example from requirements)", () => {
    // 1M depot, no contributions, returns: 10%, -5%, 12%
    // Year 1: (1_000_000 + 0) * 1.10 = 1_100_000
    // Year 2: (1_100_000 + 0) * 0.95 = 1_045_000
    // Year 3: (1_045_000 + 0) * 1.12 = 1_170_400
    const result = projectPortfolio(1_000_000, 0, [10, -5, 12], 3);
    expect(result[1]?.value).toBe(1_100_000);
    expect(result[2]?.value).toBe(1_045_000);
    expect(result[3]?.value).toBe(1_170_400);
  });

  it("cycles returns when horizon exceeds history length", () => {
    // 2 years of history [10, -5], 4 year horizon → [10, -5, 10, -5]
    const result = projectPortfolio(1_000_000, 0, [10, -5], 4);
    expect(result).toHaveLength(5);
    expect(result[1]?.value).toBe(1_100_000);
    expect(result[2]?.value).toBe(1_045_000);
    expect(result[3]?.value).toBe(1_149_500);
    expect(result[4]?.value).toBe(1_092_025);
  });

  it("handles zero return rate", () => {
    // Year 1: (500_000 + 50_000) * 1.0 = 550_000
    // Year 2: (550_000 + 50_000) * 1.0 = 600_000
    const result = projectPortfolio(500_000, 50_000, [0], 2);
    expect(result[1]?.value).toBe(550_000);
    expect(result[2]?.value).toBe(600_000);
  });

  it("handles negative returns", () => {
    // (1_000_000 + 0) * 0.90 = 900_000
    const result = projectPortfolio(1_000_000, 0, [-10], 1);
    expect(result[1]?.value).toBe(900_000);
  });

  it("returns only start point for 0 horizon years", () => {
    const result = projectPortfolio(2_000_000, 100_000, [11.7], 0);
    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe(2_000_000);
  });

  it("higher avg return produces meaningfully higher final value over 5 years", () => {
    // PFA: ~5.6% avg over 5 years, Nordea: ~10.4% avg over 5 years
    const pfaReturns = [11.7, -10.8, 9.2, 9.6, 8.1];
    const nordeaReturns = [21.6, -8.9, 13.2, 18.2, 8.1];
    const pfa = projectPortfolio(2_000_000, 100_000, pfaReturns, 5);
    const nordea = projectPortfolio(2_000_000, 100_000, nordeaReturns, 5);
    expect(nordea[5]!.value).toBeGreaterThan(pfa[5]!.value + 200_000);
  });
});
