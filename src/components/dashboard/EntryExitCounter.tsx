import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  entries: number;
  exits: number;
  onEntry: () => void;
  onExit: () => void;
}

export function EntryExitCounter({ entries, exits, onEntry, onExit }: Props) {
  return (
    <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Compteur entrée / sortie</h3>
        <p className="text-xs text-muted-foreground">
          Simulé maintenant — relié aux capteurs IR plus tard
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-muted-foreground">Entrées</span>
            <ArrowDownToLine className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">{entries}</div>
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onEntry}>
            Simuler entrée
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-muted-foreground">Sorties</span>
            <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">{exits}</div>
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onExit}>
            Simuler sortie
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Voitures actuellement à l'intérieur</span>
        <span className="font-bold tabular-nums">{Math.max(0, entries - exits)}</span>
      </div>
    </div>
  );
}
