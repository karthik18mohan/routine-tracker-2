import { getDaysInMonth as getDaysInMonthFn, getDay } from "date-fns";

export const getDaysInMonth = (year: number, month: number) =>
  getDaysInMonthFn(new Date(year, month - 1, 1));

export const buildMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const getWeekOfMonth = (day: number, year: number, month: number) => {
  const firstDay = new Date(year, month - 1, 1);
  const firstDow = (getDay(firstDay) + 6) % 7;
  return Math.floor((firstDow + (day - 1)) / 7) + 1;
};

export const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
