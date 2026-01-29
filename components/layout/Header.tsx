"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-20 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="flex items-center justify-end h-14 px-4 lg:px-8 gap-4">
        <NotificationBell />

        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
              title="Logga ut"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
