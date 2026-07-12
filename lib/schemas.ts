import { z } from "zod";
import {
  COLONY_STATUSES,
  EVENT_TYPES,
  REMINDER_CATEGORIES,
  REMINDER_REPETITIONS,
  TRANSACTION_TYPES,
} from "@/types";

/**
 * Delade zod-scheman för API-routes. Formulären skickar ibland tomma
 * strängar eller tal som strängar, så optionella fält normaliseras här.
 */

/** "" och undefined blir null (för valfria fält som ska nollställas). */
const tomtTillNull = (v: unknown) => (v === "" || v === undefined ? null : v);

/** Bara "" blir null (för partiella uppdateringar där undefined = rör ej). */
const tomStrangTillNull = (v: unknown) => (v === "" ? null : v);

/** Tal som kan komma som sträng från formulär; "" och undefined blir null. */
const tillTalEllerNull = (v: unknown) => {
  if (v === "" || v === undefined || v === null) return null;
  if (typeof v === "string") return Number(v);
  return v;
};

const textEllerNull = z.preprocess(tomtTillNull, z.string().nullable());
const talEllerNull = z.preprocess(tillTalEllerNull, z.number().nullable());
const heltalEllerNull = z.preprocess(
  tillTalEllerNull,
  z.number().int().nullable()
);

export const apiarySchema = z.object({
  namn: z.string().trim().min(1, "Namn är obligatoriskt"),
  adress: textEllerNull,
  latitude: talEllerNull,
  longitude: talEllerNull,
  beskrivning: textEllerNull,
});

export const colonySchema = z.object({
  bigardId: z.string().min(1, "Bigård är obligatorisk"),
  namn: z.string().trim().min(1, "Namn är obligatoriskt"),
  platsNummer: heltalEllerNull,
  drottningRas: textEllerNull,
  drottningAr: heltalEllerNull,
  drottningVingklippt: z.boolean().optional().default(false),
  kupaTyp: textEllerNull,
  ramTypYngelrum: textEllerNull,
  ramTypSkattlador: textEllerNull,
  status: z.enum(COLONY_STATUSES).optional().default("Aktiv"),
  anteckningar: textEllerNull,
});

export const eventSchema = z.object({
  samhalleId: z.string().min(1, "Samhälle är obligatoriskt"),
  handelseTyp: z.enum(EVENT_TYPES, "Ogiltig händelsetyp"),
  datum: z.coerce.date("Ogiltigt datum"),
  beskrivning: textEllerNull,
  data: z.record(z.string(), z.unknown()).nullish(),
});

export const eventUpdateSchema = z.object({
  handelseTyp: z.enum(EVENT_TYPES, "Ogiltig händelsetyp").optional(),
  datum: z.coerce.date("Ogiltigt datum").optional(),
  beskrivning: z.preprocess(tomtTillNull, z.string().nullable()),
  data: z.record(z.string(), z.unknown()).nullish(),
});

export const reminderSchema = z.object({
  titel: z.string().trim().min(1, "Titel är obligatorisk"),
  beskrivning: textEllerNull,
  datum: z.coerce.date("Ogiltigt datum"),
  paminnaFor: z
    .preprocess(tillTalEllerNull, z.number().int().min(0).nullable())
    .transform((v) => v ?? 1),
  kategori: z.enum(REMINDER_CATEGORIES, "Ogiltig kategori"),
  samhalleId: textEllerNull,
  bigardId: textEllerNull,
  upprepning: z.preprocess(
    tomtTillNull,
    z.enum(REMINDER_REPETITIONS, "Ogiltig upprepning").nullable()
  ),
});

/** Partiell uppdatering — används bl.a. för att bocka av med { utford: true }. */
export const reminderUpdateSchema = z.object({
  titel: z.string().trim().min(1, "Titel är obligatorisk").optional(),
  beskrivning: z.preprocess(
    tomStrangTillNull,
    z.string().nullable().optional()
  ),
  datum: z.coerce.date("Ogiltigt datum").optional(),
  paminnaFor: z.number().int().min(0).optional(),
  kategori: z.enum(REMINDER_CATEGORIES, "Ogiltig kategori").optional(),
  samhalleId: z.preprocess(tomStrangTillNull, z.string().nullable().optional()),
  bigardId: z.preprocess(tomStrangTillNull, z.string().nullable().optional()),
  utford: z.boolean().optional(),
  upprepning: z.preprocess(
    tomStrangTillNull,
    z.enum(REMINDER_REPETITIONS, "Ogiltig upprepning").nullable().optional()
  ),
});

/** Byte av drottning: ny drottning + vad som hände med den gamla. */
export const queenSchema = z.object({
  ras: textEllerNull,
  ar: heltalEllerNull,
  vingklippt: z.boolean().optional().default(false),
  ursprung: textEllerNull,
  installeradDatum: z.coerce.date("Ogiltigt datum").optional(),
  gammalStatus: z
    .enum(["Ersatt", "Död", "Försvunnen"], "Ogiltig status")
    .optional()
    .default("Ersatt"),
  anteckningar: textEllerNull,
});

export const accountingSchema = z.object({
  datum: z.coerce.date("Ogiltigt datum"),
  handelseTyp: z.enum(TRANSACTION_TYPES, "Ogiltig transaktionstyp"),
  beskrivning: z.string().trim().min(1, "Beskrivning är obligatorisk"),
  beloppExMoms: z.number("Belopp måste vara ett tal"),
  momsSats: z.number().min(0).max(1).optional().default(0.12),
  mottagare: textEllerNull,
  antalBurkar: heltalEllerNull,
  prisPerEnhet: talEllerNull,
  fakturaNummer: textEllerNull,
  notering: textEllerNull,
});

export const customerSchema = z.object({
  namn: z.string().trim().min(1, "Namn är obligatoriskt"),
  adress: textEllerNull,
  postnummer: textEllerNull,
  ort: textEllerNull,
  epost: textEllerNull,
  telefon: textEllerNull,
  organisationsnummer: textEllerNull,
});

export const settingsSchema = z.object({
  foretagsnamn: textEllerNull,
  organisationsnummer: textEllerNull,
  adress: textEllerNull,
  postnummer: textEllerNull,
  ort: textEllerNull,
  telefon: textEllerNull,
  epost: textEllerNull,
  bankgiro: textEllerNull,
  swish: textEllerNull,
  momsRegistrerad: z.boolean().optional().default(false),
  nastaFakturaNummer: z.number().int().min(1).optional().default(1),
});
