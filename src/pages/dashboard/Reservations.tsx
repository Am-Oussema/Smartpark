import { useEffect, useState } from "react";
import { Loader2, X, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Reservation {
  id: string;
  spot_number: number;
  plate: string | null;
  status: string;
  reserved_at: string;
  expires_at: string;
}

export default function Reservations() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch pending reservations
    const { data, error } = await supabase
      .from("reservations")
      .select("id, spot_number, plate, status, reserved_at, expires_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("reserved_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Fetch expires_at from parking_spots (single source of truth)
    const spotIds = data.map((r) => r.spot_number);
    const { data: spotsData } = await supabase
      .from("parking_spots")
      .select("id, expires_at")
      .in("id", spotIds);

    // Merge — use parking_spots.expires_at over reservations.expires_at
    const merged = data.map((r) => {
      const spot = spotsData?.find((s) => s.id === r.spot_number);
      return {
        ...r,
        expires_at: spot?.expires_at ?? r.expires_at,
      };
    });

    setItems(merged.filter((r) => new Date(r.expires_at).getTime() > Date.now()));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 10_000);
    return () => clearInterval(poll);
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const cancel = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Réservation annulée");
    // Spot freed automatically by DB trigger
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Mes réservations actives
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos places réservées en cours.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune réservation active.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Réservez une place depuis la vue d'ensemble.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const remainingMs =
              new Date(r.expires_at).getTime() - Date.now();
            const remainingMin = Math.max(
              0,
              Math.floor(remainingMs / 60_000)
            );
            const remainingSec = Math.max(
              0,
              Math.floor((remainingMs % 60_000) / 1000)
            );
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-reserved/40 bg-reserved/5 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-reserved/15 text-lg font-bold text-reserved">
                    P{r.spot_number}
                  </div>
                  <div>
                    <div className="font-semibold">
                      Place P{r.spot_number}
                    </div>
                    {r.plate && (
                      <div className="font-mono text-xs font-medium text-primary">
                        {r.plate}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Réservée{" "}
                      {format(new Date(r.reserved_at), "PPPp", {
                        locale: fr,
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Temps restant
                    </div>
                    <div
                      className={`font-mono font-semibold tabular-nums ${remainingMs < 60_000
                        ? "text-destructive"
                        : "text-reserved"
                        }`}
                    >
                      {String(remainingMin).padStart(2, "0")}:
                      {String(remainingSec).padStart(2, "0")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancel(r.id)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Annuler
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}