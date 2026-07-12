import {
  Bug,
  ClipboardCheck,
  Droplets,
  Scale,
  Snowflake,
  GitBranch,
  Heart,
  FileText,
} from "lucide-react";
import type { EventType } from "@/types";

/** Delad ikon- och färgsättning för händelsetyper. */
export const eventIcons: Record<EventType, React.ElementType> = {
  Inspektion: ClipboardCheck,
  Varroamätning: Bug,
  Utfodring: Droplets,
  Skörd: Scale,
  Invintring: Snowflake,
  Avläggare: GitBranch,
  Hälsoåtgärd: Heart,
  Anteckning: FileText,
};

export const eventColors: Record<EventType, string> = {
  Inspektion: "bg-blue-500",
  Varroamätning: "bg-orange-500",
  Utfodring: "bg-lime-600",
  Skörd: "bg-yellow-500",
  Invintring: "bg-cyan-500",
  Avläggare: "bg-purple-500",
  Hälsoåtgärd: "bg-rose-500",
  Anteckning: "bg-stone-500",
};

/** Kort sammanfattning av en händelses data för listvyer. */
export function eventSummary(
  handelseTyp: string,
  data: Record<string, unknown>
): string {
  switch (handelseTyp) {
    case "Inspektion":
      return [
        data.styrka && `Styrka: ${data.styrka}`,
        data.drottningSynlig ? "Drottning sedd" : null,
        data.drottningceller ? "Drottningceller!" : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "Varroamätning":
      if (data.nedfallPerDygn !== undefined)
        return `${data.nedfallPerDygn} kvalster/dygn (${data.metod})`;
      if (data.angreppsgrad !== undefined)
        return `${data.angreppsgrad} % angreppsgrad (${data.metod})`;
      return String(data.metod ?? "");
    case "Utfodring":
      return [data.fodertyp, data.mangdKg && `${data.mangdKg} kg`, data.syfte]
        .filter(Boolean)
        .join(" · ");
    case "Skörd":
      return data.mangdKg ? `${data.mangdKg} kg` : "";
    case "Invintring":
      return [
        data.antalRamar && `${data.antalRamar} ramar`,
        data.fodermangdKg && `${data.fodermangdKg} kg foder`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "Hälsoåtgärd":
      return [data.atgardstyp, data.metodPreparat].filter(Boolean).join(" · ");
    case "Anteckning":
      return typeof data.anteckningar === "string"
        ? data.anteckningar.slice(0, 80)
        : "";
    default:
      return "";
  }
}
