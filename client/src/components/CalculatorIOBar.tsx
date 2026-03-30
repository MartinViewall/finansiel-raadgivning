/**
 * CalculatorIOBar
 *
 * A small toolbar with "Gem" (export) and "Indlæs" (import) buttons.
 * Drop this at the top of any calculator page.
 */
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onExport: () => void;
  onImport: () => void;
}

export function CalculatorIOBar({ onExport, onImport }: Props) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="gap-1.5 text-xs"
        title="Gem inputs til fil"
      >
        <Download className="h-3.5 w-3.5" />
        Gem
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onImport}
        className="gap-1.5 text-xs"
        title="Indlæs inputs fra fil"
      >
        <Upload className="h-3.5 w-3.5" />
        Indlæs
      </Button>
    </div>
  );
}
