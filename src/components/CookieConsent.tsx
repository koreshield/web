import { useEffect, useState } from 'react';
import { useToast } from './ToastNotification';
import { useAuthState } from '../hooks/useAuthState';
import { api } from '../lib/api-client';
import { authService } from '../lib/auth';
import { hasSavedConsent, loadConsent, saveConsent } from '../lib/consent';
import type { ConsentState } from '../lib/consent';

type DeleteAccountModalProps = {
  open: boolean;
  email: string;
  confirmText: string;
  setConfirmText: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
};

const CATEGORY_LABELS: Record<keyof ConsentState, string> = {
  functional: 'Functional cookies',
  analytics: 'Analytics cookies',
  performance: 'Performance cookies',
  advertisement: 'Advertisement cookies',
  uncategorised: 'Uncategorised cookies',
};

const CATEGORY_DESCRIPTIONS: Record<keyof ConsentState, string> = {
  functional: 'Required for core site functionality and preferences.',
  analytics: 'Track usage to help us improve the product experience.',
  performance: 'Measure site performance and stability.',
  advertisement: 'Used for advertising and remarketing.',
  uncategorised: 'Other cookies not covered by the categories above.',
};

function ConsentModal({
  open,
  onClose,
  onSave,
  initial,
  canDelete,
  onDeleteAccount,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (s: ConsentState) => void;
  initial: ConsentState;
  canDelete: boolean;
  onDeleteAccount: () => void;
}) {
  const [state, setState] = useState<ConsentState>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 md:items-center dark:bg-black/40 px-4 pb-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white/95 dark:bg-card/95 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-sm text-slate-900 dark:text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Customize cookie preferences</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Enable only the categories you want. Functional cookies are necessary for the site to work.
            </p>
          </div>
          <button
            className="text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {(Object.keys(CATEGORY_LABELS) as Array<keyof ConsentState>).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/90 dark:hover:border-slate-700"
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{CATEGORY_LABELS[key]}</div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{CATEGORY_DESCRIPTIONS[key]}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(state[key])}
                disabled={key === 'functional'}
                onChange={(e) => setState((current) => ({ ...current, [key]: e.target.checked }))}
                className="h-4 w-4 accent-emerald-500"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
            onClick={onClose}
          >
            Cancel
          </button>
          {canDelete ? (
            <button
              type="button"
              className="rounded-full border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
              onClick={onDeleteAccount}
            >
              Delete my account
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full bg-electric-green px-4 py-2 text-sm font-semibold text-black"
            onClick={() => {
              saveConsent(state);
              onSave(state);
              onClose();
            }}
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({
  open,
  email,
  confirmText,
  setConfirmText,
  onClose,
  onConfirm,
  deleting,
}: DeleteAccountModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <span className="text-xl">!</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delete my account</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Type your email to confirm deletion.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            This will permanently delete your account, API keys, billing records, and all associated data.
          </p>
          <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded mb-3 text-slate-700 dark:text-slate-300">{email}</p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={email}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmText !== email || deleting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CookieConsent() {
  const { user } = useAuthState();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleState, setVisibleState] = useState(() => !hasSavedConsent());
  const [consentState, setConsentState] = useState<ConsentState>(() => loadConsent());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const acceptAll = () => {
    const all = { functional: true, analytics: true, performance: true, advertisement: true, uncategorised: true };
    saveConsent(all);
    setConsentState(all);
    setVisibleState(false);
  };

  const rejectAll = () => {
    const none = { functional: false, analytics: false, performance: false, advertisement: false, uncategorised: false };
    saveConsent(none);
    setConsentState(none);
    setVisibleState(false);
  };

  const handleSavePreferences = (state: ConsentState) => {
    setConsentState(state);
    setVisibleState(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== user.email) return;
    setDeleting(true);
    try {
      await api.deleteMyAccount();
      await authService.logout();
      window.location.href = '/';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please try again or contact support.';
      toast.error('Failed to delete account', message);
      setDeleting(false);
    }
  };

  if (!visibleState) return null;

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border bg-white/95 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl text-slate-900 md:left-8 md:right-8 dark:bg-card/95 dark:text-white dark:border-slate-800 border-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">We use cookies to improve your experience.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your preferences or accept all. Functional cookies are required for the site.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
              onClick={() => setModalOpen(true)}
            >
              Customize
            </button>
            <button
              className="rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
              onClick={rejectAll}
            >
              Reject All
            </button>
            <button
              className="rounded-full bg-electric-green px-4 py-2 text-sm font-semibold text-black"
              onClick={acceptAll}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
      <ConsentModal
        open={modalOpen}
        initial={consentState}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePreferences}
        canDelete={Boolean(user)}
        onDeleteAccount={() => {
          setDeleteModalOpen(true);
          setModalOpen(false);
        }}
      />
      <DeleteAccountModal
        open={deleteModalOpen}
        email={user?.email ?? ''}
        confirmText={deleteConfirmText}
        setConfirmText={setDeleteConfirmText}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        onConfirm={() => void handleDeleteAccount()}
        deleting={deleting}
      />
    </>
  );
}
