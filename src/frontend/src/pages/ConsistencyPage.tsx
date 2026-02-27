import { useState, useMemo } from "react";
import { Target, Plus, Trash2, Trophy, Flame, Star, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal, useSessions, useStreakData, useUpdateStreak, useClearSessions, SessionType } from "../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const today = getDateString();

// Emoji based on session count for streak calendar
function getSessionEmoji(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "🌱";
  if (count === 2) return "🔥";
  if (count === 3) return "🚀";
  return "⭐";
}

// Build months from the current month onward through end of 2026
function getMonthsFromToday(): { year: number; month: number; label: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const months: { year: number; month: number; label: string }[] = [];

  // Add remaining months of current year
  for (let m = currentMonth; m < 12; m++) {
    months.push({
      year: currentYear,
      month: m,
      label: new Date(currentYear, m, 1).toLocaleString("en-US", { month: "long" }),
    });
  }

  // If current year is before 2026, add 2026 months as well
  if (currentYear < 2026) {
    for (let m = 0; m < 12; m++) {
      months.push({
        year: 2026,
        month: m,
        label: new Date(2026, m, 1).toLocaleString("en-US", { month: "long" }),
      });
    }
  }

  return months;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // Mon=0
}

interface MonthCalendarProps {
  year: number;
  month: number;
  label: string;
  sessionMap: Map<string, number>;
}

function MonthCalendar({ year, month, label, sessionMap }: MonthCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfWeek(year, month);
  const todayStr = getDateString();
  const currentDate = new Date();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDayOffset).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h4 className="font-orbitron text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        {label} {year}
      </h4>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground/50 font-orbitron py-0.5">
            {d[0]}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-0.5">
        {weeks.map((wk) => {
          const firstDay = wk.find((d) => d !== null) ?? "x";
          const weekKey = `wk-${year}-${month}-${firstDay}`;
          const DOW = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
          const slots = wk.map((day, pos) => {
            const dow = DOW[pos] ?? `p${pos}`;
            if (day === null) return { key: `${weekKey}-${dow}`, day: null, dow };
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return { key: dateStr, day, dateStr, dow };
          });
          return (
            <div key={weekKey} className="grid grid-cols-7 gap-0.5">
              {slots.map((slot) => {
                if (slot.day === null) {
                  return <div key={slot.key} />;
                }
                const { dateStr, day } = slot as { key: string; day: number; dateStr: string };
                const isToday = dateStr === todayStr;
                const isFuture = new Date(dateStr + "T00:00:00") > currentDate;
                const count = sessionMap.get(dateStr) ?? 0;
                const emoji = getSessionEmoji(count);
                return (
                  <div
                    key={dateStr}
                    title={`${dateStr}: ${count} session${count !== 1 ? "s" : ""}`}
                    className={`
                      relative flex flex-col items-center justify-center rounded-md
                      h-8 text-[10px] font-grotesk cursor-default transition-all
                      ${isToday ? "ring-1 ring-space-blue bg-space-blue/10" : ""}
                      ${isFuture ? "opacity-25" : ""}
                      ${count > 0 && !isFuture ? "bg-white/5" : ""}
                    `}
                  >
                    {emoji ? (
                      <span className="text-sm leading-none">{emoji}</span>
                    ) : (
                      <span className={`text-[10px] ${isToday ? "text-space-blue font-bold" : "text-muted-foreground/50"}`}>
                        {day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConsistencyPage() {
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const { data: streak } = useStreakData();
  const addGoal = useAddGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const updateStreak = useUpdateStreak();
  const clearSessions = useClearSessions();
  const qc = useQueryClient();

  // Determine date range for calendar: from today to end of 2026
  const calendarStart = today;
  const calendarEnd = "2026-12-31";

  const { data: calendarSessions = [] } = useSessions(calendarStart, calendarEnd);

  // Also fetch today's sessions to track goal progress
  const { data: todaySessions = [] } = useSessions(today, today);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(4);

  // Reset state: 0=idle, 1=first confirm, 2=second confirm
  const [resetStep, setResetStep] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  const todayFocusCount = useMemo(
    () => todaySessions.filter((s) => s.sessionType === SessionType.focus).length,
    [todaySessions],
  );

  const sessionMap = useMemo(() => {
    const m = new Map<string, number>();
    calendarSessions.forEach((s) => {
      if (s.sessionType === SessionType.focus) {
        m.set(s.dateString, (m.get(s.dateString) ?? 0) + 1);
      }
    });
    return m;
  }, [calendarSessions]);

  const currentStreak = Number(streak?.currentStreak ?? 0);
  const longestStreak = Number(streak?.longestStreak ?? 0);

  // Months to show: from current month onward
  const calendarMonths = useMemo(() => getMonthsFromToday(), []);

  async function handleAddGoal() {
    const name = newGoalName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    try {
      await addGoal.mutateAsync({ id, name, dailyTargetSessions: BigInt(newGoalTarget) });
      toast.success(`Goal "${name}" added!`);
      setNewGoalName("");
      setNewGoalTarget(4);
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add goal.");
    }
  }

  async function handleToggleGoal(id: string, name: string, dailyTargetSessions: bigint, active: boolean) {
    try {
      await updateGoal.mutateAsync({ id, name, dailyTargetSessions, active });
    } catch {
      toast.error("Failed to update goal.");
    }
  }

  async function handleDeleteGoal(id: string, name: string) {
    try {
      await deleteGoal.mutateAsync(id);
      toast.success(`Goal "${name}" removed.`);
    } catch {
      toast.error("Failed to delete goal.");
    }
  }

  async function handleResetAll() {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }
    if (resetStep === 1) {
      setResetStep(2);
      return;
    }
    // Step 2 confirmed - perform full reset
    setIsResetting(true);
    try {
      // Clear all session records from the backend
      await clearSessions.mutateAsync();

      // Reset streak data
      await updateStreak.mutateAsync({
        currentStreak: 0n,
        longestStreak: 0n,
        lastActiveDate: "",
        freezeBalance: 2n,
        freezeUsedToday: false,
      });

      // Delete all goals
      for (const goal of goals) {
        await deleteGoal.mutateAsync(goal.id);
      }

      // Reset local session count storage
      localStorage.removeItem("focusorbit_sessions_today");

      // Invalidate all queries to refresh the UI
      await qc.invalidateQueries();

      toast.success("All consistency data has been reset.");
      setResetStep(0);
    } catch {
      toast.error("Reset failed. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  function cancelReset() {
    setResetStep(0);
  }

  // Milestone derivation
  const milestones = useMemo(() => {
    const list: { label: string; emoji: string; achieved: boolean }[] = [];
    const thresholds = [3, 7, 14, 21, 30, 50, 100];
    for (const t of thresholds) {
      list.push({
        label: `${t}-day streak`,
        emoji: t >= 100 ? "🏆" : t >= 30 ? "⭐" : t >= 14 ? "🚀" : t >= 7 ? "🔥" : "🌱",
        achieved: longestStreak >= t,
      });
    }
    return list;
  }, [longestStreak]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-space-blue/15 border border-space-blue/30 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px rgba(79,195,247,0.3)" }}
          >
            <Target className="w-5 h-5 text-space-blue" />
          </div>
          <div>
            <h2 className="font-orbitron text-2xl font-bold text-foreground">
              Consistency 🎯
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">Goals, streaks, and your orbit journey</p>
          </div>
        </div>

        {/* Reset button area */}
        <div className="flex items-center gap-2">
          {resetStep === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
              onClick={handleResetAll}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </Button>
          )}
          {resetStep === 1 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-amber-400 font-orbitron">Are you sure?</span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/40 text-red-400 hover:bg-red-500/15 text-xs px-2 py-1 h-7"
                onClick={handleResetAll}
              >
                Yes, reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 px-2"
                onClick={cancelReset}
              >
                Cancel
              </Button>
            </div>
          )}
          {resetStep === 2 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-red-400 font-orbitron">This will erase ALL data!</span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-600/60 text-red-400 hover:bg-red-600/20 text-xs px-2 py-1 h-7"
                onClick={handleResetAll}
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Confirm erase"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 px-2"
                onClick={cancelReset}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section A: Goals & Commitments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            Goals & Commitments
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-space-blue/30 text-space-blue hover:bg-space-blue/10 text-xs"
            onClick={() => setShowAddForm((v) => !v)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Goal
          </Button>
        </div>

        {/* Add Goal Form */}
        {showAddForm && (
          <div className="glass-card rounded-xl p-4 space-y-4 animate-slide-up border border-space-blue/20">
            <h4 className="font-orbitron text-xs font-semibold text-space-blue uppercase tracking-widest">New Goal</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Goal Name</Label>
                <Input
                  placeholder="e.g. Daily study session"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="bg-background/40 border-border/40 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Daily Target (sessions)</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-background/40 border-border/40 text-sm w-32"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-space-blue/20 text-space-blue border border-space-blue/40 hover:bg-space-blue/30 text-xs"
                  onClick={handleAddGoal}
                  disabled={addGoal.isPending || !newGoalName.trim()}
                >
                  <Plus className="w-3 h-3" />
                  {addGoal.isPending ? "Saving..." : "Save Goal"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goalsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card rounded-xl p-4 animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-2 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center space-y-2">
            <div className="text-4xl">🎯</div>
            <p className="text-muted-foreground text-sm">No goals yet. Add one to track your daily commitments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const target = Number(goal.dailyTargetSessions);
              const progressPct = Math.min(100, Math.round((todayFocusCount / target) * 100));
              return (
                <div
                  key={goal.id}
                  className={`glass-card rounded-xl p-4 space-y-3 transition-all ${
                    !goal.active ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-grotesk font-semibold text-foreground text-sm truncate">
                          {goal.name}
                        </span>
                        {goal.active && progressPct >= 100 && (
                          <span className="text-xs text-green-400 font-orbitron">✓ Done</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {target} session{target !== 1 ? "s" : ""}/day
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={goal.active}
                          onCheckedChange={(checked) =>
                            handleToggleGoal(goal.id, goal.name, goal.dailyTargetSessions, checked)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteGoal(goal.id, goal.name)}
                        disabled={deleteGoal.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {goal.active && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Today's progress</span>
                        <span className="font-mono">
                          {Math.min(todayFocusCount, target)}/{target} sessions
                        </span>
                      </div>
                      <Progress
                        value={progressPct}
                        className="h-1.5 bg-white/10"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section B: Streak Calendar (from today's month forward) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-orbitron text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            Orbit Calendar
          </h3>
          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
            <span>🌱 1</span>
            <span>🔥 2</span>
            <span>🚀 3</span>
            <span>⭐ 4+</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendarMonths.map(({ year, month, label }) => (
            <MonthCalendar
              key={`${year}-${month}`}
              year={year}
              month={month}
              label={label}
              sessionMap={sessionMap}
            />
          ))}
        </div>
      </section>

      {/* Section C: Streak Milestones */}
      <section className="space-y-4">
        <h3 className="font-orbitron text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          Streak Milestones
        </h3>

        {/* Current & longest streak */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Current Streak
            </div>
            <div
              className="font-orbitron text-3xl font-bold"
              style={{
                color: currentStreak > 0 ? "#ffd54f" : undefined,
                textShadow: currentStreak > 0 ? "0 0 20px rgba(255,213,79,0.8)" : undefined,
              }}
            >
              {currentStreak}
              <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-space-gold" />
              Longest Streak
            </div>
            <div
              className="font-orbitron text-3xl font-bold"
              style={{
                color: longestStreak > 0 ? "#ffd54f" : undefined,
                textShadow: longestStreak > 0 ? "0 0 20px rgba(255,213,79,0.8)" : undefined,
              }}
            >
              {longestStreak}
              <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
            </div>
          </div>
        </div>

        {/* Milestone timeline */}
        <div className="glass-card rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-space-gold/80" />
            <span className="font-orbitron text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Achievement Path
            </span>
          </div>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all ${
                    m.achieved
                      ? "bg-space-gold/20 border border-space-gold/40"
                      : "bg-white/5 border border-border/30 opacity-40"
                  }`}
                >
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-grotesk ${m.achieved ? "text-foreground font-semibold" : "text-muted-foreground/50"}`}>
                    {m.label}
                  </div>
                </div>
                {m.achieved && (
                  <span className="text-xs text-green-400 font-orbitron">✓ Achieved</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
