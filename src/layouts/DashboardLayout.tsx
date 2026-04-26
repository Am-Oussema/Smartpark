import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AlertTriangle } from "lucide-react";

export default function DashboardLayout() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const showBanner = profile !== null && !profile.phone_verified;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Unverified phone banner */}
          {showBanner && (
            <div className="flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Votre numéro de téléphone n'est pas vérifié — les réservations sont désactivées.
                </span>
              </div>
              <Link
                to="/dashboard/account"
                className="flex-shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400 underline hover:no-underline"
              >
                Vérifier →
              </Link>
            </div>
          )}

          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">
                Dashboard
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user?.email}
              </span>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}