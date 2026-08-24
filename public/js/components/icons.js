// Minimal inline icon set (stroke-based, feather-style). No external
// dependency, no font, no CDN — keeps the app fully self-contained/offline.
const PATHS = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
  tasks: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.2 2.2L15.5 9.5"/>',
  family: '<circle cx="8.5" cy="8" r="3"/><circle cx="16" cy="9" r="2.4"/><path d="M3.5 20v-1.2A4.8 4.8 0 0 1 8.3 14h.4a4.8 4.8 0 0 1 4.8 4.8V20"/><path d="M14.8 14.6A4 4 0 0 1 20.5 18v2"/>',
  bill: '<path d="M6 3h9l3 3v15l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/>',
  decision: '<path d="M12 3v3M12 21v-3"/><path d="M5 8h4l-2-5-2 5Zm10 0h4l-2-5-2 5Z"/><path d="M3 8h6M15 8h6"/><path d="M9 8a3 3 0 0 1-6 0M21 8a3 3 0 0 1-6 0"/><path d="M12 6v9"/>',
  eco: '<path d="M12 21c-4-1-7-4.5-7-9 0-5 4-8 7-9 3 1 7 4 7 9 0 4.5-3 8-7 9Z"/><path d="M12 12c1.5-2.2 4-3 6-3M12 12C10.5 9.8 8 9 6 9M12 12v9"/>',
  goal: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  timeline: '<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
  assistant: '<path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/><circle cx="12" cy="12" r="4.2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
  bell: '<path d="M7 9a5 5 0 0 1 10 0v4.5l1.6 2.7H5.4L7 13.5Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.6a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.4a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 10.4 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09c0 .69.4 1.3 1 1.55.6.25 1.36.14 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.48.5-.6 1.26-.34 1.87.25.6.86 1 1.55 1h.09a2 2 0 1 1 0 4h-.09c-.69 0-1.3.4-1.55 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  trash: '<path d="M4 7h16M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7M6 7l1 12.8c0 .7.6 1.2 1.3 1.2h7.4c.7 0 1.3-.5 1.3-1.2L18 7"/>',
  edit: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 15v5Z"/>',
  send: '<path d="m4 12 16-8-6 16-3-6-7-2Z"/>',
  logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4"/><path d="M4 18v1.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V18"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10.5v4M12 17.2v.1"/>',
  message: '<path d="M4 5.5h16v11H9l-4 3.5v-3.5H4v-11Z"/>',
  cart: '<circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none"/><path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.3h8.1a1.5 1.5 0 0 0 1.5-1.2L20 8H6"/>',
  star: '<path d="m12 4 2.4 5.1 5.6.6-4.2 3.8 1.2 5.5L12 16.2l-4.9 2.8 1.2-5.5-4.2-3.8 5.6-.6Z"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h1M8 11h1M8 15h1M15 7h1M15 11h1M15 15h1M10 21v-4h4v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5Z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  arrowRight: '<path d="M4 12h16M14 6l6 6-6 6"/>',
  refresh: '<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6M4 13a8 8 0 0 0 13.7 4.7L20 15.4"/><path d="M4 4v4.6h4.6M20 20v-4.6h-4.6"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/><circle cx="12" cy="12" r="2.2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8v.1"/>',
};

export function icon(name, extraCls = '') {
  const inner = PATHS[name] || PATHS.info;
  // Always keep the base .icon class (it carries stroke/fill/stroke-width) —
  // extraCls only adds size modifiers like icon-sm/icon-lg, never replaces it.
  // A duplicate "icon" token if extraCls already includes one is harmless.
  const cls = extraCls ? `icon ${extraCls}` : 'icon';
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
}
