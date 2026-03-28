/**
 * CalculatorContext
 *
 * Persists all inputs for both Afkastberegneren and Omkostningsberegneren
 * so that navigating between pages does not reset any values.
 *
 * Both pages read their initial state from this context and write back
 * on every change, so the values survive unmount/remount.
 */
import { createContext, useContext, useState } from "react";

// ─── Shared state shape ───────────────────────────────────────────────────────

interface CalculatorSharedState {
  // ── Afkastberegner ──────────────────────────────────────────────────────────
  depot: number;
  annualContribution: number;
  horizonYears: number;
  selectedProductIds: number[];
  pensionYearsRaw: string;
  pensionReturnOverride: string;
  tableYearFrom: number;
  tableYearTo: number;

  setDepot: (v: number) => void;
  setAnnualContribution: (v: number) => void;
  setHorizonYears: (v: number) => void;
  setSelectedProductIds: (v: number[]) => void;
  setPensionYearsRaw: (v: string) => void;
  setPensionReturnOverride: (v: string) => void;
  setTableYearFrom: (v: number) => void;
  setTableYearTo: (v: number) => void;

  // ── Omkostningsberegner ─────────────────────────────────────────────────────
  costDepot: number;
  costAnnualContribution: number;
  costYearsToPension: number;
  costTodayRaw: string;
  costNewRaw: string;

  setCostDepot: (v: number) => void;
  setCostAnnualContribution: (v: number) => void;
  setCostYearsToPension: (v: number) => void;
  setCostTodayRaw: (v: string) => void;
  setCostNewRaw: (v: string) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  depot: 2_000_000,
  annualContribution: 100_000,
  horizonYears: 5,
  selectedProductIds: [] as number[],
  pensionYearsRaw: "",
  pensionReturnOverride: "",
  tableYearFrom: 2010,
  tableYearTo: new Date().getFullYear() - 1,
  costDepot: 2_000_000,
  costAnnualContribution: 100_000,
  costYearsToPension: 5,
  costTodayRaw: "1,5",
  costNewRaw: "0,75",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CalculatorContext = createContext<CalculatorSharedState>({
  ...DEFAULTS,
  setDepot: () => {},
  setAnnualContribution: () => {},
  setHorizonYears: () => {},
  setSelectedProductIds: () => {},
  setPensionYearsRaw: () => {},
  setPensionReturnOverride: () => {},
  setTableYearFrom: () => {},
  setTableYearTo: () => {},
  setCostDepot: () => {},
  setCostAnnualContribution: () => {},
  setCostYearsToPension: () => {},
  setCostTodayRaw: () => {},
  setCostNewRaw: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  // Afkastberegner
  const [depot, setDepot] = useState(DEFAULTS.depot);
  const [annualContribution, setAnnualContribution] = useState(DEFAULTS.annualContribution);
  const [horizonYears, setHorizonYears] = useState(DEFAULTS.horizonYears);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(DEFAULTS.selectedProductIds);
  const [pensionYearsRaw, setPensionYearsRaw] = useState(DEFAULTS.pensionYearsRaw);
  const [pensionReturnOverride, setPensionReturnOverride] = useState(DEFAULTS.pensionReturnOverride);
  const [tableYearFrom, setTableYearFrom] = useState(DEFAULTS.tableYearFrom);
  const [tableYearTo, setTableYearTo] = useState(DEFAULTS.tableYearTo);

  // Omkostningsberegner
  const [costDepot, setCostDepot] = useState(DEFAULTS.costDepot);
  const [costAnnualContribution, setCostAnnualContribution] = useState(DEFAULTS.costAnnualContribution);
  const [costYearsToPension, setCostYearsToPension] = useState(DEFAULTS.costYearsToPension);
  const [costTodayRaw, setCostTodayRaw] = useState(DEFAULTS.costTodayRaw);
  const [costNewRaw, setCostNewRaw] = useState(DEFAULTS.costNewRaw);

  return (
    <CalculatorContext.Provider
      value={{
        depot, setDepot,
        annualContribution, setAnnualContribution,
        horizonYears, setHorizonYears,
        selectedProductIds, setSelectedProductIds,
        pensionYearsRaw, setPensionYearsRaw,
        pensionReturnOverride, setPensionReturnOverride,
        tableYearFrom, setTableYearFrom,
        tableYearTo, setTableYearTo,
        costDepot, setCostDepot,
        costAnnualContribution, setCostAnnualContribution,
        costYearsToPension, setCostYearsToPension,
        costTodayRaw, setCostTodayRaw,
        costNewRaw, setCostNewRaw,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext() {
  return useContext(CalculatorContext);
}
