import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Email invalide").max(255),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);

    // 1) Vérifier via une fonction sécurisée (SECURITY DEFINER) si l'email existe.
    //    Cette RPC renvoie juste true/false — pas de fuite de données, et fonctionne
    //    sans être connecté (contrairement à un SELECT direct bloqué par la RLS).
    const { data: exists, error: checkError } = await supabase.rpc("email_exists", {
      _email: email,
    });

    if (checkError) {
      setLoading(false);
      toast.error("Erreur", { description: checkError.message });
      return;
    }

    if (!exists) {
      setLoading(false);
      toast.error("Email introuvable", {
        description: "Aucun compte n'est associé à cet email. Vérifiez l'adresse ou créez un compte.",
      });
      return;
    }

    // 2) L'email existe → on déclenche la réinitialisation.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Erreur", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Email envoyé", {
      description: "Vérifiez votre boîte de réception.",
    });
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Vérifiez vos emails</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Nous avons envoyé un lien de réinitialisation à{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Cliquez sur le lien pour définir un nouveau mot de passe.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="w-full"
              >
                Renvoyer un email
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-bold">Mot de passe oublié</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Entrez votre email, nous vous enverrons un lien de réinitialisation.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer le lien
                </Button>
              </form>
            </>
          )}

          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
