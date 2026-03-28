import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { annualReturns, InsertUser, investmentProducts, users } from "../drizzle/schema";
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

export async function updateProduct(id: number, data: { name?: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(investmentProducts).set(data).where(eq(investmentProducts.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(investmentProducts).where(eq(investmentProducts.id, id));
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
