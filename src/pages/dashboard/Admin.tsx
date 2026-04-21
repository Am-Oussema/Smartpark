import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Admin() {
  const [basePrice, setBasePrice] = useState(2);
  const [surgeThreshold, setSurgeThreshold] = useState([70]);
  const [surgeMultiplier, setSurgeMultiplier] = useState([1.2]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin — Tarification</h1>
        <p className="text-sm text-muted-foreground">
          Configurez la tarification dynamique du parking (simulation).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Paramètres de tarification</h3>
            <p className="text-xs text-muted-foreground">Modifiez les règles business en direct.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Tarif de base (TND / heure)</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.5"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Seuil de surge</Label>
              <span className="text-sm font-semibold text-primary">{surgeThreshold[0]}%</span>
            </div>
            <Slider
              value={surgeThreshold}
              onValueChange={setSurgeThreshold}
              min={30}
              max={95}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Au-delà de {surgeThreshold[0]}% d'occupation, le tarif augmente.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Coefficient de surge</Label>
              <span className="text-sm font-semibold text-primary">×{surgeMultiplier[0].toFixed(2)}</span>
            </div>
            <Slider
              value={surgeMultiplier}
              onValueChange={setSurgeMultiplier}
              min={1}
              max={2}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Tarif de surge : <strong>{(basePrice * surgeMultiplier[0]).toFixed(2)} TND/h</strong>
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
          💡 Cette page est une simulation visuelle. Les valeurs ne sont pas persistées —
          dans la version finale, elles seraient sauvegardées dans la base et appliquées au calcul de prix.
        </div>
      </div>
    </div>
  );
}
