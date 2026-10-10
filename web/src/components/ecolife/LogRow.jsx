import { fmtRelative } from '../../../../public/js/format.js';
import { Icon } from '../Icon.jsx';

const CATEGORY_ICON = { transport: 'refresh', energy: 'sun', food: 'cart', shopping: 'cart', waste: 'trash', water: 'refresh' };

// Direct port of logRow() from the original public/js/pages/ecolife.js.
export function LogRow({ log, onDelete }) {
  return (
    <div className="row-item">
      <div className="eco-cat-icon" style={{ width: 32, height: 32 }}>
        <Icon name={CATEGORY_ICON[log.category] || 'eco'} cls="icon-sm" />
      </div>
      <div className="row-main">
        <div className="row-title">{log.action}</div>
        <div className="row-meta">
          <span style={{ textTransform: 'capitalize' }}>{log.category}</span>
          {log.quantity ? <span>{log.quantity}{log.unit ? ` ${log.unit}` : ''}</span> : null}
          <span>{fmtRelative(log.logged_at)}</span>
        </div>
      </div>
      <button className="icon-btn" aria-label="Delete" onClick={() => onDelete(log.id)}>
        <Icon name="x" cls="icon-sm" />
      </button>
    </div>
  );
}
