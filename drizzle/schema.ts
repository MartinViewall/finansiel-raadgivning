import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Investment products (e.g. "PFA Profil Middel 15 år")
 * company     = Produktudbyder, e.g. "PFA"
 * productLine = Produkt, e.g. "LivsCyklus"
 * riskLevel   = Risikoniveau, e.g. "Moderat"
 * yearsToPension = År til pension, e.g. 15
 * aop         = Årlige omkostninger i procent
 * nhmId       = Unique NHM identifier from the data source
 */
export const investmentProducts = mysqlTable("investment_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  /** Hex color for chart line, e.g. "#4f46e5" */
  color: varchar("color", { length: 16 }).notNull().default("#4f46e5"),
  /** Produktudbyder / company name */
  company: varchar("company", { length: 128 }),
  /** Product line name */
  productLine: varchar("productLine", { length: 128 }),
  /** Risk level: Konservativ, Moderat, Aggressiv */
  riskLevel: varchar("riskLevel", { length: 64 }),
  /** Years to pension */
  yearsToPension: int("yearsToPension"),
  /** Annual cost percentage (ÅOP) */
  aop: decimal("aop", { precision: 6, scale: 4 }),
  /** NHM identifier from data source */
  nhmId: varchar("nhmId", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvestmentProduct = typeof investmentProducts.$inferSelect;
export type InsertInvestmentProduct = typeof investmentProducts.$inferInsert;

/**
 * Annual return data per product per year.
 * returnPct is stored as a decimal, e.g. 11.7 means 11.7%
 */
export const annualReturns = mysqlTable("annual_returns", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId")
    .notNull()
    .references(() => investmentProducts.id, { onDelete: "cascade" }),
  year: int("year").notNull(),
  /** Return percentage, e.g. 11.7 for 11.7% */
  returnPct: decimal("returnPct", { precision: 8, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnnualReturn = typeof annualReturns.$inferSelect;
export type InsertAnnualReturn = typeof annualReturns.$inferInsert;
