import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutList, GitCompareArrows, SlidersHorizontal, Settings, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useCriteriaStore } from '../store/useCriteriaStore';

const NAV_ITEMS = [
  { to: '/',         label: '求人一覧', icon: LayoutList,          end: true },
  { to: '/compare',  label: '比較',     icon: GitCompareArrows,    end: false },
  { to: '/criteria', label: '評価軸',   icon: SlidersHorizontal,   end: false },
  { to: '/settings', label: '設定',     icon: Settings,            end: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const initDefaults = useCriteriaStore((s) => s.initDefaults);

  useEffect(() => {
    initDefaults();
  }, [initDefaults]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200">
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
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/jobs/new')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
            求人を追加
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
