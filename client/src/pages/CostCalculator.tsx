import { CalculatorIOBar } from "@/components/CalculatorIOBar";
import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingDown, PiggyBank, Info, ChevronDown, ChevronUp, ArrowRightLeft, FileDown } from "lucide-react";
import { useCalculatorContext } from "@/contexts/CalculatorContext";
import PdfReportModal, { GoalData } from "@/components/PdfReportModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const ANNUAL_RETURN = 0.065; // 6,5% fast afkast (vises ikke i UI)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDKK(value: number): string {
  return (
    new Intl.NumberFormat("da-DK", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(Math.round(value)) + " kr."
  );
}

function fmtThousands(n: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(n);
}

function parseRaw(raw: string): number {
  return parseFloat(raw.replace(/\./g, "").replace(/,/g, "."));
}

function parseDecimalRaw(raw: string): number {
  return parseFloat(raw.replace(/,/g, "."));
}

function fmtPct(raw: string): string {
  return raw.replace(".", ",");
}

/**
 * Beregner depotets fremtidige værdi ved netto-afkast (afkast minus ÅOP).
 * Indbetaling tilføjes ved STARTEN af hvert år (annuity due / "begyndelse af perioden").
 * Svarer til Excel: FV(netRate; n; -contribution; -depot; 1)
 */
function futureValueWithCost(
  depot: number,
  annualContribution: number,
  grossReturn: number,
  costPct: number,
  years: number
): number {
  const netRate = grossReturn - costPct / 100;
  let value = depot;
  for (let i = 0; i < years; i++) {
    value = (value + annualContribution) * (1 + netRate);
  }
  return value;
}

/**
 * Bygger en år-for-år tabel med depotværdi i begge scenarier.
 */
function buildYearTable(
  depot: number,
  annualContribution: number,
  costTodayPct: number,
  costNewPct: number,
  years: number
): { year: number; fvToday: number; fvNew: number; diff: number }[] {
  const netToday = ANNUAL_RETURN - costTodayPct / 100;
  const netNew   = ANNUAL_RETURN - costNewPct   / 100;
  const rows = [];
  let valToday = depot;
  let valNew   = depot;
  for (let i = 1; i <= years; i++) {
    valToday = (valToday + annualContribution) * (1 + netToday);
    valNew   = (valNew   + annualContribution) * (1 + netNew);
    rows.push({ year: i, fvToday: valToday, fvNew: valNew, diff: valNew - valToday });
  }
  return rows;
}

// ─── NumberInput ──────────────────────────────────────────────────────────────

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

  // Sync if parent value changes (e.g. from context transfer)
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      setRaw(fmtThousands(value));
      prevValue.current = value;
    }
  }, [value]);

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

// ─── DecimalInput ─────────────────────────────────────────────────────────────

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

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-5 shadow-sm"
      style={{
      background: accent ? "oklch(0.20 0.05 155 / 0.6)" : "var(--card)",
      borderColor: accent ? "oklch(0.55 0.16 155 / 0.45)" : "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: accent
              ? "oklch(0.55 0.16 155 / 0.18)"
              : "oklch(0.82 0.12 85 / 0.15)",
            border: `1px solid ${accent ? "oklch(0.55 0.16 155 / 0.4)" : "oklch(0.82 0.12 85 / 0.3)"}`,
          }}
        >
          <Icon
            className="h-3.5 w-3.5"
            style={{ color: accent ? "oklch(0.72 0.18 155)" : "oklch(0.82 0.12 85)" }}
          />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── ResultRow ────────────────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  highlight,
  large,
}: {
  label: string;
  value: string;
  highlight?: "positive" | "neutral";
  large?: boolean;
}) {
  const valueColor =
    highlight === "positive"
      ? "#16a34a"
      : highlight === "neutral"
      ? "var(--foreground)"
      : "var(--muted-foreground)";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums font-semibold ${large ? "text-lg" : "text-sm"}`}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Hovedside ────────────────────────────────────────────────────────────────

export default function CostCalculator() {
  const ctx = useCalculatorContext();

  // All state initialised from context so values survive navigation (unmount/remount)
  const [depot, setDepot] = useState(() => ctx.costDepot);
  const [annualContribution, setAnnualContribution] = useState(() => ctx.costAnnualContribution);
  const [yearsToPension, setYearsToPension] = useState(() => ctx.costYearsToPension);
  const [costTodayRaw, setCostTodayRaw] = useState(() => ctx.costTodayRaw);
  const [costNewRaw, setCostNewRaw] = useState(() => ctx.costNewRaw);
  const [tableOpen, setTableOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  // Build goalData from context (populated by GoalCalculator) for PDF modal
  const goalDataFromCtx: GoalData | undefined = useMemo(() => {
    const r = parseFloat(ctx.goalReturnRaw.replace(/,/g, ".")) / 100;
    if (isNaN(r) || ctx.goalYears <= 0) return undefined;
    const depotFV = ctx.goalDepot * Math.pow(1 + r, ctx.goalYears);
    if (ctx.goalMode === "lumpsum") {
      if (ctx.goalTargetAmount <= 0) return undefined;
      const gap = Math.max(0, ctx.goalTargetAmount - depotFV);
      const af = r === 0 ? ctx.goalYears : (1 + r) * (Math.pow(1 + r, ctx.goalYears) - 1) / r;
      const req = gap <= 0 ? 0 : gap / af;
      return { mode: "lumpsum" as const, depot: ctx.goalDepot, years: ctx.goalYears, annualReturn: r * 100, targetAmount: ctx.goalTargetAmount, depotFV, requiredAnnual: req, requiredMonthly: req / 12, gap };
    } else {
      if (ctx.goalAnnualPayout <= 0 || ctx.goalPayoutYears <= 0) return undefined;
      const cap = r === 0 ? ctx.goalAnnualPayout * ctx.goalPayoutYears : ctx.goalAnnualPayout * (1 - Math.pow(1 + r, -ctx.goalPayoutYears)) / r * (1 + r);
      const gap = Math.max(0, cap - depotFV);
      const af = r === 0 ? ctx.goalYears : (1 + r) * (Math.pow(1 + r, ctx.goalYears) - 1) / r;
      const req = gap <= 0 ? 0 : gap / af;
      return { mode: "payout" as const, depot: ctx.goalDepot, years: ctx.goalYears, annualReturn: r * 100, annualPayout: ctx.goalAnnualPayout, payoutYears: ctx.goalPayoutYears, capitalNeeded: cap, depotFV, requiredAnnual: req, requiredMonthly: req / 12, gap };
    }
  }, [ctx.goalMode, ctx.goalDepot, ctx.goalYears, ctx.goalReturnRaw, ctx.goalTargetAmount, ctx.goalAnnualPayout, ctx.goalPayoutYears]);

  // Sync local state from context when context changes (e.g. after import)
  useEffect(() => { setDepot(ctx.costDepot); }, [ctx.costDepot]);
  useEffect(() => { setAnnualContribution(ctx.costAnnualContribution); }, [ctx.costAnnualContribution]);
  useEffect(() => { setYearsToPension(ctx.costYearsToPension); }, [ctx.costYearsToPension]);
  useEffect(() => { setCostTodayRaw(ctx.costTodayRaw); }, [ctx.costTodayRaw]);
  useEffect(() => { setCostNewRaw(ctx.costNewRaw); }, [ctx.costNewRaw]);

  // Write back to context on every change
  const handleSetDepot = (v: number) => { setDepot(v); ctx.setCostDepot(v); };
  const handleSetAnnualContribution = (v: number) => { setAnnualContribution(v); ctx.setCostAnnualContribution(v); };
  const handleSetYearsToPension = (v: number) => { setYearsToPension(v); ctx.setCostYearsToPension(v); };
  const handleSetCostTodayRaw = (v: string) => { setCostTodayRaw(v); ctx.setCostTodayRaw(v); };
  const handleSetCostNewRaw = (v: string) => { setCostNewRaw(v); ctx.setCostNewRaw(v); };

  // Track whether values were transferred from the return calculator
  const [transferred, setTransferred] = useState(
    ctx.depot !== 2_000_000 || ctx.annualContribution !== 100_000 || ctx.horizonYears !== 5
  );

  // Allow user to pull latest values from context on demand
  const handleTransfer = () => {
    handleSetDepot(ctx.depot);
    handleSetAnnualContribution(ctx.annualContribution);
    handleSetYearsToPension(ctx.horizonYears);
    setTransferred(true);
  };

  const costTodayPct = useMemo(() => parseDecimalRaw(costTodayRaw), [costTodayRaw]);
  const costNewPct   = useMemo(() => parseDecimalRaw(costNewRaw),   [costNewRaw]);

  const isValid =
    yearsToPension > 0 &&
    !isNaN(costTodayPct) &&
    !isNaN(costNewPct) &&
    costTodayPct >= 0 &&
    costNewPct >= 0;

  // ── Beregninger ──────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!isValid) return null;

    // Årlige omkostninger i kr. (depot + ½ indbetaling som gennemsnitlig depotstørrelse i år 1)
    const avgAssets       = depot + annualContribution * 0.5;
    const annualCostToday = avgAssets * (costTodayPct / 100);
    const annualCostNew   = avgAssets * (costNewPct   / 100);
    const annualSaving    = annualCostToday - annualCostNew;

    // Slutværdi i hvert scenarie (annuity due: indbetaling ved årets start)
    const fvToday = futureValueWithCost(depot, annualContribution, ANNUAL_RETURN, costTodayPct, yearsToPension);
    const fvNew   = futureValueWithCost(depot, annualContribution, ANNUAL_RETURN, costNewPct,   yearsToPension);
    const compoundValue = fvNew - fvToday;

    return { annualCostToday, annualCostNew, annualSaving, fvToday, fvNew, compoundValue };
  }, [isValid, depot, annualContribution, costTodayPct, costNewPct, yearsToPension]);

  // ── År-for-år tabel ──────────────────────────────────────────────────────────
  const yearTable = useMemo(() => {
    if (!isValid) return [];
    return buildYearTable(depot, annualContribution, costTodayPct, costNewPct, yearsToPension);
  }, [isValid, depot, annualContribution, costTodayPct, costNewPct, yearsToPension]);

  const costDataForPdf = results && isValid ? {
    depot,
    annualContribution,
    yearsToPension,
    costTodayPct,
    costNewPct,
    annualCostToday: results.annualCostToday,
    annualCostNew: results.annualCostNew,
    annualSaving: results.annualSaving,
    fvToday: results.fvToday,
    fvNew: results.fvNew,
    compoundValue: results.compoundValue,
    yearTable,
  } : undefined;

  return (
    <>
    <PdfReportModal
      open={pdfOpen}
      onClose={() => setPdfOpen(false)}
      costData={costDataForPdf}
      goalData={goalDataFromCtx}
      defaultSection="cost"
    />
    <div className="w-full max-w-[1400px] space-y-6 px-2">
      <CalculatorIOBar />
      {/* Overskrift */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Omkostningsberegner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Se hvad forskellen i omkostninger betyder for din opsparing over tid
          </p>
        </div>
        <button
          onClick={() => setPdfOpen(true)}
          disabled={!costDataForPdf}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{
            background: costDataForPdf ? "oklch(0.82 0.12 85)" : "oklch(0.82 0.12 85 / 0.3)",
            color: "oklch(0.13 0.04 255)",
          }}
          title={costDataForPdf ? "Generer PDF-rapport" : "Udfyld beregneren for at generere rapport"}
        >
          <FileDown className="h-4 w-4" />
          Rapport
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* ── Venstre: Input ───────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-5">

          {/* Overførselsknap */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dine oplysninger
            </h2>
            <button
              onClick={handleTransfer}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{
                background: transferred ? "oklch(0.82 0.12 85 / 0.1)" : "var(--card)",
                borderColor: transferred ? "oklch(0.82 0.12 85 / 0.35)" : "var(--border)",
                color: transferred ? "oklch(0.52 0.12 85)" : "var(--muted-foreground)",
              }}
              title="Hent depot, indbetaling og horisont fra Afkastberegneren"
            >
              <ArrowRightLeft className="h-3 w-3" />
              {transferred ? "Overført fra Afkastberegner" : "Hent fra Afkastberegner"}
            </button>
          </div>

          <div className="space-y-4">
            <NumberInput
              label="År til pension"
              value={yearsToPension}
              onChange={handleSetYearsToPension}
              suffix="år"
              min={1}
            />
            <NumberInput
              label="Depot"
              value={depot}
              onChange={handleSetDepot}
              suffix="kr."
              hint="Nuværende depotstørrelse"
            />
            <NumberInput
              label="Årlig indbetaling"
              value={annualContribution}
              onChange={handleSetAnnualContribution}
              suffix="kr."
            />
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Omkostninger
            </h2>
            <div className="space-y-4">
              <DecimalInput
                label="Omkostning i dag"
                value={costTodayRaw}
                onChange={handleSetCostTodayRaw}
                suffix="%"
                placeholder="f.eks. 1,5"
                hint="Samlet årlig omkostning (ÅOP) i dag"
              />
              <DecimalInput
                label="Omkostning ny"
                value={costNewRaw}
                onChange={handleSetCostNewRaw}
                suffix="%"
                placeholder="f.eks. 0,75"
                hint="Samlet årlig omkostning (ÅOP) fremadrettet"
              />
            </div>
          </div>

          {/* Info-boks */}
          <div
            className="rounded-lg p-3 flex gap-2.5"
            style={{
              background: "oklch(0.82 0.12 85 / 0.08)",
              border: "1px solid oklch(0.82 0.12 85 / 0.2)",
            }}
          >
            <Info
              className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
              style={{ color: "oklch(0.62 0.12 85)" }}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Beregningen anvender et fast afkast på{" "}
              <span className="font-semibold text-foreground">6,5% p.a.</span>{" "}
              Indbetalinger tilføjes ved årets begyndelse.
            </p>
          </div>
        </div>

        {/* ── Højre: Resultater ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {!isValid ? (
            <div className="bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingDown className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Udfyld oplysningerne</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Angiv gyldige omkostningsprocenter for at se beregningen
              </p>
            </div>
          ) : results ? (
            <>
              {/* Kort 1: Årlig besparelse */}
              <ResultCard title="Årlig besparelse (i dag)" icon={TrendingDown}>
                <ResultRow
                  label="Årlige omkostninger i dag"
                  value={formatDKK(results.annualCostToday)}
                />
                <ResultRow
                  label="Årlige omkostninger fremadrettet"
                  value={formatDKK(results.annualCostNew)}
                />
                <ResultRow
                  label="Årlig besparelse"
                  value={
                    results.annualSaving >= 0
                      ? formatDKK(results.annualSaving)
                      : "−" + formatDKK(Math.abs(results.annualSaving))
                  }
                  highlight={results.annualSaving >= 0 ? "positive" : "neutral"}
                  large
                />
              </ResultCard>

              {/* Kort 2: Effekt med rentes rente */}
              <ResultCard
                title="Effekt af besparelse med rentes rente"
                icon={PiggyBank}
                accent={results.compoundValue > 0}
              >
                <ResultRow
                  label={`Depotværdi om ${yearsToPension} år (ÅOP ${fmtPct(costTodayRaw)}%)`}
                  value={formatDKK(results.fvToday)}
                />
                <ResultRow
                  label={`Depotværdi om ${yearsToPension} år (ÅOP ${fmtPct(costNewRaw)}%)`}
                  value={formatDKK(results.fvNew)}
                />
                <ResultRow
                  label={`Værdi af besparelse om ${yearsToPension} år`}
                  value={
                    results.compoundValue >= 0
                      ? formatDKK(results.compoundValue)
                      : "−" + formatDKK(Math.abs(results.compoundValue))
                  }
                  highlight={results.compoundValue > 0 ? "positive" : "neutral"}
                  large
                />

                {results.compoundValue > 0 && (
                  <div
                    className="mt-4 rounded-lg p-4 text-center"
                    style={{
                      background: "oklch(0.55 0.16 155 / 0.15)",
                      border: "1px solid oklch(0.55 0.16 155 / 0.35)",
                    }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Samlet merværdi ved pension</p>
                    <p
                      className="text-3xl font-bold tabular-nums"
                      style={{ color: "oklch(0.75 0.18 155)" }}
                    >
                      {formatDKK(results.compoundValue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ved at reducere ÅOP fra {fmtPct(costTodayRaw)}% til {fmtPct(costNewRaw)}%
                    </p>
                  </div>
                )}
              </ResultCard>

              {/* Sammenklappelig år-for-år tabel */}
              <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <button
                  onClick={() => setTableOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground">
                    År-for-år oversigt
                  </span>
                  {tableOpen
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </button>

                {tableOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-border bg-muted/30">
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-16">År</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                            Depot (ÅOP {fmtPct(costTodayRaw)}%)
                          </th>
                          <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                            Depot (ÅOP {fmtPct(costNewRaw)}%)
                          </th>
                          <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                            Forskel
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearTable.map((row, i) => (
                          <tr
                            key={row.year}
                            className="border-t border-border/50"
                            style={{
                              background: i % 2 === 0 ? "var(--card)" : "oklch(0.97 0.005 240 / 0.5)",
                            }}
                          >
                            <td className="px-4 py-2 tabular-nums text-muted-foreground font-medium">
                              {row.year}
                            </td>
                            <td className="px-4 py-2 tabular-nums text-right text-foreground">
                              {formatDKK(row.fvToday)}
                            </td>
                            <td className="px-4 py-2 tabular-nums text-right text-foreground">
                              {formatDKK(row.fvNew)}
                            </td>
                            <td
                              className="px-4 py-2 tabular-nums text-right font-semibold"
                              style={{ color: row.diff >= 0 ? "#16a34a" : "#dc2626" }}
                            >
                              {row.diff >= 0
                                ? formatDKK(row.diff)
                                : "−" + formatDKK(Math.abs(row.diff))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
    </>
  );
}
