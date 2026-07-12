import Link from "next/link";
import { BellRing, Bug, CircleCheck } from "lucide-react";
import prisma from "@/lib/db";
import { bedomVarroa } from "@/lib/varroa";

interface AttGoraKortProps {
  userId: string;
}

interface VarroaVarning {
  samhalleId: string;
  samhalleNamn: string;
  text: string;
}

async function hamtaPaminnelser(userId: string) {
  const slutetAvIdag = new Date();
  slutetAvIdag.setHours(23, 59, 59, 999);

  return prisma.reminder.findMany({
    where: { userId, utford: false, datum: { lte: slutetAvIdag } },
    orderBy: { datum: "asc" },
    take: 5,
    include: {
      samhalle: { select: { namn: true } },
      bigard: { select: { namn: true } },
    },
  });
}

/** Senaste varroamätningen per aktivt samhälle som ligger på åtgärdsnivå. */
async function hamtaVarroaVarningar(userId: string): Promise<VarroaVarning[]> {
  const matningar = await prisma.event.findMany({
    where: {
      userId,
      handelseTyp: "Varroamätning",
      samhalle: { status: "Aktiv" },
    },
    orderBy: { datum: "desc" },
    include: { samhalle: { select: { id: true, namn: true } } },
  });

  const varningar: VarroaVarning[] = [];
  const setts = new Set<string>();
  for (const matning of matningar) {
    if (setts.has(matning.samhalleId) || !matning.data) continue;
    setts.add(matning.samhalleId);
    try {
      const data = JSON.parse(matning.data);
      const bedomning = bedomVarroa({
        metod: String(data.metod ?? ""),
        angreppsgrad:
          typeof data.angreppsgrad === "number" ? data.angreppsgrad : undefined,
        nedfallPerDygn:
          typeof data.nedfallPerDygn === "number"
            ? data.nedfallPerDygn
            : undefined,
        datum: new Date(matning.datum),
      });
      if (bedomning?.niva === "atgard") {
        varningar.push({
          samhalleId: matning.samhalle.id,
          samhalleNamn: matning.samhalle.namn,
          text: bedomning.text,
        });
      }
    } catch {
      // ogiltig JSON — hoppa över
    }
  }
  return varningar;
}

export default async function AttGoraKort({ userId }: AttGoraKortProps) {
  const [paminnelser, varroaVarningar] = await Promise.all([
    hamtaPaminnelser(userId),
    hamtaVarroaVarningar(userId),
  ]);

  const idagStart = new Date();
  idagStart.setHours(0, 0, 0, 0);

  const tomt = paminnelser.length === 0 && varroaVarningar.length === 0;

  return (
    <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
      <div className="flex items-center gap-3 mb-4">
        <BellRing className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Att göra
        </h2>
      </div>

      {tomt ? (
        <div className="flex items-center gap-2 py-6 justify-center text-[var(--muted)]">
          <CircleCheck className="h-5 w-5 text-emerald-500" />
          <p>Inget att åtgärda just nu.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {varroaVarningar.map((v) => (
            <li key={`varroa-${v.samhalleId}`}>
              <Link
                href={`/samhallen/${v.samhalleId}`}
                className="flex items-center gap-2 rounded-lg p-2 -m-2 hover:bg-[var(--accent)]/10 transition-colors"
              >
                <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  <Bug className="h-3 w-3" />
                  Varroa
                </span>
                <span className="min-w-0 truncate text-sm text-[var(--foreground)]">
                  {v.samhalleNamn}: {v.text}
                </span>
              </Link>
            </li>
          ))}
          {paminnelser.map((p) => {
            const forsenad = new Date(p.datum) < idagStart;
            return (
              <li key={p.id}>
                <Link
                  href="/paminnelser"
                  className="flex items-center gap-2 rounded-lg p-2 -m-2 hover:bg-[var(--accent)]/10 transition-colors"
                >
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      forsenad
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    }`}
                  >
                    {forsenad ? "Försenad" : "Idag"}
                  </span>
                  <span className="min-w-0 truncate text-sm text-[var(--foreground)]">
                    {p.titel}
                    {(p.samhalle || p.bigard) && (
                      <span className="text-[var(--muted)]">
                        {" "}
                        — {p.samhalle?.namn ?? p.bigard?.namn}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-[var(--muted)]">
                    {new Date(p.datum).toLocaleDateString("sv-SE")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
