"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, Hexagon } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validera lösenord
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Något gick fel vid registrering");
        return;
      }

      // Registrering lyckades - gå till login
      router.push("/login?registered=true");
    } catch {
      setError("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl ring-1 ring-[var(--card-border)] p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-xl mb-4">
            <Hexagon className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            BiManager
          </h1>
          <p className="text-[var(--muted)] mt-1">Skapa ett nytt konto</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-9 h-5 w-5 text-[var(--muted)]" />
            <Input
              label="Namn"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt namn"
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-9 h-5 w-5 text-[var(--muted)]" />
            <Input
              label="E-post"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.se"
              required
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-9 h-5 w-5 text-[var(--muted)]" />
            <Input
              label="Lösenord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 8 tecken"
              required
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-9 h-5 w-5 text-[var(--muted)]" />
            <Input
              label="Bekräfta lösenord"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Upprepa lösenord"
              required
              className="pl-10"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Skapa konto
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-[var(--muted)]">
            Har du redan ett konto?{" "}
            <Link
              href="/login"
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
