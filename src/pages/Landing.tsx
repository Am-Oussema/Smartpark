import { Link } from "react-router-dom";
import {
  Car,
  Activity,
  BarChart3,
  Calendar,
  Bell,
  Settings,
  ArrowRight,
  Cpu,
  Wifi,
  Database,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Car, title: "Carte parking en direct", desc: "Grille visuelle libre / occupé / réservé pour chaque place." },
  { icon: Activity, title: "KPIs temps réel", desc: "Places libres, occupées et taux d'occupation calculés en direct." },
  { icon: BarChart3, title: "Analytics business", desc: "Trafic par heure et historique d'occupation pour mieux décider." },
  { icon: Calendar, title: "Réservation 5 min", desc: "Bloquez une place le temps d'arriver, libération automatique." },
  { icon: Bell, title: "Alertes intelligentes", desc: "Notifications dès que l'occupation dépasse 80% ou que le parking est plein." },
  { icon: Settings, title: "Tarification dynamique", desc: "Le tarif s'adapte à l'occupation pour maximiser la rentabilité." },
];

const stack = [
  { icon: Cpu, label: "Arduino + capteurs HC-SR04" },
  { icon: Wifi, label: "ESP8266 (WiFi)" },
  { icon: Database, label: "API REST / WebSocket" },
  { icon: Shield, label: "Dashboard sécurisé" },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">SmartPark</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#stack" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Architecture</a>
            <a href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">À propos</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  <Link to="/register">S'inscrire</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container relative grid gap-12 py-20 lg:grid-cols-2 lg:py-32">
          <div className="flex flex-col justify-center animate-fade-up">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              IoT Smart Parking System
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Le parking <span className="text-gradient">intelligent</span> qui pense pour vous
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              Détection en temps réel, analytics business, réservation et tarification dynamique —
              dans une interface moderne pensée pour les opérateurs de parking d'aujourd'hui.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                <Link to={user ? "/dashboard" : "/register"}>
                  Démarrer maintenant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Voir les fonctionnalités</a>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold">&lt; 1s</div>
                <div className="text-xs text-muted-foreground">Latence</div>
              </div>
              <div>
                <div className="text-2xl font-bold">6/6</div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
            </div>
          </div>

          {/* Hero visual: animated parking */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl" />
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/80 p-6 shadow-elegant backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Parking — Niveau 1</div>
                <div className="flex items-center gap-1 text-xs text-success">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" /> En direct
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "P1", status: "free" },
                  { label: "P2", status: "occupied" },
                  { label: "P3", status: "reserved" },
                  { label: "P4", status: "free" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`relative flex h-24 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all ${
                      s.status === "free"
                        ? "border-success/40 bg-success/10 text-success"
                        : s.status === "occupied"
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-reserved/40 bg-reserved/10 text-reserved"
                    }`}
                    style={{ animation: `fade-up 0.6s ease-out ${i * 0.1}s both` }}
                  >
                    {s.status === "occupied" ? <Car className="h-8 w-8 animate-drive-in" /> : s.label}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-success/10 p-2 text-success">2 libres</div>
                <div className="rounded-md bg-destructive/10 p-2 text-destructive">1 occupée</div>
                <div className="rounded-md bg-reserved/10 p-2 text-reserved">1 réservée</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">6 modules essentiels</h2>
          <p className="text-muted-foreground">
            Tout ce dont un opérateur de parking a besoin, dans un seul tableau de bord.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-gradient-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="border-y border-border bg-secondary/30 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Architecture IoT complète</h2>
            <p className="text-muted-foreground">
              Du capteur au dashboard, chaque couche est conçue pour la fiabilité.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Étape {i + 1}</div>
                  <div className="text-sm font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="container py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-12 text-center text-primary-foreground shadow-glow">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Prêt à digitaliser votre parking ?</h2>
          <p className="mx-auto mb-8 max-w-xl opacity-90">
            Créez votre compte gratuit et explorez le dashboard complet en moins d'une minute.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to={user ? "/dashboard" : "/register"}>
              {user ? "Aller au dashboard" : "Créer un compte"} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SmartPark-ofha · Smart Parking IoT Solution
        </div>
      </footer>
    </div>
  );
}
