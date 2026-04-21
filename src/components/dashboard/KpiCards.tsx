import { CheckCircle2, XCircle, Activity } from "lucide-react";

interface Props {
  free: number;
  occupied: number;
  reserved: number;
  total: number;
  occupancyRate: number;
}

export function KpiCards({ free, occupied, reserved, total, occupancyRate }: Props) {
  const cards = [
    {
      label: "Places libres",
      value: free,
      sub: `sur ${total}`,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Places occupées",
      value: occupied + reserved,
      sub: reserved > 0 ? `dont ${reserved} réservées` : `sur ${total}`,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Taux d'occupation",
      value: `${occupancyRate}%`,
      sub: occupancyRate >= 80 ? "Élevé" : occupancyRate >= 50 ? "Modéré" : "Faible",
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-gradient-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-2 text-3xl font-bold">{c.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
