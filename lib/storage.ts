export const STORAGE_KEY = "habit-tracker-state";
export const STORAGE_VERSION = 1;

export const safeStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(name);
  }
};
