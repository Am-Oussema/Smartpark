import { TrendingUp, DollarSign } from "lucide-react";
import { BUSINESS_CONFIG } from "@/data/mockParking";

interface Props {
  occupancyRate: number;
  basePrice: number;
  currentPrice: number;
  surge: boolean;
}

export function PricingPanel({ occupancyRate, basePrice, currentPrice, surge }: Props) {
  return (
    <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tarification dynamique</h3>
          <p className="text-xs text-muted-foreground">
            Le tarif augmente automatiquement au-delà de {BUSINESS_CONFIG.surgeThreshold}% d'occupation
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            surge ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
          }`}
        >
          {surge ? <TrendingUp className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tarif de base" value={`${basePrice.toFixed(2)} TND/h`} />
        <Stat
          label="Tarif actuel"
          value={`${currentPrice.toFixed(2)} TND/h`}
          accent={surge ? "warning" : "success"}
        />
        <Stat label="Occupation" value={`${occupancyRate}%`} />
      </div>

      <div className="mt-4 rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
        {surge ? (
          <>
            🔥 Tarif majoré de <strong>+{Math.round((BUSINESS_CONFIG.surgeMultiplier - 1) * 100)}%</strong>{" "}
            (occupation ≥ {BUSINESS_CONFIG.surgeThreshold}%)
          </>
        ) : (
          <>
            Tarif standard. Le surge se déclenchera à {BUSINESS_CONFIG.surgeThreshold}% d'occupation.
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warning" | "success";
}) {
  const color =
    accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
