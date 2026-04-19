import { useDashboardData } from '@/hooks/useDashboardData';
import type { Koerpermesswerte, Aktivitaeten, Ernaehrung, Schlafprotokoll, StimmungWohlbefinden } from '@/types/app';
// @ts-ignore — available imports for dashboard implementation
import { LivingAppsService } from '@/services/livingAppsService';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconScale, IconRun, IconSalad, IconMoon, IconMoodSmile, IconDroplet, IconHeart, IconFlame, IconClock, IconActivity, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { KoerpermesswerteDialog } from '@/components/dialogs/KoerpermesswerteDialog';
import { AktivitaetenDialog } from '@/components/dialogs/AktivitaetenDialog';
import { ErnaehrungDialog } from '@/components/dialogs/ErnaehrungDialog';
import { SchlafprotokollDialog } from '@/components/dialogs/SchlafprotokollDialog';
import { StimmungWohlbefindenDialog } from '@/components/dialogs/StimmungWohlbefindenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, parseISO, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

const APPGROUP_ID = '69e45476d35c2f878b06ad21';
const REPAIR_ENDPOINT = '/claude/build/repair';

type DialogType = 'koerper' | 'aktivitaet' | 'ernaehrung' | 'schlaf' | 'stimmung' | null;

function formatRelative(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr.slice(0, 10));
    if (isToday(d)) return 'Heute';
    if (isYesterday(d)) return 'Gestern';
    return format(d, 'd. MMM', { locale: de });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function getMoodColor(key?: string): string {
  const map: Record<string, string> = {
    sehr_gut: 'text-emerald-500', gut: 'text-green-500', neutral: 'text-yellow-500',
    schlecht: 'text-orange-500', sehr_schlecht: 'text-red-500',
  };
  return map[key ?? ''] ?? 'text-muted-foreground';
}

function getMoodEmoji(key?: string): string {
  const map: Record<string, string> = {
    sehr_gut: '😄', gut: '🙂', neutral: '😐', schlecht: '😕', sehr_schlecht: '😞',
  };
  return map[key ?? ''] ?? '—';
}

function getQualityColor(key?: string): string {
  const map: Record<string, string> = {
    sehr_gut: 'bg-emerald-500/15 text-emerald-700', gut: 'bg-green-500/15 text-green-700',
    mittel: 'bg-yellow-500/15 text-yellow-700', schlecht: 'bg-orange-500/15 text-orange-700',
    sehr_schlecht: 'bg-red-500/15 text-red-700',
  };
  return map[key ?? ''] ?? 'bg-muted text-muted-foreground';
}

export default function DashboardOverview() {
  const {
    koerpermesswerte, aktivitaeten, ernaehrung, schlafprotokoll, stimmungWohlbefinden,
    loading, error, fetchAll,
  } = useDashboardData();

  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [editKoerper, setEditKoerper] = useState<Koerpermesswerte | null>(null);
  const [editAktivitaet, setEditAktivitaet] = useState<Aktivitaeten | null>(null);
  const [editErnaehrung, setEditErnaehrung] = useState<Ernaehrung | null>(null);
  const [editSchlaf, setEditSchlaf] = useState<Schlafprotokoll | null>(null);
  const [editStimmung, setEditStimmung] = useState<StimmungWohlbefinden | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'heute' | 'trends'>('heute');

  // Sort and compute "latest" entries
  const latestKoerper = useMemo(() => {
    return [...koerpermesswerte]
      .sort((a, b) => (b.fields.messung_zeitpunkt ?? '').localeCompare(a.fields.messung_zeitpunkt ?? ''))
      .at(0) ?? null;
  }, [koerpermesswerte]);

  const todayAktivitaeten = useMemo(() => {
    return aktivitaeten.filter(a => {
      const d = a.fields.aktivitaet_zeitpunkt;
      return d && isToday(parseISO(d.slice(0, 10)));
    });
  }, [aktivitaeten]);

  const todayErnaehrung = useMemo(() => {
    return ernaehrung.filter(e => {
      const d = e.fields.mahlzeit_zeitpunkt;
      return d && isToday(parseISO(d.slice(0, 10)));
    });
  }, [ernaehrung]);

  const latestSchlaf = useMemo(() => {
    return [...schlafprotokoll]
      .sort((a, b) => (b.fields.schlaf_datum ?? '').localeCompare(a.fields.schlaf_datum ?? ''))
      .at(0) ?? null;
  }, [schlafprotokoll]);

  const latestStimmung = useMemo(() => {
    return [...stimmungWohlbefinden]
      .sort((a, b) => (b.fields.stimmung_zeitpunkt ?? '').localeCompare(a.fields.stimmung_zeitpunkt ?? ''))
      .at(0) ?? null;
  }, [stimmungWohlbefinden]);

  // Trend data: last 7 days
  const weightTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(startOfDay(new Date()), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = koerpermesswerte
        .filter(k => k.fields.messung_zeitpunkt?.startsWith(dateStr))
        .sort((a, b) => (b.fields.messung_zeitpunkt ?? '').localeCompare(a.fields.messung_zeitpunkt ?? ''))
        .at(0);
      return { day: format(d, 'EEE', { locale: de }), wert: entry?.fields.gewicht_kg ?? null };
    });
    return days;
  }, [koerpermesswerte]);

  const kalorieTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(startOfDay(new Date()), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const total = ernaehrung
        .filter(e => e.fields.mahlzeit_zeitpunkt?.startsWith(dateStr))
        .reduce((sum, e) => sum + (e.fields.kalorien_aufnahme ?? 0), 0);
      return { day: format(d, 'EEE', { locale: de }), kcal: total || null };
    });
  }, [ernaehrung]);

  const schlafTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(startOfDay(new Date()), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = schlafprotokoll.find(s => s.fields.schlaf_datum === dateStr);
      return { day: format(d, 'EEE', { locale: de }), std: entry?.fields.schlafdauer_stunden ?? null };
    });
  }, [schlafprotokoll]);

  // KPIs
  const totalKalorien = todayErnaehrung.reduce((s, e) => s + (e.fields.kalorien_aufnahme ?? 0), 0);
  const totalAktivMin = todayAktivitaeten.reduce((s, a) => s + (a.fields.dauer_minuten ?? 0), 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'koerper') await LivingAppsService.deleteKoerpermesswerteEntry(deleteTarget.id);
      if (deleteTarget.type === 'aktivitaet') await LivingAppsService.deleteAktivitaetenEntry(deleteTarget.id);
      if (deleteTarget.type === 'ernaehrung') await LivingAppsService.deleteErnaehrungEntry(deleteTarget.id);
      if (deleteTarget.type === 'schlaf') await LivingAppsService.deleteSchlafprotokollEntry(deleteTarget.id);
      if (deleteTarget.type === 'stimmung') await LivingAppsService.deleteStimmungWohlbefindenEntry(deleteTarget.id);
      fetchAll();
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6 pb-8">
      {/* Intent Navigation */}
      <a href="#/intents/taegliches-checkin" className="block bg-card border border-border border-l-4 border-l-primary rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <IconActivity size={20} className="text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">Täglicher Gesundheits-Check-in</p>
            <p className="text-sm text-muted-foreground truncate">Körper · Aktivität · Ernährung · Schlaf · Stimmung in einem Schritt erfassen</p>
          </div>
          <IconChevronRight size={18} className="text-muted-foreground shrink-0" />
        </div>
      </a>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meine Gesundheit</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => { setEditAktivitaet(null); setOpenDialog('aktivitaet'); }}>
            <IconRun size={14} className="mr-1.5 shrink-0" />Aktivität
          </Button>
          <Button size="sm" onClick={() => { setEditKoerper(null); setOpenDialog('koerper'); }}>
            <IconPlus size={14} className="mr-1.5 shrink-0" />Messung
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted/60 rounded-xl p-1 w-fit">
        {(['heute', 'trends'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'heute' ? 'Heute' : '7-Tage-Trends'}
          </button>
        ))}
      </div>

      {activeTab === 'heute' ? (
        <div className="space-y-5">
          {/* Quick KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              icon={<IconScale size={18} className="text-primary" />}
              label="Gewicht"
              value={latestKoerper?.fields.gewicht_kg ? `${latestKoerper.fields.gewicht_kg} kg` : '—'}
              sub={formatRelative(latestKoerper?.fields.messung_zeitpunkt)}
              color="bg-primary/8"
            />
            <KpiCard
              icon={<IconFlame size={18} className="text-orange-500" />}
              label="Kalorien heute"
              value={totalKalorien > 0 ? `${totalKalorien} kcal` : '—'}
              sub={`${todayErnaehrung.length} Mahlzeiten`}
              color="bg-orange-500/8"
            />
            <KpiCard
              icon={<IconClock size={18} className="text-blue-500" />}
              label="Schlaf"
              value={latestSchlaf?.fields.schlafdauer_stunden ? `${latestSchlaf.fields.schlafdauer_stunden}h` : '—'}
              sub={latestSchlaf?.fields.schlafqualitaet?.label ?? '—'}
              color="bg-blue-500/8"
            />
            <KpiCard
              icon={<IconActivity size={18} className="text-emerald-500" />}
              label="Aktiv heute"
              value={totalAktivMin > 0 ? `${totalAktivMin} min` : '—'}
              sub={`${todayAktivitaeten.length} Einheiten`}
              color="bg-emerald-500/8"
            />
          </div>

          {/* Main sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Körpermesswerte */}
            <SectionCard
              title="Körpermesswerte"
              icon={<IconScale size={16} className="text-primary shrink-0" />}
              onAdd={() => { setEditKoerper(null); setOpenDialog('koerper'); }}
            >
              {koerpermesswerte.length === 0 ? (
                <EmptyState text="Noch keine Messungen erfasst" />
              ) : (
                <div className="space-y-2">
                  {[...koerpermesswerte]
                    .sort((a, b) => (b.fields.messung_zeitpunkt ?? '').localeCompare(a.fields.messung_zeitpunkt ?? ''))
                    .slice(0, 3)
                    .map(k => (
                      <EntryRow
                        key={k.record_id}
                        left={
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {k.fields.gewicht_kg ? `${k.fields.gewicht_kg} kg` : '—'}
                              {k.fields.bmi ? <span className="text-muted-foreground font-normal ml-2">BMI {k.fields.bmi}</span> : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(k.fields.messung_zeitpunkt)}
                              {k.fields.blutdruck_systolisch && k.fields.blutdruck_diastolisch
                                ? ` · ${k.fields.blutdruck_systolisch}/${k.fields.blutdruck_diastolisch} mmHg`
                                : ''}
                            </p>
                          </div>
                        }
                        onEdit={() => { setEditKoerper(k); setOpenDialog('koerper'); }}
                        onDelete={() => setDeleteTarget({ id: k.record_id, type: 'koerper' })}
                      />
                    ))}
                </div>
              )}
            </SectionCard>

            {/* Stimmung & Wohlbefinden */}
            <SectionCard
              title="Stimmung & Wohlbefinden"
              icon={<IconMoodSmile size={16} className="text-purple-500 shrink-0" />}
              onAdd={() => { setEditStimmung(null); setOpenDialog('stimmung'); }}
            >
              {stimmungWohlbefinden.length === 0 ? (
                <EmptyState text="Noch keine Einträge" />
              ) : (
                <div className="space-y-2">
                  {[...stimmungWohlbefinden]
                    .sort((a, b) => (b.fields.stimmung_zeitpunkt ?? '').localeCompare(a.fields.stimmung_zeitpunkt ?? ''))
                    .slice(0, 3)
                    .map(s => (
                      <EntryRow
                        key={s.record_id}
                        left={
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="text-xl shrink-0">{getMoodEmoji(s.fields.stimmung?.key)}</span>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${getMoodColor(s.fields.stimmung?.key)}`}>
                                {s.fields.stimmung?.label ?? '—'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {formatRelative(s.fields.stimmung_zeitpunkt)}
                                {s.fields.energielevel ? ` · Energie: ${s.fields.energielevel.label}` : ''}
                              </p>
                            </div>
                          </div>
                        }
                        onEdit={() => { setEditStimmung(s); setOpenDialog('stimmung'); }}
                        onDelete={() => setDeleteTarget({ id: s.record_id, type: 'stimmung' })}
                      />
                    ))}
                </div>
              )}
            </SectionCard>

            {/* Heutige Aktivitäten */}
            <SectionCard
              title="Aktivitäten"
              icon={<IconRun size={16} className="text-emerald-500 shrink-0" />}
              onAdd={() => { setEditAktivitaet(null); setOpenDialog('aktivitaet'); }}
            >
              {aktivitaeten.length === 0 ? (
                <EmptyState text="Noch keine Aktivitäten erfasst" />
              ) : (
                <div className="space-y-2">
                  {[...aktivitaeten]
                    .sort((a, b) => (b.fields.aktivitaet_zeitpunkt ?? '').localeCompare(a.fields.aktivitaet_zeitpunkt ?? ''))
                    .slice(0, 3)
                    .map(a => (
                      <EntryRow
                        key={a.record_id}
                        left={
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium truncate">{a.fields.aktivitaet_typ?.label ?? 'Aktivität'}</p>
                              {a.fields.intensitaet && (
                                <Badge variant="secondary" className="text-xs shrink-0">{a.fields.intensitaet.label}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(a.fields.aktivitaet_zeitpunkt)}
                              {a.fields.dauer_minuten ? ` · ${a.fields.dauer_minuten} min` : ''}
                              {a.fields.distanz_km ? ` · ${a.fields.distanz_km} km` : ''}
                            </p>
                          </div>
                        }
                        onEdit={() => { setEditAktivitaet(a); setOpenDialog('aktivitaet'); }}
                        onDelete={() => setDeleteTarget({ id: a.record_id, type: 'aktivitaet' })}
                      />
                    ))}
                </div>
              )}
            </SectionCard>

            {/* Ernährung heute */}
            <SectionCard
              title="Ernährung"
              icon={<IconSalad size={16} className="text-orange-500 shrink-0" />}
              onAdd={() => { setEditErnaehrung(null); setOpenDialog('ernaehrung'); }}
            >
              {ernaehrung.length === 0 ? (
                <EmptyState text="Noch keine Mahlzeiten erfasst" />
              ) : (
                <div className="space-y-2">
                  {[...ernaehrung]
                    .sort((a, b) => (b.fields.mahlzeit_zeitpunkt ?? '').localeCompare(a.fields.mahlzeit_zeitpunkt ?? ''))
                    .slice(0, 3)
                    .map(e => (
                      <EntryRow
                        key={e.record_id}
                        left={
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium truncate">
                                {e.fields.mahlzeit_beschreibung?.slice(0, 30) ?? e.fields.mahlzeit_typ?.label ?? 'Mahlzeit'}
                                {e.fields.mahlzeit_beschreibung && e.fields.mahlzeit_beschreibung.length > 30 ? '…' : ''}
                              </p>
                              {e.fields.mahlzeit_typ && (
                                <Badge variant="outline" className="text-xs shrink-0">{e.fields.mahlzeit_typ.label}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(e.fields.mahlzeit_zeitpunkt)}
                              {e.fields.kalorien_aufnahme ? ` · ${e.fields.kalorien_aufnahme} kcal` : ''}
                            </p>
                          </div>
                        }
                        onEdit={() => { setEditErnaehrung(e); setOpenDialog('ernaehrung'); }}
                        onDelete={() => setDeleteTarget({ id: e.record_id, type: 'ernaehrung' })}
                      />
                    ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Schlaf — full width */}
          <SectionCard
            title="Schlafprotokoll"
            icon={<IconMoon size={16} className="text-blue-500 shrink-0" />}
            onAdd={() => { setEditSchlaf(null); setOpenDialog('schlaf'); }}
          >
            {schlafprotokoll.length === 0 ? (
              <EmptyState text="Noch keine Schlafdaten erfasst" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[...schlafprotokoll]
                  .sort((a, b) => (b.fields.schlaf_datum ?? '').localeCompare(a.fields.schlaf_datum ?? ''))
                  .slice(0, 6)
                  .map(s => (
                    <div key={s.record_id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <IconMoon size={16} className="text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.fields.schlafdauer_stunden ? `${s.fields.schlafdauer_stunden}h` : '—'}
                            {s.fields.schlafqualitaet && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${getQualityColor(s.fields.schlafqualitaet.key)}`}>
                                {s.fields.schlafqualitaet.label}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{formatRelative(s.fields.schlaf_datum)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditSchlaf(s); setOpenDialog('schlaf'); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors">
                          <IconPencil size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget({ id: s.record_id, type: 'schlaf' })} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : (
        /* Trends Tab */
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TrendChart
              title="Gewichtsverlauf (kg)"
              icon={<IconScale size={14} className="text-primary shrink-0" />}
              data={weightTrend}
              dataKey="wert"
              color="var(--primary)"
              unit=" kg"
              emptyText="Keine Gewichtsdaten der letzten 7 Tage"
            />
            <TrendChart
              title="Kalorien-Aufnahme (kcal)"
              icon={<IconFlame size={14} className="text-orange-500 shrink-0" />}
              data={kalorieTrend}
              dataKey="kcal"
              color="#f97316"
              unit=" kcal"
              emptyText="Keine Ernährungsdaten der letzten 7 Tage"
            />
            <TrendChart
              title="Schlafdauer (Stunden)"
              icon={<IconMoon size={14} className="text-blue-500 shrink-0" />}
              data={schlafTrend}
              dataKey="std"
              color="#3b82f6"
              unit="h"
              emptyText="Keine Schlafdaten der letzten 7 Tage"
            />
            <ActivitySummary aktivitaeten={aktivitaeten} />
          </div>

          {/* Latest vitals overview */}
          {latestKoerper && (
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <IconHeart size={16} className="text-red-500 shrink-0" />
                <h3 className="font-semibold text-sm">Letzte Vitalmessung</h3>
                <span className="text-xs text-muted-foreground ml-1">{formatRelative(latestKoerper.fields.messung_zeitpunkt)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <VitalTile label="Gewicht" value={latestKoerper.fields.gewicht_kg} unit="kg" />
                <VitalTile label="BMI" value={latestKoerper.fields.bmi} unit="" />
                <VitalTile label="Körperfett" value={latestKoerper.fields.koerperfettanteil} unit="%" />
                <VitalTile label="Blutdruck" value={
                  latestKoerper.fields.blutdruck_systolisch && latestKoerper.fields.blutdruck_diastolisch
                    ? `${latestKoerper.fields.blutdruck_systolisch}/${latestKoerper.fields.blutdruck_diastolisch}`
                    : undefined
                } unit="mmHg" />
                <VitalTile label="Puls" value={latestKoerper.fields.puls} unit="bpm" />
              </div>
              {(latestKoerper.fields.blutzucker || latestKoerper.fields.sauerstoffsaettigung || latestKoerper.fields.koerpertemperatur) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t">
                  <VitalTile label="Blutzucker" value={latestKoerper.fields.blutzucker} unit="mg/dL" />
                  <VitalTile label="SpO₂" value={latestKoerper.fields.sauerstoffsaettigung} unit="%" />
                  <VitalTile label="Temperatur" value={latestKoerper.fields.koerpertemperatur} unit="°C" />
                </div>
              )}
            </div>
          )}

          {/* Mood summary */}
          {latestStimmung && (
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <IconMoodSmile size={16} className="text-purple-500 shrink-0" />
                <h3 className="font-semibold text-sm">Letzter Stimmungseintrag</h3>
                <span className="text-xs text-muted-foreground ml-1">{formatRelative(latestStimmung.fields.stimmung_zeitpunkt)}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-xl">
                  <span className="text-2xl">{getMoodEmoji(latestStimmung.fields.stimmung?.key)}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Stimmung</p>
                    <p className={`text-sm font-semibold ${getMoodColor(latestStimmung.fields.stimmung?.key)}`}>{latestStimmung.fields.stimmung?.label ?? '—'}</p>
                  </div>
                </div>
                {latestStimmung.fields.energielevel && (
                  <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-xl">
                    <IconFlame size={20} className="text-orange-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Energie</p>
                      <p className="text-sm font-semibold">{latestStimmung.fields.energielevel.label}</p>
                    </div>
                  </div>
                )}
                {latestStimmung.fields.stresslevel && (
                  <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-xl">
                    <IconActivity size={20} className="text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stress</p>
                      <p className="text-sm font-semibold">{latestStimmung.fields.stresslevel.label}</p>
                    </div>
                  </div>
                )}
                {latestStimmung.fields.symptome && latestStimmung.fields.symptome.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {latestStimmung.fields.symptome.map(s => (
                      <Badge key={s.key} variant="secondary" className="text-xs">{s.label}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <KoerpermesswerteDialog
        open={openDialog === 'koerper'}
        onClose={() => { setOpenDialog(null); setEditKoerper(null); }}
        onSubmit={async (fields) => {
          if (editKoerper) {
            await LivingAppsService.updateKoerpermesswerteEntry(editKoerper.record_id, fields);
          } else {
            await LivingAppsService.createKoerpermesswerteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editKoerper?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Koerpermesswerte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Koerpermesswerte']}
      />

      <AktivitaetenDialog
        open={openDialog === 'aktivitaet'}
        onClose={() => { setOpenDialog(null); setEditAktivitaet(null); }}
        onSubmit={async (fields) => {
          if (editAktivitaet) {
            await LivingAppsService.updateAktivitaetenEntry(editAktivitaet.record_id, fields);
          } else {
            await LivingAppsService.createAktivitaetenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editAktivitaet?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Aktivitaeten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Aktivitaeten']}
      />

      <ErnaehrungDialog
        open={openDialog === 'ernaehrung'}
        onClose={() => { setOpenDialog(null); setEditErnaehrung(null); }}
        onSubmit={async (fields) => {
          if (editErnaehrung) {
            await LivingAppsService.updateErnaehrungEntry(editErnaehrung.record_id, fields);
          } else {
            await LivingAppsService.createErnaehrungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editErnaehrung?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Ernaehrung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Ernaehrung']}
      />

      <SchlafprotokollDialog
        open={openDialog === 'schlaf'}
        onClose={() => { setOpenDialog(null); setEditSchlaf(null); }}
        onSubmit={async (fields) => {
          if (editSchlaf) {
            await LivingAppsService.updateSchlafprotokollEntry(editSchlaf.record_id, fields);
          } else {
            await LivingAppsService.createSchlafprotokollEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editSchlaf?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Schlafprotokoll']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schlafprotokoll']}
      />

      <StimmungWohlbefindenDialog
        open={openDialog === 'stimmung'}
        onClose={() => { setOpenDialog(null); setEditStimmung(null); }}
        onSubmit={async (fields) => {
          if (editStimmung) {
            await LivingAppsService.updateStimmungWohlbefindenEntry(editStimmung.record_id, fields);
          } else {
            await LivingAppsService.createStimmungWohlbefindenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editStimmung?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['StimmungWohlbefinden']}
        enablePhotoLocation={AI_PHOTO_LOCATION['StimmungWohlbefinden']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description="Dieser Eintrag wird unwiderruflich gelöscht."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// --- Sub-components ---

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color} border border-border/30`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground leading-none truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
    </div>
  );
}

function SectionCard({ title, icon, onAdd, children }: { title: string; icon: React.ReactNode; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          <IconPlus size={13} />
          <span>Neu</span>
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function EntryRow({ left, onEdit, onDelete }: { left: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="min-w-0 flex-1">{left}</div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <IconPencil size={13} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
      <IconChevronRight size={28} className="text-muted-foreground/30" stroke={1.5} />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function VitalTile({ label, value, unit }: { label: string; value: number | string | undefined; unit: string }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-base font-bold text-foreground">{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></p>
    </div>
  );
}

function TrendChart({
  title, icon, data, dataKey, color, unit, emptyText
}: {
  title: string; icon: React.ReactNode; data: Record<string, unknown>[]; dataKey: string; color: string; unit: string; emptyText: string;
}) {
  const hasData = data.some(d => d[dataKey] !== null);
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {!hasData ? (
        <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">{emptyText}</div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              formatter={(val: unknown) => [`${val}${unit}`, title]}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} connectNulls dot={{ fill: color, r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ActivitySummary({ aktivitaeten }: { aktivitaeten: Aktivitaeten[] }) {
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(startOfDay(new Date()), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayEntries = aktivitaeten.filter(a => a.fields.aktivitaet_zeitpunkt?.startsWith(dateStr));
      const min = dayEntries.reduce((s, a) => s + (a.fields.dauer_minuten ?? 0), 0);
      return { day: format(d, 'EEE', { locale: de }), min: min || null, count: dayEntries.length };
    });
  }, [aktivitaeten]);

  const hasData = last7.some(d => d.min !== null);
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <IconRun size={14} className="text-emerald-500 shrink-0" />
        <h3 className="text-sm font-semibold">Aktivitätsdauer (min)</h3>
      </div>
      {!hasData ? (
        <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Keine Aktivitäten der letzten 7 Tage</div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={last7} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-act" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              formatter={(val: unknown) => [`${val} min`, 'Dauer']}
            />
            <Area type="monotone" dataKey="min" stroke="#10b981" strokeWidth={2} fill="url(#grad-act)" connectNulls dot={{ fill: '#10b981', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
