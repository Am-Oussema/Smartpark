import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(6, "Minimum 6 caractères").max(72),
});

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);

    if (error) {
      // Cas 1 — Supabase renvoie explicitement une erreur "already registered"
      if (error.message.toLowerCase().includes("registered")) {
        toast.error("Email déjà utilisé", {
          description: "Un compte existe déjà avec cet email. Connectez-vous.",
        });
        navigate("/login", { replace: true });
        return;
      }
      toast.error("Échec de l'inscription", { description: error.message });
      return;
    }

    // Cas 2 — Détection silencieuse (protection anti-énumération de Supabase) :
    // si l'email existe déjà, Supabase renvoie un `user` factice MAIS avec `identities = []`.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("Email déjà utilisé", {
        description: "Un compte existe déjà avec cet email. Connectez-vous.",
      });
      navigate("/login", { replace: true });
      return;
    }

    // Cas 3 — Inscription réelle
    toast.success("Compte créé !", { description: "Vous êtes connecté." });
    navigate("/dashboard", { replace: true });

  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">SmartPark</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h1 className="mb-1 text-2xl font-bold">Créer un compte</h1>
          <p className="mb-6 text-sm text-muted-foreground">Rejoignez SmartPark en quelques secondes.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Oussema Amri"
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
