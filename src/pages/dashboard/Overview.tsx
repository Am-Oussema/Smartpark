import { useState } from "react";
import { useParkingData } from "@/hooks/useParkingData";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ParkingMap } from "@/components/dashboard/ParkingMap";
import { EntryExitCounter } from "@/components/dashboard/EntryExitCounter";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { PricingPanel } from "@/components/dashboard/PricingPanel";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Car, Loader2 } from "lucide-react";

export default function DashboardOverview() {
  const data = useParkingData();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [reserving, setReserving] = useState(false);

  // Vehicle selector state
  const [pendingSpotId, setPendingSpotId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<
    { id: string; plate: string; label: string | null }[]
  >([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const canReserve = profile?.phone_verified === true;

  const handleReserve = async (spotId: number) => {
    if (!canReserve) {
      toast.warning("Téléphone non vérifié", {
        description: "Vérifiez votre numéro dans Mon compte pour réserver.",
      });
      return;
    }
    if (!user) return;
    setReserving(true);

    // Fetch user vehicles
    const { data: userVehicles } = await supabase
      .from("vehicles")
      .select("id, plate, label")
      .eq("user_id", user.id)
      .order("created_at");

    setReserving(false);

    if (!userVehicles || userVehicles.length === 0) {
      toast.error("Aucun véhicule enregistré", {
        description: "Ajoutez un véhicule dans Mon compte pour réserver.",
      });
      return;
    }

    if (userVehicles.length === 1) {
      // Only one vehicle — reserve directly
      await callReserve(spotId, userVehicles[0].id);
    } else {
      // Two vehicles — show selector
      setVehicles(userVehicles);
      setPendingSpotId(spotId);
      setShowVehicleModal(true);
    }
  };

  const callReserve = async (spotId: number, vehicleId: string) => {
    setReserving(true);
    setShowVehicleModal(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Session expirée — reconnectez-vous");
        setReserving(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reserve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ spot_id: spotId, vehicle_id: vehicleId }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? "Réservation échouée");
        setReserving(false);
        return;
      }

      toast.success(`Place P${spotId} réservée — 15 min pour arriver`, {
        description: `Véhicule : ${result.reservation.plate}`,
      });
    } catch {
      toast.error("Erreur réseau — réessayez");
    }

    setReserving(false);
    setPendingSpotId(null);
  };

  const handleCancel = async (spotId: number) => {
    if (!user) return;
    // Find the reservation id
    const { data: res } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", user.id)
      .eq("spot_number", spotId)
      .eq("status", "pending")
      .maybeSingle();

    if (!res) {
      toast.error("Réservation introuvable");
      return;
    }

    const { error } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", res.id);

    if (error) {
      toast.error("Échec de l'annulation", { description: error.message });
      return;
    }

    toast.info(`Réservation P${spotId} annulée`);
    // Spot freed automatically by DB trigger
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground">
          État du parking en temps réel et indicateurs business clés.
        </p>
      </div>

      <AlertBanner occupancyRate={data.occupancyRate} />

      <KpiCards
        free={data.free}
        occupied={data.occupied}
        reserved={data.reserved}
        total={data.total}
        occupancyRate={data.occupancyRate}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ParkingMap
            spots={data.spots}
            onReserve={handleReserve}
            onCancelReservation={handleCancel}
            canReserve={canReserve && !reserving}
          />
        </div>
        <EntryExitCounter
          entries={data.entries}
          exits={data.exits}
          onEntry={data.simulateEntry}
          onExit={data.simulateExit}
        />
      </div>

      <AnalyticsCharts />

      <PricingPanel
        occupancyRate={data.occupancyRate}
        basePrice={data.currentPrice.base}
        currentPrice={data.currentPrice.current}
        surge={data.currentPrice.surge}
      />

      {/* Vehicle selector modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <h2 className="mb-1 text-lg font-semibold">Choisir un véhicule</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Sélectionnez le véhicule pour la place P{pendingSpotId}
            </p>
            <div className="space-y-3">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => callReserve(pendingSpotId!, v.id)}
                  disabled={reserving}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold">
                      {v.plate}
                    </div>
                    {v.label && (
                      <div className="text-xs text-muted-foreground">
                        {v.label}
                      </div>
                    )}
                  </div>
                  {reserving && (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => {
                setShowVehicleModal(false);
                setPendingSpotId(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}