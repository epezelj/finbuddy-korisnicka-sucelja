"use client";

import * as React from "react";
import { useQueryState, parseAsInteger } from "nuqs";

type UserOption = { id: number; name: string };

interface BlogFiltersProps {
  users?: Array<UserOption | null | undefined>;
  currentUserId: number;
}

export function BlogFilters({ users, currentUserId }: BlogFiltersProps) {
  const [userId, setUserId] = useQueryState(
    "userId",
    parseAsInteger.withDefault(0).withOptions({ shallow: false })
  );

  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  // ✅ Normalize + validate users so rendering never crashes
  const safeUsers = React.useMemo<UserOption[]>(() => {
    return (users ?? [])
      .filter((u): u is UserOption => {
        return (
          !!u &&
          typeof u.id === "number" &&
          Number.isFinite(u.id) &&
          typeof u.name === "string" &&
          u.name.trim().length > 0
        );
      })
      // optional: sort alphabetically (remove if you don't want this)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value;

    // value is always a string from <select>
    const newUserId = Number.parseInt(raw, 10);

    // ✅ If it's 0 or invalid => clear filter
    if (!Number.isFinite(newUserId) || newUserId <= 0) {
      setUserId(null);
      setPage(1);
      return;
    }

    setUserId(newUserId);
    setPage(1); // Reset to first page when filtering
  };

  const clearFilter = () => {
    setUserId(null);
    setPage(1);
  };

  return (
    <div className="mb-8 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="user-filter" className="text-sm font-medium">
          Filter by author:
        </label>

        <select
          id="user-filter"
          value={String(userId ?? 0)}
          onChange={handleUserChange}
          className="w-[200px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="0">All authors</option>

          {safeUsers.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {currentUserId > 0 && (
        <button
          type="button"
          onClick={clearFilter}
          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Clear filter
        </button>
      )}
    </div>
  );
}