export type GoalType = "perDay" | "timesPerMonth";

export type Habit = {
  id: string;
  name: string;
  goalType: GoalType;
  goalValue: number;
};

export type WeeklyHabit = {
  id: string;
  name: string;
  checksByWeek: boolean[];
};

export type WeeklyGoal = {
  id: string;
  text: string;
  week: number;
  done?: boolean;
};

export type MonthlyHabit = {
  id: string;
  name: string;
  checked: boolean;
};

export type GoalItem = {
  id: string;
  text: string;
  done?: boolean;
};

export type MonthState = {
  id?: string;
  year: number;
  month: number;
  dailyHabits: Habit[];
  checks: Record<string, boolean[]>;
  weeklyHabits: WeeklyHabit[];
  monthlyHabits: MonthlyHabit[];
  goals: GoalItem[];
  weeklyGoals: WeeklyGoal[];
  notes: string;
  moodByDay: number[];
  journalEntries: string[];
  dailyGoalTarget: number;
};

export type UserProfile = {
  id: string;
  name: string;
};

export type AppState = {
  version: number;
  selectedYear: number;
  selectedMonth: number;
  selectedUserId: string | null;
  users: UserProfile[];
  monthsByUser: Record<string, Record<string, MonthState>>;
};
