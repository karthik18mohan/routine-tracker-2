"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildMonthKey, getDaysInMonth } from "@/lib/date";
import { AppState, Habit, MonthState, UserProfile, WeeklyGoal } from "@/lib/types";
import { safeStorage, STORAGE_KEY, STORAGE_VERSION } from "@/lib/storage";
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
    journalEntries: Array.from(
      { length: days },
      (_, idx) => month.journalEntries[idx] ?? ""
    ),
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
  initializeSupabase: () => Promise<void>;
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
  importState: (state: AppState) => void;
};

const today = new Date();

const ensureSupabaseSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  if (data.session?.user) {
    return data.session.user;
  }
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
  if (anonError) {
    return null;
  }
  return anonData.user ?? null;
};

const fetchMonthFromSupabase = async (
  profileId: string,
  year: number,
  month: number
): Promise<MonthState | null> => {
  const { data: monthRow, error: monthError } = await supabase
    .from("months")
    .select("*")
    .eq("profile_id", profileId)
    .eq("year", year)
    .eq("month", month)
    .single();

  if (monthError || !monthRow) {
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

  const dailyHabits = (dailyHabitsResult.data ?? []).map((habit) => ({
    id: habit.id,
    name: habit.name,
    goalType: habit.goal_type,
    goalValue: habit.goal_value
  }));

  const dailyHabitIds = dailyHabits.map((habit) => habit.id);
  const dailyChecksResult = dailyHabitIds.length > 0
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
  const weeklyChecksResult = weeklyHabitIds.length > 0
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

const persistNewMonth = async (profileId: string, month: MonthState) => {
  if (!month.id) {
    return;
  }

  await supabase.from("months").upsert({
    id: month.id,
    profile_id: profileId,
    year: month.year,
    month: month.month,
    notes: month.notes,
    daily_goal_target: month.dailyGoalTarget
  });

  await supabase.from("daily_habits").insert(
    month.dailyHabits.map((habit, index) => ({
      id: habit.id,
      month_id: month.id,
      name: habit.name,
      goal_type: habit.goalType,
      goal_value: habit.goalValue,
      sort_order: index
    }))
  );

  await supabase.from("weekly_habits").insert(
    month.weeklyHabits.map((habit, index) => ({
      id: habit.id,
      month_id: month.id,
      name: habit.name,
      sort_order: index
    }))
  );

  await supabase.from("monthly_habits").insert(
    month.monthlyHabits.map((habit, index) => ({
      id: habit.id,
      month_id: month.id,
      name: habit.name,
      checked: habit.checked,
      sort_order: index
    }))
  );

  await supabase.from("goals").insert(
    month.goals.map((goal, index) => ({
      id: goal.id,
      month_id: month.id,
      text: goal.text,
      done: goal.done ?? false,
      sort_order: index
    }))
  );

  if (month.weeklyGoals.length > 0) {
    await supabase.from("weekly_goals").insert(
      month.weeklyGoals.map((goal, index) => ({
        id: goal.id,
        month_id: month.id,
        text: goal.text,
        week: goal.week,
        done: goal.done ?? false,
        sort_order: index
      }))
    );
  }
};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      version: STORAGE_VERSION,
      selectedYear: today.getFullYear(),
      selectedMonth: today.getMonth() + 1,
      selectedUserId: null,
      users: [],
      monthsByUser: {},
      supabaseReady: false,
      supabaseUserId: null,
      initializeSupabase: async () => {
        if (!supabaseConfigured) {
          set({ supabaseReady: true, supabaseUserId: null });
          return;
        }
        const user = await ensureSupabaseSession();
        const supabaseUserId = user?.id ?? null;
        if (!supabaseUserId) {
          set({ supabaseReady: true, supabaseUserId: null });
          return;
        }
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,name")
          .eq("owner_id", supabaseUserId)
          .order("created_at");
        let users = (profiles ?? []).map((profile) => ({
          id: profile.id,
          name: profile.name
        }));
        if (users.length === 0) {
          const newProfile = createUserProfile("User 1", 1);
          await supabase.from("profiles").insert({
            id: newProfile.id,
            owner_id: supabaseUserId,
            name: newProfile.name
          });
          users = [newProfile];
        }
        const selectedUserId =
          get().selectedUserId && users.some((userProfile) => userProfile.id === get().selectedUserId)
            ? get().selectedUserId
            : users[0]?.id ?? null;
        set({
          users,
          selectedUserId,
          supabaseReady: true,
          supabaseUserId
        });
        if (selectedUserId) {
          await get().ensureMonth(get().selectedYear, get().selectedMonth);
        }
      },
      setSelectedMonthYear: (year, month) => {
        set({ selectedYear: year, selectedMonth: month });
        get().ensureMonth(year, month);
      },
      ensureMonth: async (year, month) => {
        const selectedUserId = get().selectedUserId;
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(year, month);
        const current = get().monthsByUser[selectedUserId]?.[key];
        if (current) {
          const nextMonth = normalizeMonth(current);
          set({
            monthsByUser: {
              ...get().monthsByUser,
              [selectedUserId]: {
                ...(get().monthsByUser[selectedUserId] ?? {}),
                [key]: nextMonth
              }
            }
          });
          return;
        }

        if (get().supabaseReady) {
          const remoteMonth = await fetchMonthFromSupabase(selectedUserId, year, month);
          if (remoteMonth) {
            set({
              monthsByUser: {
                ...get().monthsByUser,
                [selectedUserId]: {
                  ...(get().monthsByUser[selectedUserId] ?? {}),
                  [key]: remoteMonth
                }
              }
            });
            return;
          }
        }

        const nextMonth = createDefaultMonth(year, month);
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
          await persistNewMonth(selectedUserId, nextMonth);
        }
      },
      selectUser: async (userId) => {
        set({ selectedUserId: userId });
        await get().ensureMonth(get().selectedYear, get().selectedMonth);
      },
      addUser: async (name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return;
        }
        const users = get().users;
        const user = createUserProfile(trimmed, users.length + 1);
        if (get().supabaseReady && get().supabaseUserId) {
          await supabase.from("profiles").insert({
            id: user.id,
            owner_id: get().supabaseUserId,
            name: user.name
          });
        }
        set({
          users: [...users, user],
          selectedUserId: user.id
        });
        await get().ensureMonth(get().selectedYear, get().selectedMonth);
      },
      toggleDailyCheck: async (habitId, dayIndex) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const checks = month.checks[habitId] ?? [];
        const updatedChecks = [...checks];
        updatedChecks[dayIndex] = !updatedChecks[dayIndex];
        const updatedMonth: MonthState = normalizeMonth({
          ...month,
          checks: {
            ...month.checks,
            [habitId]: updatedChecks
          }
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
          await supabase.from("daily_checks").upsert(
            {
              habit_id: habitId,
              day: dayIndex + 1,
              checked: updatedChecks[dayIndex]
            },
            { onConflict: "habit_id,day" }
          );
        }
      },
      toggleWeeklyCheck: async (habitId, weekIndex) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const weeklyHabits = month.weeklyHabits.map((habit) => {
          if (habit.id !== habitId) {
            return habit;
          }
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
          await supabase.from("weekly_checks").upsert(
            {
              habit_id: habitId,
              week: weekIndex + 1,
              checked
            },
            { onConflict: "habit_id,week" }
          );
        }
      },
      toggleMonthlyCheck: async (habitId) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
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
          await supabase
            .from("monthly_habits")
            .update({ checked: habit?.checked ?? false })
            .eq("id", habitId);
        }
      },
      updateNotes: async (notes) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
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
          await supabase.from("months").update({ notes }).eq("id", month.id);
        }
      },
      toggleGoal: async (goalId) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const goals = month.goals.map((goal) =>
          goal.id === goalId ? { ...goal, done: !goal.done } : goal
        );
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
          await supabase.from("goals").update({ done: goal?.done ?? false }).eq("id", goalId);
        }
      },
      addDailyHabit: async (name) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const habit = createHabit(name, month.dailyHabits.length + 1);
        const dailyHabits = [...month.dailyHabits, habit];
        const checks = {
          ...month.checks,
          [habit.id]: Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, () => false)
        };
        set({
          monthsByUser: {
            ...monthsByUser,
            [selectedUserId]: {
              ...(monthsByUser[selectedUserId] ?? {}),
              [key]: normalizeMonth({ ...month, dailyHabits, checks })
            }
          }
        });
        if (get().supabaseReady && month.id) {
          await supabase.from("daily_habits").insert({
            id: habit.id,
            month_id: month.id,
            name: habit.name,
            goal_type: habit.goalType,
            goal_value: habit.goalValue,
            sort_order: dailyHabits.length - 1
          });
        }
      },
      renameDailyHabit: async (habitId, name) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const dailyHabits = month.dailyHabits.map((habit) =>
          habit.id === habitId ? { ...habit, name } : habit
        );
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
          await supabase.from("daily_habits").update({ name }).eq("id", habitId);
        }
      },
      removeDailyHabit: async (habitId) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
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
          await supabase.from("daily_habits").delete().eq("id", habitId);
        }
      },
      setMoodForDay: async (dayIndex, mood) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const moodByDay = [...month.moodByDay];
        moodByDay[dayIndex] = mood;
        set({
          monthsByUser: {
            ...monthsByUser,
            [selectedUserId]: {
              ...(monthsByUser[selectedUserId] ?? {}),
              [key]: normalizeMonth({ ...month, moodByDay })
            }
          }
        });
        if (get().supabaseReady && month.id) {
          await supabase.from("moods").upsert(
            {
              month_id: month.id,
              day: dayIndex + 1,
              score: mood
            },
            { onConflict: "month_id,day" }
          );
        }
      },
      updateJournalEntry: async (dayIndex, entry) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const journalEntries = [...month.journalEntries];
        journalEntries[dayIndex] = entry;
        set({
          monthsByUser: {
            ...monthsByUser,
            [selectedUserId]: {
              ...(monthsByUser[selectedUserId] ?? {}),
              [key]: normalizeMonth({ ...month, journalEntries })
            }
          }
        });
        if (get().supabaseReady && month.id) {
          await supabase.from("journals").upsert(
            {
              month_id: month.id,
              day: dayIndex + 1,
              entry
            },
            { onConflict: "month_id,day" }
          );
        }
      },
      addWeeklyGoal: async (week, text) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const trimmed = text.trim();
        if (!trimmed) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const weeklyGoal: WeeklyGoal = {
          id: createId(),
          text: trimmed,
          week,
          done: false
        };
        const weeklyGoals = [...month.weeklyGoals, weeklyGoal];
        set({
          monthsByUser: {
            ...monthsByUser,
            [selectedUserId]: {
              ...(monthsByUser[selectedUserId] ?? {}),
              [key]: normalizeMonth({ ...month, weeklyGoals })
            }
          }
        });
        if (get().supabaseReady && month.id) {
          await supabase.from("weekly_goals").insert({
            id: weeklyGoal.id,
            month_id: month.id,
            text: weeklyGoal.text,
            week: weeklyGoal.week,
            done: weeklyGoal.done ?? false,
            sort_order: weeklyGoals.length - 1
          });
        }
      },
      toggleWeeklyGoal: async (goalId) => {
        const { selectedYear, selectedMonth, monthsByUser, selectedUserId } = get();
        if (!selectedUserId) {
          return;
        }
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month =
          monthsByUser[selectedUserId]?.[key] ??
          createDefaultMonth(selectedYear, selectedMonth);
        const weeklyGoals = month.weeklyGoals.map((goal) =>
          goal.id === goalId ? { ...goal, done: !goal.done } : goal
        );
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
          await supabase
            .from("weekly_goals")
            .update({ done: goal?.done ?? false })
            .eq("id", goalId);
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
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => {
        const { supabaseReady, supabaseUserId, initializeSupabase, ...rest } = state;
        return rest;
      },
      migrate: (persistedState) => {
        if (!persistedState) {
          return undefined;
        }
        const state = persistedState as Store & { months?: Record<string, MonthState> };
        if (!state.users || !state.monthsByUser) {
          const defaultUser = createUserProfile("User 1", 1);
          return {
            ...state,
            version: STORAGE_VERSION,
            selectedUserId: defaultUser.id,
            users: [defaultUser],
            monthsByUser: {
              [defaultUser.id]: state.months ?? {}
            }
          } as Store;
        }
        const normalizedMonthsByUser = Object.fromEntries(
          Object.entries(state.monthsByUser ?? {}).map(([userId, months]) => [
            userId,
            Object.fromEntries(
              Object.entries(months ?? {}).map(([key, month]) => [
                key,
                normalizeMonth({
                  ...month,
                  id: month.id ?? createId(),
                  weeklyGoals: month.weeklyGoals ?? [],
                  moodByDay: month.moodByDay ?? [],
                  journalEntries: month.journalEntries ?? []
                })
              ])
            )
          ])
        );
        return {
          ...state,
          monthsByUser: normalizedMonthsByUser,
          version: STORAGE_VERSION
        } as Store;
      }
    }
  )
);
