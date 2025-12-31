"use client";

import { useAppStore } from "@/store/useAppStore";

export function UserPicker() {
  const users = useAppStore((state) => state.users);
  const selectedUserId = useAppStore((state) => state.selectedUserId);
  const selectUser = useAppStore((state) => state.selectUser);
  const addUser = useAppStore((state) => state.addUser);

  const handleAddUser = () => {
    const name = window.prompt("Enter user name");
    if (name) {
      addUser(name);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border border-gridLine bg-white px-3 py-1 text-sm uppercase tracking-[0.2em]"
        value={selectedUserId ?? ""}
        onChange={(event) => selectUser(event.target.value)}
      >
        <option value="" disabled>
          Select User
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button
        className="rounded-full border border-gridLine px-3 py-1 text-xs uppercase tracking-[0.2em]"
        onClick={handleAddUser}
      >
        Add User
      </button>
    </div>
  );
}
