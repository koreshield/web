import { useState } from 'react';
import { loadConsent, saveConsent } from '../lib/consent';
import type { ConsentState } from '../lib/consent';

function ConsentModal({ open, onClose, onSave, initial }: { open: boolean; onClose: () => void; onSave: (s: ConsentState) => void; initial: ConsentState }) {
  const [state, setState] = useState<ConsentState>(initial);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-w-2xl w-full rounded-lg bg-card/90 p-6">
        <h3 className="text-lg font-bold">Customize Consent Preferences</h3>
        <p className="text-sm text-muted-foreground mt-2">Choose which categories you consent to.</p>
        <div className="mt-4 space-y-3">
          {(
              Object.keys(state) as (keyof ConsentState)[]
            ).map((k) => (
            <div key={k} className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{k}</div>
                <div className="text-xs text-muted-foreground">Description for {k}</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(state[k])}
                onChange={(e) => setState((s) => ({ ...s, [k]: e.target.checked }))}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded px-4 py-2" onClick={onClose}>Cancel</button>
          <button
            className="rounded bg-electric-green px-4 py-2 font-bold text-black"
            onClick={() => {
              saveConsent(state);
              onSave(state);
              onClose();
            }}
          >
            Save My Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CookieConsent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleState, setVisibleState] = useState(() => {
    const s = loadConsent();
    const seen = Object.values(s).some(Boolean);
    return !seen;
  });

  const acceptAll = () => {
    const all = { functional: true, analytics: true, performance: true, advertisement: true, uncategorised: true };
    saveConsent(all);
    setVisibleState(false);
  };

  const rejectAll = () => {
    const none = { functional: false, analytics: false, performance: false, advertisement: false, uncategorised: false };
    saveConsent(none);
    setVisibleState(false);
  };

  if (!visibleState) return null;

  return (
    <>
      <div className="fixed left-4 right-4 bottom-6 z-50 rounded-lg bg-card/90 p-4 shadow-lg flex items-center justify-between">
        <div>
          <div className="font-bold">We use cookies to improve your experience</div>
          <div className="text-sm text-muted-foreground">Manage your preferences or accept all.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded px-3 py-2" onClick={() => setModalOpen(true)}>Customize</button>
          <button className="rounded px-3 py-2" onClick={rejectAll}>Reject All</button>
          <button className="rounded bg-electric-green px-3 py-2 font-bold text-black" onClick={acceptAll}>Accept All</button>
        </div>
      </div>
      <ConsentModal open={modalOpen} initial={loadConsent()} onClose={() => setModalOpen(false)} onSave={() => {}} />
    </>
  );
}
