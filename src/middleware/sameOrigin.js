// A request that changes something must come from LifeAdmin's own pages.
//
// The session travels in a cookie, which a browser attaches to requests that other sites cause. The cookie is
// SameSite=Lax and the API takes JSON, which already stops the classic form on another site; this is the
// rule that does not depend on those two staying true.
//
// A browser says where a request that changes something comes from: `Origin` on every such request, and
// `Sec-Fetch-Site` in every current browser. If either is there, it must say "this site". A request that
// carries neither was not made by a page in a browser (a script, a test, a command line): it has no cookie
// of somebody else's to ride on, and is let through to the ordinary checks.
//
// "This site" is APP_BASE_URL where it is set (the hosted site), plus ALLOWED_ORIGINS (comma separated) for
// a second address. Only where neither is set (a developer's machine) is the request's own Host believed.

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(req) {
  const configured = [process.env.APP_BASE_URL, ...String(process.env.ALLOWED_ORIGINS || '').split(',')].map((v) => originOf((v || '').trim())).filter(Boolean);
  // The page's own address is always "this site": a page of another site cannot make a browser send an Origin
  // equal to THIS server's Host. So a wrong or missing APP_BASE_URL can no longer lock every person out of
  // signing in (it did: the configured address differed from the real one and every POST was refused).
  // The Host the proxy forwarded counts too (behind a CDN the function sees its own name in Host).
  const hosts = [req.get('x-forwarded-host'), req.get('host')].filter(Boolean).map((h) => String(h).split(',')[0].trim());
  const own = hosts.flatMap((h) => [`http://${h}`, `https://${h}`]);
  return [...configured, ...own];
}

function sameOrigin(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  const site = req.get('sec-fetch-site');
  const refuse = () => res.status(403).json({ error: 'This request did not come from LifeAdmin.' });
  if (origin !== undefined) {
    const from = originOf(origin);
    if (!from || !allowedOrigins(req).includes(from)) return refuse();
    return next();
  }
  if (site !== undefined && site !== 'same-origin' && site !== 'none') return refuse();
  next();
}

module.exports = { sameOrigin };
