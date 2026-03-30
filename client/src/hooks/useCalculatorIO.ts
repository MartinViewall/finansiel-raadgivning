/**
 * useCalculatorIO
 *
 * Provides a single "Gem scenarie" / "Indlæs scenarie" pair that saves and
 * restores ALL four calculators in one JSON file.
 *
 * Usage: call useAllCalculatorsIO() once (e.g. in the sidebar or a shared
 * toolbar) and pass the returned { exportAll, triggerImportAll } to the UI.
 *
 * The file is named  "scenarie-YYYY-MM-DD.json" and contains a top-level
 * _type: "alle-beregnere" field so we can reject wrong files on import.
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
  function exportAll() {
    const payload = {
      _type: FILE_TYPE,
      _version: FILE_VERSION,
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
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenarie-${today}.json`;
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

        toast.success("Scenarie indlæst — alle beregnere opdateret");
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
