import { fmtDate } from '../../../../public/js/format.js';
import { Icon } from '../Icon.jsx';

// Direct port of decisionRow() from the original public/js/pages/decisionflow.js.
// Navigates via location.hash, same as the original — the app's router
// (public/js/app.js) fully unmounts/remounts the page module on every hash
// change, so this is a real navigation, not an internal view toggle.
//
// Accessibility fix (Daily Product Quality phase): unlike TaskRow/BillRow,
// this row does nothing but navigate — there's no nested interactive
// control to conflict with, so the correct native element is a real <a
// href>, not a <button> or a keydown-handling <div>. That gives Tab focus,
// Enter-to-activate, a real href a screen reader announces and a user can
// open in a new tab, and browser history handling, all for free — matching
// the row-item-as-<a> pattern the app already uses elsewhere (see
// ItemRow.jsx, OverviewTab.jsx, ActivityTab.jsx).
export function DecisionRow({ decision }) {
  return (
    <a className="row-item" href={`#/decisionflow/${decision.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="row-check"
        style={{
          pointerEvents: 'none',
          ...(decision.status === 'decided' ? { background: 'var(--accent-500)', borderColor: 'var(--accent-500)', color: '#fff' } : {}),
        }}
      >
        <Icon name={decision.status === 'decided' ? 'check' : 'decision'} cls="icon-sm" />
      </div>
      <div className="row-main">
        <div className="row-title">{decision.question}</div>
        <div className="row-meta">
          <span>{fmtDate(decision.createdAt)}</span>
          {decision.status === 'decided' ? <span className="badge badge-success">Decided</span> : <span className="badge badge-neutral">Open</span>}
        </div>
      </div>
    </a>
  );
}
