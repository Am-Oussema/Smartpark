import { useEffect, useState } from "react";
import {
  Settings2, Save, Loader2, Users,
  ShieldCheck, ShieldOff, Phone,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Settings {
  base_price: number;
  surge_threshold: number;
  surge_multiplier: number;
  alert_threshold: number;
}

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean;
  trust_score: number;
  daily_res_count: number;
  created_at: string;
  role: string;
}

type Tab = "pricing" | "users";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("pricing");

  // ── Pricing ───────────────────────────────────────────
  const [settings, setSettings] = useState<Settings>({
    base_price: 2,
    surge_threshold: 70,
    surge_multiplier: 1.2,
    alert_threshold: 80,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
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
        setLoadingSettings(false);
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

  // ── Users ─────────────────────────────────────────────
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    setLoadingUsers(true);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, phone, phone_verified, trust_score, daily_res_count, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur", { description: error.message });
      setLoadingUsers(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const mapped: UserRow[] = (profiles ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      phone_verified: u.phone_verified,
      trust_score: u.trust_score,
      daily_res_count: u.daily_res_count,
      created_at: u.created_at,
      role: roles?.find((r) => r.user_id === u.id)?.role ?? "user",
    }));

    setUsers(mapped);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const trustColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-primary";
    if (score >= 25) return "text-amber-500";
    return "text-destructive";
  };

  const trustLabel = (score: number) => {
    if (score >= 80) return "Fiable";
    if (score >= 50) return "Normal";
    if (score >= 25) return "Prudent";
    return "Restreint";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">
          Gérez la tarification et les utilisateurs.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        <button
          onClick={() => setTab("pricing")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "pricing"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Settings2 className="h-4 w-4" />
          Tarification
        </button>
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "users"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Users className="h-4 w-4" />
          Utilisateurs
        </button>
      </div>

      {/* ── PRICING TAB ── */}
      {tab === "pricing" && (
        <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
          {loadingSettings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Paramètres de tarification</h3>
                  <p className="text-xs text-muted-foreground">
                    Modifiez les règles business en direct.
                  </p>
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
                      setSettings((s) => ({
                        ...s,
                        base_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seuil de surge</Label>
                    <span className="text-sm font-semibold text-primary">
                      {settings.surge_threshold}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.surge_threshold]}
                    onValueChange={([v]) =>
                      setSettings((s) => ({ ...s, surge_threshold: v }))
                    }
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
                    onValueChange={([v]) =>
                      setSettings((s) => ({ ...s, surge_multiplier: v }))
                    }
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
                    <span className="text-sm font-semibold text-primary">
                      {settings.alert_threshold}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.alert_threshold]}
                    onValueChange={([v]) =>
                      setSettings((s) => ({ ...s, alert_threshold: v }))
                    }
                    min={50} max={95} step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Notification dès que l'occupation dépasse {settings.alert_threshold}%.
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
            </>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <Input
            placeholder="Rechercher par nom, email ou téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Confiance</th>
                    <th className="px-4 py-3">Rés. aujourd'hui</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr
                        key={u.id}
                        className="border-t border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{u.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs">{u.phone || "—"}</span>
                            {u.phone && (
                              u.phone_verified ? (
                                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <ShieldOff className="h-3.5 w-3.5 text-destructive" />
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-semibold ${trustColor(u.trust_score)}`}>
                            {u.trust_score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trustLabel(u.trust_score)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {u.daily_res_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "admin"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {u.role === "admin" ? "Admin" : "Utilisateur"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {format(new Date(u.created_at), "dd MMM yyyy", { locale: fr })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
            {search ? " trouvé" + (filtered.length !== 1 ? "s" : "") : " au total"}
          </p>
        </div>
      )}
    </div>
  );
}