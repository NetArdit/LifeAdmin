import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { ItemRow } from './ItemRow.jsx';

// Visual Redesign Batch 6: Dashboard's three priority buckets used to
// render as three equal-weight cards — no structural signal for which one
// actually deserves attention first, just a colored dot and a label. This
// is the fix: exactly one bucket (chosen by the caller, see
// Dashboard.jsx's severity-ordered `dominant` rule) renders in full —
// a hero-style card (the same accent-left-border + section-label
// typography construction `.today-banner` already establishes, just
// built from the bucket's own existing status color, never a module
// accent: urgency and module identity are different axes, and buckets
// mix items from several modules already). The other two render as a
// small, collapsible summary — count only until the user asks to see
// more — which is what actually creates "start here" hierarchy: a page
// where every section shows its full list, just at different sizes, is
// still a page where nothing is truly primary.
export function BucketCard({ title, items, color, emptyText, onComplete, dominant }) {
  const [expanded, setExpanded] = useState(false);
  const showList = dominant || expanded;
  const listId = `bucket-list-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={dominant ? 'card card-pad' : 'card card-pad card-flat'}>
      {dominant ? (
        <div className="bucket-header" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="badge-dot-lg" style={{ background: color }} />
          <span style={{ font: 'var(--type-section-label)' }}>{title}</span>
          <span className="muted text-xs" style={{ marginLeft: 'auto' }}>{items.length}</span>
        </div>
      ) : (
        <button
          className="bucket-header bucket-toggle"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="badge-dot-lg" style={{ background: color }} />
          <span className="card-title">{title}</span>
          <span className="muted text-xs" style={{ marginLeft: 'auto' }}>{items.length}</span>
          <Icon name="chevron" cls="icon-sm bucket-chevron" />
        </button>
      )}
      {showList ? (
        <div id={listId}>
          {items.length ? (
            <div className="row-list">
              {items.map((item) => (
                <ItemRow key={`${item.kind}-${item.id}`} item={item} onComplete={onComplete} />
              ))}
            </div>
          ) : (
            <p className="muted text-sm">{emptyText}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
