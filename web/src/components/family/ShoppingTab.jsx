import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../Icon.jsx';

// Direct port of renderShopping()/shoppingRow() from the original
// public/js/pages/family.js. Note (preserved exactly, not an oversight):
// unlike removing a member, deleting a shopping item has NO confirm
// dialog — a single click removes it immediately, matching the original.
// Any family member can toggle/delete any item (the backend only checks
// requireMembership, not ownership of the item) — reflected here by not
// hiding or disabling controls for items added by someone else.
export function ShoppingTab({ api, familyId }) {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');

  const load = useCallback(async () => {
    const { items: rows } = await api.get(`/api/family/${familyId}/shopping`);
    setItems(rows);
  }, [api, familyId]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post(`/api/family/${familyId}/shopping`, { name, quantity });
    setName('');
    setQuantity('');
    load();
  }

  async function handleToggle(item) {
    await api.patch(`/api/family/${familyId}/shopping/${item.id}`, { done: !item.done });
    load();
  }

  async function handleDelete(id) {
    await api.del(`/api/family/${familyId}/shopping/${id}`);
    load();
  }

  if (items === null) {
    return (
      <div className="card card-pad">
        <div className="loading-line">
          <span className="spinner" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Shopping list</span>
      </div>
      <form className="row" style={{ marginBottom: 'var(--sp-4)' }} onSubmit={handleAdd}>
        <input
          className="input"
          placeholder="Add an item…"
          style={{ flex: 1 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Qty"
          style={{ width: 90 }}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <Icon name="plus" cls="icon-sm" />
        </button>
      </form>
      {items.length ? (
        <div className="stack">
          {items.map((item) => (
            <div key={item.id} className={`shopping-item ${item.done ? 'done' : ''}`}>
              <button className={`row-check ${item.done ? 'checked' : ''}`} onClick={() => handleToggle(item)}>
                <Icon name="check" />
              </button>
              <div className="shopping-name" style={{ flex: 1 }}>
                {item.name} {item.quantity ? <span className="muted text-xs">({item.quantity})</span> : null}
              </div>
              <button className="icon-btn" aria-label="Remove" onClick={() => handleDelete(item.id)}>
                <Icon name="x" cls="icon-sm" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">List is empty.</p>
      )}
    </div>
  );
}
