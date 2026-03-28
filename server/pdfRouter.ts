/**
 * pdfRouter.ts
 *
 * Express router that handles POST /api/generate-pdf.
 * Accepts a JSON payload, builds a PDF with PDFKit, and streams it back
 * as an application/pdf response with a Content-Disposition header so the
 * browser triggers a file download.
 */

import { Router } from "express";
import { buildPdf, PdfPayload } from "./generatePdf";

export const pdfRouter = Router();

pdfRouter.post("/api/generate-pdf", async (req, res) => {
  try {
    const payload = req.body as PdfPayload;

    if (!payload || !Array.isArray(payload.sections) || payload.sections.length === 0) {
      res.status(400).json({ error: "Ugyldig payload: sections er påkrævet" });
      return;
    }

    const pdfBuffer = await buildPdf(payload);

    const safeName = (payload.clientName || "rapport")
      .replace(/[^a-zA-Z0-9æøåÆØÅ\- ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);

    const filename = `Finansiel_Rapport_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[PDF] Generation failed:", err);
    res.status(500).json({ error: "PDF-generering fejlede" });
  }
});
