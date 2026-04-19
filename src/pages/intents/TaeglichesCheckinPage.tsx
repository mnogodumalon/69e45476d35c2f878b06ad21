import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { BudgetTracker } from '@/components/BudgetTracker';
import { StatusBadge } from '@/components/StatusBadge';
import { KoerpermesswerteDialog } from '@/components/dialogs/KoerpermesswerteDialog';
import { AktivitaetenDialog } from '@/components/dialogs/AktivitaetenDialog';
import { ErnaehrungDialog } from '@/components/dialogs/ErnaehrungDialog';
import { SchlafprotokollDialog } from '@/components/dialogs/SchlafprotokollDialog';
import { StimmungWohlbefindenDialog } from '@/components/dialogs/StimmungWohlbefindenDialog';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Koerpermesswerte, Aktivitaeten, Ernaehrung, Schlafprotokoll, StimmungWohlbefinden } from '@/types/app';
import { Button } from '@/components/ui/button';
import {
  IconHeartbeat,
  IconRun,
  IconSalad,
  IconMoon,
  IconMoodSmile,
  IconCheck,
  IconPlus,
  IconChevronRight,
  IconChevronLeft,
  IconPencil,
} from '@tabler/icons-react';

const WIZARD_STEPS = [
  { label: 'Körper' },
  { label: 'Aktivität' },
  { label: 'Ernährung' },
  { label: 'Schlaf' },
  { label: 'Stimmung' },
];

const KALORIENZIEL = 2000;

export default function TaeglichesCheckinPage() {
  const [searchParams] = useSearchParams();

  // Initialize step from URL param (1-indexed)
  const urlStep = parseInt(searchParams.get('step') ?? '', 10);
  const initialStep = urlStep >= 1 && urlStep <= 6 ? urlStep : 1;

  const [currentStep, setCurrentStep] = useState(initialStep);

  // Step 1: Körpermesswerte
  const [koerperDialogOpen, setKoerperDialogOpen] = useState(false);
  const [koerperRecord, setKoerperRecord] = useState<Koerpermesswerte | null>(null);

  // Step 2: Aktivitaeten
  const [aktivitaetDialogOpen, setAktivitaetDialogOpen] = useState(false);
  const [aktivitaetRecord, setAktivitaetRecord] = useState<Aktivitaeten | null>(null);

  // Step 3: Ernaehrung (multiple entries)
  const [ernaehrungDialogOpen, setErnaehrungDialogOpen] = useState(false);
  const [ernaehrungRecords, setErnaehrungRecords] = useState<Ernaehrung[]>([]);

  // Step 4: Schlafprotokoll
  const [schlafDialogOpen, setSchlafDialogOpen] = useState(false);
  const [schlafRecord, setSchlafRecord] = useState<Schlafprotokoll | null>(null);

  // Step 5: StimmungWohlbefinden
  const [stimmungDialogOpen, setStimmungDialogOpen] = useState(false);
  const [stimmungRecord, setStimmungRecord] = useState<StimmungWohlbefinden | null>(null);

  // Handlers
  const handleKoerperSubmit = useCallback(async (fields: Koerpermesswerte['fields']) => {
    const result = await LivingAppsService.createKoerpermesswerteEntry(fields);
    const entries = Object.entries(result as Record<string, Koerpermesswerte>);
    if (entries.length > 0) {
      setKoerperRecord(entries[0][1]);
    } else {
      // Fallback: create a local record with the fields so the summary is still shown
      setKoerperRecord({ record_id: 'new', createdat: new Date().toISOString(), updatedat: null, fields });
    }
  }, []);

  const handleAktivitaetSubmit = useCallback(async (fields: Aktivitaeten['fields']) => {
    const result = await LivingAppsService.createAktivitaetenEntry(fields);
    const entries = Object.entries(result as Record<string, Aktivitaeten>);
    if (entries.length > 0) {
      setAktivitaetRecord(entries[0][1]);
    } else {
      setAktivitaetRecord({ record_id: 'new', createdat: new Date().toISOString(), updatedat: null, fields });
    }
  }, []);

  const handleErnaehrungSubmit = useCallback(async (fields: Ernaehrung['fields']) => {
    const result = await LivingAppsService.createErnaehrungEntry(fields);
    const entries = Object.entries(result as Record<string, Ernaehrung>);
    const newRecord: Ernaehrung = entries.length > 0
      ? entries[0][1]
      : { record_id: `new-${Date.now()}`, createdat: new Date().toISOString(), updatedat: null, fields };
    setErnaehrungRecords(prev => [...prev, newRecord]);
  }, []);

  const handleSchlafSubmit = useCallback(async (fields: Schlafprotokoll['fields']) => {
    const result = await LivingAppsService.createSchlafprotokollEntry(fields);
    const entries = Object.entries(result as Record<string, Schlafprotokoll>);
    if (entries.length > 0) {
      setSchlafRecord(entries[0][1]);
    } else {
      setSchlafRecord({ record_id: 'new', createdat: new Date().toISOString(), updatedat: null, fields });
    }
  }, []);

  const handleStimmungSubmit = useCallback(async (fields: StimmungWohlbefinden['fields']) => {
    const result = await LivingAppsService.createStimmungWohlbefindenEntry(fields);
    const entries = Object.entries(result as Record<string, StimmungWohlbefinden>);
    if (entries.length > 0) {
      setStimmungRecord(entries[0][1]);
    } else {
      setStimmungRecord({ record_id: 'new', createdat: new Date().toISOString(), updatedat: null, fields });
    }
  }, []);

  const totalKalorien = ernaehrungRecords.reduce(
    (sum, r) => sum + (r.fields.kalorien_aufnahme ?? 0),
    0
  );

  // Navigation helpers
  const goNext = () => setCurrentStep(s => Math.min(s + 1, 6));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1));

  // ── Step renderers ────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <IconHeartbeat size={22} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Körpermessung</h2>
            <p className="text-sm text-muted-foreground">Erfasse dein aktuelles Gewicht, Blutdruck, Puls und weitere Körperwerte.</p>
          </div>
        </div>

        {koerperRecord ? (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <IconCheck size={16} className="shrink-0" />
                  Messung erfasst
                </span>
                <button
                  type="button"
                  onClick={() => setKoerperDialogOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <IconPencil size={13} />
                  Neu erfassen
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {koerperRecord.fields.gewicht_kg != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Gewicht</p>
                    <p className="font-semibold">{koerperRecord.fields.gewicht_kg} kg</p>
                  </div>
                )}
                {koerperRecord.fields.bmi != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">BMI</p>
                    <p className="font-semibold">{koerperRecord.fields.bmi}</p>
                  </div>
                )}
                {koerperRecord.fields.blutdruck_systolisch != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Blutdruck</p>
                    <p className="font-semibold">
                      {koerperRecord.fields.blutdruck_systolisch}
                      {koerperRecord.fields.blutdruck_diastolisch != null && `/${koerperRecord.fields.blutdruck_diastolisch}`} mmHg
                    </p>
                  </div>
                )}
                {koerperRecord.fields.puls != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Puls</p>
                    <p className="font-semibold">{koerperRecord.fields.puls} bpm</p>
                  </div>
                )}
                {koerperRecord.fields.sauerstoffsaettigung != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">SpO₂</p>
                    <p className="font-semibold">{koerperRecord.fields.sauerstoffsaettigung} %</p>
                  </div>
                )}
                {koerperRecord.fields.koerpertemperatur != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Temperatur</p>
                    <p className="font-semibold">{koerperRecord.fields.koerpertemperatur} °C</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 flex flex-col items-center gap-3 text-center">
            <IconHeartbeat size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch keine Messung heute erfasst.</p>
            <Button onClick={() => setKoerperDialogOpen(true)} className="mt-1">
              <IconPlus size={16} className="mr-2" />
              Neu erfassen
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div />
          <Button onClick={goNext}>
            Weiter
            <IconChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <KoerpermesswerteDialog
          open={koerperDialogOpen}
          onClose={() => setKoerperDialogOpen(false)}
          onSubmit={async (fields) => {
            await handleKoerperSubmit(fields);
            setKoerperDialogOpen(false);
          }}
        />
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <IconRun size={22} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Aktivität</h2>
            <p className="text-sm text-muted-foreground">Welche Aktivität hast du heute gemacht? Dauer, Intensität und Kalorien festhalten.</p>
          </div>
        </div>

        {aktivitaetRecord ? (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <IconCheck size={16} className="shrink-0" />
                  Aktivität erfasst
                </span>
                <button
                  type="button"
                  onClick={() => setAktivitaetDialogOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <IconPencil size={13} />
                  Neu erfassen
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {aktivitaetRecord.fields.aktivitaet_typ != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Typ</p>
                    <p className="font-semibold truncate">
                      {typeof aktivitaetRecord.fields.aktivitaet_typ === 'object'
                        ? aktivitaetRecord.fields.aktivitaet_typ.label
                        : aktivitaetRecord.fields.aktivitaet_typ}
                    </p>
                  </div>
                )}
                {aktivitaetRecord.fields.dauer_minuten != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Dauer</p>
                    <p className="font-semibold">{aktivitaetRecord.fields.dauer_minuten} min</p>
                  </div>
                )}
                {aktivitaetRecord.fields.kalorien_verbrannt != null && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                    <p className="text-xs text-orange-700">Kalorien verbrannt</p>
                    <p className="font-bold text-orange-700">{aktivitaetRecord.fields.kalorien_verbrannt} kcal</p>
                  </div>
                )}
                {aktivitaetRecord.fields.intensitaet != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Intensität</p>
                    <p className="font-semibold truncate">
                      {typeof aktivitaetRecord.fields.intensitaet === 'object'
                        ? aktivitaetRecord.fields.intensitaet.label
                        : aktivitaetRecord.fields.intensitaet}
                    </p>
                  </div>
                )}
                {aktivitaetRecord.fields.distanz_km != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Distanz</p>
                    <p className="font-semibold">{aktivitaetRecord.fields.distanz_km} km</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 flex flex-col items-center gap-3 text-center">
            <IconRun size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch keine Aktivität heute erfasst.</p>
            <Button onClick={() => setAktivitaetDialogOpen(true)} className="mt-1">
              <IconPlus size={16} className="mr-2" />
              Aktivität erfassen
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={goBack}>
            <IconChevronLeft size={16} className="mr-1" />
            Zurück
          </Button>
          <Button onClick={goNext}>
            Weiter
            <IconChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <AktivitaetenDialog
          open={aktivitaetDialogOpen}
          onClose={() => setAktivitaetDialogOpen(false)}
          onSubmit={async (fields) => {
            await handleAktivitaetSubmit(fields);
            setAktivitaetDialogOpen(false);
          }}
        />
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <IconSalad size={22} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ernährung</h2>
            <p className="text-sm text-muted-foreground">Erfasse deine Mahlzeiten und verfolge deine Kalorienaufnahme (Ziel: {KALORIENZIEL} kcal).</p>
          </div>
        </div>

        <BudgetTracker
          budget={KALORIENZIEL}
          booked={totalKalorien}
          label="Kalorienaufnahme"
          showRemaining
        />

        {ernaehrungRecords.length > 0 && (
          <div className="space-y-2">
            {ernaehrungRecords.map((r, idx) => (
              <div key={r.record_id} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-xs font-bold text-green-700">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.fields.mahlzeit_typ != null
                        ? (typeof r.fields.mahlzeit_typ === 'object'
                            ? r.fields.mahlzeit_typ.label
                            : r.fields.mahlzeit_typ)
                        : 'Mahlzeit'}
                      {r.fields.mahlzeit_beschreibung ? ` — ${r.fields.mahlzeit_beschreibung}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {r.fields.kalorien_aufnahme != null && (
                        <span className="text-xs text-muted-foreground">{r.fields.kalorien_aufnahme} kcal</span>
                      )}
                      {r.fields.kohlenhydrate_g != null && (
                        <span className="text-xs text-muted-foreground">KH: {r.fields.kohlenhydrate_g} g</span>
                      )}
                      {r.fields.eiweiss_g != null && (
                        <span className="text-xs text-muted-foreground">EW: {r.fields.eiweiss_g} g</span>
                      )}
                      {r.fields.fett_g != null && (
                        <span className="text-xs text-muted-foreground">Fett: {r.fields.fett_g} g</span>
                      )}
                      {r.fields.wasseraufnahme_ml != null && (
                        <span className="text-xs text-muted-foreground">Wasser: {r.fields.wasseraufnahme_ml} ml</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={() => setErnaehrungDialogOpen(true)} className="w-full">
          <IconPlus size={16} className="mr-2" />
          Mahlzeit hinzufügen
        </Button>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={goBack}>
            <IconChevronLeft size={16} className="mr-1" />
            Zurück
          </Button>
          <Button onClick={goNext}>
            Weiter
            <IconChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <ErnaehrungDialog
          open={ernaehrungDialogOpen}
          onClose={() => setErnaehrungDialogOpen(false)}
          onSubmit={async (fields) => {
            await handleErnaehrungSubmit(fields);
            setErnaehrungDialogOpen(false);
          }}
        />
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <IconMoon size={22} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Schlaf</h2>
            <p className="text-sm text-muted-foreground">Wie gut hast du letzte Nacht geschlafen? Dauer, Qualität und Unterbrechungen erfassen.</p>
          </div>
        </div>

        {schlafRecord ? (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <IconCheck size={16} className="shrink-0" />
                  Schlaf erfasst
                </span>
                <button
                  type="button"
                  onClick={() => setSchlafDialogOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <IconPencil size={13} />
                  Neu erfassen
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {schlafRecord.fields.schlafdauer_stunden != null && (
                  <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                    <p className="text-xs text-indigo-700">Schlafdauer</p>
                    <p className="font-bold text-indigo-700">{schlafRecord.fields.schlafdauer_stunden} h</p>
                  </div>
                )}
                {schlafRecord.fields.schlafqualitaet != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Qualität</p>
                    <StatusBadge
                      statusKey={typeof schlafRecord.fields.schlafqualitaet === 'object'
                        ? schlafRecord.fields.schlafqualitaet.key
                        : schlafRecord.fields.schlafqualitaet}
                      label={typeof schlafRecord.fields.schlafqualitaet === 'object'
                        ? schlafRecord.fields.schlafqualitaet.label
                        : schlafRecord.fields.schlafqualitaet}
                    />
                  </div>
                )}
                {schlafRecord.fields.schlafunterbrechungen != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Unterbrechungen</p>
                    <p className="font-semibold">{schlafRecord.fields.schlafunterbrechungen}×</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 flex flex-col items-center gap-3 text-center">
            <IconMoon size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch kein Schlafprotokoll erfasst.</p>
            <Button onClick={() => setSchlafDialogOpen(true)} className="mt-1">
              <IconPlus size={16} className="mr-2" />
              Schlaf erfassen
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={goBack}>
            <IconChevronLeft size={16} className="mr-1" />
            Zurück
          </Button>
          <Button onClick={goNext}>
            Weiter
            <IconChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <SchlafprotokollDialog
          open={schlafDialogOpen}
          onClose={() => setSchlafDialogOpen(false)}
          onSubmit={async (fields) => {
            await handleSchlafSubmit(fields);
            setSchlafDialogOpen(false);
          }}
        />
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
            <IconMoodSmile size={22} className="text-yellow-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Stimmung & Wohlbefinden</h2>
            <p className="text-sm text-muted-foreground">Wie fühlst du dich heute? Stimmung, Energielevel und Stresslevel eintragen.</p>
          </div>
        </div>

        {stimmungRecord ? (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <IconCheck size={16} className="shrink-0" />
                  Stimmung erfasst
                </span>
                <button
                  type="button"
                  onClick={() => setStimmungDialogOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <IconPencil size={13} />
                  Neu erfassen
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stimmungRecord.fields.stimmung != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Stimmung</p>
                    <StatusBadge
                      statusKey={typeof stimmungRecord.fields.stimmung === 'object'
                        ? stimmungRecord.fields.stimmung.key
                        : stimmungRecord.fields.stimmung}
                      label={typeof stimmungRecord.fields.stimmung === 'object'
                        ? stimmungRecord.fields.stimmung.label
                        : stimmungRecord.fields.stimmung}
                    />
                  </div>
                )}
                {stimmungRecord.fields.energielevel != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Energie</p>
                    <StatusBadge
                      statusKey={typeof stimmungRecord.fields.energielevel === 'object'
                        ? stimmungRecord.fields.energielevel.key
                        : stimmungRecord.fields.energielevel}
                      label={typeof stimmungRecord.fields.energielevel === 'object'
                        ? stimmungRecord.fields.energielevel.label
                        : stimmungRecord.fields.energielevel}
                    />
                  </div>
                )}
                {stimmungRecord.fields.stresslevel != null && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Stress</p>
                    <StatusBadge
                      statusKey={typeof stimmungRecord.fields.stresslevel === 'object'
                        ? stimmungRecord.fields.stresslevel.key
                        : stimmungRecord.fields.stresslevel}
                      label={typeof stimmungRecord.fields.stresslevel === 'object'
                        ? stimmungRecord.fields.stresslevel.label
                        : stimmungRecord.fields.stresslevel}
                    />
                  </div>
                )}
              </div>
              {stimmungRecord.fields.notizen_stimmung && (
                <p className="text-sm text-muted-foreground line-clamp-2">{stimmungRecord.fields.notizen_stimmung}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 flex flex-col items-center gap-3 text-center">
            <IconMoodSmile size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch keine Stimmung erfasst.</p>
            <Button onClick={() => setStimmungDialogOpen(true)} className="mt-1">
              <IconPlus size={16} className="mr-2" />
              Stimmung erfassen
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={goBack}>
            <IconChevronLeft size={16} className="mr-1" />
            Zurück
          </Button>
          <Button onClick={goNext} disabled={!stimmungRecord}>
            Fertigstellen
            <IconChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <StimmungWohlbefindenDialog
          open={stimmungDialogOpen}
          onClose={() => setStimmungDialogOpen(false)}
          onSubmit={async (fields) => {
            await handleStimmungSubmit(fields);
            setStimmungDialogOpen(false);
          }}
        />
      </div>
    );
  }

  function renderSummary() {
    return (
      <div className="space-y-6">
        {/* Success header */}
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <IconCheck size={32} className="text-green-600" stroke={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Check-in abgeschlossen!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Dein tägliches Gesundheits-Check-in für heute ist vollständig.
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Körpermessung */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <IconHeartbeat size={18} className="text-red-600" />
                </div>
                <h3 className="font-semibold text-sm">Körpermessung</h3>
              </div>
              {koerperRecord ? (
                <div className="space-y-1 text-sm">
                  {koerperRecord.fields.gewicht_kg != null && (
                    <p className="text-muted-foreground">Gewicht: <span className="font-medium text-foreground">{koerperRecord.fields.gewicht_kg} kg</span></p>
                  )}
                  {koerperRecord.fields.puls != null && (
                    <p className="text-muted-foreground">Puls: <span className="font-medium text-foreground">{koerperRecord.fields.puls} bpm</span></p>
                  )}
                  {koerperRecord.fields.bmi != null && (
                    <p className="text-muted-foreground">BMI: <span className="font-medium text-foreground">{koerperRecord.fields.bmi}</span></p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nicht erfasst</p>
              )}
            </div>
          </div>

          {/* Aktivität */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <IconRun size={18} className="text-orange-600" />
                </div>
                <h3 className="font-semibold text-sm">Aktivität</h3>
              </div>
              {aktivitaetRecord ? (
                <div className="space-y-1 text-sm">
                  {aktivitaetRecord.fields.aktivitaet_typ != null && (
                    <p className="text-muted-foreground truncate">
                      Typ: <span className="font-medium text-foreground">
                        {typeof aktivitaetRecord.fields.aktivitaet_typ === 'object'
                          ? aktivitaetRecord.fields.aktivitaet_typ.label
                          : aktivitaetRecord.fields.aktivitaet_typ}
                      </span>
                    </p>
                  )}
                  {aktivitaetRecord.fields.dauer_minuten != null && (
                    <p className="text-muted-foreground">Dauer: <span className="font-medium text-foreground">{aktivitaetRecord.fields.dauer_minuten} min</span></p>
                  )}
                  {aktivitaetRecord.fields.kalorien_verbrannt != null && (
                    <p className="text-muted-foreground">Verbrannt: <span className="font-medium text-orange-600">{aktivitaetRecord.fields.kalorien_verbrannt} kcal</span></p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nicht erfasst</p>
              )}
            </div>
          </div>

          {/* Ernährung */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <IconSalad size={18} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-sm">Ernährung</h3>
              </div>
              {ernaehrungRecords.length > 0 ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Mahlzeiten: <span className="font-medium text-foreground">{ernaehrungRecords.length}</span></p>
                  <p className="text-muted-foreground">Gesamt: <span className="font-medium text-green-700">{totalKalorien} kcal</span></p>
                  <p className="text-muted-foreground">Ziel: <span className="font-medium text-foreground">{KALORIENZIEL} kcal</span></p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nicht erfasst</p>
              )}
            </div>
          </div>

          {/* Schlaf */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <IconMoon size={18} className="text-indigo-600" />
                </div>
                <h3 className="font-semibold text-sm">Schlaf</h3>
              </div>
              {schlafRecord ? (
                <div className="space-y-1 text-sm">
                  {schlafRecord.fields.schlafdauer_stunden != null && (
                    <p className="text-muted-foreground">Dauer: <span className="font-medium text-foreground">{schlafRecord.fields.schlafdauer_stunden} h</span></p>
                  )}
                  {schlafRecord.fields.schlafqualitaet != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Qualität:</span>
                      <StatusBadge
                        statusKey={typeof schlafRecord.fields.schlafqualitaet === 'object'
                          ? schlafRecord.fields.schlafqualitaet.key
                          : schlafRecord.fields.schlafqualitaet}
                        label={typeof schlafRecord.fields.schlafqualitaet === 'object'
                          ? schlafRecord.fields.schlafqualitaet.label
                          : schlafRecord.fields.schlafqualitaet}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nicht erfasst</p>
              )}
            </div>
          </div>

          {/* Stimmung — full width on sm+ */}
          <div className="rounded-xl border bg-card overflow-hidden sm:col-span-2">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                  <IconMoodSmile size={18} className="text-yellow-600" />
                </div>
                <h3 className="font-semibold text-sm">Stimmung & Wohlbefinden</h3>
              </div>
              {stimmungRecord ? (
                <div className="flex flex-wrap gap-2">
                  {stimmungRecord.fields.stimmung != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Stimmung:</span>
                      <StatusBadge
                        statusKey={typeof stimmungRecord.fields.stimmung === 'object'
                          ? stimmungRecord.fields.stimmung.key
                          : stimmungRecord.fields.stimmung}
                        label={typeof stimmungRecord.fields.stimmung === 'object'
                          ? stimmungRecord.fields.stimmung.label
                          : stimmungRecord.fields.stimmung}
                      />
                    </div>
                  )}
                  {stimmungRecord.fields.energielevel != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Energie:</span>
                      <StatusBadge
                        statusKey={typeof stimmungRecord.fields.energielevel === 'object'
                          ? stimmungRecord.fields.energielevel.key
                          : stimmungRecord.fields.energielevel}
                        label={typeof stimmungRecord.fields.energielevel === 'object'
                          ? stimmungRecord.fields.energielevel.label
                          : stimmungRecord.fields.energielevel}
                      />
                    </div>
                  )}
                  {stimmungRecord.fields.stresslevel != null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Stress:</span>
                      <StatusBadge
                        statusKey={typeof stimmungRecord.fields.stresslevel === 'object'
                          ? stimmungRecord.fields.stresslevel.key
                          : stimmungRecord.fields.stresslevel}
                        label={typeof stimmungRecord.fields.stresslevel === 'object'
                          ? stimmungRecord.fields.stresslevel.label
                          : stimmungRecord.fields.stresslevel}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nicht erfasst</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={goBack}>
            <IconChevronLeft size={16} className="mr-1" />
            Zurück
          </Button>
          <a href="#/">
            <Button variant="default">
              Zurück zum Dashboard
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // Steps 1–5 map to currentStep 1–5; step 6 is summary
  function renderCurrentStep() {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderSummary();
    }
  }

  return (
    <IntentWizardShell
      title="Tägliches Gesundheits-Check-in"
      subtitle="Erfasse alle deine Gesundheitsdaten in einem geführten Ablauf."
      steps={WIZARD_STEPS}
      currentStep={currentStep > 5 ? 5 : currentStep}
      onStepChange={setCurrentStep}
    >
      {renderCurrentStep()}
    </IntentWizardShell>
  );
}
