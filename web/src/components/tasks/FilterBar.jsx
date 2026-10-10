// Direct port of the vanilla filter-bar markup (4 mutually-exclusive "view"
// pills + an independent "Completed" status pill + a debounced search box).
const VIEW_PILLS = [
  ['all', 'All'],
  ['today', 'Today'],
  ['upcoming', 'Upcoming'],
  ['overdue', 'Overdue'],
];

export function FilterBar({ filters, onToggle, searchValue, onSearchChange }) {
  return (
    <div className="filter-bar">
      {VIEW_PILLS.map(([value, label]) => (
        <button
          key={value}
          className={`pill ${filters.view === value ? 'active' : ''}`}
          onClick={() => onToggle('view', value)}
        >
          {label}
        </button>
      ))}
      <div style={{ width: 1, height: 20, background: 'var(--surface-border-strong)', margin: '0 4px' }} />
      <button
        className={`pill ${filters.status === 'completed' ? 'active' : ''}`}
        onClick={() => onToggle('status', 'completed')}
      >
        Completed
      </button>
      <div style={{ flex: 1 }} />
      <input
        className="input"
        placeholder="Search tasks…"
        style={{ maxWidth: 220 }}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
