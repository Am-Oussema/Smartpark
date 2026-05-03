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
  { icon: Calendar, title: "Réservation", desc: "Bloquez une place le temps d'arriver, libération automatique." },
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
            <a href="#experience" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Expérience</a>
            <a href="#stack" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Architecture</a>
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
      <section className="relative overflow-hidden bg-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 h-full w-full object-cover dark:opacity-50"
        >
          <source src="/smart-park.mp4" type="video/mp4" />
        </video>
        {/* Overlay: Solid background fading to transparent in light mode, uniform dimming in dark mode */}
        <div className="container relative z-10 grid gap-12 py-20 lg:grid-cols-2 lg:py-32">
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
                <div className="text-sm font-semibold">Parking</div>
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
                    className={`relative flex h-24 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-all ${s.status === "free"
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
      <section id="features" className="relative py-24">
        {/* Decorative subtle background glow */}
        <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Avantages
            </div>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">6 modules essentiels</h2>
            <p className="text-muted-foreground">
              Tout ce dont un opérateur de parking a besoin, réuni dans un tableau de bord ultra-réactif et complet.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Inner hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:shadow-glow">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-lg font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision / Solution with the integrated image */}
      <section id="experience" className="relative overflow-hidden bg-background py-24">
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Image Side */}
            <div className="relative order-2 lg:order-1">
              {/* Decorative background glow */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-20 blur-2xl" />
              <video
                autoPlay
                loop
                muted
                playsInline
                className="relative w-full rounded-2xl border border-border/50 object-cover shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
              >
                <source src="/secure_sp.mp4" type="video/mp4" />
              </video>
              {/* Floating element for more charm */}
              <div className="absolute -bottom-6 -right-6 rounded-xl border border-border bg-card/90 p-4 shadow-elegant backdrop-blur-md animate-fade-up" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                    <Car className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Zéro stress</div>
                    <div className="text-xs text-muted-foreground">Parking 100% garanti</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary"></span>
                Expérience premium
              </div>
              <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
                Une solution fluide et intelligente
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                L'application SmartPark redéfinit la façon dont vous stationnez. De la recherche de place en temps réel au paiement sur place en espèces, chaque étape a été pensée pour vous offrir un confort inégalé, avec des paiements automatisés prévus à l'avenir.
              </p>

              <ul className="space-y-4">
                {[
                  "Trouvez facilement une place disponible à proximité",
                  "Consultez la disponibilité en temps réel sans effort",
                  "Paiement sécurisé en espèces sur place (automatisation à venir)",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-8 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                <Link to={user ? "/dashboard" : "/register"}>
                  Rejoindre le mouvement <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="relative border-y border-border bg-secondary/20 py-28 overflow-hidden">
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="container relative z-10">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Architecture IoT de bout en bout</h2>
            <p className="text-muted-foreground">
              Du capteur physique jusqu'au cloud, une transmission de données fiable à la milliseconde près.
            </p>
          </div>

          <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 md:flex-row">
            {/* Connecting line (Desktop only) */}
            <div className="absolute left-[10%] right-[10%] top-8 -z-10 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 md:block" />

            {stack.map((s, i) => (
              <div key={s.label} className="relative flex w-full flex-col items-center gap-4 md:w-1/4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-card shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-glow">
                  <s.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center bg-background/50 backdrop-blur-[2px] p-2 rounded-lg">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Étape {i + 1}</div>
                  <div className="text-sm font-semibold">{s.label}</div>
                </div>
                {/* Down arrow for mobile */}
                {i !== stack.length - 1 && (
                  <ArrowRight className="h-5 w-5 rotate-90 text-primary/40 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="container relative py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary px-6 py-16 text-center text-primary-foreground shadow-glow sm:px-16 sm:py-20 lg:px-24">
          {/* Abstract glass shapes for depth */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-black/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Prêt à digitaliser votre parking ?
            </h2>
            <p className="mx-auto mb-10 text-lg opacity-90">
              Créez votre compte gratuit et explorez le dashboard interactif complet en moins d'une minute.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base shadow-xl transition-all hover:scale-105">
                <Link to={user ? "/dashboard" : "/register"}>
                  {user ? "Aller au dashboard" : "Créer un compte gratuitement"} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
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
