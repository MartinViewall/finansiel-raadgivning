import { createContext, useContext, useState, ReactNode } from "react";

const SESSION_KEY = "fr_unlocked";

interface PasswordGateContextValue {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const PasswordGateContext = createContext<PasswordGateContextValue | null>(null);

export function PasswordGateProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  const unlock = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setIsUnlocked(true);
  };

  const lock = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setIsUnlocked(false);
  };

  return (
    <PasswordGateContext.Provider value={{ isUnlocked, unlock, lock }}>
      {children}
    </PasswordGateContext.Provider>
  );
}

export function usePasswordGate(): PasswordGateContextValue {
  const ctx = useContext(PasswordGateContext);
  if (!ctx) throw new Error("usePasswordGate must be used within PasswordGateProvider");
  return ctx;
}
