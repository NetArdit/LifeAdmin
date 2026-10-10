import { fmtMoney, daysUntilLabel } from '../../../../public/js/format.js';

// Direct port of warnCard() from the original public/js/pages/billsense.js.
// Only rendered by the parent when overdue.length > 0 — matches the
// original exactly (no empty state for this card; it's just omitted).
export function OverdueCard({ bills }) {
  return (
    <div className="card card-pad" style={{ borderColor: 'var(--danger-400)' }}>
      <div className="card-header">
        <span className="card-title">Overdue bills</span>
      </div>
      <div className="row-list">
        {bills.map((b) => (
          <div className="row-item" key={b.id}>
            <div className="row-main">
              <div className="row-title">{b.name}</div>
              <div className="row-meta">{daysUntilLabel(b.daysUntilDue)}</div>
            </div>
            <div className="bill-amount">{fmtMoney(b.amount, b.currency)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
