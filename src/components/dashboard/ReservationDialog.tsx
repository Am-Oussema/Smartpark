import {useEffect, useMemo, useRef, useState} from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface ReservationDraft {
  id?: string;
  spotNumber: number;
  startTime: Date;
  endTime: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  // Pour la création : la place choisie (et éventuellement la liste des libres)
  availableSpots?: number[];
  initialSpot?: number;
  // Pour l'édition : la réservation existante
  reservation?: ReservationDraft;
  // Callback après succès (création ou modification)
  onSaved?: (saved: ReservationDraft & { id: string }) => void;
}

const DURATION_PRESETS = [
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 heure", minutes: 60 },
  { label: "2 heures", minutes: 120 },
  { label: "4 heures", minutes: 240 },
];

const schema = z
  .object({
    spotNumber: z.number().int().min(1, "Place invalide"),
    startTime: z.date(),
    endTime: z.date(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endTime"],
  })
  .refine((v) => v.startTime.getTime() >= Date.now() - 60_000, {
    message: "La date de début ne peut pas être dans le passé.",
    path: ["startTime"],
  })
  .refine((v) => v.endTime.getTime() - v.startTime.getTime() <= 24 * 60 * 60 * 1000, {
    message: "La durée maximale est de 24 heures.",
    path: ["endTime"],
  })
  .refine((v) => v.endTime.getTime() - v.startTime.getTime() >= 5 * 60 * 1000, {
    message: "La durée minimale est de 5 minutes.",
    path: ["endTime"],
  });

function roundToNext5Min(date: Date) {
  const d = new Date(date);
  const ms = 5 * 60 * 1000;
  d.setSeconds(0, 0);
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

export function ReservationDialog({
  open,
  onOpenChange,
  mode,
  availableSpots = [],
  initialSpot,
  reservation,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const initialized = useRef(false);

  const [spotNumber, setSpotNumber] = useState<number>(
    reservation?.spotNumber ?? initialSpot ?? availableSpots[0] ?? 0,
  );
  const [startTime, setStartTime] = useState<Date>(
    reservation?.startTime ?? roundToNext5Min(new Date()),
  );
  const [endTime, setEndTime] = useState<Date>(
    reservation?.endTime ??
      new Date(roundToNext5Min(new Date()).getTime() + 30 * 60 * 1000),
  );
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

    useEffect(() => {
        if (open && !initialized.current) {
            setSpotNumber(reservation?.spotNumber ?? initialSpot ?? availableSpots[0] ?? 0);
            const s = reservation?.startTime ?? roundToNext5Min(new Date());
            setStartTime(s);
            setEndTime(reservation?.endTime ?? new Date(s.getTime() + 30 * 60 * 1000));
            initialized.current = true;
        } else if (!open) {
            // 2. Reset the flag when the dialog closes so it re-initializes next time
            initialized.current = false;
            setConflictError(null);
        }
    }, [open]);

  const durationMinutes = useMemo(
    () => Math.round((endTime.getTime() - startTime.getTime()) / 60_000),
    [startTime, endTime],
  );

  const applyDurationPreset = (minutes: number) => {
    setEndTime(new Date(startTime.getTime() + minutes * 60_000));
  };

  const handleSubmit = async () => {
    setConflictError(null);

    if (!user) {
      toast.error("Vous devez être connecté.");
      return;
    }

    const parsed = schema.safeParse({ spotNumber, startTime, endTime });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    // Pré-vérification client des conflits (utile pour un feedback immédiat).
    const { data: conflicts, error: preErr } = await supabase
      .from("reservations")
      .select("id")
      .eq("spot_number", spotNumber)
      .eq("status", "active")
      .lt("start_time", endTime.toISOString())
      .gt("end_time", startTime.toISOString());

    if (preErr) {
      setSubmitting(false);
      toast.error("Erreur de vérification", { description: preErr.message });
      return;
    }

    const clashing = (conflicts ?? []).filter((c) => c.id !== reservation?.id);
    if (clashing.length > 0) {
      setSubmitting(false);
      setConflictError(
        "Cette place est déjà réservée sur une partie de la plage horaire choisie.",
      );
      return;
    }

    let savedId = reservation?.id;
    let kind: "created" | "updated" = "created";

    if (mode === "edit" && reservation?.id) {
      kind = "updated";
      const { error } = await supabase
        .from("reservations")
        .update({
          spot_number: spotNumber,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        .eq("id", reservation.id);

      if (error) {
        setSubmitting(false);
        if (error.message.toLowerCase().includes("exclude") || error.code === "23P01") {
          setConflictError(
            "Conflit détecté : cette plage horaire chevauche une autre réservation active.",
          );
        } else {
          toast.error("Échec de la mise à jour", { description: error.message });
        }
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          spot_number: spotNumber,
          status: "active",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        .select("id")
        .single();

      if (error || !data) {
        setSubmitting(false);
        if (error && (error.message.toLowerCase().includes("exclude") || error.code === "23P01")) {
          setConflictError(
            "Conflit détecté : cette plage horaire chevauche une autre réservation active.",
          );
        } else {
          toast.error("Échec de la réservation", {
            description: error?.message ?? "Erreur inconnue",
          });
        }
        return;
      }
      savedId = data.id;
    }

    // Envoi d'email de confirmation — best-effort, n'échoue jamais le flux
    if (savedId) {
      supabase.functions
        .invoke("send-reservation-email", {
          body: { reservation_id: savedId, kind },
        })
        .catch((err) => console.warn("Email confirmation failed", err));
    }

    setSubmitting(false);
    toast.success(
      mode === "edit" ? "Réservation mise à jour" : `Place P${spotNumber} réservée`,
    );
    onOpenChange(false);

    if (savedId && onSaved) {
      onSaved({ id: savedId, spotNumber, startTime, endTime });
    }
  };

  const spotOptions = useMemo(() => {
    const set = new Set<number>(availableSpots);
    if (reservation?.spotNumber) set.add(reservation.spotNumber);
    if (initialSpot) set.add(initialSpot);
    return Array.from(set).sort((a, b) => a - b);
  }, [availableSpots, reservation, initialSpot]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Modifier la réservation" : "Réserver une place"}
          </DialogTitle>
          <DialogDescription>
            Choisissez la place et la plage horaire souhaitée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spot-select">Place</Label>
            <Select
              value={String(spotNumber)}
              onValueChange={(v) => setSpotNumber(Number(v))}
              disabled={mode === "edit" ? false : spotOptions.length <= 1}
            >
              <SelectTrigger id="spot-select">
                <SelectValue placeholder="Choisir une place" />
              </SelectTrigger>
              <SelectContent>
                {spotOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Place P{n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateTimePicker
            label="Début"
            value={startTime}
            onChange={(v) => {
              setStartTime(v);
              if (endTime <= v) {
                setEndTime(new Date(v.getTime() + 30 * 60 * 1000));
              }
            }}
            minDate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
            disabled={submitting}
          />

          <DateTimePicker
            label="Fin"
            value={endTime}
            onChange={setEndTime}
            minDate={startTime}
            disabled={submitting}
          />

          <div className="space-y-2">
            <Label>Durée rapide</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((p) => (
                <Button
                  key={p.minutes}
                  type="button"
                  variant={durationMinutes === p.minutes ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyDurationPreset(p.minutes)}
                  disabled={submitting}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Durée actuelle :{" "}
              <strong>
                {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}min
              </strong>
            </p>
          </div>

          {conflictError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{conflictError}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? "Enregistrer" : "Confirmer la réservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
