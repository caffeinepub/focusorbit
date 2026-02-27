import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTimer, type TimerMode, type ThemeName } from "../context/TimerContext";
import { TimerRing } from "../components/TimerRing";
import { StreakWidget } from "../components/StreakWidget";
import { RocketAnimation } from "../components/RocketAnimation";
import { Play, Pause, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "FOCUS",
  short_break: "SHORT BREAK",
  long_break: "LONG BREAK",
};

const MODE_SUBLABELS: Record<TimerMode, string> = {
  focus: "Deep work orbit",
  short_break: "Brief reentry",
  long_break: "Extended re-orbit",
};

const THEME_LABELS: Record<ThemeName, { label: string; icon: string; color: string; glow: string }> = {
  nature:     { label: "Launch Bias",   icon: "🌿", color: "#66bb6a", glow: "rgba(102,187,106,0.7)" },
  space:      { label: "Persistence",   icon: "🚀", color: "#4fc3f7", glow: "rgba(79,195,247,0.7)" },
  discipline: { label: "Perseverance",  icon: "⚡", color: "#ffa726", glow: "rgba(255,167,38,0.7)" },
  scientist:  { label: "Perseverance",  icon: "🔬", color: "#69f0ae", glow: "rgba(105,240,174,0.7)" },
  alien:      { label: "Perseverance",  icon: "👽", color: "#00bfa5", glow: "rgba(0,191,165,0.7)" },
};

function getThemeRingColor(theme: ThemeName, isFocus: boolean): string {
  if (!isFocus) return "#ffd54f";
  return THEME_LABELS[theme].color;
}

export function TimerPage() {
  const {
    mode,
    setMode,
    timeLeft,
    totalTime,
    isRunning,
    sessionCount,
    currentTheme,
    start,
    pause,
    reset,
    resetSessionCount,
    burstActive,
  } = useTimer();

  const [confirmReset, setConfirmReset] = useState(false);

  const progress = totalTime > 0 ? timeLeft / totalTime : 1;
  const isFocus = mode === "focus";
  const themeInfo = THEME_LABELS[currentTheme];
  const ringColor = getThemeRingColor(currentTheme, isFocus);
  const timeGlow = isFocus
    ? `0 0 30px ${themeInfo.glow.replace("0.7", "0.9")}, 0 0 60px ${themeInfo.glow.replace("0.7", "0.4")}`
    : "0 0 30px rgba(255,213,79,0.9), 0 0 60px rgba(255,213,79,0.4)";

  function handleConfirmReset() {
    resetSessionCount();
    setConfirmReset(false);
  }

  return (
    <TooltipProvider>
      <RocketAnimation />
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        {/* Main Timer Column */}
        <div className="flex-1 flex flex-col items-center gap-6 max-w-lg w-full animate-slide-up">
          {/* Mode Tabs */}
          <div className="flex gap-1 p-1 glass-card rounded-xl">
            {(["focus", "short_break", "long_break"] as TimerMode[]).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`
                  px-4 py-2 rounded-lg text-xs font-orbitron font-semibold tracking-wider transition-all duration-200
                  ${mode === m
                    ? m === "focus"
                      ? "bg-space-blue/20 text-space-blue shadow-glow-sm-blue border border-space-blue/30"
                      : "bg-space-gold/20 text-space-gold shadow-glow-sm-gold border border-space-gold/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }
                `}
              >
                {m === "focus" ? "Focus" : m === "short_break" ? "Short Break" : "Long Break"}
              </button>
            ))}
          </div>

          {/* Timer Ring */}
          <div className="relative">
            {/* Session count indicator */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {([0, 1, 2, 3]).map((dotIdx) => (
                <div
                  key={`dot-${dotIdx}`}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    dotIdx < (sessionCount % 4)
                      ? "bg-space-blue shadow-[0_0_6px_rgba(79,195,247,0.8)]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <TimerRing
              progress={progress}
              isRunning={isRunning}
              mode={mode}
              burstActive={burstActive}
              themeColor={ringColor}
            >
              {/* Mode label */}
              <div className="mb-2 text-xs font-orbitron tracking-widest text-muted-foreground uppercase">
                {MODE_LABELS[mode]}
              </div>

              {/* Time display */}
              <div
                className="font-timer text-6xl sm:text-7xl font-bold tabular-nums leading-none"
                style={{
                  color: isFocus ? ringColor : "#ffd54f",
                  textShadow: timeGlow,
                }}
              >
                {formatTime(timeLeft)}
              </div>

              {/* Sublabel */}
              <div className="mt-2 text-xs text-muted-foreground/60 font-grotesk">
                {isRunning ? MODE_SUBLABELS[mode] : "Ready to launch"}
              </div>

              {/* Theme label */}
              <div
                className="mt-1 text-xs font-grotesk font-medium opacity-70 theme-transition"
                style={{ color: themeInfo.color }}
              >
                {themeInfo.icon} {themeInfo.label}
              </div>
            </TimerRing>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Reset timer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              className="w-12 h-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            {/* Start / Pause */}
            <button
              type="button"
              onClick={isRunning ? pause : start}
              className={`
                relative w-20 h-20 rounded-full flex items-center justify-center
                font-orbitron font-bold text-sm tracking-wider
                transition-all duration-200 hover:scale-105 active:scale-95
                ${isFocus
                  ? "bg-space-blue/20 border-2 border-space-blue/60 text-space-blue animate-glow-pulse"
                  : "bg-space-gold/20 border-2 border-space-gold/60 text-space-gold animate-glow-pulse-gold"
                }
              `}
              style={{
                borderColor: isFocus ? `${ringColor}99` : undefined,
                color: isFocus ? ringColor : undefined,
              }}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
            >
              {isRunning ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            {/* Session reset */}
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full text-muted-foreground hover:text-space-blue hover:bg-space-blue/10 transition-all"
              aria-label="Reset session count"
              title="Reset session count"
              onClick={() => setConfirmReset(true)}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>

          {/* Session counter + confirm reset */}
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground font-grotesk">
              <span className="text-foreground font-semibold">{sessionCount}</span>
              {" "}{sessionCount === 1 ? "session" : "sessions"} completed today
            </div>

            {confirmReset && (
              <div className="flex items-center gap-2 justify-center text-xs animate-fade-in">
                <span className="text-muted-foreground">Confirm reset sessions?</span>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all font-orbitron text-xs"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 rounded bg-white/5 text-muted-foreground hover:bg-white/10 border border-border/30 transition-all font-orbitron text-xs"
                >
                  No
                </button>
              </div>
            )}
          </div>

          {/* Settings note */}
          <div className="text-xs text-muted-foreground/50 text-center">
            Configure focus duration in{" "}
            <span className="text-space-blue/70">⚙ settings</span>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-72 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <StreakWidget />
        </div>
      </div>
    </TooltipProvider>
  );
}
