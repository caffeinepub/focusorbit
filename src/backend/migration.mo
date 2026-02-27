import Text "mo:core/Text";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type SessionType = {
    #focus;
    #short_break;
    #long_break;
  };

  type SessionRecord = {
    timestamp : Int;
    duration : Nat;
    sessionType : SessionType;
    dateString : Text;
  };

  type UserSettings = {
    focusDuration : Nat;
    shortBreakDuration : Nat;
    longBreakDuration : Nat;
    longBreakInterval : Nat;
  };

  type StreakData = {
    currentStreak : Nat;
    longestStreak : Nat;
    lastActiveDate : Text;
    freezeBalance : Nat;
    freezeUsedToday : Bool;
  };

  type Goal = {
    id : Text;
    name : Text;
    dailyTargetSessions : Nat;
    active : Bool;
  };

  type UserProfile = {
    name : Text;
    email : ?Text;
  };

  type OldActor = {
    userSettings : Map.Map<Principal, UserSettings>;
    userSessions : Map.Map<Principal, List.List<SessionRecord>>;
    userStreaks : Map.Map<Principal, StreakData>;
    userGoals : Map.Map<Principal, List.List<Goal>>;
  };

  type NewActor = {
    userSettings : Map.Map<Principal, UserSettings>;
    userSessions : Map.Map<Principal, List.List<SessionRecord>>;
    userStreaks : Map.Map<Principal, StreakData>;
    userGoals : Map.Map<Principal, List.List<Goal>>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    {
      userSettings = old.userSettings;
      userSessions = old.userSessions;
      userStreaks = old.userStreaks;
      userGoals = old.userGoals;
      userProfiles = Map.empty<Principal, UserProfile>();
    };
  };
};
