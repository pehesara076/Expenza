import { useEffect, useState } from 'react';
import { debtApi } from '../api';
import { formatLKR, formatDate, formatDateInput } from '../utils';
import Header from '../components/Header';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const emptyDebtForm = { direction: 'i_owe', personName: '', amount: '', date: '', dueDate: '', note: '' };
const emptyPayForm = { amount: '', date: '', note: '' };

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({ iOwe: 0, owedToMe: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [payDebt, setPayDebt] = useState(null);
  const [form, setForm] = useState(emptyDebtForm);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [saving, setSaving] = useState(false);
  const [filterDir, setFilterDir] = useState('');
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await debtApi.getAll(filterDir ? { direction: filterDir } : {});
      setDebts(data.debts);
      setSummary(data.summary);
    } catch {
      toast.error('Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterDir]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyDebtForm, date: formatDateInput(new Date()) });
    setModal(true);
  };

  const openEdit = (d) => {
    setEditing(d._id);
    setForm({ direction: d.direction, personName: d.personName, amount: d.amount, date: formatDateInput(d.date), dueDate: d.dueDate ? formatDateInput(d.dueDate) : '', note: d.note || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await debtApi.update(editing, form);
        toast.success('Debt updated');
      } else {
        await debtApi.create(form);
        toast.success('Debt added');
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
    if (!confirm('Delete this debt?')) return;
    try {
      await debtApi.remove(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openPayment = (d) => {
    setPayDebt(d._id);
    setPayForm({ ...emptyPayForm, date: formatDateInput(new Date()) });
    setPayModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await debtApi.addPayment(payDebt, payForm);
      toast.success('Payment recorded');
      setPayModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const removePayment = async (debtId, payId) => {
    if (!confirm('Delete this payment?')) return;
    try {
      await debtApi.removePayment(debtId, payId);
      toast.success('Payment removed');
      load();
    } catch {
      toast.error('Failed to remove payment');
    }
  };

  const statusColors = {
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Partially paid': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Settled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <>
      <Header title="Debts" />
      <div className="page">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card text-center py-3">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">I Owe</p>
            <p className="font-bold text-red-500 text-sm">{formatLKR(summary.iOwe)}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">Owed to Me</p>
            <p className="font-bold text-emerald-500 text-sm">{formatLKR(summary.owedToMe)}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">Net</p>
            <p className={`font-bold text-sm ${summary.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatLKR(summary.net)}</p>
          </div>
        </div>

        {/* Filter + Add */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1 flex-1">
            {[['', 'All'], ['i_owe', 'I Owe'], ['owed_to_me', 'Owed to Me']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterDir(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterDir === v ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
          <button id="debt-add-btn" onClick={openAdd} className="btn-primary text-sm px-3 py-2">+ Add</button>
        </div>

        {loading ? (
          <Spinner size="lg" className="py-16" />
        ) : debts.length === 0 ? (
          <EmptyState icon="🤝" title="No debts tracked" description="Tap + Add to track money owed." />
        ) : (
          <div className="space-y-2">
            {debts.map((d) => (
              <div key={d._id} className="card">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${d.direction === 'i_owe' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                    {d.direction === 'i_owe' ? '📤' : '📥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{d.personName}</p>
                      <span className={`badge text-[10px] ${statusColors[d.status]}`}>{d.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {d.direction === 'i_owe' ? 'You owe' : 'Owes you'} · {formatDate(d.date)}
                      {d.dueDate ? ` · Due: ${formatDate(d.dueDate)}` : ''}
                    </p>
                    {d.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.note}</p>}
                    {d.paidAmount > 0 && (
                      <div className="mt-1.5">
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((d.paidAmount / d.amount) * 100, 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Paid {formatLKR(d.paidAmount)} of {formatLKR(d.amount)}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${d.direction === 'i_owe' ? 'text-red-500' : 'text-emerald-500'}`}>{formatLKR(d.remaining ?? d.amount)}</p>
                    <p className="text-[10px] text-slate-400">remaining</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  {d.status !== 'Settled' && (
                    <button onClick={() => openPayment(d)} className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      + Payment
                    </button>
                  )}
                  <button onClick={() => setExpanded({ ...expanded, [d._id]: !expanded[d._id] })} className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1 rounded-lg">
                    {d.payments?.length > 0 ? `${expanded[d._id] ? 'Hide' : 'View'} ${d.payments.length} payment(s)` : 'No payments'}
                  </button>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => openEdit(d)} className="text-xs text-sky-500 px-1.5 py-0.5">Edit</button>
                    <button onClick={() => handleDelete(d._id)} className="text-xs text-red-400 px-1.5 py-0.5">Del</button>
                  </div>
                </div>
                {expanded[d._id] && d.payments?.length > 0 && (
                  <div className="mt-2 space-y-1 pl-3 border-l-2 border-slate-100 dark:border-slate-700">
                    {d.payments.map((p) => (
                      <div key={p._id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{formatDate(p.date)} {p.note ? `· ${p.note}` : ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatLKR(p.amount)}</span>
                          <button onClick={() => removePayment(d._id, p._id)} className="text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debt Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Debt' : 'Add Debt'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Direction</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...form, direction: 'i_owe' })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.direction === 'i_owe' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                📤 I Owe
              </button>
              <button type="button" onClick={() => setForm({ ...form, direction: 'owed_to_me' })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.direction === 'owed_to_me' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                📥 Owed to Me
              </button>
            </div>
          </div>
          <div>
            <label className="label">Person Name</label>
            <input id="debt-form-name" type="text" className="input" placeholder="e.g. Kavya" value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Amount (LKR)</label>
            <input id="debt-form-amount" type="number" min="0" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Date</label>
              <input id="debt-form-date" type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Due Date (opt)</label>
              <input id="debt-form-due" type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input id="debt-form-note" type="text" className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button id="debt-form-save" type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Add Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="label">Amount (LKR)</label>
            <input id="pay-form-amount" type="number" min="0" step="0.01" className="input" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input id="pay-form-date" type="date" className="input" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input id="pay-form-note" type="text" className="input" value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setPayModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button id="pay-form-save" type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Record'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
