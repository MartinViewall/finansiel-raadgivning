/**
 * CalculatorContext
 *
 * Shares the three core inputs (depot, annual contribution, horizon years)
 * between the Afkastberegner and Omkostningsberegner pages so the user
 * does not have to re-enter the same values.
 *
 * The Afkastberegner writes to this context whenever its inputs change.
 * The Omkostningsberegner reads from it as default values on mount.
 */
import { createContext, useContext, useState } from "react";

interface CalculatorSharedState {
  depot: number;
  annualContribution: number;
  horizonYears: number;
  setDepot: (v: number) => void;
  setAnnualContribution: (v: number) => void;
  setHorizonYears: (v: number) => void;
}

const CalculatorContext = createContext<CalculatorSharedState>({
  depot: 2_000_000,
  annualContribution: 100_000,
  horizonYears: 5,
  setDepot: () => {},
  setAnnualContribution: () => {},
  setHorizonYears: () => {},
});

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [depot, setDepot] = useState(2_000_000);
  const [annualContribution, setAnnualContribution] = useState(100_000);
  const [horizonYears, setHorizonYears] = useState(5);

  return (
    <CalculatorContext.Provider
      value={{ depot, annualContribution, horizonYears, setDepot, setAnnualContribution, setHorizonYears }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext() {
  return useContext(CalculatorContext);
}
