"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { fetchMe, updateMe, changePassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Store, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMe()
      .then((me) => setDisplayName(me.displayName ?? ""))
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-sm text-gray-400">
          Please{" "}
          <Link
            href="/login"
            className="text-[var(--color-markit-red)] underline"
          >
            sign in
          </Link>{" "}
          to view your account.
        </p>
      </div>
    );
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    try {
      await updateMe({ displayName });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to change password.";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-[var(--color-markit-pink-light)] px-4 py-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-markit-red)] text-xl font-bold text-white"
            aria-hidden="true"
          >
            {(user.username ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-[var(--color-markit-dark)]">
              {displayName || user.username}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* Profile info */}
        <section aria-labelledby="profile-heading">
          <h2
            id="profile-heading"
            className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            <User className="h-3.5 w-3.5" aria-hidden="true" /> Profile
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Display Name
                </label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label
                  htmlFor="username-display"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Username
                </label>
                <Input
                  id="username-display"
                  value={user.username}
                  disabled
                  className="bg-gray-50 text-gray-500"
                  aria-readonly="true"
                />
              </div>
              <Button
                type="submit"
                disabled={nameSaving}
                size="sm"
                className="w-full bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
              >
                {nameSaved ? "Saved!" : nameSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </div>
        </section>

        {/* Change password */}
        <section aria-labelledby="password-heading">
          <h2
            id="password-heading"
            className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Security
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label
                  htmlFor="current-password"
                  className="sr-only"
                >
                  Current password
                </label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                  required
                  aria-describedby={
                    passwordError ? "password-error" : undefined
                  }
                />
              </div>
              <div>
                <label htmlFor="new-password" className="sr-only">
                  New password
                </label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm new password
                </label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
              </div>
              {passwordError && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-red-600"
                >
                  {passwordError}
                </p>
              )}
              <Button
                type="submit"
                disabled={passwordSaving}
                size="sm"
                className="w-full bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
              >
                {passwordSaved
                  ? "Password Changed!"
                  : passwordSaving
                    ? "Changing..."
                    : "Change Password"}
              </Button>
            </form>
          </div>
        </section>

        {/* Quick links — vendor only */}
        {user.role === "vendor" && (
          <section aria-label="Vendor tools">
            <Link
              href="/account/vendor-profile"
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-[var(--color-markit-red)]"
            >
              <div className="flex items-center gap-3">
                <Store
                  className="h-4 w-4 text-[var(--color-markit-red)]"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-[var(--color-markit-dark)]">
                  Vendor Profile
                </span>
              </div>
              <ChevronRight
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            </Link>
          </section>
        )}

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
