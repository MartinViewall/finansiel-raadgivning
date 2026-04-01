import { useState, useMemo } from "react";
import { useCalculatorContext } from "@/contexts/CalculatorContext";
import { CalculatorIOBar } from "@/components/CalculatorIOBar";
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

// ─── Number helpers ────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return Math.round(n).toLocaleString("da-DK");
}
function fmtPct(n: number): string {
  return n.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseNum(s: string): number {
  const v = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(v) ? 0 : Math.max(0, v);
}
function parsePct(s: string): number {
  const v = parseFloat(s.replace(",", "."));
  return isNaN(v) ? 0 : Math.max(0, v);
}

// ─── NumberInput ───────────────────────────────────────────────────────────────
function NumberInput({
  value, onChange, suffix = "kr.", min = 0,
}: {
  value: number; onChange: (v: number) => void; suffix?: string; min?: number;
}) {
  const [display, setDisplay] = useState(value === 0 ? "" : fmt(value));
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex items-center">
      <input
        type="text" inputMode="numeric"
        className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        value={focused ? display : value === 0 ? "" : fmt(value)}
        placeholder="0"
        onFocus={() => { setDisplay(value === 0 ? "" : fmt(value)); setFocused(true); }}
        onChange={(e) => { setDisplay(e.target.value); onChange(parseNum(e.target.value)); }}
        onBlur={() => {
          setFocused(false);
          const v = parseNum(display);
          onChange(Math.max(min, v));
          setDisplay(v === 0 ? "" : fmt(v));
        }}
      />
      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">{suffix}</span>
    </div>
  );
}

// ─── PctInput ──────────────────────────────────────────────────────────────────
function PctInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [display, setDisplay] = useState(String(value).replace(".", ","));
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex items-center">
      <input
        type="text" inputMode="decimal"
        className="w-full rounded-md border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        value={focused ? display : String(value).replace(".", ",")}
        onFocus={() => { setDisplay(String(value).replace(".", ",")); setFocused(true); }}
        onChange={(e) => {
          setDisplay(e.target.value);
          const v = parsePct(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        onBlur={() => {
          setFocused(false);
          const v = parsePct(display);
          const safe = isNaN(v) ? 0 : Math.max(0, v);
          onChange(safe);
          setDisplay(String(safe).replace(".", ","));
        }}
      />
      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">%</span>
    </div>
  );
}

// ─── Finance formulas (Excel-compatible) ──────────────────────────────────────
/**
 * Excel FV(rate, nper, pmt, pv, type=0) — indbetaling ved årets SLUTNING
 */
function calcFV(rate: number, nper: number, pmt: number, pv: number): number {
  if (rate === 0) return pv + pmt * nper;
  return pv * Math.pow(1 + rate, nper) + pmt * (Math.pow(1 + rate, nper) - 1) / rate;
}

/**
 * Excel PMT(rate, nper, pv, fv=0, type=1) — annuity due (udbetaling ved årets START)
 */
function calcPMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  return pv * rate / ((1 + rate) * (1 - Math.pow(1 + rate, -nper)));
}

/**
 * Find den rente der giver en bestemt PMT (binær søgning)
 */
function findRequiredRate(
  depot: number, overf: number, indbetaling: number,
  years: number, udbetalingsaar: number, garanteret: number
): number | null {
  if (garanteret <= 0 || (depot + overf <= 0 && indbetaling <= 0)) return null;
  const target = (r: number) => {
    const fv = calcFV(r, years, indbetaling, depot + overf);
    return calcPMT(r, udbetalingsaar, fv) - garanteret;
  };
  const lo0 = target(0.0001);
  const hi0 = target(0.50);
  if (lo0 >= 0) return 0.0001; // even at very low rate, pmt exceeds guarantee
  if (hi0 < 0) return null;    // even at 50% rate, pmt cannot reach guarantee
  let lo = 0.0001, hi = 0.50;
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    if (target(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PensionTypeDef {
  label: string;
  defaultUdbetalingsaar: number;
  color: string;
}

const PENSION_TYPES: PensionTypeDef[] = [
  { label: "Kapitalpension",   defaultUdbetalingsaar: 1,  color: "text-blue-400" },
  { label: "Aldersopsparing",  defaultUdbetalingsaar: 1,  color: "text-emerald-400" },
  { label: "Ratepension",      defaultUdbetalingsaar: 10, color: "text-amber-400" },
  { label: "Livrente",         defaultUdbetalingsaar: 22, color: "text-purple-400" },
];

interface SectionState {
  depot: number;
  overf: number;
  indbetaling: number;
  rentePct: number;
  udbetalingsaar: number;
  garanteret: number;
  open: boolean;
}

// ─── ResultCard ────────────────────────────────────────────────────────────────
function ResultCard({
  label, fv, pmt, garanteret, requiredRate, rentePct, color,
}: {
  label: string;
  fv: number;
  pmt: number;
  garanteret: number;
  requiredRate: number | null;
  rentePct: number;
  color: string;
}) {
  const diff = pmt - garanteret;
  const hasData = fv > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className={`text-sm font-semibold ${color}`}>{label}</div>

      {!hasData ? (
        <p className="text-xs text-muted-foreground italic">Ingen data indtastet</p>
      ) : (
        <>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Depot v. pension</span>
            <span className="text-sm font-medium">{fmt(fv)} kr.</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Forventet udbetaling/år</span>
            <span className="text-sm font-medium">{fmt(pmt)} kr.</span>
          </div>

          {garanteret > 0 && (
            <>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Garanteret ydelse/år</span>
                <span className="text-sm font-medium">{fmt(garanteret)} kr.</span>
              </div>

              <div className="flex justify-between items-baseline border-t border-border pt-2">
                <span className="text-xs text-muted-foreground">Difference</span>
                <span className={`text-sm font-bold ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {diff >= 0 ? "+" : ""}{fmt(diff)} kr.
                </span>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Nødvendig rente for garanti
                </div>
                {requiredRate !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                      {fmtPct(requiredRate * 100)}%
                    </span>
                    <div className="flex items-center gap-1">
                      {requiredRate <= rentePct / 100 ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Under forventet afkast
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Over forventet afkast
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Kan ikke beregnes</span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── SectionInputs ─────────────────────────────────────────────────────────────
function SectionInputs({
  pt, state, onChange,
}: {
  pt: PensionTypeDef;
  state: SectionState;
  onChange: (partial: Partial<SectionState>) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => onChange({ open: !state.open })}
      >
        <span className={`text-sm font-semibold ${pt.color}`}>{pt.label}</span>
        {state.open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {state.open && (
        <div className="px-4 pb-4 grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Depot i dag</label>
            <NumberInput value={state.depot} onChange={(v) => onChange({ depot: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Overførselstillæg</label>
            <NumberInput value={state.overf} onChange={(v) => onChange({ overf: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Årlig indbetaling</label>
            <NumberInput value={state.indbetaling} onChange={(v) => onChange({ indbetaling: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Gennemsnitlig forrentning</label>
            <PctInput value={state.rentePct} onChange={(v) => onChange({ rentePct: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Udbetalingsår</label>
            <NumberInput
              value={state.udbetalingsaar}
              onChange={(v) => onChange({ udbetalingsaar: Math.max(1, v) })}
              suffix="år"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Garanteret ydelse pr. år</label>
            <NumberInput value={state.garanteret} onChange={(v) => onChange({ garanteret: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AverageReturnCalculator() {
  const ctx = useCalculatorContext();

  // Global inputs
  const [currentAge, setCurrentAge] = useState(ctx.avgRetCurrentAge);
  const [pensionAge, setPensionAge]  = useState(ctx.avgRetPensionAge);

  // Per-type state — initialised from context, kept in local state for performance
  const [sections, setSections] = useState<SectionState[]>([
    {
      depot: ctx.avgRet0Depot, overf: ctx.avgRet0Overf, indbetaling: ctx.avgRet0Indbetaling,
      rentePct: ctx.avgRet0RentePct, udbetalingsaar: ctx.avgRet0Udbetalingsaar, garanteret: ctx.avgRet0Garanteret, open: true,
    },
    {
      depot: ctx.avgRet1Depot, overf: ctx.avgRet1Overf, indbetaling: ctx.avgRet1Indbetaling,
      rentePct: ctx.avgRet1RentePct, udbetalingsaar: ctx.avgRet1Udbetalingsaar, garanteret: ctx.avgRet1Garanteret, open: true,
    },
    {
      depot: ctx.avgRet2Depot, overf: ctx.avgRet2Overf, indbetaling: ctx.avgRet2Indbetaling,
      rentePct: ctx.avgRet2RentePct, udbetalingsaar: ctx.avgRet2Udbetalingsaar, garanteret: ctx.avgRet2Garanteret, open: true,
    },
    {
      depot: ctx.avgRet3Depot, overf: ctx.avgRet3Overf, indbetaling: ctx.avgRet3Indbetaling,
      rentePct: ctx.avgRet3RentePct, udbetalingsaar: ctx.avgRet3Udbetalingsaar, garanteret: ctx.avgRet3Garanteret, open: true,
    },
  ]);

  const years = Math.max(0, pensionAge - currentAge);

  // Sync a single section field to context (explicit, no dynamic indexing)
  function syncToCtx(i: number, partial: Partial<SectionState>) {
    if (i === 0) {
      if (partial.depot          !== undefined) ctx.setAvgRet0Depot(partial.depot);
      if (partial.overf          !== undefined) ctx.setAvgRet0Overf(partial.overf);
      if (partial.indbetaling    !== undefined) ctx.setAvgRet0Indbetaling(partial.indbetaling);
      if (partial.rentePct       !== undefined) ctx.setAvgRet0RentePct(partial.rentePct);
      if (partial.udbetalingsaar !== undefined) ctx.setAvgRet0Udbetalingsaar(partial.udbetalingsaar);
      if (partial.garanteret     !== undefined) ctx.setAvgRet0Garanteret(partial.garanteret);
    } else if (i === 1) {
      if (partial.depot          !== undefined) ctx.setAvgRet1Depot(partial.depot);
      if (partial.overf          !== undefined) ctx.setAvgRet1Overf(partial.overf);
      if (partial.indbetaling    !== undefined) ctx.setAvgRet1Indbetaling(partial.indbetaling);
      if (partial.rentePct       !== undefined) ctx.setAvgRet1RentePct(partial.rentePct);
      if (partial.udbetalingsaar !== undefined) ctx.setAvgRet1Udbetalingsaar(partial.udbetalingsaar);
      if (partial.garanteret     !== undefined) ctx.setAvgRet1Garanteret(partial.garanteret);
    } else if (i === 2) {
      if (partial.depot          !== undefined) ctx.setAvgRet2Depot(partial.depot);
      if (partial.overf          !== undefined) ctx.setAvgRet2Overf(partial.overf);
      if (partial.indbetaling    !== undefined) ctx.setAvgRet2Indbetaling(partial.indbetaling);
      if (partial.rentePct       !== undefined) ctx.setAvgRet2RentePct(partial.rentePct);
      if (partial.udbetalingsaar !== undefined) ctx.setAvgRet2Udbetalingsaar(partial.udbetalingsaar);
      if (partial.garanteret     !== undefined) ctx.setAvgRet2Garanteret(partial.garanteret);
    } else if (i === 3) {
      if (partial.depot          !== undefined) ctx.setAvgRet3Depot(partial.depot);
      if (partial.overf          !== undefined) ctx.setAvgRet3Overf(partial.overf);
      if (partial.indbetaling    !== undefined) ctx.setAvgRet3Indbetaling(partial.indbetaling);
      if (partial.rentePct       !== undefined) ctx.setAvgRet3RentePct(partial.rentePct);
      if (partial.udbetalingsaar !== undefined) ctx.setAvgRet3Udbetalingsaar(partial.udbetalingsaar);
      if (partial.garanteret     !== undefined) ctx.setAvgRet3Garanteret(partial.garanteret);
    }
  }

  function updateSection(i: number, partial: Partial<SectionState>) {
    setSections((prev) => prev.map((s, idx) => idx === i ? { ...s, ...partial } : s));
    syncToCtx(i, partial);
  }

  // Calculations
  const results = useMemo(() => {
    return sections.map((s) => {
      if (s.depot + s.overf === 0 && s.indbetaling === 0) {
        return { fv: 0, pmt: 0, requiredRate: null };
      }
      const r = s.rentePct / 100;
      const fv = calcFV(r, years, s.indbetaling, s.depot + s.overf);
      const pmt = calcPMT(r, s.udbetalingsaar, fv);
      const requiredRate = s.garanteret > 0
        ? findRequiredRate(s.depot, s.overf, s.indbetaling, years, s.udbetalingsaar, s.garanteret)
        : null;
      return { fv, pmt, requiredRate };
    });
  }, [sections, years]);

  return (
    <div className="w-full max-w-[1400px] px-2">
      <CalculatorIOBar />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gennemsnitsrenteberegner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beregn depot ved pension, forventet udbetaling og nødvendig gennemsnitsrente for at matche garanteret ydelse.
        </p>
      </div>

      {/* Global inputs */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Forudsætninger</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nuværende alder</label>
            <NumberInput
              value={currentAge}
              onChange={(v) => { setCurrentAge(v); ctx.setAvgRetCurrentAge(v); }}
              suffix="år"
              min={1}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pensionsalder</label>
            <NumberInput
              value={pensionAge}
              onChange={(v) => { setPensionAge(v); ctx.setAvgRetPensionAge(v); }}
              suffix="år"
              min={1}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          År til pension: <strong className="text-foreground">{years}</strong>
        </p>
      </div>

      {/* Two-column layout: inputs left, results right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: inputs */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Opsparingstyper</h2>
          {PENSION_TYPES.map((pt, i) => (
            <SectionInputs
              key={pt.label}
              pt={pt}
              state={sections[i]}
              onChange={(partial) => updateSection(i, partial)}
            />
          ))}
        </div>

        {/* Right: results */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Resultater</h2>
          {PENSION_TYPES.map((pt, i) => (
            <ResultCard
              key={pt.label}
              label={pt.label}
              fv={results[i].fv}
              pmt={results[i].pmt}
              garanteret={sections[i].garanteret}
              requiredRate={results[i].requiredRate}
              rentePct={sections[i].rentePct}
              color={pt.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
