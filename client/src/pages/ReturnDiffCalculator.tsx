import { CalculatorIOBar } from "@/components/CalculatorIOBar";
import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, PiggyBank, Info, ChevronDown, ChevronUp, ArrowRightLeft, FileDown } from "lucide-react";
import { useCalculatorContext } from "@/contexts/CalculatorContext";

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
 * Beregner depotets fremtidige værdi ved et givet afkast.
 * Indbetaling tilføjes ved STARTEN af hvert år (annuity due).
 * Svarer til Excel: FV(rate; n; -contribution; -depot; 1)
 */
function futureValueWithReturn(
  depot: number,
  annualContribution: number,
  returnPct: number,
  years: number
): number {
  const rate = returnPct / 100;
  let value = depot;
  for (let i = 0; i < years; i++) {
    value = (value + annualContribution) * (1 + rate);
  }
  return value;
}

/**
 * Bygger en år-for-år tabel med depotværdi i begge scenarier.
 */
function buildYearTable(
  depot: number,
  annualContribution: number,
  returnTodayPct: number,
  returnNewPct: number,
  years: number
): { year: number; fvToday: number; fvNew: number; diff: number }[] {
  const rateToday = returnTodayPct / 100;
  const rateNew   = returnNewPct   / 100;
  const rows = [];
  let valToday = depot;
  let valNew   = depot;
  for (let i = 1; i <= years; i++) {
    valToday = (valToday + annualContribution) * (1 + rateToday);
    valNew   = (valNew   + annualContribution) * (1 + rateNew);
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
        background: accent ? "oklch(94% 0.010 155)" : "var(--card)",
        borderColor: accent ? "oklch(55% 0.10 155 / 0.3)" : "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: accent
              ? "oklch(55% 0.10 155 / 0.15)"
              : "oklch(72% 0.12 75 / 0.15)",
            border: `1px solid ${accent ? "oklch(55% 0.10 155 / 0.35)" : "oklch(72% 0.12 75 / 0.3)"}`,
          }}
        >
          <Icon
            className="h-3.5 w-3.5"
            style={{ color: accent ? "oklch(40% 0.14 155)" : "oklch(72% 0.12 75)" }}
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
  highlight?: "positive" | "neutral" | "loss";
  large?: boolean;
}) {
  const valueColor =
    highlight === "positive"
      ? "oklch(40% 0.14 155)"
      : highlight === "loss"
      ? "oklch(44% 0.18 25)"
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

export default function ReturnDiffCalculator() {
  const ctx = useCalculatorContext();

  // State — initialised from context fields (reuse returnDiff* fields)
  const [depot, setDepot] = useState(() => ctx.returnDiffDepot);
  const [annualContribution, setAnnualContribution] = useState(() => ctx.returnDiffAnnualContribution);
  const [yearsToPension, setYearsToPension] = useState(() => ctx.returnDiffYearsToPension);
  const [returnTodayRaw, setReturnTodayRaw] = useState(() => ctx.returnDiffTodayRaw);
  const [returnNewRaw, setReturnNewRaw] = useState(() => ctx.returnDiffNewRaw);
  const [tableOpen, setTableOpen] = useState(false);

  // Sync local state from context when context changes (e.g. after import)
  useEffect(() => { setDepot(ctx.returnDiffDepot); }, [ctx.returnDiffDepot]);
  useEffect(() => { setAnnualContribution(ctx.returnDiffAnnualContribution); }, [ctx.returnDiffAnnualContribution]);
  useEffect(() => { setYearsToPension(ctx.returnDiffYearsToPension); }, [ctx.returnDiffYearsToPension]);
  useEffect(() => { setReturnTodayRaw(ctx.returnDiffTodayRaw); }, [ctx.returnDiffTodayRaw]);
  useEffect(() => { setReturnNewRaw(ctx.returnDiffNewRaw); }, [ctx.returnDiffNewRaw]);

  // Write back to context on every change
  const handleSetDepot = (v: number) => { setDepot(v); ctx.setReturnDiffDepot(v); };
  const handleSetAnnualContribution = (v: number) => { setAnnualContribution(v); ctx.setReturnDiffAnnualContribution(v); };
  const handleSetYearsToPension = (v: number) => { setYearsToPension(v); ctx.setReturnDiffYearsToPension(v); };
  const handleSetReturnTodayRaw = (v: string) => { setReturnTodayRaw(v); ctx.setReturnDiffTodayRaw(v); };
  const handleSetReturnNewRaw = (v: string) => { setReturnNewRaw(v); ctx.setReturnDiffNewRaw(v); };

  // Transfer from Afkastberegner
  const [transferred, setTransferred] = useState(false);
  const handleTransfer = () => {
    handleSetDepot(ctx.depot);
    handleSetAnnualContribution(ctx.annualContribution);
    handleSetYearsToPension(ctx.horizonYears);
    setTransferred(true);
  };

  const returnTodayPct = useMemo(() => parseDecimalRaw(returnTodayRaw), [returnTodayRaw]);
  const returnNewPct   = useMemo(() => parseDecimalRaw(returnNewRaw),   [returnNewRaw]);

  const isValid =
    yearsToPension > 0 &&
    !isNaN(returnTodayPct) &&
    !isNaN(returnNewPct) &&
    returnTodayPct >= 0 &&
    returnNewPct >= 0;

  // ── Beregninger ──────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!isValid) return null;

    const fvToday = futureValueWithReturn(depot, annualContribution, returnTodayPct, yearsToPension);
    const fvNew   = futureValueWithReturn(depot, annualContribution, returnNewPct,   yearsToPension);
    const diff    = fvNew - fvToday;
    const diffPct = fvToday > 0 ? (diff / fvToday) * 100 : 0;

    return { fvToday, fvNew, diff, diffPct };
  }, [isValid, depot, annualContribution, returnTodayPct, returnNewPct, yearsToPension]);

  // ── År-for-år tabel ──────────────────────────────────────────────────────────
  const yearTable = useMemo(() => {
    if (!isValid) return [];
    return buildYearTable(depot, annualContribution, returnTodayPct, returnNewPct, yearsToPension);
  }, [isValid, depot, annualContribution, returnTodayPct, returnNewPct, yearsToPension]);

  return (
    <div className="w-full max-w-[1400px] space-y-6 px-2">
      <CalculatorIOBar />

      {/* Overskrift */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Afkastforskelberegner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Se hvad forskellen i afkast betyder for din opsparing over tid
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg opacity-40 cursor-not-allowed flex-shrink-0"
          style={{
            background: "oklch(72% 0.12 75)",
            color: "oklch(13% 0.005 60)",
          }}
          title="PDF-rapport kommer snart"
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
                background: transferred ? "oklch(72% 0.12 75 / 0.12)" : "var(--card)",
                borderColor: transferred ? "oklch(72% 0.12 75 / 0.4)" : "var(--border)",
                color: transferred ? "oklch(42% 0.10 75)" : "var(--muted-foreground)",
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
              Afkast
            </h2>
            <div className="space-y-4">
              <DecimalInput
                label="Afkast i dag"
                value={returnTodayRaw}
                onChange={handleSetReturnTodayRaw}
                suffix="%"
                placeholder="f.eks. 5"
                hint="Forventet årligt afkast i nuværende løsning"
              />
              <DecimalInput
                label="Alternativt afkast"
                value={returnNewRaw}
                onChange={handleSetReturnNewRaw}
                suffix="%"
                placeholder="f.eks. 7"
                hint="Forventet årligt afkast i alternativ løsning"
              />
            </div>
          </div>

          {/* Info-boks */}
          <div
            className="rounded-lg p-3 flex gap-2.5"
            style={{
              background: "oklch(72% 0.12 75 / 0.08)",
              border: "1px solid oklch(72% 0.12 75 / 0.25)",
            }}
          >
            <Info
              className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
              style={{ color: "oklch(42% 0.10 75)" }}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Begge scenarier bruger de afkastprocenter du angiver.
              Indbetalinger tilføjes ved årets begyndelse (annuity due).
            </p>
          </div>
        </div>

        {/* ── Højre: Resultater ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {!isValid ? (
            <div className="bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Udfyld oplysningerne</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Angiv gyldige afkastprocenter for at se beregningen
              </p>
            </div>
          ) : results ? (
            <>
              {/* Kort 1: Depotværdi i begge scenarier */}
              <ResultCard title="Depotværdi ved pension" icon={TrendingUp}>
                <ResultRow
                  label={`Depot om ${yearsToPension} år (afkast ${fmtPct(returnTodayRaw)}%)`}
                  value={formatDKK(results.fvToday)}
                />
                <ResultRow
                  label={`Depot om ${yearsToPension} år (afkast ${fmtPct(returnNewRaw)}%)`}
                  value={formatDKK(results.fvNew)}
                />
                <ResultRow
                  label="Forskel i depotværdi"
                  value={
                    results.diff >= 0
                      ? formatDKK(results.diff)
                      : "−" + formatDKK(Math.abs(results.diff))
                  }
                  highlight={results.diff >= 0 ? "positive" : "neutral"}
                  large
                />
              </ResultCard>

              {/* Kort 2: Tab ved lavere afkast */}
              <ResultCard
                title="Effekt af lavere afkast med rentes rente"
                icon={PiggyBank}
              >
                <ResultRow
                  label={`Afkast i dag: ${fmtPct(returnTodayRaw)}%`}
                  value={formatDKK(results.fvToday)}
                />
                <ResultRow
                  label={`Alternativt afkast: ${fmtPct(returnNewRaw)}%`}
                  value={formatDKK(results.fvNew)}
                />
                <ResultRow
                  label={`Hvad du går glip af om ${yearsToPension} år`}
                  value={
                    results.diff >= 0
                      ? formatDKK(results.diff)
                      : "−" + formatDKK(Math.abs(results.diff))
                  }
                  highlight={results.diff > 0 ? "loss" : "neutral"}
                  large
                />

                {results.diff > 0 && (
                  <div
                    className="mt-4 rounded-lg p-4 text-center"
                    style={{
                      background: "oklch(44% 0.18 25 / 0.07)",
                      border: "1px solid oklch(44% 0.18 25 / 0.28)",
                    }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Hvad du mister til pensionen</p>
                    <p
                      className="text-3xl font-bold tabular-nums"
                      style={{ color: "oklch(44% 0.18 25)" }}
                    >
                      {formatDKK(results.diff)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ved at beholde {fmtPct(returnTodayRaw)}% frem for {fmtPct(returnNewRaw)}% afkast
                      {results.diffPct > 0 && ` (${results.diffPct.toFixed(1).replace(".", ",")}% lavere slutdepot)`}
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
                            Depot ({fmtPct(returnTodayRaw)}%)
                          </th>
                          <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                            Depot ({fmtPct(returnNewRaw)}%)
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
                              background: i % 2 === 0 ? "var(--card)" : "oklch(94% 0.006 60)",
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
                              style={{ color: row.diff >= 0 ? "oklch(40% 0.14 155)" : "oklch(44% 0.18 25)" }}
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
  );
}
