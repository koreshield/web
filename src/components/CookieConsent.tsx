import { useEffect, useState } from 'react';
import { hasSavedConsent, loadConsent, saveConsent } from '../lib/consent';
import type { ConsentState } from '../lib/consent';

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
}: {
  open: boolean
  onClose: () => void
  onSave: (s: ConsentState) => void
  initial: ConsentState
}) {
  const [state, setState] = useState<ConsentState>(initial)

  useEffect(() => {
    setState(initial)
  }, [initial])

  if (!open) return null

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
          <button className="text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={onClose}>
            Close
          </button>
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/90 dark:hover:border-slate-700"
            >
            <label
                <div className="font-semibold text-slate-900 dark:text-slate-100">{CATEGORY_LABELS[key]}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{CATEGORY_DESCRIPTIONS[key]}</p>
                <div className="font-semibold text-slate-100">{CATEGORY_LABELS[key]}</div>
                <p className="text-sm text-slate-400">{CATEGORY_DESCRIPTIONS[key]}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(state[key])}
                onChange={(e) => setState((current) => ({ ...current, [key]: e.target.checked }))}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-full bg-electric-green px-4 py-2 text-sm font-semibold text-black"
            onClick={() => {
              saveConsent(state)
              onSave(state)
              onClose()
            }}
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CookieConsent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleState, setVisibleState] = useState(() => !hasSavedConsent())
  const [consentState, setConsentState] = useState<ConsentState>(() => loadConsent())

  useEffect(() => {
    if (hasSavedConsent()) {
      setConsentState(loadConsent())
      setVisibleState(false)
    }
  }, [])

  const acceptAll = () => {
    const all = { functional: true, analytics: true, performance: true, advertisement: true, uncategorised: true }
    saveConsent(all)
    setConsentState(all)
    setVisibleState(false)
  }

  const rejectAll = () => {
    const none = { functional: false, analytics: false, performance: false, advertisement: false, uncategorised: false }
    saveConsent(none)
    setConsentState(none)
    setVisibleState(false)
  }

  const handleSavePreferences = (state: ConsentState) => {
    setConsentState(state)
    setVisibleState(false)
  }

  if (!visibleState) return null

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border bg-white/95 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl text-slate-900 md:left-8 md:right-8 dark:bg-card/95 dark:text-white dark:border-slate-800 border-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">We use cookies to improve your experience.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your preferences or accept all. Functional cookies are required for the site.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200" onClick={() => setModalOpen(true)}>
              Customize
            </button>
            <button className="rounded-full border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200" onClick={rejectAll}>
              Reject All
            </button>
            <button className="rounded-full bg-electric-green px-4 py-2 text-sm font-semibold text-black" onClick={acceptAll}>
              Accept All
            </button>
          </div>
        </div>
      </div>
      <ConsentModal open={modalOpen} initial={consentState} onClose={() => setModalOpen(false)} onSave={handleSavePreferences} />
    </>
  )
}
