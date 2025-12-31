"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function UserOnboarding() {
  const users = useAppStore((state) => state.users);
  const selectUser = useAppStore((state) => state.selectUser);
  const addUser = useAppStore((state) => state.addUser);
  const [name, setName] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
      <div className="card w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="font-serifDisplay text-2xl uppercase tracking-[0.3em] text-slate-700">
            Select User
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Choose or create a profile to begin
          </p>
        </div>

        {users.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Existing Users
            </p>
            <div className="grid gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  className="rounded border border-gridLine bg-white px-3 py-2 text-left text-sm text-slate-700"
                  onClick={() => selectUser(user.id)}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Add User
          </label>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 border border-gridLine bg-white px-3 py-2 text-sm"
              placeholder="User name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              className="rounded-full border border-gridLine px-4 py-2 text-xs uppercase tracking-[0.2em]"
              onClick={() => {
                if (!name.trim()) {
                  return;
                }
                addUser(name);
                setName("");
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
