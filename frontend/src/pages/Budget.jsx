import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { budgetApi } from '../api';
import { formatLKR, formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Budget() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsModal, setSettingsModal] = useState(false);
  const [form, setForm] = useState({ totalBudget: 3000, myShare: 1500, partnerShare: 1500, weekStartDay: 1 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await budgetApi.get();
      setData(d);
      if (d.linked && d.budget) {
        const uid = user._id?.toString();
        const myShare = d.budget.shares?.find((s) => s.userId?.toString() === uid)?.amount || 1500;
        const partnerShare = d.budget.shares?.find((s) => s.userId?.toString() !== uid)?.amount || 1500;
        setForm({ totalBudget: d.budget.totalBudget, myShare, partnerShare, weekStartDay: d.budget.weekStartDay });
      }
    } catch {
      toast.error('Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveBudget = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const uid = user._id?.toString();
      const sharesArr = data.budget.shares.map((s) => ({
        userId: s.userId,
        amount: s.userId?.toString() === uid ? Number(form.myShare) : Number(form.partnerShare),
      }));
      await budgetApi.update({ totalBudget: Number(form.totalBudget), shares: sharesArr, weekStartDay: Number(form.weekStartDay) });
      toast.success('Budget settings saved');
      setSettingsModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Header title="Budget" /><Spinner size="lg" className="min-h-[60vh]" /></>;
  if (!data?.linked) {
    return (
      <>
        <Header title="Budget" />
        <div className="page">
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🔗</div>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">No Partner Linked</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Link with your partner in Settings to access the shared budget.</p>
          </div>
        </div>
      </>
    );
  }

  const { budget, week, history } = data;
  const total = budget.totalBudget;
  const spent = week.totalSpent;
  const remaining = total - spent;
  const pct = Math.min((spent / total) * 100, 100);
  const isOver = spent > total;
  const isWarn = !isOver && pct >= 80;

  const myId = user._id?.toString();
  const myShare = budget.shares?.find((s) => s.userId?.toString() === myId)?.amount || 0;
  const partnerShare = budget.shares?.find((s) => s.userId?.toString() !== myId)?.amount || 0;
  const mySpent = week.spentByUser;
  const partnerSpent = week.spentByPartner;

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const historyChartData = [...history].reverse().map((h, i) => ({
    week: `W${i + 1}`,
    spent: h.spent,
    budget: h.budget,
  }));

  return (
    <>
      <Header title="Budget" />
      <div className="page">
        {/* Main Budget Card */}
        <div className={`rounded-2xl p-5 mb-4 text-white shadow-xl ${isOver ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/30' : isWarn ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-900/30' : 'bg-gradient-to-br from-sky-600 to-sky-800 shadow-sky-900/30'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-white/70 text-sm">This Week's Budget</p>
              <p className="text-2xl font-bold">{formatLKR(total)}</p>
            </div>
            <button
              id="budget-settings-btn"
              onClick={() => setSettingsModal(true)}
              className="bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors"
            >
              ⚙ Edit
            </button>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-300' : isWarn ? 'bg-amber-200' : 'bg-white'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Spent: {formatLKR(spent)}</span>
            {isOver ? (
              <span className="font-bold text-red-200">⚠ Over by {formatLKR(spent - total)}</span>
            ) : isWarn ? (
              <span className="font-bold text-amber-200">⚡ 80%+ used</span>
            ) : (
              <span className="text-white/80">Left: {formatLKR(remaining)}</span>
            )}
          </div>
        </div>

        {/* Per-person breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">My Spending</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg">{formatLKR(mySpent)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">of {formatLKR(myShare)} share</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2">
              <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${Math.min((mySpent / myShare) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="card">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Partner's Spending</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg">{formatLKR(partnerSpent)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">of {formatLKR(partnerShare)} share</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min((partnerSpent / partnerShare) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* History Chart */}
        {historyChartData.length > 0 && (
          <div className="card mb-4">
            <h3 className="section-title">Previous Weeks</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatLKR(v)} />
                  <Bar dataKey="budget" name="Budget" fill="#0ea5e9" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>{formatDate(h.weekStart)} – {formatDate(h.weekEnd)}</span>
                  <span className={`font-medium ${h.spent > h.budget ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {formatLKR(h.spent)} / {formatLKR(h.budget)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="Budget Settings">
        <form onSubmit={saveBudget} className="space-y-4">
          <div>
            <label className="label">Total Weekly Budget (LKR)</label>
            <input id="budget-total-input" type="number" min="0" className="input" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })} />
          </div>
          <div>
            <label className="label">My Share (LKR)</label>
            <input id="budget-my-share" type="number" min="0" className="input" value={form.myShare} onChange={(e) => setForm({ ...form, myShare: e.target.value })} />
          </div>
          <div>
            <label className="label">Partner's Share (LKR)</label>
            <input id="budget-partner-share" type="number" min="0" className="input" value={form.partnerShare} onChange={(e) => setForm({ ...form, partnerShare: e.target.value })} />
          </div>
          <div>
            <label className="label">Week Starts On</label>
            <select id="budget-week-start" className="input" value={form.weekStartDay} onChange={(e) => setForm({ ...form, weekStartDay: e.target.value })}>
              {WEEK_DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setSettingsModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button id="budget-save-btn" type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
