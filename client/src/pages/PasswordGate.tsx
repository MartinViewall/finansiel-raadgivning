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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(97%_0.006_60)] via-[oklch(94%_0.008_60)] to-[oklch(96%_0.005_60)]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, oklch(88% 0.008 60) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "oklch(72% 0.12 75 / 0.18)", border: "1px solid oklch(72% 0.12 75 / 0.35)" }}>
            <TrendingUp className="w-8 h-8" style={{ color: "oklch(72% 0.12 75)" }} />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Finansiel Rådgivning
          </h1>
          <p className="text-sm" style={{ color: "oklch(42% 0.01 60)" }}>
            Internt rådgivningsværktøj
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4" style={{ color: "oklch(42% 0.01 60)" }} />
            <span className="text-sm font-medium" style={{ color: "oklch(42% 0.01 60)" }}>
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
            />
            <Button
              type="submit"
              disabled={verify.isPending || !password.trim()}
              className="w-full h-12 text-base font-medium"
              style={{
                background: "oklch(72% 0.12 75)",
                color: "oklch(13% 0.005 60)",
              }}
            >
              {verify.isPending ? "Verificerer..." : "Log ind"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "oklch(42% 0.01 60)" }}>
          Kun til intern brug · Uvildig Finansiel Rådgivning
        </p>
      </div>
    </div>
  );
}
