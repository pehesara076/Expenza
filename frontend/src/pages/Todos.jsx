import { useEffect, useState } from 'react';
import { todoApi } from '../api';
import { formatDate, formatDateInput } from '../utils';
import Header from '../components/Header';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const emptyForm = { text: '', dueDate: '', priority: 'Medium' };
const PRIORITIES = ['Low', 'Medium', 'High'];
const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? { filter } : {};
      const { data } = await todoApi.getAll(params);
      setTodos(data);
    } catch {
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (t) => {
    setEditing(t._id);
    setForm({ text: t.text, dueDate: t.dueDate ? formatDateInput(t.dueDate) : '', priority: t.priority });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error('Todo text is required');
    setSaving(true);
    try {
      if (editing) {
        await todoApi.update(editing, form);
        toast.success('Todo updated');
      } else {
        await todoApi.create(form);
        toast.success('Todo added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (t) => {
    try {
      await todoApi.update(t._id, { done: !t.done });
      setTodos((prev) => prev.map((item) => item._id === t._id ? { ...item, done: !item.done } : item));
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this todo?')) return;
    try {
      await todoApi.remove(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const pending = todos.filter((t) => !t.done).length;

  return (
    <>
      <Header title="Todos" />
      <div className="page">
        {/* Stats */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-4 mb-4 text-white shadow-lg shadow-violet-900/30">
          <p className="text-violet-100 text-sm">Pending Tasks</p>
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-violet-100 text-xs mt-0.5">{todos.length} total</p>
        </div>

        {/* Filter + Add */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1 flex-1">
            {['All', 'Pending', 'Done'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === f ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>
          <button id="todo-add-btn" onClick={openAdd} className="btn-primary text-sm px-3 py-2">+ Add</button>
        </div>

        {loading ? (
          <Spinner size="lg" className="py-16" />
        ) : todos.length === 0 ? (
          <EmptyState
            icon="✅"
            title={filter === 'Done' ? 'No completed tasks' : filter === 'Pending' ? 'All done! 🎉' : 'No todos yet'}
            description="Tap + Add to create your first task."
          />
        ) : (
          <div className="space-y-2">
            {todos.map((t) => (
              <div key={t._id}
                className={`card flex items-start gap-3 transition-all duration-200 ${t.done ? 'opacity-60' : ''}`}>
                {/* Checkbox */}
                <button
                  onClick={() => toggleDone(t)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500 hover:border-sky-400'}`}
                >
                  {t.done && <span className="text-white text-xs">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-slate-900 dark:text-white ${t.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {t.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`badge text-[10px] ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    {t.dueDate && (
                      <span className={`text-[10px] text-slate-400 dark:text-slate-500 ${new Date(t.dueDate) < new Date() && !t.done ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                        📅 {formatDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0 mt-0.5">
                  <button onClick={() => openEdit(t)} className="text-xs text-sky-500 hover:text-sky-700 px-1.5 py-0.5 rounded">Edit</button>
                  <button onClick={() => handleDelete(t._id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Todo' : 'Add Todo'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Task</label>
            <input
              id="todo-form-text"
              type="text"
              className="input"
              placeholder="What needs to be done?"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p} type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.priority === p
                    ? p === 'High' ? 'bg-red-500 text-white'
                      : p === 'Medium' ? 'bg-amber-400 text-white'
                        : 'bg-slate-400 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Due Date (optional)</label>
            <input
              id="todo-form-due"
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button id="todo-form-save" type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
