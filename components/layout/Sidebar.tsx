"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MapPin,
  Hexagon,
  BookOpen,
  Receipt,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Bigårdar", href: "/bigardar", icon: MapPin },
  { name: "Samhällen", href: "/samhallen", icon: Hexagon },
  { name: "Statistik", href: "/statistik", icon: BarChart3 },
  { name: "Kassabok", href: "/kassabok", icon: BookOpen },
  { name: "Fakturering", href: "/fakturering", icon: FileText },
  { name: "Kunder", href: "/kunder", icon: Users },
  { name: "Inställningar", href: "/installningar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-white p-2 shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6 text-amber-800" />
        ) : (
          <Menu className="h-6 w-6 text-amber-800" />
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
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gradient-to-b from-amber-50 to-amber-100 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-amber-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 shadow-md">
              <Hexagon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-amber-900">BiManager</span>
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
                      ? "bg-amber-500 text-white shadow-md"
                      : "text-amber-800 hover:bg-amber-200/50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-amber-200 p-4">
            <p className="text-xs text-amber-600 text-center">
              BiManager v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
