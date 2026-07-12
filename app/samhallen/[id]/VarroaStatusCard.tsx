import { Bug } from "lucide-react";
import { bedomVarroa, type VarroaNiva } from "@/lib/varroa";

interface EventRad {
  handelseTyp: string;
  datum: Date | string;
  data: string | null;
}

interface Matning {
  datum: Date;
  metod: string;
  angreppsgrad?: number;
  nedfallPerDygn?: number;
}

const nivaBadge: Record<VarroaNiva, string> = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  varning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  atgard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const nivaText: Record<VarroaNiva, string> = {
  ok: "Låg nivå",
  varning: "Förhöjt",
  atgard: "Behandla",
};

/** Plockar ut varroamätningar ur samhällets händelser (senaste först). */
function hittaMatningar(events: EventRad[]): Matning[] {
  const matningar: Matning[] = [];
  for (const event of events) {
    if (event.handelseTyp !== "Varroamätning" || !event.data) continue;
    try {
      const data = JSON.parse(event.data);
      matningar.push({
        datum: new Date(event.datum),
        metod: String(data.metod ?? ""),
        angreppsgrad:
          typeof data.angreppsgrad === "number" ? data.angreppsgrad : undefined,
        nedfallPerDygn:
          typeof data.nedfallPerDygn === "number"
            ? data.nedfallPerDygn
            : undefined,
      });
    } catch {
      // ogiltig JSON i äldre händelse — hoppa över
    }
  }
  return matningar;
}

function Sparkline({ varden }: { varden: number[] }) {
  if (varden.length < 2) return null;
  const bredd = 120;
  const hojd = 32;
  const max = Math.max(...varden, 1);
  const punkter = varden
    .map((v, i) => {
      const x = (i / (varden.length - 1)) * bredd;
      const y = hojd - (v / max) * (hojd - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${bredd} ${hojd}`}
      className="h-8 w-[120px]"
      aria-hidden="true"
    >
      <polyline
        points={punkter}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-orange-500"
      />
    </svg>
  );
}

export default function VarroaStatusCard({ events }: { events: EventRad[] }) {
  const matningar = hittaMatningar(events);
  if (matningar.length === 0) return null;

  const senaste = matningar[0];
  const bedomning = bedomVarroa(senaste);

  // Trend i samma måttenhet som senaste mätningen, äldst först
  const nedfall = senaste.nedfallPerDygn !== undefined;
  const trend = matningar
    .filter((m) =>
      nedfall ? m.nedfallPerDygn !== undefined : m.angreppsgrad !== undefined
    )
    .slice(0, 8)
    .reverse()
    .map((m) => (nedfall ? m.nedfallPerDygn! : m.angreppsgrad!));

  return (
    <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Varroastatus
          </h2>
        </div>
        {bedomning && (
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${nivaBadge[bedomning.niva]}`}
          >
            {nivaText[bedomning.niva]}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {nedfall
              ? `${senaste.nedfallPerDygn} kvalster/dygn`
              : `${senaste.angreppsgrad} %`}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {senaste.metod} · {senaste.datum.toLocaleDateString("sv-SE")}
          </p>
        </div>
        <Sparkline varden={trend} />
      </div>

      {bedomning && (
        <p className="mt-3 text-sm text-[var(--muted)]">{bedomning.text}</p>
      )}
      <p className="mt-1 text-xs text-[var(--muted)]/70">
        Riktvärden — jämför med aktuell rådgivning.
      </p>
    </div>
  );
}
