import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { incomeApi, expenseApi, budgetApi, debtApi, todoApi } from '../api';
import { formatLKR, formatDate, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Header from '../components/Header';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [incRes, expRes, budRes, debtRes, todoRes] = await Promise.all([
          incomeApi.getAll({ limit: 5 }),
          expenseApi.getAll({ limit: 5 }),
          budgetApi.get(),
          debtApi.getAll(),
          todoApi.getAll({ filter: 'Pending' }),
        ]);
        setData({
          income: incRes.data,
          expenses: expRes.data,
          budget: budRes.data,
          debts: debtRes.data,
          todos: todoRes.data,
        });
      } catch {
        // errors are handled per-section
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  const totalIncome = data?.income?.totalAmount || 0;
  const totalExpense = data?.expenses?.totalAmount || 0;
  const balance = totalIncome - totalExpense;
  const recentTransactions = [
    ...(data?.expenses?.expenses || []).map((e) => ({ ...e, _type: 'expense' })),
    ...(data?.income?.incomes || []).map((i) => ({ ...i, _type: 'income' })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const budgetInfo = data?.budget;
  const week = budgetInfo?.week;
  const budgetTotal = budgetInfo?.budget?.totalBudget || 3000;
  const budgetSpent = week?.totalSpent || 0;
  const budgetPct = Math.min((budgetSpent / budgetTotal) * 100, 100);
  const isOver = budgetSpent > budgetTotal;
  const isWarn = !isOver && budgetPct >= 80;

  const chartData = (data?.expenses?.byCategory || []).map((c) => ({
    name: c._id,
    value: c.total,
  }));

  const pendingTodos = (data?.todos || []).slice(0, 3);
  const debtSummary = data?.debts?.summary;

  return (
    <>
      <Header title="Dashboard" />
      <div className="page">
        {/* Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 p-5 mb-4 shadow-xl shadow-sky-900/30 text-white">
          <p className="text-sky-100 text-sm font-medium mb-1">Total Balance</p>
          <p className={`text-3xl font-bold mb-3 ${balance < 0 ? 'text-red-300' : ''}`}>{formatLKR(balance)}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-sky-100 text-xs mb-0.5">Total Income</p>
              <p className="font-semibold text-sm">+{formatLKR(totalIncome)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-sky-100 text-xs mb-0.5">Total Expenses</p>
              <p className="font-semibold text-sm">-{formatLKR(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        {budgetInfo?.linked && (
          <div className="card mb-4" onClick={() => navigate('/budget')} style={{ cursor: 'pointer' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">📊 This Week's Budget</h3>
              <span className={`badge ${isOver ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : isWarn ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'}`}>
                {isOver ? '⚠️ Over budget' : isWarn ? '⚡ 80%+' : `${budgetPct.toFixed(0)}%`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Spent: {formatLKR(budgetSpent)}</span>
              <span>Budget: {formatLKR(budgetTotal)}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : isWarn ? 'bg-amber-400' : 'bg-sky-500'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            {isOver && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium">
                Over by {formatLKR(budgetSpent - budgetTotal)}
              </p>
            )}
          </div>
        )}

        {/* Expense Chart */}
        {chartData.length > 0 && (
          <div className="card mb-4">
            <h3 className="section-title">Expenses by Category</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={28} outerRadius={56} dataKey="value" strokeWidth={0}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatLKR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {chartData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[c.name] || '#6b7280' }}
                      />
                      <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{formatLKR(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title mb-0">Recent Transactions</h3>
            <button onClick={() => navigate('/expenses')} className="text-xs text-sky-600 dark:text-sky-400 font-medium">See all</button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => (
                <div key={t._id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${t._type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {t._type === 'income' ? '💰' : CATEGORY_ICONS[t.category] || '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {t._type === 'income' ? t.source : t.category}
                      {t.type === 'Shared' && <span className="ml-1 text-xs text-sky-500">Shared</span>}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(t.date)}</p>
                  </div>
                  <span className={`font-semibold text-sm ${t._type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {t._type === 'income' ? '+' : '-'}{formatLKR(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Debts Summary */}
          <div className="card cursor-pointer" onClick={() => navigate('/debts')}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">🤝 Debts</h3>
            <div className="space-y-1">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">I Owe</p>
                <p className="font-bold text-red-500 text-sm">{formatLKR(debtSummary?.iOwe || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Owed to Me</p>
                <p className="font-bold text-emerald-500 text-sm">{formatLKR(debtSummary?.owedToMe || 0)}</p>
              </div>
            </div>
          </div>

          {/* Todos Summary */}
          <div className="card cursor-pointer" onClick={() => navigate('/todos')}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">✅ Todos</h3>
            {pendingTodos.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">All done!</p>
            ) : (
              <div className="space-y-1.5">
                {pendingTodos.map((t) => (
                  <div key={t._id} className="flex items-start gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${t.priority === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : t.priority === 'Medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                      {t.priority[0]}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">{t.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
