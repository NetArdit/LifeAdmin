import { icon } from '../../../public/js/components/icons.js';

// Wraps the existing icon() lookup (public/js/components/icons.js) — a
// static, hardcoded SVG-path table, never user/API-controlled — for use in
// JSX. Extracted here once Tasks needed the same dangerouslySetInnerHTML
// pattern repeatedly (Dashboard used it inline in five places in Phase 1;
// with Tasks needing it in ~10 more, duplicating the pattern stopped being
// the simpler option). See PHASE_2_TASKS_MIGRATION_REPORT.md §11 (Security)
// for why this specific, narrow use of dangerouslySetInnerHTML is safe.
export function Icon({ name, cls = '' }) {
  return <span dangerouslySetInnerHTML={{ __html: icon(name, cls) }} />;
}
