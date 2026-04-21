import { useEffect } from "react";
import { useParkingData } from "@/hooks/useParkingData";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ParkingMap } from "@/components/dashboard/ParkingMap";
import { EntryExitCounter } from "@/components/dashboard/EntryExitCounter";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { PricingPanel } from "@/components/dashboard/PricingPanel";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DashboardOverview() {
  const data = useParkingData();
  const { user } = useAuth();

  // Save reservation to DB so user sees it in History/Reservations
  const handleReserve = async (id: number) => {
    data.reserveSpot(id);
    if (!user) return;
    const { error } = await supabase.from("reservations").insert({
      user_id: user.id,
      spot_number: id,
      status: "active",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    if (error) {
      toast.error("Réservation locale ok, mais sauvegarde échouée", { description: error.message });
    } else {
      toast.success(`Place P${id} réservée pour 5 min`);
    }
  };

  const handleCancel = async (id: number) => {
    data.cancelReservation(id);
    if (!user) return;
    await supabase
      .from("reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("spot_number", id)
      .eq("status", "active");
    toast.info(`Réservation P${id} annulée`);
  };

  // Auto-mark expired reservations in DB on each render
  useEffect(() => {
    if (!user) return;
    supabase
      .from("reservations")
      .update({ status: "expired" })
      .eq("user_id", user.id)
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());
  }, [data.spots, user]);

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
    </div>
  );
}
