import { getDaysInMonth } from "@/lib/date";
import { Habit, MonthState } from "@/lib/types";

export type HabitStat = {
  habit: Habit;
  count: number;
  percentage: number;
};

export type MonthMetrics = {
  daysInMonth: number;
  totalPossible: number;
  completed: number;
  progressPct: number;
  dailyCounts: number[];
  perHabitStats: HabitStat[];
  topHabits: HabitStat[];
  weeklyProgress: number;
  monthlyProgress: number;
};

export const calculateMonthMetrics = (month: MonthState): MonthMetrics => {
  const daysInMonth = getDaysInMonth(month.year, month.month);
  const dailyCounts = Array.from({ length: daysInMonth }, () => 0);
  const perHabitStats: HabitStat[] = month.dailyHabits.map((habit) => {
    const checks = month.checks[habit.id] ?? [];
    const count = checks.reduce((sum, checked) => sum + (checked ? 1 : 0), 0);
    const percentage = habit.goalType === "perDay"
      ? (count / daysInMonth) * 100
      : (count / habit.goalValue) * 100;
    return {
      habit,
      count,
      percentage: Number.isNaN(percentage) ? 0 : Math.min(percentage, 100)
    };
  });

  month.dailyHabits.forEach((habit) => {
    const checks = month.checks[habit.id] ?? [];
    checks.forEach((checked, idx) => {
      if (checked) {
        dailyCounts[idx] += 1;
      }
    });
  });

  const totalPossible = month.dailyHabits.reduce((sum, habit) => {
    if (habit.goalType === "perDay") {
      return sum + daysInMonth;
    }
    return sum + habit.goalValue;
  }, 0);

  const completed = perHabitStats.reduce((sum, stat) => sum + stat.count, 0);
  const progressPct = totalPossible === 0 ? 0 : (completed / totalPossible) * 100;

  const topHabits = [...perHabitStats]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  const weeklyTotal = month.weeklyHabits.length * 5;
  const weeklyCompleted = month.weeklyHabits.reduce((sum, habit) => {
    return sum + habit.checksByWeek.filter(Boolean).length;
  }, 0);
  const weeklyProgress = weeklyTotal === 0 ? 0 : (weeklyCompleted / weeklyTotal) * 100;

  const monthlyTotal = month.monthlyHabits.length;
  const monthlyCompleted = month.monthlyHabits.filter((habit) => habit.checked).length;
  const monthlyProgress = monthlyTotal === 0 ? 0 : (monthlyCompleted / monthlyTotal) * 100;

  return {
    daysInMonth,
    totalPossible,
    completed,
    progressPct,
    dailyCounts,
    perHabitStats,
    topHabits,
    weeklyProgress,
    monthlyProgress
  };
};
