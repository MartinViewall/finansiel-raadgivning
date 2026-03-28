import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingDown, PiggyBank, Info } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ANNUAL_RETURN = 0.065; // 6,5% fast afkast (vises ikke i UI)

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
  // Håndter dansk format: punktum som tusindtalsseparator, komma som decimal
  return parseFloat(raw.replace(/\./g, "").replace(/,/g, "."));
}

function parseDecimalRaw(raw: string): number {
  // Tillad både komma og punktum som decimal
  return parseFloat(raw.replace(/,/g, "."));
}

/**
 * Beregner den fremtidige værdi af en løbende besparelse (annuitet)
 * med rentes rente over 'years' år ved afkastet ANNUAL_RETURN.
 *
 * FV = PMT * ((1+r)^n - 1) / r
 * hvor PMT er den årlige besparelse.
 */
function futureValueOfSavings(annualSaving: number, years: number): number {
  if (years <= 0 || annualSaving <= 0) return 0;
  const r = ANNUAL_RETURN;
  return annualSaving * (Math.pow(1 + r, years) - 1) / r;
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

// ─── DecimalInput (til procentsatser) ────────────────────────────────────────

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
        background: accent ? "oklch(0.97 0.02 145 / 0.4)" : "var(--card)",
        borderColor: accent ? "oklch(0.75 0.12 145 / 0.4)" : "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: accent
              ? "oklch(0.75 0.12 145 / 0.15)"
              : "oklch(0.82 0.12 85 / 0.12)",
            border: `1px solid ${accent ? "oklch(0.75 0.12 145 / 0.3)" : "oklch(0.82 0.12 85 / 0.25)"}`,
          }}
        >
          <Icon
            className="h-3.5 w-3.5"
            style={{
              color: accent ? "oklch(0.55 0.14 145)" : "oklch(0.62 0.12 85)",
            }}
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
  const [yearsToPension, setYearsToPension] = useState(20);
  const [depot, setDepot] = useState(500_000);
  const [annualContribution, setAnnualContribution] = useState(60_000);
  const [costTodayRaw, setCostTodayRaw] = useState("1,5");
  const [costNewRaw, setCostNewRaw] = useState("0,75");

  // Parsed procentsatser
  const costTodayPct = useMemo(
    () => parseDecimalRaw(costTodayRaw),
    [costTodayRaw]
  );
  const costNewPct = useMemo(
    () => parseDecimalRaw(costNewRaw),
    [costNewRaw]
  );

  const isValid =
    yearsToPension > 0 &&
    !isNaN(costTodayPct) &&
    !isNaN(costNewPct) &&
    costTodayPct >= 0 &&
    costNewPct >= 0;

  // ── Beregninger ──────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!isValid) return null;

    // Gennemsnitlig depotstørrelse i løbet af året:
    // Depot ved årets start + halvdelen af årets indbetaling
    const totalAssets = depot + annualContribution * 0.5;

    // Årlige omkostninger i kr. (baseret på gennemsnitlig depotstørrelse)
    const annualCostToday = totalAssets * (costTodayPct / 100);
    const annualCostNew = totalAssets * (costNewPct / 100);
    const annualSaving = annualCostToday - annualCostNew;

    // Fremtidig værdi af den løbende besparelse med rentes rente
    const compoundValue = futureValueOfSavings(annualSaving, yearsToPension);

    return {
      annualCostToday,
      annualCostNew,
      annualSaving,
      compoundValue,
    };
  }, [isValid, depot, annualContribution, costTodayPct, costNewPct, yearsToPension]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Overskrift */}
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

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* ── Venstre: Input ───────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Dine oplysninger
            </h2>
            <div className="space-y-4">
              <NumberInput
                label="År til pension"
                value={yearsToPension}
                onChange={setYearsToPension}
                suffix="år"
                min={1}
              />
              <NumberInput
                label="Depot"
                value={depot}
                onChange={setDepot}
                suffix="kr."
                hint="Nuværende depotstørrelse"
              />
              <NumberInput
                label="Årlig indbetaling"
                value={annualContribution}
                onChange={setAnnualContribution}
                suffix="kr."
              />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Omkostninger
            </h2>
            <div className="space-y-4">
              <DecimalInput
                label="Omkostning i dag"
                value={costTodayRaw}
                onChange={setCostTodayRaw}
                suffix="%"
                placeholder="f.eks. 1,5"
                hint="Samlet årlig omkostning (ÅOP) i dag"
              />
              <DecimalInput
                label="Omkostning ny"
                value={costNewRaw}
                onChange={setCostNewRaw}
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
              og viser effekten af besparelsen med rentes rente frem til pension.
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
              <h3 className="font-medium text-foreground mb-1">
                Udfyld oplysningerne
              </h3>
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
                accent={results.annualSaving > 0}
              >
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    Hvad er den årlige besparelse på{" "}
                    <span className="font-semibold text-foreground">
                      {formatDKK(results.annualSaving)}
                    </span>{" "}
                    værd om{" "}
                    <span className="font-semibold text-foreground">
                      {yearsToPension} år
                    </span>{" "}
                    ved 6,5% p.a.?
                  </p>
                </div>
                <ResultRow
                  label={`Værdi af årlig besparelse om ${yearsToPension} år`}
                  value={
                    results.compoundValue >= 0
                      ? formatDKK(results.compoundValue)
                      : "−" + formatDKK(Math.abs(results.compoundValue))
                  }
                  highlight={results.compoundValue > 0 ? "positive" : "neutral"}
                  large
                />

                {/* Visuel fremhævning */}
                {results.annualSaving > 0 && (
                  <div
                    className="mt-4 rounded-lg p-4 text-center"
                    style={{
                      background: "oklch(0.75 0.12 145 / 0.1)",
                      border: "1px solid oklch(0.75 0.12 145 / 0.25)",
                    }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Samlet merværdi ved pension
                    </p>
                    <p
                      className="text-3xl font-bold tabular-nums"
                      style={{ color: "oklch(0.45 0.14 145)" }}
                    >
                      {formatDKK(results.compoundValue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ved at reducere ÅOP fra{" "}
                      {costTodayRaw.replace(".", ",")}% til{" "}
                      {costNewRaw.replace(".", ",")}%
                    </p>
                  </div>
                )}
              </ResultCard>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
