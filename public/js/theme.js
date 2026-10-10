// Extracted from public/js/app.js (Phase 8) so this can be imported by
// React's AppearanceSection.jsx without pulling in app.js's whole module
// graph — app.js itself dynamically imports '/app/main.js' with an
// absolute runtime path that Vite/Rollup can't statically resolve at
// build time, which broke the web/ build the moment a React component
// tried to import anything from app.js. This file has no such import, so
// it's safe for both the vanilla shell and the React bundle to depend on.

export function effectiveTheme() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit) return explicit;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Visual Redesign Batch 11B: the app shell's topbar theme-toggle button
// (and the icon-sync helper this function existed only to serve) was
// removed — theme selection is now Settings -> Appearance only, per the
// approved design direction. applyTheme() itself is unchanged: it still
// sets data-theme + localStorage exactly as before, so persistence,
// reload, and first-paint behavior (index.html's own pre-paint script
// reads localStorage directly and never called this function) are
// untouched.
export function applyTheme(theme) {
  if (theme && theme !== 'system') {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('la-theme', theme);
    } catch {}
  } else {
    document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.removeItem('la-theme');
    } catch {}
  }
}
