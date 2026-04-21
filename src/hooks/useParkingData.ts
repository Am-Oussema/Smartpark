/**
 * Centralized parking state — single source of truth for the dashboard.
 *
 * 🔌 To hook real ESP8266 data later:
 *   - Replace the in-memory `spots` state with a SWR/React-Query fetch from your API
 *   - Or open a WebSocket and call `setSpotStatus` on incoming messages
 * The components using this hook do not need to change.
 */

import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_SPOTS, type ParkingSpot, type SpotStatus, BUSINESS_CONFIG } from "@/data/mockParking";
import { toast } from "sonner";

export function useParkingData() {
  const [spots, setSpots] = useState<ParkingSpot[]>(INITIAL_SPOTS);
  const [entries, setEntries] = useState(0);
  const [exits, setExits] = useState(0);
  const alertedFullRef = useRef(false);
  const alertedThresholdRef = useRef(false);

  // On mount: restore active reservations from DB into the map
  useEffect(() => {
    const restoreReservations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("reservations")
        .select("spot_number, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
      if (!data || data.length === 0) return;
      setSpots((prev) =>
        prev.map((s) => {
          const match = data.find((r) => r.spot_number === s.id);
          if (match) {
            return { ...s, status: "reserved", reservedUntil: new Date(match.expires_at).getTime() };
          }
          return s;
        })
      );
    };
    restoreReservations();
  }, []);

  // KPIs
  const total = spots.length;
  const occupied = spots.filter((s) => s.status === "occupied").length;
  const reserved = spots.filter((s) => s.status === "reserved").length;
  const free = spots.filter((s) => s.status === "free").length;
  const occupancyRate = Math.round(((occupied + reserved) / total) * 100);

  // Dynamic pricing
  const currentPrice = useMemo(() => {
    const surge = occupancyRate >= BUSINESS_CONFIG.surgeThreshold;
    return {
      base: BUSINESS_CONFIG.basePrice,
      current: surge
        ? +(BUSINESS_CONFIG.basePrice * BUSINESS_CONFIG.surgeMultiplier).toFixed(2)
        : BUSINESS_CONFIG.basePrice,
      surge,
    };
  }, [occupancyRate]);

  // Alerts
  useEffect(() => {
    if (occupancyRate >= 100 && !alertedFullRef.current) {
      toast.error("🚨 Parking complet !", { description: "Aucune place disponible." });
      alertedFullRef.current = true;
    } else if (occupancyRate < 100) {
      alertedFullRef.current = false;
    }

    if (
      occupancyRate >= BUSINESS_CONFIG.alertThreshold &&
      occupancyRate < 100 &&
      !alertedThresholdRef.current
    ) {
      toast.warning(`⚠️ Occupation élevée : ${occupancyRate}%`, {
        description: "Le seuil critique est dépassé.",
      });
      alertedThresholdRef.current = true;
    } else if (occupancyRate < BUSINESS_CONFIG.alertThreshold) {
      alertedThresholdRef.current = false;
    }
  }, [occupancyRate]);

  // Reservation timers — auto-release after 5 min
  useEffect(() => {
    const interval = setInterval(() => {
      setSpots((prev) =>
        prev.map((s) =>
          s.status === "reserved" && s.reservedUntil && s.reservedUntil < Date.now()
            ? { ...s, status: "free", reservedUntil: undefined }
            : s
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const setSpotStatus = useCallback((id: number, status: SpotStatus) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, reservedUntil: undefined } : s))
    );
  }, []);

  const reserveSpot = useCallback((id: number, durationMs = 5 * 60 * 1000) => {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === id && s.status === "free"
          ? { ...s, status: "reserved", reservedUntil: Date.now() + durationMs }
          : s
      )
    );
  }, []);

  const cancelReservation = useCallback((id: number) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "free", reservedUntil: undefined } : s))
    );
  }, []);

  const simulateEntry = useCallback(() => {
    setEntries((e) => e + 1);
    setSpots((prev) => {
      const idx = prev.findIndex((s) => s.status === "free");
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status: "occupied", reservedUntil: undefined };
      return copy;
    });
  }, []);

  const simulateExit = useCallback(() => {
    setExits((e) => e + 1);
    setSpots((prev) => {
      const idx = prev.findIndex((s) => s.status === "occupied");
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status: "free" };
      return copy;
    });
  }, []);

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
    setSpotStatus,
    reserveSpot,
    cancelReservation,
    simulateEntry,
    simulateExit,
  };
}
