import { useState, useMemo } from "react";
import { useCalculatorIO } from "@/hooks/useCalculatorIO";
import { CalculatorIOBar } from "@/components/CalculatorIOBar";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Info, FileDown, ChevronUp, ChevronDown } from "lucide-react";
import { ProductSelector } from "@/components/ProductSelector";
import { useCalculatorContext } from "@/contexts/CalculatorContext";
import PdfReportModal, { GoalData } from "@/components/PdfReportModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDKK(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(".", ",") + " mio.";
  }
  return new Intl.NumberFormat("da-DK", { style: "decimal", maximumFractionDigits: 0 }).format(value) + " kr.";
}

function formatDKKFull(value: number): string {
  return new Intl.NumberFormat("da-DK", { style: "decimal", maximumFractionDigits: 0 }).format(value) + " kr.";
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1).replace(".", ",")}%`;
}

/**
 * Project a portfolio forward using a fixed annual return rate (simple compound).
 * Used for the pension projection in summary cards.
 */
function projectWithRate(
  initialCapital: number,
  annualContribution: number,
  annualReturnPct: number,
  years: number
): number {
  const r = annualReturnPct / 100;
  let value = initialCapital;
  for (let i = 0; i < years; i++) {
    value = value * (1 + r) + annualContribution;
  }
  return Math.round(value);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[200px]">
      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {label === 0 ? "Start" : `År ${label}`}
      </p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatDKKFull(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  name,
  finalValue,
  delta,
  deltaPct,
  color,
  isBaseline,
  pensionYears,
  pensionReturnPct,
  initialCapital,
  annualContribution,
  baselinePensionValue,
}: {
  name: string;
  finalValue: number;
  delta: number | null;
  deltaPct: number | null;
  color: string;
  isBaseline: boolean;
  pensionYears: number | null;
  pensionReturnPct: number | null;
  initialCapital: number;
  annualContribution: number;
  baselinePensionValue: number | null;
}) {
  // Pension projection: project from current finalValue (end of horizon) forward to pension
  const pensionValue =
    pensionYears !== null && pensionReturnPct !== null && pensionYears > 0
      ? projectWithRate(finalValue, annualContribution, pensionReturnPct, pensionYears)
      : null;
  void initialCapital; // used via finalValue (which is projected from it)

  return (
    <div
      className="rounded-xl p-5 border transition-all"
      style={{
        borderColor: isBaseline ? "var(--border)" : color + "40",
        background: isBaseline ? "var(--card)" : color + "08",
      }}
    >
      {/* Product name + badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          {name}
        </span>
        {isBaseline && (
          <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">
            Nuværende
          </Badge>
        )}
      </div>

      {/* Final value after horizon */}
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {formatDKKFull(finalValue)}
      </p>

      {/* Delta vs baseline */}
      {delta !== null && deltaPct !== null && !isBaseline && (
        <p
          className="text-sm mt-1 font-medium"
          style={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}
        >
          {delta >= 0 ? "+" : ""}
          {formatDKKFull(delta)} ({formatPct(deltaPct)})
        </p>
      )}

      {/* Pension projection */}
      {pensionValue !== null && pensionYears !== null && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="text-xs text-muted-foreground mb-0.5">
            Ved pension om {pensionYears} år
          </p>
          <p className="text-base font-semibold text-foreground tabular-nums">
            {formatDKKFull(pensionValue)}
          </p>
          {baselinePensionValue !== null && !isBaseline && (
            <p
              className="text-sm mt-0.5 font-medium"
              style={{
                color:
                  pensionValue - baselinePensionValue >= 0 ? "#16a34a" : "#dc2626",
              }}
            >
              {pensionValue - baselinePensionValue >= 0 ? "+" : ""}
              {formatDKKFull(pensionValue - baselinePensionValue)} vs. nuværende
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────

function fmtThousands(n: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(n);
}
function parseRaw(raw: string): number {
  return parseFloat(raw.replace(/\./g, "").replace(/,/g, "."));
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  hint?: string;
}) {
  const [raw, setRaw] = useState(() => fmtThousands(value));

  const handleBlur = () => {
    const parsed = parseRaw(raw);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
      setRaw(fmtThousands(parsed));
    } else {
      setRaw(fmtThousands(value));
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          className="pr-10"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Decimal Input (for percentages) ─────────────────────────────────────────

function DecimalInput({
  label,
  value,
  onChange,
  suffix,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="pr-10"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Calculator() {
  const ctx = useCalculatorContext();

  // All state is initialised from context so it survives navigation (unmount/remount)
  const [initialCapital, setInitialCapital] = useState(() => ctx.depot);
  const [annualContribution, setAnnualContribution] = useState(() => ctx.annualContribution);
  const [horizonYears, setHorizonYears] = useState(() => ctx.horizonYears);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(() => ctx.selectedProductIds);
  const [tableYearFrom, setTableYearFrom] = useState<number>(() => ctx.tableYearFrom);
  const [tableYearTo, setTableYearTo] = useState<number>(() => ctx.tableYearTo);
  const [pensionYearsRaw, setPensionYearsRaw] = useState<string>(() => ctx.pensionYearsRaw);
  const [pensionReturnOverride, setPensionReturnOverride] = useState<string>(() => ctx.pensionReturnOverride);

  // Write back to context on every change so values persist when navigating away
  const handleSetInitialCapital = (v: number) => { setInitialCapital(v); ctx.setDepot(v); };
  const handleSetAnnualContribution = (v: number) => { setAnnualContribution(v); ctx.setAnnualContribution(v); };
  const handleSetHorizonYears = (v: number) => { setHorizonYears(v); ctx.setHorizonYears(v); };
  const handleSetSelectedProductIds = (v: number[]) => { setSelectedProductIds(v); ctx.setSelectedProductIds(v); };
  const handleSetTableYearFrom = (v: number) => { setTableYearFrom(v); ctx.setTableYearFrom(v); };
  const handleSetTableYearTo = (v: number) => { setTableYearTo(v); ctx.setTableYearTo(v); };
  const handleSetPensionYearsRaw = (v: string) => { setPensionYearsRaw(v); ctx.setPensionYearsRaw(v); };
  const handleSetPensionReturnOverride = (v: string) => { setPensionReturnOverride(v); ctx.setPensionReturnOverride(v); };

  const canProject = selectedProductIds.length >= 1;

  const { data: projectionData, isLoading: isProjecting } =
    trpc.calculator.project.useQuery(
      {
        initialCapital,
        annualContribution,
        horizonYears,
        productIds: selectedProductIds,
      },
      { enabled: canProject }
    );

  const toggleProduct = (id: number) => {
    handleSetSelectedProductIds(
      selectedProductIds.includes(id)
        ? selectedProductIds.filter((x) => x !== id)
        : selectedProductIds.length >= 3
        ? selectedProductIds
        : [...selectedProductIds, id]
    );
  };

  // Derived pension parameters
  const pensionYears = pensionYearsRaw !== "" ? parseInt(pensionYearsRaw) : null;
  const validPensionYears =
    pensionYears !== null && !isNaN(pensionYears) && pensionYears > 0 ? pensionYears : null;

  // For each product, compute the effective pension return rate:
  // - if override is set, use that for all products
  // - otherwise use the horizon-based avg for each product individually
  const pensionReturnOverrideNum =
    pensionReturnOverride !== ""
      ? parseFloat(pensionReturnOverride.replace(",", "."))
      : null;

  // Build chart data
  const chartData = useMemo(() => {
    if (!projectionData?.results.length) return [];
    const maxLen = Math.max(...projectionData.results.map((r) => r.projection.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number | string> = { year: i };
      projectionData.results.forEach((r) => {
        const p = r.projection[i];
        if (p) point[r.productName] = p.value;
      });
      return point;
    });
  }, [projectionData]);

  // Y-axis domain: lowest value * 0.9 (10% buffer below minimum)
  const yAxisDomain = useMemo((): [number, number] | undefined => {
    if (!chartData.length || !projectionData?.results.length) return undefined;
    const allValues = chartData
      .flatMap((pt) =>
        projectionData.results.map((r) => (pt[r.productName] as number) ?? Infinity)
      )
      .filter((v) => isFinite(v) && v > 0);
    if (!allValues.length) return undefined;
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const lower = Math.max(0, Math.floor((minVal * 0.9) / 100_000) * 100_000);
    const upper = Math.ceil((maxVal * 1.02) / 100_000) * 100_000;
    return [lower, upper];
  }, [chartData, projectionData]);

  // Filtered years for the historical table
  const tableYears = useMemo(() => {
    if (!projectionData?.results.length) return [];
    const allYears = Array.from(
      new Set(
        projectionData.results.flatMap((r) => r.historicalReturns.map((h) => h.year))
      )
    ).sort();
    return allYears.filter((y) => y >= tableYearFrom && y <= tableYearTo);
  }, [projectionData, tableYearFrom, tableYearTo]);

  const baselineResult = projectionData?.results[0];

  const [pdfOpen, setPdfOpen] = useState(false);

  const { exportData, triggerImport } = useCalculatorIO({
    type: "afkast",
    getData: () => ({
      initialCapital,
      annualContribution,
      horizonYears,
      selectedProductIds,
      pensionYearsRaw,
      pensionReturnOverride,
      tableYearFrom,
      tableYearTo,
    }),
    onImport: (d) => {
      if (d.initialCapital !== undefined) handleSetInitialCapital(d.initialCapital);
      if (d.annualContribution !== undefined) handleSetAnnualContribution(d.annualContribution);
      if (d.horizonYears !== undefined) handleSetHorizonYears(d.horizonYears);
      if (d.selectedProductIds !== undefined) handleSetSelectedProductIds(d.selectedProductIds);
      if (d.pensionYearsRaw !== undefined) handleSetPensionYearsRaw(d.pensionYearsRaw);
      if (d.pensionReturnOverride !== undefined) handleSetPensionReturnOverride(d.pensionReturnOverride);
      if (d.tableYearFrom !== undefined) handleSetTableYearFrom(d.tableYearFrom);
      if (d.tableYearTo !== undefined) handleSetTableYearTo(d.tableYearTo);
    },
  });

  // Panel collapse state (persisted in context so state survives navigation)
  const { calcParamsOpen, setCalcParamsOpen, calcProductsOpen, setCalcProductsOpen, calcPensionOpen, setCalcPensionOpen } = ctx;

  // Build goalData from context (populated by GoalCalculator) for PDF modal
  const goalDataFromCtx: GoalData | undefined = useMemo(() => {
    const r = parseFloat(ctx.goalReturnRaw.replace(/,/g, ".")) / 100;
    if (isNaN(r) || ctx.goalYears <= 0) return undefined;
    const depotFV = ctx.goalDepot * Math.pow(1 + r, ctx.goalYears);
    if (ctx.goalMode === "lumpsum") {
      if (ctx.goalTargetAmount <= 0) return undefined;
      const gap = Math.max(0, ctx.goalTargetAmount - depotFV);
      const annuityFactor = r === 0 ? ctx.goalYears : (1 + r) * (Math.pow(1 + r, ctx.goalYears) - 1) / r;
      const req = gap <= 0 ? 0 : gap / annuityFactor;
      return { mode: "lumpsum", depot: ctx.goalDepot, years: ctx.goalYears, annualReturn: r * 100, targetAmount: ctx.goalTargetAmount, depotFV, requiredAnnual: req, requiredMonthly: req / 12, gap };
    } else {
      if (ctx.goalAnnualPayout <= 0 || ctx.goalPayoutYears <= 0) return undefined;
      const capitalNeeded = r === 0 ? ctx.goalAnnualPayout * ctx.goalPayoutYears : ctx.goalAnnualPayout * (1 - Math.pow(1 + r, -ctx.goalPayoutYears)) / r * (1 + r);
      const gap = Math.max(0, capitalNeeded - depotFV);
      const annuityFactor = r === 0 ? ctx.goalYears : (1 + r) * (Math.pow(1 + r, ctx.goalYears) - 1) / r;
      const req = gap <= 0 ? 0 : gap / annuityFactor;
      return { mode: "payout", depot: ctx.goalDepot, years: ctx.goalYears, annualReturn: r * 100, annualPayout: ctx.goalAnnualPayout, payoutYears: ctx.goalPayoutYears, capitalNeeded, depotFV, requiredAnnual: req, requiredMonthly: req / 12, gap };
    }
  }, [ctx.goalMode, ctx.goalDepot, ctx.goalYears, ctx.goalReturnRaw, ctx.goalTargetAmount, ctx.goalAnnualPayout, ctx.goalPayoutYears]);

  // Build returnData payload for PDF modal
  const returnDataForPdf = projectionData?.results.length
    ? {
        initialCapital,
        annualContribution,
        horizonYears,
        products: projectionData.results.map((r) => ({
          name: r.productName,
          company: r.company ?? "",
          avgReturn: r.avgAnnualReturnHorizon,
          aop: r.aop ?? 0,
        })),
        projections: chartData.map((pt, i) => ({
          year: i + 1,
          values: Object.fromEntries(
            projectionData.results.map((r) => [r.productName, pt[r.productName] as number])
          ),
        })),
      }
    : undefined;

  return (
    <>
    <PdfReportModal
      open={pdfOpen}
      onClose={() => setPdfOpen(false)}
      returnData={returnDataForPdf}
      goalData={goalDataFromCtx}
      defaultSection="return"
    />
    <div className="w-full max-w-[1400px] space-y-6 px-2">
      <CalculatorIOBar onExport={exportData} onImport={triggerImport} />
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Afkastberegner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sammenlign fremtidigt afkast på tværs af investeringsprodukter
          </p>
        </div>
        <button
          onClick={() => setPdfOpen(true)}
          disabled={!returnDataForPdf}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{
            background: returnDataForPdf ? "oklch(0.82 0.12 85)" : "oklch(0.82 0.12 85 / 0.3)",
            color: "oklch(0.13 0.04 255)",
          }}
          title={returnDataForPdf ? "Generer PDF-rapport" : "Vælg produkter for at generere rapport"}
        >
          <FileDown className="h-4 w-4" />
          Rapport
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* ── Left: Inputs ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Parameters card */}
          {/* ── Parametre (collapsible) ──────────────────────────────────── */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <button
              onClick={() => setCalcParamsOpen(!calcParamsOpen)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 rounded-xl transition-colors"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Parametre
              </h2>
              {calcParamsOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>
            {calcParamsOpen && (
              <div className="px-5 pb-5 space-y-5">
                <NumberInput
                  label="Nuværende opsparing"
                  value={initialCapital}
                  onChange={handleSetInitialCapital}
                  suffix="kr."
                  hint="Startbeløb / depot"
                />
                <NumberInput
                  label="Årlig indbetaling"
                  value={annualContribution}
                  onChange={handleSetAnnualContribution}
                  suffix="kr."
                  hint="Indbetaling pr. år"
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tidshorisont</Label>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {horizonYears} år
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={30}
                    step={1}
                    value={[horizonYears]}
                    onValueChange={([v]) => handleSetHorizonYears(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 år</span>
                    <span>30 år</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Produkter (collapsible) ──────────────────────────────────────── */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <button
              onClick={() => setCalcProductsOpen(!calcProductsOpen)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 rounded-xl transition-colors"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Produkter
              </h2>
              {calcProductsOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>
            {calcProductsOpen && (
              <div className="px-5 pb-5">
                <ProductSelector
                  selectedIds={selectedProductIds}
                  onToggle={toggleProduct}
                  maxSelections={3}
                />
              </div>
            )}
          </div>

          {/* ── Pensionsfremskrivning (collapsible, last) ────────────────────── */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <button
              onClick={() => setCalcPensionOpen(!calcPensionOpen)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 rounded-xl transition-colors"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pensionsfremskrivning
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Valgfrit — viser pensionsværdi i boblerne
                </p>
              </div>
              {calcPensionOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>
            {calcPensionOpen && (
              <div className="px-5 pb-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">År til pension</Label>
                  <p className="text-xs text-muted-foreground">F.eks. 22 hvis kunden er 45 år</p>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={pensionYearsRaw}
                    placeholder="F.eks. 22"
                    onChange={(e) => handleSetPensionYearsRaw(e.target.value)}
                    className="tabular-nums"
                  />
                </div>
                <DecimalInput
                  label="Afkastforskel % (valgfri)"
                  hint={
                    projectionData && projectionData.results.length >= 2
                      ? `Auto: ${
                          (projectionData.results[1].avgAnnualReturnHorizon -
                          projectionData.results[0].avgAnnualReturnHorizon)
                          .toFixed(1).replace(".", ",")}% (seneste ${horizonYears} år)`
                      : "Lad stå tom for at bruge Ø/år automatisk"
                  }
                  value={pensionReturnOverride}
                  onChange={handleSetPensionReturnOverride}
                  suffix="%"
                  placeholder="F.eks. 2,5"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Results ────────────────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          {!canProject ? (
            <div className="bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Vælg mindst ét produkt</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Vælg 1–3 investeringsprodukter til venstre for at se en fremskrivning
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              {projectionData && (
                <div
                  className={`grid gap-4 ${
                    projectionData.results.length === 1
                      ? "grid-cols-1"
                      : projectionData.results.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  }`}
                >
                  {projectionData.results.map((r, idx) => {
                    // Pension return rate for this card:
                    // If override is set and valid, use it as a differential applied to baseline
                    // Otherwise use each product's own horizon-based avg
                    let pensionRate: number | null = null;
                    if (validPensionYears !== null) {
                      if (
                        pensionReturnOverrideNum !== null &&
                        !isNaN(pensionReturnOverrideNum)
                      ) {
                        // Override is the differential — baseline uses its own avg,
                        // others use baseline avg + override
                        const baseAvg = projectionData.results[0].avgAnnualReturnHorizon;
                        pensionRate = idx === 0 ? baseAvg : baseAvg + pensionReturnOverrideNum;
                      } else {
                        pensionRate = r.avgAnnualReturnHorizon;
                      }
                    }

                    return (
                      <SummaryCard
                        key={r.productId}
                        name={r.productName}
                        finalValue={r.finalValue}
                        color={r.color}
                        isBaseline={idx === 0}
                        delta={
                          idx > 0 && baselineResult
                            ? r.finalValue - baselineResult.finalValue
                            : null
                        }
                        deltaPct={
                          idx > 0 &&
                          baselineResult &&
                          baselineResult.finalValue > 0
                            ? ((r.finalValue - baselineResult.finalValue) /
                                baselineResult.finalValue) *
                              100
                            : null
                        }
                        pensionYears={validPensionYears}
                        pensionReturnPct={pensionRate}
                        initialCapital={initialCapital}
                        annualContribution={annualContribution}
                        baselinePensionValue={
                          validPensionYears !== null && idx > 0 && projectionData.results[0]
                            ? projectWithRate(
                                projectionData.results[0].finalValue,
                                annualContribution,
                                projectionData.results[0].avgAnnualReturnHorizon,
                                validPensionYears
                              )
                            : null
                        }
                      />
                    );
                  })}
                </div>
              )}

              {/* Chart */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Fremskrevet opsparing
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Baseret på historiske afkast (ekskl.{" "}
                      {new Date().getFullYear()}) fremskrevet {horizonYears} år
                    </p>
                  </div>
                  {isProjecting && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.008 240)"
                      strokeOpacity={0.6}
                    />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => (v === 0 ? "Start" : `År ${v}`)}
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.018 240)" }}
                      axisLine={{ stroke: "oklch(0.88 0.008 240)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatDKK(v)}
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.018 240)" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                      domain={yAxisDomain ?? ["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                      formatter={(value) => (
                        <span style={{ color: "oklch(0.52 0.018 240)" }}>{value}</span>
                      )}
                    />
                    {projectionData?.results.map((r) => (
                      <Line
                        key={r.productId}
                        type="monotone"
                        dataKey={r.productName}
                        stroke={r.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: r.color, strokeWidth: 0 }}
                        activeDot={{
                          r: 5,
                          fill: r.color,
                          strokeWidth: 2,
                          stroke: "white",
                        }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Historical returns table */}
              {projectionData && projectionData.results.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Historiske årsafkast
                    </h2>
                    {/* Year range filter */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Fra</span>
                      <input
                        type="number"
                        min={2000}
                        max={tableYearTo}
                        value={tableYearFrom}
                        onChange={(e) => handleSetTableYearFrom(Number(e.target.value))}
                        className="w-16 h-7 text-xs text-center rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground">til</span>
                      <input
                        type="number"
                        min={tableYearFrom}
                        max={new Date().getFullYear()}
                        value={tableYearTo}
                        onChange={(e) => handleSetTableYearTo(Number(e.target.value))}
                        className="w-16 h-7 text-xs text-center rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs whitespace-nowrap">
                            Produkt
                          </th>
                          {tableYears.map((y) => (
                            <th
                              key={y}
                              className="text-right py-2 px-2 font-medium text-muted-foreground text-xs whitespace-nowrap"
                            >
                              {y}
                            </th>
                          ))}
                          <th className="text-right py-2 pl-4 font-medium text-muted-foreground text-xs whitespace-nowrap">
                            Ø/{horizonYears}år*
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectionData.results.map((r) => {
                          const returnMap = Object.fromEntries(
                            r.historicalReturns.map((h) => [h.year, h])
                          );
                          return (
                            <tr
                              key={r.productId}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="py-2.5 pr-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: r.color }}
                                  />
                                  <span className="font-medium text-foreground">
                                    {r.productName}
                                  </span>
                                </div>
                              </td>
                              {tableYears.map((y) => {
                                const entry = returnMap[y];
                                const val = entry?.returnPct;
                                const isIncomplete = entry?.isIncomplete;
                                return (
                                  <td
                                    key={y}
                                    className="text-right py-2.5 px-2 tabular-nums whitespace-nowrap"
                                  >
                                    {val !== undefined ? (
                                      <span
                                        className={`font-medium ${
                                          isIncomplete
                                            ? "text-muted-foreground/60 italic"
                                            : val >= 0
                                            ? "text-emerald-600"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {val >= 0 ? "+" : ""}
                                        {val.toFixed(1)}%
                                        {isIncomplete && (
                                          <span className="text-xs ml-0.5">*</span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground/40">–</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="text-right py-2.5 pl-4 tabular-nums whitespace-nowrap">
                                <span
                                  className={`font-semibold ${
                                    r.avgAnnualReturnHorizon >= 0
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {r.avgAnnualReturnHorizon >= 0 ? "+" : ""}
                                  {r.avgAnnualReturnHorizon.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    * Ø/{horizonYears}år er gennemsnittet for de seneste {horizonYears} år
                    (ekskl. {new Date().getFullYear()}). Indeværende år vises kun til
                    orientering.
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2.5 p-4 rounded-lg bg-muted/50 border border-border/50">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground/70">Bemærk:</strong> Fremskrivningen er
                  baseret på historiske afkast og er ikke en garanti for fremtidige afkast.
                  Beregningen antager, at de historiske afkast gentages i den valgte periode.
                  Kun til intern rådgivningsbrug.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
