import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, HelpCircle, Lock, Download } from "lucide-react";

const PRESET_COLORS = [
  "#1e3a5f", "#c9a84c", "#2e7d52", "#c0392b", "#7b3fa0",
  "#1a6b8a", "#d4813a", "#4a5568", "#2c7a7b", "#8b5e3c",
];

type ProductWithReturns = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  company: string | null;
  productLine: string | null;
  riskLevel: string | null;
  yearsToPension: number | null;
  aop: string | null;
  nhmId: string | null;
  returns: { id: number; productId: number; year: number; returnPct: string; createdAt: Date }[];
};

type UploadSummary = {
  productsUpdated: number;
  productsCreated: number;
  returnsUpdated: number;
  returnsCreated: number;
  errors: string[];
  yearColumns: number[];
};

// -----------------------------------------------------------------------
// Excel Upload Panel
// -----------------------------------------------------------------------
function ExcelUploadPanel({ onSuccess }: { onSuccess: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadError("Kun Excel-filer (.xlsx eller .xls) er understøttet");
      return;
    }
    setIsUploading(true);
    setSummary(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setUploadError(data.error ?? "Ukendt fejl under upload");
        return;
      }

      setSummary(data.summary);
      onSuccess();
      toast.success("Excel-fil importeret succesfuldt");
    } catch (err) {
      setUploadError(`Netværksfejl: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Importer fra Excel</h2>
        <span className="text-xs text-muted-foreground ml-1">— opdater afkastdata fra Return_Yearly fil</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
            }
            ${isUploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleInputChange}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Behandler fil, vent venligst…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Træk Excel-fil hertil, eller klik for at vælge
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Understøtter .xlsx og .xls — maks. 20 MB
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Vælg fil
              </Button>
            </div>
          )}
        </div>

        {/* Format hint */}
        <div className="bg-muted/40 rounded-lg px-4 py-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-foreground/70">Forventet kolonneformat:</p>
            <a
              href="https://d2xsxph8kpxj0f.cloudfront.net/310519663485446511/3cVu5yuXt8ENtYAZLcFt7i/eksempel-produkter_163ea0be.xlsx"
              download="eksempel-produkter.xlsx"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <FileSpreadsheet className="w-3 h-3" />
              Download eksempelfil
            </a>
          </div>
          <p>
            <span className="font-mono bg-muted px-1 rounded">NHM_ID</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">Name</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">Company</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">Risk</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">YearsToPension</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">AOP</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">ProductLine</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">2006</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">2007</span>,{" "}
            <span className="font-mono bg-muted px-1 rounded">…</span>
          </p>
          <p>Eksisterende produkter opdateres (upsert). Nye produkter tilføjes automatisk. Historiske data bevares.</p>
        </div>

        {/* Error */}
        {uploadError && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Import fejlede</p>
              <p className="text-xs text-destructive/80 mt-0.5">{uploadError}</p>
            </div>
            <button onClick={() => setUploadError(null)} className="text-destructive/60 hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success summary */}
        {summary && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Import gennemført</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground ml-6">
              <span>Produkter opdateret: <strong className="text-foreground">{summary.productsUpdated}</strong></span>
              <span>Produkter oprettet: <strong className="text-foreground">{summary.productsCreated}</strong></span>
              <span>Afkast opdateret: <strong className="text-foreground">{summary.returnsUpdated}</strong></span>
              <span>Afkast tilføjet: <strong className="text-foreground">{summary.returnsCreated}</strong></span>
            </div>
            {summary.yearColumns.length > 0 && (
              <p className="text-xs text-muted-foreground ml-6">
                Årskolonner behandlet: {summary.yearColumns[0]}–{summary.yearColumns[summary.yearColumns.length - 1]}
              </p>
            )}
            {summary.errors.length > 0 && (
              <div className="ml-6 mt-1">
                <p className="text-xs font-medium text-amber-600">Advarsler ({summary.errors.length}):</p>
                <ul className="text-xs text-amber-600/80 mt-0.5 space-y-0.5">
                  {summary.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
                  {summary.errors.length > 5 && <li>…og {summary.errors.length - 5} mere</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Return row (inline edit)
// -----------------------------------------------------------------------
function ReturnRow({
  productId,
  year,
  returnPct,
  onSaved,
  onDeleted,
}: {
  productId: number;
  year: number;
  returnPct: number;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(returnPct));
  const utils = trpc.useUtils();

  const upsert = trpc.returns.upsert.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      onSaved();
      setEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.returns.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      onDeleted();
    },
    onError: (e) => toast.error(e.message),
  });

  const pct = parseFloat(String(returnPct));
  const isPositive = pct >= 0;

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="w-12 text-sm font-medium text-muted-foreground">{year}</span>
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 w-28 text-sm"
          autoFocus
        />
        <span className="text-sm text-muted-foreground">%</span>
        <Button
          size="sm"
          variant="default"
          className="h-7 px-3 text-xs"
          onClick={() => upsert.mutate({ productId, year, returnPct: parseFloat(value) })}
          disabled={upsert.isPending}
        >
          Gem
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>
          Annuller
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 group">
      <span className="w-12 text-sm font-medium text-muted-foreground">{year}</span>
      <span className={`text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
        {isPositive ? "+" : ""}{pct.toFixed(2)}%
      </span>
      {isPositive ? (
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
      )}
      <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => del.mutate({ productId, year })}
          disabled={del.isPending}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function AddReturnRow({ productId, existingYears, onAdded }: { productId: number; existingYears: number[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [returnPct, setReturnPct] = useState("");
  const utils = trpc.useUtils();

  const upsert = trpc.returns.upsert.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      onAdded();
      setOpen(false);
      setReturnPct("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
        <Plus className="w-3 h-3" /> Tilføj år
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 border-t border-dashed border-border pt-2 mt-1">
      <Input
        type="number"
        placeholder="År"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="h-7 w-20 text-sm"
      />
      <Input
        type="number"
        step="0.01"
        placeholder="Afkast %"
        value={returnPct}
        onChange={(e) => setReturnPct(e.target.value)}
        className="h-7 w-28 text-sm"
        autoFocus
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button
        size="sm"
        variant="default"
        className="h-7 px-3 text-xs"
        onClick={() => upsert.mutate({ productId, year: parseInt(year), returnPct: parseFloat(returnPct) })}
        disabled={upsert.isPending || !returnPct}
      >
        Tilføj
      </Button>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>
        Annuller
      </Button>
    </div>
  );
}

// -----------------------------------------------------------------------
// Product card
// -----------------------------------------------------------------------
function ProductCard({ product, onEdit, onDelete }: { product: ProductWithReturns; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const sortedReturns = [...product.returns].sort((a, b) => a.year - b.year);
  const utils = trpc.useUtils();

  const avgReturn = sortedReturns.length > 0
    ? sortedReturns.reduce((s, r) => s + parseFloat(String(r.returnPct)), 0) / sortedReturns.length
    : null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: product.color }} />
            <div>
              <h3 className="font-semibold text-foreground text-base leading-tight">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {product.company && (
                  <span className="text-xs text-muted-foreground font-medium">{product.company}</span>
                )}
                {product.riskLevel && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {product.riskLevel}
                  </span>
                )}
                {product.yearsToPension != null && (
                  <span className="text-xs text-muted-foreground">{product.yearsToPension} år til pension</span>
                )}
                {product.aop && (
                  <span className="text-xs text-muted-foreground">ÅOP {parseFloat(product.aop).toFixed(2)}%</span>
                )}
              </div>
              {product.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {avgReturn !== null && (
              <Badge variant="secondary" className="text-xs font-medium">
                Ø {avgReturn >= 0 ? "+" : ""}{avgReturn.toFixed(1)}%/år
              </Badge>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {sortedReturns.length} {sortedReturns.length === 1 ? "år" : "år"} med data
            {sortedReturns.length > 0 && ` (${sortedReturns[0].year}–${sortedReturns[sortedReturns.length - 1].year})`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Skjul" : "Vis afkast"}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4 bg-muted/30">
          <div className="space-y-0.5">
            {sortedReturns.map((r) => (
              <ReturnRow
                key={r.year}
                productId={product.id}
                year={r.year}
                returnPct={parseFloat(String(r.returnPct))}
                onSaved={() => {}}
                onDeleted={() => {}}
              />
            ))}
          </div>
          <AddReturnRow
            productId={product.id}
            existingYears={sortedReturns.map((r) => r.year)}
            onAdded={() => {}}
          />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------
const ADMIN_PASSWORD = "Kakao467";
const ADMIN_HINT = "HotDrinkNumber";

export default function Products() {
  const { data: products, isLoading, refetch } = trpc.products.list.useQuery();
  const utils = trpc.useUtils();

  // ── Password gate ─────────────────────────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleUnlock = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setUnlocked(true);
    } else {
      setPwError(true);
    }
  };

  // ── All other state (must be declared before any early return) ───────────
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductWithReturns | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formCompany, setFormCompany] = useState("");
  const [formProductLine, setFormProductLine] = useState("");
  const [formRiskLevel, setFormRiskLevel] = useState("");
  const [formYearsToPension, setFormYearsToPension] = useState("");
  const [formAop, setFormAop] = useState("");
  const [formNhmId, setFormNhmId] = useState("");

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produkt oprettet");
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produkt opdateret");
      setEditProduct(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produkt slettet");
      setDeleteProductId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDeleteMutation = trpc.products.bulkDelete.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate();
      utils.products.listMeta.invalidate();
      toast.success(`${data.deleted} produkter slettet`);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!products) return;
    const allIds = (products as ProductWithReturns[]).map((p) => p.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormColor(PRESET_COLORS[0]);
    setFormCompany("");
    setFormProductLine("");
    setFormRiskLevel("");
    setFormYearsToPension("");
    setFormAop("");
    setFormNhmId("");
  };

  const openCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEdit = (p: ProductWithReturns) => {
    setFormName(p.name);
    setFormDescription(p.description ?? "");
    setFormColor(p.color);
    setFormCompany(p.company ?? "");
    setFormProductLine(p.productLine ?? "");
    setFormRiskLevel(p.riskLevel ?? "");
    setFormYearsToPension(p.yearsToPension != null ? String(p.yearsToPension) : "");
    setFormAop(p.aop != null ? String(parseFloat(p.aop)) : "");
    setFormNhmId(p.nhmId ?? "");
    setEditProduct(p);
  };

  const handleSave = () => {
    if (!formName.trim()) return toast.error("Navn er påkrævet");
    const yearsParsed = formYearsToPension.trim() !== "" ? parseInt(formYearsToPension) : undefined;
    const aopParsed = formAop.trim() !== "" ? parseFloat(formAop.replace(",", ".")) : undefined;
    if (editProduct) {
      updateMutation.mutate({
        id: editProduct.id,
        name: formName,
        description: formDescription || undefined,
        color: formColor,
        company: formCompany.trim() || undefined,
        productLine: formProductLine.trim() || undefined,
        riskLevel: formRiskLevel.trim() || undefined,
        yearsToPension: yearsParsed,
        aop: aopParsed,
        nhmId: formNhmId.trim() || undefined,
      });
    } else {
      createMutation.mutate({ name: formName, description: formDescription, color: formColor });
    }
  };

  const isDialogOpen = showCreateDialog || !!editProduct;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleUploadSuccess = () => {
    utils.products.list.invalidate();
    utils.products.listMeta.invalidate();
  };

  // ── Password gate early return (after all hooks) ────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-lg p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-base">Produkter – adgangskode</h2>
            </div>
            <button
              onClick={() => setShowHint((h) => !h)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Hjælp"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          {showHint && (
            <p className="text-xs text-muted-foreground italic">{ADMIN_HINT}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Denne side kræver en adgangskode for at beskytte produktdata.
          </p>
          <div className="space-y-2">
            <input
              type="password"
              value={pwInput}
              autoFocus
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Adgangskode"
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 ${
                pwError ? "border-destructive" : "border-border"
              }`}
            />
            {pwError && (
              <p className="text-xs text-destructive">Forkert adgangskode</p>
            )}
          </div>
          <Button className="w-full" onClick={handleUnlock}>
            Log ind
          </Button>
        </div>
      </div>
    );
  }

  const handleExportAll = () => {
    if (!products || products.length === 0) {
      toast.error("Ingen produkter at eksportere");
      return;
    }
    const rows: string[] = [];
    // Collect all years across all products
    const allYears = Array.from(
      new Set((products as ProductWithReturns[]).flatMap((p) => p.returns.map((r) => r.year)))
    ).sort((a, b) => a - b);

    // Header row
    rows.push(
      ["NHM_ID", "Name", "Company", "ProductLine", "Risk", "YearsToPension", "AOP", ...allYears].join(";")
    );

    // Data rows
    for (const p of products as ProductWithReturns[]) {
      const returnMap = new Map(p.returns.map((r) => [r.year, r.returnPct]));
      const yearValues = allYears.map((y) => {
        const v = returnMap.get(y);
        return v != null ? parseFloat(v).toFixed(2).replace(".", ",") : "";
      });
      rows.push(
        [
          p.nhmId ?? "",
          p.name,
          p.company ?? "",
          p.productLine ?? "",
          p.riskLevel ?? "",
          p.yearsToPension ?? "",
          p.aop != null ? parseFloat(p.aop).toFixed(2).replace(".", ",") : "",
          ...yearValues,
        ].join(";")
      );
    }

    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    const csv = bom + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produkter-afkast-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${(products as ProductWithReturns[]).length} produkter eksporteret`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Investeringsprodukter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administrer produkter og historiske årsafkast
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAll} className="gap-2" disabled={isLoading}>
            <Download className="w-4 h-4" />
            Hent alle
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nyt produkt
          </Button>
        </div>
      </div>

      {/* Excel upload panel */}
      <ExcelUploadPanel onSuccess={handleUploadSuccess} />

      {/* Product list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border h-24 animate-pulse" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Ingen produkter endnu</h3>
          <p className="text-sm text-muted-foreground mb-4">Opret dit første investeringsprodukt for at komme i gang</p>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Opret produkt
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bulk action toolbar */}
          <div className="flex items-center gap-3 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary cursor-pointer"
                checked={selectedIds.size === (products as ProductWithReturns[]).length && (products as ProductWithReturns[]).length > 0}
                onChange={toggleSelectAll}
              />
              <span className="text-xs text-muted-foreground">
                {selectedIds.size === 0
                  ? "Vælg alle"
                  : `${selectedIds.size} valgt`}
              </span>
            </label>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Slet valgte ({selectedIds.size})
              </Button>
            )}
          </div>
          {(products as ProductWithReturns[]).map((p) => (
            <div key={p.id} className="flex items-start gap-3">
              <div className="pt-5 pl-1 flex-shrink-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                  checked={selectedIds.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <ProductCard
                  product={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => setDeleteProductId(p.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setEditProduct(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Rediger produkt" : "Nyt investeringsprodukt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Produktnavn *</Label>
              <Input
                id="prod-name"
                placeholder="f.eks. PFA Middel"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-desc">Beskrivelse (valgfri)</Label>
              <Input
                id="prod-desc"
                placeholder="f.eks. Blandet portefølje med middel risiko"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            {/* Extra fields (edit only) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-company">Selskab</Label>
                <Input
                  id="prod-company"
                  placeholder="f.eks. PFA"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-line">Produktlinje</Label>
                <Input
                  id="prod-line"
                  placeholder="f.eks. LivsCyklus"
                  value={formProductLine}
                  onChange={(e) => setFormProductLine(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-risk">Risikoniveau</Label>
                <Input
                  id="prod-risk"
                  placeholder="f.eks. Moderat"
                  value={formRiskLevel}
                  onChange={(e) => setFormRiskLevel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-years">År til pension</Label>
                <Input
                  id="prod-years"
                  type="number"
                  placeholder="f.eks. 10"
                  value={formYearsToPension}
                  onChange={(e) => setFormYearsToPension(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-aop">ÅOP (%)</Label>
                <Input
                  id="prod-aop"
                  placeholder="f.eks. 0.75"
                  value={formAop}
                  onChange={(e) => setFormAop(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-nhm">NHM-ID</Label>
              <Input
                id="prod-nhm"
                placeholder="f.eks. PFACMOD10F0A"
                value={formNhmId}
                onChange={(e) => setFormNhmId(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Farve på graflinje</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      backgroundColor: c,
                      outline: formColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                      transform: formColor === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer border border-border"
                  title="Vælg brugerdefineret farve"
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formColor }} />
                <span className="text-xs text-muted-foreground font-mono">{formColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditProduct(null); resetForm(); }}>
              Annuller
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formName.trim()}>
              {isSaving ? "Gemmer..." : editProduct ? "Gem ændringer" : "Opret produkt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={(open) => { if (!open) setShowBulkDeleteConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet {selectedIds.size} produkter?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil permanent slette de valgte {selectedIds.size} produkter og alle tilhørende afkastdata. Handlingen kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Sletter..." : `Slet ${selectedIds.size} produkter`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => { if (!open) setDeleteProductId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet produkt?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil permanent slette produktet og alle tilhørende afkastdata. Handlingen kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && deleteMutation.mutate({ id: deleteProductId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
