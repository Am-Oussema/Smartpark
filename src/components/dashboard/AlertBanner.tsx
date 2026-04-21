import { AlertTriangle } from "lucide-react";
import { BUSINESS_CONFIG } from "@/data/mockParking";

export function AlertBanner({ occupancyRate }: { occupancyRate: number }) {
  if (occupancyRate >= 100) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-destructive animate-pulse-soft">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">Parking complet</div>
          <div className="text-xs opacity-80">
            Aucune place disponible. Refusez les nouvelles entrées ou redirigez les conducteurs.
          </div>
        </div>
      </div>
    );
  }
  if (occupancyRate >= BUSINESS_CONFIG.alertThreshold) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-warning bg-warning/10 p-4 text-warning">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">Occupation critique : {occupancyRate}%</div>
          <div className="text-xs opacity-90">
            Le seuil de {BUSINESS_CONFIG.alertThreshold}% est dépassé. Tarification dynamique activée.
          </div>
        </div>
      </div>
    );
  }
  return null;
}
