import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MigrationDialog from './components/MigrationDialog';
import { pullAll } from './lib/sync';
import {
  needsMigration,
  readLocalSnapshot,
  isMigrationFlagSet,
} from './lib/migration';
import { useJobStore } from './store/useJobStore';
import type { Job, Criteria, Score } from './types';
import './index.css';

function SyncIndicator() {
  return (
    <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm text-xs text-gray-500">
      <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      同期中…
    </div>
  );
}

function OfflineBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3 text-sm text-amber-800">
      <span>オフラインのため、前回のデータを表示しています</span>
      <button
        onClick={onClose}
        aria-label="閉じる"
        className="shrink-0 text-amber-600 hover:text-amber-800 font-medium"
      >
        閉じる
      </button>
    </div>
  );
}

function AppShell() {
  const { session, loading } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [pullFailed, setPullFailed] = useState(false);
  const [migrationData, setMigrationData] = useState<{
    jobs: Job[]; criteria: Criteria[]; scores: Score[];
  } | null>(null);

  useEffect(() => {
    if (!session) return;

    // pullAll が localStorage を上書きする前にスナップショットを取る
    const snapshot = readLocalSnapshot();
    const flagSet = isMigrationFlagSet();

    setSyncing(true);
    pullAll()
      .then(() => {
        setPullFailed(false);
        const jobsAfterPull = useJobStore.getState().jobs;
        if (needsMigration({
          supabaseEmpty: jobsAfterPull.length === 0,
          hasLocalData: snapshot.jobs.length > 0,
          flagSet,
        })) {
          setMigrationData(snapshot);
        }
      })
      .catch((err) => {
        console.error(err);
        setPullFailed(true);
      })
      .finally(() => setSyncing(false));
  }, [session]);

  if (loading) return null;
  if (!session) return <LoginPage />;
  return (
    <>
      {syncing && <SyncIndicator />}
      {pullFailed && !syncing && <OfflineBanner onClose={() => setPullFailed(false)} />}
      {migrationData && (
        <MigrationDialog
          jobs={migrationData.jobs}
          criteria={migrationData.criteria}
          scores={migrationData.scores}
          onComplete={() => setMigrationData(null)}
        />
      )}
      <RouterProvider router={router} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </StrictMode>
);
