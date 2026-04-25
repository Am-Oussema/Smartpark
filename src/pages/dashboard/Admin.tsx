import { useEffect, useState } from "react";
import { Settings2, Save, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Settings {
  base_price: number;
  surge_threshold: number;
  surge_multiplier: number;
  alert_threshold: number;
}

export default function Admin() {
  const [settings, setSettings] = useState<Settings>({
    base_price: 2,
    surge_threshold: 70,
    surge_multiplier: 1.2,
    alert_threshold: 80,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("base_price, surge_threshold, surge_multiplier, alert_threshold")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error("Erreur de chargement", { description: error.message });
        if (data) setSettings(data);
        setLoading(false);
      });
  }, []);

  const onSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({
        base_price: settings.base_price,
        surge_threshold: settings.surge_threshold,
        surge_multiplier: settings.surge_multiplier,
        alert_threshold: settings.alert_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("Échec de la sauvegarde", { description: error.message });
      return;
    }
    toast.success("Paramètres sauvegardés");
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin — Tarification</h1>
        <p className="text-sm text-muted-foreground">
          Configurez la tarification dynamique du parking.
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
              value={settings.base_price}
              onChange={(e) =>
                setSettings((s) => ({ ...s, base_price: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Seuil de surge</Label>
              <span className="text-sm font-semibold text-primary">{settings.surge_threshold}%</span>
            </div>
            <Slider
              value={[settings.surge_threshold]}
              onValueChange={([v]) => setSettings((s) => ({ ...s, surge_threshold: v }))}
              min={30} max={95} step={5}
            />
            <p className="text-xs text-muted-foreground">
              Au-delà de {settings.surge_threshold}% d'occupation, le tarif augmente.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Coefficient de surge</Label>
              <span className="text-sm font-semibold text-primary">
                ×{settings.surge_multiplier.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.surge_multiplier]}
              onValueChange={([v]) => setSettings((s) => ({ ...s, surge_multiplier: v }))}
              min={1} max={2} step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Tarif de surge :{" "}
              <strong>
                {(settings.base_price * settings.surge_multiplier).toFixed(2)} TND/h
              </strong>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Seuil d'alerte</Label>
              <span className="text-sm font-semibold text-primary">{settings.alert_threshold}%</span>
            </div>
            <Slider
              value={[settings.alert_threshold]}
              onValueChange={([v]) => setSettings((s) => ({ ...s, alert_threshold: v }))}
              min={50} max={95} step={5}
            />
            <p className="text-xs text-muted-foreground">
              Notification toast dès que l'occupation dépasse {settings.alert_threshold}%.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
}