/**
 * generatePdf.ts
 *
 * Server-side PDF report generator using PDFKit.
 * Produces a professional financial advisory report with:
 *   - Cover page (client name, advisor name, date)
 *   - Cost analysis section (from Omkostningsberegneren)
 *   - Return comparison section (from Afkastberegneren)
 *
 * Called by the /api/generate-pdf Express endpoint.
 */

import PDFDocument from "pdfkit";
import { Writable } from "stream";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CostSection {
  depot: number;
  annualContribution: number;
  yearsToPension: number;
  costTodayPct: number;
  costNewPct: number;
  annualCostToday: number;
  annualCostNew: number;
  annualSaving: number;
  fvToday: number;
  fvNew: number;
  compoundValue: number;
  yearTable: { year: number; fvToday: number; fvNew: number; diff: number }[];
}

export interface ReturnProduct {
  name: string;
  company: string;
  avgReturn: number; // percentage
  aop: number;       // percentage
}

export interface ReturnSection {
  initialCapital: number;
  annualContribution: number;
  horizonYears: number;
  products: ReturnProduct[];
  projections: { year: number; values: Record<string, number> }[];
}

export interface PdfPayload {
  clientName: string;
  advisorName: string;
  sections: ("cost" | "return")[];
  cost?: CostSection;
  return?: ReturnSection;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NAVY   = "#0d1526";  // deepest navy — page background equivalent
const NAVY2  = "#111f3a";  // card navy
const NAVY3  = "#1a2d4f";  // lighter navy for alternating rows
const GOLD   = "#c9a84c";  // warm gold accent
const WHITE  = "#f0f4ff";  // off-white text
const MUTED  = "#8899bb";  // muted text
const GREEN  = "#4ade80";  // positive values
const TEXT   = "#dde6f5";  // body text

function dkk(n: number): string {
  return new Intl.NumberFormat("da-DK", { style: "decimal", maximumFractionDigits: 0 }).format(Math.round(n)) + " kr.";
}

function pct(n: number): string {
  return n.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

export function buildPdf(payload: PdfPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: "Finansiel Rådgivningsrapport",
        Author: payload.advisorName || "Finansiel Rådgivning",
        Subject: `Rapport for ${payload.clientName}`,
      },
    });

    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
    });
    writable.on("finish", () => resolve(Buffer.concat(chunks)));
    writable.on("error", reject);
    doc.pipe(writable);

    const W = doc.page.width;   // 595.28
    const H = doc.page.height;  // 841.89
    const ML = 48;              // left margin
    const MR = W - 48;         // right margin
    const CW = MR - ML;        // content width

    // ── Cover page ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(NAVY);

    // Top gold bar
    doc.rect(0, 0, W, 6).fill(GOLD);

    // Logo area
    doc.rect(ML, 60, 40, 40).fillAndStroke(NAVY3, GOLD);
    doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
      .text("FR", ML + 8, 71);

    // Title block
    doc.fontSize(28).fillColor(WHITE).font("Helvetica-Bold")
      .text("Finansiel Rådgivningsrapport", ML + 52, 62);
    doc.fontSize(11).fillColor(MUTED).font("Helvetica")
      .text("Internt rådgivningsværktøj · Fortroligt", ML + 52, 94);

    // Divider
    doc.rect(ML, 115, CW, 1).fill(NAVY3);

    // Client info block
    const infoY = 140;
    doc.fontSize(9).fillColor(MUTED).font("Helvetica").text("KLIENT", ML, infoY);
    doc.fontSize(16).fillColor(WHITE).font("Helvetica-Bold")
      .text(payload.clientName || "—", ML, infoY + 14);

    doc.fontSize(9).fillColor(MUTED).font("Helvetica").text("RÅDGIVER", ML + 220, infoY);
    doc.fontSize(16).fillColor(WHITE).font("Helvetica-Bold")
      .text(payload.advisorName || "—", ML + 220, infoY + 14);

    const dateStr = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
    doc.fontSize(9).fillColor(MUTED).font("Helvetica").text("DATO", ML + 440, infoY);
    doc.fontSize(16).fillColor(WHITE).font("Helvetica-Bold")
      .text(dateStr, ML + 440, infoY + 14);

    // Section badges
    let badgeX = ML;
    const badgeY = infoY + 55;
    if (payload.sections.includes("cost")) {
      doc.rect(badgeX, badgeY, 140, 22).fill(NAVY3);
      doc.rect(badgeX, badgeY, 3, 22).fill(GOLD);
      doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
        .text("OMKOSTNINGSANALYSE", badgeX + 8, badgeY + 7);
      badgeX += 150;
    }
    if (payload.sections.includes("return")) {
      doc.rect(badgeX, badgeY, 140, 22).fill(NAVY3);
      doc.rect(badgeX, badgeY, 3, 22).fill(GOLD);
      doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
        .text("AFKASTSAMMENLIGNING", badgeX + 8, badgeY + 7);
    }

    // Decorative bottom strip
    doc.rect(0, H - 40, W, 40).fill(NAVY2);
    doc.fontSize(8).fillColor(MUTED).font("Helvetica")
      .text("Denne rapport er udarbejdet til intern brug og må ikke videregives uden tilladelse.", ML, H - 24, { width: CW, align: "center" });

    // ── Cost section ──────────────────────────────────────────────────────────
    if (payload.sections.includes("cost") && payload.cost) {
      const c = payload.cost;
      doc.addPage();
      doc.rect(0, 0, W, H).fill(NAVY);
      doc.rect(0, 0, W, 6).fill(GOLD);

      // Section header
      doc.rect(ML, 30, 4, 28).fill(GOLD);
      doc.fontSize(20).fillColor(WHITE).font("Helvetica-Bold")
        .text("Omkostningsanalyse", ML + 12, 32);
      doc.fontSize(9).fillColor(MUTED).font("Helvetica")
        .text(`${payload.clientName}  ·  ${dateStr}`, ML + 12, 54);

      // Parameters row
      const paramY = 80;
      const params = [
        ["Depot", dkk(c.depot)],
        ["Indbetaling/år", dkk(c.annualContribution)],
        ["År til pension", `${c.yearsToPension} år`],
        ["ÅOP i dag", pct(c.costTodayPct)],
        ["ÅOP ny", pct(c.costNewPct)],
        ["Afkast", "6,5% p.a."],
      ];
      const paramW = CW / params.length;
      params.forEach(([label, value], i) => {
        const x = ML + i * paramW;
        doc.rect(x, paramY, paramW - 4, 44).fill(NAVY2);
        doc.fontSize(7).fillColor(MUTED).font("Helvetica").text(label.toUpperCase(), x + 8, paramY + 8);
        doc.fontSize(11).fillColor(WHITE).font("Helvetica-Bold").text(value, x + 8, paramY + 20, { width: paramW - 16 });
      });

      // ── Annual saving card ────────────────────────────────────────────────
      const card1Y = 148;
      doc.rect(ML, card1Y, CW, 100).fill(NAVY2);
      doc.rect(ML, card1Y, 4, 100).fill(GOLD);
      doc.fontSize(11).fillColor(GOLD).font("Helvetica-Bold")
        .text("Årlig besparelse (i dag)", ML + 12, card1Y + 12);

      const rows1 = [
        ["Årlige omkostninger i dag", dkk(c.annualCostToday), false],
        ["Årlige omkostninger fremadrettet", dkk(c.annualCostNew), false],
        ["Årlig besparelse", dkk(c.annualSaving), true],
      ] as [string, string, boolean][];

      rows1.forEach(([label, value, highlight], i) => {
        const ry = card1Y + 34 + i * 20;
        doc.fontSize(9).fillColor(MUTED).font("Helvetica").text(label, ML + 12, ry);
        doc.fontSize(9).fillColor(highlight ? GREEN : TEXT).font("Helvetica-Bold")
          .text(value, ML + 12, ry, { width: CW - 24, align: "right" });
      });

      // ── Compound value card ───────────────────────────────────────────────
      const card2Y = card1Y + 116;
      doc.rect(ML, card2Y, CW, 120).fill(NAVY2);
      doc.rect(ML, card2Y, 4, 120).fill(GREEN);
      doc.fontSize(11).fillColor(GREEN).font("Helvetica-Bold")
        .text("Effekt af besparelse med rentes rente", ML + 12, card2Y + 12);

      const rows2 = [
        [`Depotværdi om ${c.yearsToPension} år (ÅOP ${pct(c.costTodayPct)})`, dkk(c.fvToday), false],
        [`Depotværdi om ${c.yearsToPension} år (ÅOP ${pct(c.costNewPct)})`, dkk(c.fvNew), false],
        [`Samlet merværdi ved pension`, dkk(c.compoundValue), true],
      ] as [string, string, boolean][];

      rows2.forEach(([label, value, highlight], i) => {
        const ry = card2Y + 34 + i * 20;
        doc.fontSize(9).fillColor(MUTED).font("Helvetica").text(label, ML + 12, ry);
        doc.fontSize(9).fillColor(highlight ? GREEN : TEXT).font("Helvetica-Bold")
          .text(value, ML + 12, ry, { width: CW - 24, align: "right" });
      });

      // Big highlight number
      doc.fontSize(9).fillColor(MUTED).font("Helvetica")
        .text("SAMLET MERVÆRDI VED PENSION", ML + 12, card2Y + 80, { align: "center", width: CW - 24 });
      doc.fontSize(26).fillColor(GREEN).font("Helvetica-Bold")
        .text(dkk(c.compoundValue), ML + 12, card2Y + 92, { align: "center", width: CW - 24 });

      // ── Year table ────────────────────────────────────────────────────────
      const tableY = card2Y + 136;
      const colW = [40, (CW - 40) / 3, (CW - 40) / 3, (CW - 40) / 3];
      const headers = ["År", `Depot (${pct(c.costTodayPct)})`, `Depot (${pct(c.costNewPct)})`, "Forskel"];

      // Table header
      doc.rect(ML, tableY, CW, 18).fill(NAVY3);
      let cx = ML;
      headers.forEach((h, i) => {
        doc.fontSize(7).fillColor(GOLD).font("Helvetica-Bold")
          .text(h, cx + 4, tableY + 6, { width: colW[i] - 8, align: i === 0 ? "left" : "right" });
        cx += colW[i];
      });

      // Table rows (up to 20 years per page, then continue on next page)
      const maxRowsPerPage = 20;
      let rowY = tableY + 18;
      let pageRowCount = 0;

      c.yearTable.forEach((row, idx) => {
        if (pageRowCount > 0 && pageRowCount % maxRowsPerPage === 0) {
          doc.addPage();
          doc.rect(0, 0, W, H).fill(NAVY);
          doc.rect(0, 0, W, 6).fill(GOLD);
          rowY = 30;
          // Reprint header
          doc.rect(ML, rowY, CW, 18).fill(NAVY3);
          let hcx = ML;
          headers.forEach((h, i) => {
            doc.fontSize(7).fillColor(GOLD).font("Helvetica-Bold")
              .text(h, hcx + 4, rowY + 6, { width: colW[i] - 8, align: i === 0 ? "left" : "right" });
            hcx += colW[i];
          });
          rowY += 18;
        }

        const bg = idx % 2 === 0 ? NAVY2 : NAVY3;
        doc.rect(ML, rowY, CW, 16).fill(bg);
        let rcx = ML;
        const cells = [
          String(row.year),
          dkk(row.fvToday),
          dkk(row.fvNew),
          dkk(row.diff),
        ];
        cells.forEach((cell, i) => {
          const color = i === 3 ? (row.diff >= 0 ? GREEN : "#f87171") : TEXT;
          doc.fontSize(8).fillColor(color).font(i === 3 ? "Helvetica-Bold" : "Helvetica")
            .text(cell, rcx + 4, rowY + 4, { width: colW[i] - 8, align: i === 0 ? "left" : "right" });
          rcx += colW[i];
        });
        rowY += 16;
        pageRowCount++;
      });
    }

    // ── Return section ────────────────────────────────────────────────────────
    if (payload.sections.includes("return") && payload.return) {
      const r = payload.return;
      doc.addPage();
      doc.rect(0, 0, W, H).fill(NAVY);
      doc.rect(0, 0, W, 6).fill(GOLD);

      doc.rect(ML, 30, 4, 28).fill(GOLD);
      doc.fontSize(20).fillColor(WHITE).font("Helvetica-Bold")
        .text("Afkastsammenligning", ML + 12, 32);
      doc.fontSize(9).fillColor(MUTED).font("Helvetica")
        .text(`${payload.clientName}  ·  ${dateStr}`, ML + 12, 54);

      // Parameters
      const paramY2 = 80;
      const params2 = [
        ["Depot", dkk(r.initialCapital)],
        ["Indbetaling/år", dkk(r.annualContribution)],
        ["Horisont", `${r.horizonYears} år`],
      ];
      const paramW2 = CW / params2.length;
      params2.forEach(([label, value], i) => {
        const x = ML + i * paramW2;
        doc.rect(x, paramY2, paramW2 - 4, 44).fill(NAVY2);
        doc.rect(x, paramY2, 3, 44).fill(GOLD);
        doc.fontSize(7).fillColor(MUTED).font("Helvetica").text(label.toUpperCase(), x + 8, paramY2 + 8);
        doc.fontSize(11).fillColor(WHITE).font("Helvetica-Bold").text(value, x + 8, paramY2 + 20, { width: paramW2 - 16 });
      });

      // Product cards
      const productColors = [GOLD, "#60a5fa", GREEN, "#f472b6", "#a78bfa"];
      let prodY = 148;
      r.products.forEach((prod, i) => {
        const color = productColors[i % productColors.length];
        doc.rect(ML, prodY, CW, 44).fill(NAVY2);
        doc.rect(ML, prodY, 4, 44).fill(color);
        doc.fontSize(11).fillColor(WHITE).font("Helvetica-Bold")
          .text(prod.name, ML + 12, prodY + 8);
        doc.fontSize(9).fillColor(MUTED).font("Helvetica")
          .text(prod.company, ML + 12, prodY + 24);
        doc.fontSize(9).fillColor(MUTED).font("Helvetica")
          .text(`Gns. afkast: `, ML + 12, prodY + 8, { continued: true })
          .fillColor(color).font("Helvetica-Bold")
          .text(pct(prod.avgReturn), { continued: true })
          .fillColor(MUTED).font("Helvetica")
          .text(`   ÅOP: `, { continued: true })
          .fillColor(color).font("Helvetica-Bold")
          .text(pct(prod.aop));
        prodY += 52;
      });

      // Projection table (first 15 years)
      if (r.projections.length > 0) {
        const projY = prodY + 12;
        const prodNames = r.products.map(p => p.name);
        const projColW = CW / (prodNames.length + 1);

        doc.rect(ML, projY, CW, 18).fill(NAVY3);
        doc.fontSize(7).fillColor(GOLD).font("Helvetica-Bold")
          .text("ÅR", ML + 4, projY + 6, { width: projColW - 8 });
        prodNames.forEach((name, i) => {
          doc.fontSize(7).fillColor(GOLD).font("Helvetica-Bold")
            .text(name, ML + (i + 1) * projColW + 4, projY + 6, { width: projColW - 8, align: "right" });
        });

        let pRowY = projY + 18;
        r.projections.slice(0, 15).forEach((row, idx) => {
          const bg = idx % 2 === 0 ? NAVY2 : NAVY3;
          doc.rect(ML, pRowY, CW, 16).fill(bg);
          doc.fontSize(8).fillColor(TEXT).font("Helvetica")
            .text(String(row.year), ML + 4, pRowY + 4, { width: projColW - 8 });
          prodNames.forEach((name, i) => {
            const val = row.values[name];
            doc.fontSize(8).fillColor(TEXT).font("Helvetica")
              .text(val != null ? dkk(val) : "—", ML + (i + 1) * projColW + 4, pRowY + 4, { width: projColW - 8, align: "right" });
          });
          pRowY += 16;
        });
      }
    }

    // ── Footer on last page ───────────────────────────────────────────────────
    doc.rect(0, H - 40, W, 40).fill(NAVY2);
    doc.fontSize(8).fillColor(MUTED).font("Helvetica")
      .text("Finansiel Rådgivning · Internt brug · Fortroligt", ML, H - 24, { width: CW, align: "center" });

    doc.end();
  });
}
