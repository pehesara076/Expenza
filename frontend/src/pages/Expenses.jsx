import { useEffect, useState } from 'react';
import { expenseApi } from '../api';
import { formatLKR, formatDate, formatDateInput, CATEGORIES, CATEGORY_ICONS } from '../utils';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const emptyForm = { amount: '', category: 'Food', type: 'Personal', date: '', note: '' };

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState({ totalAmount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', type: '', category: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      const { data } = await expenseApi.getAll(params);
      setExpenses(data.expenses);
      setMeta({ totalAmount: data.totalAmount, total: data.total });
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: formatDateInput(new Date()) });
    setModal(true);
  };

  const openEdit = (exp) => {
    setEditing(exp._id);
    setForm({ amount: exp.amount, category: exp.category, type: exp.type, date: formatDateInput(exp.date), note: exp.note || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await expenseApi.update(editing, form);
        toast.success('Expense updated');
      } else {
        await expenseApi.create(form);
        toast.success('Expense added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.remove(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const myId = user?._id;

  return (
    <>
      <Header title="Expenses" />
      <div className="page">
        {/* Summary */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 p-4 mb-4 text-white shadow-lg shadow-rose-900/30">
          <p className="text-rose-100 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold">{formatLKR(meta.totalAmount)}</p>
          <p className="text-rose-100 text-xs mt-0.5">{meta.total} entries</p>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Filters</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">From</label>
              <input id="exp-filter-from" type="date" className="input text-sm" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div>
              <label className="label">To</label>
              <input id="exp-filter-to" type="date" className="input text-sm" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select id="exp-filter-type" className="input text-sm" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All</option>
                <option>Personal</option>
                <option>Shared</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select id="exp-filter-cat" className="input text-sm" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {(filters.from || filters.to || filters.type || filters.category) && (
            <button onClick={() => setFilters({ from: '', to: '', type: '', category: '' })} className="text-xs text-sky-500 mt-2">Clear filters</button>
          )}
        </div>

        {/* List */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Entries</h2>
          <button id="expense-add-btn" onClick={openAdd} className="btn-primary text-sm px-3 py-2">+ Add</button>
        </div>

        {loading ? (
          <Spinner size="lg" className="py-16" />
        ) : expenses.length === 0 ? (
          <EmptyState icon="💳" title="No expenses found" description="Tap + Add to log your first expense." />
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => {
              const isOwn = exp.userId?._id === myId || exp.userId === myId;
              return (
                <div key={exp._id} className="card flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                    {CATEGORY_ICONS[exp.category] || '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{exp.category}</p>
                      <span className={`badge text-[10px] ${exp.type === 'Shared' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {exp.type}
                      </span>
                      {exp.type === 'Shared' && !isOwn && (
                        <span className="badge text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          by {exp.userId?.name || 'partner'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(exp.date)}{exp.note ? ` · ${exp.note}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-500 dark:text-red-400 text-sm">-{formatLKR(exp.amount)}</p>
                    {isOwn && (
                      <div className="flex gap-1 mt-1 justify-end">
                        <button onClick={() => openEdit(exp)} className="text-xs text-sky-500 hover:text-sky-700 px-1.5 py-0.5 rounded">Edit</button>
                        <button onClick={() => handleDelete(exp._id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded">Del</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Amount (LKR)</label>
            <input id="exp-form-amount" type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select id="exp-form-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {['Personal', 'Shared'].map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.type === t ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input id="exp-form-date" type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input id="exp-form-note" type="text" className="input" placeholder="e.g. Lunch" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button id="exp-form-save" type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
