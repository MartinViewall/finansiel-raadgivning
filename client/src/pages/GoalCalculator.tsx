import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, PiggyBank, TrendingUp, Banknote } from "lucide-react";
import { useCalculatorContext } from "@/contexts/CalculatorContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Beregner krævet ÅRLIG indbetaling (annuity due – indbetaling ved årets start)
 * for at nå en given fremtidig værdi (FV), givet et startdepot og et afkast.
 *
 * FV = depot*(1+r)^n + pmt*(1+r)*((1+r)^n - 1)/r
 * => pmt = (FV - depot*(1+r)^n) * r / ((1+r)*((1+r)^n - 1))
 */
function requiredAnnualSaving(
  targetFV: number,
  depot: number,
  annualReturn: number,
  years: number
): number {
  const r = annualReturn;
  const n = years;
  const depotFV = depot * Math.pow(1 + r, n);
  const gap = targetFV - depotFV;
  if (gap <= 0) return 0;
  if (r === 0) return gap / n;
  const annuityFactor = (1 + r) * (Math.pow(1 + r, n) - 1) / r;
  return gap / annuityFactor;
}

/**
 * Beregner den kapital der kræves ved pension for at kunne udbetale
 * `annualPayout` kr. hvert år i `payoutYears` år (annuity due).
 *
 * PV = pmt * (1 - (1+r)^-n) / r * (1+r)   [annuity due]
 */
function requiredCapitalForPayout(
  annualPayout: number,
  payoutYears: number,
  annualReturn: number
): number {
  const r = annualReturn;
  const n = payoutYears;
  if (r === 0) return annualPayout * n;
  return annualPayout * (1 - Math.pow(1 + r, -n)) / r * (1 + r);
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
  highlight?: "positive" | "warning" | "neutral";
  large?: boolean;
}) {
  const valueColor =
    highlight === "positive"
      ? "oklch(0.72 0.18 155)"
      : highlight === "warning"
      ? "oklch(0.82 0.12 85)"
      : "var(--foreground)";

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

// ─── Mode toggle ──────────────────────────────────────────────────────────────

type Mode = "lumpsum" | "payout";

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? "oklch(0.82 0.12 85 / 0.18)" : "transparent",
        color: active ? "oklch(0.82 0.12 85)" : "var(--muted-foreground)",
        border: active ? "1px solid oklch(0.82 0.12 85 / 0.35)" : "1px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

// ─── Hovedside ────────────────────────────────────────────────────────────────

export default function GoalCalculator() {
  const ctx = useCalculatorContext();

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>(() => ctx.goalMode);

  // ── Fælles inputs ─────────────────────────────────────────────────────────
  const [depot, setDepot]           = useState(() => ctx.goalDepot);
  const [years, setYears]           = useState(() => ctx.goalYears);
  const [returnRaw, setReturnRaw]   = useState(() => ctx.goalReturnRaw);

  // ── Mode 1 – Engangsmål ───────────────────────────────────────────────────
  const [targetAmount, setTargetAmount] = useState(() => ctx.goalTargetAmount);

  // ── Mode 2 – Løbende udbetaling ───────────────────────────────────────────
  const [annualPayout, setAnnualPayout]   = useState(() => ctx.goalAnnualPayout);
  const [payoutYears, setPayoutYears]     = useState(() => ctx.goalPayoutYears);

  // ── Write back to context on every change ─────────────────────────────────
  const handleMode          = (v: Mode)   => { setMode(v);          ctx.setGoalMode(v); };
  const handleDepot         = (v: number) => { setDepot(v);         ctx.setGoalDepot(v); };
  const handleYears         = (v: number) => { setYears(v);         ctx.setGoalYears(v); };
  const handleReturnRaw     = (v: string) => { setReturnRaw(v);     ctx.setGoalReturnRaw(v); };
  const handleTargetAmount  = (v: number) => { setTargetAmount(v);  ctx.setGoalTargetAmount(v); };
  const handleAnnualPayout  = (v: number) => { setAnnualPayout(v);  ctx.setGoalAnnualPayout(v); };
  const handlePayoutYears   = (v: number) => { setPayoutYears(v);   ctx.setGoalPayoutYears(v); };

  // ── Beregninger ───────────────────────────────────────────────────────────
  const annualReturn = useMemo(() => {
    const v = parseDecimalRaw(returnRaw);
    return isNaN(v) ? NaN : v / 100;
  }, [returnRaw]);

  const results = useMemo(() => {
    if (isNaN(annualReturn) || years <= 0) return null;

    // Hvad depot i dag vokser til
    const depotFV = depot * Math.pow(1 + annualReturn, years);

    if (mode === "lumpsum") {
      if (targetAmount <= 0) return null;
      const required = requiredAnnualSaving(targetAmount, depot, annualReturn, years);
      const gap = Math.max(0, targetAmount - depotFV);
      return {
        mode: "lumpsum" as const,
        depotFV,
        targetAmount,
        gap,
        requiredAnnual: required,
        requiredMonthly: required / 12,
      };
    } else {
      if (annualPayout <= 0 || payoutYears <= 0) return null;
      const capitalNeeded = requiredCapitalForPayout(annualPayout, payoutYears, annualReturn);
      const required = requiredAnnualSaving(capitalNeeded, depot, annualReturn, years);
      const gap = Math.max(0, capitalNeeded - depotFV);
      return {
        mode: "payout" as const,
        depotFV,
        capitalNeeded,
        gap,
        requiredAnnual: required,
        requiredMonthly: required / 12,
        annualPayout,
        payoutYears,
      };
    }
  }, [mode, depot, years, annualReturn, targetAmount, annualPayout, payoutYears]);

  const isValid = results !== null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display, serif)" }}>
          Målberegner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beregn hvad der kræves for at nå dit pensionsmål
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex gap-1 rounded-xl p-1 mb-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <ModeButton active={mode === "lumpsum"} onClick={() => handleMode("lumpsum")}>
          Opsparing til engangsmål
        </ModeButton>
        <ModeButton active={mode === "payout"} onClick={() => handleMode("payout")}>
          Opsparing til løbende udbetaling
        </ModeButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ── Inputpanel ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-xl border p-5 space-y-5 h-fit"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Dine oplysninger
            </p>
            <div className="space-y-4">
              {mode === "lumpsum" ? (
                <NumberInput
                  label="Mål ved pension"
                  value={targetAmount}
                  onChange={handleTargetAmount}
                  suffix="kr."
                  hint="Det beløb du ønsker at have samlet ved pension"
                  min={1}
                />
              ) : (
                <>
                  <NumberInput
                    label="Ønsket årlig udbetaling"
                    value={annualPayout}
                    onChange={handleAnnualPayout}
                    suffix="kr."
                    hint="Hvad du ønsker udbetalt hvert år som pensionist"
                    min={1}
                  />
                  <NumberInput
                    label="Udbetalingsperiode"
                    value={payoutYears}
                    onChange={handlePayoutYears}
                    suffix="år"
                    hint="Antal år du forventer at modtage udbetalingen"
                    min={1}
                  />
                </>
              )}
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Nuværende situation
            </p>
            <div className="space-y-4">
              <NumberInput
                label="Depot i dag"
                value={depot}
                onChange={handleDepot}
                suffix="kr."
                hint="Nuværende depotstørrelse"
              />
              <NumberInput
                label="År til pension"
                value={years}
                onChange={handleYears}
                suffix="år"
                min={1}
              />
              <DecimalInput
                label="Forventet afkast"
                value={returnRaw}
                onChange={handleReturnRaw}
                suffix="%"
                placeholder="f.eks. 6,5"
                hint="Forventet gennemsnitligt årligt afkast"
              />
            </div>
          </div>
        </div>

        {/* ── Resultater ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {!isValid ? (
            <div
              className="rounded-xl border p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <Target className="h-8 w-8 mb-3" style={{ color: "oklch(0.82 0.12 85 / 0.5)" }} />
              <p className="text-sm text-muted-foreground">
                Udfyld alle felter for at se beregningen
              </p>
            </div>
          ) : (
            <>
              {/* Kort 1 – Depotets vækst */}
              <ResultCard title="Depotets vækst" icon={TrendingUp}>
                <ResultRow
                  label="Depot i dag"
                  value={formatDKK(depot)}
                />
                <ResultRow
                  label={`Depot om ${years} år (${returnRaw}% afkast)`}
                  value={formatDKK(results.depotFV)}
                  highlight="neutral"
                />
                {results.mode === "lumpsum" && (
                  <>
                    <ResultRow
                      label="Mål ved pension"
                      value={formatDKK(results.targetAmount)}
                    />
                    <ResultRow
                      label="Manglende beløb"
                      value={results.gap > 0 ? formatDKK(results.gap) : "Målet nås allerede"}
                      highlight={results.gap > 0 ? "warning" : "positive"}
                    />
                  </>
                )}
                {results.mode === "payout" && (
                  <>
                    <ResultRow
                      label={`Krævet kapital (${results.annualPayout.toLocaleString("da-DK")} kr./år i ${results.payoutYears} år)`}
                      value={formatDKK(results.capitalNeeded)}
                    />
                    <ResultRow
                      label="Manglende beløb"
                      value={results.gap > 0 ? formatDKK(results.gap) : "Kapitalen nås allerede"}
                      highlight={results.gap > 0 ? "warning" : "positive"}
                    />
                  </>
                )}
              </ResultCard>

              {/* Kort 2 – Krævet opsparing */}
              <ResultCard title="Krævet opsparing" icon={PiggyBank} accent>
                {results.requiredAnnual <= 0 ? (
                  <div className="py-3 text-center">
                    <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.18 155)" }}>
                      Ingen ekstra opsparing nødvendig
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dit nuværende depot vokser til mere end målet
                    </p>
                  </div>
                ) : (
                  <>
                    <ResultRow
                      label="Krævet årlig indbetaling"
                      value={formatDKK(results.requiredAnnual)}
                      highlight="positive"
                      large
                    />
                    <ResultRow
                      label="Krævet månedlig indbetaling"
                      value={formatDKK(results.requiredMonthly)}
                      highlight="positive"
                    />
                    <div
                      className="mt-4 rounded-lg p-4 text-center"
                      style={{ background: "oklch(0.55 0.16 155 / 0.12)", border: "1px solid oklch(0.55 0.16 155 / 0.25)" }}
                    >
                      <p className="text-xs text-muted-foreground mb-1">Krævet månedlig indbetaling</p>
                      <p className="text-3xl font-bold tabular-nums" style={{ color: "oklch(0.72 0.18 155)" }}>
                        {formatDKK(results.requiredMonthly)}
                      </p>
                      {results.mode === "lumpsum" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          for at nå {formatDKK(results.targetAmount)} om {years} år
                        </p>
                      )}
                      {results.mode === "payout" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          for at kunne udbetale {formatDKK(results.annualPayout)}/år i {results.payoutYears} år
                        </p>
                      )}
                    </div>
                  </>
                )}
              </ResultCard>

              {/* Kort 3 – Forudsætninger */}
              <ResultCard title="Forudsætninger" icon={Banknote}>
                <ResultRow label="Afkast p.a." value={`${returnRaw}%`} />
                <ResultRow label="Tidshorisont" value={`${years} år`} />
                <ResultRow label="Indbetaling tilføjes" value="Årets begyndelse" />
                {results.mode === "payout" && (
                  <ResultRow label="Udbetalingsmodel" value="Annuity due" />
                )}
              </ResultCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
