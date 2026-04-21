import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HOURLY_TRAFFIC, OCCUPANCY_HISTORY } from "@/data/mockParking";

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "hsl(var(--popover-foreground))",
};

export function AnalyticsCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Hourly traffic */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Trafic par heure</h3>
          <p className="text-xs text-muted-foreground">Nombre de voitures entrées (données simulées)</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HOURLY_TRAFFIC}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="entries" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Occupancy history */}
      <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Historique d'occupation</h3>
          <p className="text-xs text-muted-foreground">Taux d'occupation moyen sur la journée (%)</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={OCCUPANCY_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--accent))", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
