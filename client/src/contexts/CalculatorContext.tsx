/**
 * CalculatorContext
 *
 * Persists all inputs for Afkastberegneren, Omkostningsberegneren, Målberegneren,
 * Kapacitetsberegneren, and Gennemsnitsrenteberegneren so that navigating between
 * pages does not reset any values.
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
  calcAnonymize: boolean;
  setCalcAnonymize: (v: boolean) => void;

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

  // ── Gennemsnitsrenteberegner ────────────────────────────────────────────────
  avgRetCurrentAge: number;
  avgRetPensionAge: number;
  avgRet0Depot: number; avgRet0Overf: number; avgRet0Indbetaling: number; avgRet0RentePct: number; avgRet0Udbetalingsaar: number; avgRet0Garanteret: number;
  avgRet1Depot: number; avgRet1Overf: number; avgRet1Indbetaling: number; avgRet1RentePct: number; avgRet1Udbetalingsaar: number; avgRet1Garanteret: number;
  avgRet2Depot: number; avgRet2Overf: number; avgRet2Indbetaling: number; avgRet2RentePct: number; avgRet2Udbetalingsaar: number; avgRet2Garanteret: number;
  avgRet3Depot: number; avgRet3Overf: number; avgRet3Indbetaling: number; avgRet3RentePct: number; avgRet3Udbetalingsaar: number; avgRet3Garanteret: number;

  setAvgRetCurrentAge: (v: number) => void;
  setAvgRetPensionAge: (v: number) => void;
  setAvgRet0Depot: (v: number) => void; setAvgRet0Overf: (v: number) => void; setAvgRet0Indbetaling: (v: number) => void; setAvgRet0RentePct: (v: number) => void; setAvgRet0Udbetalingsaar: (v: number) => void; setAvgRet0Garanteret: (v: number) => void;
  setAvgRet1Depot: (v: number) => void; setAvgRet1Overf: (v: number) => void; setAvgRet1Indbetaling: (v: number) => void; setAvgRet1RentePct: (v: number) => void; setAvgRet1Udbetalingsaar: (v: number) => void; setAvgRet1Garanteret: (v: number) => void;
  setAvgRet2Depot: (v: number) => void; setAvgRet2Overf: (v: number) => void; setAvgRet2Indbetaling: (v: number) => void; setAvgRet2RentePct: (v: number) => void; setAvgRet2Udbetalingsaar: (v: number) => void; setAvgRet2Garanteret: (v: number) => void;
  setAvgRet3Depot: (v: number) => void; setAvgRet3Overf: (v: number) => void; setAvgRet3Indbetaling: (v: number) => void; setAvgRet3RentePct: (v: number) => void; setAvgRet3Udbetalingsaar: (v: number) => void; setAvgRet3Garanteret: (v: number) => void;

  // ── Forsikringsprisberegner ─────────────────────────────────────────────────
  insSalaryRaw: string;
  insContributionRaw: string;
  insCoveragePctRaw: string;
  insLivsPctRaw: string;
  insKritiskRaw: string;
  insIncludeSundhed: boolean;
  insAnonymize: boolean;
  insVisibleIds: number[] | null; // null = all

  setInsSalaryRaw: (v: string) => void;
  setInsContributionRaw: (v: string) => void;
  setInsCoveragePctRaw: (v: string) => void;
  setInsLivsPctRaw: (v: string) => void;
  setInsKritiskRaw: (v: string) => void;
  setInsIncludeSundhed: (v: boolean) => void;
  setInsAnonymize: (v: boolean) => void;
  setInsVisibleIds: (v: number[] | null) => void;
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
  calcAnonymize: false,
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
  capFolkepension: 7260,
  capPensionstillaeg: 0,
  capAtp: 1000,
  // Gennemsnitsrenteberegner
  avgRetCurrentAge: 61,
  avgRetPensionAge: 67,
  avgRet0Depot: 0, avgRet0Overf: 0, avgRet0Indbetaling: 0, avgRet0RentePct: 3, avgRet0Udbetalingsaar: 1,  avgRet0Garanteret: 0,
  avgRet1Depot: 0, avgRet1Overf: 0, avgRet1Indbetaling: 0, avgRet1RentePct: 3, avgRet1Udbetalingsaar: 1,  avgRet1Garanteret: 0,
  avgRet2Depot: 0, avgRet2Overf: 0, avgRet2Indbetaling: 0, avgRet2RentePct: 3, avgRet2Udbetalingsaar: 10, avgRet2Garanteret: 0,
  avgRet3Depot: 0, avgRet3Overf: 0, avgRet3Indbetaling: 0, avgRet3RentePct: 3, avgRet3Udbetalingsaar: 22, avgRet3Garanteret: 0,
  // Forsikringsprisberegner
  insSalaryRaw: "660.000",
  insContributionRaw: "60.000",
  insCoveragePctRaw: "",
  insLivsPctRaw: "100",
  insKritiskRaw: "100.000",
  insIncludeSundhed: true,
  insAnonymize: false,
  insVisibleIds: null as number[] | null,
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
  calcAnonymize: false,
  setCalcAnonymize: () => {},
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
  setAvgRetCurrentAge: () => {},
  setAvgRetPensionAge: () => {},
  setAvgRet0Depot: () => {}, setAvgRet0Overf: () => {}, setAvgRet0Indbetaling: () => {}, setAvgRet0RentePct: () => {}, setAvgRet0Udbetalingsaar: () => {}, setAvgRet0Garanteret: () => {},
  setAvgRet1Depot: () => {}, setAvgRet1Overf: () => {}, setAvgRet1Indbetaling: () => {}, setAvgRet1RentePct: () => {}, setAvgRet1Udbetalingsaar: () => {}, setAvgRet1Garanteret: () => {},
  setAvgRet2Depot: () => {}, setAvgRet2Overf: () => {}, setAvgRet2Indbetaling: () => {}, setAvgRet2RentePct: () => {}, setAvgRet2Udbetalingsaar: () => {}, setAvgRet2Garanteret: () => {},
  setAvgRet3Depot: () => {}, setAvgRet3Overf: () => {}, setAvgRet3Indbetaling: () => {}, setAvgRet3RentePct: () => {}, setAvgRet3Udbetalingsaar: () => {}, setAvgRet3Garanteret: () => {},
  setInsSalaryRaw: () => {}, setInsContributionRaw: () => {}, setInsCoveragePctRaw: () => {}, setInsLivsPctRaw: () => {}, setInsKritiskRaw: () => {}, setInsIncludeSundhed: () => {}, setInsAnonymize: () => {}, setInsVisibleIds: () => {},
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
  const [calcAnonymize, setCalcAnonymize] = useState(false);

  // Omkostningsberegner
  const [costDepot, setCostDepot] = useState(DEFAULTS.costDepot);
  const [costAnnualContribution, setCostAnnualContribution] = useState(DEFAULTS.costAnnualContribution);
  const [costYearsToPension, setCostYearsToPension] = useState(DEFAULTS.costYearsToPension);
  const [costTodayRaw, setCostTodayRaw] = useState(DEFAULTS.costTodayRaw);
  const [costNewRaw, setCostNewRaw] = useState(DEFAULTS.costNewRaw);

  // Afkastforskelberegner
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

  // Gennemsnitsrenteberegner
  const [avgRetCurrentAge, setAvgRetCurrentAge] = useState(DEFAULTS.avgRetCurrentAge);
  const [avgRetPensionAge, setAvgRetPensionAge] = useState(DEFAULTS.avgRetPensionAge);
  const [avgRet0Depot, setAvgRet0Depot] = useState(DEFAULTS.avgRet0Depot);
  const [avgRet0Overf, setAvgRet0Overf] = useState(DEFAULTS.avgRet0Overf);
  const [avgRet0Indbetaling, setAvgRet0Indbetaling] = useState(DEFAULTS.avgRet0Indbetaling);
  const [avgRet0RentePct, setAvgRet0RentePct] = useState(DEFAULTS.avgRet0RentePct);
  const [avgRet0Udbetalingsaar, setAvgRet0Udbetalingsaar] = useState(DEFAULTS.avgRet0Udbetalingsaar);
  const [avgRet0Garanteret, setAvgRet0Garanteret] = useState(DEFAULTS.avgRet0Garanteret);
  const [avgRet1Depot, setAvgRet1Depot] = useState(DEFAULTS.avgRet1Depot);
  const [avgRet1Overf, setAvgRet1Overf] = useState(DEFAULTS.avgRet1Overf);
  const [avgRet1Indbetaling, setAvgRet1Indbetaling] = useState(DEFAULTS.avgRet1Indbetaling);
  const [avgRet1RentePct, setAvgRet1RentePct] = useState(DEFAULTS.avgRet1RentePct);
  const [avgRet1Udbetalingsaar, setAvgRet1Udbetalingsaar] = useState(DEFAULTS.avgRet1Udbetalingsaar);
  const [avgRet1Garanteret, setAvgRet1Garanteret] = useState(DEFAULTS.avgRet1Garanteret);
  const [avgRet2Depot, setAvgRet2Depot] = useState(DEFAULTS.avgRet2Depot);
  const [avgRet2Overf, setAvgRet2Overf] = useState(DEFAULTS.avgRet2Overf);
  const [avgRet2Indbetaling, setAvgRet2Indbetaling] = useState(DEFAULTS.avgRet2Indbetaling);
  const [avgRet2RentePct, setAvgRet2RentePct] = useState(DEFAULTS.avgRet2RentePct);
  const [avgRet2Udbetalingsaar, setAvgRet2Udbetalingsaar] = useState(DEFAULTS.avgRet2Udbetalingsaar);
  const [avgRet2Garanteret, setAvgRet2Garanteret] = useState(DEFAULTS.avgRet2Garanteret);
  const [avgRet3Depot, setAvgRet3Depot] = useState(DEFAULTS.avgRet3Depot);
  const [avgRet3Overf, setAvgRet3Overf] = useState(DEFAULTS.avgRet3Overf);
  const [avgRet3Indbetaling, setAvgRet3Indbetaling] = useState(DEFAULTS.avgRet3Indbetaling);
  const [avgRet3RentePct, setAvgRet3RentePct] = useState(DEFAULTS.avgRet3RentePct);
  const [avgRet3Udbetalingsaar, setAvgRet3Udbetalingsaar] = useState(DEFAULTS.avgRet3Udbetalingsaar);
  const [avgRet3Garanteret, setAvgRet3Garanteret] = useState(DEFAULTS.avgRet3Garanteret);

  // Forsikringsprisberegner
  const [insSalaryRaw, setInsSalaryRaw] = useState(DEFAULTS.insSalaryRaw);
  const [insContributionRaw, setInsContributionRaw] = useState(DEFAULTS.insContributionRaw);
  const [insCoveragePctRaw, setInsCoveragePctRaw] = useState(DEFAULTS.insCoveragePctRaw);
  const [insLivsPctRaw, setInsLivsPctRaw] = useState(DEFAULTS.insLivsPctRaw);
  const [insKritiskRaw, setInsKritiskRaw] = useState(DEFAULTS.insKritiskRaw);
  const [insIncludeSundhed, setInsIncludeSundhed] = useState(DEFAULTS.insIncludeSundhed);
  const [insAnonymize, setInsAnonymize] = useState(DEFAULTS.insAnonymize);
  const [insVisibleIds, setInsVisibleIds] = useState<number[] | null>(DEFAULTS.insVisibleIds);

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
        calcAnonymize, setCalcAnonymize,
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
        avgRetCurrentAge, setAvgRetCurrentAge,
        avgRetPensionAge, setAvgRetPensionAge,
        avgRet0Depot, setAvgRet0Depot, avgRet0Overf, setAvgRet0Overf, avgRet0Indbetaling, setAvgRet0Indbetaling, avgRet0RentePct, setAvgRet0RentePct, avgRet0Udbetalingsaar, setAvgRet0Udbetalingsaar, avgRet0Garanteret, setAvgRet0Garanteret,
        avgRet1Depot, setAvgRet1Depot, avgRet1Overf, setAvgRet1Overf, avgRet1Indbetaling, setAvgRet1Indbetaling, avgRet1RentePct, setAvgRet1RentePct, avgRet1Udbetalingsaar, setAvgRet1Udbetalingsaar, avgRet1Garanteret, setAvgRet1Garanteret,
        avgRet2Depot, setAvgRet2Depot, avgRet2Overf, setAvgRet2Overf, avgRet2Indbetaling, setAvgRet2Indbetaling, avgRet2RentePct, setAvgRet2RentePct, avgRet2Udbetalingsaar, setAvgRet2Udbetalingsaar, avgRet2Garanteret, setAvgRet2Garanteret,
        avgRet3Depot, setAvgRet3Depot, avgRet3Overf, setAvgRet3Overf, avgRet3Indbetaling, setAvgRet3Indbetaling, avgRet3RentePct, setAvgRet3RentePct, avgRet3Udbetalingsaar, setAvgRet3Udbetalingsaar, avgRet3Garanteret, setAvgRet3Garanteret,
        insSalaryRaw, setInsSalaryRaw,
        insContributionRaw, setInsContributionRaw,
        insCoveragePctRaw, setInsCoveragePctRaw,
        insLivsPctRaw, setInsLivsPctRaw,
        insKritiskRaw, setInsKritiskRaw,
        insIncludeSundhed, setInsIncludeSundhed,
        insAnonymize, setInsAnonymize,
        insVisibleIds, setInsVisibleIds,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext() {
  return useContext(CalculatorContext);
}
