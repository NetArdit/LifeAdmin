import { createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal } from '../../../../public/js/components/modal.js';

// Same title/loading-text/success/error content as the original
// openWeeklyReview() in public/js/pages/assistant.js, but rebuilt on the
// standard hybrid modal pattern (React owns the body, driven by state
// transitions) instead of the original's ad-hoc direct DOM manipulation
// (`document.querySelector('#modal-root .modal-body').innerHTML = ...`,
// bypassing openModal's own onMount lifecycle entirely) — flagged in
// PHASE_6_FINAL_MIGRATION_BATCH_REPORT.md §7 as worth replacing once this
// page was migrated, not preserving as a special case.
function WeeklyReviewContent({ api }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    api
      .post('/api/ai/weekly-review', {})
      .then((result) => {
        if (!result.ok) setState({ error: result.error });
        else setState({ data: result.data });
      })
      .catch((err) => setState({ error: err.message }));
  }, [api]);

  if (state.loading) {
    return (
      <div className="loading-line">
        <span className="spinner" /> Reviewing your week…
      </div>
    );
  }
  if (state.error) return <p className="field-error">{state.error}</p>;

  const r = state.data;
  return (
    <>
      <h3 style={{ marginBottom: 'var(--sp-3)' }}>{r.headline}</h3>
      {r.highlights.length ? (
        <>
          <div className="section-title">Highlights</div>
          <ul className="stack" style={{ gap: 4, marginBottom: 'var(--sp-4)' }}>
            {r.highlights.map((h, i) => (
              <li className="text-sm" key={i}>{h}</li>
            ))}
          </ul>
        </>
      ) : null}
      {r.forgettingChecklist.length ? (
        <>
          <div className="section-title">Things you might be forgetting</div>
          <ul className="stack" style={{ gap: 4 }}>
            {r.forgettingChecklist.map((h, i) => (
              <li className="text-sm muted" key={i}>{h}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

// Same defensive check as the original — the "Weekly review" button only
// ever renders when ctx.state.aiConfigured is already true (the whole page
// shows the unavailable state otherwise), so this is unreachable in
// practice, kept only because the original had it too.
export function openWeeklyReviewModal({ api, toast, aiConfigured }) {
  if (!aiConfigured) return toast('AI is not configured on this server.', 'error');
  let root = null;
  openModal({
    title: 'Weekly review',
    bodyHtml: '<div id="weekly-review-mount"></div>',
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#weekly-review-mount'));
      root.render(createElement(WeeklyReviewContent, { api }));
    },
    onClose: () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  });
}
