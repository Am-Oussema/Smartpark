/**
 * Centralized parking state — live from parking_spots table via Supabase Realtime.
 * Simulate buttons are admin-only dev tools — hidden before launch.
 */

import { supabase } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type SpotStatus = "free" | "reserved" | "occupied";

export interface ParkingSpot {
  id: number;
  status: SpotStatus;
  reservedUntil?: number;
}

interface Config {
  basePrice: number;
  surgeThreshold: number;
  surgeMultiplier: number;
  alertThreshold: number;
}

function mapStatus(dbStatus: string): SpotStatus {
  if (dbStatus === "pending") return "reserved";
  if (dbStatus === "occupied" || dbStatus === "flagged") return "occupied";
  return "free";
}

export function useParkingData() {
  const [spots, setSpots] = useState<ParkingSpot[]>([
    { id: 1, status: "free" },
    { id: 2, status: "free" },
    { id: 3, status: "free" },
    { id: 4, status: "free" },
  ]);
  const [entries, setEntries] = useState(0);
  const [exits, setExits] = useState(0);
  const [config, setConfig] = useState<Config>({
    basePrice: 2,
    surgeThreshold: 70,
    surgeMultiplier: 1.2,
    alertThreshold: 80,
  });
  const alertedFullRef = useRef(false);
  const alertedThresholdRef = useRef(false);

  // Fetch settings
  useEffect(() => {
    supabase
      .from("settings")
      .select("base_price, surge_threshold, surge_multiplier, alert_threshold")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data)
          setConfig({
            basePrice: data.base_price,
            surgeThreshold: data.surge_threshold,
            surgeMultiplier: data.surge_multiplier,
            alertThreshold: data.alert_threshold,
          });
      });
  }, []);

  // Fetch initial spots — expires_at directly on parking_spots
  useEffect(() => {
    const init = async () => {
      const { data: spotsData } = await supabase
        .from("parking_spots")
        .select("id, status, expires_at")
        .order("id");

      if (!spotsData) return;

      setSpots(
        spotsData.map((s) => ({
          id: s.id,
          status: mapStatus(s.status),
          reservedUntil: s.expires_at
            ? new Date(s.expires_at).getTime()
            : undefined,
        }))
      );
    };
    init();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("parking_spots_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_spots" },
        (payload) => {
          const updated = payload.new as {
            id: number;
            status: string;
            expires_at: string | null;
          };

          setSpots((prev) =>
            prev.map((s) =>
              s.id === updated.id
                ? {
                  ...s,
                  status: mapStatus(updated.status),
                  reservedUntil: updated.expires_at
                    ? new Date(updated.expires_at).getTime()
                    : undefined,
                }
                : s
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Countdown — auto-clear expired reserved spots locally
  useEffect(() => {
    const interval = setInterval(() => {
      setSpots((prev) =>
        prev.map((s) =>
          s.status === "reserved" &&
            s.reservedUntil &&
            s.reservedUntil < Date.now()
            ? { ...s, status: "free", reservedUntil: undefined }
            : s
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // KPIs
  const total = spots.length;
  const occupied = spots.filter((s) => s.status === "occupied").length;
  const reserved = spots.filter((s) => s.status === "reserved").length;
  const free = spots.filter((s) => s.status === "free").length;
  const occupancyRate = Math.round(((occupied + reserved) / total) * 100);

  // Dynamic pricing
  const currentPrice = useMemo(() => {
    const surge = occupancyRate >= config.surgeThreshold;
    return {
      base: config.basePrice,
      current: surge
        ? +(config.basePrice * config.surgeMultiplier).toFixed(2)
        : config.basePrice,
      surge,
    };
  }, [occupancyRate, config]);

  // Alerts
  useEffect(() => {
    if (occupancyRate >= 100 && !alertedFullRef.current) {
      toast.error("🚨 Parking complet !", {
        description: "Aucune place disponible.",
      });
      alertedFullRef.current = true;
    } else if (occupancyRate < 100) {
      alertedFullRef.current = false;
    }

    if (
      occupancyRate >= config.alertThreshold &&
      occupancyRate < 100 &&
      !alertedThresholdRef.current
    ) {
      toast.warning(`⚠️ Occupation élevée : ${occupancyRate}%`, {
        description: "Le seuil critique est dépassé.",
      });
      alertedThresholdRef.current = true;
    } else if (occupancyRate < config.alertThreshold) {
      alertedThresholdRef.current = false;
    }
  }, [occupancyRate, config.alertThreshold]);

  // Simulate entry — admin dev tool
  const simulateEntry = useCallback(async () => {
    const freeSpot = spots.find((s) => s.status === "free");
    if (!freeSpot) {
      toast.error("Aucune place libre");
      return;
    }
    const { error } = await supabase
      .from("parking_spots")
      .update({ status: "occupied", last_updated: new Date().toISOString() })
      .eq("id", freeSpot.id);
    if (error) {
      toast.error("Erreur simulate entry", { description: error.message });
      return;
    }
    setEntries((e) => e + 1);
  }, [spots]);

  // Simulate exit — admin dev tool
  const simulateExit = useCallback(async () => {
    const occupiedSpot = spots.find((s) => s.status === "occupied");
    if (!occupiedSpot) {
      toast.error("Aucune place occupée");
      return;
    }
    const { error } = await supabase
      .from("parking_spots")
      .update({ status: "free", last_updated: new Date().toISOString() })
      .eq("id", occupiedSpot.id);
    if (error) {
      toast.error("Erreur simulate exit", { description: error.message });
      return;
    }
    setExits((e) => e + 1);
  }, [spots]);

  return {
    spots,
    total,
    free,
    occupied,
    reserved,
    occupancyRate,
    entries,
    exits,
    currentPrice,
    simulateEntry,
    simulateExit,
  };
}