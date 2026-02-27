import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { SessionType, type StreakData, type UserSettings, type SessionRecord, type Goal } from "../backend.d";

export type { StreakData, UserSettings, SessionRecord, Goal };
export { SessionType };

// ——— Settings ———

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) {
        return {
          focusDuration: 25n,
          shortBreakDuration: 5n,
          longBreakDuration: 15n,
          longBreakInterval: 4n,
        };
      }
      return actor.getSettings();
    },
    enabled: !isFetching,
    staleTime: 60_000,
  });
}

export function useSaveSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: UserSettings) => {
      if (!actor) throw new Error("No actor");
      await actor.setSettings(
        s.focusDuration,
        s.shortBreakDuration,
        s.longBreakDuration,
        s.longBreakInterval,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// ——— Streak ———

export function useStreakData() {
  const { actor, isFetching } = useActor();
  return useQuery<StreakData>({
    queryKey: ["streak"],
    queryFn: async () => {
      if (!actor) {
        return {
          currentStreak: 0n,
          longestStreak: 0n,
          lastActiveDate: "",
          freezeBalance: 0n,
          freezeUsedToday: false,
        };
      }
      return actor.getStreakData();
    },
    enabled: !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateStreak() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: StreakData) => {
      if (!actor) throw new Error("No actor");
      await actor.updateStreak(
        data.currentStreak,
        data.longestStreak,
        data.lastActiveDate,
        data.freezeBalance,
        data.freezeUsedToday,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}

export function useUseFreeze() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.useFreeze();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}

export function useEarnFreeze() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.earnFreeze();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}

// ——— Sessions ———

export function useClearSessions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.clearAllSessions();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useLogSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      duration,
      sessionType,
      dateString,
    }: {
      duration: bigint;
      sessionType: SessionType;
      dateString: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.logSession(duration, sessionType, dateString);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useSessions(startDate: string, endDate: string, enabled = true) {
  const { actor, isFetching } = useActor();
  return useQuery<SessionRecord[]>({
    queryKey: ["sessions", startDate, endDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionsByDateRange(startDate, endDate);
    },
    enabled: enabled && !isFetching && !!startDate && !!endDate,
    staleTime: 30_000,
  });
}

// ——— Goals ———

export function useGoals() {
  const { actor, isFetching } = useActor();
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGoals();
    },
    enabled: !isFetching,
    staleTime: 30_000,
  });
}

export function useAddGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, dailyTargetSessions }: { id: string; name: string; dailyTargetSessions: bigint }) => {
      if (!actor) throw new Error("No actor");
      await actor.addGoal(id, name, dailyTargetSessions);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, dailyTargetSessions, active }: { id: string; name: string; dailyTargetSessions: bigint; active: boolean }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateGoal(id, name, dailyTargetSessions, active);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteGoal(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
