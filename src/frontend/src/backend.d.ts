import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StreakData {
    lastActiveDate: string;
    freezeUsedToday: boolean;
    longestStreak: bigint;
    freezeBalance: bigint;
    currentStreak: bigint;
}
export interface SessionRecord {
    duration: bigint;
    sessionType: SessionType;
    dateString: string;
    timestamp: bigint;
}
export interface UserSettings {
    longBreakDuration: bigint;
    longBreakInterval: bigint;
    shortBreakDuration: bigint;
    focusDuration: bigint;
}
export interface UserProfile {
    name: string;
    email?: string;
}
export interface Goal {
    id: string;
    active: boolean;
    name: string;
    dailyTargetSessions: bigint;
}
export enum SessionType {
    focus = "focus",
    short_break = "short_break",
    long_break = "long_break"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGoal(id: string, name: string, dailyTargetSessions: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAllSessions(): Promise<void>;
    deleteGoal(id: string): Promise<void>;
    earnFreeze(): Promise<void>;
    getAllGoals(): Promise<Array<Goal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFreezeBalance(): Promise<bigint>;
    getSessionsByDateRange(startDate: string, endDate: string): Promise<Array<SessionRecord>>;
    getSettings(): Promise<UserSettings>;
    getStreakData(): Promise<StreakData>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logSession(duration: bigint, sessionType: SessionType, dateString: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setSettings(focusDuration: bigint, shortBreakDuration: bigint, longBreakDuration: bigint, longBreakInterval: bigint): Promise<void>;
    updateGoal(id: string, name: string, dailyTargetSessions: bigint, active: boolean): Promise<void>;
    updateStreak(currentStreak: bigint, longestStreak: bigint, lastActiveDate: string, freezeBalance: bigint, freezeUsedToday: boolean): Promise<void>;
    useFreeze(): Promise<void>;
}
