import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp, Eye, EyeOff, Settings2, Plus, Trash2, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type CoverageType = "erhvervsevne" | "praemiefritagelse" | "livsforsikring" | "kritisksygdom" | "sundhedsordning" | "administration";

interface BasePriceMap {
  [companyId: number]: {
    [ct in CoverageType]?: { ratePct: number; fixedKr: number; baselinePct: number };
  };
}

interface CalcResult {
  companyId: number;
  companyName: string;
  useEaFormula: boolean;
  erhvervsevne: number;
  praemiefritagelse: number;
  livsforsikring: number;
  kritisksygdom: number;
  sundhedsordning: number;
  administration: number;
  total: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kr.";
}

function parseNum(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function formatInput(s: string): string {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return s;
  return new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(n);
}

function lookupCoveragePct(salary: number, scale: { salaryUpTo: number; coveragePct: string }[]): number {
  if (scale.length === 0) return 0;
  const sorted = [...scale].sort((a, b) => a.salaryUpTo - b.salaryUpTo);
  for (const row of sorted) {
    if (salary <= row.salaryUpTo) return parseFloat(row.coveragePct);
  }
  return parseFloat(sorted[sorted.length - 1].coveragePct);
}

// ─── Calculation engine ───────────────────────────────────────────────────────

function calcCompany(
  company: { id: number; name: string; useEaFormula: number },
  prices: BasePriceMap,
  salary: number,
  annualContribution: number,
  coveragePct: number, // for erhvervsevne
  livsPct: number,     // fraction e.g. 1.0
  kritiskBeloeb: number,
  includeSundhed: boolean
): CalcResult {
  const p = prices[company.id] ?? {};
  const useEa = company.useEaFormula === 1;

  const get = (ct: CoverageType) => p[ct] ?? { ratePct: 0, fixedKr: 0, baselinePct: 1 };

  // Erhvervsevne
  let erhvervsevne = 0;
  const ep = get("erhvervsevne");
  if (useEa) {
    // EA formula: løn × ratePct + fixedKr
    erhvervsevne = salary * ep.ratePct + ep.fixedKr;
  } else {
    // Standard: (løn × dækningspct × ratePct) / baselinePct + fixedKr
    erhvervsevne = (salary * coveragePct * ep.ratePct) / (ep.baselinePct || 0.4) + ep.fixedKr;
  }

  // Præmiefritagelse: Årlig indbetaling × ratePct
  const pp = get("praemiefritagelse");
  const praemiefritagelse = annualContribution * pp.ratePct + pp.fixedKr;

  // Livsforsikring: løn × livsPct × ratePct
  const lp = get("livsforsikring");
  const livsforsikring = salary * livsPct * lp.ratePct + lp.fixedKr;

  // Kritisk Sygdom: beløb × ratePct
  const kp = get("kritisksygdom");
  const kritisksygdom = kritiskBeloeb * kp.ratePct + kp.fixedKr;

  // Sundhedsordning: flat price
  const sp = get("sundhedsordning");
  const sundhedsordning = includeSundhed ? sp.fixedKr : 0;

  // Administration: flat price
  const ap = get("administration");
  const administration = ap.fixedKr;

  const total = erhvervsevne + praemiefritagelse + livsforsikring + kritisksygdom + sundhedsordning + administration;

  return {
    companyId: company.id,
    companyName: company.name,
    useEaFormula: useEa,
    erhvervsevne,
    praemiefritagelse,
    livsforsikring,
    kritisksygdom,
    sundhedsordning,
    administration,
    total,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultRow({ label, value, dimmed }: { label: string; value: number; dimmed?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 text-sm ${dimmed ? "opacity-40" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{fmt(value)}</span>
    </div>
  );
}

function CompanyCard({
  result,
  displayName,
  expanded,
  onToggle,
  isLowest,
}: {
  result: CalcResult;
  displayName: string;
  expanded: boolean;
  onToggle: () => void;
  isLowest: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-card transition-all ${isLowest ? "border-emerald-500/60 shadow-emerald-500/10 shadow-md" : "border-border"}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{displayName}</span>
          {isLowest && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2 py-0">
              Lavest
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-base font-mono">{fmt(result.total)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-border/50 pt-2 space-y-0.5">
          <ResultRow label="Erhvervsevne" value={result.erhvervsevne} />
          <ResultRow label="Præmiefritagelse" value={result.praemiefritagelse} />
          <ResultRow label="Livsforsikring" value={result.livsforsikring} />
          <ResultRow label="Kritisk Sygdom" value={result.kritisksygdom} />
          <ResultRow label="Sundhedsordning" value={result.sundhedsordning} dimmed={result.sundhedsordning === 0} />
          <ResultRow label="Administration" value={result.administration} dimmed={result.administration === 0} />
          <div className="border-t border-border/50 mt-2 pt-2 flex justify-between items-center">
            <span className="text-sm font-semibold">Total/år</span>
            <span className="font-bold font-mono text-base">{fmt(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

const COVERAGE_LABELS: Record<CoverageType, string> = {
  erhvervsevne: "Erhvervsevne",
  praemiefritagelse: "Præmiefritagelse",
  livsforsikring: "Livsforsikring",
  kritisksygdom: "Kritisk Sygdom",
  sundhedsordning: "Sundhedsordning (fast kr.)",
  administration: "Administration (fast kr.)",
};

function AdminPanel({
  companies,
  basePrices,
  onClose,
}: {
  companies: { id: number; name: string; useEaFormula: number; isActive: number }[];
  basePrices: { id: number; companyId: number; coverageType: string; ratePct: string; fixedKr: string; baselinePct: string }[];
  onClose: () => void;
}) {
  const utils = trpc.useUtils();

  const upsertMut = trpc.insurance.upsertBasePrice.useMutation({
    onSuccess: () => { utils.insurance.getBasePrices.invalidate(); toast("Gemt"); },
  });
  const addCompanyMut = trpc.insurance.addCompany.useMutation({
    onSuccess: () => { utils.insurance.listCompanies.invalidate(); utils.insurance.getBasePrices.invalidate(); toast("Selskab tilføjet"); },
  });
  const deleteCompanyMut = trpc.insurance.deleteCompany.useMutation({
    onSuccess: () => { utils.insurance.listCompanies.invalidate(); utils.insurance.getBasePrices.invalidate(); toast("Selskab slettet"); },
  });
  const updateCompanyMut = trpc.insurance.updateCompany.useMutation({
    onSuccess: () => { utils.insurance.listCompanies.invalidate(); },
  });

  const [newName, setNewName] = useState("");
  const [newEa, setNewEa] = useState(false);

  // Local edits: { [companyId_coverageType]: { ratePct: string; fixedKr: string; baselinePct: string } }
  const [edits, setEdits] = useState<Record<string, { ratePct: string; fixedKr: string; baselinePct: string }>>({});

  const getEdit = (companyId: number, ct: CoverageType) => {
    const key = `${companyId}_${ct}`;
    if (edits[key]) return edits[key];
    const existing = basePrices.find(p => p.companyId === companyId && p.coverageType === ct);
    return {
      ratePct: existing ? (parseFloat(existing.ratePct) * 100).toFixed(6) : "0",
      fixedKr: existing ? parseFloat(existing.fixedKr).toFixed(2) : "0",
      baselinePct: existing ? (parseFloat(existing.baselinePct) * 100).toFixed(0) : "100",
    };
  };

  const setEdit = (companyId: number, ct: CoverageType, field: "ratePct" | "fixedKr" | "baselinePct", val: string) => {
    const key = `${companyId}_${ct}`;
    setEdits(prev => ({ ...prev, [key]: { ...getEdit(companyId, ct), [field]: val } }));
  };

  const savePrice = (companyId: number, ct: CoverageType) => {
    const e = getEdit(companyId, ct);
    upsertMut.mutate({
      companyId,
      coverageType: ct,
      ratePct: parseFloat(e.ratePct) / 100,
      fixedKr: parseFloat(e.fixedKr),
      baselinePct: parseFloat(e.baselinePct) / 100,
    });
  };

  const coverageTypes: CoverageType[] = ["erhvervsevne", "praemiefritagelse", "livsforsikring", "kritisksygdom", "sundhedsordning", "administration"];
  const flatTypes: CoverageType[] = ["sundhedsordning", "administration"];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-8 px-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-5xl shadow-2xl mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Admin – Grundpriser
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>Luk</Button>
        </div>

        <div className="p-6 space-y-8 overflow-x-auto">
          {/* Price table */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Grundpriser per selskab</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Forsikringstype</th>
                    {companies.map(c => (
                      <th key={c.id} className="text-center py-2 px-2 font-medium min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{c.name}</span>
                          {c.useEaFormula === 1 && <Badge variant="outline" className="text-xs px-1 py-0">EA-formel</Badge>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coverageTypes.map(ct => (
                    <tr key={ct} className="border-b border-border/30">
                      <td className="py-2 pr-4 font-medium text-sm">{COVERAGE_LABELS[ct]}</td>
                      {companies.map(c => {
                        const e = getEdit(c.id, ct);
                        const isFlat = flatTypes.includes(ct);
                        const isPraemie = ct === "praemiefritagelse";
                        return (
                          <td key={c.id} className="py-2 px-2 align-top">
                            <div className="space-y-1">
                              {!isFlat && (
                                <div className="flex items-center gap-1">
                                  <Input
                                    className="h-7 text-xs w-24"
                                    value={e.ratePct}
                                    onChange={ev => setEdit(c.id, ct, "ratePct", ev.target.value)}
                                    placeholder="Rate %"
                                  />
                                  <span className="text-xs text-muted-foreground">%</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Input
                                  className="h-7 text-xs w-24"
                                  value={e.fixedKr}
                                  onChange={ev => setEdit(c.id, ct, "fixedKr", ev.target.value)}
                                  placeholder="Fast kr."
                                />
                                <span className="text-xs text-muted-foreground">kr.</span>
                              </div>
                              {ct === "erhvervsevne" && !isPraemie && (
                                <div className="flex items-center gap-1">
                                  <Input
                                    className="h-7 text-xs w-24"
                                    value={e.baselinePct}
                                    onChange={ev => setEdit(c.id, ct, "baselinePct", ev.target.value)}
                                    placeholder="Baseline %"
                                  />
                                  <span className="text-xs text-muted-foreground">% base</span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => savePrice(c.id, ct)}
                              >
                                <Check className="h-3 w-3 mr-1" />Gem
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manage companies */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Selskaber</h3>
            <div className="space-y-2 mb-4">
              {companies.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.useEaFormula === 1 && <Badge variant="outline" className="text-xs">EA-formel</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7"
                    onClick={() => {
                      if (confirm(`Slet ${c.name}? Dette sletter også alle grundpriser for selskabet.`)) {
                        deleteCompanyMut.mutate({ id: c.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-3 p-4 rounded-lg border border-dashed border-border bg-muted/10">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Nyt selskab</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Selskabsnavn"
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-2 pb-0.5">
                <Switch checked={newEa} onCheckedChange={setNewEa} id="ea-toggle" />
                <Label htmlFor="ea-toggle" className="text-xs">EA-formel</Label>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!newName.trim()) return;
                  addCompanyMut.mutate({ name: newName.trim(), useEaFormula: newEa });
                  setNewName("");
                  setNewEa(false);
                }}
                disabled={!newName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />Tilføj
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InsuranceCalculator() {
  const { data: companies = [] } = trpc.insurance.listCompanies.useQuery();
  const { data: rawPrices = [] } = trpc.insurance.getBasePrices.useQuery();
  const { data: salaryScale = [] } = trpc.insurance.getSalaryScale.useQuery();

  // Inputs
  const [salaryRaw, setSalaryRaw] = useState("660.000");
  const [contributionRaw, setContributionRaw] = useState("60.000");
  const [coveragePctRaw, setCoveragePctRaw] = useState(""); // empty = auto from scale
  const [livsPctRaw, setLivsPctRaw] = useState("100");
  const [kritiskRaw, setKritiskRaw] = useState("100.000");
  const [includeSundhed, setIncludeSundhed] = useState(true);

  // UI state
  const [anonymize, setAnonymize] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<number> | null>(null); // null = all
  const [visningCollapsed, setVisningCollapsed] = useState(false);

  const handleAdminOpen = () => {
    setAdminPwInput("");
    setAdminPwError(false);
    setShowHint(false);
    setShowAdminPw(true);
  };

  const handleAdminPwSubmit = () => {
    if (adminPwInput === "Kakao467") {
      setShowAdminPw(false);
      setShowAdmin(true);
    } else {
      setAdminPwError(true);
    }
  };

  const salary = parseNum(salaryRaw);
  const annualContribution = parseNum(contributionRaw);
  const livsPct = (parseNum(livsPctRaw) || 100) / 100;
  const kritiskBeloeb = parseNum(kritiskRaw);

  // Auto-suggest coverage pct from salary scale
  const suggestedCoveragePct = useMemo(() => lookupCoveragePct(salary, salaryScale as { salaryUpTo: number; coveragePct: string }[]), [salary, salaryScale]);
  const coveragePct = coveragePctRaw !== "" ? (parseNum(coveragePctRaw) / 100) : suggestedCoveragePct;

  // Build price map
  const priceMap = useMemo<BasePriceMap>(() => {
    const map: BasePriceMap = {};
    for (const p of rawPrices) {
      if (!map[p.companyId]) map[p.companyId] = {};
      map[p.companyId][p.coverageType as CoverageType] = {
        ratePct: parseFloat(p.ratePct),
        fixedKr: parseFloat(p.fixedKr),
        baselinePct: parseFloat(p.baselinePct),
      };
    }
    return map;
  }, [rawPrices]);

  // Calculate results
  const results = useMemo<CalcResult[]>(() => {
    return companies
      .filter(c => c.isActive === 1)
      .filter(c => visibleIds === null || visibleIds.has(c.id))
      .map(c => calcCompany(c, priceMap, salary, annualContribution, coveragePct, livsPct, kritiskBeloeb, includeSundhed));
  }, [companies, priceMap, salary, annualContribution, coveragePct, livsPct, kritiskBeloeb, includeSundhed, visibleIds]);

  const lowestId = results.length > 0 ? results.reduce((min, r) => r.total < min.total ? r : min).companyId : -1;

  const displayName = useCallback((r: CalcResult, idx: number) => {
    if (!anonymize) return r.companyName;
    return `Selskab ${idx + 1}`;
  }, [anonymize]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllExpand = () => {
    if (expandedIds.size === results.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(results.map(r => r.companyId)));
    }
  };

  const allExpanded = expandedIds.size === results.length && results.length > 0;

  const toggleVisible = (id: number) => {
    if (visibleIds === null) {
      // Start with all except this one
      const allIds = new Set(companies.filter(c => c.isActive === 1).map(c => c.id));
      allIds.delete(id);
      setVisibleIds(allIds);
    } else {
      const next = new Set(visibleIds);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === companies.filter(c => c.isActive === 1).length) {
        setVisibleIds(null);
      } else {
        setVisibleIds(next);
      }
    }
  };

  const isVisible = (id: number) => visibleIds === null || visibleIds.has(id);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forsikringsprisberegner</h1>
          <p className="text-muted-foreground text-sm mt-1">Sammenlign forsikringspriser på tværs af selskaber baseret på kundens løn og ønsker.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdminOpen} className="gap-2">
          <Settings2 className="h-4 w-4" />
          Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ─── Left: Inputs ─── */}
        <div className="space-y-4">
          {/* Kundeoplysninger */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h2 className="font-semibold text-sm text-primary uppercase tracking-wide">Kundeoplysninger</h2>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Løn (kr./år)</Label>
              <div className="relative">
                <Input
                  value={salaryRaw}
                  onChange={e => setSalaryRaw(e.target.value)}
                  onBlur={e => setSalaryRaw(formatInput(e.target.value))}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr.</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Årlig indbetaling (kr./år)</Label>
              <div className="relative">
                <Input
                  value={contributionRaw}
                  onChange={e => setContributionRaw(e.target.value)}
                  onBlur={e => setContributionRaw(formatInput(e.target.value))}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr.</span>
              </div>
            </div>
          </div>

          {/* Dækningsvalg */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h2 className="font-semibold text-sm text-primary uppercase tracking-wide">Dækningsvalg</h2>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Dækning ved mistet erhvervsevne
                {coveragePctRaw === "" && (
                  <span className="ml-2 text-emerald-400 text-xs">
                    (foreslået: {Math.round(suggestedCoveragePct * 100)}% fra lønskala)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  value={coveragePctRaw !== "" ? coveragePctRaw : Math.round(suggestedCoveragePct * 100).toString()}
                  onChange={e => setCoveragePctRaw(e.target.value)}
                  onFocus={() => { if (coveragePctRaw === "") setCoveragePctRaw(Math.round(suggestedCoveragePct * 100).toString()); }}
                  className="pr-10"
                  placeholder={`${Math.round(suggestedCoveragePct * 100)}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              {coveragePctRaw !== "" && (
                <button onClick={() => setCoveragePctRaw("")} className="text-xs text-muted-foreground hover:text-foreground underline">
                  Nulstil til lønskala-forslag
                </button>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Livsforsikring (% af løn)</Label>
              <div className="relative">
                <Input
                  value={livsPctRaw}
                  onChange={e => setLivsPctRaw(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Kritisk Sygdom (dækningsbeløb)</Label>
              <div className="relative">
                <Input
                  value={kritiskRaw}
                  onChange={e => setKritiskRaw(e.target.value)}
                  onBlur={e => setKritiskRaw(formatInput(e.target.value))}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr.</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Sundhedsordning</Label>
              <Switch checked={includeSundhed} onCheckedChange={setIncludeSundhed} />
            </div>
          </div>

          {/* Visningsvalg */}
          <div className="rounded-xl border border-border bg-card p-4">
            <button
              onClick={() => setVisningCollapsed(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-semibold text-sm text-primary uppercase tracking-wide">Visning</h2>
              {visningCollapsed
                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
            </button>

            {!visningCollapsed && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5" />
                    Skjul selskabsnavne
                  </Label>
                  <Switch checked={anonymize} onCheckedChange={setAnonymize} />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Vis selskaber</Label>
                  <div className="flex flex-wrap gap-2">
                    {companies.filter(c => c.isActive === 1).map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleVisible(c.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          isVisible(c.id)
                            ? "bg-primary/20 border-primary/40 text-primary"
                            : "bg-muted/20 border-border text-muted-foreground"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Results ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Resultater</h2>
            <Button variant="ghost" size="sm" onClick={toggleAllExpand} className="text-xs gap-1.5">
              {allExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {allExpanded ? "Minimer alle" : "Udvid alle"}
            </Button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              Ingen selskaber valgt
            </div>
          ) : (
            results.map((r, idx) => (
              <CompanyCard
                key={r.companyId}
                result={r}
                displayName={displayName(r, idx)}
                expanded={expandedIds.has(r.companyId)}
                onToggle={() => toggleExpand(r.companyId)}
                isLowest={r.companyId === lowestId}
              />
            ))
          )}

          {/* Summary bar */}
          {results.length > 1 && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Forskel (lavest vs. højest)</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {displayName(results.reduce((min, r) => r.total < min.total ? r : min), results.indexOf(results.reduce((min, r) => r.total < min.total ? r : min)))}
                  {" vs. "}
                  {displayName(results.reduce((max, r) => r.total > max.total ? r : max), results.indexOf(results.reduce((max, r) => r.total > max.total ? r : max)))}
                </span>
                <span className="font-bold font-mono text-emerald-400">
                  {fmt(Math.max(...results.map(r => r.total)) - Math.min(...results.map(r => r.total)))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin password gate */}
      {showAdminPw && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Admin – adgangskode
              </h2>
              <button
                onClick={() => setShowHint(h => !h)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title=""
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showHint && (
              <p className="text-xs text-muted-foreground italic">{"HotDrinkNumber"}</p>
            )}

            <div className="space-y-2">
              <input
                type="password"
                value={adminPwInput}
                onChange={e => { setAdminPwInput(e.target.value); setAdminPwError(false); }}
                onKeyDown={e => e.key === "Enter" && handleAdminPwSubmit()}
                placeholder="Adgangskode"
                autoFocus
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/40 ${
                  adminPwError ? "border-red-500" : "border-border"
                }`}
              />
              {adminPwError && (
                <p className="text-xs text-red-400">Forkert adgangskode</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAdminPw(false)}>Annuller</Button>
              <Button size="sm" onClick={handleAdminPwSubmit}>Åbn admin</Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin modal */}
      {showAdmin && (
        <AdminPanel
          companies={companies as { id: number; name: string; useEaFormula: number; isActive: number }[]}
          basePrices={rawPrices as { id: number; companyId: number; coverageType: string; ratePct: string; fixedKr: string; baselinePct: string }[]}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
