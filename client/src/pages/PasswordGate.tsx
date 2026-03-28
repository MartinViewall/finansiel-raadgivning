import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePasswordGate } from "@/contexts/PasswordGateContext";
import { Lock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGate() {
  const [password, setPassword] = useState("");
  const { unlock } = usePasswordGate();

  const verify = trpc.passwordGate.verify.useMutation({
    onSuccess: () => {
      unlock();
    },
    onError: (err) => {
      toast.error(err.message || "Forkert adgangskode");
      setPassword("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    verify.mutate({ password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.16_0.03_255)] via-[oklch(0.20_0.04_255)] to-[oklch(0.14_0.025_255)]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.92 0.008 240) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "oklch(0.82 0.12 85 / 0.15)", border: "1px solid oklch(0.82 0.12 85 / 0.3)" }}>
            <TrendingUp className="w-8 h-8" style={{ color: "oklch(0.82 0.12 85)" }} />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Finansiel Rådgivning
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.65 0.02 240)" }}>
            Internt rådgivningsværktøj
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: "oklch(1 0 0 / 0.04)",
            border: "1px solid oklch(1 0 0 / 0.1)",
            backdropFilter: "blur(20px)",
          }}>
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4" style={{ color: "oklch(0.65 0.02 240)" }} />
            <span className="text-sm font-medium" style={{ color: "oklch(0.65 0.02 240)" }}>
              Adgangskode påkrævet
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Indtast adgangskode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="h-12 text-base"
              style={{
                background: "oklch(1 0 0 / 0.06)",
                border: "1px solid oklch(1 0 0 / 0.15)",
                color: "white",
              }}
            />
            <Button
              type="submit"
              disabled={verify.isPending || !password.trim()}
              className="w-full h-12 text-base font-medium"
              style={{
                background: "oklch(0.82 0.12 85)",
                color: "oklch(0.16 0.03 255)",
              }}
            >
              {verify.isPending ? "Verificerer..." : "Log ind"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "oklch(0.45 0.015 240)" }}>
          Kun til intern brug · Uvildig Finansiel Rådgivning
        </p>
      </div>
    </div>
  );
}
