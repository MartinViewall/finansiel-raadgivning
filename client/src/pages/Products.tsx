import { useState } from "react";
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
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";

const PRESET_COLORS = [
  "#1e3a5f", "#c9a84c", "#2e7d52", "#c0392b", "#7b3fa0",
  "#1a6b8a", "#d4813a", "#4a5568", "#2c7a7b", "#8b5e3c",
];

type ProductWithReturns = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  returns: { id: number; productId: number; year: number; returnPct: string; createdAt: Date }[];
};

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

export default function Products() {
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const utils = trpc.useUtils();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductWithReturns | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);

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

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormColor(PRESET_COLORS[0]);
  };

  const openCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEdit = (p: ProductWithReturns) => {
    setFormName(p.name);
    setFormDescription(p.description ?? "");
    setFormColor(p.color);
    setEditProduct(p);
  };

  const handleSave = () => {
    if (!formName.trim()) return toast.error("Navn er påkrævet");
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, name: formName, description: formDescription, color: formColor });
    } else {
      createMutation.mutate({ name: formName, description: formDescription, color: formColor });
    }
  };

  const isDialogOpen = showCreateDialog || !!editProduct;
  const isSaving = createMutation.isPending || updateMutation.isPending;

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
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nyt produkt
        </Button>
      </div>

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
          {(products as ProductWithReturns[]).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteProductId(p.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setEditProduct(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
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
