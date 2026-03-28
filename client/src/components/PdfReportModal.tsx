/**
 * PdfReportModal
 *
 * A modal dialog that collects:
 *   - Client name
 *   - Advisor name
 *   - Which sections to include (Omkostningsanalyse / Afkastsammenligning / Begge)
 *
 * Then POSTs to /api/generate-pdf and triggers a browser file download.
 */

import { useState } from "react";
import { FileDown, X, Loader2, CheckSquare, Square, User, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CostData {
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
  avgReturn: number;
  aop: number;
}

export interface ReturnData {
  initialCapital: number;
  annualContribution: number;
  horizonYears: number;
  products: ReturnProduct[];
  projections: { year: number; values: Record<string, number> }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  costData?: CostData;
  returnData?: ReturnData;
  /** Which section the user is currently on — pre-selects that section */
  defaultSection?: "cost" | "return";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PdfReportModal({
  open,
  onClose,
  costData,
  returnData,
  defaultSection,
}: Props) {
  const [clientName, setClientName] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [includeCost, setIncludeCost] = useState(
    defaultSection === "cost" || defaultSection === undefined
  );
  const [includeReturn, setIncludeReturn] = useState(
    defaultSection === "return" || defaultSection === undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const canGenerate =
    (includeCost && !!costData) || (includeReturn && !!returnData);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);

    const sections: ("cost" | "return")[] = [];
    if (includeCost && costData) sections.push("cost");
    if (includeReturn && returnData) sections.push("return");

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientName: clientName.trim() || "Klient",
          advisorName: advisorName.trim() || "Rådgiver",
          sections,
          cost: includeCost ? costData : undefined,
          return: includeReturn ? returnData : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Ukendt fejl" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (clientName.trim() || "rapport").replace(/\s+/g, "_");
      a.href = url;
      a.download = `Finansiel_Rapport_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "PDF-generering fejlede");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "oklch(0.17 0.038 255)", border: "1px solid oklch(0.28 0.05 255)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "oklch(0.13 0.04 255)", borderBottom: "1px solid oklch(0.28 0.05 255)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.82 0.12 85 / 0.15)", border: "1px solid oklch(0.82 0.12 85 / 0.3)" }}
            >
              <FileDown className="h-4 w-4" style={{ color: "oklch(0.82 0.12 85)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Generer PDF-rapport</h2>
              <p className="text-xs text-muted-foreground">Klar til at sende til klienten</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted/40 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" /> Klientnavn
              </Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="f.eks. Peter Hansen"
                className="text-sm"
                style={{ background: "oklch(0.13 0.04 255)", borderColor: "oklch(0.28 0.05 255)" }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" /> Rådgivernavn
              </Label>
              <Input
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                placeholder="f.eks. Mads Nielsen"
                className="text-sm"
                style={{ background: "oklch(0.13 0.04 255)", borderColor: "oklch(0.28 0.05 255)" }}
              />
            </div>
          </div>

          {/* Section selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Inkludér i rapporten</p>
            <div className="space-y-2">
              <SectionToggle
                checked={includeCost}
                onChange={setIncludeCost}
                label="Omkostningsanalyse"
                description={costData ? "Data tilgængeligt" : "Ingen data — åbn Omkostningsberegneren først"}
                disabled={!costData}
                color="oklch(0.82 0.12 85)"
              />
              <SectionToggle
                checked={includeReturn}
                onChange={setIncludeReturn}
                label="Afkastsammenligning"
                description={returnData ? `${returnData.products.length} produkt(er) valgt` : "Ingen data — vælg produkter i Afkastberegneren først"}
                disabled={!returnData}
                color="oklch(0.65 0.18 255)"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "oklch(0.577 0.245 27.325 / 0.15)", border: "1px solid oklch(0.577 0.245 27.325 / 0.4)", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "oklch(0.13 0.04 255)", borderTop: "1px solid oklch(0.28 0.05 255)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/30"
          >
            Annuller
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canGenerate && !loading ? "oklch(0.82 0.12 85)" : "oklch(0.82 0.12 85 / 0.5)",
              color: "oklch(0.13 0.04 255)",
            }}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Genererer…</>
            ) : (
              <><FileDown className="h-4 w-4" /> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SectionToggle ────────────────────────────────────────────────────────────

function SectionToggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  color,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  disabled: boolean;
  color: string;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked && !disabled ? "oklch(0.22 0.045 255)" : "oklch(0.13 0.04 255)",
        border: `1px solid ${checked && !disabled ? color + " / 0.4)" : "oklch(0.28 0.05 255)"}`,
      }}
    >
      {checked && !disabled
        ? <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color }} />
        : <Square className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      }
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </button>
  );
}
