import { useEffect, useState } from 'react';

// The shell's own module (public/js/push.js), shared with app.js rather than built into this bundle twice.
// Named through a variable so that the bundler leaves the address alone: the browser loads it when asked.
const PUSH_MODULE = '/js/push.js';
const loadPush = () => import(/* @vite-ignore */ PUSH_MODULE);

const WHY_NOT = {
  install:
    'On an iPhone or iPad, notifications work only for an app on the Home Screen. Open the Share menu in Safari, choose “Add to Home Screen”, then open LifeAdmin from there and come back to this page.',
  unsupported: 'This browser cannot receive notifications. Try Chrome, Firefox, Edge or Safari, up to date.',
  blocked:
    'Notifications from LifeAdmin are blocked in this browser. Allow them in the browser’s site settings (the icon next to the address), then reload this page.',
  server: 'Notifications are not set up on this server yet.',
};

// Notifications on THIS device. The browser's own question appears only after the button is pressed.
export function DeviceNotifications({ ctx }) {
  const { api, toast, state } = ctx;
  const [push, setPush] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadPush()
      .then(async (m) => {
        const s = await m.status(api);
        if (alive) {
          setPush(m);
          setStatus(s);
        }
      })
      .catch(() => alive && setStatus({ configured: false, thisDevice: false, devices: 0, failed: true }));
    return () => {
      alive = false;
    };
  }, [api]);

  if (!push || !status) {
    return (
      <div className="card card-pad">
        <div className="card-header">
          <span className="card-title">Notifications on this device</span>
        </div>
        <p className="text-sm muted">{status && status.failed ? 'Could not check this device. Reload the page to try again.' : 'Checking this device…'}</p>
      </div>
    );
  }

  const why = push.obstacle(status);
  const on = !why && status.thisDevice && Notification.permission === 'granted';
  const others = status.devices - (status.thisDevice ? 1 : 0);

  async function act(work, failure) {
    setBusy(true);
    try {
      await work();
    } catch (err) {
      toast((err && err.message) || failure, 'error');
    } finally {
      setBusy(false);
    }
  }

  const turnOn = () =>
    act(async () => {
      // The first thing after the press is the browser's own question.
      const out = await push.enable(api, status.publicKey, state.user.id);
      if (out.ok) {
        setStatus({ ...status, thisDevice: out.thisDevice, devices: out.devices });
        toast('Notifications are on for this device', 'success');
      } else {
        setStatus({ ...status });
        toast(out.permission === 'denied' ? 'Notifications were blocked for this site' : 'Notifications were not allowed', 'error');
      }
    }, 'Could not turn notifications on');

  const turnOff = () =>
    act(async () => {
      const out = await push.disable(api);
      setStatus({ ...status, thisDevice: out.thisDevice, devices: out.devices });
      toast('Notifications are off for this device', 'success');
    }, 'Could not turn notifications off');

  const sendTest = () =>
    act(async () => {
      const out = await push.test(api);
      if (out.ok) {
        toast('Sent. It should appear in a few seconds.', 'success');
      } else {
        toast('This device could not be reached. Turn notifications off and on again.', 'error');
        setStatus(await push.status(api));
      }
    }, 'Could not send the test');

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Notifications on this device</span>
        <span className="text-sm muted">{on ? 'On' : 'Off'}</span>
      </div>
      <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
        Get reminders and your circle’s activity on this phone or computer, even when LifeAdmin is closed. A notification never shows the content of a task, a bill or a message: you see it after you open the app.
      </p>
      {why ? (
        <p className="text-sm" role="status">
          {WHY_NOT[why]}
        </p>
      ) : on ? (
        <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={sendTest} disabled={busy}>
            Send a test notification
          </button>
          <button className="btn btn-ghost" onClick={turnOff} disabled={busy}>
            Turn off on this device
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={turnOn} disabled={busy}>
          Turn on notifications
        </button>
      )}
      {others > 0 && (
        <p className="text-sm muted" style={{ marginTop: 'var(--sp-3)' }}>
          {on ? 'Also on' : 'On for'} {others} other device{others === 1 ? '' : 's'} of yours. Each device is turned on and off on its own.
        </p>
      )}
    </div>
  );
}

const OFFSET_LABEL = { 0: 'On the day', 60: '1 hour before', 300: '5 hours before', 720: '12 hours before', 1440: '1 day before', 4320: '3 days before', 7200: '5 days before', 10080: '1 week before' };
const DEFAULT_ROWS = [
  ['taskTimed', 'Tasks with a time'],
  ['taskDate', 'Tasks with a date only'],
  ['bill', 'Bills'],
  ['milestone', 'Steps of a goal'],
  ['goal', 'Goals without dated steps'],
];

function zones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
}

// When reminders come: the person's time zone, the hour of a date without a time, and what each kind of item
// gets unless it says otherwise.
export function ReminderTimes({ ctx }) {
  const { api, toast, state } = ctx;
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/api/settings/reminders')
      .then((r) => alive && setData(r.reminders))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [api]);

  if (!data) return null;

  async function save(change) {
    try {
      const { reminders } = await api.patch('/api/settings/reminders', change);
      setData(reminders);
      state.user.timezone = reminders.timezone;
      toast('Saved', 'success');
    } catch (err) {
      toast((err && err.message) || 'Could not save', 'error');
    }
  }

  const list = zones();
  const zone = data.timezone || data.effectiveTimezone;
  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">When to remind me</span>
      </div>
      <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
        Reminders arrive around the chosen time, usually within a quarter of an hour. These apply to everything that has no choice of its own.
      </p>
      <div className="stack">
        <div className="field">
          <label className="field-label" htmlFor="reminder-zone">Time zone</label>
          <select id="reminder-zone" className="input" value={zone} onChange={(e) => save({ timezone: e.target.value })}>
            {!list.includes(zone) && <option value={zone}>{zone}</option>}
            {list.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="reminder-time">For a date without a time, remind me at</label>
          <input id="reminder-time" className="input" type="time" value={data.defaults.dateOnlyTime} onChange={(e) => e.target.value && save({ defaults: { dateOnlyTime: e.target.value } })} />
        </div>
        <div className="field">
          <label className="checkbox-row">
            <input type="checkbox" checked={data.defaults.quietOn} onChange={(e) => save({ defaults: { quietOn: e.target.checked } })} />
            Quiet hours: hold reminders back at night
          </label>
          {data.defaults.quietOn ? (
            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--sp-2)' }}>
              <label className="text-sm muted" htmlFor="quiet-start">From</label>
              <input id="quiet-start" className="input" style={{ width: 'auto' }} type="time" value={data.defaults.quietStart} onChange={(e) => e.target.value && save({ defaults: { quietStart: e.target.value } })} />
              <label className="text-sm muted" htmlFor="quiet-end">until</label>
              <input id="quiet-end" className="input" style={{ width: 'auto' }} type="time" value={data.defaults.quietEnd} onChange={(e) => e.target.value && save({ defaults: { quietEnd: e.target.value } })} />
            </div>
          ) : null}
          <p className="text-sm muted" style={{ marginTop: 'var(--sp-1)' }}>
            A reminder that falls in these hours arrives when they end; none is lost.
          </p>
          {data.defaults.quietOn ? (
            <>
              <label className="checkbox-row" style={{ marginTop: 'var(--sp-2)' }}>
                <input type="checkbox" checked={data.defaults.quietCircles} onChange={(e) => save({ defaults: { quietCircles: e.target.checked } })} />
                Keep my circles quiet in these hours too
              </label>
              <p className="text-sm muted" style={{ marginTop: 'var(--sp-1)' }}>
                Off: messages and activity in your circles reach your devices at any hour. On: at night they appear under the bell only, and are not sent again in the morning.
              </p>
            </>
          ) : null}
        </div>
        {DEFAULT_ROWS.map(([key, label]) => (
          <div className="field" key={key}>
            <label className="field-label" htmlFor={`reminder-${key}`}>{label}</label>
            <select
              id={`reminder-${key}`}
              className="input"
              value={data.defaults[key] === null ? 'none' : String(data.defaults[key])}
              onChange={(e) => save({ defaults: { [key]: e.target.value === 'none' ? null : Number(e.target.value) } })}
            >
              <option value="none">No reminder</option>
              {data.offsets.map((o) => (
                <option key={o} value={o}>
                  {key === 'taskTimed' && o === 0 ? 'At the time' : OFFSET_LABEL[o]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
