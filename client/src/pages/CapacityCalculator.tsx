import { CalculatorIOBar } from "@/components/CalculatorIOBar";
import { useState, useMemo } from "react";
import { useCalculatorContext } from "@/contexts/CalculatorContext";
import { ChevronDown, ChevronUp, BookmarkCheck, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

// ─── Number formatting helpers ────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.round(n).toLocaleString("da-DK");
}

function parseNum(s: string): number {
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const v = parseFloat(cleaned);
  return isNaN(v) ? 0 : Math.max(0, v);
}

// ─── NumberInput component ─────────────────────────────────────────────────────

function NumberInput({
  value,
  onChange,
  suffix = "kr.",
  step,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  const [display, setDisplay] = useState(value === 0 ? "" : fmt(value));
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="numeric"
        className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        value={focused ? display : value === 0 ? "" : fmt(value)}
        placeholder="0"
        onFocus={() => {
          setDisplay(value === 0 ? "" : fmt(value));
          setFocused(true);
        }}
        onChange={(e) => {
          setDisplay(e.target.value);
          onChange(parseNum(e.target.value));
        }}
        onBlur={() => {
          setFocused(false);
          const v = parseNum(display);
          onChange(Math.max(min, v));
          setDisplay(v === 0 ? "" : fmt(v));
        }}
      />
      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}

function PctInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [display, setDisplay] = useState(String(value).replace(".", ","));
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="decimal"
        className="w-full rounded-md border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        value={focused ? display : String(value).replace(".", ",")}
        onFocus={() => {
          setDisplay(String(value).replace(".", ","));
          setFocused(true);
        }}
        onChange={(e) => {
          setDisplay(e.target.value);
          const v = parseFloat(e.target.value.replace(",", "."));
          if (!isNaN(v)) onChange(v);
        }}
        onBlur={() => {
          setFocused(false);
          const v = parseFloat(display.replace(",", "."));
          const safe = isNaN(v) ? 0 : Math.max(0, v);
          onChange(safe);
          setDisplay(String(safe).replace(".", ","));
        }}
      />
      <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
        %
      </span>
    </div>
  );
}

// ─── Collapsible panel ─────────────────────────────────────────────────────────

function Panel({
  title,
  color,
  children,
  defaultOpen = false,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: color }} />
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-3">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div>{children}</div>
    </div>
  );
}

// ─── Core calculation functions ────────────────────────────────────────────────

/**
 * Future value matching Excel: =FV(annualRate, years, -annualContrib, -pv, 1)
 * Annual compounding, annuity due (contributions at START of each year).
 *
 * Excel FV(rate, nper, pmt, pv, type=1):
 *   FV = pv*(1+r)^n + pmt*(1+r)*((1+r)^n - 1)/r
 */
function calcFV(
  pv: number,
  annualContrib: number,
  annualRate: number,
  years: number
): number {
  if (years <= 0) return pv;
  const growth = Math.pow(1 + annualRate, years);
  const pvFV = pv * growth;
  if (annualRate === 0) return pvFV + annualContrib * years;
  // Annuity due (type=1): PMT × (1+r) × ((1+r)^n - 1) / r
  const annuityFV = annualContrib * (1 + annualRate) * ((growth - 1) / annualRate);
  return pvFV + annuityFV;
}

/**
 * Annual payout matching Excel: =PMT(annualRate, payoutYears, -fv, 0, 1)
 * Annuity due (payments at START of each year).
 * Returns ANNUAL gross payout. Monthly net = annual * (1-tax) / 12.
 *
 * Excel PMT(rate, nper, pv, fv=0, type=1):
 *   PMT_ordinary = pv * r / (1-(1+r)^-n)
 *   PMT_due = PMT_ordinary / (1+r)
 */
function annualPayoutDue(fv: number, annualRate: number, years: number): number {
  if (fv <= 0 || years <= 0) return 0;
  if (annualRate === 0) return fv / years;
  const pmt_ordinary = (fv * annualRate) / (1 - Math.pow(1 + annualRate, -years));
  return pmt_ordinary / (1 + annualRate);
}

// ─── Environment result types ──────────────────────────────────────────────────

interface EnvResult {
  wealthAtPension: number;
  monthlyGross: number;
  monthlyNet: number;
  label: string;
  color: string;
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ScenarioState {
  // Global
  yearsToPension: number;
  payoutYears: number;
  desiredMonthly: number;
  civilStatus: "enlig" | "par";
  // Pension
  pensionWealth: number;
  pensionMonthly: number;
  pensionReturn: number;
  palTax: number;
  pensionTax: number;
  // Frie midler
  friWealth: number;
  friMonthly: number;
  friReturn: number;
  friTax: number;
  // Friværdi
  frivaerdiMode: "beregn" | "direkte";
  boligVaerdi: number;
  boligStigningPct: number;
  restgaeld: number;
  aarligAfdrag: number;
  frivaerdiDirekte: number;
  frivaerdiAnvendtPct: number;
  // Selskab
  selskabWealth: number;
  selskabMonthly: number;
  selskabReturn: number;
  selskabSkat: number;
  udbytteSkat: number;
  // Offentlige ydelser
  folkepension: number;
  pensionstillaeg: number;
  atp: number;
}

const defaultState = (civilStatus: "enlig" | "par" = "enlig"): ScenarioState => ({
  yearsToPension: 10,
  payoutYears: 20,
  desiredMonthly: 30000,
  civilStatus,
  pensionWealth: 0,
  pensionMonthly: 0,
  pensionReturn: 6.0,
  palTax: 15.3,
  pensionTax: 38,
  friWealth: 0,
  friMonthly: 0,
  friReturn: 6.0,
  friTax: 27,
  frivaerdiMode: "beregn",
  boligVaerdi: 0,
  boligStigningPct: 2.0,
  restgaeld: 0,
  aarligAfdrag: 0,
  frivaerdiDirekte: 0,
  frivaerdiAnvendtPct: 50,
  selskabWealth: 0,
  selskabMonthly: 0,
  selskabReturn: 6.0,
  selskabSkat: 22,
  udbytteSkat: 27,
  folkepension: civilStatus === "enlig" ? 7100 : 7100,
  pensionstillaeg: civilStatus === "enlig" ? 4300 : 4300,
  atp: civilStatus === "enlig" ? 2500 : 2500,
});

function calcResults(s: ScenarioState) {
  // ── Pension ──────────────────────────────────────────────────────────────────
  // Excel: FV(rate*(1-PAL), years, -annualContrib, -depot, 1)
  // Annual indbetaling = månedlig * 12
  const palNetRate = (s.pensionReturn * (1 - s.palTax / 100)) / 100;
  const pensionFV = calcFV(s.pensionWealth, s.pensionMonthly * 12, palNetRate, s.yearsToPension);
  // Excel: PMT(rate*(1-PAL), payoutYears, -FV, 0, 1) → annual gross payout
  const pensionAnnualGross = annualPayoutDue(pensionFV, palNetRate, s.payoutYears);
  // Monthly net = annual * (1-skat) / 12
  const pensionGross = pensionAnnualGross / 12;
  const pensionNet = pensionAnnualGross * (1 - s.pensionTax / 100) / 12;

  // ── Frie midler ──────────────────────────────────────────────────────────────
  // Net rate after ongoing tax on returns
  const friNetRate = (s.friReturn * (1 - s.friTax / 100)) / 100;
  const friFV = calcFV(s.friWealth, s.friMonthly * 12, friNetRate, s.yearsToPension);
  // Payout: return already taxed, so payout is tax-free
  const friAnnualPayout = annualPayoutDue(friFV, friNetRate, s.payoutYears);
  const friNet = friAnnualPayout / 12;

  // ── Friværdi ─────────────────────────────────────────────────────────────────
  let frivaerdiAtPension: number;
  if (s.frivaerdiMode === "beregn") {
    const boligFV = s.boligVaerdi * Math.pow(1 + s.boligStigningPct / 100, s.yearsToPension);
    const restgaeldAtPension = Math.max(0, s.restgaeld - s.aarligAfdrag * s.yearsToPension);
    frivaerdiAtPension = Math.max(0, boligFV - restgaeldAtPension);
  } else {
    frivaerdiAtPension = s.frivaerdiDirekte;
  }
  const frivaerdiUsed = frivaerdiAtPension * (s.frivaerdiAnvendtPct / 100);
  // Warning: negative equity
  const frivaerdiNegative = s.frivaerdiMode === "beregn" &&
    s.boligVaerdi * Math.pow(1 + s.boligStigningPct / 100, s.yearsToPension) < Math.max(0, s.restgaeld - s.aarligAfdrag * s.yearsToPension);
  // Friværdi: simple monthly drawdown over payout period (tax-free)
  const frivaerdiMonthly = frivaerdiUsed / (s.payoutYears * 12);

  // ── Selskab ──────────────────────────────────────────────────────────────────
  // Net rate after corporate tax on returns
  const selNetRate = (s.selskabReturn * (1 - s.selskabSkat / 100)) / 100;
  const selFV = calcFV(s.selskabWealth, s.selskabMonthly * 12, selNetRate, s.yearsToPension);
  const selAnnualGross = annualPayoutDue(selFV, selNetRate, s.payoutYears);
  const selGross = selAnnualGross / 12;
  const selNet = selAnnualGross * (1 - s.udbytteSkat / 100) / 12;

  // ── Offentlige ydelser ───────────────────────────────────────────────────────
  const offentlig = s.folkepension + s.pensionstillaeg + s.atp;

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalMonthly = pensionNet + friNet + frivaerdiMonthly + selNet + offentlig;
  const gap = totalMonthly - s.desiredMonthly;

  return {
    pensionFV,
    pensionGross,
    pensionNet,
    friFV,
    friNet,
    frivaerdiAtPension,
    frivaerdiUsed,
    frivaerdiMonthly,
    frivaerdiNegative,
    selFV,
    selGross,
    selNet,
    offentlig,
    totalMonthly,
    gap,
  };
}

// ─── Scenario panel ────────────────────────────────────────────────────────────

function ScenarioInputs({
  s,
  set,
}: {
  s: ScenarioState;
  set: (partial: Partial<ScenarioState>) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Global parameters */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Forudsætninger
        </h3>
        <Row label="Civilstatus">
          <div className="flex gap-2">
            {(["enlig", "par"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  const defaults = defaultState(v);
                  set({
                    civilStatus: v,
                    folkepension: defaults.folkepension,
                    pensionstillaeg: defaults.pensionstillaeg,
                    atp: defaults.atp,
                  });
                }}
                className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  s.civilStatus === v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {v === "enlig" ? "Enlig" : "Par"}
              </button>
            ))}
          </div>
        </Row>
        <Row label="År til pension">
          <NumberInput
            value={s.yearsToPension}
            onChange={(v) => set({ yearsToPension: Math.max(0, Math.round(v)) })}
            suffix="år"
          />
        </Row>
        <Row label="Udbetalingsperiode">
          <div className="relative">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8"
              value={s.payoutYears}
              onChange={(e) => set({ payoutYears: Number(e.target.value) })}
            >
              {[15, 20, 22, 25, 30].map((y) => (
                <option key={y} value={y}>
                  {y} år
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </Row>
        <Row label="Ønsket månedligt forbrug">
          <NumberInput
            value={s.desiredMonthly}
            onChange={(v) => set({ desiredMonthly: v })}
          />
        </Row>
      </div>

      {/* Pension */}
      <Panel title="Pension" color="#1e3a5f">
        <Row label="Nuværende pensionsformue">
          <NumberInput value={s.pensionWealth} onChange={(v) => set({ pensionWealth: v })} />
        </Row>
        <Row label="Månedlig indbetaling">
          <NumberInput value={s.pensionMonthly} onChange={(v) => set({ pensionMonthly: v })} />
        </Row>
        <Row label="Forventet afkast (brutto)">
          <PctInput value={s.pensionReturn} onChange={(v) => set({ pensionReturn: v })} />
        </Row>
        <Row label="PAL-skattesats">
          <PctInput value={s.palTax} onChange={(v) => set({ palTax: v })} />
        </Row>
        <Row label="Skattesats ved udbetaling">
          <PctInput value={s.pensionTax} onChange={(v) => set({ pensionTax: v })} />
        </Row>
      </Panel>

      {/* Frie midler */}
      <Panel title="Frie midler" color="#2d6a4f">
        <Row label="Nuværende frie midler">
          <NumberInput value={s.friWealth} onChange={(v) => set({ friWealth: v })} />
        </Row>
        <Row label="Månedlig opsparing">
          <NumberInput value={s.friMonthly} onChange={(v) => set({ friMonthly: v })} />
        </Row>
        <Row label="Forventet afkast (brutto)">
          <PctInput value={s.friReturn} onChange={(v) => set({ friReturn: v })} />
        </Row>
        <Row label="Beskatning af afkast">
          <PctInput value={s.friTax} onChange={(v) => set({ friTax: v })} />
        </Row>
      </Panel>

      {/* Friværdi */}
      <Panel title="Friværdi i bolig" color="#7d4e1a">
        <Row label="Beregningsmetode">
          <div className="flex gap-2">
            {(["beregn", "direkte"] as const).map((m) => (
              <button
                key={m}
                onClick={() => set({ frivaerdiMode: m })}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  s.frivaerdiMode === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {m === "beregn" ? "Beregn friværdi" : "Direkte input"}
              </button>
            ))}
          </div>
        </Row>
        {s.frivaerdiMode === "beregn" ? (
          <>
            <Row label="Nuværende boligværdi">
              <NumberInput value={s.boligVaerdi} onChange={(v) => set({ boligVaerdi: v })} />
            </Row>
            <Row label="Årlig værdistigning">
              <PctInput value={s.boligStigningPct} onChange={(v) => set({ boligStigningPct: v })} />
            </Row>
            <Row label="Nuværende restgæld">
              <NumberInput value={s.restgaeld} onChange={(v) => set({ restgaeld: v })} />
            </Row>
            <Row label="Årligt afdrag på gæld">
              <NumberInput value={s.aarligAfdrag} onChange={(v) => set({ aarligAfdrag: v })} />
            </Row>
          </>
        ) : (
          <Row label="Friværdi ved pension">
            <NumberInput value={s.frivaerdiDirekte} onChange={(v) => set({ frivaerdiDirekte: v })} />
          </Row>
        )}
        <Row label="Anvendt friværdi">
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={100}
              step={25}
              value={s.frivaerdiAnvendtPct}
              onChange={(e) => set({ frivaerdiAnvendtPct: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {[0, 25, 50, 75, 100].map((v) => (
                <span key={v} className={s.frivaerdiAnvendtPct === v ? "text-primary font-semibold" : ""}>
                  {v}%
                </span>
              ))}
            </div>
          </div>
        </Row>
      </Panel>

      {/* Selskabsmidler */}
      <Panel title="Selskabsmidler" color="#5b3d8f">
        <Row label="Nuværende selskabsformue">
          <NumberInput value={s.selskabWealth} onChange={(v) => set({ selskabWealth: v })} />
        </Row>
        <Row label="Månedlig opsparing i selskab">
          <NumberInput value={s.selskabMonthly} onChange={(v) => set({ selskabMonthly: v })} />
        </Row>
        <Row label="Forventet afkast (brutto)">
          <PctInput value={s.selskabReturn} onChange={(v) => set({ selskabReturn: v })} />
        </Row>
        <Row label="Selskabsskattesats på afkast">
          <PctInput value={s.selskabSkat} onChange={(v) => set({ selskabSkat: v })} />
        </Row>
        <Row label="Udbyttebeskatningssats">
          <PctInput value={s.udbytteSkat} onChange={(v) => set({ udbytteSkat: v })} />
        </Row>
      </Panel>

      {/* Offentlige ydelser */}
      <Panel title="Offentlige ydelser" color="#6b7280">
        <Row label="Folkepension grundbeløb">
          <NumberInput value={s.folkepension} onChange={(v) => set({ folkepension: v })} suffix="kr./md." />
        </Row>
        <Row label="Pensionstillæg">
          <NumberInput value={s.pensionstillaeg} onChange={(v) => set({ pensionstillaeg: v })} suffix="kr./md." />
        </Row>
        <Row label="ATP">
          <NumberInput value={s.atp} onChange={(v) => set({ atp: v })} suffix="kr./md." />
        </Row>
      </Panel>
    </div>
  );
}

// ─── Results display ───────────────────────────────────────────────────────────

interface Results {
  pensionFV: number;
  pensionNet: number;
  friFV: number;
  friNet: number;
  frivaerdiAtPension: number;
  frivaerdiMonthly: number;
  frivaerdiNegative: boolean;
  selFV: number;
  selNet: number;
  offentlig: number;
  totalMonthly: number;
  gap: number;
}

function ResultsPanel({ r, s, label }: { r: Results; s: ScenarioState; label?: string }) {
  const ENV_COLORS = {
    pension: "#1e3a5f",
    fri: "#2d6a4f",
    frivaerdi: "#7d4e1a",
    selskab: "#5b3d8f",
    offentlig: "#6b7280",
  };

  const chartData = [
    {
      name: label ?? "Kapacitet",
      Pension: Math.round(r.pensionNet),
      "Frie midler": Math.round(r.friNet),
      Friværdi: Math.round(r.frivaerdiMonthly),
      Selskabsmidler: Math.round(r.selNet),
      "Off. ydelser": Math.round(r.offentlig),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hook number */}
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground mb-1">Din samlede økonomiske kapacitet</p>
        <p className="text-4xl font-bold text-primary">{fmt(r.totalMonthly)} kr./md.</p>
        <p className="text-sm text-muted-foreground mt-1">efter skat i {s.payoutYears} år</p>

        {/* Gap analysis */}
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
          r.gap >= 0
            ? "bg-green-900/40 text-green-300"
            : "bg-red-900/40 text-red-300"
        }`}>
          {r.gap >= 0
            ? `+${fmt(r.gap)} kr./md. over dit mål`
            : `−${fmt(Math.abs(r.gap))} kr./md. under dit mål`}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Ønsket forbrug: {fmt(s.desiredMonthly)} kr./md.
        </p>
      </div>

      {/* Stacked bar chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Fordeling af månedlig kapacitet
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              formatter={(value: number, name: string) => [`${fmt(value)} kr./md.`, name]}
              contentStyle={{
                background: "oklch(0.15 0.04 240)",
                border: "1px solid oklch(0.25 0.04 240)",
                borderRadius: "8px",
                color: "white",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            <ReferenceLine
              x={s.desiredMonthly}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: "Mål", position: "right", fill: "#ef4444", fontSize: 11 }}
            />
            <Bar dataKey="Pension" stackId="a" fill={ENV_COLORS.pension} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Frie midler" stackId="a" fill={ENV_COLORS.fri} />
            <Bar dataKey="Friværdi" stackId="a" fill={ENV_COLORS.frivaerdi} />
            <Bar dataKey="Selskabsmidler" stackId="a" fill={ENV_COLORS.selskab} />
            <Bar dataKey="Off. ydelser" stackId="a" fill={ENV_COLORS.offentlig} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kilde
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Formue v. pension
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kr./md.
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Pension", color: ENV_COLORS.pension, fv: r.pensionFV, monthly: r.pensionNet, note: "efter skat" },
              { label: "Frie midler", color: ENV_COLORS.fri, fv: r.friFV, monthly: r.friNet, note: "skattefri" },
              { label: "Friværdi", color: ENV_COLORS.frivaerdi, fv: r.frivaerdiAtPension, monthly: r.frivaerdiMonthly, note: "skattefri" },
              { label: "Selskabsmidler", color: ENV_COLORS.selskab, fv: r.selFV, monthly: r.selNet, note: "efter udbytteskat" },
              { label: "Offentlige ydelser", color: ENV_COLORS.offentlig, fv: null, monthly: r.offentlig, note: "fast beløb" },
            ].map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-card" : "bg-accent/20"}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                    <span className="text-foreground">{row.label}</span>
                    <span className="text-xs text-muted-foreground">({row.note})</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                  {row.fv !== null ? `${fmt(row.fv)} kr.` : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-foreground">
                  {fmt(row.monthly)} kr.
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-primary/40 bg-primary/5">
              <td className="px-4 py-3 font-bold text-foreground">I alt</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right font-bold text-primary text-base">
                {fmt(r.totalMonthly)} kr.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {r.frivaerdiNegative && (
        <p className="text-xs text-amber-400 bg-amber-900/20 rounded-lg px-3 py-2">
          ⚠ Friværdi er negativ (gæld overstiger boligværdi) — friværdi er sat til 0.
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center italic">
        Estimat til brug i rådgivning. Faktisk resultat afhænger af markedsudvikling, lovgivning og individuelle forhold.
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CapacityCalculator() {
  const ctx = useCalculatorContext();

  // Build the current state from context values
  const current: ScenarioState = {
    yearsToPension: ctx.capYearsToPension,
    payoutYears: ctx.capPayoutYears,
    desiredMonthly: ctx.capDesiredMonthly,
    civilStatus: ctx.capCivilStatus,
    pensionWealth: ctx.capPensionWealth,
    pensionMonthly: ctx.capPensionMonthly,
    pensionReturn: ctx.capPensionReturn,
    palTax: ctx.capPalTax,
    pensionTax: ctx.capPensionTax,
    friWealth: ctx.capFriWealth,
    friMonthly: ctx.capFriMonthly,
    friReturn: ctx.capFriReturn,
    friTax: ctx.capFriTax,
    frivaerdiMode: ctx.capFrivaerdiMode,
    boligVaerdi: ctx.capBoligVaerdi,
    boligStigningPct: ctx.capBoligStigningPct,
    restgaeld: ctx.capRestgaeld,
    aarligAfdrag: ctx.capAarligAfdrag,
    frivaerdiDirekte: ctx.capFrivaerdiDirekte,
    frivaerdiAnvendtPct: ctx.capFrivaerdiAnvendtPct,
    selskabWealth: ctx.capSelskabWealth,
    selskabMonthly: ctx.capSelskabMonthly,
    selskabReturn: ctx.capSelskabReturn,
    selskabSkat: ctx.capSelskabSkat,
    udbytteSkat: ctx.capUdbytteSkat,
    folkepension: ctx.capFolkepension,
    pensionstillaeg: ctx.capPensionstillaeg,
    atp: ctx.capAtp,
  };

  const [scenarioA, setScenarioA] = useState<ScenarioState | null>(null);

  // Write each changed field back to context
  const set = (partial: Partial<ScenarioState>) => {
    if (partial.yearsToPension !== undefined) ctx.setCapYearsToPension(partial.yearsToPension);
    if (partial.payoutYears !== undefined) ctx.setCapPayoutYears(partial.payoutYears);
    if (partial.desiredMonthly !== undefined) ctx.setCapDesiredMonthly(partial.desiredMonthly);
    if (partial.civilStatus !== undefined) ctx.setCapCivilStatus(partial.civilStatus);
    if (partial.pensionWealth !== undefined) ctx.setCapPensionWealth(partial.pensionWealth);
    if (partial.pensionMonthly !== undefined) ctx.setCapPensionMonthly(partial.pensionMonthly);
    if (partial.pensionReturn !== undefined) ctx.setCapPensionReturn(partial.pensionReturn);
    if (partial.palTax !== undefined) ctx.setCapPalTax(partial.palTax);
    if (partial.pensionTax !== undefined) ctx.setCapPensionTax(partial.pensionTax);
    if (partial.friWealth !== undefined) ctx.setCapFriWealth(partial.friWealth);
    if (partial.friMonthly !== undefined) ctx.setCapFriMonthly(partial.friMonthly);
    if (partial.friReturn !== undefined) ctx.setCapFriReturn(partial.friReturn);
    if (partial.friTax !== undefined) ctx.setCapFriTax(partial.friTax);
    if (partial.frivaerdiMode !== undefined) ctx.setCapFrivaerdiMode(partial.frivaerdiMode);
    if (partial.boligVaerdi !== undefined) ctx.setCapBoligVaerdi(partial.boligVaerdi);
    if (partial.boligStigningPct !== undefined) ctx.setCapBoligStigningPct(partial.boligStigningPct);
    if (partial.restgaeld !== undefined) ctx.setCapRestgaeld(partial.restgaeld);
    if (partial.aarligAfdrag !== undefined) ctx.setCapAarligAfdrag(partial.aarligAfdrag);
    if (partial.frivaerdiDirekte !== undefined) ctx.setCapFrivaerdiDirekte(partial.frivaerdiDirekte);
    if (partial.frivaerdiAnvendtPct !== undefined) ctx.setCapFrivaerdiAnvendtPct(partial.frivaerdiAnvendtPct);
    if (partial.selskabWealth !== undefined) ctx.setCapSelskabWealth(partial.selskabWealth);
    if (partial.selskabMonthly !== undefined) ctx.setCapSelskabMonthly(partial.selskabMonthly);
    if (partial.selskabReturn !== undefined) ctx.setCapSelskabReturn(partial.selskabReturn);
    if (partial.selskabSkat !== undefined) ctx.setCapSelskabSkat(partial.selskabSkat);
    if (partial.udbytteSkat !== undefined) ctx.setCapUdbytteSkat(partial.udbytteSkat);
    if (partial.folkepension !== undefined) ctx.setCapFolkepension(partial.folkepension);
    if (partial.pensionstillaeg !== undefined) ctx.setCapPensionstillaeg(partial.pensionstillaeg);
    if (partial.atp !== undefined) ctx.setCapAtp(partial.atp);
  };

  const results = useMemo(() => calcResults(current), [current]);
  const resultsA = useMemo(() => (scenarioA ? calcResults(scenarioA) : null), [scenarioA]);

  const comparing = scenarioA !== null;

  return (
    <div className="w-full max-w-[1400px] space-y-6 px-2">
      <CalculatorIOBar />
      <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Din Økonomiske Kapacitet</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Samlet månedlig kapacitet efter skat fra alle fire miljøer
            </p>
          </div>
          <div className="flex gap-2">
            {!comparing ? (
              <button
                onClick={() => setScenarioA({ ...current })}
                className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <BookmarkCheck className="h-4 w-4" />
                Gem som Scenarie A
              </button>
            ) : (
              <button
                onClick={() => setScenarioA(null)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Nulstil sammenligning
              </button>
            )}
          </div>
        </div>

        {comparing ? (
          /* ── Scenario comparison layout ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario A (frozen) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
                  Scenarie A
                </span>
                <span className="text-xs text-muted-foreground">(gemt)</span>
              </div>
              <ResultsPanel r={resultsA!} s={scenarioA!} label="Scenarie A" />
            </div>

            {/* Scenario B (editable) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-foreground">
                  Scenarie B
                </span>
                <span className="text-xs text-muted-foreground">(redigér frit)</span>
              </div>
              <ScenarioInputs s={current} set={set} />
            </div>

            {/* Scenario B results + diff */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-foreground">
                  Scenarie B — Resultat
                </span>
              </div>
              <ResultsPanel r={results} s={current} label="Scenarie B" />

              {/* Difference card */}
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Forskel (B − A)</p>
                {(() => {
                  const diff = results.totalMonthly - resultsA!.totalMonthly;
                  return (
                    <p className={`text-2xl font-bold ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {diff >= 0 ? "+" : "−"}{fmt(Math.abs(diff))} kr./md.
                    </p>
                  );
                })()}
                <p className="text-xs text-muted-foreground mt-1">
                  Scenarie B giver{" "}
                  {results.totalMonthly >= resultsA!.totalMonthly ? "mere" : "mindre"} end Scenarie A
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Single scenario layout ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScenarioInputs s={current} set={set} />
            <ResultsPanel r={results} s={current} />
          </div>
        )}
    </div>
  );
}
