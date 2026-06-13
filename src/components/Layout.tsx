import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutList, GitCompareArrows, SlidersHorizontal, Settings, Plus, LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { useCriteriaStore } from '../store/useCriteriaStore';
import { useCompareStore } from '../store/useCompareStore';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/',         label: '求人一覧', icon: LayoutList,          end: true },
  { to: '/compare',  label: '比較',     icon: GitCompareArrows,    end: false },
  { to: '/criteria', label: '評価軸',   icon: SlidersHorizontal,   end: false },
  { to: '/settings', label: '設定',     icon: Settings,            end: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const initDefaults = useCriteriaStore((s) => s.initDefaults);
  const { signOut } = useAuth();

  useEffect(() => {
    initDefaults();
  }, [initDefaults]);

  const { selectedIds } = useCompareStore();

  const isFormRoute =
    location.pathname === '/jobs/new' ||
    /^\/jobs\/[^/]+\/edit$/.test(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar (desktop only) */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-blue-600 shrink-0" />
          <span className="font-bold text-gray-900 text-base tracking-tight">転職比較</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                ].join(' ')
              }
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Add job button */}
        <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={() => navigate('/jobs/new')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            求人を追加
          </button>
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-sm transition-colors"
          >
            <LogOut size={15} strokeWidth={1.75} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-[83px] md:pb-0">
        <Outlet />
      </main>

      {/* Bottom tab bar (mobile only) */}
      <nav
        aria-label="ボトムナビゲーション"
        className="fixed bottom-0 left-0 right-0 h-[83px] bg-white border-t border-gray-200 flex items-start md:hidden z-50"
      >
        <div className="flex w-full pt-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex-1 flex flex-col items-center gap-0.5 py-1 text-xs font-medium transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* FAB: 求人を追加（モバイルのみ・フォームルートおよびCompareBar表示中は非表示） */}
      {!isFormRoute && selectedIds.length === 0 && (
        <button
          aria-label="求人を追加"
          onClick={() => navigate('/jobs/new')}
          className="fixed bottom-[95px] right-4 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg md:hidden z-50 transition-colors"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
