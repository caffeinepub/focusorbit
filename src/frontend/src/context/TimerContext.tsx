import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSettings, useLogSession, useStreakData, useUpdateStreak, useEarnFreeze } from "../hooks/useQueries";
import { SessionType } from "../hooks/useQueries";

export type TimerMode = "focus" | "short_break" | "long_break";
export type ThemeName = "nature" | "space" | "discipline" | "scientist" | "alien";

interface TimerContextValue {
  mode: TimerMode;
  setMode: (m: TimerMode) => void;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  sessionCount: number;
  sessionCompletedToday: number;
  lastCompletedSessionNumber: number | null;
  currentTheme: ThemeName;
  start: () => void;
  pause: () => void;
  reset: () => void;
  resetSessionCount: () => void;
  burstActive: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function getDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const STORAGE_KEY = "focusorbit_sessions_today";

function loadSessionsToday(): number {
  try {
    const today = getDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    const parsed = JSON.parse(stored) as { date: string; count: number };
    if (parsed.date === today) return parsed.count;
    return 0;
  } catch {
    return 0;
  }
}

function saveSessionsToday(count: number): void {
  try {
    const today = getDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
  } catch {
    // ignore
  }
}

function getThemeForSessionCount(count: number): ThemeName {
  if (count <= 2) return "nature";
  if (count <= 4) return "space";
  if (count <= 6) return "discipline";
  if (count <= 8) return "scientist";
  return "alien";
}

export function playThemeSound(theme: ThemeName, isStart: boolean): void {
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtxClass();

    if (isStart) {
      playStartSound(ctx, theme);
    } else {
      playEndSound(ctx, theme);
    }
  } catch {
    // not available
  }
}

function playStartSound(ctx: AudioContext, theme: ThemeName): void {
  switch (theme) {
    case "nature": {
      // Ascending sine waves: soft, 400-600-800Hz
      [400, 600, 800].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 1.2);
      });
      break;
    }
    case "space": {
      // Sharp square+sine mix, louder
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      masterGain.connect(ctx.destination);
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? "square" : "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 1.5);
      });
      break;
    }
    case "discipline": {
      // Sharp staccato beep burst: 800Hz, 3 quick pulses
      [0, 0.12, 0.24].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(800, ctx.currentTime + offset);
        gain.gain.setValueAtTime(0, ctx.currentTime + offset);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.1);
      });
      break;
    }
    case "scientist": {
      // Electronic ascending arpeggio: triangle wave
      [300, 600, 900, 1200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.6);
      });
      break;
    }
    case "alien": {
      // Chorus of detuned oscillators: sawtooth
      [200, 207, 193].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.8);
      });
      break;
    }
  }
}

function playEndSound(ctx: AudioContext, theme: ThemeName): void {
  switch (theme) {
    case "nature": {
      // Descending gentle chime
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(-0.3, ctx.currentTime);
      panner.connect(ctx.destination);
      [600, 400, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 1.5);
        osc.connect(gain);
        gain.connect(panner);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 1.5);
      });
      break;
    }
    case "space": {
      // Gentle cascade (same as old chime)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      masterGain.connect(ctx.destination);
      [523, 659, 784, 1046].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 1.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 1.5);
      });
      break;
    }
    case "discipline": {
      // Steady low sustained tone fading out
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);
      break;
    }
    case "scientist": {
      // Lab-like descending resonance: triangle wave
      [800, 400, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.25);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.25 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.25);
        osc.stop(ctx.currentTime + i * 0.25 + 1.2);
      });
      break;
    }
    case "alien": {
      // Alien harmonics resolving
      [333, 666, 999].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 2.0);
      });
      break;
    }
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSettings();
  const { data: streakData } = useStreakData();
  const logSession = useLogSession();
  const updateStreak = useUpdateStreak();
  const earnFreeze = useEarnFreeze();

  const focusDuration = useMemo(() => Number(settings?.focusDuration ?? 25) * 60, [settings]);
  const shortBreakDuration = useMemo(() => Number(settings?.shortBreakDuration ?? 5) * 60, [settings]);
  const longBreakDuration = useMemo(() => Number(settings?.longBreakDuration ?? 15) * 60, [settings]);
  const longBreakInterval = useMemo(() => Number(settings?.longBreakInterval ?? 4), [settings]);

  const [mode, setModeRaw] = useState<TimerMode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionCompletedToday, setSessionCompletedToday] = useState<number>(loadSessionsToday);
  const [lastCompletedSessionNumber, setLastCompletedSessionNumber] = useState<number | null>(null);
  const [burstActive, setBurstActive] = useState(false);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  const currentTheme = useMemo(() => getThemeForSessionCount(sessionCompletedToday), [sessionCompletedToday]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streakRef = useRef(streakData);
  useEffect(() => { streakRef.current = streakData; }, [streakData]);

  const logSessionRef = useRef(logSession.mutateAsync);
  useEffect(() => { logSessionRef.current = logSession.mutateAsync; }, [logSession.mutateAsync]);

  const updateStreakRef = useRef(updateStreak.mutateAsync);
  useEffect(() => { updateStreakRef.current = updateStreak.mutateAsync; }, [updateStreak.mutateAsync]);

  const earnFreezeRef = useRef(earnFreeze.mutateAsync);
  useEffect(() => { earnFreezeRef.current = earnFreeze.mutateAsync; }, [earnFreeze.mutateAsync]);

  const currentThemeRef = useRef(currentTheme);
  useEffect(() => { currentThemeRef.current = currentTheme; }, [currentTheme]);

  // Sync duration from settings when not running
  useEffect(() => {
    if (!isRunning) {
      const d =
        mode === "focus"
          ? focusDuration
          : mode === "short_break"
            ? shortBreakDuration
            : longBreakDuration;
      setTotalTime(d);
      setTimeLeft(d);
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, mode, isRunning]);

  const getDuration = useCallback(
    (m: TimerMode): number => {
      if (m === "focus") return focusDuration;
      if (m === "short_break") return shortBreakDuration;
      return longBreakDuration;
    },
    [focusDuration, shortBreakDuration, longBreakDuration],
  );

  const handleSessionComplete = useCallback(
    async (completedMode: TimerMode) => {
      const theme = currentThemeRef.current;
      playThemeSound(theme, false);

      const dateStr = getDateString();
      const sessionType =
        completedMode === "focus"
          ? SessionType.focus
          : completedMode === "short_break"
            ? SessionType.short_break
            : SessionType.long_break;

      const durationSecs = getDuration(completedMode);

      try {
        await logSessionRef.current({
          duration: BigInt(durationSecs),
          sessionType,
          dateString: dateStr,
        });

        if (completedMode === "focus" && streakRef.current) {
          const streak = streakRef.current;
          const today = dateStr;
          const lastActive = streak.lastActiveDate;
          let current = Number(streak.currentStreak);
          let longest = Number(streak.longestStreak);
          // Initialize freeze balance to 2 for brand-new users
          let freezeBalance = Number(streak.freezeBalance);
          if (lastActive === "" && freezeBalance === 0) {
            freezeBalance = 2;
          }

          let earnedFreeze = false;
          if (lastActive !== today) {
            const yesterday = getDateString(new Date(Date.now() - 86_400_000));
            if (lastActive === yesterday || lastActive === "") {
              current = lastActive === "" ? 1 : current + 1;
            } else {
              current = 1;
            }
            if (current > longest) longest = current;

            // Award a freeze every 21-day milestone
            if (current > 0 && current % 21 === 0) {
              earnedFreeze = true;
              freezeBalance = Math.min(freezeBalance + 1, 10);
            }
          }

          await updateStreakRef.current({
            currentStreak: BigInt(current),
            longestStreak: BigInt(longest),
            lastActiveDate: today,
            freezeBalance: BigInt(freezeBalance),
            freezeUsedToday: streak.freezeUsedToday,
          });

          if (earnedFreeze) {
            // earnFreeze call is handled via updateStreak above; just a best-effort extra call
            try { await earnFreezeRef.current(); } catch { /* ignore */ }
          }
        }
      } catch {
        // silently fail
      }
    },
    [getDuration],
  );

  const setMode = useCallback(
    (m: TimerMode) => {
      setModeRaw(m);
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      const d = getDuration(m);
      setTotalTime(d);
      setTimeLeft(d);
    },
    [getDuration],
  );

  // Timer tick
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const longBreakIntervalRef = useRef(longBreakInterval);
  useEffect(() => { longBreakIntervalRef.current = longBreakInterval; }, [longBreakInterval]);
  const getDurationRef = useRef(getDuration);
  useEffect(() => { getDurationRef.current = getDuration; }, [getDuration]);
  const handleSessionCompleteRef = useRef(handleSessionComplete);
  useEffect(() => { handleSessionCompleteRef.current = handleSessionComplete; }, [handleSessionComplete]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);

          const currentMode = modeRef.current;
          handleSessionCompleteRef.current(currentMode);

          setSessionCount((sc) => {
            const newSc = currentMode === "focus" ? sc + 1 : sc;
            const nextMode =
              currentMode === "focus"
                ? newSc % longBreakIntervalRef.current === 0
                  ? "long_break"
                  : "short_break"
                : "focus";
            const nextDur = getDurationRef.current(nextMode);
            setModeRaw(nextMode);
            setTotalTime(nextDur);
            setTimeLeft(nextDur);
            return newSc;
          });

          if (currentMode === "focus") {
            setSessionCompletedToday((prev) => {
              const newVal = prev + 1;
              saveSessionsToday(newVal);
              // Trigger animation after a short delay
              setTimeout(() => {
                setLastCompletedSessionNumber(newVal);
                setTimeout(() => setLastCompletedSessionNumber(null), 4000);
              }, 300);
              return newVal;
            });
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 700);
    playThemeSound(currentThemeRef.current, true);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(getDuration(mode));
    setTotalTime(getDuration(mode));
  }, [getDuration, mode]);

  const resetSessionCount = useCallback(() => {
    setSessionCount(0);
    setSessionCompletedToday(0);
    saveSessionsToday(0);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        mode,
        setMode,
        timeLeft,
        totalTime,
        isRunning,
        sessionCount,
        sessionCompletedToday,
        lastCompletedSessionNumber,
        currentTheme,
        start,
        pause,
        reset,
        resetSessionCount,
        burstActive,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
}
