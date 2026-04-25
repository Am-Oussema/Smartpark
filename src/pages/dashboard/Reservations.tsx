import { useCallback, useEffect, useState } from "react";
import { Loader2, X, Calendar, Pencil } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ReservationDialog,
  type ReservationDraft,
} from "@/components/dashboard/ReservationDialog";

interface Reservation {
  id: string;
  spot_number: number;
  status: string;
  reserved_at: string;
  start_time: string;
  end_time: string;
}

type Tab = "active" | "upcoming";

export default function Reservations() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [tick, setTick] = useState(0); // ← forces re-render every second

  const [editing, setEditing] = useState<ReservationDraft | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const nowIso = new Date().toISOString();

    let query = supabase
      .from("reservations")
      .select("id, spot_number, status, reserved_at, start_time, end_time")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("start_time", { ascending: true });

    if (tab === "active") {
      query = query.lte("start_time", nowIso).gt("end_time", nowIso);
    } else {
      query = query.gt("start_time", nowIso);
    }

    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, [user, tab]);

  useEffect(() => {
    load();
    const i = setInterval(load, 15_000);
    return () => clearInterval(i);
  }, [load]);
    const poll = setInterval(load, 10_000);
    return () => clearInterval(poll);
  }, [user]);

  // 1-second ticker — keeps countdown display live
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const cancel = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Réservation annulée");
    // Email best-effort
    supabase.functions
      .invoke("send-reservation-email", {
        body: { reservation_id: id, kind: "cancelled" },
      })
      .catch(() => {});
    load();
  };

  const openEdit = (r: Reservation) => {
    setEditing({
      id: r.id,
      spotNumber: r.spot_number,
      startTime: new Date(r.start_time),
      endTime: new Date(r.end_time),
    });
    setDialogOpen(true);
  };

  const heading = tab === "active" ? "Réservations en cours" : "Réservations à venir";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes réservations</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos places réservées : modifiez la plage horaire ou annulez.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-md px-4 py-1.5 text-sm transition ${
            tab === "active"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          En cours
        </button>
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`rounded-md px-4 py-1.5 text-sm transition ${
            tab === "upcoming"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          À venir
        </button>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-medium text-muted-foreground">{heading}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {tab === "active"
              ? "Aucune réservation en cours."
              : "Aucune réservation à venir."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Réservez une place depuis la vue d'ensemble.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const start = new Date(r.start_time);
            const end = new Date(r.end_time);
            const now = Date.now();
            const isCurrent = start.getTime() <= now && end.getTime() > now;

            let countdownLabel = "";
            if (isCurrent) {
              const remainingMs = end.getTime() - now;
              const min = Math.max(0, Math.floor(remainingMs / 60_000));
              const sec = Math.max(0, Math.floor((remainingMs % 60_000) / 1000));
              countdownLabel = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
            }

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
                    <div className="font-semibold">Place P{r.spot_number}</div>
                    <div className="text-xs text-muted-foreground">
                      Du {format(start, "PPPp", { locale: fr })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Au {format(end, "PPPp", { locale: fr })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Expire dans</div>
                      <div className="font-mono font-semibold tabular-nums text-reserved">
                        {countdownLabel}
                      </div>
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Modifier
                  </Button>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Expire dans</div>
                    <div className={`font-mono font-semibold tabular-nums ${remainingMs < 60_000 ? "text-destructive" : "text-reserved"}`}>
                      {String(remainingMin).padStart(2, "0")}:{String(remainingSec).padStart(2, "0")}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => cancel(r.id)}>
                    <X className="mr-1 h-3.5 w-3.5" /> Annuler
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReservationDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        mode="edit"
        reservation={editing ?? undefined}
        onSaved={() => load()}
      />
    </div>
  );
}
