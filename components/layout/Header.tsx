"use client";

import NotificationBell from "./NotificationBell";

export default function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-20 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="flex items-center justify-end h-14 px-4 lg:px-8">
        <NotificationBell />
      </div>
    </header>
  );
}
