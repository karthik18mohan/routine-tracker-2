"use client";

import { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AppState } from "@/lib/types";

export function ExportImportControls() {
  const inputRef = useRef<HTMLInputElement>(null);
  const appState = useAppStore((state) => ({
    version: state.version,
    selectedYear: state.selectedYear,
    selectedMonth: state.selectedMonth,
    months: state.months
  }));
  const importState = useAppStore((state) => state.importState);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "habit-tracker-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    const parsed = JSON.parse(text) as AppState;
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    importState(parsed);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-full border border-gridLine px-4 py-1 text-xs uppercase tracking-[0.2em]"
        onClick={handleExport}
      >
        Export JSON
      </button>
      <button
        className="rounded-full border border-gridLine px-4 py-1 text-xs uppercase tracking-[0.2em]"
        onClick={() => inputRef.current?.click()}
      >
        Import JSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}
