export function initials(first, last) {
  return `${(first || '?')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

export function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr);
  const today = new Date();
  const isThisYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: isThisYear ? undefined : 'numeric' });
}

export function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function fmtTime(isoOrHm) {
  if (!isoOrHm) return '';
  if (/^\d{2}:\d{2}$/.test(isoOrHm)) {
    const [h, m] = isoOrHm.split(':').map(Number);
    return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return new Date(isoOrHm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function fmtRelative(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr.includes('T') || isoStr.includes(' ') ? isoStr.replace(' ', 'T') + (isoStr.endsWith('Z') ? '' : 'Z') : isoStr);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return fmtDate(isoStr);
}

export function fmtMoney(amount, currency = 'EUR') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function fmtDuration(minutes) {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export const PRIORITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
export const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };
export const CATEGORY_ICONS = {
  electricity: 'sun', water: 'refresh', internet: 'sparkle', phone: 'message', rent: 'building',
  subscription: 'star', insurance: 'alert', loan: 'bill', other: 'bill',
};
export const ECO_CATEGORY_LABEL = { transport: 'Transport', energy: 'Energy', food: 'Food', shopping: 'Shopping', waste: 'Waste', water: 'Water' };

export function daysUntilLabel(days) {
  if (days == null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

// Brings the chosen item of a horizontally scrolling strip (tab row, module rail) into view by moving the
// STRIP only: scrollIntoView() would also move the page. The item is centred when it does not fit.
export function scrollIntoStrip(strip, item) {
  if (!strip || !item) return;
  const left = item.offsetLeft - strip.offsetLeft;
  const target = left - (strip.clientWidth - item.offsetWidth) / 2;
  const max = strip.scrollWidth - strip.clientWidth;
  if (max <= 0) return;
  strip.scrollLeft = Math.max(0, Math.min(max, target));
}
