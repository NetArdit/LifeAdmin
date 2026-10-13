// Notifications on this device: asking for permission, subscribing, and the things that depend on which
// browser this is. Used by the shell (app.js) and by the Settings screen.

const REMEMBER = 'la-push-user';

export function supported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Opened from the Home Screen, as an app of its own.
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

/**
 * Why notifications cannot be turned on here, or null when they can:
 * 'install' (an iPhone or iPad: only after "Add to Home Screen"), 'unsupported', 'blocked' (refused before:
 * only the browser's own settings can change that), 'server' (this server has no keys).
 */
export function obstacle(status) {
  if (isIos() && !isInstalled()) return 'install';
  if (!supported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (status && !status.configured) return 'server';
  return null;
}

function keyBytes(base64url) {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function register() {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export function status(api) {
  return api.get('/api/push/status');
}

/**
 * Call this directly from a press of a button and with the public key already at hand: the browser shows
 * its question only as the direct answer to a gesture, and an iPhone is strict about it.
 */
export async function enable(api, publicKey, userId) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, permission };
  const registration = await register();
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  // A subscription made with another key (the server's pair changed) cannot be reused.
  if (existing) await existing.unsubscribe().catch(() => {});
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  const saved = await api.post('/api/push/subscription', subscription.toJSON());
  try {
    localStorage.setItem(REMEMBER, String(userId));
  } catch {}
  return { ok: true, permission, ...saved };
}

/** Stops this browser from receiving, here and on the server. */
export async function disable(api) {
  await forgetLocal();
  return api.del('/api/push/subscription');
}

/** The browser's half only: at sign-out, when the server's half goes with the session. */
export async function forgetLocal() {
  try {
    localStorage.removeItem(REMEMBER);
  } catch {}
  if (!supported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = registration && (await registration.pushManager.getSubscription());
    if (subscription) await subscription.unsubscribe();
  } catch {}
}

/**
 * After signing in again on a device where THIS person had notifications on (the session ran out): connect
 * the browser's subscription to the new session. Never for another person: they have not asked.
 */
export async function resume(api, user) {
  if (!supported() || Notification.permission !== 'granted') return;
  let remembered = null;
  try {
    remembered = localStorage.getItem(REMEMBER);
  } catch {}
  if (remembered !== String(user.id)) return;
  try {
    const registration = await register();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const now = await status(api);
    if (now.configured && !now.thisDevice) await api.post('/api/push/subscription', subscription.toJSON());
  } catch {}
}

export function test(api) {
  return api.post('/api/push/test');
}

/** Once: tell the account which time zone this browser lives in, if the account has none yet. */
export async function captureZone(api, user) {
  if (user.timezone) return;
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return;
    const { reminders } = await api.patch('/api/settings/reminders', { timezone, onlyIfUnset: true });
    user.timezone = reminders.timezone;
  } catch {}
}
