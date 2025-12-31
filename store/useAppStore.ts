"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildMonthKey, getDaysInMonth } from "@/lib/date";
import { AppState, Habit, MonthState } from "@/lib/types";
import { safeStorage, STORAGE_KEY, STORAGE_VERSION } from "@/lib/storage";

const createHabit = (name: string, index: number): Habit => ({
  id: `habit-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
  name,
  goalType: "perDay",
  goalValue: 0
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
    weeklyHabits
  };
};

const createDefaultMonth = (year: number, month: number): MonthState => {
  const days = getDaysInMonth(year, month);
  const dailyHabits = seedDailyHabits.map((name, index) => createHabit(name, index));
  const checks = Object.fromEntries(
    dailyHabits.map((habit) => [habit.id, Array.from({ length: days }, () => false)])
  );

  return {
    year,
    month,
    dailyHabits,
    checks,
    weeklyHabits: seedWeeklyHabits.map((name, index) => ({
      id: `weekly-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      checksByWeek: Array.from({ length: 5 }, () => false)
    })),
    monthlyHabits: seedMonthlyHabits.map((name, index) => ({
      id: `monthly-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      checked: false
    })),
    goals: seedGoals.map((text, index) => ({
      id: `goal-${index}-${text.toLowerCase().replace(/\s+/g, "-")}`,
      text,
      done: false
    })),
    notes: "",
    dailyGoalTarget: 10
  };
};

type Store = AppState & {
  setSelectedMonthYear: (year: number, month: number) => void;
  ensureMonth: (year: number, month: number) => void;
  toggleDailyCheck: (habitId: string, dayIndex: number) => void;
  toggleWeeklyCheck: (habitId: string, weekIndex: number) => void;
  toggleMonthlyCheck: (habitId: string) => void;
  updateNotes: (notes: string) => void;
  toggleGoal: (goalId: string) => void;
  addDailyHabit: (name: string) => void;
  renameDailyHabit: (habitId: string, name: string) => void;
  removeDailyHabit: (habitId: string) => void;
  importState: (state: AppState) => void;
};

const today = new Date();

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      version: STORAGE_VERSION,
      selectedYear: today.getFullYear(),
      selectedMonth: today.getMonth() + 1,
      months: {},
      setSelectedMonthYear: (year, month) => {
        set({ selectedYear: year, selectedMonth: month });
        get().ensureMonth(year, month);
      },
      ensureMonth: (year, month) => {
        const key = buildMonthKey(year, month);
        const current = get().months[key];
        const nextMonth = current ? normalizeMonth(current) : createDefaultMonth(year, month);
        set({
          months: {
            ...get().months,
            [key]: nextMonth
          }
        });
      },
      toggleDailyCheck: (habitId, dayIndex) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
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
          months: {
            ...months,
            [key]: updatedMonth
          }
        });
      },
      toggleWeeklyCheck: (habitId, weekIndex) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        const weeklyHabits = month.weeklyHabits.map((habit) => {
          if (habit.id !== habitId) {
            return habit;
          }
          const checksByWeek = [...habit.checksByWeek];
          checksByWeek[weekIndex] = !checksByWeek[weekIndex];
          return { ...habit, checksByWeek };
        });
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, weeklyHabits })
          }
        });
      },
      toggleMonthlyCheck: (habitId) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        const monthlyHabits = month.monthlyHabits.map((habit) =>
          habit.id === habitId ? { ...habit, checked: !habit.checked } : habit
        );
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, monthlyHabits })
          }
        });
      },
      updateNotes: (notes) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, notes })
          }
        });
      },
      toggleGoal: (goalId) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        const goals = month.goals.map((goal) =>
          goal.id === goalId ? { ...goal, done: !goal.done } : goal
        );
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, goals })
          }
        });
      },
      addDailyHabit: (name) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        const habit = createHabit(name, month.dailyHabits.length + 1);
        const dailyHabits = [...month.dailyHabits, habit];
        const checks = {
          ...month.checks,
          [habit.id]: Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, () => false)
        };
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, dailyHabits, checks })
          }
        });
      },
      renameDailyHabit: (habitId, name) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        const dailyHabits = month.dailyHabits.map((habit) =>
          habit.id === habitId ? { ...habit, name } : habit
        );
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, dailyHabits })
          }
        });
      },
      removeDailyHabit: (habitId) => {
        const { selectedYear, selectedMonth, months } = get();
        const key = buildMonthKey(selectedYear, selectedMonth);
        const month = months[key] ?? createDefaultMonth(selectedYear, selectedMonth);
        const dailyHabits = month.dailyHabits.filter((habit) => habit.id !== habitId);
        const checks = { ...month.checks };
        delete checks[habitId];
        set({
          months: {
            ...months,
            [key]: normalizeMonth({ ...month, dailyHabits, checks })
          }
        });
      },
      importState: (state) => {
        set({
          version: state.version,
          selectedYear: state.selectedYear,
          selectedMonth: state.selectedMonth,
          months: state.months
        });
      }
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persistedState) => {
        if (!persistedState) {
          return undefined;
        }
        const state = persistedState as Store;
        return {
          ...state,
          version: STORAGE_VERSION
        } as Store;
      }
    }
  )
);
