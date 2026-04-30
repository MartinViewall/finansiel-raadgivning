import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronRight, Plus, GripVertical } from "lucide-react";

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

interface ProductSelectorProps {
  selectedIds: number[];
  onToggle: (id: number) => void;
  onReorder: (newIds: number[]) => void;
  maxSelections?: number;
  /** Optional label override for chips — used for anonymisation */
  chipLabel?: (productId: number, originalName: string) => string;
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

// ─── Sortable chip ────────────────────────────────────────────────────────────

interface SortableChipProps {
  id: number;
  name: string;
  color: string;
  isFirst: boolean;
  onRemove: () => void;
}

function SortableChip({ id, name, color, isFirst, onRemove }: SortableChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderColor: color + "60",
    background: color + "12",
    color: "var(--foreground)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border select-none"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        tabIndex={-1}
        aria-label="Træk for at omarrangere"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <ColorDot color={color} />
      <span className="break-words leading-tight max-w-[120px] truncate">{name}</span>
      {isFirst && (
        <span className="text-[10px] text-muted-foreground ml-0.5 flex-shrink-0">(nuv.)</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
        aria-label={`Fjern ${name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductSelector({ selectedIds, onToggle, onReorder, maxSelections = 3, chipLabel }: ProductSelectorProps) {
  const { data: products = [] } = trpc.products.listMeta.useQuery();
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  // Preserve selection order
  const selectedProducts = useMemo(
    () => selectedIds
      .map((id) => (products as ProductMeta[]).find((p) => p.id === id))
      .filter((p): p is ProductMeta => p !== undefined),
    [products, selectedIds]
  );

  const companies = Array.from(grouped.keys()).sort();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedIds.indexOf(active.id as number);
    const newIndex = selectedIds.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(selectedIds, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      {/* Sortable selected chips */}
      {selectedProducts.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedIds}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-1.5">
              {selectedProducts.map((p, idx) => (
                <SortableChip
                  key={p.id}
                  id={p.id}
                  name={chipLabel ? chipLabel(p.id, p.name) : p.name}
                  color={p.color}
                  isFirst={idx === 0}
                  onRemove={() => onToggle(p.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedIds.length}/{maxSelections} valgt
          {selectedIds.length > 1 && (
            <span className="ml-1 opacity-60">· træk for at omarrangere</span>
          )}
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
                                  <span className="text-xs text-foreground flex-1 break-words leading-tight">{p.name}</span>
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
