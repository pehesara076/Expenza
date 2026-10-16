import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import Header from '../components/Header';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteExpiry, setInviteExpiry] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadingUnlink, setLoadingUnlink] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDark = () => {
    const el = document.documentElement;
    el.classList.toggle('dark');
    setDarkMode(el.classList.contains('dark'));
    localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light');
  };

  const generateInvite = async () => {
    setLoadingInvite(true);
    try {
      const { data } = await authApi.generateInvite();
      setInviteCode(data.inviteCode);
      setInviteExpiry(new Date(data.expiresAt).toLocaleTimeString());
      toast.success('Invite code generated (valid 24h)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invite');
    } finally {
      setLoadingInvite(false);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Copied to clipboard!');
  };

  const linkPartner = async (e) => {
    e.preventDefault();
    if (!linkInput.trim()) return toast.error('Enter an invite code');
    setLoadingLink(true);
    try {
      const { data } = await authApi.linkPartner(linkInput.trim());
      toast.success(`Linked with ${data.partnerName}! 🎉`);
      setLinkInput('');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link partner');
    } finally {
      setLoadingLink(false);
    }
  };

  const unlinkPartner = async () => {
    if (!confirm('Unlink from your partner? Shared budget data will remain but be inaccessible.')) return;
    setLoadingUnlink(true);
    try {
      await authApi.unlinkPartner();
      toast.success('Partner unlinked');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlink');
    } finally {
      setLoadingUnlink(false);
    }
  };

  return (
    <>
      <Header title="Settings" />
      <div className="page">
        {/* Profile */}
        <div className="card mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center text-2xl text-white font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-lg">{user?.name}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">{user?.email}</p>
              {user?.partnerName && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  💞 Linked with {user.partnerName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card mb-4">
          <h3 className="section-title">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">Dark Mode</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Toggle between light and dark theme</p>
            </div>
            <button
              id="toggle-dark"
              onClick={toggleDark}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${darkMode ? 'bg-sky-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${darkMode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Partner Linking */}
        <div className="card mb-4">
          <h3 className="section-title">Partner Link</h3>
          {user?.partnerId ? (
            <div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-3">
                <span className="text-2xl">💞</span>
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Linked with {user.partnerName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">Sharing budget and shared expenses</p>
                </div>
              </div>
              <button
                id="unlink-partner-btn"
                onClick={unlinkPartner}
                disabled={loadingUnlink}
                className="btn-danger w-full text-sm"
              >
                {loadingUnlink ? 'Unlinking...' : '🔓 Unlink Partner'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generate invite */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Generate your invite code</p>
                <button
                  id="generate-invite-btn"
                  onClick={generateInvite}
                  disabled={loadingInvite}
                  className="btn-secondary w-full text-sm"
                >
                  {loadingInvite ? 'Generating...' : '🔑 Generate Invite Code'}
                </button>
                {inviteCode && (
                  <div className="mt-2 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xl font-mono font-bold text-sky-700 dark:text-sky-300 tracking-widest">{inviteCode}</p>
                      <p className="text-xs text-sky-500 dark:text-sky-400">Expires around {inviteExpiry}</p>
                    </div>
                    <button
                      id="copy-invite-btn"
                      onClick={copyInvite}
                      className="text-xs bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 px-3 py-1.5 rounded-lg font-medium hover:bg-sky-200 dark:hover:bg-sky-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
              </div>

              {/* Enter partner's invite code */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter partner's invite code</p>
                <form onSubmit={linkPartner} className="flex gap-2">
                  <input
                    id="link-code-input"
                    type="text"
                    className="input flex-1 uppercase tracking-widest font-mono text-sm"
                    placeholder="XXXXXXXX"
                    maxLength={8}
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value.toUpperCase())}
                  />
                  <button
                    id="link-partner-btn"
                    type="submit"
                    disabled={loadingLink}
                    className="btn-primary text-sm px-4"
                  >
                    {loadingLink ? '...' : 'Link'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="card">
          <h3 className="section-title">About</h3>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>App</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">ExpenseManager</span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Currency</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">LKR (Sri Lankan Rupee)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
