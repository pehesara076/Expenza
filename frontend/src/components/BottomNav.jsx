import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', icon: '⊞', label: 'Dashboard' },
  { path: '/income', icon: '💰', label: 'Income' },
  { path: '/expenses', icon: '💳', label: 'Expenses' },
  { path: '/budget', icon: '📊', label: 'Budget' },
  { path: '/debts', icon: '🤝', label: 'Debts' },
  { path: '/todos', icon: '✅', label: 'Todos' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-700 bottom-nav">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              id={`nav-${tab.label.toLowerCase()}`}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 flex-1 transition-all duration-200 ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
