/**
 * CalculatorContext
 *
 * Persists all inputs for Afkastberegneren, Omkostningsberegneren, and Målberegneren
 * so that navigating between pages does not reset any values.
 */
import { createContext, useContext, useState } from "react";

type GoalMode = "lumpsum" | "payout";

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

  // ── Målberegner ─────────────────────────────────────────────────────────────
  goalMode: GoalMode;
  goalDepot: number;
  goalYears: number;
  goalReturnRaw: string;
  goalTargetAmount: number;
  goalAnnualPayout: number;
  goalPayoutYears: number;

  setGoalMode: (v: GoalMode) => void;
  setGoalDepot: (v: number) => void;
  setGoalYears: (v: number) => void;
  setGoalReturnRaw: (v: string) => void;
  setGoalTargetAmount: (v: number) => void;
  setGoalAnnualPayout: (v: number) => void;
  setGoalPayoutYears: (v: number) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  // Afkastberegner
  depot: 2_000_000,
  annualContribution: 100_000,
  horizonYears: 5,
  selectedProductIds: [] as number[],
  pensionYearsRaw: "",
  pensionReturnOverride: "",
  tableYearFrom: 2010,
  tableYearTo: new Date().getFullYear() - 1,
  // Omkostningsberegner
  costDepot: 2_000_000,
  costAnnualContribution: 100_000,
  costYearsToPension: 5,
  costTodayRaw: "1,5",
  costNewRaw: "0,75",
  // Målberegner
  goalMode: "lumpsum" as GoalMode,
  goalDepot: 500_000,
  goalYears: 20,
  goalReturnRaw: "6,5",
  goalTargetAmount: 3_000_000,
  goalAnnualPayout: 200_000,
  goalPayoutYears: 20,
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
  setGoalMode: () => {},
  setGoalDepot: () => {},
  setGoalYears: () => {},
  setGoalReturnRaw: () => {},
  setGoalTargetAmount: () => {},
  setGoalAnnualPayout: () => {},
  setGoalPayoutYears: () => {},
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

  // Målberegner
  const [goalMode, setGoalMode] = useState<GoalMode>(DEFAULTS.goalMode);
  const [goalDepot, setGoalDepot] = useState(DEFAULTS.goalDepot);
  const [goalYears, setGoalYears] = useState(DEFAULTS.goalYears);
  const [goalReturnRaw, setGoalReturnRaw] = useState(DEFAULTS.goalReturnRaw);
  const [goalTargetAmount, setGoalTargetAmount] = useState(DEFAULTS.goalTargetAmount);
  const [goalAnnualPayout, setGoalAnnualPayout] = useState(DEFAULTS.goalAnnualPayout);
  const [goalPayoutYears, setGoalPayoutYears] = useState(DEFAULTS.goalPayoutYears);

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
        goalMode, setGoalMode,
        goalDepot, setGoalDepot,
        goalYears, setGoalYears,
        goalReturnRaw, setGoalReturnRaw,
        goalTargetAmount, setGoalTargetAmount,
        goalAnnualPayout, setGoalAnnualPayout,
        goalPayoutYears, setGoalPayoutYears,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext() {
  return useContext(CalculatorContext);
}
