/**
 * CalculatorContext
 *
 * Persists all inputs for Afkastberegneren, Omkostningsberegneren, Målberegneren,
 * and Kapacitetsberegneren so that navigating between pages does not reset any values.
 */
import { createContext, useContext, useState } from "react";

type GoalMode = "lumpsum" | "payout";
type CivilStatus = "enlig" | "par";
type FrivaerdiMode = "beregn" | "direkte";

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

  // ── Afkastberegner panel collapse state ─────────────────────────────────────
  calcParamsOpen: boolean;
  calcProductsOpen: boolean;
  calcPensionOpen: boolean;
  setCalcParamsOpen: (v: boolean) => void;
  setCalcProductsOpen: (v: boolean) => void;
  setCalcPensionOpen: (v: boolean) => void;

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

  // ── Afkastforskelberegner ───────────────────────────────────────────────────
  returnDiffDepot: number;
  returnDiffAnnualContribution: number;
  returnDiffYearsToPension: number;
  returnDiffTodayRaw: string;
  returnDiffNewRaw: string;

  setReturnDiffDepot: (v: number) => void;
  setReturnDiffAnnualContribution: (v: number) => void;
  setReturnDiffYearsToPension: (v: number) => void;
  setReturnDiffTodayRaw: (v: string) => void;
  setReturnDiffNewRaw: (v: string) => void;

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

  // ── Kapacitetsberegner ──────────────────────────────────────────────────────
  capYearsToPension: number;
  capPayoutYears: number;
  capDesiredMonthly: number;
  capCivilStatus: CivilStatus;
  capPensionWealth: number;
  capPensionMonthly: number;
  capPensionReturn: number;
  capPalTax: number;
  capPensionTax: number;
  capFriWealth: number;
  capFriMonthly: number;
  capFriReturn: number;
  capFriTax: number;
  capFrivaerdiMode: FrivaerdiMode;
  capBoligVaerdi: number;
  capBoligStigningPct: number;
  capRestgaeld: number;
  capAarligAfdrag: number;
  capFrivaerdiDirekte: number;
  capFrivaerdiAnvendtPct: number;
  capSelskabWealth: number;
  capSelskabMonthly: number;
  capSelskabReturn: number;
  capSelskabSkat: number;
  capUdbytteSkat: number;
  capFolkepension: number;
  capPensionstillaeg: number;
  capAtp: number;

  setCapYearsToPension: (v: number) => void;
  setCapPayoutYears: (v: number) => void;
  setCapDesiredMonthly: (v: number) => void;
  setCapCivilStatus: (v: CivilStatus) => void;
  setCapPensionWealth: (v: number) => void;
  setCapPensionMonthly: (v: number) => void;
  setCapPensionReturn: (v: number) => void;
  setCapPalTax: (v: number) => void;
  setCapPensionTax: (v: number) => void;
  setCapFriWealth: (v: number) => void;
  setCapFriMonthly: (v: number) => void;
  setCapFriReturn: (v: number) => void;
  setCapFriTax: (v: number) => void;
  setCapFrivaerdiMode: (v: FrivaerdiMode) => void;
  setCapBoligVaerdi: (v: number) => void;
  setCapBoligStigningPct: (v: number) => void;
  setCapRestgaeld: (v: number) => void;
  setCapAarligAfdrag: (v: number) => void;
  setCapFrivaerdiDirekte: (v: number) => void;
  setCapFrivaerdiAnvendtPct: (v: number) => void;
  setCapSelskabWealth: (v: number) => void;
  setCapSelskabMonthly: (v: number) => void;
  setCapSelskabReturn: (v: number) => void;
  setCapSelskabSkat: (v: number) => void;
  setCapUdbytteSkat: (v: number) => void;
  setCapFolkepension: (v: number) => void;
  setCapPensionstillaeg: (v: number) => void;
  setCapAtp: (v: number) => void;
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
  // Afkastberegner panel collapse
  calcParamsOpen: true,
  calcProductsOpen: true,
  calcPensionOpen: true,
  // Omkostningsberegner
  costDepot: 2_000_000,
  costAnnualContribution: 100_000,
  costYearsToPension: 5,
  costTodayRaw: "1,5",
  costNewRaw: "0,75",
  // Afkastforskelberegner
  returnDiffDepot: 2_000_000,
  returnDiffAnnualContribution: 100_000,
  returnDiffYearsToPension: 10,
  returnDiffTodayRaw: "5",
  returnDiffNewRaw: "7",
  // Målberegner
  goalMode: "lumpsum" as GoalMode,
  goalDepot: 500_000,
  goalYears: 20,
  goalReturnRaw: "6,5",
  goalTargetAmount: 3_000_000,
  goalAnnualPayout: 200_000,
  goalPayoutYears: 20,
  // Kapacitetsberegner
  capYearsToPension: 10,
  capPayoutYears: 20,
  capDesiredMonthly: 30_000,
  capCivilStatus: "enlig" as CivilStatus,
  capPensionWealth: 0,
  capPensionMonthly: 0,
  capPensionReturn: 6.0,
  capPalTax: 15.3,
  capPensionTax: 38,
  capFriWealth: 0,
  capFriMonthly: 0,
  capFriReturn: 6.0,
  capFriTax: 27,
  capFrivaerdiMode: "beregn" as FrivaerdiMode,
  capBoligVaerdi: 0,
  capBoligStigningPct: 2.0,
  capRestgaeld: 0,
  capAarligAfdrag: 0,
  capFrivaerdiDirekte: 0,
  capFrivaerdiAnvendtPct: 50,
  capSelskabWealth: 0,
  capSelskabMonthly: 0,
  capSelskabReturn: 6.0,
  capSelskabSkat: 22,
  capUdbytteSkat: 27,
  capFolkepension: 7100,
  capPensionstillaeg: 4300,
  capAtp: 2500,
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
  setCalcParamsOpen: () => {},
  setCalcProductsOpen: () => {},
  setCalcPensionOpen: () => {},
  setCostDepot: () => {},
  setCostAnnualContribution: () => {},
  setCostYearsToPension: () => {},
  setCostTodayRaw: () => {},
  setCostNewRaw: () => {},
  setReturnDiffDepot: () => {},
  setReturnDiffAnnualContribution: () => {},
  setReturnDiffYearsToPension: () => {},
  setReturnDiffTodayRaw: () => {},
  setReturnDiffNewRaw: () => {},
  setGoalMode: () => {},
  setGoalDepot: () => {},
  setGoalYears: () => {},
  setGoalReturnRaw: () => {},
  setGoalTargetAmount: () => {},
  setGoalAnnualPayout: () => {},
  setGoalPayoutYears: () => {},
  setCapYearsToPension: () => {},
  setCapPayoutYears: () => {},
  setCapDesiredMonthly: () => {},
  setCapCivilStatus: () => {},
  setCapPensionWealth: () => {},
  setCapPensionMonthly: () => {},
  setCapPensionReturn: () => {},
  setCapPalTax: () => {},
  setCapPensionTax: () => {},
  setCapFriWealth: () => {},
  setCapFriMonthly: () => {},
  setCapFriReturn: () => {},
  setCapFriTax: () => {},
  setCapFrivaerdiMode: () => {},
  setCapBoligVaerdi: () => {},
  setCapBoligStigningPct: () => {},
  setCapRestgaeld: () => {},
  setCapAarligAfdrag: () => {},
  setCapFrivaerdiDirekte: () => {},
  setCapFrivaerdiAnvendtPct: () => {},
  setCapSelskabWealth: () => {},
  setCapSelskabMonthly: () => {},
  setCapSelskabReturn: () => {},
  setCapSelskabSkat: () => {},
  setCapUdbytteSkat: () => {},
  setCapFolkepension: () => {},
  setCapPensionstillaeg: () => {},
  setCapAtp: () => {},
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

  // Afkastberegner panel collapse
  const [calcParamsOpen, setCalcParamsOpen] = useState(true);
  const [calcProductsOpen, setCalcProductsOpen] = useState(true);
  const [calcPensionOpen, setCalcPensionOpen] = useState(true);

  // Omkostningsberegner
  const [costDepot, setCostDepot] = useState(DEFAULTS.costDepot);
  const [costAnnualContribution, setCostAnnualContribution] = useState(DEFAULTS.costAnnualContribution);
  const [costYearsToPension, setCostYearsToPension] = useState(DEFAULTS.costYearsToPension);
  const [costTodayRaw, setCostTodayRaw] = useState(DEFAULTS.costTodayRaw);
  const [costNewRaw, setCostNewRaw] = useState(DEFAULTS.costNewRaw);
  const [returnDiffDepot, setReturnDiffDepot] = useState(DEFAULTS.returnDiffDepot);
  const [returnDiffAnnualContribution, setReturnDiffAnnualContribution] = useState(DEFAULTS.returnDiffAnnualContribution);
  const [returnDiffYearsToPension, setReturnDiffYearsToPension] = useState(DEFAULTS.returnDiffYearsToPension);
  const [returnDiffTodayRaw, setReturnDiffTodayRaw] = useState(DEFAULTS.returnDiffTodayRaw);
  const [returnDiffNewRaw, setReturnDiffNewRaw] = useState(DEFAULTS.returnDiffNewRaw);


  // Målberegner
  const [goalMode, setGoalMode] = useState<GoalMode>(DEFAULTS.goalMode);
  const [goalDepot, setGoalDepot] = useState(DEFAULTS.goalDepot);
  const [goalYears, setGoalYears] = useState(DEFAULTS.goalYears);
  const [goalReturnRaw, setGoalReturnRaw] = useState(DEFAULTS.goalReturnRaw);
  const [goalTargetAmount, setGoalTargetAmount] = useState(DEFAULTS.goalTargetAmount);
  const [goalAnnualPayout, setGoalAnnualPayout] = useState(DEFAULTS.goalAnnualPayout);
  const [goalPayoutYears, setGoalPayoutYears] = useState(DEFAULTS.goalPayoutYears);

  // Kapacitetsberegner
  const [capYearsToPension, setCapYearsToPension] = useState(DEFAULTS.capYearsToPension);
  const [capPayoutYears, setCapPayoutYears] = useState(DEFAULTS.capPayoutYears);
  const [capDesiredMonthly, setCapDesiredMonthly] = useState(DEFAULTS.capDesiredMonthly);
  const [capCivilStatus, setCapCivilStatus] = useState<CivilStatus>(DEFAULTS.capCivilStatus);
  const [capPensionWealth, setCapPensionWealth] = useState(DEFAULTS.capPensionWealth);
  const [capPensionMonthly, setCapPensionMonthly] = useState(DEFAULTS.capPensionMonthly);
  const [capPensionReturn, setCapPensionReturn] = useState(DEFAULTS.capPensionReturn);
  const [capPalTax, setCapPalTax] = useState(DEFAULTS.capPalTax);
  const [capPensionTax, setCapPensionTax] = useState(DEFAULTS.capPensionTax);
  const [capFriWealth, setCapFriWealth] = useState(DEFAULTS.capFriWealth);
  const [capFriMonthly, setCapFriMonthly] = useState(DEFAULTS.capFriMonthly);
  const [capFriReturn, setCapFriReturn] = useState(DEFAULTS.capFriReturn);
  const [capFriTax, setCapFriTax] = useState(DEFAULTS.capFriTax);
  const [capFrivaerdiMode, setCapFrivaerdiMode] = useState<FrivaerdiMode>(DEFAULTS.capFrivaerdiMode);
  const [capBoligVaerdi, setCapBoligVaerdi] = useState(DEFAULTS.capBoligVaerdi);
  const [capBoligStigningPct, setCapBoligStigningPct] = useState(DEFAULTS.capBoligStigningPct);
  const [capRestgaeld, setCapRestgaeld] = useState(DEFAULTS.capRestgaeld);
  const [capAarligAfdrag, setCapAarligAfdrag] = useState(DEFAULTS.capAarligAfdrag);
  const [capFrivaerdiDirekte, setCapFrivaerdiDirekte] = useState(DEFAULTS.capFrivaerdiDirekte);
  const [capFrivaerdiAnvendtPct, setCapFrivaerdiAnvendtPct] = useState(DEFAULTS.capFrivaerdiAnvendtPct);
  const [capSelskabWealth, setCapSelskabWealth] = useState(DEFAULTS.capSelskabWealth);
  const [capSelskabMonthly, setCapSelskabMonthly] = useState(DEFAULTS.capSelskabMonthly);
  const [capSelskabReturn, setCapSelskabReturn] = useState(DEFAULTS.capSelskabReturn);
  const [capSelskabSkat, setCapSelskabSkat] = useState(DEFAULTS.capSelskabSkat);
  const [capUdbytteSkat, setCapUdbytteSkat] = useState(DEFAULTS.capUdbytteSkat);
  const [capFolkepension, setCapFolkepension] = useState(DEFAULTS.capFolkepension);
  const [capPensionstillaeg, setCapPensionstillaeg] = useState(DEFAULTS.capPensionstillaeg);
  const [capAtp, setCapAtp] = useState(DEFAULTS.capAtp);

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
        calcParamsOpen, setCalcParamsOpen,
        calcProductsOpen, setCalcProductsOpen,
        calcPensionOpen, setCalcPensionOpen,
        costDepot, setCostDepot,
        costAnnualContribution, setCostAnnualContribution,
        costYearsToPension, setCostYearsToPension,
        costTodayRaw, setCostTodayRaw,
        costNewRaw, setCostNewRaw,
        returnDiffDepot, setReturnDiffDepot,
        returnDiffAnnualContribution, setReturnDiffAnnualContribution,
        returnDiffYearsToPension, setReturnDiffYearsToPension,
        returnDiffTodayRaw, setReturnDiffTodayRaw,
        returnDiffNewRaw, setReturnDiffNewRaw,
        goalMode, setGoalMode,
        goalDepot, setGoalDepot,
        goalYears, setGoalYears,
        goalReturnRaw, setGoalReturnRaw,
        goalTargetAmount, setGoalTargetAmount,
        goalAnnualPayout, setGoalAnnualPayout,
        goalPayoutYears, setGoalPayoutYears,
        capYearsToPension, setCapYearsToPension,
        capPayoutYears, setCapPayoutYears,
        capDesiredMonthly, setCapDesiredMonthly,
        capCivilStatus, setCapCivilStatus,
        capPensionWealth, setCapPensionWealth,
        capPensionMonthly, setCapPensionMonthly,
        capPensionReturn, setCapPensionReturn,
        capPalTax, setCapPalTax,
        capPensionTax, setCapPensionTax,
        capFriWealth, setCapFriWealth,
        capFriMonthly, setCapFriMonthly,
        capFriReturn, setCapFriReturn,
        capFriTax, setCapFriTax,
        capFrivaerdiMode, setCapFrivaerdiMode,
        capBoligVaerdi, setCapBoligVaerdi,
        capBoligStigningPct, setCapBoligStigningPct,
        capRestgaeld, setCapRestgaeld,
        capAarligAfdrag, setCapAarligAfdrag,
        capFrivaerdiDirekte, setCapFrivaerdiDirekte,
        capFrivaerdiAnvendtPct, setCapFrivaerdiAnvendtPct,
        capSelskabWealth, setCapSelskabWealth,
        capSelskabMonthly, setCapSelskabMonthly,
        capSelskabReturn, setCapSelskabReturn,
        capSelskabSkat, setCapSelskabSkat,
        capUdbytteSkat, setCapUdbytteSkat,
        capFolkepension, setCapFolkepension,
        capPensionstillaeg, setCapPensionstillaeg,
        capAtp, setCapAtp,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext() {
  return useContext(CalculatorContext);
}
