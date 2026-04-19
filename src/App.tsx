import { HashRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import KoerpermesswertePage from '@/pages/KoerpermesswertePage';
import AktivitaetenPage from '@/pages/AktivitaetenPage';
import ErnaehrungPage from '@/pages/ErnaehrungPage';
import SchlafprotokollPage from '@/pages/SchlafprotokollPage';
import StimmungWohlbefindenPage from '@/pages/StimmungWohlbefindenPage';
// <custom:imports>
// </custom:imports>

const TaeglichesCheckinPage = lazy(() => import('@/pages/intents/TaeglichesCheckinPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="koerpermesswerte" element={<KoerpermesswertePage />} />
              <Route path="aktivitaeten" element={<AktivitaetenPage />} />
              <Route path="ernaehrung" element={<ErnaehrungPage />} />
              <Route path="schlafprotokoll" element={<SchlafprotokollPage />} />
              <Route path="stimmung-&-wohlbefinden" element={<StimmungWohlbefindenPage />} />
              <Route path="admin" element={<AdminPage />} />
              {/* <custom:routes> */}
              {/* </custom:routes> */}
              <Route path="intents/taegliches-checkin" element={<Suspense fallback={null}><TaeglichesCheckinPage /></Suspense>} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
