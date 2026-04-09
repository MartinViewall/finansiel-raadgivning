import { and, asc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { annualReturns, InsertUser, insuranceBasePrices, insuranceCompanies, insuranceSalaryScale, investmentProducts, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Investment Products ──────────────────────────────────────────────────────

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investmentProducts).orderBy(asc(investmentProducts.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(investmentProducts).where(eq(investmentProducts.id, id)).limit(1);
  return result[0];
}

export async function getProductsWithReturns() {
  const db = await getDb();
  if (!db) return [];
  const products = await db.select().from(investmentProducts).orderBy(asc(investmentProducts.createdAt));
  const returns = await db.select().from(annualReturns).orderBy(asc(annualReturns.year));
  return products.map((p) => ({
    ...p,
    returns: returns.filter((r) => r.productId === p.id),
  }));
}

export async function createProduct(data: { name: string; description?: string; color: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(investmentProducts).values(data);
  return result[0];
}

export async function updateProduct(id: number, data: {
  name?: string;
  description?: string;
  color?: string;
  company?: string;
  productLine?: string;
  riskLevel?: string;
  yearsToPension?: number;
  aop?: number;
  nhmId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Drizzle stores aop as decimal string in MySQL
  const { aop, ...rest } = data;
  const setData: Record<string, unknown> = { ...rest };
  if (aop !== undefined) setData.aop = String(aop);
  await db.update(investmentProducts).set(setData as Parameters<typeof db.update>[0] extends { set: (v: infer V) => unknown } ? V : never).where(eq(investmentProducts.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(investmentProducts).where(eq(investmentProducts.id, id));
}

export async function bulkDeleteProducts(ids: number[]) {
  if (ids.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(investmentProducts).where(inArray(investmentProducts.id, ids));
}

// ─── Annual Returns ───────────────────────────────────────────────────────────

export async function getReturnsByProductId(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(annualReturns).where(eq(annualReturns.productId, productId)).orderBy(asc(annualReturns.year));
}

export async function upsertAnnualReturn(productId: number, year: number, returnPct: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(annualReturns)
    .where(and(eq(annualReturns.productId, productId), eq(annualReturns.year, year)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(annualReturns)
      .set({ returnPct: String(returnPct) })
      .where(and(eq(annualReturns.productId, productId), eq(annualReturns.year, year)));
  } else {
    await db.insert(annualReturns).values({ productId, year, returnPct: String(returnPct) });
  }
}

export async function deleteAnnualReturn(productId: number, year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(annualReturns).where(and(eq(annualReturns.productId, productId), eq(annualReturns.year, year)));
}

// ─── Insurance ───────────────────────────────────────────────────────────────

export async function getInsuranceCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insuranceCompanies).orderBy(asc(insuranceCompanies.sortOrder));
}

export async function getInsuranceBasePrices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insuranceBasePrices).orderBy(asc(insuranceBasePrices.companyId));
}

export async function getInsuranceSalaryScale() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(insuranceSalaryScale).orderBy(asc(insuranceSalaryScale.salaryUpTo));
}

export async function upsertInsuranceBasePrice(
  companyId: number,
  coverageType: string,
  ratePct: number,
  fixedKr: number,
  baselinePct: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(insuranceBasePrices)
    .where(and(eq(insuranceBasePrices.companyId, companyId), eq(insuranceBasePrices.coverageType, coverageType)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(insuranceBasePrices)
      .set({ ratePct: String(ratePct), fixedKr: String(fixedKr), baselinePct: String(baselinePct) })
      .where(and(eq(insuranceBasePrices.companyId, companyId), eq(insuranceBasePrices.coverageType, coverageType)));
  } else {
    await db.insert(insuranceBasePrices).values({ companyId, coverageType, ratePct: String(ratePct), fixedKr: String(fixedKr), baselinePct: String(baselinePct) });
  }
}

export async function addInsuranceCompany(name: string, useEaFormula: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const all = await db.select().from(insuranceCompanies);
  const maxSort = all.reduce((m, c) => Math.max(m, c.sortOrder), 0);
  const result = await db.insert(insuranceCompanies).values({ name, useEaFormula: useEaFormula ? 1 : 0, sortOrder: maxSort + 1, isActive: 1 });
  return result;
}

export async function updateInsuranceCompany(id: number, data: { name?: string; useEaFormula?: boolean; isActive?: boolean; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const setData: Record<string, unknown> = {};
  if (data.name !== undefined) setData.name = data.name;
  if (data.useEaFormula !== undefined) setData.useEaFormula = data.useEaFormula ? 1 : 0;
  if (data.isActive !== undefined) setData.isActive = data.isActive ? 1 : 0;
  if (data.sortOrder !== undefined) setData.sortOrder = data.sortOrder;
  await db.update(insuranceCompanies).set(setData as Parameters<ReturnType<typeof drizzle>["update"]>[0] extends { set: (v: infer V) => unknown } ? V : never).where(eq(insuranceCompanies.id, id));
}

export async function deleteInsuranceCompany(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // cascade deletes base prices
  await db.delete(insuranceCompanies).where(eq(insuranceCompanies.id, id));
}
