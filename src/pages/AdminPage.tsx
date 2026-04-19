import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Koerpermesswerte, Aktivitaeten, Ernaehrung, Schlafprotokoll, StimmungWohlbefinden } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { KoerpermesswerteDialog } from '@/components/dialogs/KoerpermesswerteDialog';
import { KoerpermesswerteViewDialog } from '@/components/dialogs/KoerpermesswerteViewDialog';
import { AktivitaetenDialog } from '@/components/dialogs/AktivitaetenDialog';
import { AktivitaetenViewDialog } from '@/components/dialogs/AktivitaetenViewDialog';
import { ErnaehrungDialog } from '@/components/dialogs/ErnaehrungDialog';
import { ErnaehrungViewDialog } from '@/components/dialogs/ErnaehrungViewDialog';
import { SchlafprotokollDialog } from '@/components/dialogs/SchlafprotokollDialog';
import { SchlafprotokollViewDialog } from '@/components/dialogs/SchlafprotokollViewDialog';
import { StimmungWohlbefindenDialog } from '@/components/dialogs/StimmungWohlbefindenDialog';
import { StimmungWohlbefindenViewDialog } from '@/components/dialogs/StimmungWohlbefindenViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPencil, IconTrash, IconPlus, IconFilter, IconX, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconSearch, IconCopy } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const KOERPERMESSWERTE_FIELDS = [
  { key: 'messung_zeitpunkt', label: 'Datum und Uhrzeit der Messung', type: 'date/datetimeminute' },
  { key: 'gewicht_kg', label: 'Gewicht (kg)', type: 'number' },
  { key: 'koerpergroesse_cm', label: 'Körpergröße (cm)', type: 'number' },
  { key: 'bmi', label: 'BMI', type: 'number' },
  { key: 'koerperfettanteil', label: 'Körperfettanteil (%)', type: 'number' },
  { key: 'blutdruck_systolisch', label: 'Blutdruck systolisch (mmHg)', type: 'number' },
  { key: 'blutdruck_diastolisch', label: 'Blutdruck diastolisch (mmHg)', type: 'number' },
  { key: 'puls', label: 'Puls (Schläge/min)', type: 'number' },
  { key: 'blutzucker', label: 'Blutzucker (mg/dL)', type: 'number' },
  { key: 'koerpertemperatur', label: 'Körpertemperatur (°C)', type: 'number' },
  { key: 'sauerstoffsaettigung', label: 'Sauerstoffsättigung (%)', type: 'number' },
  { key: 'notizen_koerper', label: 'Notizen', type: 'string/textarea' },
];
const AKTIVITAETEN_FIELDS = [
  { key: 'aktivitaet_zeitpunkt', label: 'Datum und Uhrzeit', type: 'date/datetimeminute' },
  { key: 'aktivitaet_typ', label: 'Aktivitätstyp', type: 'lookup/select', options: [{ key: 'laufen', label: 'Laufen' }, { key: 'radfahren', label: 'Radfahren' }, { key: 'schwimmen', label: 'Schwimmen' }, { key: 'krafttraining', label: 'Krafttraining' }, { key: 'yoga', label: 'Yoga' }, { key: 'wandern', label: 'Wandern' }, { key: 'fussball', label: 'Fußball' }, { key: 'tennis', label: 'Tennis' }, { key: 'tanzen', label: 'Tanzen' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'aktivitaet_beschreibung', label: 'Aktivitätsbeschreibung', type: 'string/text' },
  { key: 'dauer_minuten', label: 'Dauer (Minuten)', type: 'number' },
  { key: 'distanz_km', label: 'Distanz (km)', type: 'number' },
  { key: 'kalorien_verbrannt', label: 'Verbrannte Kalorien (kcal)', type: 'number' },
  { key: 'intensitaet', label: 'Intensität', type: 'lookup/radio', options: [{ key: 'leicht', label: 'Leicht' }, { key: 'mittel', label: 'Mittel' }, { key: 'intensiv', label: 'Intensiv' }] },
  { key: 'durchschnittspuls', label: 'Durchschnittlicher Puls (Schläge/min)', type: 'number' },
  { key: 'notizen_aktivitaet', label: 'Notizen', type: 'string/textarea' },
];
const ERNAEHRUNG_FIELDS = [
  { key: 'mahlzeit_zeitpunkt', label: 'Datum und Uhrzeit', type: 'date/datetimeminute' },
  { key: 'mahlzeit_typ', label: 'Mahlzeit', type: 'lookup/radio', options: [{ key: 'snack', label: 'Snack' }, { key: 'getraenk', label: 'Getränk' }, { key: 'fruehstueck', label: 'Frühstück' }, { key: 'mittagessen', label: 'Mittagessen' }, { key: 'abendessen', label: 'Abendessen' }] },
  { key: 'mahlzeit_beschreibung', label: 'Beschreibung der Mahlzeit', type: 'string/textarea' },
  { key: 'kalorien_aufnahme', label: 'Kalorien (kcal)', type: 'number' },
  { key: 'kohlenhydrate_g', label: 'Kohlenhydrate (g)', type: 'number' },
  { key: 'eiweiss_g', label: 'Eiweiß (g)', type: 'number' },
  { key: 'fett_g', label: 'Fett (g)', type: 'number' },
  { key: 'ballaststoffe_g', label: 'Ballaststoffe (g)', type: 'number' },
  { key: 'zucker_g', label: 'Zucker (g)', type: 'number' },
  { key: 'wasseraufnahme_ml', label: 'Wasseraufnahme (ml)', type: 'number' },
  { key: 'notizen_ernaehrung', label: 'Notizen', type: 'string/textarea' },
];
const SCHLAFPROTOKOLL_FIELDS = [
  { key: 'schlaf_datum', label: 'Datum (Nacht)', type: 'date/date' },
  { key: 'schlafbeginn', label: 'Schlafbeginn', type: 'date/datetimeminute' },
  { key: 'aufwachzeit', label: 'Aufwachzeit', type: 'date/datetimeminute' },
  { key: 'schlafdauer_stunden', label: 'Schlafdauer (Stunden)', type: 'number' },
  { key: 'schlafqualitaet', label: 'Schlafqualität', type: 'lookup/radio', options: [{ key: 'sehr_gut', label: 'Sehr gut' }, { key: 'gut', label: 'Gut' }, { key: 'mittel', label: 'Mittel' }, { key: 'schlecht', label: 'Schlecht' }, { key: 'sehr_schlecht', label: 'Sehr schlecht' }] },
  { key: 'schlafunterbrechungen', label: 'Anzahl Schlafunterbrechungen', type: 'number' },
  { key: 'schlafmittel', label: 'Schlafmittel eingenommen', type: 'bool' },
  { key: 'notizen_schlaf', label: 'Notizen', type: 'string/textarea' },
];
const STIMMUNGWOHLBEFINDEN_FIELDS = [
  { key: 'stimmung_zeitpunkt', label: 'Datum und Uhrzeit', type: 'date/datetimeminute' },
  { key: 'stimmung', label: 'Stimmung', type: 'lookup/radio', options: [{ key: 'sehr_gut', label: 'Sehr gut' }, { key: 'gut', label: 'Gut' }, { key: 'neutral', label: 'Neutral' }, { key: 'schlecht', label: 'Schlecht' }, { key: 'sehr_schlecht', label: 'Sehr schlecht' }] },
  { key: 'energielevel', label: 'Energielevel', type: 'lookup/radio', options: [{ key: 'sehr_hoch', label: 'Sehr hoch' }, { key: 'hoch', label: 'Hoch' }, { key: 'mittel', label: 'Mittel' }, { key: 'niedrig', label: 'Niedrig' }, { key: 'sehr_niedrig', label: 'Sehr niedrig' }] },
  { key: 'stresslevel', label: 'Stresslevel', type: 'lookup/radio', options: [{ key: 'kein', label: 'Kein Stress' }, { key: 'gering', label: 'Gering' }, { key: 'mittel', label: 'Mittel' }, { key: 'hoch', label: 'Hoch' }, { key: 'sehr_hoch', label: 'Sehr hoch' }] },
  { key: 'symptome', label: 'Symptome', type: 'multiplelookup/checkbox', options: [{ key: 'kopfschmerzen', label: 'Kopfschmerzen' }, { key: 'muedigkeit', label: 'Müdigkeit' }, { key: 'rueckenschmerzen', label: 'Rückenschmerzen' }, { key: 'uebelkeit', label: 'Übelkeit' }, { key: 'schwindel', label: 'Schwindel' }, { key: 'husten', label: 'Husten' }, { key: 'schnupfen', label: 'Schnupfen' }, { key: 'bauchschmerzen', label: 'Bauchschmerzen' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'medikamente', label: 'Eingenommene Medikamente', type: 'string/text' },
  { key: 'notizen_stimmung', label: 'Notizen', type: 'string/textarea' },
];

const ENTITY_TABS = [
  { key: 'koerpermesswerte', label: 'Körpermesswerte', pascal: 'Koerpermesswerte' },
  { key: 'aktivitaeten', label: 'Aktivitäten', pascal: 'Aktivitaeten' },
  { key: 'ernaehrung', label: 'Ernährung', pascal: 'Ernaehrung' },
  { key: 'schlafprotokoll', label: 'Schlafprotokoll', pascal: 'Schlafprotokoll' },
  { key: 'stimmung_&_wohlbefinden', label: 'Stimmung & Wohlbefinden', pascal: 'StimmungWohlbefinden' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('koerpermesswerte');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    'koerpermesswerte': new Set(),
    'aktivitaeten': new Set(),
    'ernaehrung': new Set(),
    'schlafprotokoll': new Set(),
    'stimmung_&_wohlbefinden': new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    'koerpermesswerte': {},
    'aktivitaeten': {},
    'ernaehrung': {},
    'schlafprotokoll': {},
    'stimmung_&_wohlbefinden': {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'koerpermesswerte': return (data as any).koerpermesswerte as Koerpermesswerte[] ?? [];
      case 'aktivitaeten': return (data as any).aktivitaeten as Aktivitaeten[] ?? [];
      case 'ernaehrung': return (data as any).ernaehrung as Ernaehrung[] ?? [];
      case 'schlafprotokoll': return (data as any).schlafprotokoll as Schlafprotokoll[] ?? [];
      case 'stimmung_&_wohlbefinden': return (data as any).stimmungWohlbefinden as StimmungWohlbefinden[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'koerpermesswerte': return KOERPERMESSWERTE_FIELDS;
      case 'aktivitaeten': return AKTIVITAETEN_FIELDS;
      case 'ernaehrung': return ERNAEHRUNG_FIELDS;
      case 'schlafprotokoll': return SCHLAFPROTOKOLL_FIELDS;
      case 'stimmung_&_wohlbefinden': return STIMMUNGWOHLBEFINDEN_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'koerpermesswerte': return {
        create: (fields: any) => LivingAppsService.createKoerpermesswerteEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateKoerpermesswerteEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteKoerpermesswerteEntry(id),
      };
      case 'aktivitaeten': return {
        create: (fields: any) => LivingAppsService.createAktivitaetenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateAktivitaetenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteAktivitaetenEntry(id),
      };
      case 'ernaehrung': return {
        create: (fields: any) => LivingAppsService.createErnaehrungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateErnaehrungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteErnaehrungEntry(id),
      };
      case 'schlafprotokoll': return {
        create: (fields: any) => LivingAppsService.createSchlafprotokollEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateSchlafprotokollEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteSchlafprotokollEntry(id),
      };
      case 'stimmung_&_wohlbefinden': return {
        create: (fields: any) => LivingAppsService.createStimmungWohlbefindenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateStimmungWohlbefindenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteStimmungWohlbefindenEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <IconFilter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <IconPencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <IconCopy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <IconTrash className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <IconX className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.includes('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.includes('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 'koerpermesswerte' || dialogState?.entity === 'koerpermesswerte') && (
        <KoerpermesswerteDialog
          open={createEntity === 'koerpermesswerte' || dialogState?.entity === 'koerpermesswerte'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'koerpermesswerte' ? handleUpdate : (fields: any) => handleCreate('koerpermesswerte', fields)}
          defaultValues={dialogState?.entity === 'koerpermesswerte' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Koerpermesswerte']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Koerpermesswerte']}
        />
      )}
      {(createEntity === 'aktivitaeten' || dialogState?.entity === 'aktivitaeten') && (
        <AktivitaetenDialog
          open={createEntity === 'aktivitaeten' || dialogState?.entity === 'aktivitaeten'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'aktivitaeten' ? handleUpdate : (fields: any) => handleCreate('aktivitaeten', fields)}
          defaultValues={dialogState?.entity === 'aktivitaeten' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Aktivitaeten']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Aktivitaeten']}
        />
      )}
      {(createEntity === 'ernaehrung' || dialogState?.entity === 'ernaehrung') && (
        <ErnaehrungDialog
          open={createEntity === 'ernaehrung' || dialogState?.entity === 'ernaehrung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'ernaehrung' ? handleUpdate : (fields: any) => handleCreate('ernaehrung', fields)}
          defaultValues={dialogState?.entity === 'ernaehrung' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Ernaehrung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Ernaehrung']}
        />
      )}
      {(createEntity === 'schlafprotokoll' || dialogState?.entity === 'schlafprotokoll') && (
        <SchlafprotokollDialog
          open={createEntity === 'schlafprotokoll' || dialogState?.entity === 'schlafprotokoll'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'schlafprotokoll' ? handleUpdate : (fields: any) => handleCreate('schlafprotokoll', fields)}
          defaultValues={dialogState?.entity === 'schlafprotokoll' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Schlafprotokoll']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Schlafprotokoll']}
        />
      )}
      {(createEntity === 'stimmung_&_wohlbefinden' || dialogState?.entity === 'stimmung_&_wohlbefinden') && (
        <StimmungWohlbefindenDialog
          open={createEntity === 'stimmung_&_wohlbefinden' || dialogState?.entity === 'stimmung_&_wohlbefinden'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'stimmung_&_wohlbefinden' ? handleUpdate : (fields: any) => handleCreate('stimmung_&_wohlbefinden', fields)}
          defaultValues={dialogState?.entity === 'stimmung_&_wohlbefinden' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['StimmungWohlbefinden']}
          enablePhotoLocation={AI_PHOTO_LOCATION['StimmungWohlbefinden']}
        />
      )}
      {viewState?.entity === 'koerpermesswerte' && (
        <KoerpermesswerteViewDialog
          open={viewState?.entity === 'koerpermesswerte'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'koerpermesswerte', record: r }); }}
        />
      )}
      {viewState?.entity === 'aktivitaeten' && (
        <AktivitaetenViewDialog
          open={viewState?.entity === 'aktivitaeten'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'aktivitaeten', record: r }); }}
        />
      )}
      {viewState?.entity === 'ernaehrung' && (
        <ErnaehrungViewDialog
          open={viewState?.entity === 'ernaehrung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'ernaehrung', record: r }); }}
        />
      )}
      {viewState?.entity === 'schlafprotokoll' && (
        <SchlafprotokollViewDialog
          open={viewState?.entity === 'schlafprotokoll'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'schlafprotokoll', record: r }); }}
        />
      )}
      {viewState?.entity === 'stimmung_&_wohlbefinden' && (
        <StimmungWohlbefindenViewDialog
          open={viewState?.entity === 'stimmung_&_wohlbefinden'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'stimmung_&_wohlbefinden', record: r }); }}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}