import { useEffect, useState } from 'react';
import { incomeApi } from '../api';
import { formatLKR, formatDate, formatDateInput, INCOME_SOURCES } from '../utils';
import Header from '../components/Header';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const emptyForm = { amount: '', source: 'Money from home', date: '', note: '' };

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [meta, setMeta] = useState({ totalAmount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const { data } = await incomeApi.getAll(params);
      setIncomes(data.incomes);
      setMeta({ totalAmount: data.totalAmount, total: data.total });
    } catch {
      toast.error('Failed to load income');
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

  const openEdit = (income) => {
    setEditing(income._id);
    setForm({ amount: income.amount, source: income.source, date: formatDateInput(income.date), note: income.note || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.source) return toast.error('Amount and source are required');
    setSaving(true);
    try {
      if (editing) {
        await incomeApi.update(editing, form);
        toast.success('Income updated');
      } else {
        await incomeApi.create(form);
        toast.success('Income added');
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
    if (!confirm('Delete this income entry?')) return;
    try {
      await incomeApi.remove(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <Header title="Income" />
      <div className="page">
        {/* Summary */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 mb-4 text-white shadow-lg shadow-emerald-900/30">
          <p className="text-emerald-100 text-sm">Total Income</p>
          <p className="text-2xl font-bold">{formatLKR(meta.totalAmount)}</p>
          <p className="text-emerald-100 text-xs mt-0.5">{meta.total} entries</p>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Filter by date</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">From</label>
              <input id="income-filter-from" type="date" className="input text-sm" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div>
              <label className="label">To</label>
              <input id="income-filter-to" type="date" className="input text-sm" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            </div>
          </div>
          {(filters.from || filters.to) && (
            <button onClick={() => setFilters({ from: '', to: '' })} className="text-xs text-sky-500 mt-2">Clear filters</button>
          )}
        </div>

        {/* List */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Entries</h2>
          <button id="income-add-btn" onClick={openAdd} className="btn-primary text-sm px-3 py-2">+ Add</button>
        </div>

        {loading ? (
          <Spinner size="lg" className="py-16" />
        ) : incomes.length === 0 ? (
          <EmptyState icon="💰" title="No income recorded" description="Tap + Add to record your first income entry." />
        ) : (
          <div className="space-y-2">
            {incomes.map((inc) => (
              <div key={inc._id} className="card flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg flex-shrink-0">💰</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{inc.source}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(inc.date)}{inc.note ? ` · ${inc.note}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">+{formatLKR(inc.amount)}</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button onClick={() => openEdit(inc)} className="text-xs text-sky-500 hover:text-sky-700 px-1.5 py-0.5 rounded">Edit</button>
                    <button onClick={() => handleDelete(inc._id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Amount (LKR)</label>
            <input id="income-form-amount" type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Source</label>
            <select id="income-form-source" className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {INCOME_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input id="income-form-date" type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input id="income-form-note" type="text" className="input" placeholder="e.g. Monthly allowance" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button id="income-form-save" type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
