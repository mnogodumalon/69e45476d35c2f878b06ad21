// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Koerpermesswerte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    messung_zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    gewicht_kg?: number;
    koerpergroesse_cm?: number;
    bmi?: number;
    koerperfettanteil?: number;
    blutdruck_systolisch?: number;
    blutdruck_diastolisch?: number;
    puls?: number;
    blutzucker?: number;
    koerpertemperatur?: number;
    sauerstoffsaettigung?: number;
    notizen_koerper?: string;
  };
}

export interface Aktivitaeten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    aktivitaet_zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    aktivitaet_typ?: LookupValue;
    aktivitaet_beschreibung?: string;
    dauer_minuten?: number;
    distanz_km?: number;
    kalorien_verbrannt?: number;
    intensitaet?: LookupValue;
    durchschnittspuls?: number;
    notizen_aktivitaet?: string;
  };
}

export interface Ernaehrung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    mahlzeit_zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    mahlzeit_typ?: LookupValue;
    mahlzeit_beschreibung?: string;
    kalorien_aufnahme?: number;
    kohlenhydrate_g?: number;
    eiweiss_g?: number;
    fett_g?: number;
    ballaststoffe_g?: number;
    zucker_g?: number;
    wasseraufnahme_ml?: number;
    notizen_ernaehrung?: string;
  };
}

export interface Schlafprotokoll {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schlaf_datum?: string; // Format: YYYY-MM-DD oder ISO String
    schlafbeginn?: string; // Format: YYYY-MM-DD oder ISO String
    aufwachzeit?: string; // Format: YYYY-MM-DD oder ISO String
    schlafdauer_stunden?: number;
    schlafqualitaet?: LookupValue;
    schlafunterbrechungen?: number;
    schlafmittel?: boolean;
    notizen_schlaf?: string;
  };
}

export interface StimmungWohlbefinden {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    stimmung_zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    stimmung?: LookupValue;
    energielevel?: LookupValue;
    stresslevel?: LookupValue;
    symptome?: LookupValue[];
    medikamente?: string;
    notizen_stimmung?: string;
  };
}

export const APP_IDS = {
  KOERPERMESSWERTE: '69e45464fbe20a104935e1a0',
  AKTIVITAETEN: '69e4546928f0f4d92fb4a468',
  ERNAEHRUNG: '69e4546a93320f1dcd09fb7a',
  SCHLAFPROTOKOLL: '69e4546b6dc16c154381782d',
  STIMMUNG_WOHLBEFINDEN: '69e4546cd1f37f49c8a83883',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'aktivitaeten': {
    aktivitaet_typ: [{ key: "laufen", label: "Laufen" }, { key: "radfahren", label: "Radfahren" }, { key: "schwimmen", label: "Schwimmen" }, { key: "krafttraining", label: "Krafttraining" }, { key: "yoga", label: "Yoga" }, { key: "wandern", label: "Wandern" }, { key: "fussball", label: "Fußball" }, { key: "tennis", label: "Tennis" }, { key: "tanzen", label: "Tanzen" }, { key: "sonstiges", label: "Sonstiges" }],
    intensitaet: [{ key: "leicht", label: "Leicht" }, { key: "mittel", label: "Mittel" }, { key: "intensiv", label: "Intensiv" }],
  },
  'ernaehrung': {
    mahlzeit_typ: [{ key: "snack", label: "Snack" }, { key: "getraenk", label: "Getränk" }, { key: "fruehstueck", label: "Frühstück" }, { key: "mittagessen", label: "Mittagessen" }, { key: "abendessen", label: "Abendessen" }],
  },
  'schlafprotokoll': {
    schlafqualitaet: [{ key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "mittel", label: "Mittel" }, { key: "schlecht", label: "Schlecht" }, { key: "sehr_schlecht", label: "Sehr schlecht" }],
  },
  'stimmung_&_wohlbefinden': {
    stimmung: [{ key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "neutral", label: "Neutral" }, { key: "schlecht", label: "Schlecht" }, { key: "sehr_schlecht", label: "Sehr schlecht" }],
    energielevel: [{ key: "sehr_hoch", label: "Sehr hoch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }, { key: "sehr_niedrig", label: "Sehr niedrig" }],
    stresslevel: [{ key: "kein", label: "Kein Stress" }, { key: "gering", label: "Gering" }, { key: "mittel", label: "Mittel" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
    symptome: [{ key: "kopfschmerzen", label: "Kopfschmerzen" }, { key: "muedigkeit", label: "Müdigkeit" }, { key: "rueckenschmerzen", label: "Rückenschmerzen" }, { key: "uebelkeit", label: "Übelkeit" }, { key: "schwindel", label: "Schwindel" }, { key: "husten", label: "Husten" }, { key: "schnupfen", label: "Schnupfen" }, { key: "bauchschmerzen", label: "Bauchschmerzen" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'koerpermesswerte': {
    'messung_zeitpunkt': 'date/datetimeminute',
    'gewicht_kg': 'number',
    'koerpergroesse_cm': 'number',
    'bmi': 'number',
    'koerperfettanteil': 'number',
    'blutdruck_systolisch': 'number',
    'blutdruck_diastolisch': 'number',
    'puls': 'number',
    'blutzucker': 'number',
    'koerpertemperatur': 'number',
    'sauerstoffsaettigung': 'number',
    'notizen_koerper': 'string/textarea',
  },
  'aktivitaeten': {
    'aktivitaet_zeitpunkt': 'date/datetimeminute',
    'aktivitaet_typ': 'lookup/select',
    'aktivitaet_beschreibung': 'string/text',
    'dauer_minuten': 'number',
    'distanz_km': 'number',
    'kalorien_verbrannt': 'number',
    'intensitaet': 'lookup/radio',
    'durchschnittspuls': 'number',
    'notizen_aktivitaet': 'string/textarea',
  },
  'ernaehrung': {
    'mahlzeit_zeitpunkt': 'date/datetimeminute',
    'mahlzeit_typ': 'lookup/radio',
    'mahlzeit_beschreibung': 'string/textarea',
    'kalorien_aufnahme': 'number',
    'kohlenhydrate_g': 'number',
    'eiweiss_g': 'number',
    'fett_g': 'number',
    'ballaststoffe_g': 'number',
    'zucker_g': 'number',
    'wasseraufnahme_ml': 'number',
    'notizen_ernaehrung': 'string/textarea',
  },
  'schlafprotokoll': {
    'schlaf_datum': 'date/date',
    'schlafbeginn': 'date/datetimeminute',
    'aufwachzeit': 'date/datetimeminute',
    'schlafdauer_stunden': 'number',
    'schlafqualitaet': 'lookup/radio',
    'schlafunterbrechungen': 'number',
    'schlafmittel': 'bool',
    'notizen_schlaf': 'string/textarea',
  },
  'stimmung_&_wohlbefinden': {
    'stimmung_zeitpunkt': 'date/datetimeminute',
    'stimmung': 'lookup/radio',
    'energielevel': 'lookup/radio',
    'stresslevel': 'lookup/radio',
    'symptome': 'multiplelookup/checkbox',
    'medikamente': 'string/text',
    'notizen_stimmung': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKoerpermesswerte = StripLookup<Koerpermesswerte['fields']>;
export type CreateAktivitaeten = StripLookup<Aktivitaeten['fields']>;
export type CreateErnaehrung = StripLookup<Ernaehrung['fields']>;
export type CreateSchlafprotokoll = StripLookup<Schlafprotokoll['fields']>;
export type CreateStimmungWohlbefinden = StripLookup<StimmungWohlbefinden['fields']>;