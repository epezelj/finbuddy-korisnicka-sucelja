"use client";

import { useState } from "react";

export default function SecurityPasswordForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600">Current password</label>
        <div className="relative mt-1">
          <input
            name="currentPassword"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-lg border px-3 py-2 pr-16"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">New password</label>
        <div className="relative mt-1">
          <input
            name="newPassword"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-lg border px-3 py-2 pr-16"
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Confirm new password</label>
        <div className="relative mt-1">
          <input
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-lg border px-3 py-2 pr-16"
            placeholder="Repeat new password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Update password
      </button>

      <div className="text-xs text-gray-500">
        Log out to see if you managed to change password correctly.
      </div>
    </form>
  );
}
