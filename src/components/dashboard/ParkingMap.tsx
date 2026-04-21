import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParkingSpot } from "@/data/mockParking";

interface Props {
  spots: ParkingSpot[];
  onReserve: (id: number) => void;
  onCancelReservation: (id: number) => void;
}

function getRemainingSeconds(reservedUntil?: number) {
  if (!reservedUntil) return 0;
  return Math.max(0, Math.floor((reservedUntil - Date.now()) / 1000));
}

export function ParkingMap({ spots, onReserve, onCancelReservation }: Props) {
  return (
    <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Carte parking</h2>
          <p className="text-xs text-muted-foreground">État en direct des places</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Legend color="success" label="Libre" />
          <Legend color="destructive" label="Occupée" />
          <Legend color="reserved" label="Réservée" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {spots.map((spot) => {
          const remaining = getRemainingSeconds(spot.reservedUntil);
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;

          const styles =
            spot.status === "free"
              ? "border-success/40 bg-success/10 text-success"
              : spot.status === "occupied"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-reserved/40 bg-reserved/10 text-reserved";

          return (
            <div
              key={spot.id}
              className={`relative flex flex-col items-center justify-between rounded-lg border-2 p-4 transition-all ${styles}`}
            >
              <div className="flex h-20 w-full items-center justify-center">
                {spot.status === "occupied" ? (
                  <Car className="h-12 w-12" />
                ) : (
                  <span className="text-3xl font-bold">P{spot.id}</span>
                )}
              </div>

              <div className="mt-2 w-full text-center">
                <div className="text-xs font-medium uppercase tracking-wide">
                  {spot.status === "free" ? "Libre" : spot.status === "occupied" ? "Occupée" : "Réservée"}
                </div>

                {spot.status === "reserved" && (
                  <div className="mt-1 font-mono text-sm tabular-nums">
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </div>
                )}

                {spot.status === "free" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 w-full text-xs"
                    onClick={() => onReserve(spot.id)}
                  >
                    Réserver
                  </Button>
                )}

                {spot.status === "reserved" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-7 w-full text-xs"
                    onClick={() => onCancelReservation(spot.id)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: "success" | "destructive" | "reserved"; label: string }) {
  const cls =
    color === "success"
      ? "bg-success"
      : color === "destructive"
      ? "bg-destructive"
      : "bg-reserved";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
