import { CloudSun, Wind } from "lucide-react";
import {
  bedomInspektionsvader,
  hamtaPrognos,
  symbolText,
} from "@/lib/smhi";

interface WeatherCardProps {
  latitude: number;
  longitude: number;
}

/** Serverkomponent — prognosen cachas en timme i lib/smhi. */
export default async function WeatherCard({
  latitude,
  longitude,
}: WeatherCardProps) {
  const prognos = await hamtaPrognos(latitude, longitude);
  if (!prognos) return null;

  const { nu, dagar } = prognos;
  const bedomning = bedomInspektionsvader(nu);

  return (
    <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Väder vid bigården
          </h2>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium ${
            bedomning.larmpligt
              ? "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          }`}
        >
          {bedomning.text}
        </span>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <p className="text-3xl font-bold text-[var(--foreground)]">
          {Math.round(nu.temperatur)}°
        </p>
        <div className="pb-1">
          <p className="text-sm text-[var(--foreground)]">
            {symbolText(nu.symbol)}
          </p>
          <p className="flex items-center gap-1 text-sm text-[var(--muted)]">
            <Wind className="h-3.5 w-3.5" />
            {Math.round(nu.vind)} m/s
          </p>
        </div>
      </div>

      {dagar.length > 0 && (
        <div className="grid grid-cols-4 gap-2 border-t border-[var(--card-border)] pt-3">
          {dagar.map((dag) => (
            <div key={dag.tid.toISOString()} className="text-center">
              <p className="text-xs text-[var(--muted)] capitalize">
                {dag.tid.toLocaleDateString("sv-SE", { weekday: "short" })}
              </p>
              <p className="font-semibold text-[var(--foreground)]">
                {Math.round(dag.temperatur)}°
              </p>
              <p className="text-xs text-[var(--muted)] truncate">
                {symbolText(dag.symbol)}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--muted)]/70">Källa: SMHI</p>
    </div>
  );
}
