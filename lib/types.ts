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
  year: number;
  month: number;
  dailyHabits: Habit[];
  checks: Record<string, boolean[]>;
  weeklyHabits: WeeklyHabit[];
  monthlyHabits: MonthlyHabit[];
  goals: GoalItem[];
  notes: string;
  dailyGoalTarget: number;
};

export type AppState = {
  version: number;
  selectedYear: number;
  selectedMonth: number;
  months: Record<string, MonthState>;
};
