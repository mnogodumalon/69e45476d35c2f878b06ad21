import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Koerpermesswerte, Aktivitaeten, Ernaehrung, Schlafprotokoll, StimmungWohlbefinden } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [koerpermesswerte, setKoerpermesswerte] = useState<Koerpermesswerte[]>([]);
  const [aktivitaeten, setAktivitaeten] = useState<Aktivitaeten[]>([]);
  const [ernaehrung, setErnaehrung] = useState<Ernaehrung[]>([]);
  const [schlafprotokoll, setSchlafprotokoll] = useState<Schlafprotokoll[]>([]);
  const [stimmungWohlbefinden, setStimmungWohlbefinden] = useState<StimmungWohlbefinden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [koerpermesswerteData, aktivitaetenData, ernaehrungData, schlafprotokollData, stimmungWohlbefindenData] = await Promise.all([
        LivingAppsService.getKoerpermesswerte(),
        LivingAppsService.getAktivitaeten(),
        LivingAppsService.getErnaehrung(),
        LivingAppsService.getSchlafprotokoll(),
        LivingAppsService.getStimmungWohlbefinden(),
      ]);
      setKoerpermesswerte(koerpermesswerteData);
      setAktivitaeten(aktivitaetenData);
      setErnaehrung(ernaehrungData);
      setSchlafprotokoll(schlafprotokollData);
      setStimmungWohlbefinden(stimmungWohlbefindenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [koerpermesswerteData, aktivitaetenData, ernaehrungData, schlafprotokollData, stimmungWohlbefindenData] = await Promise.all([
          LivingAppsService.getKoerpermesswerte(),
          LivingAppsService.getAktivitaeten(),
          LivingAppsService.getErnaehrung(),
          LivingAppsService.getSchlafprotokoll(),
          LivingAppsService.getStimmungWohlbefinden(),
        ]);
        setKoerpermesswerte(koerpermesswerteData);
        setAktivitaeten(aktivitaetenData);
        setErnaehrung(ernaehrungData);
        setSchlafprotokoll(schlafprotokollData);
        setStimmungWohlbefinden(stimmungWohlbefindenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { koerpermesswerte, setKoerpermesswerte, aktivitaeten, setAktivitaeten, ernaehrung, setErnaehrung, schlafprotokoll, setSchlafprotokoll, stimmungWohlbefinden, setStimmungWohlbefinden, loading, error, fetchAll };
}