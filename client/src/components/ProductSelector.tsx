import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronRight, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductMeta {
  id: number;
  name: string;
  color: string;
  company: string | null;
  productLine: string | null;
  riskLevel: string | null;
  yearsToPension: number | null;
  aop: string | null;
}

interface SelectedProduct {
  id: number;
  name: string;
  color: string;
  company: string | null;
}

interface ProductSelectorProps {
  selectedIds: number[];
  onToggle: (id: number) => void;
  maxSelections?: number;
}

// ─── Color dot ────────────────────────────────────────────────────────────────

function ColorDot({ color }: { color: string }) {
  return <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />;
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

function riskColor(risk: string | null): string {
  if (!risk) return "bg-muted text-muted-foreground";
  const r = risk.toLowerCase();
  if (r.includes("konservativ") || r.includes("lav")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (r.includes("moderat") || r.includes("middel")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (r.includes("aggressiv") || r.includes("høj") || r.includes("aktier")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-muted text-muted-foreground";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductSelector({ selectedIds, onToggle, maxSelections = 3 }: ProductSelectorProps) {
  const { data: products = [] } = trpc.products.listMeta.useQuery();
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Group products: company → riskLevel → yearsToPension → products[]
  const grouped = useMemo(() => {
    const filtered = searchQuery.trim()
      ? (products as ProductMeta[]).filter((p) =>
          [p.name, p.company, p.productLine, p.riskLevel]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : (products as ProductMeta[]);

    const map = new Map<string, Map<string, Map<string | number, ProductMeta[]>>>();
    for (const p of filtered) {
      const company = p.company ?? "Øvrige";
      const risk = p.riskLevel ?? "Ukendt risiko";
      const years = p.yearsToPension ?? -1;

      if (!map.has(company)) map.set(company, new Map());
      const riskMap = map.get(company)!;
      if (!riskMap.has(risk)) riskMap.set(risk, new Map());
      const yearsMap = riskMap.get(risk)!;
      if (!yearsMap.has(years)) yearsMap.set(years, []);
      yearsMap.get(years)!.push(p);
    }
    return map;
  }, [products, searchQuery]);

  const selectedProducts = useMemo(
    () => (products as ProductMeta[]).filter((p) => selectedIds.includes(p.id)),
    [products, selectedIds]
  );

  const companies = Array.from(grouped.keys()).sort();

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                borderColor: p.color + "60",
                background: p.color + "12",
                color: "var(--foreground)",
              }}
            >
              <ColorDot color={p.color} />
              <span className="max-w-[140px] truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => onToggle(p.id)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedIds.length}/{maxSelections} valgt
        </span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => selectedIds.forEach(onToggle)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ryd alle
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Søg produkt, selskab, risiko..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Tree */}
      <div className="rounded-xl border border-border overflow-hidden bg-card max-h-[420px] overflow-y-auto">
        {companies.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Ingen produkter fundet
          </div>
        ) : (
          companies.map((company) => {
            const riskMap = grouped.get(company)!;
            const risks = Array.from(riskMap.keys()).sort();
            const isCompanyExpanded = expandedCompany === company;
            const companyProductCount = Array.from(riskMap.values())
              .flatMap((ym) => Array.from(ym.values()))
              .flat().length;
            const companySelectedCount = Array.from(riskMap.values())
              .flatMap((ym) => Array.from(ym.values()))
              .flat()
              .filter((p) => selectedIds.includes(p.id)).length;

            return (
              <div key={company} className="border-b border-border/50 last:border-0">
                {/* Company row */}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCompany(isCompanyExpanded ? null : company);
                    setExpandedRisk(null);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  {isCompanyExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-foreground flex-1">{company}</span>
                  <span className="text-xs text-muted-foreground">{companyProductCount} produkter</span>
                  {companySelectedCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                      {companySelectedCount}
                    </Badge>
                  )}
                </button>

                {/* Risk level rows */}
                {isCompanyExpanded && risks.map((risk) => {
                  const yearsMap = riskMap.get(risk)!;
                  const riskKey = `${company}::${risk}`;
                  const isRiskExpanded = expandedRisk === riskKey;
                  const riskProducts = Array.from(yearsMap.values()).flat();
                  const riskSelectedCount = riskProducts.filter((p) => selectedIds.includes(p.id)).length;

                  return (
                    <div key={risk} className="border-t border-border/30">
                      {/* Risk row */}
                      <button
                        type="button"
                        onClick={() => setExpandedRisk(isRiskExpanded ? null : riskKey)}
                        className="w-full flex items-center gap-2 pl-8 pr-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                      >
                        {isRiskExpanded ? (
                          <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${riskColor(risk)}`}>
                          {risk}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">{riskProducts.length}</span>
                        {riskSelectedCount > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                            {riskSelectedCount}
                          </Badge>
                        )}
                      </button>

                      {/* Product rows grouped by years to pension */}
                      {isRiskExpanded && Array.from(yearsMap.entries())
                        .sort(([a], [b]) => {
                          if (a === -1) return 1;
                          if (b === -1) return -1;
                          return Number(a) - Number(b);
                        })
                        .map(([years, prods]) => (
                          <div key={years}>
                            {/* Years-to-pension sub-header (only if multiple groups) */}
                            {yearsMap.size > 1 && (
                              <div className="pl-14 pr-4 py-1 bg-muted/20">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {years === -1 ? "Ingen årsangivelse" : `${years} år til pension`}
                                </span>
                              </div>
                            )}
                            {prods.map((p) => {
                              const isSelected = selectedIds.includes(p.id);
                              const isDisabled = !isSelected && selectedIds.length >= maxSelections;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => !isDisabled && onToggle(p.id)}
                                  className={`w-full flex items-center gap-2.5 pl-14 pr-4 py-2 text-left transition-colors
                                    ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}
                                    ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                                  `}
                                >
                                  <ColorDot color={p.color} />
                                  <span className="text-xs text-foreground flex-1 truncate">{p.name}</span>
                                  {p.aop && (
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      ÅOP {parseFloat(p.aop).toFixed(2)}%
                                    </span>
                                  )}
                                  {isSelected ? (
                                    <X className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
