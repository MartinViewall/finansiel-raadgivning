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

// -----------------------------------------------------------------------

/**
 * Projects future portfolio value using actual historical annual returns.
 *  - initialCapital: starting amount in DKK
 *  - annualContribution: yearly deposit added at the START of each year
 *  - historicalReturns: array of annual return percentages in chronological order
 *    (e.g. [11.7, -10.8, 9.2]). Applied sequentially; repeats cyclically if horizon
 *    exceeds the available history.
 *  - horizonYears: number of years to project forward
 *
 * Returns an array of { year, value } objects starting from year 0 (initial capital).
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
    // Contribution added at start of year, then actual return applied
    value = (value + annualContribution) * (1 + rate);
    points.push({ year: i + 1, value: Math.round(value) });
  }
  return points;
}

// -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
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

        // Exclude the current incomplete year (2026+) from projection data
        const CURRENT_YEAR = new Date().getFullYear();

        const results = selected.map((product) => {
          const allSorted = product.returns.sort((a, b) => a.year - b.year);

          // Returns used for projection: exclude current/incomplete year, chronological order
          const projectionReturns = allSorted
            .filter((r) => r.year < CURRENT_YEAR)
            .map((r) => parseFloat(String(r.returnPct)));

          // For the graph: use the last N years matching the horizon (most recent history)
          const horizonReturns = projectionReturns.slice(-input.horizonYears);

          // Project using actual yearly returns cyclically
          const projection = projectPortfolio(
            input.initialCapital,
            input.annualContribution,
            horizonReturns.length > 0 ? horizonReturns : projectionReturns,
            input.horizonYears
          );

          // Full-period average (all years excl. current) — for display only
          const avgReturn =
            projectionReturns.length > 0
              ? projectionReturns.reduce((s, r) => s + r, 0) / projectionReturns.length
              : 0;

          // Horizon-based average: last N years — used for Ø/år* in table and pension calc
          const avgReturnHorizon =
            horizonReturns.length > 0
              ? horizonReturns.reduce((s, r) => s + r, 0) / horizonReturns.length
              : avgReturn;

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
              isIncomplete: r.year >= CURRENT_YEAR,
            })),
          };
        });

        return { results, horizonYears: input.horizonYears };
      }),
  }),
});

export type AppRouter = typeof appRouter;
