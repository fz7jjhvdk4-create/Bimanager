"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MapPin,
  Hexagon,
  BookOpen,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  BarChart3,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Bigårdar", href: "/bigardar", icon: MapPin },
  { name: "Samhällen", href: "/samhallen", icon: Hexagon },
  { name: "Statistik", href: "/statistik", icon: BarChart3 },
  { name: "Påminnelser", href: "/paminnelser", icon: Bell },
  { name: "Kassabok", href: "/kassabok", icon: BookOpen },
  { name: "Fakturering", href: "/fakturering", icon: FileText },
  { name: "Kunder", href: "/kunder", icon: Users },
  { name: "Inställningar", href: "/installningar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-[var(--card-bg)] p-2 shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6 text-[var(--foreground)]" />
        ) : (
          <Menu className="h-6 w-6 text-[var(--foreground)]" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gradient-to-b from-[var(--sidebar-from)] to-[var(--sidebar-to)] shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-[var(--sidebar-border)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] shadow-md">
              <Hexagon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--foreground)]">BiManager</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[var(--accent)] text-white shadow-md"
                      : "text-[var(--foreground)] hover:bg-[var(--accent)]/20"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & Footer */}
          <div className="border-t border-[var(--sidebar-border)] p-4">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-5 w-5" />
                  <span>Mörkt läge</span>
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5" />
                  <span>Ljust läge</span>
                </>
              )}
            </button>
            <p className="text-xs text-[var(--muted)] text-center mt-3">
              BiManager v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
