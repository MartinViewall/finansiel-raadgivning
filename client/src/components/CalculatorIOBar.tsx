/**
 * CalculatorIOBar
 *
 * Toolbar with "Gem scenarie" and "Indlæs scenarie" buttons.
 * "Gem" opens a small dialog where the user can optionally enter a client name
 * before downloading. The file is named:
 *   scenarie-{klientnavn}-{dato}.json  (if name given)
 *   scenarie-{dato}.json               (if name omitted)
 */
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAllCalculatorsIO } from "@/hooks/useCalculatorIO";

export function CalculatorIOBar() {
  const { exportAll, triggerImportAll } = useAllCalculatorsIO();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");

  function handleSave() {
    exportAll(clientName.trim());
    setOpen(false);
    setClientName("");
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 text-xs"
          title="Gem alle beregnere til fil"
        >
          <Download className="h-3.5 w-3.5" />
          Gem scenarie
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={triggerImportAll}
          className="gap-1.5 text-xs"
          title="Indlæs alle beregnere fra fil"
        >
          <Upload className="h-3.5 w-3.5" />
          Indlæs scenarie
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Gem scenarie</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-name">Klientnavn (valgfrit)</Label>
              <Input
                id="client-name"
                placeholder="fx Hansen, Jens"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filen gemmes som{" "}
              <span className="font-mono">
                scenarie-
                {clientName.trim()
                  ? clientName
                      .trim()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-zA-Z0-9æøåÆØÅ\-_]/g, "")
                  : ""}
                {new Date().toISOString().slice(0, 10)}.json
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Annuller
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
