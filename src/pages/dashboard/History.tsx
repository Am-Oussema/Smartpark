import { useEffect, useState } from "react";
import { Loader2, History as HistoryIcon, Car } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Row {
  id: string;
  spot_number: number;
  status: string;
  plate: string | null;
  reserved_at: string;
  expires_at: string;
  cancelled_at: string | null;
  duration_min: number | null;
  amount_due: number | null;
  no_show: boolean;
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-reserved/15 text-reserved" },
  active: { label: "Active", cls: "bg-success/15 text-success" },
  expired: { label: "Expirée", cls: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", cls: "bg-destructive/15 text-destructive" },
  completed: { label: "Terminée", cls: "bg-primary/15 text-primary" },
};

export default function History() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("reservations")
        .select(
          "id, spot_number, status, plate, reserved_at, expires_at, cancelled_at, duration_min, amount_due, no_show"
        )
        .eq("user_id", user.id)
        .order("reserved_at", { ascending: false })
        .limit(50);
      setRows(data ?? []);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
        <p className="text-sm text-muted-foreground">
          Vos 50 dernières réservations.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <HistoryIcon className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucun historique pour le moment.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Place</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = statusLabel[r.status] ?? {
                  label: r.status,
                  cls: "bg-muted",
                };
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">
                      P{r.spot_number}
                    </td>
                    <td className="px-4 py-3">
                      {r.plate ? (
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{r.plate}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(r.reserved_at), "Pp", { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.duration_min != null
                        ? `${r.duration_min} min`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.amount_due != null ? (
                        <span className="font-medium">
                          {r.amount_due.toFixed(3)} TND
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}
                        >
                          {s.label}
                        </span>
                        {r.no_show && (
                          <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            No-show
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}