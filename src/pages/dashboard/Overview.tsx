import { useEffect, useState } from "react";
import { useParkingData } from "@/hooks/useParkingData";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { ParkingMap } from "@/components/dashboard/ParkingMap";
import { EntryExitCounter } from "@/components/dashboard/EntryExitCounter";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { PricingPanel } from "@/components/dashboard/PricingPanel";
import { ReservationDialog } from "@/components/dashboard/ReservationDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DashboardOverview() {
  const data = useParkingData();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);

  const handleReserveClick = (id: number) => {
    setSelectedSpot(id);
    setDialogOpen(true);
  };

  const handleSaved = (saved: { spotNumber: number; startTime: Date; endTime: Date }) => {
    // Si la réservation couvre l'instant présent, on met à jour l'état local
    // pour que la place apparaisse immédiatement comme réservée sur la carte.
    const now = Date.now();
    if (saved.startTime.getTime() <= now && saved.endTime.getTime() > now) {
      data.reserveSpotRange(saved.spotNumber, saved.endTime.getTime());
    }
  };

  const handleCancel = async (id: number) => {
    data.cancelReservation(id);
    if (!user) return;
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("spot_number", id)
      .eq("status", "active")
      .lte("start_time", new Date().toISOString())
      .gt("end_time", new Date().toISOString());
    if (error) {
      toast.error("Échec de l'annulation", { description: error.message });
    } else {
      toast.info(`Réservation P${id} annulée`);
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reservations")
      .update({ status: "expired" })
      .eq("user_id", user.id)
      .eq("status", "active")
      .lt("end_time", new Date().toISOString());
  }, [data.spots, user]);

  const freeSpotIds = data.spots.filter((s) => s.status === "free").map((s) => s.id);

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
            onReserve={handleReserveClick}
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

      <ReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
        initialSpot={selectedSpot ?? undefined}
        availableSpots={freeSpotIds}
        onSaved={handleSaved}
      />
    </div>
  );
}
