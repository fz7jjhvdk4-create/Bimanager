// Event types
export const EVENT_TYPES = [
  "Inspektion",
  "Varroamätning",
  "Utfodring",
  "Skörd",
  "Invintring",
  "Avläggare",
  "Hälsoåtgärd",
  "Anteckning",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// Colony status
export const COLONY_STATUSES = [
  "Aktiv",
  "Förlorat",
  "Avyttrat",
  "Sammanslagen",
] as const;

export type ColonyStatus = (typeof COLONY_STATUSES)[number];

// Strength levels
export const STRENGTH_LEVELS = ["Svagt", "Medel", "Starkt"] as const;
export type StrengthLevel = (typeof STRENGTH_LEVELS)[number];

// Temperament levels
export const TEMPERAMENT_LEVELS = ["Lugnt", "Neutralt", "Upprörd"] as const;
export type TemperamentLevel = (typeof TEMPERAMENT_LEVELS)[number];

// Health action types
export const HEALTH_ACTION_TYPES = [
  "Varroabehandling",
  "Apiguard",
  "Drönarram utskuren",
  "Annan behandling",
] as const;
export type HealthActionType = (typeof HEALTH_ACTION_TYPES)[number];

// Event data interfaces
export interface InspectionData {
  styrka: StrengthLevel;
  temperament: TemperamentLevel;
  drottningSynlig: boolean;
  drottningceller: boolean;
  anteckningar?: string;
}

export interface HarvestData {
  mangdKg: number;
  antalRamar: number;
  anteckningar?: string;
}

export interface WinterizationData {
  antalRamar: number;
  fodermangdKg: number;
  allmanntSkick: StrengthLevel;
  anteckningar?: string;
}

export interface SplitData {
  nyttSamhalleSkapad: boolean;
  nyttSamhalleId?: string;
  anteckningar?: string;
}

export interface HealthActionData {
  atgardstyp: HealthActionType;
  metodPreparat?: string;
  batchnummer?: string; // preparatets batchnr — krävs i behandlingsjournalen
  karensDagar?: number; // karenstid innan skörd
  anteckningar?: string;
}

// Varroa measurement
export const VARROA_METHODS = [
  "Nedfall",
  "Alkoholtvätt",
  "Sockerprov",
] as const;
export type VarroaMethod = (typeof VARROA_METHODS)[number];

export interface VarroaMeasurementData {
  metod: VarroaMethod;
  antalKvalster: number;
  antalDygn?: number; // för nedfallsmätning
  antalBin?: number; // för alkoholtvätt/sockerprov (vanligen ca 300)
  nedfallPerDygn?: number; // beräknat
  angreppsgrad?: number; // beräknat, % av provets bin
  anteckningar?: string;
}

// Feeding
export const FEED_TYPES = [
  "Sockerlösning",
  "Invertsocker",
  "Foderdeg",
  "Egen honung",
  "Annat",
] as const;
export type FeedType = (typeof FEED_TYPES)[number];

export const FEED_PURPOSES = [
  "Höstfodring",
  "Stimuleringsfodring",
  "Nödfodring",
] as const;
export type FeedPurpose = (typeof FEED_PURPOSES)[number];

export interface FeedingData {
  fodertyp: FeedType;
  mangdKg: number;
  syfte?: FeedPurpose;
  anteckningar?: string;
}

export interface NoteData {
  anteckningar: string;
}

export type EventData =
  | InspectionData
  | HarvestData
  | WinterizationData
  | SplitData
  | HealthActionData
  | VarroaMeasurementData
  | FeedingData
  | NoteData;

// Transaction types
export const TRANSACTION_TYPES = ["Försäljning", "Inköp"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// Invoice status
export const INVOICE_STATUSES = ["Utkast", "Skickad", "Betald"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// Invoice line item
export interface InvoiceLineItem {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  momsSats: number;
  belopp: number;
}

// Common hive types
export const HIVE_TYPES = [
  "Stapling",
  "Vandringskupa",
  "Trågkupa",
  "Topplistkupa",
] as const;

// Common frame types
export const FRAME_TYPES = [
  "Farrar 3/4 Langstroth",
  "Langstroth djup",
  "Dadant",
  "Svea",
  "Lågnormal",
] as const;

// Common queen races
export const QUEEN_RACES = [
  "Buckfast",
  "Carnica",
  "Italienska",
  "Nordbi",
  "Kaukasiska",
] as const;

// Queen origins and statuses
export const QUEEN_ORIGINS = [
  "Köpt",
  "Egen avel",
  "Svärmcell",
  "Okänd",
] as const;

export const QUEEN_STATUSES = [
  "Aktiv",
  "Ersatt",
  "Död",
  "Försvunnen",
] as const;
export type QueenStatus = (typeof QUEEN_STATUSES)[number];

// Reminder categories
export const REMINDER_CATEGORIES = [
  "Varroabehandling",
  "Inspektion",
  "Invintring",
  "Utfodring",
  "Skörd",
  "Övrigt",
] as const;
export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];

// Reminder repetition
export const REMINDER_REPETITIONS = [
  "Ingen",
  "Varje vecka",
  "Varje månad",
  "Varje år",
] as const;
export type ReminderRepetition = (typeof REMINDER_REPETITIONS)[number];
