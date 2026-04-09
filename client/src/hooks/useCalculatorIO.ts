/**
 * useCalculatorIO
 *
 * Provides a single "Gem scenarie" / "Indlæs scenarie" pair that saves and
 * restores ALL five calculators in one JSON file.
 *
 * exportAll(clientName?) accepts an optional client name that is embedded in
 * the filename: scenarie-{klientnavn}-{dato}.json
 *
 * The file contains _type: "alle-beregnere" so wrong files are rejected on import.
 */
import { useRef } from "react";
import { toast } from "sonner";
import { useCalculatorContext } from "@/contexts/CalculatorContext";

const FILE_TYPE = "alle-beregnere";
const FILE_VERSION = 1;

export function useAllCalculatorsIO() {
  const ctx = useCalculatorContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Export ──────────────────────────────────────────────────────────────────
  function exportAll(clientName = "") {
    const payload = {
      _type: FILE_TYPE,
      _version: FILE_VERSION,
      _klient: clientName || undefined,
      // Afkastberegner
      afkast: {
        depot: ctx.depot,
        annualContribution: ctx.annualContribution,
        horizonYears: ctx.horizonYears,
        selectedProductIds: ctx.selectedProductIds,
        pensionYearsRaw: ctx.pensionYearsRaw,
        pensionReturnOverride: ctx.pensionReturnOverride,
        tableYearFrom: ctx.tableYearFrom,
        tableYearTo: ctx.tableYearTo,
      },
      // Omkostningsberegner
      omkostning: {
        depot: ctx.costDepot,
        annualContribution: ctx.costAnnualContribution,
        yearsToPension: ctx.costYearsToPension,
        costTodayRaw: ctx.costTodayRaw,
        costNewRaw: ctx.costNewRaw,
      },
      // Målberegner
      maal: {
        mode: ctx.goalMode,
        depot: ctx.goalDepot,
        years: ctx.goalYears,
        returnRaw: ctx.goalReturnRaw,
        targetAmount: ctx.goalTargetAmount,
        annualPayout: ctx.goalAnnualPayout,
        payoutYears: ctx.goalPayoutYears,
      },
      // Afkastforskelberegner
      afkastforskel: {
        depot: ctx.returnDiffDepot,
        annualContribution: ctx.returnDiffAnnualContribution,
        yearsToPension: ctx.returnDiffYearsToPension,
        returnTodayRaw: ctx.returnDiffTodayRaw,
        returnNewRaw: ctx.returnDiffNewRaw,
      },
      // Kapacitetsberegner
      kapacitet: {
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
      },
      // Forsikringsprisberegner
      forsikring: {
        salaryRaw: ctx.insSalaryRaw,
        contributionRaw: ctx.insContributionRaw,
        coveragePctRaw: ctx.insCoveragePctRaw,
        livsPctRaw: ctx.insLivsPctRaw,
        kritiskRaw: ctx.insKritiskRaw,
        includeSundhed: ctx.insIncludeSundhed,
        anonymize: ctx.insAnonymize,
        visibleIds: ctx.insVisibleIds,
      },
      // Gennemsnitsrenteberegner
      gennemsnitsrente: {
        currentAge: ctx.avgRetCurrentAge,
        pensionAge: ctx.avgRetPensionAge,
        s0: { depot: ctx.avgRet0Depot, overf: ctx.avgRet0Overf, indbetaling: ctx.avgRet0Indbetaling, rentePct: ctx.avgRet0RentePct, udbetalingsaar: ctx.avgRet0Udbetalingsaar, garanteret: ctx.avgRet0Garanteret },
        s1: { depot: ctx.avgRet1Depot, overf: ctx.avgRet1Overf, indbetaling: ctx.avgRet1Indbetaling, rentePct: ctx.avgRet1RentePct, udbetalingsaar: ctx.avgRet1Udbetalingsaar, garanteret: ctx.avgRet1Garanteret },
        s2: { depot: ctx.avgRet2Depot, overf: ctx.avgRet2Overf, indbetaling: ctx.avgRet2Indbetaling, rentePct: ctx.avgRet2RentePct, udbetalingsaar: ctx.avgRet2Udbetalingsaar, garanteret: ctx.avgRet2Garanteret },
        s3: { depot: ctx.avgRet3Depot, overf: ctx.avgRet3Overf, indbetaling: ctx.avgRet3Indbetaling, rentePct: ctx.avgRet3RentePct, udbetalingsaar: ctx.avgRet3Udbetalingsaar, garanteret: ctx.avgRet3Garanteret },
      },
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const safeName = clientName.trim()
      ? clientName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9æøåÆØÅ\-_]/g, "") + "-"
      : "";
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenarie-${safeName}${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Alle beregnere gemt som scenarie-fil");
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  function triggerImportAll() {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.style.display = "none";
      input.addEventListener("change", handleFile);
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (raw._type !== FILE_TYPE) {
          toast.error('Forkert fil — forventede en "scenarie"-fil med alle beregnere');
          return;
        }

        // Afkastberegner
        const a = raw.afkast ?? {};
        if (a.depot !== undefined) ctx.setDepot(a.depot);
        if (a.annualContribution !== undefined) ctx.setAnnualContribution(a.annualContribution);
        if (a.horizonYears !== undefined) ctx.setHorizonYears(a.horizonYears);
        if (a.selectedProductIds !== undefined) ctx.setSelectedProductIds(a.selectedProductIds);
        if (a.pensionYearsRaw !== undefined) ctx.setPensionYearsRaw(a.pensionYearsRaw);
        if (a.pensionReturnOverride !== undefined) ctx.setPensionReturnOverride(a.pensionReturnOverride);
        if (a.tableYearFrom !== undefined) ctx.setTableYearFrom(a.tableYearFrom);
        if (a.tableYearTo !== undefined) ctx.setTableYearTo(a.tableYearTo);

        // Omkostningsberegner
        const o = raw.omkostning ?? {};
        if (o.depot !== undefined) ctx.setCostDepot(o.depot);
        if (o.annualContribution !== undefined) ctx.setCostAnnualContribution(o.annualContribution);
        if (o.yearsToPension !== undefined) ctx.setCostYearsToPension(o.yearsToPension);
        if (o.costTodayRaw !== undefined) ctx.setCostTodayRaw(o.costTodayRaw);
        if (o.costNewRaw !== undefined) ctx.setCostNewRaw(o.costNewRaw);

        // Målberegner
        const m = raw.maal ?? {};
        if (m.mode !== undefined) ctx.setGoalMode(m.mode);
        if (m.depot !== undefined) ctx.setGoalDepot(m.depot);
        if (m.years !== undefined) ctx.setGoalYears(m.years);
        if (m.returnRaw !== undefined) ctx.setGoalReturnRaw(m.returnRaw);
        if (m.targetAmount !== undefined) ctx.setGoalTargetAmount(m.targetAmount);
        if (m.annualPayout !== undefined) ctx.setGoalAnnualPayout(m.annualPayout);
        if (m.payoutYears !== undefined) ctx.setGoalPayoutYears(m.payoutYears);

        // Afkastforskelberegner
        const rd = raw.afkastforskel ?? {};
        if (rd.depot !== undefined) ctx.setReturnDiffDepot(rd.depot);
        if (rd.annualContribution !== undefined) ctx.setReturnDiffAnnualContribution(rd.annualContribution);
        if (rd.yearsToPension !== undefined) ctx.setReturnDiffYearsToPension(rd.yearsToPension);
        if (rd.returnTodayRaw !== undefined) ctx.setReturnDiffTodayRaw(rd.returnTodayRaw);
        if (rd.returnNewRaw !== undefined) ctx.setReturnDiffNewRaw(rd.returnNewRaw);

        // Kapacitetsberegner
        const k = raw.kapacitet ?? {};
        if (k.yearsToPension !== undefined) ctx.setCapYearsToPension(k.yearsToPension);
        if (k.payoutYears !== undefined) ctx.setCapPayoutYears(k.payoutYears);
        if (k.desiredMonthly !== undefined) ctx.setCapDesiredMonthly(k.desiredMonthly);
        if (k.civilStatus !== undefined) ctx.setCapCivilStatus(k.civilStatus);
        if (k.pensionWealth !== undefined) ctx.setCapPensionWealth(k.pensionWealth);
        if (k.pensionMonthly !== undefined) ctx.setCapPensionMonthly(k.pensionMonthly);
        if (k.pensionReturn !== undefined) ctx.setCapPensionReturn(k.pensionReturn);
        if (k.palTax !== undefined) ctx.setCapPalTax(k.palTax);
        if (k.pensionTax !== undefined) ctx.setCapPensionTax(k.pensionTax);
        if (k.friWealth !== undefined) ctx.setCapFriWealth(k.friWealth);
        if (k.friMonthly !== undefined) ctx.setCapFriMonthly(k.friMonthly);
        if (k.friReturn !== undefined) ctx.setCapFriReturn(k.friReturn);
        if (k.friTax !== undefined) ctx.setCapFriTax(k.friTax);
        if (k.frivaerdiMode !== undefined) ctx.setCapFrivaerdiMode(k.frivaerdiMode);
        if (k.boligVaerdi !== undefined) ctx.setCapBoligVaerdi(k.boligVaerdi);
        if (k.boligStigningPct !== undefined) ctx.setCapBoligStigningPct(k.boligStigningPct);
        if (k.restgaeld !== undefined) ctx.setCapRestgaeld(k.restgaeld);
        if (k.aarligAfdrag !== undefined) ctx.setCapAarligAfdrag(k.aarligAfdrag);
        if (k.frivaerdiDirekte !== undefined) ctx.setCapFrivaerdiDirekte(k.frivaerdiDirekte);
        if (k.frivaerdiAnvendtPct !== undefined) ctx.setCapFrivaerdiAnvendtPct(k.frivaerdiAnvendtPct);
        if (k.selskabWealth !== undefined) ctx.setCapSelskabWealth(k.selskabWealth);
        if (k.selskabMonthly !== undefined) ctx.setCapSelskabMonthly(k.selskabMonthly);
        if (k.selskabReturn !== undefined) ctx.setCapSelskabReturn(k.selskabReturn);
        if (k.selskabSkat !== undefined) ctx.setCapSelskabSkat(k.selskabSkat);
        if (k.udbytteSkat !== undefined) ctx.setCapUdbytteSkat(k.udbytteSkat);
        if (k.folkepension !== undefined) ctx.setCapFolkepension(k.folkepension);
        if (k.pensionstillaeg !== undefined) ctx.setCapPensionstillaeg(k.pensionstillaeg);
        if (k.atp !== undefined) ctx.setCapAtp(k.atp);

        // Gennemsnitsrenteberegner
        const g = raw.gennemsnitsrente ?? {};
        if (g.currentAge !== undefined) ctx.setAvgRetCurrentAge(g.currentAge);
        if (g.pensionAge !== undefined) ctx.setAvgRetPensionAge(g.pensionAge);
        const gs0 = g.s0 ?? {};
        if (gs0.depot !== undefined) ctx.setAvgRet0Depot(gs0.depot);
        if (gs0.overf !== undefined) ctx.setAvgRet0Overf(gs0.overf);
        if (gs0.indbetaling !== undefined) ctx.setAvgRet0Indbetaling(gs0.indbetaling);
        if (gs0.rentePct !== undefined) ctx.setAvgRet0RentePct(gs0.rentePct);
        if (gs0.udbetalingsaar !== undefined) ctx.setAvgRet0Udbetalingsaar(gs0.udbetalingsaar);
        if (gs0.garanteret !== undefined) ctx.setAvgRet0Garanteret(gs0.garanteret);
        const gs1 = g.s1 ?? {};
        if (gs1.depot !== undefined) ctx.setAvgRet1Depot(gs1.depot);
        if (gs1.overf !== undefined) ctx.setAvgRet1Overf(gs1.overf);
        if (gs1.indbetaling !== undefined) ctx.setAvgRet1Indbetaling(gs1.indbetaling);
        if (gs1.rentePct !== undefined) ctx.setAvgRet1RentePct(gs1.rentePct);
        if (gs1.udbetalingsaar !== undefined) ctx.setAvgRet1Udbetalingsaar(gs1.udbetalingsaar);
        if (gs1.garanteret !== undefined) ctx.setAvgRet1Garanteret(gs1.garanteret);
        const gs2 = g.s2 ?? {};
        if (gs2.depot !== undefined) ctx.setAvgRet2Depot(gs2.depot);
        if (gs2.overf !== undefined) ctx.setAvgRet2Overf(gs2.overf);
        if (gs2.indbetaling !== undefined) ctx.setAvgRet2Indbetaling(gs2.indbetaling);
        if (gs2.rentePct !== undefined) ctx.setAvgRet2RentePct(gs2.rentePct);
        if (gs2.udbetalingsaar !== undefined) ctx.setAvgRet2Udbetalingsaar(gs2.udbetalingsaar);
        if (gs2.garanteret !== undefined) ctx.setAvgRet2Garanteret(gs2.garanteret);
        const gs3 = g.s3 ?? {};
        if (gs3.depot !== undefined) ctx.setAvgRet3Depot(gs3.depot);
        if (gs3.overf !== undefined) ctx.setAvgRet3Overf(gs3.overf);
        if (gs3.indbetaling !== undefined) ctx.setAvgRet3Indbetaling(gs3.indbetaling);
        if (gs3.rentePct !== undefined) ctx.setAvgRet3RentePct(gs3.rentePct);
        if (gs3.udbetalingsaar !== undefined) ctx.setAvgRet3Udbetalingsaar(gs3.udbetalingsaar);
        if (gs3.garanteret !== undefined) ctx.setAvgRet3Garanteret(gs3.garanteret);

        // Forsikringsprisberegner
        const f = raw.forsikring ?? {};
        if (f.salaryRaw !== undefined) ctx.setInsSalaryRaw(f.salaryRaw);
        if (f.contributionRaw !== undefined) ctx.setInsContributionRaw(f.contributionRaw);
        if (f.coveragePctRaw !== undefined) ctx.setInsCoveragePctRaw(f.coveragePctRaw);
        if (f.livsPctRaw !== undefined) ctx.setInsLivsPctRaw(f.livsPctRaw);
        if (f.kritiskRaw !== undefined) ctx.setInsKritiskRaw(f.kritiskRaw);
        if (f.includeSundhed !== undefined) ctx.setInsIncludeSundhed(f.includeSundhed);
        if (f.anonymize !== undefined) ctx.setInsAnonymize(f.anonymize);
        if (f.visibleIds !== undefined) ctx.setInsVisibleIds(f.visibleIds);

        const klientNavn = raw._klient ? ` for ${raw._klient}` : "";
        toast.success(`Scenarie${klientNavn} indlæst — alle beregnere opdateret`);
      } catch {
        toast.error("Kunne ikke læse filen — kontroller at det er en gyldig JSON-fil");
      }
    };
    reader.readAsText(file);
  }

  return { exportAll, triggerImportAll };
}

// ── Legacy per-calculator hook (kept for backward compat, no longer used) ─────
export type CalculatorType = "afkast" | "omkostning" | "maal" | "kapacitet";
