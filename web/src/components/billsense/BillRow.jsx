import { fmtMoney, fmtDate, daysUntilLabel } from '../../../../public/js/format.js';
import { Icon } from '../Icon.jsx';

// Visual Redesign Batch 3: every bill category (electricity, water,
// internet, phone, rent, subscription, insurance, loan, other — src/routes
// /bills.js's CATEGORIES) rendered the same generic "bill" document icon,
// regardless of category — a confirmed inconsistency from the pre-
// redesign audit. Checked against the app's actual 34-icon set (public/js
// /components/icons.js) category by category: only "rent" has a genuinely
// strong, unambiguous existing match ("building"). None of the other 8
// categories do — a water droplet, an electricity bolt, a wifi mark, a
// phone handset don't exist in the current set, and reassigning an
// unrelated existing glyph to "mean" one of them (e.g. reusing "refresh"
// for "subscription") would be a weak, arbitrary-feeling guess, likely
// less clear than the current honest generic icon, not more. Rather than
// force 7 unconvincing icon-to-category guesses (well beyond the
// implementation spec's own "at most 2-4 new glyphs" ceiling, since this
// would need closer to 7 genuinely new ones to do properly), this batch
// ships the one confident win and leaves the rest on the existing
// fallback — see the Batch 3 report's "out-of-scope findings" for the
// full category-by-category accounting.
const CATEGORY_ICON = { rent: 'building' };

// Direct port of billRow() from the original public/js/pages/billsense.js.
// The whole row is click-to-edit (matches the original's data-edit-bill on
// the row).
//
// Accessibility fix (Daily Product Quality phase): the row used to be a
// non-interactive <div> with an onClick — unreachable by keyboard. The row
// also contains a separate "Mark paid" <button>, so (as in TaskRow, see its
// comment) the whole row can't become one outer <button> without nesting
// interactive controls inside a <button>, which HTML forbids. Instead the
// icon/title/meta/amount — everything that was always part of the click-to-
// edit area — moves into its own sibling <button>, and "Mark paid" stays a
// separate sibling button. Same clickable area as before, fully keyboard
// reachable, and e.stopPropagation() is no longer needed since the two
// actions are siblings rather than nested.
export function BillRow({ bill, onEdit, onMarkPaid }) {
  const overdue = bill.status === 'unpaid' && bill.daysUntilDue < 0;
  return (
    <div className="row-item">
      <button className="row-item-btn row" onClick={() => onEdit(bill)}>
        <div className="bill-cat-icon">
          <Icon name={CATEGORY_ICON[bill.category] || 'bill'} cls="icon-sm" />
        </div>
        <div className="row-main">
          <div className="row-title">{bill.name}</div>
          <div className="row-meta">
            <span style={{ textTransform: 'capitalize' }}>{bill.category}</span>
            <span>{fmtDate(bill.dueDate)}</span>
            {bill.status === 'unpaid' ? (
              <span className={`badge ${overdue ? 'badge-critical' : 'badge-neutral'}`}>{daysUntilLabel(bill.daysUntilDue)}</span>
            ) : (
              <span className="badge badge-success">Paid</span>
            )}
          </div>
        </div>
        <div className="bill-amount">{fmtMoney(bill.amount, bill.currency)}</div>
      </button>
      {bill.status === 'unpaid' ? (
        <button className="btn btn-sm" onClick={() => onMarkPaid(bill.id)}>
          Mark paid
        </button>
      ) : null}
    </div>
  );
}
