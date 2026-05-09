import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "hsl(var(--popover-foreground))",
};

interface HourlyEntry { hour: string; occupancy: number; }
interface DailyEntry { day: string; occupancy: number; }

// Calculate occupancy % from a list of events within a time window
// Clips each occupied→free pair to the window boundaries
function calcOccupancy(
  events: { spot_id: number; event: string; occurred_at: string }[],
  windowStart: Date,
  windowEnd: Date,
  totalSpots: number
): number {
  const windowMs = windowEnd.getTime() - windowStart.getTime();
  if (windowMs <= 0) return 0;

  let totalOccupiedMs = 0;

  // Process per spot
  const spotIds = [...new Set(events.map((e) => e.spot_id))];
  for (const spotId of spotIds) {
    const spotEvents = events
      .filter((e) => e.spot_id === spotId)
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

    let occupiedSince: Date | null = null;

    for (const ev of spotEvents) {
      const t = new Date(ev.occurred_at);
      if (ev.event === "occupied" && occupiedSince === null) {
        occupiedSince = t;
      } else if (ev.event === "free" && occupiedSince !== null) {
        const start = Math.max(occupiedSince.getTime(), windowStart.getTime());
        const end = Math.min(t.getTime(), windowEnd.getTime());
        if (end > start) totalOccupiedMs += end - start;
        occupiedSince = null;
      }
    }

    // Still occupied at end of window
    if (occupiedSince !== null) {
      const start = Math.max(occupiedSince.getTime(), windowStart.getTime());
      const end = windowEnd.getTime();
      if (end > start) totalOccupiedMs += end - start;
    }
  }

  const totalAvailableMs = totalSpots * windowMs;
  return Math.round((totalOccupiedMs / totalAvailableMs) * 100);
}

export function AnalyticsCharts() {
  const [hourly, setHourly] = useState<HourlyEntry[]>([]);
  const [daily, setDaily] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all events for the last 7 days
      const { data: events } = await supabase
        .from("spot_events")
        .select("spot_id, event, occurred_at")
        .gte("occurred_at", weekAgo.toISOString())
        .lte("occurred_at", dayEnd.toISOString())
        .order("occurred_at", { ascending: true });

      if (!events) { setLoading(false); return; }

      // Fetch carry-over: last event per spot before today's midnight
      const { data: carryOver } = await supabase
        .from("spot_events")
        .select("spot_id, event, occurred_at")
        .lt("occurred_at", dayStart.toISOString())
        .order("occurred_at", { ascending: false });

      // Keep only the most recent event per spot before midnight
      const lastBeforeToday: Record<number, string> = {};
      for (const e of carryOver ?? []) {
        if (!(e.spot_id in lastBeforeToday)) {
          lastBeforeToday[e.spot_id] = e.event;
        }
      }

      // Inject synthetic midnight 'occupied' events for overnight spots
      const syntheticEvents: { spot_id: number; event: string; occurred_at: string }[] = [];
      for (const [spotId, lastEvent] of Object.entries(lastBeforeToday)) {
        if (lastEvent === "occupied") {
          syntheticEvents.push({
            spot_id: parseInt(spotId),
            event: "occupied",
            occurred_at: dayStart.toISOString(),
          });
        }
      }

      // Merge synthetic + today's real events
      const todayEvents = [
        ...syntheticEvents,
        ...events.filter((e) => new Date(e.occurred_at) >= dayStart),
      ].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

      // ── Chart 1: hourly occupancy today ───────────────────
      const hourMap: Record<number, number> = {};
      for (const e of todayEvents) {
        const h = new Date(e.occurred_at).getHours();
        hourMap[h] = (hourMap[h] ?? 0) + 1;
      }

      const activeHours = Object.keys(hourMap).map(Number);
      const currentHour = now.getHours();
      const minHour = activeHours.length > 0 ? Math.max(0, Math.min(...activeHours) - 1) : 0;
      const maxHour = currentHour;

      const hourlyData: HourlyEntry[] = Array.from(
        { length: Math.max(1, maxHour - minHour + 1) },
        (_, i) => {
          const h = i + minHour;
          const slotStart = new Date(dayStart); slotStart.setHours(h, 0, 0, 0);
          const slotEnd = new Date(dayStart); slotEnd.setHours(h, 59, 59, 999);

          // Include all events up to end of this slot
          const relevant = todayEvents.filter(
            (e) => new Date(e.occurred_at) <= slotEnd
          );

          return {
            hour: `${String(h).padStart(2, "0")}h`,
            occupancy: calcOccupancy(relevant, slotStart, slotEnd, 4),
          };
        }
      );
      setHourly(hourlyData);

      // ── Chart 2: daily occupancy last 7 days ──────────────
      const dailyData: DailyEntry[] = [];
      for (let d = 6; d >= 0; d--) {
        const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
        const dayS = new Date(date); dayS.setHours(0, 0, 0, 0);
        const dayE = new Date(date); dayE.setHours(23, 59, 59, 999);

        // For today, use todayEvents (includes carry-over)
        // For past days, use raw events
        const isToday = d === 0;
        const dayEvents = isToday
          ? todayEvents
          : events.filter(
              (e) =>
                new Date(e.occurred_at) >= dayS &&
                new Date(e.occurred_at) <= dayE
            );

        dailyData.push({
          day: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
          occupancy: calcOccupancy(dayEvents, dayS, dayE, 4),
        });
      }
      setDaily(dailyData);
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex h-80 items-center justify-center rounded-xl border border-border bg-gradient-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ))}
      </div>
    );
  }

  const noDataToday = hourly.every((h) => h.occupancy === 0);
  const noDataWeekly = daily.every((d) => d.occupancy === 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Hourly occupancy — today */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Taux d'occupation par heure</h3>
          <p className="text-xs text-muted-foreground">
            Occupation réelle du parking aujourd'hui (%)
          </p>
        </div>
        <div className="h-64">
          {noDataToday ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aucune activité aujourd'hui
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(v) => [`${v}%`, "Occupation"]}
                />
                <Bar dataKey="occupancy" name="Occupation" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily occupancy — last 7 days */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Occupation — 7 derniers jours</h3>
          <p className="text-xs text-muted-foreground">
            Taux d'occupation moyen par jour (%)
          </p>
        </div>
        <div className="h-64">
          {noDataWeekly ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Pas encore de données
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v}%`, "Occupation"]}
                />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--accent))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
