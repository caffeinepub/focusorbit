import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Starfield } from "./components/Starfield";
import { TimerProvider } from "./context/TimerContext";
import { TimerPage } from "./pages/TimerPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ConsistencyPage } from "./pages/ConsistencyPage";
import { SettingsModal } from "./components/SettingsModal";
import { LoginScreen } from "./components/LoginScreen";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { BarChart2, Timer, Orbit, Target } from "lucide-react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

type Page = "timer" | "analytics" | "consistency";

function AuthenticatedApp() {
  const [page, setPage] = useState<Page>("timer");
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <TimerProvider>
      <TooltipProvider>
        {/* Profile setup modal — only shown if no profile yet */}
        <ProfileSetupModal open={showProfileSetup} />

        {/* Starfield background */}
        <Starfield />

        {/* Hidden print report div */}
        <div id="print-report" />

        {/* Main layout */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full bg-space-blue/20 border border-space-blue/40 flex items-center justify-center"
                    style={{
                      boxShadow: "0 0 12px rgba(79,195,247,0.4)",
                    }}
                  >
                    <Orbit className="w-4 h-4 text-space-blue" />
                  </div>
                </div>
                <div>
                  <span className="font-orbitron font-bold text-lg tracking-wider">
                    Focus
                    <span
                      style={{
                        color: "#4fc3f7",
                        textShadow: "0 0 12px rgba(79,195,247,0.7)",
                      }}
                    >
                      Orbit
                    </span>
                  </span>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage("timer")}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-grotesk font-medium transition-all
                    ${page === "timer"
                      ? "bg-space-blue/15 text-space-blue border border-space-blue/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }
                  `}
                >
                  <Timer className="w-4 h-4" />
                  <span className="hidden sm:inline">Timer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage("consistency")}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-grotesk font-medium transition-all
                    ${page === "consistency"
                      ? "bg-space-blue/15 text-space-blue border border-space-blue/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }
                  `}
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Consistency</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage("analytics")}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-grotesk font-medium transition-all
                    ${page === "analytics"
                      ? "bg-space-blue/15 text-space-blue border border-space-blue/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }
                  `}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </button>

                <div className="ml-1">
                  <SettingsModal />
                </div>
              </nav>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            {page === "timer" && <TimerPage />}
            {page === "consistency" && <ConsistencyPage />}
            {page === "analytics" && <AnalyticsPage />}
          </main>

          {/* Footer */}
          <footer className="border-t border-border/20 py-4 px-4 text-center text-xs text-muted-foreground/50">
            © 2026. Built with{" "}
            <span className="text-space-red/70">♥</span>{" "}
            using{" "}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-blue/60 hover:text-space-blue transition-colors"
            >
              caffeine.ai
            </a>
          </footer>
        </div>

        <Toaster
          toastOptions={{
            style: {
              background: "oklch(0.15 0.03 265)",
              border: "1px solid oklch(0.30 0.05 265)",
              color: "oklch(0.93 0.02 240)",
            },
          }}
        />
      </TooltipProvider>
    </TimerProvider>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // While the auth client is initializing (loading stored identity), show nothing
  // to prevent flicker between login screen and main app.
  if (isInitializing) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "oklch(0.07 0.018 265)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "oklch(0.72 0.18 220 / 0.5)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster
          toastOptions={{
            style: {
              background: "oklch(0.15 0.03 265)",
              border: "1px solid oklch(0.30 0.05 265)",
              color: "oklch(0.93 0.02 240)",
            },
          }}
        />
      </>
    );
  }

  return <AuthenticatedApp />;
}
