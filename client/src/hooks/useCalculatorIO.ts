/**
 * useCalculatorIO
 *
 * Shared hook that provides exportData / importData helpers for all calculators.
 * Each calculator passes its own data object and a setter callback.
 *
 * Export: serialises data to a JSON file and triggers a browser download.
 * Import: opens a file picker, reads the JSON, validates the type field,
 *         then calls the provided setter.
 */
import { useRef } from "react";
import { toast } from "sonner";

export type CalculatorType = "afkast" | "omkostning" | "maal" | "kapacitet";

interface IOOptions<T extends object> {
  /** Which calculator this belongs to — used for filename and validation */
  type: CalculatorType;
  /** Current state to export */
  getData: () => T;
  /** Called with the parsed data on successful import */
  onImport: (data: T) => void;
}

const LABELS: Record<CalculatorType, string> = {
  afkast: "afkast",
  omkostning: "omkostning",
  maal: "maal",
  kapacitet: "kapacitet",
};

export function useCalculatorIO<T extends object>({ type, getData, onImport }: IOOptions<T>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function exportData() {
    const payload = { _type: type, _version: 1, ...getData() };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${LABELS[type]}-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data gemt som JSON-fil");
  }

  function triggerImport() {
    // Create a hidden file input on demand
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.style.display = "none";
      input.addEventListener("change", handleFile);
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.value = ""; // reset so same file can be re-imported
    fileInputRef.current.click();
  }

  function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (raw._type !== type) {
          toast.error(`Forkert fil — forventede en "${LABELS[type]}"-fil`);
          return;
        }
        const { _type: _t, _version: _v, ...data } = raw;
        onImport(data as T);
        toast.success("Data indlæst");
      } catch {
        toast.error("Kunne ikke læse filen — kontroller at det er en gyldig JSON-fil");
      }
    };
    reader.readAsText(file);
  }

  return { exportData, triggerImport };
}
