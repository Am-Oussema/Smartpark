import { useEffect, useState } from "react";
import { Loader2, Save, Car, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

const phoneSchema = z
  .string()
  .regex(/^\+216[0-9]{8}$/, "Format invalide — ex: +21620123456");

const plateSchema = z
  .string()
  .trim()
  .min(4, "Plaque trop courte")
  .max(20, "Plaque trop longue")
  .regex(/^[A-Z0-9 \-]+$/i, "Caractères invalides");

interface Vehicle {
  id: string;
  plate: string;
  label: string | null;
}

export default function Account() {
  const { user } = useAuth();

  // --- Profile ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const { profile, refetchProfile } = useProfile();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // --- Password ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // --- Vehicles ---
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select("id, plate, label")
        .eq("user_id", user.id)
        .order("created_at"),
    ]).then(([profile, vehiclesRes]) => {
      setFullName(profile.data?.full_name ?? "");
      setPhone(profile.data?.phone ?? "");
      setVehicles(vehiclesRes.data ?? []);
      setLoading(false);
    });
  }, [user]);

  // Save profile
  const onSaveProfile = async () => {
    if (!user) return;
    const phoneCheck = phoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      toast.error(phoneCheck.error.errors[0].message);
      return;
    }
    setSaving(true);

    // If phone changed, reset verification status
    const phoneChanged = phone.trim() !== (profile?.phone ?? "").trim();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        ...(phoneChanged && { phone_verified: false }),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      if (error.message.includes("profiles_phone_unique")) {
        toast.error("Numéro déjà utilisé", {
          description: "Ce numéro est lié à un autre compte.",
        });
        return;
      }
      toast.error("Échec de la mise à jour", { description: error.message });
      return;
    }

    if (phoneChanged) {
      // Clean up old unused verification codes
      await supabase
        .from("verification_codes")
        .delete()
        .eq("user_id", user.id)
        .eq("used", false);

      await refetchProfile();
      setOtpSent(false);
      setOtpCode("");
      toast.warning("Numéro mis à jour — vérifiez votre nouveau numéro", {
        description: "Votre accès aux réservations est suspendu jusqu'à vérification.",
        duration: 6000,
      });
    } else {
      toast.success("Profil mis à jour");
    }
  };
  const onSendOtp = async () => {
    if (!user) return;
    const phoneCheck = phoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      toast.error(phoneCheck.error.errors[0].message);
      return;
    }
    setSendingOtp(true);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous unused codes for this user
    await supabase
      .from("verification_codes")
      .delete()
      .eq("user_id", user.id)
      .eq("used", false);

    // Store new code
    const { error } = await supabase
      .from("verification_codes")
      .insert({
        user_id: user.id,
        phone,
        code,
      });

    setSendingOtp(false);

    if (error) {
      toast.error("Échec", { description: error.message });
      return;
    }

    setOtpSent(true);

    // DEV MODE — show code in toast until SMS provider is configured
    toast.success("Code généré", {
      description: `Votre code : xxxxxx`,
      duration: 10000,
    });
  };

  const onVerifyOtp = async () => {
    if (!user) return;
    setVerifyingOtp(true);

    // Find valid unused code for this user
    const { data, error } = await supabase
      .from("verification_codes")
      .select("id, code, expires_at, used")
      .eq("user_id", user.id)
      .eq("phone", phone)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setVerifyingOtp(false);
      toast.error("Code introuvable ou expiré — renvoyez un nouveau code");
      return;
    }

    if (data.code !== otpCode) {
      setVerifyingOtp(false);
      toast.error("Code incorrect");
      return;
    }

    // Mark code as used
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", data.id);

    // Mark phone as verified
    await supabase
      .from("profiles")
      .update({ phone_verified: true })
      .eq("id", user.id);

    setVerifyingOtp(false);
    setOtpSent(false);
    setOtpCode("");
    await refetchProfile();
    toast.success("Téléphone vérifié ✓", {
      description: "Vous pouvez maintenant réserver des places.",
    });
  };
  // Change password — re-authenticate first
  const onChangePassword = async () => {
    if (!user?.email) return;
    if (!currentPassword) {
      toast.error("Saisissez votre mot de passe actuel");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Minimum 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPassword(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (authError) {
      setSavingPassword(false);
      toast.error("Mot de passe actuel incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error("Échec", { description: error.message });
      return;
    }
    toast.success("Mot de passe mis à jour");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Add vehicle
  const onAddVehicle = async () => {
    if (!user) return;
    const plateCheck = plateSchema.safeParse(newPlate);
    if (!plateCheck.success) {
      toast.error(plateCheck.error.errors[0].message);
      return;
    }
    if (vehicles.length >= 2) {
      toast.error("Maximum 2 véhicules par compte");
      return;
    }
    setAddingVehicle(true);
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        user_id: user.id,
        plate: newPlate.trim().toUpperCase(),
        label: newLabel.trim() || null,
      })
      .select("id, plate, label")
      .single();
    setAddingVehicle(false);
    if (error) {
      if (error.message.includes("vehicles_plate_unique")) {
        toast.error("Plaque déjà enregistrée", {
          description: "Ce véhicule est actif.",
        });
        return;
      }
      toast.error("Échec", { description: error.message });
      return;
    }
    setVehicles((v) => [...v, data]);
    setNewPlate("");
    setNewLabel("");
    setShowVehicleForm(false);
    toast.success("Véhicule ajouté");
  };

  // Remove vehicle — hard delete
  const onRemoveVehicle = async (id: string) => {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Échec", { description: error.message });
      return;
    }
    setVehicles((v) => v.filter((vehicle) => vehicle.id !== id));
    toast.success("Véhicule supprimé");
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon compte</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles et vos véhicules.
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Informations personnelles</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              L'email ne peut pas être modifié.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
            />
          </div>
          {/* Phone field with verification */}
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="flex items-center gap-2">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+21620123456"
                maxLength={30}
                className="flex-1"
              />
              {profile?.phone_verified ? (
                <span className="flex-shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                  ✓ Vérifié
                </span>
              ) : (
                <span className="flex-shrink-0 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                  Non vérifié
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Format : +216 suivi de 8 chiffres
            </p>

            {/* OTP verification block — shown when phone not verified */}
            {!profile?.phone_verified && (
              <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
                {!otpSent ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onSendOtp}
                    disabled={sendingOtp || !phone}
                  >
                    {sendingOtp && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Envoyer le code de vérification
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Code reçu par SMS</Label>
                    <div className="flex gap-2">
                      <Input
                        id="otp"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        className="font-mono tracking-widest w-36"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={onVerifyOtp}
                        disabled={verifyingOtp || otpCode.length !== 6}
                        className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                      >
                        {verifyingOtp && (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        )}
                        Vérifier
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => { setOtpSent(false); setOtpCode(""); }}
                      >
                        Renvoyer
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Code envoyé au {phone}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={onSaveProfile}
            disabled={saving}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Password card */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Changer le mot de passe</h2>
        <div className="space-y-4">
          {(
            [
              {
                id: "currentPwd",
                label: "Mot de passe actuel",
                value: currentPassword,
                setter: setCurrentPassword,
                show: showCurrent,
                toggle: () => setShowCurrent((v) => !v),
              },
              {
                id: "newPwd",
                label: "Nouveau mot de passe",
                value: newPassword,
                setter: setNewPassword,
                show: showNew,
                toggle: () => setShowNew((v) => !v),
              },
              {
                id: "confirmPwd",
                label: "Confirmer le nouveau",
                value: confirmPassword,
                setter: setConfirmPassword,
                show: showConfirm,
                toggle: () => setShowConfirm((v) => !v),
              },
            ] as const
          ).map(({ id, label, value, setter, show, toggle }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <div className="relative">
                <Input
                  id={id}
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
          <Button
            onClick={onChangePassword}
            disabled={
              savingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            variant="outline"
          >
            {savingPassword && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Mettre à jour le mot de passe
          </Button>
        </div>
      </div>

      {/* Vehicles card */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Mes véhicules</h2>
            <p className="text-xs text-muted-foreground">
              Maximum 2 véhicules — la plaque sera liée à vos réservations.
            </p>
          </div>
          {vehicles.length < 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVehicleForm((v) => !v)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>

        {showVehicleForm && (
          <div className="mb-4 rounded-lg border border-dashed border-border p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="plate">Numéro de plaque</Label>
              <Input
                id="plate"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                placeholder="TUN 1234"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleLabel">
                Étiquette{" "}
                <span className="text-muted-foreground">(optionnel)</span>
              </Label>
              <Input
                id="vehicleLabel"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ma voiture, Voiture de ma femme…"
                maxLength={50}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onAddVehicle}
                disabled={addingVehicle || !newPlate}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {addingVehicle && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Confirmer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowVehicleForm(false);
                  setNewPlate("");
                  setNewLabel("");
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <Car className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun véhicule enregistré.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajoutez un véhicule pour pouvoir réserver une place.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-sm">
                      {v.plate}
                    </div>
                    {v.label && (
                      <div className="text-xs text-muted-foreground">
                        {v.label}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveVehicle(v.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}