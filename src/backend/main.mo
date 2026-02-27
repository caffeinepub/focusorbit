import Migration "migration";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import List "mo:core/List";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  module SessionRecord {
    public func compare(session1 : SessionRecord, session2 : SessionRecord) : Order.Order {
      Int.compare(session1.timestamp, session2.timestamp);
    };
  };

  type UserSettings = {
    focusDuration : Nat;
    shortBreakDuration : Nat;
    longBreakDuration : Nat;
    longBreakInterval : Nat;
  };

  let defaultSettings : UserSettings = {
    focusDuration = 25;
    shortBreakDuration = 5;
    longBreakDuration = 15;
    longBreakInterval = 4;
  };

  type StreakData = {
    currentStreak : Nat;
    longestStreak : Nat;
    lastActiveDate : Text;
    freezeBalance : Nat;
    freezeUsedToday : Bool;
  };

  let defaultStreakData : StreakData = {
    currentStreak = 0;
    longestStreak = 0;
    lastActiveDate = "";
    freezeBalance = 3;
    freezeUsedToday = false;
  };

  type Goal = {
    id : Text;
    name : Text;
    dailyTargetSessions : Nat;
    active : Bool;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  let userSettings = Map.empty<Principal, UserSettings>();
  let userSessions = Map.empty<Principal, List.List<SessionRecord>>();
  let userStreaks = Map.empty<Principal, StreakData>();
  let userGoals = Map.empty<Principal, List.List<Goal>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User Settings
  public shared ({ caller }) func setSettings(focusDuration : Nat, shortBreakDuration : Nat, longBreakDuration : Nat, longBreakInterval : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify settings");
    };
    let settings : UserSettings = {
      focusDuration;
      shortBreakDuration;
      longBreakDuration;
      longBreakInterval;
    };
    userSettings.add(caller, settings);
  };

  public query ({ caller }) func getSettings() : async UserSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access settings");
    };
    switch (userSettings.get(caller)) {
      case (null) { defaultSettings };
      case (?settings) { settings };
    };
  };

  // Session Logging
  public shared ({ caller }) func logSession(duration : Nat, sessionType : SessionType, dateString : Text) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log sessions");
    };
    let timestamp = Time.now() / 1_000_000_000;

    let session : SessionRecord = {
      timestamp;
      duration;
      sessionType;
      dateString;
    };

    let sessionsList = switch (userSessions.get(caller)) {
      case (null) {
        let newList = List.empty<SessionRecord>();
        newList.add(session);
        newList;
      };
      case (?existing) {
        existing.add(session);
        existing;
      };
    };

    userSessions.add(caller, sessionsList);
    timestamp;
  };

  public query ({ caller }) func getSessionsByDateRange(startDate : Text, endDate : Text) : async [SessionRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sessions");
    };
    switch (userSessions.get(caller)) {
      case (null) { [] };
      case (?sessions) {
        sessions.toArray().sort().filter(
          func(s) {
            s.dateString >= startDate and s.dateString <= endDate
          }
        );
      };
    };
  };

  public shared ({ caller }) func clearAllSessions() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear sessions");
    };
    userSessions.remove(caller);
  };

  // Streak Tracking
  public query ({ caller }) func getStreakData() : async StreakData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access streak data");
    };
    switch (userStreaks.get(caller)) {
      case (null) { defaultStreakData };
      case (?data) { data };
    };
  };

  public shared ({ caller }) func updateStreak(currentStreak : Nat, longestStreak : Nat, lastActiveDate : Text, freezeBalance : Nat, freezeUsedToday : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update streak data");
    };
    let streakData : StreakData = {
      currentStreak;
      longestStreak;
      lastActiveDate;
      freezeBalance;
      freezeUsedToday;
    };
    userStreaks.add(caller, streakData);
  };

  public query ({ caller }) func getFreezeBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access freeze balance");
    };
    switch (userStreaks.get(caller)) {
      case (null) { defaultStreakData.freezeBalance };
      case (?data) { data.freezeBalance };
    };
  };

  public shared ({ caller }) func useFreeze() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use freezes");
    };
    let streakData = switch (userStreaks.get(caller)) {
      case (null) { defaultStreakData };
      case (?data) { data };
    };

    if (streakData.freezeBalance == 0) {
      Runtime.trap("No freezes available");
    };

    let updatedData : StreakData = {
      streakData with
      freezeBalance = streakData.freezeBalance - 1;
      freezeUsedToday = true;
    };
    userStreaks.add(caller, updatedData);
  };

  public shared ({ caller }) func earnFreeze() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can earn freezes");
    };
    let streakData = switch (userStreaks.get(caller)) {
      case (null) { defaultStreakData };
      case (?data) { data };
    };

    if (streakData.freezeBalance >= 5) {
      return;
    };

    let updatedData : StreakData = {
      streakData with
      freezeBalance = streakData.freezeBalance + 1;
    };
    userStreaks.add(caller, updatedData);
  };

  // Goals/Commitments
  public shared ({ caller }) func addGoal(id : Text, name : Text, dailyTargetSessions : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add goals");
    };
    let newGoal : Goal = {
      id;
      name;
      dailyTargetSessions;
      active = true;
    };

    let goalsList = switch (userGoals.get(caller)) {
      case (null) {
        let newList = List.empty<Goal>();
        newList.add(newGoal);
        newList;
      };
      case (?existing) {
        existing.add(newGoal);
        existing;
      };
    };

    userGoals.add(caller, goalsList);
  };

  public query ({ caller }) func getAllGoals() : async [Goal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access goals");
    };
    switch (userGoals.get(caller)) {
      case (null) { [] };
      case (?goals) { goals.toArray() };
    };
  };

  public shared ({ caller }) func updateGoal(id : Text, name : Text, dailyTargetSessions : Nat, active : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update goals");
    };
    let goalsList = switch (userGoals.get(caller)) {
      case (null) { Runtime.trap("No goals found") };
      case (?existing) {
        existing.map<Goal, Goal>(
          func(goal) {
            if (goal.id == id) {
              {
                id;
                name;
                dailyTargetSessions;
                active;
              };
            } else { goal };
          }
        );
      };
    };
    userGoals.add(caller, goalsList);
  };

  public shared ({ caller }) func deleteGoal(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete goals");
    };
    let goalsList = switch (userGoals.get(caller)) {
      case (null) { Runtime.trap("No goals found") };
      case (?existing) {
        let filteredGoals = existing.filter(func(goal) { goal.id != id });
        userGoals.add(caller, filteredGoals);
      };
    };
  };
};
