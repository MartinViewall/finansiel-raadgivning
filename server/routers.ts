import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createProduct,
  deleteAnnualReturn,
  deleteProduct,
  getAllProducts,
  getProductsWithReturns,
  updateProduct,
  upsertAnnualReturn,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// ─── Projection Engine ────────────────────────────────────────────────────────

/**
 * Projects future portfolio value given:
 *  - initialCapital: starting amount in DKK
 *  - annualContribution: yearly deposit in DKK
 *  - avgAnnualReturnPct: average annual return percentage to apply each year
 *  - horizonYears: number of years to project forward
 *
 * Uses the average return as a fixed compound rate each year.
 * Contribution is added at the start of each year, then the return is applied.
 * Returns an array of { year, value } objects starting from year 0 (initial).
 */
function projectPortfolio(
  initialCapital: number,
  annualContribution: number,
  avgAnnualReturnPct: number,
  horizonYears: number
): { year: number; value: number }[] {
  const points: { year: number; value: number }[] = [{ year: 0, value: initialCapital }];
  let value = initialCapital;
  const rate = avgAnnualReturnPct / 100;
  for (let i = 0; i < horizonYears; i++) {
    // Add contribution at start of year, then apply fixed average return
    value = (value + annualContribution) * (1 + rate);
    points.push({ year: i + 1, value: Math.round(value) });
  }
  return points;
}

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Password Gate ─────────────────────────────────────────────────────────
  passwordGate: router({
    verify: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        const correct = process.env.APP_PASSWORD ?? "advisor2024";
        if (input.password !== correct) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Forkert adgangskode" });
        }
        return { success: true };
      }),
  }),

  // ─── Products ─────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.query(async () => {
      return getProductsWithReturns();
    }),

    /** Lightweight list for the cascade selector — no return data, just metadata */
    listMeta: publicProcedure.query(async () => {
      return getAllProducts();
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(256),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
        })
      )
      .mutation(async ({ input }) => {
        await createProduct(input);
        return { success: true };
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).max(128).optional(),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProduct(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ─── Annual Returns ────────────────────────────────────────────────────────
  returns: router({
    upsert: publicProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          year: z.number().int().min(1900).max(2100),
          returnPct: z.number().min(-100).max(1000),
        })
      )
      .mutation(async ({ input }) => {
        await upsertAnnualReturn(input.productId, input.year, input.returnPct);
        return { success: true };
      }),

    delete: publicProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          year: z.number().int(),
        })
      )
      .mutation(async ({ input }) => {
        await deleteAnnualReturn(input.productId, input.year);
        return { success: true };
      }),
  }),

  // ─── Calculator ────────────────────────────────────────────────────────────
  calculator: router({
    project: publicProcedure
      .input(
        z.object({
          initialCapital: z.number().min(0),
          annualContribution: z.number().min(0),
          horizonYears: z.number().int().min(1).max(50),
          productIds: z.array(z.number().int().positive()).min(1).max(5),
        })
      )
      .query(async ({ input }) => {
        const allProducts = await getProductsWithReturns();
        const selected = allProducts.filter((p) => input.productIds.includes(p.id));

        // Current year — exclude incomplete years (2026 and beyond) from projection engine
        const CURRENT_YEAR = new Date().getFullYear();
        const EXCLUDE_FROM_YEAR = CURRENT_YEAR; // exclude current + future incomplete years

        const results = selected.map((product) => {
          const allSorted = product.returns.sort((a, b) => a.year - b.year);

          // All returns excluding current/incomplete year
          const projectionReturns = allSorted
            .filter((r) => r.year < EXCLUDE_FROM_YEAR)
            .map((r) => parseFloat(String(r.returnPct)));
          // Full-period average (all years excl. current)
          const avgReturn =
            projectionReturns.length > 0
              ? projectionReturns.reduce((s, r) => s + r, 0) / projectionReturns.length
              : 0;
          // Horizon-based average: last N years matching the selected horizon
          const horizonReturns = projectionReturns.slice(-input.horizonYears);
          const avgReturnHorizon =
            horizonReturns.length > 0
              ? horizonReturns.reduce((s, r) => s + r, 0) / horizonReturns.length
              : avgReturn;
          // Project using the horizon-based average as a fixed compound rate
          const projection = projectPortfolio(
            input.initialCapital,
            input.annualContribution,
            avgReturnHorizon,
            input.horizonYears
          );

          return {
            productId: product.id,
            productName: product.name,
            color: product.color,
            projection,
            finalValue: projection[projection.length - 1]?.value ?? input.initialCapital,
            avgAnnualReturn: Math.round(avgReturn * 100) / 100,
            avgAnnualReturnHorizon: Math.round(avgReturnHorizon * 100) / 100,
            // All historical returns for the table (including current year for display)
            historicalReturns: allSorted.map((r) => ({
              year: r.year,
              returnPct: parseFloat(String(r.returnPct)),
              isIncomplete: r.year >= EXCLUDE_FROM_YEAR,
            })),
          };
        });

        return { results, horizonYears: input.horizonYears };
      }),
  }),
});

export type AppRouter = typeof appRouter;
