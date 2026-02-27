import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Calendar, TrendingUp, Clock, Flame, Trophy, Download, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSessions, useStreakData, useUpdateStreak, useClearSessions, type SessionRecord } from "../hooks/useQueries";
import { SessionType } from "../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Period = "week" | "month" | "alltime";

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = getDateString(now);
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { start: getDateString(start), end };
  }
  if (period === "month") {
    const start = new Date(now);
    start.setDate(1);
    return { start: getDateString(start), end };
  }
  // alltime: last 365 days
  const start = new Date(now);
  start.setFullYear(now.getFullYear() - 1);
  return { start: getDateString(start), end };
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  while (cur <= endDate) {
    days.push(getDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

interface DayData {
  date: string;
  label: string;
  focusSessions: number;
  focusMinutes: number;
  breakSessions: number;
}

function processSessionsByDay(sessions: SessionRecord[], days: string[]): DayData[] {
  const map = new Map<string, DayData>();
  days.forEach((d) => {
    const dateObj = new Date(d + "T00:00:00");
    const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map.set(d, { date: d, label, focusSessions: 0, focusMinutes: 0, breakSessions: 0 });
  });

  sessions.forEach((s) => {
    const existing = map.get(s.dateString);
    if (!existing) return;
    if (s.sessionType === SessionType.focus) {
      existing.focusSessions += 1;
      existing.focusMinutes += Math.round(Number(s.duration) / 60);
    } else {
      existing.breakSessions += 1;
    }
  });

  return Array.from(map.values());
}

// Heatmap colors based on session count
function heatColor(count: number, max: number): string {
  if (count === 0) return "rgba(255,255,255,0.04)";
  const ratio = Math.min(count / Math.max(max, 1), 1);
  if (ratio < 0.25) return "rgba(79,195,247,0.2)";
  if (ratio < 0.5) return "rgba(79,195,247,0.45)";
  if (ratio < 0.75) return "rgba(79,195,247,0.70)";
  return "rgba(79,195,247,0.95)";
}

function exportCSV(sessions: SessionRecord[], period: Period) {
  const header = "Date,Session Type,Duration (min),Timestamp\n";
  const rows = sessions
    .map((s) => {
      const type =
        s.sessionType === SessionType.focus
          ? "Focus"
          : s.sessionType === SessionType.short_break
            ? "Short Break"
            : "Long Break";
      const dur = Math.round(Number(s.duration) / 60);
      const ts = new Date(Number(s.timestamp) / 1_000_000).toISOString();
      return `${s.dateString},${type},${dur},${ts}`;
    })
    .join("\n");

  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focusorbit-${period}-${getDateString(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(sessions: SessionRecord[], period: Period, stats: {
  totalFocus: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
}) {
  const printDiv = document.getElementById("print-report");
  if (!printDiv) return;

  const periodLabel = period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time";

  printDiv.innerHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px; color: #111;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">FocusOrbit</h1>
        <p style="color: #666; font-size: 14px;">Progress Report — ${periodLabel}</p>
        <p style="color: #666; font-size: 12px;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Total Focus Sessions</div>
          <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${stats.totalFocus}</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Total Focus Minutes</div>
          <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${stats.totalMinutes}</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Current Streak</div>
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${stats.currentStreak} days</div>
        </div>
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Longest Streak</div>
          <div style="font-size: 32px; font-weight: bold; color: #d97706;">${stats.longestStreak} days</div>
        </div>
      </div>

      <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">Session Log</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Type</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Duration (min)</th>
          </tr>
        </thead>
        <tbody>
          ${sessions
            .slice(0, 50)
            .map((s) => {
              const type =
                s.sessionType === SessionType.focus
                  ? "Focus"
                  : s.sessionType === SessionType.short_break
                    ? "Short Break"
                    : "Long Break";
              return `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${s.dateString}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${type}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${Math.round(Number(s.duration) / 60)}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
      ${sessions.length > 50 ? `<p style="font-size: 12px; color: #666; margin-top: 8px;">Showing 50 of ${sessions.length} sessions. Download CSV for full data.</p>` : ""}
    </div>
  `;

  window.print();
}

// Custom tooltip for recharts
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs border border-space-blue/20">
      <div className="font-semibold text-foreground mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="text-muted-foreground">
          {p.name}: <span className="text-space-blue font-mono">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const { start, end } = useMemo(() => getDateRange(period), [period]);
  const { data: sessions = [], isLoading } = useSessions(start, end);
  const { data: streak } = useStreakData();
  const updateStreak = useUpdateStreak();
  const clearSessions = useClearSessions();
  const qc = useQueryClient();

  const [resetStep, setResetStep] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  const days = useMemo(() => getDaysInRange(start, end), [start, end]);
  const dayData = useMemo(() => processSessionsByDay(sessions, days), [sessions, days]);

  const totalFocus = sessions.filter((s) => s.sessionType === SessionType.focus).length;
  const totalMinutes = sessions
    .filter((s) => s.sessionType === SessionType.focus)
    .reduce((acc, s) => acc + Math.round(Number(s.duration) / 60), 0);
  const currentStreak = Number(streak?.currentStreak ?? 0);
  const longestStreak = Number(streak?.longestStreak ?? 0);

  async function handleAnalyticsReset() {
    if (resetStep === 0) { setResetStep(1); return; }
    if (resetStep === 1) { setResetStep(2); return; }
    setIsResetting(true);
    try {
      await clearSessions.mutateAsync();
      await updateStreak.mutateAsync({
        currentStreak: 0n,
        longestStreak: 0n,
        lastActiveDate: "",
        freezeBalance: 2n,
        freezeUsedToday: false,
      });
      localStorage.removeItem("focusorbit_sessions_today");
      await qc.invalidateQueries();
      toast.success("Analytics data has been reset.");
      setResetStep(0);
    } catch {
      toast.error("Reset failed. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  const maxSessions = Math.max(...dayData.map((d) => d.focusSessions), 1);

  // Heatmap: last 12 weeks
  const heatmapDays = useMemo(() => {
    const heatEnd = new Date();
    const heatStart = new Date(heatEnd);
    heatStart.setDate(heatEnd.getDate() - 83); // ~12 weeks
    return getDaysInRange(getDateString(heatStart), getDateString(heatEnd));
  }, []);

  const { data: heatmapSessions = [] } = useSessions(
    heatmapDays[0] ?? start,
    heatmapDays[heatmapDays.length - 1] ?? end,
  );

  const heatmapMap = useMemo(() => {
    const m = new Map<string, number>();
    heatmapSessions.forEach((s) => {
      if (s.sessionType === SessionType.focus) {
        m.set(s.dateString, (m.get(s.dateString) ?? 0) + 1);
      }
    });
    return m;
  }, [heatmapSessions]);

  const heatmapMax = Math.max(...Array.from(heatmapMap.values()), 1);

  // Group heatmap into weeks (cols)
  const heatmapWeeks = useMemo(() => {
    const weeks: string[][] = [];
    let week: string[] = [];
    heatmapDays.forEach((d, i) => {
      week.push(d);
      if (week.length === 7 || i === heatmapDays.length - 1) {
        weeks.push(week);
        week = [];
      }
    });
    return weeks;
  }, [heatmapDays]);

  const stats = { totalFocus, totalMinutes, currentStreak, longestStreak };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron text-2xl font-bold text-foreground">
            Mission Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Track your focus orbit</p>
        </div>

        {/* Export + Reset buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-space-blue/30 text-space-blue hover:bg-space-blue/10"
            onClick={() => exportCSV(sessions, period)}
            disabled={sessions.length === 0}
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-space-purple/30 text-space-purple hover:bg-space-purple/10"
            onClick={() => exportPDF(sessions, period, stats)}
            disabled={sessions.length === 0}
          >
            <FileText className="w-4 h-4" />
            PDF
          </Button>

          {/* Reset */}
          {resetStep === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleAnalyticsReset}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
          {resetStep === 1 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-amber-400 font-orbitron">Are you sure?</span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/40 text-red-400 hover:bg-red-500/15 text-xs px-2 py-1 h-8"
                onClick={handleAnalyticsReset}
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8 px-2"
                onClick={() => setResetStep(0)}
              >
                Cancel
              </Button>
            </div>
          )}
          {resetStep === 2 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-red-400 font-orbitron">Erase all data?</span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-600/60 text-red-400 hover:bg-red-600/20 text-xs px-2 py-1 h-8"
                onClick={handleAnalyticsReset}
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Confirm"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8 px-2"
                onClick={() => setResetStep(0)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <Flame className="w-5 h-5 text-orange-400" />,
            label: "Focus Sessions",
            value: totalFocus,
            unit: "",
            color: "#4fc3f7",
          },
          {
            icon: <Clock className="w-5 h-5 text-space-blue" />,
            label: "Focus Minutes",
            value: totalMinutes,
            unit: "min",
            color: "#4fc3f7",
          },
          {
            icon: <TrendingUp className="w-5 h-5 text-space-gold" />,
            label: "Current Streak",
            value: currentStreak,
            unit: "days",
            color: "#ffd54f",
          },
          {
            icon: <Trophy className="w-5 h-5 text-space-gold" />,
            label: "Longest Streak",
            value: longestStreak,
            unit: "days",
            color: "#ffd54f",
          },
        ].map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs">
              {card.icon}
              <span>{card.label}</span>
            </div>
            <div
              className="font-orbitron text-2xl font-bold"
              style={{
                color: card.color,
                textShadow: `0 0 20px ${card.color}60`,
              }}
            >
              {card.value}
              {card.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{card.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Period Tabs + Chart */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-space-blue" />
              <h3 className="font-orbitron font-semibold text-sm">Session Activity</h3>
            </div>
            <TabsList className="glass-card border-border/30">
              <TabsTrigger value="week" className="text-xs font-orbitron">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs font-orbitron">Month</TabsTrigger>
              <TabsTrigger value="alltime" className="text-xs font-orbitron">All Time</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="week" className="mt-0">
            <SessionBarChart data={dayData} isLoading={isLoading} maxSessions={maxSessions} />
          </TabsContent>
          <TabsContent value="month" className="mt-0">
            <SessionBarChart data={dayData} isLoading={isLoading} maxSessions={maxSessions} />
          </TabsContent>
          <TabsContent value="alltime" className="mt-0">
            <SessionBarChart data={dayData} isLoading={isLoading} maxSessions={maxSessions} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Calendar Heatmap */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-space-purple" />
          <h3 className="font-orbitron font-semibold text-sm">Focus Heatmap</h3>
          <span className="text-xs text-muted-foreground ml-auto">Last 12 weeks</span>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {heatmapWeeks.map((week) => (
              <div key={`week-${week[0] ?? "empty"}`} className="flex flex-col gap-1">
                {week.map((day) => {
                  const count = heatmapMap.get(day) ?? 0;
                  const today = getDateString(new Date());
                  const isToday = day === today;
                  return (
                    <div
                      key={day}
                      title={`${day}: ${count} session${count !== 1 ? "s" : ""}`}
                      className="w-3 h-3 rounded-sm transition-all cursor-default"
                      style={{
                        background: heatColor(count, heatmapMax),
                        outline: isToday ? "1px solid rgba(79,195,247,0.8)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <div
              key={`legend-${ratio}`}
              className="w-3 h-3 rounded-sm"
              style={{ background: heatColor(Math.round(ratio * heatmapMax), heatmapMax) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

interface SessionBarChartProps {
  data: DayData[];
  isLoading: boolean;
  maxSessions: number;
}

function SessionBarChart({ data, isLoading, maxSessions }: SessionBarChartProps) {
  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        <div className="w-5 h-5 border-2 border-space-blue/30 border-t-space-blue rounded-full animate-spin mr-2" />
        Loading sessions...
      </div>
    );
  }

  if (data.every((d) => d.focusSessions === 0)) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <div className="text-4xl">🚀</div>
        <div className="text-sm">No sessions recorded for this period</div>
        <div className="text-xs opacity-60">Start a focus session to see your data</div>
      </div>
    );
  }

  // Limit labels for readability
  const displayData = data.length > 31
    ? data.filter((_, i) => i % Math.ceil(data.length / 30) === 0)
    : data;

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={displayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "oklch(0.55 0.04 265)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "oklch(0.55 0.04 265)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.max(maxSessions, 1)]}
          />
          <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(79,195,247,0.06)" }} />
          <Bar dataKey="focusSessions" name="Focus" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {displayData.map((entry) => (
              <Cell
                key={`cell-${entry.date}`}
                fill={
                  entry.focusSessions > 0
                    ? `rgba(79,195,247,${0.4 + 0.6 * (entry.focusSessions / maxSessions)})`
                    : "rgba(255,255,255,0.06)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
