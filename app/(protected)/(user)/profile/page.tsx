"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth/client";
import { authClient } from "@/lib/auth/client";
import { useTranslation } from "@/lib/i18n";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t.profile.passwordMismatch);
      return;
    }

    setLoading(true);
    const res = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });

    if (res.error) {
      setError(res.error.message ?? t.profile.updateFailed);
    } else {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-4">{t.profile.title}</h1>

      <div className="card max-w-lg space-y-6">
        {/* Account info */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.profile.name}</p>
          <p className="text-gray-900 dark:text-gray-100 font-medium">{session?.user.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.profile.email}</p>
          <p className="text-gray-900 dark:text-gray-100">{session?.user.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.profile.role}</p>
          <p className="text-gray-900 dark:text-gray-100 capitalize">{session?.user.role as string}</p>
        </div>

        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Change password */}
        <div>
          <h2 className="text-base font-semibold text-brand-950 dark:text-white mb-4">{t.profile.changePassword}</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">{t.profile.currentPassword}</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t.profile.newPassword}</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="label">{t.profile.confirmPassword}</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{t.profile.passwordChanged}</p>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t.profile.updating : t.profile.updatePassword}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

