import { Router } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { getDb } from "./db";
import { investmentProducts, annualReturns } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export const uploadExcelRouter = Router();

const COLORS = [
  "#E63946", "#2A9D8F", "#E9C46A", "#264653", "#F4A261",
  "#A8DADC", "#457B9D", "#6A4C93", "#1982C4", "#8AC926",
  "#FF595E", "#FFCA3A", "#6A4C93", "#1982C4", "#8AC926",
];

function pickColor(index: number): string {
  return COLORS[index % COLORS.length];
}

type ProductRow = typeof investmentProducts.$inferSelect;

uploadExcelRouter.post("/api/upload-excel", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Ingen fil modtaget" });
    return;
  }

  const db = await getDb();
  if (!db) {
    res.status(500).json({ error: "Database ikke tilgængelig" });
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(req.file.buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      res.status(400).json({ error: "Excel-filen indeholder ingen ark" });
      return;
    }

    // Parse header row
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value ?? "").trim());
    });

    // Detect year columns (4-digit years 2000-2100)
    const yearColumns: { col: number; year: number }[] = [];
    headers.forEach((h, i) => {
      const y = parseInt(h, 10);
      if (y >= 2000 && y <= 2100) yearColumns.push({ col: i + 1, year: y });
    });

    if (yearColumns.length === 0) {
      res.status(400).json({ error: "Ingen årskolonner fundet. Forventet format: kolonner med årstal (f.eks. 2021, 2022...)" });
      return;
    }

    const colIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase()) + 1;

    const colNhmId = colIndex("NHM_ID");
    const colName = colIndex("Name");
    const colCompany = colIndex("Company");
    const colRisk = colIndex("Risk");
    const colYears = colIndex("YearsToPension");
    const colAop = colIndex("AOP");
    const colProductLine = colIndex("ProductLine");

    if (colName === 0) {
      res.status(400).json({ error: "Kolonnen 'Name' mangler i Excel-filen" });
      return;
    }

    // Load existing products
    const existingProducts = await db.select().from(investmentProducts);
    const byNhmId = new Map<string, ProductRow>(
      existingProducts.filter(p => p.nhmId).map(p => [p.nhmId!, p])
    );
    const byName = new Map<string, ProductRow>(
      existingProducts.map(p => [p.name.trim().toLowerCase(), p])
    );

    let productsUpdated = 0;
    let productsCreated = 0;
    let returnsUpdated = 0;
    let returnsCreated = 0;
    const errors: string[] = [];
    const totalExisting = existingProducts.length;

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);

      const rawName = String(row.getCell(colName).value ?? "").trim();
      if (!rawName) continue;

      const nhmId = colNhmId > 0 ? String(row.getCell(colNhmId).value ?? "").trim() || null : null;
      const company = colCompany > 0 ? String(row.getCell(colCompany).value ?? "").trim() || null : null;
      const riskLevel = colRisk > 0 ? String(row.getCell(colRisk).value ?? "").trim() || null : null;
      const productLine = colProductLine > 0 ? String(row.getCell(colProductLine).value ?? "").trim() || null : null;
      const yearsToPensionRaw = colYears > 0 ? row.getCell(colYears).value : null;
      const yearsToPension = yearsToPensionRaw !== null && yearsToPensionRaw !== "-" && yearsToPensionRaw !== ""
        ? parseInt(String(yearsToPensionRaw), 10) || null
        : null;
      const aopRaw = colAop > 0 ? row.getCell(colAop).value : null;
      const aop = aopRaw !== null && aopRaw !== "" ? parseFloat(String(aopRaw)) || null : null;

      // Find or create product
      let product: ProductRow | undefined =
        (nhmId ? byNhmId.get(nhmId) : undefined) ?? byName.get(rawName.toLowerCase());

      if (product) {
        await db.update(investmentProducts).set({
          name: rawName,
          company: company ?? product.company,
          productLine: productLine ?? product.productLine,
          riskLevel: riskLevel ?? product.riskLevel,
          yearsToPension: yearsToPension ?? product.yearsToPension,
          aop: aop !== null ? String(aop) : product.aop,
          nhmId: nhmId ?? product.nhmId,
        }).where(eq(investmentProducts.id, product.id));
        productsUpdated++;
      } else {
        const colorIndex = totalExisting + productsCreated;
        const [inserted] = await db.insert(investmentProducts).values({
          name: rawName,
          company,
          productLine,
          riskLevel,
          yearsToPension,
          aop: aop !== null ? String(aop) : null,
          nhmId,
          color: pickColor(colorIndex),
          description: null,
        }).$returningId();

        const newProduct = await db.select().from(investmentProducts)
          .where(eq(investmentProducts.id, inserted.id)).limit(1);
        product = newProduct[0];
        if (product) {
          byName.set(rawName.toLowerCase(), product);
          if (nhmId) byNhmId.set(nhmId, product);
        }
        productsCreated++;
      }

      if (!product) {
        errors.push(`Kunne ikke oprette produkt: ${rawName}`);
        continue;
      }

      // Upsert annual returns
      for (const { col, year } of yearColumns) {
        const cellVal = row.getCell(col).value;
        if (cellVal === null || cellVal === undefined || cellVal === "") continue;

        const pct = parseFloat(String(cellVal));
        if (isNaN(pct)) continue;

        const existing = await db.select().from(annualReturns)
          .where(and(eq(annualReturns.productId, product.id), eq(annualReturns.year, year)))
          .limit(1);

        if (existing.length > 0) {
          await db.update(annualReturns).set({ returnPct: String(pct) })
            .where(and(eq(annualReturns.productId, product.id), eq(annualReturns.year, year)));
          returnsUpdated++;
        } else {
          await db.insert(annualReturns).values({ productId: product.id, year, returnPct: String(pct) });
          returnsCreated++;
        }
      }
    }

    res.json({
      success: true,
      summary: {
        productsUpdated,
        productsCreated,
        returnsUpdated,
        returnsCreated,
        errors,
        yearColumns: yearColumns.map(y => y.year),
      },
    });
  } catch (err) {
    console.error("[Excel Upload] Error:", err);
    res.status(500).json({ error: `Fejl under behandling af fil: ${err instanceof Error ? err.message : String(err)}` });
  }
});
