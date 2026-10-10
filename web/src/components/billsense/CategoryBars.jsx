import { fmtMoney } from '../../../../public/js/format.js';

// Direct port of categoryBars() from the original public/js/pages/billsense.js.
export function CategoryBars({ byCategory }) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="muted text-sm">No data yet.</p>;
  const max = Math.max(...entries.map((e) => e[1]));
  return (
    <>
      {entries.map(([cat, amt]) => (
        <div className="category-bar-row" key={cat}>
          <span className="cat-label">{cat}</span>
          <div className="category-bar-track">
            <div className="category-bar-fill" style={{ width: `${(amt / max) * 100}%` }} />
          </div>
          <span className="cat-amount">{fmtMoney(amt)}</span>
        </div>
      ))}
    </>
  );
}
