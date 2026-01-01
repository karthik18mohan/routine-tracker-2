"use client";

import { create } from "zustand";
import { buildMonthKey, getDaysInMonth } from "@/lib/date";
import { AppState, Habit, MonthState, UserProfile, WeeklyGoal } from "@/lib/types";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createHabit = (name: string, index: number): Habit => ({
  id: createId(),
  name,
  goalType: "perDay",
  goalValue: 0
});

const createUserProfile = (name: string, index: number): UserProfile => ({
  id: createId(),
  name
});

const seedDailyHabits = [
  "Wake up before 6:00 am",
  "Beard routine",
  "Pooja",
  "Gym",
  "Diet",
  "Brush",
  "10k Steps",
  "50 Pushups",
  "Abs Workout",
  "Project",
  "Certification Course"
];

const seedWeeklyHabits = [
  "Plan meals",
  "Go to grocery",
  "Create weekly to-do list",
  "Prepare outfits"
];

const seedMonthlyHabits = [
  "Plan for the month ahead",
  "Evaluate goals",
  "Clear out mail",
  "Do a general house cleaning"
];

const seedGoals = [
  "Go on two long walks",
  "Finish one book",
  "Meal prep every Sunday",
  "Declutter one drawer"
];

const seedWeeklyGoals = [
  "Complete 3 workouts",
  "Prep lunches for the week",
  "Plan next week priorities",
  "Schedule a recovery activity"
];

const STORAGE_VERSION = 2;

const normalizeMonth = (month: MonthState): MonthState => {
  const days = getDaysInMonth(month.year, month.month);
  const checks: Record<string, boolean[]> = {};
  month.dailyHabits.forEach((habit) => {
    const current = month.checks[habit.id] ?? [];
    checks[habit.id] = Array.from({ length: days }, (_, idx) => current[idx] ?? false);
  });

  const weeklyHabits = month.weeklyHabits.map((habit) => ({
    ...habit,
    checksByWeek: Array.from({ length: 5 }, (_, idx) => habit.checksByWeek[idx] ?? false)
  }));

  return {
    ...month,
    checks,
    weeklyHabits,
    moodByDay: Array.from({ length: days }, (_, idx) => month.moodByDay[idx] ?? 3),
    journalEntries: Array.from({ length: days }, (_, idx) => month.journalEntries[idx] ?? ""),
    weeklyGoals: month.weeklyGoals ?? []
  };
};

const createDefaultMonth = (year: number, month: number): MonthState => {
  const days = getDaysInMonth(year, month);
  const dailyHabits = seedDailyHabits.map((name, index) => createHabit(name, index));
  const checks = Object.fromEntries(
    dailyHabits.map((habit) => [habit.id, Array.from({ length: days }, () => false)])
  );

  return {
    id: createId(),
    year,
    month,
    dailyHabits,
    checks,
    weeklyHabits: seedWeeklyHabits.map((name, index) => ({
      id: createId(),
      name,
      checksByWeek: Array.from({ length: 5 }, () => false)
    })),
    monthlyHabits: seedMonthlyHabits.map((name, index) => ({
      id: createId(),
      name,
      checked: false
    })),
    goals: seedGoals.map((text, index) => ({
      id: createId(),
      text,
      done: false
    })),
    weeklyGoals: seedWeeklyGoals.map((text, index) => ({
      id: createId(),
      text,
      week: Math.min(index + 1, 5),
      done: false
    })),
    notes: "",
    moodByDay: Array.from({ length: days }, () => 3),
    journalEntries: Array.from({ length: days }, () => ""),
    dailyGoalTarget: 10
  };
};

type Store = AppState & {
  supabaseReady: boolean;
  supabaseUserId: string | null;
  supabaseError: string | null;
  isMonthLoading: boolean;
  isProfilesLoading: boolean;
  initializeSupabase: () => Promise<void>;
  refreshProfiles: (preferredUserId?: string | null) => Promise<void>;
  refreshMonth: (year: number, month: number) => Promise<MonthState | null>;
  setSelectedMonthYear: (year: number, month: number) => void;
  ensureMonth: (year: number, month: number) => Promise<void>;
  selectUser: (userId: string) => Promise<void>;
  addUser: (name: string) => Promise<void>;
  toggleDailyCheck: (habitId: string, dayIndex: number) => Promise<void>;
  toggleWeeklyCheck: (habitId: string, weekIndex: number) => Promise<void>;
  toggleMonthlyCheck: (habitId: string) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  toggleGoal: (goalId: string) => Promise<void>;
  addDailyHabit: (name: string) => Promise<void>;
  renameDailyHabit: (habitId: string, name: string) => Promise<void>;
  removeDailyHabit: (habitId: string) => Promise<void>;
  setMoodForDay: (dayIndex: number, mood: number) => Promise<void>;
  updateJournalEntry: (dayIndex: number, entry: string) => Promise<void>;
  addWeeklyGoal: (week: number, text: string) => Promise<void>;
  toggleWeeklyGoal: (goalId: string) => Promise<void>;
  removeWeeklyGoal: (goalId: string) => Promise<void>;
  importState: (state: AppState) => void;
};

const today = new Date();

const ensureSupabaseSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { user: null, error };
  }
  if (data.session?.user) {
    return { user: data.session.user, error: null };
  }
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
  if (anonError) {
    return { user: null, error: anonError };
  }
  return { user: anonData.user ?? null, error: null };
};

const fetchProfilesFromSupabase = async (ownerId: string) =>
  supabase.from("profiles").select("id,name").eq("owner_id", ownerId).order("created_at");

const createProfileInSupabase = async (ownerId: string, profile: UserProfile) =>
  supabase.from("profiles").insert({
    id: profile.id,
    owner_id: ownerId,
    name: profile.name
  });

const upsertDailyCheck = async (habitId: string, day: number, checked: boolean) =>
  supabase.from("daily_checks").upsert(
    {
      habit_id: habitId,
      day,
      checked
    },
    { onConflict: "habit_id,day" }
  );

const upsertWeeklyCheck = async (habitId: string, week: number, checked: boolean) =>
  supabase.from("weekly_checks").upsert(
    {
      habit_id: habitId,
      week,
      checked
    },
    { onConflict: "habit_id,week" }
  );

const updateMonthlyHabitCheck = async (habitId: string, checked: boolean) =>
  supabase.from("monthly_habits").update({ checked }).eq("id", habitId);

const updateMonthNotes = async (monthId: string, notes: string) =>
  supabase.from("months").update({ notes }).eq("id", monthId);

const updateGoalDone = async (goalId: string, done: boolean) =>
  supabase.from("goals").update({ done }).eq("id", goalId);

const insertDailyHabit = async (monthId: string, habit: Habit, sortOrder: number) =>
  supabase.from("daily_habits").insert({
    id: habit.id,
    month_id: monthId,
    name: habit.name,
    goal_type: habit.goalType,
    goal_value: habit.goalValue,
    sort_order: sortOrder
  });

const updateDailyHabitName = async (habitId: string, name: string) =>
  supabase.from("daily_habits").update({ name }).eq("id", habitId);

const deleteDailyHabit = async (habitId: string) =>
  supabase.from("daily_habits").delete().eq("id", habitId);

const upsertMood = async (monthId: string, day: number, score: number) =>
  supabase.from("moods").upsert(
    {
      month_id: monthId,
      day,
      score
    },
    { onConflict: "month_id,day" }
  );

const upsertJournal = async (monthId: string, day: number, entry: string) =>
  supabase.from("journals").upsert(
    {
      month_id: monthId,
      day,
      entry
    },
    { onConflict: "month_id,day" }
  );

const insertWeeklyGoal = async (monthId: string, goal: WeeklyGoal, sortOrder: number) =>
  supabase.from("weekly_goals").insert({
    id: goal.id,
    month_id: monthId,
    text: goal.text,
    week: goal.week,
    done: goal.done ?? false,
    sort_order: sortOrder
  });

const updateWeeklyGoalDone = async (goalId: string, done: boolean) =>
  supabase.from("weekly_goals").update({ done }).eq("id", goalId);

const deleteWeeklyGoal = async (goalId: string) =>
  supabase.from("weekly_goals").delete().eq("id", goalId);

const fetchMonthFromSupabase = async (
  profileId: string,
  year: number,
  month: number,
  onError?: (context: string, error: { message?: string; code?: string }) => void
): Promise<MonthState | null> => {
  // ✅ CHANGE #1: use maybeSingle() to avoid "Cannot coerce the result to a single JSON object"
  // when there are 0 rows (or when PostgREST can't guarantee exactly one row).
  const { data: monthRow, error: monthError } = await supabase
    .from("months")
    .select("*")
    .eq("profile_id", profileId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (monthError || !monthRow) {
    const noRows = monthError?.code === "PGRST116";
    if (monthError && onError && !noRows) {
      onError("Load month", monthError);
    }
    return null;
  }

  const days = getDaysInMonth(year, month);

  const dailyHabitsResult = await supabase
    .from("daily_habits")
    .select("*")
    .eq("month_id", monthRow.id)
    .order("sort_order");

  const weeklyHabitsResult = await supabase
    .from("weekly_habits")
    .select("*")
    .eq("month_id", monthRow.id)
    .order("sort_order");

  const [monthlyHabitsResult, goalsResult, moodsResult, journalsResult, weeklyGoalsResult] =
    await Promise.all([
      supabase.from("monthly_habits").select("*").eq("month_id", monthRow.id).order("sort_order"),
      supabase.from("goals").select("*").eq("month_id", monthRow.id).order("sort_order"),
      supabase.from("moods").select("*").eq("month_id", monthRow.id),
      supabase.from("journals").select("*").eq("month_id", monthRow.id),
      supabase.from("weekly_goals").select("*").eq("month_id", monthRow.id).order("sort_order")
    ]);

  if (dailyHabitsResult.error && onError) onError("Load daily habits", dailyHabitsResult.error);
  if (weeklyHabitsResult.error && onError) onError("Load weekly habits", weeklyHabitsResult.error);
  if (monthlyHabitsResult.error && onError) onError("Load monthly habits", monthlyHabitsResult.error);
  if (goalsResult.error && onError) onError("Load goals", goalsResult.error);
  if (moodsResult.error && onError) onError("Load moods", moodsResult.error);
  if (journalsResult.error && onError) onError("Load journals", journalsResult.error);
  if (weeklyGoalsResult.error && onError) onError("Load weekly goals", weeklyGoalsResult.error);

  const dailyHabits = (dailyHabitsResult.data ?? []).map((habit) => ({
    id: habit.id,
    name: habit.name,
    goalType: habit.goal_type,
    goalValue: habit.goal_value
  }));

  const dailyHabitIds = dailyHabits.map((habit) => habit.id);
  const dailyChecksResult =
    dailyHabitIds.length > 0
      ? await supabase.from("daily_checks").select("*").in("habit_id", dailyHabitIds)
      : ({ data: [] } as { data: { habit_id: string; day: number; checked: boolean }[] });

  const checks: Record<string, boolean[]> = Object.fromEntries(
    dailyHabits.map((habit) => [habit.id, Array.from({ length: days }, () => false)])
  );

  (dailyChecksResult.data ?? []).forEach((check) => {
    const list = checks[check.habit_id];
    if (list && check.day >= 1 && check.day <= days) {
      list[check.day - 1] = check.checked;
    }
  });

  const weeklyHabits = (weeklyHabitsResult.data ?? []).map((habit) => ({
    id: habit.id,
    name: habit.name,
    checksByWeek: Array.from({ length: 5 }, () => false)
  }));

  const weeklyHabitIds = weeklyHabits.map((habit) => habit.id);
  const weeklyChecksResult =
    weeklyHabitIds.length > 0
      ? await supabase.from("weekly_checks").select("*").in("habit_id", weeklyHabitIds)
      : ({ data: [] } as { data: { habit_id: string; week: number; checked: boolean }[] });

  (weeklyChecksResult.data ?? []).forEach((check) => {
    const habit = weeklyHabits.find((item) => item.id === check.habit_id);
    if (habit && check.week >= 1 && check.week <= 5) {
      habit.checksByWeek[check.week - 1] = check.checked;
    }
  });

  const monthlyHabits = (monthlyHabitsResult.data ?? []).map((habit) => ({
    id: habit.id,
    name: habit.name,
    checked: habit.checked
  }));

  const goals = (goalsResult.data ?? []).map((goal) => ({
    id: goal.id,
    text: goal.text,
    done: goal.done
  }));

  const weeklyGoals: WeeklyGoal[] = (weeklyGoalsResult.data ?? []).map((goal) => ({
    id: goal.id,
    text: goal.text,
    week: goal.week,
    done: goal.done
  }));

  const moodByDay = Array.from({ length: days }, () => 3);
  (moodsResult.data ?? []).forEach((mood) => {
    if (mood.day >= 1 && mood.day <= days) {
      moodByDay[mood.day - 1] = mood.score;
    }
  });

  const journalEntries = Array.from({ length: days }, () => "");
  (journalsResult.data ?? []).forEach((journal) => {
    if (journal.day >= 1 && journal.day <= days) {
      journalEntries[journal.day - 1] = journal.entry;
    }
  });

  return normalizeMonth({
    id: monthRow.id,
    year: monthRow.year,
    month: monthRow.month,
    dailyHabits,
    checks,
    weeklyHabits,
    monthlyHabits,
    goals,
    weeklyGoals,
    notes: monthRow.notes ?? "",
    moodByDay,
    journalEntries,
    dailyGoalTarget: monthRow.daily_goal_target ?? 0
  });
};

const persistNewMonth = async (
  profileId: string,
  month: MonthState,
  onError?: (context: string, error: { message?: string }) => void
) => {
  if (!month.id) return;

  const { error: monthError } = await supabase.from("months").upsert({
    id: month.id,
    profile_id: profileId,
    year: month.year,
    month: month.month,
    notes: month.notes,
    daily_goal_target: month.dailyGoalTarget
  });
  if (monthError && onError) onError("Create month", monthError);

  const { error: dailyHabitsError } = await supabase.from("daily_habits").insert(
    month.dailyHabits.map((habit, index) => ({
      id: habit.id,
      month_id: month.id,
      name: habit.name,
      goal_type: habit.goalType,
      goal_value: habit.goalValue,
      sort_order: index
    }))
  );
  if (dailyHabitsError && onError) onError("Create daily habits", dailyHabitsError);

  const { error: weeklyHabitsError } = await supabase.from("weekly_habits").insert(
    month.weeklyHabits.map((habit, index) => ({
      id: habit.id,
      month_id: month.id,
      name: habit.name,
      sort_order: index
    }))
  );
  if (weeklyHabitsError && onError) onError("Create weekly habits", weeklyHabitsError);

  const { error: monthlyHabitsError } = await supabase.from("monthly_habits").insert(
    month.monthlyHabits.map((habit, index) => ({
      id: habit.id,
      month_id: month.id,
      name: habit.name,
      checked: habit.checked,
      sort_order: index
    }))
  );
  if (monthlyHabitsError && onError) onError("Create monthly habits", monthlyHabitsError);

  const { error: goalsError } = await supabase.from("goals").insert(
    month.goals.map((goal, index) => ({
      id: goal.id,
      month_id: month.id,
      text: goal.text,
      done: goal.done ?? false,
      sort_order: index
    }))
  );
  if (goalsError && onError) onError("Create goals", goalsError);

  if (month.weeklyGoals.length > 0) {
    const { error: weeklyGoalsError } = await supabase.from("weekly_goals").insert(
      month.weeklyGoals.map((goal, index) => ({
        id: goal.id,
        month_id: month.id,
        text: goal.text,
        week: goal.week,
        done: goal.done ?? false,
        sort_order: index
      }))
    );
    if (weeklyGoalsError && onError) onError("Create weekly goals", weeklyGoalsError);
  }
};

export const useAppStore = create<Store>()((set, get) => ({
  version: STORAGE_VERSION,
  selectedYear: today.getFullYear(),
  selectedMonth: today.getMonth() + 1,
  selectedUserId: null,
  users: [],
  monthsByUser: {},
  supabaseReady: false,
  supabaseUserId: null,
  supabaseError: null,
  isMonthLoading: false,
  isProfilesLoading: false,

  initializeSupabase: async () => {
    if (!supabaseConfigured) {
      set({ supabaseReady: true, supabaseUserId: null, isProfilesLoading: false });
      return;
    }

    const reportSupabaseError = (error: { message?: string } | null, context: string) => {
      if (!error) return false;
      console.error(`[Supabase] ${context}`, error);
      set({ supabaseError: `${context}: ${error.message ?? "Unknown error"}` });
      return true;
    };

    const { user, error } = await ensureSupabaseSession();
    if (reportSupabaseError(error, "Auth session")) {
      set({ supabaseReady: true, supabaseUserId: null, isProfilesLoading: false });
      return;
    }

    const supabaseUserId = user?.id ?? null;
    if (!supabaseUserId) {
      set({ supabaseReady: true, supabaseUserId: null, isProfilesLoading: false });
      return;
    }

    set({ supabaseUserId });
    await get().refreshProfiles();
    set({ supabaseReady: true });

    if (get().selectedUserId) {
      await get().ensureMonth(get().selectedYear, get().selectedMonth);
    }
  },

  refreshProfiles: async (preferredUserId) => {
    const supabaseUserId = get().supabaseUserId;
    if (!supabaseUserId) return;

    set({ isProfilesLoading: true });

    const { data: profiles, error: profilesError } = await fetchProfilesFromSupabase(supabaseUserId);
    if (profilesError) {
      console.error("[Supabase] Load profiles", profilesError);
      set({
        supabaseError: `Load profiles: ${profilesError.message ?? "Unknown error"}`,
        isProfilesLoading: false
      });
      return;
    }

    let users = (profiles ?? []).map((profile) => ({ id: profile.id, name: profile.name }));

    if (users.length === 0) {
      const newProfile = createUserProfile("User 1", 1);
      const { error: insertProfileError } = await createProfileInSupabase(supabaseUserId, newProfile);
      if (insertProfileError) {
        console.error("[Supabase] Create default profile", insertProfileError);
        set({
          supabaseError: `Create default profile: ${insertProfileError.message ?? "Unknown error"}`,
          isProfilesLoading: false
        });
        return;
      }
      users = [newProfile];
    }

    const desiredSelection = preferredUserId ?? get().selectedUserId;
    const selectedUserId =
      desiredSelection && users.some((u) => u.id === desiredSelection)
        ? desiredSelection
        : users[0]?.id ?? null;

    set({
      users,
      selectedUserId,
      supabaseError: null,
      isProfilesLoading: false
    });
  },

  refreshMonth: async (year, month) => {
    const selectedUserId = get().selectedUserId;
    if (!selectedUserId || !get().supabaseReady) return null;

    set({ isMonthLoading: true });

    const reportSupabaseError = (context: string, error: { message?: string }) => {
      console.error(`[Supabase] ${context}`, error);
      set({ supabaseError: `${context}: ${error.message ?? "Unknown error"}` });
    };

    const remoteMonth = await fetchMonthFromSupabase(selectedUserId, year, month, reportSupabaseError);
    if (remoteMonth) {
      const key = buildMonthKey(year, month);
      set({
        monthsByUser: {
          ...get().monthsByUser,
          [selectedUserId]: {
            ...(get().monthsByUser[selectedUserId] ?? {}),
            [key]: remoteMonth
          }
        },
        isMonthLoading: false
      });
      return remoteMonth;
    }

    set({ isMonthLoading: false });
    return null;
  },

  setSelectedMonthYear: (year, month) => {
    set({ selectedYear: year, selectedMonth: month });
    get().ensureMonth(year, month);
  },

  ensureMonth: async (year, month) => {
    const selectedUserId = get().selectedUserId;
    if (!selectedUserId) return;

    const reportSupabaseError = (context: string, error: { message?: string }) => {
      console.error(`[Supabase] ${context}`, error);
      set({ supabaseError: `${context}: ${error.message ?? "Unknown error"}` });
    };

    if (get().supabaseReady) {
      const remoteMonth = await get().refreshMonth(year, month);
      if (remoteMonth) return;
    }

    const nextMonth = createDefaultMonth(year, month);
    const key = buildMonthKey(year, month);

    set({
      monthsByUser: {
        ...get().monthsByUser,
        [selectedUserId]: {
          ...(get().monthsByUser[selectedUserId] ?? {}),
          [key]: nextMonth
        }
      }
    });

    if (get().supabaseReady) {
      await persistNewMonth(selectedUserId, nextMonth, reportSupabaseError);
      await get().refreshMonth(year, month);
    }
  },

  selectUser: async (userId) => {
    set({ selectedUserId: userId });
    await get().ensureMonth(get().selectedYear, get().selectedMonth);
  },

  addUser: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const users = get().users;
    const user = createUserProfile(trimmed, users.length + 1);

    // ✅ CHANGE #2: stabilize supabaseUserId in a local variable so TS narrows string|null correctly
    const supabaseUserId = get().supabaseUserId;

    if (get().supabaseReady && supabaseUserId) {
      const { error } = await createProfileInSupabase(supabaseUserId, user);
      if (error) {
        console.error("[Supabase] Create user profile", error);
        set({
          supabaseError: `Create user profile: ${error.message ?? "Unknown error"}`
        });
      }
    }

    set({
      users: [...users, user],
      selectedUserId: user.id
    });

    if (get().supabaseReady) {
      await get().refreshProfiles(user.id);
    }

    await get().ensureMonth(get().selectedYear, get().selectedMonth);
  },

  // --- everything below unchanged from your snippet ---

  toggleDailyCheck: async (habitId, dayIndex) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get(); // ✅ add monthsByUser
    if (!selectedUserId) return;
  
    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      monthsByUser[selectedUserId]?.[key] ??
      createDefaultMonth(selectedYear, selectedMonth);
  
    const checks = month.checks[habitId] ?? [];
    const updatedChecks = [...checks];
    updatedChecks[dayIndex] = !updatedChecks[dayIndex];
  
    const updatedMonth: MonthState = normalizeMonth({
      ...month,
      checks: { ...month.checks, [habitId]: updatedChecks }
    });
  
    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: updatedMonth
        }
      }
    });
  
    if (get().supabaseReady) {
      const { error } = await upsertDailyCheck(
        habitId,
        dayIndex + 1,
        updatedChecks[dayIndex]
      );
      if (error) {
        console.error("[Supabase] Update daily check", error);
        set({
          supabaseError: `Update daily check: ${error.message ?? "Unknown error"}`
        });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },


  toggleWeeklyCheck: async (habitId, weekIndex) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get(); // ✅ monthsByUser added
    if (!selectedUserId) return;
  
    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      monthsByUser[selectedUserId]?.[key] ??
      createDefaultMonth(selectedYear, selectedMonth);
  
    const weeklyHabits = month.weeklyHabits.map((habit) => {
      if (habit.id !== habitId) return habit;
      const checksByWeek = [...habit.checksByWeek];
      checksByWeek[weekIndex] = !checksByWeek[weekIndex];
      return { ...habit, checksByWeek };
    });
  
    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, weeklyHabits })
        }
      }
    });
  
    if (get().supabaseReady) {
      const habit = weeklyHabits.find((item) => item.id === habitId);
      const checked = habit?.checksByWeek[weekIndex] ?? false;
  
      const { error } = await upsertWeeklyCheck(habitId, weekIndex + 1, checked);
      if (error) {
        console.error("[Supabase] Update weekly check", error);
        set({
          supabaseError: `Update weekly check: ${error.message ?? "Unknown error"}`
        });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  toggleMonthlyCheck: async (habitId) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get(); // ✅ monthsByUser added
    if (!selectedUserId) return;
  
    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      monthsByUser[selectedUserId]?.[key] ??
      createDefaultMonth(selectedYear, selectedMonth);
  
    const monthlyHabits = month.monthlyHabits.map((habit) =>
      habit.id === habitId ? { ...habit, checked: !habit.checked } : habit
    );
  
    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, monthlyHabits })
        }
      }
    });
  
    if (get().supabaseReady) {
      const habit = monthlyHabits.find((item) => item.id === habitId);
      const { error } = await updateMonthlyHabitCheck(habitId, habit?.checked ?? false);
  
      if (error) {
        console.error("[Supabase] Update monthly habit", error);
        set({
          supabaseError: `Update monthly habit: ${error.message ?? "Unknown error"}`
        });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  updateNotes: async (notes) => {
    const { selectedYear, selectedMonth, selectedUserId } = get();
    if (!selectedUserId) return;

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month = monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);

    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, notes })
        }
      }
    });

    if (get().supabaseReady && month.id) {
      const { error } = await updateMonthNotes(month.id, notes);
      if (error) {
        console.error("[Supabase] Update month notes", error);
        set({ supabaseError: `Update month notes: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  toggleGoal: async (goalId) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month = monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);

    const goals = month.goals.map((goal) => (goal.id === goalId ? { ...goal, done: !goal.done } : goal));

    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, goals })
        }
      }
    });

    if (get().supabaseReady) {
      const goal = goals.find((item) => item.id === goalId);
      const { error } = await updateGoalDone(goalId, goal?.done ?? false);
      if (error) {
        console.error("[Supabase] Update goal", error);
        set({ supabaseError: `Update goal: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  addDailyHabit: async (name) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    await get().ensureMonth(selectedYear, selectedMonth);

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      get().monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);
    const latestMonthsByUser = get().monthsByUser;

    const habit = createHabit(name, month.dailyHabits.length + 1);
    const dailyHabits = [...month.dailyHabits, habit];
    const checks = {
      ...month.checks,
      [habit.id]: Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, () => false)
    };

    set({
      monthsByUser: {
        ...latestMonthsByUser,
        [selectedUserId]: {
          ...(latestMonthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, dailyHabits, checks })
        }
      }
    });

    if (get().supabaseReady) {
      const persistedMonth = await get().refreshMonth(selectedYear, selectedMonth);
      const monthId = persistedMonth?.id;
      if (!monthId) {
        set({
          supabaseError:
            "Add daily habit: Month has not been created in Supabase yet. Please try again."
        });
        return;
      }

      const { error } = await insertDailyHabit(monthId, habit, dailyHabits.length - 1);
      if (error) {
        console.error("[Supabase] Add daily habit", error);
        set({ supabaseError: `Add daily habit: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  renameDailyHabit: async (habitId, name) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month = monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);

    const dailyHabits = month.dailyHabits.map((habit) => (habit.id === habitId ? { ...habit, name } : habit));

    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, dailyHabits })
        }
      }
    });

    if (get().supabaseReady) {
      const { error } = await updateDailyHabitName(habitId, name);
      if (error) {
        console.error("[Supabase] Rename daily habit", error);
        set({ supabaseError: `Rename daily habit: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  removeDailyHabit: async (habitId) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month = monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);

    const dailyHabits = month.dailyHabits.filter((habit) => habit.id !== habitId);
    const checks = { ...month.checks };
    delete checks[habitId];

    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, dailyHabits, checks })
        }
      }
    });

    if (get().supabaseReady) {
      const { error } = await deleteDailyHabit(habitId);
      if (error) {
        console.error("[Supabase] Remove daily habit", error);
        set({ supabaseError: `Remove daily habit: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  setMoodForDay: async (dayIndex, mood) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    await get().ensureMonth(selectedYear, selectedMonth);

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      get().monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);
    const latestMonthsByUser = get().monthsByUser;

    const moodByDay = [...month.moodByDay];
    moodByDay[dayIndex] = mood;

    set({
      monthsByUser: {
        ...latestMonthsByUser,
        [selectedUserId]: {
          ...(latestMonthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, moodByDay })
        }
      }
    });

    if (get().supabaseReady) {
      const persistedMonth = await get().refreshMonth(selectedYear, selectedMonth);
      const monthId = persistedMonth?.id;
      if (!monthId) {
        set({
          supabaseError:
            "Update mood: Month has not been created in Supabase yet. Please try again."
        });
        return;
      }

      const { error } = await upsertMood(monthId, dayIndex + 1, mood);
      if (error) {
        console.error("[Supabase] Update mood", error);
        set({ supabaseError: `Update mood: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  updateJournalEntry: async (dayIndex, entry) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    await get().ensureMonth(selectedYear, selectedMonth);

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      get().monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);
    const latestMonthsByUser = get().monthsByUser;

    const journalEntries = [...month.journalEntries];
    journalEntries[dayIndex] = entry;

    set({
      monthsByUser: {
        ...latestMonthsByUser,
        [selectedUserId]: {
          ...(latestMonthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, journalEntries })
        }
      }
    });

    if (get().supabaseReady) {
      const persistedMonth = await get().refreshMonth(selectedYear, selectedMonth);
      const monthId = persistedMonth?.id;
      if (!monthId) {
        set({
          supabaseError:
            "Update journal entry: Month has not been created in Supabase yet. Please try again."
        });
        return;
      }

      const { error } = await upsertJournal(monthId, dayIndex + 1, entry);
      if (error) {
        console.error("[Supabase] Update journal entry", error);
        set({ supabaseError: `Update journal entry: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  addWeeklyGoal: async (week, text) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    await get().ensureMonth(selectedYear, selectedMonth);

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month =
      get().monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);
    const latestMonthsByUser = get().monthsByUser;

    if (!month.id && get().supabaseReady) {
      set({
        supabaseError: "Add weekly goal: Month has not been created in Supabase yet. Please try again."
      });
    }

    const weeklyGoal: WeeklyGoal = { id: createId(), text: trimmed, week, done: false };
    const weeklyGoals = [...month.weeklyGoals, weeklyGoal];

    set({
      monthsByUser: {
        ...latestMonthsByUser,
        [selectedUserId]: {
          ...(latestMonthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, weeklyGoals })
        }
      }
    });

    if (get().supabaseReady) {
      const persistedMonth = await get().refreshMonth(selectedYear, selectedMonth);
      const monthId = persistedMonth?.id;
      if (!monthId) {
        set({
          supabaseError:
            "Add weekly goal: Month has not been created in Supabase yet. Please try again."
        });
        return;
      }

      const { error } = await insertWeeklyGoal(monthId, weeklyGoal, weeklyGoals.length - 1);
      if (error) {
        console.error("[Supabase] Add weekly goal", error);
        set({ supabaseError: `Add weekly goal: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  toggleWeeklyGoal: async (goalId) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month = monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);

    const weeklyGoals = month.weeklyGoals.map((goal) => (goal.id === goalId ? { ...goal, done: !goal.done } : goal));

    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, weeklyGoals })
        }
      }
    });

    if (get().supabaseReady) {
      const goal = weeklyGoals.find((item) => item.id === goalId);
      const { error } = await updateWeeklyGoalDone(goalId, goal?.done ?? false);
      if (error) {
        console.error("[Supabase] Update weekly goal", error);
        set({ supabaseError: `Update weekly goal: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  removeWeeklyGoal: async (goalId) => {
    const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
    if (!selectedUserId) return;

    const key = buildMonthKey(selectedYear, selectedMonth);
    const month = monthsByUser[selectedUserId]?.[key] ?? createDefaultMonth(selectedYear, selectedMonth);

    const weeklyGoals = month.weeklyGoals.filter((goal) => goal.id !== goalId);

    set({
      monthsByUser: {
        ...monthsByUser,
        [selectedUserId]: {
          ...(monthsByUser[selectedUserId] ?? {}),
          [key]: normalizeMonth({ ...month, weeklyGoals })
        }
      }
    });

    if (get().supabaseReady) {
      const { error } = await deleteWeeklyGoal(goalId);
      if (error) {
        console.error("[Supabase] Remove weekly goal", error);
        set({ supabaseError: `Remove weekly goal: ${error.message ?? "Unknown error"}` });
      } else {
        await get().refreshMonth(selectedYear, selectedMonth);
      }
    }
  },

  importState: (state) => {
    set({
      version: state.version,
      selectedYear: state.selectedYear,
      selectedMonth: state.selectedMonth,
      selectedUserId: state.selectedUserId,
      users: state.users,
      monthsByUser: state.monthsByUser
    });
  }
}));
