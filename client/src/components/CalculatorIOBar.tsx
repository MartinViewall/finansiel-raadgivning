/**
 * CalculatorIOBar
 *
 * A small toolbar with "Gem scenarie" and "Indlæs scenarie" buttons.
 * Saves/loads ALL four calculators in one JSON file via useAllCalculatorsIO.
 * Drop this anywhere — it reads/writes the shared CalculatorContext directly.
 */
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllCalculatorsIO } from "@/hooks/useCalculatorIO";

export function CalculatorIOBar() {
  const { exportAll, triggerImportAll } = useAllCalculatorsIO();
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={exportAll}
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
  );
}
