import { Flame, Snowflake, Shield, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStreakData, useUseFreeze } from "../hooks/useQueries";
import { toast } from "sonner";

export function StreakWidget() {
  const { data: streak, isLoading } = useStreakData();
  const useFreeze = useUseFreeze();

  const current = Number(streak?.currentStreak ?? 0);
  const longest = Number(streak?.longestStreak ?? 0);
  const freezeBalance = Number(streak?.freezeBalance ?? 0);

  // Freeze earned every 21 days
  const nextMilestone = Math.ceil((current + 1) / 21) * 21;
  const daysToMilestone = nextMilestone - current;

  async function handleUseFreeze() {
    try {
      await useFreeze.mutateAsync();
      toast.success("Streak freeze used! Your streak is protected today.");
    } catch (_e) {
      toast.error("Failed to use freeze. Try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-5 rounded-full bg-space-gold" />
        <h3 className="text-sm font-orbitron font-semibold tracking-widest text-muted-foreground uppercase">
          Orbit Stats
        </h3>
      </div>

      {/* Streak + Freeze row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current Streak */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-background/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Current Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-orbitron font-bold"
              style={{
                color: current > 0 ? "#ffd54f" : undefined,
                textShadow: current > 0
                  ? "0 0 20px rgba(255,213,79,0.8), 0 0 40px rgba(255,213,79,0.4)"
                  : undefined,
              }}
            >
              {current}
            </span>
            <span className="text-muted-foreground text-sm">days</span>
          </div>
        </div>

        {/* Freeze Balance */}
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-background/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Snowflake className="w-3.5 h-3.5 text-blue-300" />
            <span>Freeze Balance</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-orbitron font-bold"
              style={{
                color: freezeBalance > 0 ? "#4fc3f7" : undefined,
                textShadow: freezeBalance > 0
                  ? "0 0 20px rgba(79,195,247,0.8)"
                  : undefined,
              }}
            >
              {freezeBalance}
            </span>
            <span className="text-muted-foreground text-sm">left</span>
          </div>
        </div>
      </div>

      {/* Longest streak */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="w-4 h-4 text-space-gold/70" />
        <span>Best streak: </span>
        <span className="font-semibold text-foreground">{longest} days</span>
      </div>

      {/* Milestone */}
      <div className="flex items-center gap-2 text-sm">
        <Star className="w-4 h-4 text-space-purple/80 shrink-0" />
        <span className="text-muted-foreground">
          {current === 0
            ? "Reach 21 days to earn a freeze!"
            : `${daysToMilestone} day${daysToMilestone !== 1 ? "s" : ""} to next freeze reward`}
        </span>
      </div>

      {/* Use Freeze */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/60 transition-all"
              disabled={freezeBalance === 0 || current === 0 || useFreeze.isPending}
              onClick={handleUseFreeze}
            >
              <Shield className="w-4 h-4" />
              {useFreeze.isPending ? "Activating..." : "Use Streak Freeze"}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
        {freezeBalance === 0
          ? "No freezes available. Complete 21-day streaks to earn them!"
          : current === 0
            ? "No active streak to protect"
            : "Protect your streak for today"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
