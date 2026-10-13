var Do = { exports: {} }, A = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var jr = Symbol.for("react.element"), gd = Symbol.for("react.portal"), yd = Symbol.for("react.fragment"), xd = Symbol.for("react.strict_mode"), jd = Symbol.for("react.profiler"), Nd = Symbol.for("react.provider"), wd = Symbol.for("react.context"), kd = Symbol.for("react.forward_ref"), Sd = Symbol.for("react.suspense"), Cd = Symbol.for("react.memo"), Ed = Symbol.for("react.lazy"), ai = Symbol.iterator;
function bd(e) {
  return e === null || typeof e != "object" ? null : (e = ai && e[ai] || e["@@iterator"], typeof e == "function" ? e : null);
}
var _o = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, Mo = Object.assign, Lo = {};
function Dn(e, t, n) {
  this.props = e, this.context = t, this.refs = Lo, this.updater = n || _o;
}
Dn.prototype.isReactComponent = {};
Dn.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Dn.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Po() {
}
Po.prototype = Dn.prototype;
function ua(e, t, n) {
  this.props = e, this.context = t, this.refs = Lo, this.updater = n || _o;
}
var da = ua.prototype = new Po();
da.constructor = ua;
Mo(da, Dn.prototype);
da.isPureReactComponent = !0;
var ii = Array.isArray, Io = Object.prototype.hasOwnProperty, ma = { current: null }, $o = { key: !0, ref: !0, __self: !0, __source: !0 };
function Ao(e, t, n) {
  var r, l = {}, a = null, i = null;
  if (t != null) for (r in t.ref !== void 0 && (i = t.ref), t.key !== void 0 && (a = "" + t.key), t) Io.call(t, r) && !$o.hasOwnProperty(r) && (l[r] = t[r]);
  var o = arguments.length - 2;
  if (o === 1) l.children = n;
  else if (1 < o) {
    for (var c = Array(o), u = 0; u < o; u++) c[u] = arguments[u + 2];
    l.children = c;
  }
  if (e && e.defaultProps) for (r in o = e.defaultProps, o) l[r] === void 0 && (l[r] = o[r]);
  return { $$typeof: jr, type: e, key: a, ref: i, props: l, _owner: ma.current };
}
function Td(e, t) {
  return { $$typeof: jr, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function fa(e) {
  return typeof e == "object" && e !== null && e.$$typeof === jr;
}
function Dd(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var oi = /\/+/g;
function Hs(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Dd("" + e.key) : t.toString(36);
}
function Hr(e, t, n, r, l) {
  var a = typeof e;
  (a === "undefined" || a === "boolean") && (e = null);
  var i = !1;
  if (e === null) i = !0;
  else switch (a) {
    case "string":
    case "number":
      i = !0;
      break;
    case "object":
      switch (e.$$typeof) {
        case jr:
        case gd:
          i = !0;
      }
  }
  if (i) return i = e, l = l(i), e = r === "" ? "." + Hs(i, 0) : r, ii(l) ? (n = "", e != null && (n = e.replace(oi, "$&/") + "/"), Hr(l, t, n, "", function(u) {
    return u;
  })) : l != null && (fa(l) && (l = Td(l, n + (!l.key || i && i.key === l.key ? "" : ("" + l.key).replace(oi, "$&/") + "/") + e)), t.push(l)), 1;
  if (i = 0, r = r === "" ? "." : r + ":", ii(e)) for (var o = 0; o < e.length; o++) {
    a = e[o];
    var c = r + Hs(a, o);
    i += Hr(a, t, n, c, l);
  }
  else if (c = bd(e), typeof c == "function") for (e = c.call(e), o = 0; !(a = e.next()).done; ) a = a.value, c = r + Hs(a, o++), i += Hr(a, t, n, c, l);
  else if (a === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return i;
}
function Er(e, t, n) {
  if (e == null) return e;
  var r = [], l = 0;
  return Hr(e, r, "", "", function(a) {
    return t.call(n, a, l++);
  }), r;
}
function _d(e) {
  if (e._status === -1) {
    var t = e._result;
    t = t(), t.then(function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 1, e._result = n);
    }, function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 2, e._result = n);
    }), e._status === -1 && (e._status = 0, e._result = t);
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var ve = { current: null }, Wr = { transition: null }, Md = { ReactCurrentDispatcher: ve, ReactCurrentBatchConfig: Wr, ReactCurrentOwner: ma };
function Oo() {
  throw Error("act(...) is not supported in production builds of React.");
}
A.Children = { map: Er, forEach: function(e, t, n) {
  Er(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return Er(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return Er(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!fa(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
A.Component = Dn;
A.Fragment = yd;
A.Profiler = jd;
A.PureComponent = ua;
A.StrictMode = xd;
A.Suspense = Sd;
A.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Md;
A.act = Oo;
A.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var r = Mo({}, e.props), l = e.key, a = e.ref, i = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (a = t.ref, i = ma.current), t.key !== void 0 && (l = "" + t.key), e.type && e.type.defaultProps) var o = e.type.defaultProps;
    for (c in t) Io.call(t, c) && !$o.hasOwnProperty(c) && (r[c] = t[c] === void 0 && o !== void 0 ? o[c] : t[c]);
  }
  var c = arguments.length - 2;
  if (c === 1) r.children = n;
  else if (1 < c) {
    o = Array(c);
    for (var u = 0; u < c; u++) o[u] = arguments[u + 2];
    r.children = o;
  }
  return { $$typeof: jr, type: e.type, key: l, ref: a, props: r, _owner: i };
};
A.createContext = function(e) {
  return e = { $$typeof: wd, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: Nd, _context: e }, e.Consumer = e;
};
A.createElement = Ao;
A.createFactory = function(e) {
  var t = Ao.bind(null, e);
  return t.type = e, t;
};
A.createRef = function() {
  return { current: null };
};
A.forwardRef = function(e) {
  return { $$typeof: kd, render: e };
};
A.isValidElement = fa;
A.lazy = function(e) {
  return { $$typeof: Ed, _payload: { _status: -1, _result: e }, _init: _d };
};
A.memo = function(e, t) {
  return { $$typeof: Cd, type: e, compare: t === void 0 ? null : t };
};
A.startTransition = function(e) {
  var t = Wr.transition;
  Wr.transition = {};
  try {
    e();
  } finally {
    Wr.transition = t;
  }
};
A.unstable_act = Oo;
A.useCallback = function(e, t) {
  return ve.current.useCallback(e, t);
};
A.useContext = function(e) {
  return ve.current.useContext(e);
};
A.useDebugValue = function() {
};
A.useDeferredValue = function(e) {
  return ve.current.useDeferredValue(e);
};
A.useEffect = function(e, t) {
  return ve.current.useEffect(e, t);
};
A.useId = function() {
  return ve.current.useId();
};
A.useImperativeHandle = function(e, t, n) {
  return ve.current.useImperativeHandle(e, t, n);
};
A.useInsertionEffect = function(e, t) {
  return ve.current.useInsertionEffect(e, t);
};
A.useLayoutEffect = function(e, t) {
  return ve.current.useLayoutEffect(e, t);
};
A.useMemo = function(e, t) {
  return ve.current.useMemo(e, t);
};
A.useReducer = function(e, t, n) {
  return ve.current.useReducer(e, t, n);
};
A.useRef = function(e) {
  return ve.current.useRef(e);
};
A.useState = function(e) {
  return ve.current.useState(e);
};
A.useSyncExternalStore = function(e, t, n) {
  return ve.current.useSyncExternalStore(e, t, n);
};
A.useTransition = function() {
  return ve.current.useTransition();
};
A.version = "18.3.1";
Do.exports = A;
var y = Do.exports, Ro = { exports: {} }, be = {}, Fo = { exports: {} }, zo = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(D, P) {
    var I = D.length;
    D.push(P);
    e: for (; 0 < I; ) {
      var z = I - 1 >>> 1, K = D[z];
      if (0 < l(K, P)) D[z] = P, D[I] = K, I = z;
      else break e;
    }
  }
  function n(D) {
    return D.length === 0 ? null : D[0];
  }
  function r(D) {
    if (D.length === 0) return null;
    var P = D[0], I = D.pop();
    if (I !== P) {
      D[0] = I;
      e: for (var z = 0, K = D.length, Zt = K >>> 1; z < Zt; ) {
        var Ae = 2 * (z + 1) - 1, Pn = D[Ae], et = Ae + 1, Lt = D[et];
        if (0 > l(Pn, I)) et < K && 0 > l(Lt, Pn) ? (D[z] = Lt, D[et] = I, z = et) : (D[z] = Pn, D[Ae] = I, z = Ae);
        else if (et < K && 0 > l(Lt, I)) D[z] = Lt, D[et] = I, z = et;
        else break e;
      }
    }
    return P;
  }
  function l(D, P) {
    var I = D.sortIndex - P.sortIndex;
    return I !== 0 ? I : D.id - P.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var a = performance;
    e.unstable_now = function() {
      return a.now();
    };
  } else {
    var i = Date, o = i.now();
    e.unstable_now = function() {
      return i.now() - o;
    };
  }
  var c = [], u = [], h = 1, f = null, d = 3, g = !1, j = !1, N = !1, w = typeof setTimeout == "function" ? setTimeout : null, p = typeof clearTimeout == "function" ? clearTimeout : null, m = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function v(D) {
    for (var P = n(u); P !== null; ) {
      if (P.callback === null) r(u);
      else if (P.startTime <= D) r(u), P.sortIndex = P.expirationTime, t(c, P);
      else break;
      P = n(u);
    }
  }
  function x(D) {
    if (N = !1, v(D), !j) if (n(c) !== null) j = !0, Xt(S);
    else {
      var P = n(u);
      P !== null && qe(x, P.startTime - D);
    }
  }
  function S(D, P) {
    j = !1, N && (N = !1, p(L), L = -1), g = !0;
    var I = d;
    try {
      for (v(P), f = n(c); f !== null && (!(f.expirationTime > P) || D && !ee()); ) {
        var z = f.callback;
        if (typeof z == "function") {
          f.callback = null, d = f.priorityLevel;
          var K = z(f.expirationTime <= P);
          P = e.unstable_now(), typeof K == "function" ? f.callback = K : f === n(c) && r(c), v(P);
        } else r(c);
        f = n(c);
      }
      if (f !== null) var Zt = !0;
      else {
        var Ae = n(u);
        Ae !== null && qe(x, Ae.startTime - P), Zt = !1;
      }
      return Zt;
    } finally {
      f = null, d = I, g = !1;
    }
  }
  var b = !1, T = null, L = -1, R = 5, E = -1;
  function ee() {
    return !(e.unstable_now() - E < R);
  }
  function dt() {
    if (T !== null) {
      var D = e.unstable_now();
      E = D;
      var P = !0;
      try {
        P = T(!0, D);
      } finally {
        P ? Je() : (b = !1, T = null);
      }
    } else b = !1;
  }
  var Je;
  if (typeof m == "function") Je = function() {
    m(dt);
  };
  else if (typeof MessageChannel < "u") {
    var Ln = new MessageChannel(), Cr = Ln.port2;
    Ln.port1.onmessage = dt, Je = function() {
      Cr.postMessage(null);
    };
  } else Je = function() {
    w(dt, 0);
  };
  function Xt(D) {
    T = D, b || (b = !0, Je());
  }
  function qe(D, P) {
    L = w(function() {
      D(e.unstable_now());
    }, P);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(D) {
    D.callback = null;
  }, e.unstable_continueExecution = function() {
    j || g || (j = !0, Xt(S));
  }, e.unstable_forceFrameRate = function(D) {
    0 > D || 125 < D ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : R = 0 < D ? Math.floor(1e3 / D) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return d;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(c);
  }, e.unstable_next = function(D) {
    switch (d) {
      case 1:
      case 2:
      case 3:
        var P = 3;
        break;
      default:
        P = d;
    }
    var I = d;
    d = P;
    try {
      return D();
    } finally {
      d = I;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(D, P) {
    switch (D) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        D = 3;
    }
    var I = d;
    d = D;
    try {
      return P();
    } finally {
      d = I;
    }
  }, e.unstable_scheduleCallback = function(D, P, I) {
    var z = e.unstable_now();
    switch (typeof I == "object" && I !== null ? (I = I.delay, I = typeof I == "number" && 0 < I ? z + I : z) : I = z, D) {
      case 1:
        var K = -1;
        break;
      case 2:
        K = 250;
        break;
      case 5:
        K = 1073741823;
        break;
      case 4:
        K = 1e4;
        break;
      default:
        K = 5e3;
    }
    return K = I + K, D = { id: h++, callback: P, priorityLevel: D, startTime: I, expirationTime: K, sortIndex: -1 }, I > z ? (D.sortIndex = I, t(u, D), n(c) === null && D === n(u) && (N ? (p(L), L = -1) : N = !0, qe(x, I - z))) : (D.sortIndex = K, t(c, D), j || g || (j = !0, Xt(S))), D;
  }, e.unstable_shouldYield = ee, e.unstable_wrapCallback = function(D) {
    var P = d;
    return function() {
      var I = d;
      d = P;
      try {
        return D.apply(this, arguments);
      } finally {
        d = I;
      }
    };
  };
})(zo);
Fo.exports = zo;
var Ld = Fo.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Pd = y, Ee = Ld;
function k(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Bo = /* @__PURE__ */ new Set(), rr = {};
function Yt(e, t) {
  wn(e, t), wn(e + "Capture", t);
}
function wn(e, t) {
  for (rr[e] = t, e = 0; e < t.length; e++) Bo.add(t[e]);
}
var at = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), yl = Object.prototype.hasOwnProperty, Id = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, ci = {}, ui = {};
function $d(e) {
  return yl.call(ui, e) ? !0 : yl.call(ci, e) ? !1 : Id.test(e) ? ui[e] = !0 : (ci[e] = !0, !1);
}
function Ad(e, t, n, r) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return r ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function Od(e, t, n, r) {
  if (t === null || typeof t > "u" || Ad(e, t, n, r)) return !0;
  if (r) return !1;
  if (n !== null) switch (n.type) {
    case 3:
      return !t;
    case 4:
      return t === !1;
    case 5:
      return isNaN(t);
    case 6:
      return isNaN(t) || 1 > t;
  }
  return !1;
}
function ge(e, t, n, r, l, a, i) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = a, this.removeEmptyString = i;
}
var ie = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  ie[e] = new ge(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  ie[t] = new ge(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  ie[e] = new ge(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  ie[e] = new ge(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  ie[e] = new ge(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  ie[e] = new ge(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  ie[e] = new ge(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  ie[e] = new ge(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  ie[e] = new ge(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var pa = /[\-:]([a-z])/g;
function ha(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    pa,
    ha
  );
  ie[t] = new ge(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(pa, ha);
  ie[t] = new ge(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(pa, ha);
  ie[t] = new ge(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  ie[e] = new ge(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
ie.xlinkHref = new ge("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  ie[e] = new ge(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function va(e, t, n, r) {
  var l = ie.hasOwnProperty(t) ? ie[t] : null;
  (l !== null ? l.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (Od(t, n, l, r) && (n = null), r || l === null ? $d(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, r = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var ut = Pd.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, br = Symbol.for("react.element"), nn = Symbol.for("react.portal"), rn = Symbol.for("react.fragment"), ga = Symbol.for("react.strict_mode"), xl = Symbol.for("react.profiler"), Uo = Symbol.for("react.provider"), Vo = Symbol.for("react.context"), ya = Symbol.for("react.forward_ref"), jl = Symbol.for("react.suspense"), Nl = Symbol.for("react.suspense_list"), xa = Symbol.for("react.memo"), ft = Symbol.for("react.lazy"), Ho = Symbol.for("react.offscreen"), di = Symbol.iterator;
function $n(e) {
  return e === null || typeof e != "object" ? null : (e = di && e[di] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Q = Object.assign, Ws;
function Hn(e) {
  if (Ws === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    Ws = t && t[1] || "";
  }
  return `
` + Ws + e;
}
var qs = !1;
function Qs(e, t) {
  if (!e || qs) return "";
  qs = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t) if (t = function() {
      throw Error();
    }, Object.defineProperty(t.prototype, "props", { set: function() {
      throw Error();
    } }), typeof Reflect == "object" && Reflect.construct) {
      try {
        Reflect.construct(t, []);
      } catch (u) {
        var r = u;
      }
      Reflect.construct(e, [], t);
    } else {
      try {
        t.call();
      } catch (u) {
        r = u;
      }
      e.call(t.prototype);
    }
    else {
      try {
        throw Error();
      } catch (u) {
        r = u;
      }
      e();
    }
  } catch (u) {
    if (u && r && typeof u.stack == "string") {
      for (var l = u.stack.split(`
`), a = r.stack.split(`
`), i = l.length - 1, o = a.length - 1; 1 <= i && 0 <= o && l[i] !== a[o]; ) o--;
      for (; 1 <= i && 0 <= o; i--, o--) if (l[i] !== a[o]) {
        if (i !== 1 || o !== 1)
          do
            if (i--, o--, 0 > o || l[i] !== a[o]) {
              var c = `
` + l[i].replace(" at new ", " at ");
              return e.displayName && c.includes("<anonymous>") && (c = c.replace("<anonymous>", e.displayName)), c;
            }
          while (1 <= i && 0 <= o);
        break;
      }
    }
  } finally {
    qs = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? Hn(e) : "";
}
function Rd(e) {
  switch (e.tag) {
    case 5:
      return Hn(e.type);
    case 16:
      return Hn("Lazy");
    case 13:
      return Hn("Suspense");
    case 19:
      return Hn("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = Qs(e.type, !1), e;
    case 11:
      return e = Qs(e.type.render, !1), e;
    case 1:
      return e = Qs(e.type, !0), e;
    default:
      return "";
  }
}
function wl(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case rn:
      return "Fragment";
    case nn:
      return "Portal";
    case xl:
      return "Profiler";
    case ga:
      return "StrictMode";
    case jl:
      return "Suspense";
    case Nl:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Vo:
      return (e.displayName || "Context") + ".Consumer";
    case Uo:
      return (e._context.displayName || "Context") + ".Provider";
    case ya:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case xa:
      return t = e.displayName || null, t !== null ? t : wl(e.type) || "Memo";
    case ft:
      t = e._payload, e = e._init;
      try {
        return wl(e(t));
      } catch {
      }
  }
  return null;
}
function Fd(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return wl(t);
    case 8:
      return t === ga ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function") return t.displayName || t.name || null;
      if (typeof t == "string") return t;
  }
  return null;
}
function bt(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function Wo(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function zd(e) {
  var t = Wo(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var l = n.get, a = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return l.call(this);
    }, set: function(i) {
      r = "" + i, a.call(this, i);
    } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
      return r;
    }, setValue: function(i) {
      r = "" + i;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function Tr(e) {
  e._valueTracker || (e._valueTracker = zd(e));
}
function qo(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), r = "";
  return e && (r = Wo(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
}
function ns(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function kl(e, t) {
  var n = t.checked;
  return Q({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function mi(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
  n = bt(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Qo(e, t) {
  t = t.checked, t != null && va(e, "checked", t, !1);
}
function Sl(e, t) {
  Qo(e, t);
  var n = bt(t.value), r = t.type;
  if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? Cl(e, t.type, n) : t.hasOwnProperty("defaultValue") && Cl(e, t.type, bt(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function fi(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function Cl(e, t, n) {
  (t !== "number" || ns(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var Wn = Array.isArray;
function vn(e, t, n, r) {
  if (e = e.options, t) {
    t = {};
    for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
    for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + bt(n), t = null, l = 0; l < e.length; l++) {
      if (e[l].value === n) {
        e[l].selected = !0, r && (e[l].defaultSelected = !0);
        return;
      }
      t !== null || e[l].disabled || (t = e[l]);
    }
    t !== null && (t.selected = !0);
  }
}
function El(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(k(91));
  return Q({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function pi(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(k(92));
      if (Wn(n)) {
        if (1 < n.length) throw Error(k(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: bt(n) };
}
function Ko(e, t) {
  var n = bt(t.value), r = bt(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
}
function hi(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Yo(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function bl(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Yo(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Dr, Go = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, l) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, r, l);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (Dr = Dr || document.createElement("div"), Dr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Dr.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function sr(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Kn = {
  animationIterationCount: !0,
  aspectRatio: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridArea: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, Bd = ["Webkit", "ms", "Moz", "O"];
Object.keys(Kn).forEach(function(e) {
  Bd.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), Kn[t] = Kn[e];
  });
});
function Xo(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Kn.hasOwnProperty(e) && Kn[e] ? ("" + t).trim() : t + "px";
}
function Zo(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var r = n.indexOf("--") === 0, l = Xo(n, t[n], r);
    n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : e[n] = l;
  }
}
var Ud = Q({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function Tl(e, t) {
  if (t) {
    if (Ud[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(k(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(k(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(k(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(k(62));
  }
}
function Dl(e, t) {
  if (e.indexOf("-") === -1) return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var _l = null;
function ja(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var Ml = null, gn = null, yn = null;
function vi(e) {
  if (e = kr(e)) {
    if (typeof Ml != "function") throw Error(k(280));
    var t = e.stateNode;
    t && (t = _s(t), Ml(e.stateNode, e.type, t));
  }
}
function Jo(e) {
  gn ? yn ? yn.push(e) : yn = [e] : gn = e;
}
function ec() {
  if (gn) {
    var e = gn, t = yn;
    if (yn = gn = null, vi(e), t) for (e = 0; e < t.length; e++) vi(t[e]);
  }
}
function tc(e, t) {
  return e(t);
}
function nc() {
}
var Ks = !1;
function rc(e, t, n) {
  if (Ks) return e(t, n);
  Ks = !0;
  try {
    return tc(e, t, n);
  } finally {
    Ks = !1, (gn !== null || yn !== null) && (nc(), ec());
  }
}
function lr(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = _s(n);
  if (r === null) return null;
  n = r[t];
  e: switch (t) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != "function") throw Error(k(231, t, typeof n));
  return n;
}
var Ll = !1;
if (at) try {
  var An = {};
  Object.defineProperty(An, "passive", { get: function() {
    Ll = !0;
  } }), window.addEventListener("test", An, An), window.removeEventListener("test", An, An);
} catch {
  Ll = !1;
}
function Vd(e, t, n, r, l, a, i, o, c) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, u);
  } catch (h) {
    this.onError(h);
  }
}
var Yn = !1, rs = null, ss = !1, Pl = null, Hd = { onError: function(e) {
  Yn = !0, rs = e;
} };
function Wd(e, t, n, r, l, a, i, o, c) {
  Yn = !1, rs = null, Vd.apply(Hd, arguments);
}
function qd(e, t, n, r, l, a, i, o, c) {
  if (Wd.apply(this, arguments), Yn) {
    if (Yn) {
      var u = rs;
      Yn = !1, rs = null;
    } else throw Error(k(198));
    ss || (ss = !0, Pl = u);
  }
}
function Gt(e) {
  var t = e, n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do
      t = e, t.flags & 4098 && (n = t.return), e = t.return;
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function sc(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function gi(e) {
  if (Gt(e) !== e) throw Error(k(188));
}
function Qd(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Gt(e), t === null) throw Error(k(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var l = n.return;
    if (l === null) break;
    var a = l.alternate;
    if (a === null) {
      if (r = l.return, r !== null) {
        n = r;
        continue;
      }
      break;
    }
    if (l.child === a.child) {
      for (a = l.child; a; ) {
        if (a === n) return gi(l), e;
        if (a === r) return gi(l), t;
        a = a.sibling;
      }
      throw Error(k(188));
    }
    if (n.return !== r.return) n = l, r = a;
    else {
      for (var i = !1, o = l.child; o; ) {
        if (o === n) {
          i = !0, n = l, r = a;
          break;
        }
        if (o === r) {
          i = !0, r = l, n = a;
          break;
        }
        o = o.sibling;
      }
      if (!i) {
        for (o = a.child; o; ) {
          if (o === n) {
            i = !0, n = a, r = l;
            break;
          }
          if (o === r) {
            i = !0, r = a, n = l;
            break;
          }
          o = o.sibling;
        }
        if (!i) throw Error(k(189));
      }
    }
    if (n.alternate !== r) throw Error(k(190));
  }
  if (n.tag !== 3) throw Error(k(188));
  return n.stateNode.current === n ? e : t;
}
function lc(e) {
  return e = Qd(e), e !== null ? ac(e) : null;
}
function ac(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = ac(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var ic = Ee.unstable_scheduleCallback, yi = Ee.unstable_cancelCallback, Kd = Ee.unstable_shouldYield, Yd = Ee.unstable_requestPaint, G = Ee.unstable_now, Gd = Ee.unstable_getCurrentPriorityLevel, Na = Ee.unstable_ImmediatePriority, oc = Ee.unstable_UserBlockingPriority, ls = Ee.unstable_NormalPriority, Xd = Ee.unstable_LowPriority, cc = Ee.unstable_IdlePriority, Es = null, Xe = null;
function Zd(e) {
  if (Xe && typeof Xe.onCommitFiberRoot == "function") try {
    Xe.onCommitFiberRoot(Es, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var Be = Math.clz32 ? Math.clz32 : tm, Jd = Math.log, em = Math.LN2;
function tm(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (Jd(e) / em | 0) | 0;
}
var _r = 64, Mr = 4194304;
function qn(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function as(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0, l = e.suspendedLanes, a = e.pingedLanes, i = n & 268435455;
  if (i !== 0) {
    var o = i & ~l;
    o !== 0 ? r = qn(o) : (a &= i, a !== 0 && (r = qn(a)));
  } else i = n & ~l, i !== 0 ? r = qn(i) : a !== 0 && (r = qn(a));
  if (r === 0) return 0;
  if (t !== 0 && t !== r && !(t & l) && (l = r & -r, a = t & -t, l >= a || l === 16 && (a & 4194240) !== 0)) return t;
  if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t; ) n = 31 - Be(t), l = 1 << n, r |= e[n], t &= ~l;
  return r;
}
function nm(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function rm(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, a = e.pendingLanes; 0 < a; ) {
    var i = 31 - Be(a), o = 1 << i, c = l[i];
    c === -1 ? (!(o & n) || o & r) && (l[i] = nm(o, t)) : c <= t && (e.expiredLanes |= o), a &= ~o;
  }
}
function Il(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function uc() {
  var e = _r;
  return _r <<= 1, !(_r & 4194240) && (_r = 64), e;
}
function Ys(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function Nr(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Be(t), e[t] = n;
}
function sm(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var l = 31 - Be(n), a = 1 << l;
    t[l] = 0, r[l] = -1, e[l] = -1, n &= ~a;
  }
}
function wa(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var r = 31 - Be(n), l = 1 << r;
    l & t | e[r] & t && (e[r] |= t), n &= ~l;
  }
}
var F = 0;
function dc(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var mc, ka, fc, pc, hc, $l = !1, Lr = [], xt = null, jt = null, Nt = null, ar = /* @__PURE__ */ new Map(), ir = /* @__PURE__ */ new Map(), ht = [], lm = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function xi(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      xt = null;
      break;
    case "dragenter":
    case "dragleave":
      jt = null;
      break;
    case "mouseover":
    case "mouseout":
      Nt = null;
      break;
    case "pointerover":
    case "pointerout":
      ar.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      ir.delete(t.pointerId);
  }
}
function On(e, t, n, r, l, a) {
  return e === null || e.nativeEvent !== a ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: a, targetContainers: [l] }, t !== null && (t = kr(t), t !== null && ka(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
}
function am(e, t, n, r, l) {
  switch (t) {
    case "focusin":
      return xt = On(xt, e, t, n, r, l), !0;
    case "dragenter":
      return jt = On(jt, e, t, n, r, l), !0;
    case "mouseover":
      return Nt = On(Nt, e, t, n, r, l), !0;
    case "pointerover":
      var a = l.pointerId;
      return ar.set(a, On(ar.get(a) || null, e, t, n, r, l)), !0;
    case "gotpointercapture":
      return a = l.pointerId, ir.set(a, On(ir.get(a) || null, e, t, n, r, l)), !0;
  }
  return !1;
}
function vc(e) {
  var t = Rt(e.target);
  if (t !== null) {
    var n = Gt(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = sc(n), t !== null) {
          e.blockedOn = t, hc(e.priority, function() {
            fc(n);
          });
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function qr(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Al(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      _l = r, n.target.dispatchEvent(r), _l = null;
    } else return t = kr(n), t !== null && ka(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function ji(e, t, n) {
  qr(e) && n.delete(t);
}
function im() {
  $l = !1, xt !== null && qr(xt) && (xt = null), jt !== null && qr(jt) && (jt = null), Nt !== null && qr(Nt) && (Nt = null), ar.forEach(ji), ir.forEach(ji);
}
function Rn(e, t) {
  e.blockedOn === t && (e.blockedOn = null, $l || ($l = !0, Ee.unstable_scheduleCallback(Ee.unstable_NormalPriority, im)));
}
function or(e) {
  function t(l) {
    return Rn(l, e);
  }
  if (0 < Lr.length) {
    Rn(Lr[0], e);
    for (var n = 1; n < Lr.length; n++) {
      var r = Lr[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (xt !== null && Rn(xt, e), jt !== null && Rn(jt, e), Nt !== null && Rn(Nt, e), ar.forEach(t), ir.forEach(t), n = 0; n < ht.length; n++) r = ht[n], r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < ht.length && (n = ht[0], n.blockedOn === null); ) vc(n), n.blockedOn === null && ht.shift();
}
var xn = ut.ReactCurrentBatchConfig, is = !0;
function om(e, t, n, r) {
  var l = F, a = xn.transition;
  xn.transition = null;
  try {
    F = 1, Sa(e, t, n, r);
  } finally {
    F = l, xn.transition = a;
  }
}
function cm(e, t, n, r) {
  var l = F, a = xn.transition;
  xn.transition = null;
  try {
    F = 4, Sa(e, t, n, r);
  } finally {
    F = l, xn.transition = a;
  }
}
function Sa(e, t, n, r) {
  if (is) {
    var l = Al(e, t, n, r);
    if (l === null) ll(e, t, r, os, n), xi(e, r);
    else if (am(l, e, t, n, r)) r.stopPropagation();
    else if (xi(e, r), t & 4 && -1 < lm.indexOf(e)) {
      for (; l !== null; ) {
        var a = kr(l);
        if (a !== null && mc(a), a = Al(e, t, n, r), a === null && ll(e, t, r, os, n), a === l) break;
        l = a;
      }
      l !== null && r.stopPropagation();
    } else ll(e, t, r, null, n);
  }
}
var os = null;
function Al(e, t, n, r) {
  if (os = null, e = ja(r), e = Rt(e), e !== null) if (t = Gt(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = sc(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return os = e, null;
}
function gc(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (Gd()) {
        case Na:
          return 1;
        case oc:
          return 4;
        case ls:
        case Xd:
          return 16;
        case cc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var gt = null, Ca = null, Qr = null;
function yc() {
  if (Qr) return Qr;
  var e, t = Ca, n = t.length, r, l = "value" in gt ? gt.value : gt.textContent, a = l.length;
  for (e = 0; e < n && t[e] === l[e]; e++) ;
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === l[a - r]; r++) ;
  return Qr = l.slice(e, 1 < r ? 1 - r : void 0);
}
function Kr(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Pr() {
  return !0;
}
function Ni() {
  return !1;
}
function Te(e) {
  function t(n, r, l, a, i) {
    this._reactName = n, this._targetInst = l, this.type = r, this.nativeEvent = a, this.target = i, this.currentTarget = null;
    for (var o in e) e.hasOwnProperty(o) && (n = e[o], this[o] = n ? n(a) : a[o]);
    return this.isDefaultPrevented = (a.defaultPrevented != null ? a.defaultPrevented : a.returnValue === !1) ? Pr : Ni, this.isPropagationStopped = Ni, this;
  }
  return Q(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Pr);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Pr);
  }, persist: function() {
  }, isPersistent: Pr }), t;
}
var _n = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, Ea = Te(_n), wr = Q({}, _n, { view: 0, detail: 0 }), um = Te(wr), Gs, Xs, Fn, bs = Q({}, wr, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: ba, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== Fn && (Fn && e.type === "mousemove" ? (Gs = e.screenX - Fn.screenX, Xs = e.screenY - Fn.screenY) : Xs = Gs = 0, Fn = e), Gs);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : Xs;
} }), wi = Te(bs), dm = Q({}, bs, { dataTransfer: 0 }), mm = Te(dm), fm = Q({}, wr, { relatedTarget: 0 }), Zs = Te(fm), pm = Q({}, _n, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), hm = Te(pm), vm = Q({}, _n, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), gm = Te(vm), ym = Q({}, _n, { data: 0 }), ki = Te(ym), xm = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, jm = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Nm = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function wm(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Nm[e]) ? !!t[e] : !1;
}
function ba() {
  return wm;
}
var km = Q({}, wr, { key: function(e) {
  if (e.key) {
    var t = xm[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = Kr(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? jm[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: ba, charCode: function(e) {
  return e.type === "keypress" ? Kr(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Kr(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), Sm = Te(km), Cm = Q({}, bs, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Si = Te(Cm), Em = Q({}, wr, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: ba }), bm = Te(Em), Tm = Q({}, _n, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Dm = Te(Tm), _m = Q({}, bs, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Mm = Te(_m), Lm = [9, 13, 27, 32], Ta = at && "CompositionEvent" in window, Gn = null;
at && "documentMode" in document && (Gn = document.documentMode);
var Pm = at && "TextEvent" in window && !Gn, xc = at && (!Ta || Gn && 8 < Gn && 11 >= Gn), Ci = " ", Ei = !1;
function jc(e, t) {
  switch (e) {
    case "keyup":
      return Lm.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function Nc(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var sn = !1;
function Im(e, t) {
  switch (e) {
    case "compositionend":
      return Nc(t);
    case "keypress":
      return t.which !== 32 ? null : (Ei = !0, Ci);
    case "textInput":
      return e = t.data, e === Ci && Ei ? null : e;
    default:
      return null;
  }
}
function $m(e, t) {
  if (sn) return e === "compositionend" || !Ta && jc(e, t) ? (e = yc(), Qr = Ca = gt = null, sn = !1, e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return xc && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Am = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function bi(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Am[e.type] : t === "textarea";
}
function wc(e, t, n, r) {
  Jo(r), t = cs(t, "onChange"), 0 < t.length && (n = new Ea("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
}
var Xn = null, cr = null;
function Om(e) {
  Pc(e, 0);
}
function Ts(e) {
  var t = on(e);
  if (qo(t)) return e;
}
function Rm(e, t) {
  if (e === "change") return t;
}
var kc = !1;
if (at) {
  var Js;
  if (at) {
    var el = "oninput" in document;
    if (!el) {
      var Ti = document.createElement("div");
      Ti.setAttribute("oninput", "return;"), el = typeof Ti.oninput == "function";
    }
    Js = el;
  } else Js = !1;
  kc = Js && (!document.documentMode || 9 < document.documentMode);
}
function Di() {
  Xn && (Xn.detachEvent("onpropertychange", Sc), cr = Xn = null);
}
function Sc(e) {
  if (e.propertyName === "value" && Ts(cr)) {
    var t = [];
    wc(t, cr, e, ja(e)), rc(Om, t);
  }
}
function Fm(e, t, n) {
  e === "focusin" ? (Di(), Xn = t, cr = n, Xn.attachEvent("onpropertychange", Sc)) : e === "focusout" && Di();
}
function zm(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return Ts(cr);
}
function Bm(e, t) {
  if (e === "click") return Ts(t);
}
function Um(e, t) {
  if (e === "input" || e === "change") return Ts(t);
}
function Vm(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var He = typeof Object.is == "function" ? Object.is : Vm;
function ur(e, t) {
  if (He(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var l = n[r];
    if (!yl.call(t, l) || !He(e[l], t[l])) return !1;
  }
  return !0;
}
function _i(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function Mi(e, t) {
  var n = _i(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (r = e + n.textContent.length, e <= t && r >= t) return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = _i(n);
  }
}
function Cc(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Cc(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Ec() {
  for (var e = window, t = ns(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = ns(e.document);
  }
  return t;
}
function Da(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function Hm(e) {
  var t = Ec(), n = e.focusedElem, r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && Cc(n.ownerDocument.documentElement, n)) {
    if (r !== null && Da(n)) {
      if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var l = n.textContent.length, a = Math.min(r.start, l);
        r = r.end === void 0 ? a : Math.min(r.end, l), !e.extend && a > r && (l = r, r = a, a = l), l = Mi(n, a);
        var i = Mi(
          n,
          r
        );
        l && i && (e.rangeCount !== 1 || e.anchorNode !== l.node || e.anchorOffset !== l.offset || e.focusNode !== i.node || e.focusOffset !== i.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), e.removeAllRanges(), a > r ? (e.addRange(t), e.extend(i.node, i.offset)) : (t.setEnd(i.node, i.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var Wm = at && "documentMode" in document && 11 >= document.documentMode, ln = null, Ol = null, Zn = null, Rl = !1;
function Li(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  Rl || ln == null || ln !== ns(r) || (r = ln, "selectionStart" in r && Da(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), Zn && ur(Zn, r) || (Zn = r, r = cs(Ol, "onSelect"), 0 < r.length && (t = new Ea("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = ln)));
}
function Ir(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var an = { animationend: Ir("Animation", "AnimationEnd"), animationiteration: Ir("Animation", "AnimationIteration"), animationstart: Ir("Animation", "AnimationStart"), transitionend: Ir("Transition", "TransitionEnd") }, tl = {}, bc = {};
at && (bc = document.createElement("div").style, "AnimationEvent" in window || (delete an.animationend.animation, delete an.animationiteration.animation, delete an.animationstart.animation), "TransitionEvent" in window || delete an.transitionend.transition);
function Ds(e) {
  if (tl[e]) return tl[e];
  if (!an[e]) return e;
  var t = an[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in bc) return tl[e] = t[n];
  return e;
}
var Tc = Ds("animationend"), Dc = Ds("animationiteration"), _c = Ds("animationstart"), Mc = Ds("transitionend"), Lc = /* @__PURE__ */ new Map(), Pi = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Dt(e, t) {
  Lc.set(e, t), Yt(t, [e]);
}
for (var nl = 0; nl < Pi.length; nl++) {
  var rl = Pi[nl], qm = rl.toLowerCase(), Qm = rl[0].toUpperCase() + rl.slice(1);
  Dt(qm, "on" + Qm);
}
Dt(Tc, "onAnimationEnd");
Dt(Dc, "onAnimationIteration");
Dt(_c, "onAnimationStart");
Dt("dblclick", "onDoubleClick");
Dt("focusin", "onFocus");
Dt("focusout", "onBlur");
Dt(Mc, "onTransitionEnd");
wn("onMouseEnter", ["mouseout", "mouseover"]);
wn("onMouseLeave", ["mouseout", "mouseover"]);
wn("onPointerEnter", ["pointerout", "pointerover"]);
wn("onPointerLeave", ["pointerout", "pointerover"]);
Yt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Yt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Yt("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Yt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Yt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Yt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Qn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Km = new Set("cancel close invalid load scroll toggle".split(" ").concat(Qn));
function Ii(e, t, n) {
  var r = e.type || "unknown-event";
  e.currentTarget = n, qd(r, t, void 0, e), e.currentTarget = null;
}
function Pc(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n], l = r.event;
    r = r.listeners;
    e: {
      var a = void 0;
      if (t) for (var i = r.length - 1; 0 <= i; i--) {
        var o = r[i], c = o.instance, u = o.currentTarget;
        if (o = o.listener, c !== a && l.isPropagationStopped()) break e;
        Ii(l, o, u), a = c;
      }
      else for (i = 0; i < r.length; i++) {
        if (o = r[i], c = o.instance, u = o.currentTarget, o = o.listener, c !== a && l.isPropagationStopped()) break e;
        Ii(l, o, u), a = c;
      }
    }
  }
  if (ss) throw e = Pl, ss = !1, Pl = null, e;
}
function U(e, t) {
  var n = t[Vl];
  n === void 0 && (n = t[Vl] = /* @__PURE__ */ new Set());
  var r = e + "__bubble";
  n.has(r) || (Ic(t, e, 2, !1), n.add(r));
}
function sl(e, t, n) {
  var r = 0;
  t && (r |= 4), Ic(n, e, r, t);
}
var $r = "_reactListening" + Math.random().toString(36).slice(2);
function dr(e) {
  if (!e[$r]) {
    e[$r] = !0, Bo.forEach(function(n) {
      n !== "selectionchange" && (Km.has(n) || sl(n, !1, e), sl(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[$r] || (t[$r] = !0, sl("selectionchange", !1, t));
  }
}
function Ic(e, t, n, r) {
  switch (gc(t)) {
    case 1:
      var l = om;
      break;
    case 4:
      l = cm;
      break;
    default:
      l = Sa;
  }
  n = l.bind(null, t, n, e), l = void 0, !Ll || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), r ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
}
function ll(e, t, n, r, l) {
  var a = r;
  if (!(t & 1) && !(t & 2) && r !== null) e: for (; ; ) {
    if (r === null) return;
    var i = r.tag;
    if (i === 3 || i === 4) {
      var o = r.stateNode.containerInfo;
      if (o === l || o.nodeType === 8 && o.parentNode === l) break;
      if (i === 4) for (i = r.return; i !== null; ) {
        var c = i.tag;
        if ((c === 3 || c === 4) && (c = i.stateNode.containerInfo, c === l || c.nodeType === 8 && c.parentNode === l)) return;
        i = i.return;
      }
      for (; o !== null; ) {
        if (i = Rt(o), i === null) return;
        if (c = i.tag, c === 5 || c === 6) {
          r = a = i;
          continue e;
        }
        o = o.parentNode;
      }
    }
    r = r.return;
  }
  rc(function() {
    var u = a, h = ja(n), f = [];
    e: {
      var d = Lc.get(e);
      if (d !== void 0) {
        var g = Ea, j = e;
        switch (e) {
          case "keypress":
            if (Kr(n) === 0) break e;
          case "keydown":
          case "keyup":
            g = Sm;
            break;
          case "focusin":
            j = "focus", g = Zs;
            break;
          case "focusout":
            j = "blur", g = Zs;
            break;
          case "beforeblur":
          case "afterblur":
            g = Zs;
            break;
          case "click":
            if (n.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            g = wi;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            g = mm;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            g = bm;
            break;
          case Tc:
          case Dc:
          case _c:
            g = hm;
            break;
          case Mc:
            g = Dm;
            break;
          case "scroll":
            g = um;
            break;
          case "wheel":
            g = Mm;
            break;
          case "copy":
          case "cut":
          case "paste":
            g = gm;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            g = Si;
        }
        var N = (t & 4) !== 0, w = !N && e === "scroll", p = N ? d !== null ? d + "Capture" : null : d;
        N = [];
        for (var m = u, v; m !== null; ) {
          v = m;
          var x = v.stateNode;
          if (v.tag === 5 && x !== null && (v = x, p !== null && (x = lr(m, p), x != null && N.push(mr(m, x, v)))), w) break;
          m = m.return;
        }
        0 < N.length && (d = new g(d, j, null, n, h), f.push({ event: d, listeners: N }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (d = e === "mouseover" || e === "pointerover", g = e === "mouseout" || e === "pointerout", d && n !== _l && (j = n.relatedTarget || n.fromElement) && (Rt(j) || j[it])) break e;
        if ((g || d) && (d = h.window === h ? h : (d = h.ownerDocument) ? d.defaultView || d.parentWindow : window, g ? (j = n.relatedTarget || n.toElement, g = u, j = j ? Rt(j) : null, j !== null && (w = Gt(j), j !== w || j.tag !== 5 && j.tag !== 6) && (j = null)) : (g = null, j = u), g !== j)) {
          if (N = wi, x = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (N = Si, x = "onPointerLeave", p = "onPointerEnter", m = "pointer"), w = g == null ? d : on(g), v = j == null ? d : on(j), d = new N(x, m + "leave", g, n, h), d.target = w, d.relatedTarget = v, x = null, Rt(h) === u && (N = new N(p, m + "enter", j, n, h), N.target = v, N.relatedTarget = w, x = N), w = x, g && j) t: {
            for (N = g, p = j, m = 0, v = N; v; v = Jt(v)) m++;
            for (v = 0, x = p; x; x = Jt(x)) v++;
            for (; 0 < m - v; ) N = Jt(N), m--;
            for (; 0 < v - m; ) p = Jt(p), v--;
            for (; m--; ) {
              if (N === p || p !== null && N === p.alternate) break t;
              N = Jt(N), p = Jt(p);
            }
            N = null;
          }
          else N = null;
          g !== null && $i(f, d, g, N, !1), j !== null && w !== null && $i(f, w, j, N, !0);
        }
      }
      e: {
        if (d = u ? on(u) : window, g = d.nodeName && d.nodeName.toLowerCase(), g === "select" || g === "input" && d.type === "file") var S = Rm;
        else if (bi(d)) if (kc) S = Um;
        else {
          S = zm;
          var b = Fm;
        }
        else (g = d.nodeName) && g.toLowerCase() === "input" && (d.type === "checkbox" || d.type === "radio") && (S = Bm);
        if (S && (S = S(e, u))) {
          wc(f, S, n, h);
          break e;
        }
        b && b(e, d, u), e === "focusout" && (b = d._wrapperState) && b.controlled && d.type === "number" && Cl(d, "number", d.value);
      }
      switch (b = u ? on(u) : window, e) {
        case "focusin":
          (bi(b) || b.contentEditable === "true") && (ln = b, Ol = u, Zn = null);
          break;
        case "focusout":
          Zn = Ol = ln = null;
          break;
        case "mousedown":
          Rl = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Rl = !1, Li(f, n, h);
          break;
        case "selectionchange":
          if (Wm) break;
        case "keydown":
        case "keyup":
          Li(f, n, h);
      }
      var T;
      if (Ta) e: {
        switch (e) {
          case "compositionstart":
            var L = "onCompositionStart";
            break e;
          case "compositionend":
            L = "onCompositionEnd";
            break e;
          case "compositionupdate":
            L = "onCompositionUpdate";
            break e;
        }
        L = void 0;
      }
      else sn ? jc(e, n) && (L = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (L = "onCompositionStart");
      L && (xc && n.locale !== "ko" && (sn || L !== "onCompositionStart" ? L === "onCompositionEnd" && sn && (T = yc()) : (gt = h, Ca = "value" in gt ? gt.value : gt.textContent, sn = !0)), b = cs(u, L), 0 < b.length && (L = new ki(L, e, null, n, h), f.push({ event: L, listeners: b }), T ? L.data = T : (T = Nc(n), T !== null && (L.data = T)))), (T = Pm ? Im(e, n) : $m(e, n)) && (u = cs(u, "onBeforeInput"), 0 < u.length && (h = new ki("onBeforeInput", "beforeinput", null, n, h), f.push({ event: h, listeners: u }), h.data = T));
    }
    Pc(f, t);
  });
}
function mr(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function cs(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var l = e, a = l.stateNode;
    l.tag === 5 && a !== null && (l = a, a = lr(e, n), a != null && r.unshift(mr(e, a, l)), a = lr(e, t), a != null && r.push(mr(e, a, l))), e = e.return;
  }
  return r;
}
function Jt(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function $i(e, t, n, r, l) {
  for (var a = t._reactName, i = []; n !== null && n !== r; ) {
    var o = n, c = o.alternate, u = o.stateNode;
    if (c !== null && c === r) break;
    o.tag === 5 && u !== null && (o = u, l ? (c = lr(n, a), c != null && i.unshift(mr(n, c, o))) : l || (c = lr(n, a), c != null && i.push(mr(n, c, o)))), n = n.return;
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var Ym = /\r\n?/g, Gm = /\u0000|\uFFFD/g;
function Ai(e) {
  return (typeof e == "string" ? e : "" + e).replace(Ym, `
`).replace(Gm, "");
}
function Ar(e, t, n) {
  if (t = Ai(t), Ai(e) !== t && n) throw Error(k(425));
}
function us() {
}
var Fl = null, zl = null;
function Bl(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var Ul = typeof setTimeout == "function" ? setTimeout : void 0, Xm = typeof clearTimeout == "function" ? clearTimeout : void 0, Oi = typeof Promise == "function" ? Promise : void 0, Zm = typeof queueMicrotask == "function" ? queueMicrotask : typeof Oi < "u" ? function(e) {
  return Oi.resolve(null).then(e).catch(Jm);
} : Ul;
function Jm(e) {
  setTimeout(function() {
    throw e;
  });
}
function al(e, t) {
  var n = t, r = 0;
  do {
    var l = n.nextSibling;
    if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
      if (r === 0) {
        e.removeChild(l), or(t);
        return;
      }
      r--;
    } else n !== "$" && n !== "$?" && n !== "$!" || r++;
    n = l;
  } while (n);
  or(t);
}
function wt(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
      if (t === "/$") return null;
    }
  }
  return e;
}
function Ri(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0) return e;
        t--;
      } else n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var Mn = Math.random().toString(36).slice(2), Ge = "__reactFiber$" + Mn, fr = "__reactProps$" + Mn, it = "__reactContainer$" + Mn, Vl = "__reactEvents$" + Mn, ef = "__reactListeners$" + Mn, tf = "__reactHandles$" + Mn;
function Rt(e) {
  var t = e[Ge];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[it] || n[Ge]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Ri(e); e !== null; ) {
        if (n = e[Ge]) return n;
        e = Ri(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function kr(e) {
  return e = e[Ge] || e[it], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function on(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(k(33));
}
function _s(e) {
  return e[fr] || null;
}
var Hl = [], cn = -1;
function _t(e) {
  return { current: e };
}
function V(e) {
  0 > cn || (e.current = Hl[cn], Hl[cn] = null, cn--);
}
function B(e, t) {
  cn++, Hl[cn] = e.current, e.current = t;
}
var Tt = {}, me = _t(Tt), je = _t(!1), Ht = Tt;
function kn(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Tt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
  var l = {}, a;
  for (a in n) l[a] = t[a];
  return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
}
function Ne(e) {
  return e = e.childContextTypes, e != null;
}
function ds() {
  V(je), V(me);
}
function Fi(e, t, n) {
  if (me.current !== Tt) throw Error(k(168));
  B(me, t), B(je, n);
}
function $c(e, t, n) {
  var r = e.stateNode;
  if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
  r = r.getChildContext();
  for (var l in r) if (!(l in t)) throw Error(k(108, Fd(e) || "Unknown", l));
  return Q({}, n, r);
}
function ms(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Tt, Ht = me.current, B(me, e), B(je, je.current), !0;
}
function zi(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(k(169));
  n ? (e = $c(e, t, Ht), r.__reactInternalMemoizedMergedChildContext = e, V(je), V(me), B(me, e)) : V(je), B(je, n);
}
var nt = null, Ms = !1, il = !1;
function Ac(e) {
  nt === null ? nt = [e] : nt.push(e);
}
function nf(e) {
  Ms = !0, Ac(e);
}
function Mt() {
  if (!il && nt !== null) {
    il = !0;
    var e = 0, t = F;
    try {
      var n = nt;
      for (F = 1; e < n.length; e++) {
        var r = n[e];
        do
          r = r(!0);
        while (r !== null);
      }
      nt = null, Ms = !1;
    } catch (l) {
      throw nt !== null && (nt = nt.slice(e + 1)), ic(Na, Mt), l;
    } finally {
      F = t, il = !1;
    }
  }
  return null;
}
var un = [], dn = 0, fs = null, ps = 0, De = [], _e = 0, Wt = null, rt = 1, st = "";
function At(e, t) {
  un[dn++] = ps, un[dn++] = fs, fs = e, ps = t;
}
function Oc(e, t, n) {
  De[_e++] = rt, De[_e++] = st, De[_e++] = Wt, Wt = e;
  var r = rt;
  e = st;
  var l = 32 - Be(r) - 1;
  r &= ~(1 << l), n += 1;
  var a = 32 - Be(t) + l;
  if (30 < a) {
    var i = l - l % 5;
    a = (r & (1 << i) - 1).toString(32), r >>= i, l -= i, rt = 1 << 32 - Be(t) + l | n << l | r, st = a + e;
  } else rt = 1 << a | n << l | r, st = e;
}
function _a(e) {
  e.return !== null && (At(e, 1), Oc(e, 1, 0));
}
function Ma(e) {
  for (; e === fs; ) fs = un[--dn], un[dn] = null, ps = un[--dn], un[dn] = null;
  for (; e === Wt; ) Wt = De[--_e], De[_e] = null, st = De[--_e], De[_e] = null, rt = De[--_e], De[_e] = null;
}
var Ce = null, Se = null, H = !1, ze = null;
function Rc(e, t) {
  var n = Me(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function Bi(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Ce = e, Se = wt(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Ce = e, Se = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = Wt !== null ? { id: rt, overflow: st } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = Me(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Ce = e, Se = null, !0) : !1;
    default:
      return !1;
  }
}
function Wl(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function ql(e) {
  if (H) {
    var t = Se;
    if (t) {
      var n = t;
      if (!Bi(e, t)) {
        if (Wl(e)) throw Error(k(418));
        t = wt(n.nextSibling);
        var r = Ce;
        t && Bi(e, t) ? Rc(r, n) : (e.flags = e.flags & -4097 | 2, H = !1, Ce = e);
      }
    } else {
      if (Wl(e)) throw Error(k(418));
      e.flags = e.flags & -4097 | 2, H = !1, Ce = e;
    }
  }
}
function Ui(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Ce = e;
}
function Or(e) {
  if (e !== Ce) return !1;
  if (!H) return Ui(e), H = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Bl(e.type, e.memoizedProps)), t && (t = Se)) {
    if (Wl(e)) throw Fc(), Error(k(418));
    for (; t; ) Rc(e, t), t = wt(t.nextSibling);
  }
  if (Ui(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(k(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Se = wt(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Se = null;
    }
  } else Se = Ce ? wt(e.stateNode.nextSibling) : null;
  return !0;
}
function Fc() {
  for (var e = Se; e; ) e = wt(e.nextSibling);
}
function Sn() {
  Se = Ce = null, H = !1;
}
function La(e) {
  ze === null ? ze = [e] : ze.push(e);
}
var rf = ut.ReactCurrentBatchConfig;
function zn(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(k(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(k(147, e));
      var l = r, a = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : (t = function(i) {
        var o = l.refs;
        i === null ? delete o[a] : o[a] = i;
      }, t._stringRef = a, t);
    }
    if (typeof e != "string") throw Error(k(284));
    if (!n._owner) throw Error(k(290, e));
  }
  return e;
}
function Rr(e, t) {
  throw e = Object.prototype.toString.call(t), Error(k(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function Vi(e) {
  var t = e._init;
  return t(e._payload);
}
function zc(e) {
  function t(p, m) {
    if (e) {
      var v = p.deletions;
      v === null ? (p.deletions = [m], p.flags |= 16) : v.push(m);
    }
  }
  function n(p, m) {
    if (!e) return null;
    for (; m !== null; ) t(p, m), m = m.sibling;
    return null;
  }
  function r(p, m) {
    for (p = /* @__PURE__ */ new Map(); m !== null; ) m.key !== null ? p.set(m.key, m) : p.set(m.index, m), m = m.sibling;
    return p;
  }
  function l(p, m) {
    return p = Et(p, m), p.index = 0, p.sibling = null, p;
  }
  function a(p, m, v) {
    return p.index = v, e ? (v = p.alternate, v !== null ? (v = v.index, v < m ? (p.flags |= 2, m) : v) : (p.flags |= 2, m)) : (p.flags |= 1048576, m);
  }
  function i(p) {
    return e && p.alternate === null && (p.flags |= 2), p;
  }
  function o(p, m, v, x) {
    return m === null || m.tag !== 6 ? (m = pl(v, p.mode, x), m.return = p, m) : (m = l(m, v), m.return = p, m);
  }
  function c(p, m, v, x) {
    var S = v.type;
    return S === rn ? h(p, m, v.props.children, x, v.key) : m !== null && (m.elementType === S || typeof S == "object" && S !== null && S.$$typeof === ft && Vi(S) === m.type) ? (x = l(m, v.props), x.ref = zn(p, m, v), x.return = p, x) : (x = ts(v.type, v.key, v.props, null, p.mode, x), x.ref = zn(p, m, v), x.return = p, x);
  }
  function u(p, m, v, x) {
    return m === null || m.tag !== 4 || m.stateNode.containerInfo !== v.containerInfo || m.stateNode.implementation !== v.implementation ? (m = hl(v, p.mode, x), m.return = p, m) : (m = l(m, v.children || []), m.return = p, m);
  }
  function h(p, m, v, x, S) {
    return m === null || m.tag !== 7 ? (m = Vt(v, p.mode, x, S), m.return = p, m) : (m = l(m, v), m.return = p, m);
  }
  function f(p, m, v) {
    if (typeof m == "string" && m !== "" || typeof m == "number") return m = pl("" + m, p.mode, v), m.return = p, m;
    if (typeof m == "object" && m !== null) {
      switch (m.$$typeof) {
        case br:
          return v = ts(m.type, m.key, m.props, null, p.mode, v), v.ref = zn(p, null, m), v.return = p, v;
        case nn:
          return m = hl(m, p.mode, v), m.return = p, m;
        case ft:
          var x = m._init;
          return f(p, x(m._payload), v);
      }
      if (Wn(m) || $n(m)) return m = Vt(m, p.mode, v, null), m.return = p, m;
      Rr(p, m);
    }
    return null;
  }
  function d(p, m, v, x) {
    var S = m !== null ? m.key : null;
    if (typeof v == "string" && v !== "" || typeof v == "number") return S !== null ? null : o(p, m, "" + v, x);
    if (typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case br:
          return v.key === S ? c(p, m, v, x) : null;
        case nn:
          return v.key === S ? u(p, m, v, x) : null;
        case ft:
          return S = v._init, d(
            p,
            m,
            S(v._payload),
            x
          );
      }
      if (Wn(v) || $n(v)) return S !== null ? null : h(p, m, v, x, null);
      Rr(p, v);
    }
    return null;
  }
  function g(p, m, v, x, S) {
    if (typeof x == "string" && x !== "" || typeof x == "number") return p = p.get(v) || null, o(m, p, "" + x, S);
    if (typeof x == "object" && x !== null) {
      switch (x.$$typeof) {
        case br:
          return p = p.get(x.key === null ? v : x.key) || null, c(m, p, x, S);
        case nn:
          return p = p.get(x.key === null ? v : x.key) || null, u(m, p, x, S);
        case ft:
          var b = x._init;
          return g(p, m, v, b(x._payload), S);
      }
      if (Wn(x) || $n(x)) return p = p.get(v) || null, h(m, p, x, S, null);
      Rr(m, x);
    }
    return null;
  }
  function j(p, m, v, x) {
    for (var S = null, b = null, T = m, L = m = 0, R = null; T !== null && L < v.length; L++) {
      T.index > L ? (R = T, T = null) : R = T.sibling;
      var E = d(p, T, v[L], x);
      if (E === null) {
        T === null && (T = R);
        break;
      }
      e && T && E.alternate === null && t(p, T), m = a(E, m, L), b === null ? S = E : b.sibling = E, b = E, T = R;
    }
    if (L === v.length) return n(p, T), H && At(p, L), S;
    if (T === null) {
      for (; L < v.length; L++) T = f(p, v[L], x), T !== null && (m = a(T, m, L), b === null ? S = T : b.sibling = T, b = T);
      return H && At(p, L), S;
    }
    for (T = r(p, T); L < v.length; L++) R = g(T, p, L, v[L], x), R !== null && (e && R.alternate !== null && T.delete(R.key === null ? L : R.key), m = a(R, m, L), b === null ? S = R : b.sibling = R, b = R);
    return e && T.forEach(function(ee) {
      return t(p, ee);
    }), H && At(p, L), S;
  }
  function N(p, m, v, x) {
    var S = $n(v);
    if (typeof S != "function") throw Error(k(150));
    if (v = S.call(v), v == null) throw Error(k(151));
    for (var b = S = null, T = m, L = m = 0, R = null, E = v.next(); T !== null && !E.done; L++, E = v.next()) {
      T.index > L ? (R = T, T = null) : R = T.sibling;
      var ee = d(p, T, E.value, x);
      if (ee === null) {
        T === null && (T = R);
        break;
      }
      e && T && ee.alternate === null && t(p, T), m = a(ee, m, L), b === null ? S = ee : b.sibling = ee, b = ee, T = R;
    }
    if (E.done) return n(
      p,
      T
    ), H && At(p, L), S;
    if (T === null) {
      for (; !E.done; L++, E = v.next()) E = f(p, E.value, x), E !== null && (m = a(E, m, L), b === null ? S = E : b.sibling = E, b = E);
      return H && At(p, L), S;
    }
    for (T = r(p, T); !E.done; L++, E = v.next()) E = g(T, p, L, E.value, x), E !== null && (e && E.alternate !== null && T.delete(E.key === null ? L : E.key), m = a(E, m, L), b === null ? S = E : b.sibling = E, b = E);
    return e && T.forEach(function(dt) {
      return t(p, dt);
    }), H && At(p, L), S;
  }
  function w(p, m, v, x) {
    if (typeof v == "object" && v !== null && v.type === rn && v.key === null && (v = v.props.children), typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case br:
          e: {
            for (var S = v.key, b = m; b !== null; ) {
              if (b.key === S) {
                if (S = v.type, S === rn) {
                  if (b.tag === 7) {
                    n(p, b.sibling), m = l(b, v.props.children), m.return = p, p = m;
                    break e;
                  }
                } else if (b.elementType === S || typeof S == "object" && S !== null && S.$$typeof === ft && Vi(S) === b.type) {
                  n(p, b.sibling), m = l(b, v.props), m.ref = zn(p, b, v), m.return = p, p = m;
                  break e;
                }
                n(p, b);
                break;
              } else t(p, b);
              b = b.sibling;
            }
            v.type === rn ? (m = Vt(v.props.children, p.mode, x, v.key), m.return = p, p = m) : (x = ts(v.type, v.key, v.props, null, p.mode, x), x.ref = zn(p, m, v), x.return = p, p = x);
          }
          return i(p);
        case nn:
          e: {
            for (b = v.key; m !== null; ) {
              if (m.key === b) if (m.tag === 4 && m.stateNode.containerInfo === v.containerInfo && m.stateNode.implementation === v.implementation) {
                n(p, m.sibling), m = l(m, v.children || []), m.return = p, p = m;
                break e;
              } else {
                n(p, m);
                break;
              }
              else t(p, m);
              m = m.sibling;
            }
            m = hl(v, p.mode, x), m.return = p, p = m;
          }
          return i(p);
        case ft:
          return b = v._init, w(p, m, b(v._payload), x);
      }
      if (Wn(v)) return j(p, m, v, x);
      if ($n(v)) return N(p, m, v, x);
      Rr(p, v);
    }
    return typeof v == "string" && v !== "" || typeof v == "number" ? (v = "" + v, m !== null && m.tag === 6 ? (n(p, m.sibling), m = l(m, v), m.return = p, p = m) : (n(p, m), m = pl(v, p.mode, x), m.return = p, p = m), i(p)) : n(p, m);
  }
  return w;
}
var Cn = zc(!0), Bc = zc(!1), hs = _t(null), vs = null, mn = null, Pa = null;
function Ia() {
  Pa = mn = vs = null;
}
function $a(e) {
  var t = hs.current;
  V(hs), e._currentValue = t;
}
function Ql(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function jn(e, t) {
  vs = e, Pa = mn = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (xe = !0), e.firstContext = null);
}
function Ie(e) {
  var t = e._currentValue;
  if (Pa !== e) if (e = { context: e, memoizedValue: t, next: null }, mn === null) {
    if (vs === null) throw Error(k(308));
    mn = e, vs.dependencies = { lanes: 0, firstContext: e };
  } else mn = mn.next = e;
  return t;
}
var Ft = null;
function Aa(e) {
  Ft === null ? Ft = [e] : Ft.push(e);
}
function Uc(e, t, n, r) {
  var l = t.interleaved;
  return l === null ? (n.next = n, Aa(t)) : (n.next = l.next, l.next = n), t.interleaved = n, ot(e, r);
}
function ot(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var pt = !1;
function Oa(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function Vc(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function lt(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function kt(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (r = r.shared, O & 2) {
    var l = r.pending;
    return l === null ? t.next = t : (t.next = l.next, l.next = t), r.pending = t, ot(e, n);
  }
  return l = r.interleaved, l === null ? (t.next = t, Aa(r)) : (t.next = l.next, l.next = t), r.interleaved = t, ot(e, n);
}
function Yr(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, wa(e, n);
  }
}
function Hi(e, t) {
  var n = e.updateQueue, r = e.alternate;
  if (r !== null && (r = r.updateQueue, n === r)) {
    var l = null, a = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var i = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        a === null ? l = a = i : a = a.next = i, n = n.next;
      } while (n !== null);
      a === null ? l = a = t : a = a.next = t;
    } else l = a = t;
    n = { baseState: r.baseState, firstBaseUpdate: l, lastBaseUpdate: a, shared: r.shared, effects: r.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function gs(e, t, n, r) {
  var l = e.updateQueue;
  pt = !1;
  var a = l.firstBaseUpdate, i = l.lastBaseUpdate, o = l.shared.pending;
  if (o !== null) {
    l.shared.pending = null;
    var c = o, u = c.next;
    c.next = null, i === null ? a = u : i.next = u, i = c;
    var h = e.alternate;
    h !== null && (h = h.updateQueue, o = h.lastBaseUpdate, o !== i && (o === null ? h.firstBaseUpdate = u : o.next = u, h.lastBaseUpdate = c));
  }
  if (a !== null) {
    var f = l.baseState;
    i = 0, h = u = c = null, o = a;
    do {
      var d = o.lane, g = o.eventTime;
      if ((r & d) === d) {
        h !== null && (h = h.next = {
          eventTime: g,
          lane: 0,
          tag: o.tag,
          payload: o.payload,
          callback: o.callback,
          next: null
        });
        e: {
          var j = e, N = o;
          switch (d = t, g = n, N.tag) {
            case 1:
              if (j = N.payload, typeof j == "function") {
                f = j.call(g, f, d);
                break e;
              }
              f = j;
              break e;
            case 3:
              j.flags = j.flags & -65537 | 128;
            case 0:
              if (j = N.payload, d = typeof j == "function" ? j.call(g, f, d) : j, d == null) break e;
              f = Q({}, f, d);
              break e;
            case 2:
              pt = !0;
          }
        }
        o.callback !== null && o.lane !== 0 && (e.flags |= 64, d = l.effects, d === null ? l.effects = [o] : d.push(o));
      } else g = { eventTime: g, lane: d, tag: o.tag, payload: o.payload, callback: o.callback, next: null }, h === null ? (u = h = g, c = f) : h = h.next = g, i |= d;
      if (o = o.next, o === null) {
        if (o = l.shared.pending, o === null) break;
        d = o, o = d.next, d.next = null, l.lastBaseUpdate = d, l.shared.pending = null;
      }
    } while (!0);
    if (h === null && (c = f), l.baseState = c, l.firstBaseUpdate = u, l.lastBaseUpdate = h, t = l.shared.interleaved, t !== null) {
      l = t;
      do
        i |= l.lane, l = l.next;
      while (l !== t);
    } else a === null && (l.shared.lanes = 0);
    Qt |= i, e.lanes = i, e.memoizedState = f;
  }
}
function Wi(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var r = e[t], l = r.callback;
    if (l !== null) {
      if (r.callback = null, r = n, typeof l != "function") throw Error(k(191, l));
      l.call(r);
    }
  }
}
var Sr = {}, Ze = _t(Sr), pr = _t(Sr), hr = _t(Sr);
function zt(e) {
  if (e === Sr) throw Error(k(174));
  return e;
}
function Ra(e, t) {
  switch (B(hr, t), B(pr, e), B(Ze, Sr), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : bl(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = bl(t, e);
  }
  V(Ze), B(Ze, t);
}
function En() {
  V(Ze), V(pr), V(hr);
}
function Hc(e) {
  zt(hr.current);
  var t = zt(Ze.current), n = bl(t, e.type);
  t !== n && (B(pr, e), B(Ze, n));
}
function Fa(e) {
  pr.current === e && (V(Ze), V(pr));
}
var W = _t(0);
function ys(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      t.child.return = t, t = t.child;
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    t.sibling.return = t.return, t = t.sibling;
  }
  return null;
}
var ol = [];
function za() {
  for (var e = 0; e < ol.length; e++) ol[e]._workInProgressVersionPrimary = null;
  ol.length = 0;
}
var Gr = ut.ReactCurrentDispatcher, cl = ut.ReactCurrentBatchConfig, qt = 0, q = null, Z = null, te = null, xs = !1, Jn = !1, vr = 0, sf = 0;
function ce() {
  throw Error(k(321));
}
function Ba(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!He(e[n], t[n])) return !1;
  return !0;
}
function Ua(e, t, n, r, l, a) {
  if (qt = a, q = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Gr.current = e === null || e.memoizedState === null ? cf : uf, e = n(r, l), Jn) {
    a = 0;
    do {
      if (Jn = !1, vr = 0, 25 <= a) throw Error(k(301));
      a += 1, te = Z = null, t.updateQueue = null, Gr.current = df, e = n(r, l);
    } while (Jn);
  }
  if (Gr.current = js, t = Z !== null && Z.next !== null, qt = 0, te = Z = q = null, xs = !1, t) throw Error(k(300));
  return e;
}
function Va() {
  var e = vr !== 0;
  return vr = 0, e;
}
function Ye() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return te === null ? q.memoizedState = te = e : te = te.next = e, te;
}
function $e() {
  if (Z === null) {
    var e = q.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = Z.next;
  var t = te === null ? q.memoizedState : te.next;
  if (t !== null) te = t, Z = e;
  else {
    if (e === null) throw Error(k(310));
    Z = e, e = { memoizedState: Z.memoizedState, baseState: Z.baseState, baseQueue: Z.baseQueue, queue: Z.queue, next: null }, te === null ? q.memoizedState = te = e : te = te.next = e;
  }
  return te;
}
function gr(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function ul(e) {
  var t = $e(), n = t.queue;
  if (n === null) throw Error(k(311));
  n.lastRenderedReducer = e;
  var r = Z, l = r.baseQueue, a = n.pending;
  if (a !== null) {
    if (l !== null) {
      var i = l.next;
      l.next = a.next, a.next = i;
    }
    r.baseQueue = l = a, n.pending = null;
  }
  if (l !== null) {
    a = l.next, r = r.baseState;
    var o = i = null, c = null, u = a;
    do {
      var h = u.lane;
      if ((qt & h) === h) c !== null && (c = c.next = { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }), r = u.hasEagerState ? u.eagerState : e(r, u.action);
      else {
        var f = {
          lane: h,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null
        };
        c === null ? (o = c = f, i = r) : c = c.next = f, q.lanes |= h, Qt |= h;
      }
      u = u.next;
    } while (u !== null && u !== a);
    c === null ? i = r : c.next = o, He(r, t.memoizedState) || (xe = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = c, n.lastRenderedState = r;
  }
  if (e = n.interleaved, e !== null) {
    l = e;
    do
      a = l.lane, q.lanes |= a, Qt |= a, l = l.next;
    while (l !== e);
  } else l === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function dl(e) {
  var t = $e(), n = t.queue;
  if (n === null) throw Error(k(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch, l = n.pending, a = t.memoizedState;
  if (l !== null) {
    n.pending = null;
    var i = l = l.next;
    do
      a = e(a, i.action), i = i.next;
    while (i !== l);
    He(a, t.memoizedState) || (xe = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
  }
  return [a, r];
}
function Wc() {
}
function qc(e, t) {
  var n = q, r = $e(), l = t(), a = !He(r.memoizedState, l);
  if (a && (r.memoizedState = l, xe = !0), r = r.queue, Ha(Yc.bind(null, n, r, e), [e]), r.getSnapshot !== t || a || te !== null && te.memoizedState.tag & 1) {
    if (n.flags |= 2048, yr(9, Kc.bind(null, n, r, l, t), void 0, null), ne === null) throw Error(k(349));
    qt & 30 || Qc(n, t, l);
  }
  return l;
}
function Qc(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = q.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, q.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function Kc(e, t, n, r) {
  t.value = n, t.getSnapshot = r, Gc(t) && Xc(e);
}
function Yc(e, t, n) {
  return n(function() {
    Gc(t) && Xc(e);
  });
}
function Gc(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !He(e, n);
  } catch {
    return !0;
  }
}
function Xc(e) {
  var t = ot(e, 1);
  t !== null && Ue(t, e, 1, -1);
}
function qi(e) {
  var t = Ye();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: gr, lastRenderedState: e }, t.queue = e, e = e.dispatch = of.bind(null, q, e), [t.memoizedState, e];
}
function yr(e, t, n, r) {
  return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = q.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, q.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
}
function Zc() {
  return $e().memoizedState;
}
function Xr(e, t, n, r) {
  var l = Ye();
  q.flags |= e, l.memoizedState = yr(1 | t, n, void 0, r === void 0 ? null : r);
}
function Ls(e, t, n, r) {
  var l = $e();
  r = r === void 0 ? null : r;
  var a = void 0;
  if (Z !== null) {
    var i = Z.memoizedState;
    if (a = i.destroy, r !== null && Ba(r, i.deps)) {
      l.memoizedState = yr(t, n, a, r);
      return;
    }
  }
  q.flags |= e, l.memoizedState = yr(1 | t, n, a, r);
}
function Qi(e, t) {
  return Xr(8390656, 8, e, t);
}
function Ha(e, t) {
  return Ls(2048, 8, e, t);
}
function Jc(e, t) {
  return Ls(4, 2, e, t);
}
function eu(e, t) {
  return Ls(4, 4, e, t);
}
function tu(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function nu(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Ls(4, 4, tu.bind(null, t, e), n);
}
function Wa() {
}
function ru(e, t) {
  var n = $e();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Ba(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
}
function su(e, t) {
  var n = $e();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Ba(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
}
function lu(e, t, n) {
  return qt & 21 ? (He(n, t) || (n = uc(), q.lanes |= n, Qt |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, xe = !0), e.memoizedState = n);
}
function lf(e, t) {
  var n = F;
  F = n !== 0 && 4 > n ? n : 4, e(!0);
  var r = cl.transition;
  cl.transition = {};
  try {
    e(!1), t();
  } finally {
    F = n, cl.transition = r;
  }
}
function au() {
  return $e().memoizedState;
}
function af(e, t, n) {
  var r = Ct(e);
  if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, iu(e)) ou(t, n);
  else if (n = Uc(e, t, n, r), n !== null) {
    var l = he();
    Ue(n, e, r, l), cu(n, t, r);
  }
}
function of(e, t, n) {
  var r = Ct(e), l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (iu(e)) ou(t, l);
  else {
    var a = e.alternate;
    if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
      var i = t.lastRenderedState, o = a(i, n);
      if (l.hasEagerState = !0, l.eagerState = o, He(o, i)) {
        var c = t.interleaved;
        c === null ? (l.next = l, Aa(t)) : (l.next = c.next, c.next = l), t.interleaved = l;
        return;
      }
    } catch {
    } finally {
    }
    n = Uc(e, t, l, r), n !== null && (l = he(), Ue(n, e, r, l), cu(n, t, r));
  }
}
function iu(e) {
  var t = e.alternate;
  return e === q || t !== null && t === q;
}
function ou(e, t) {
  Jn = xs = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function cu(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, wa(e, n);
  }
}
var js = { readContext: Ie, useCallback: ce, useContext: ce, useEffect: ce, useImperativeHandle: ce, useInsertionEffect: ce, useLayoutEffect: ce, useMemo: ce, useReducer: ce, useRef: ce, useState: ce, useDebugValue: ce, useDeferredValue: ce, useTransition: ce, useMutableSource: ce, useSyncExternalStore: ce, useId: ce, unstable_isNewReconciler: !1 }, cf = { readContext: Ie, useCallback: function(e, t) {
  return Ye().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: Ie, useEffect: Qi, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Xr(
    4194308,
    4,
    tu.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return Xr(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return Xr(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = Ye();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var r = Ye();
  return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = af.bind(null, q, e), [r.memoizedState, e];
}, useRef: function(e) {
  var t = Ye();
  return e = { current: e }, t.memoizedState = e;
}, useState: qi, useDebugValue: Wa, useDeferredValue: function(e) {
  return Ye().memoizedState = e;
}, useTransition: function() {
  var e = qi(!1), t = e[0];
  return e = lf.bind(null, e[1]), Ye().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var r = q, l = Ye();
  if (H) {
    if (n === void 0) throw Error(k(407));
    n = n();
  } else {
    if (n = t(), ne === null) throw Error(k(349));
    qt & 30 || Qc(r, t, n);
  }
  l.memoizedState = n;
  var a = { value: n, getSnapshot: t };
  return l.queue = a, Qi(Yc.bind(
    null,
    r,
    a,
    e
  ), [e]), r.flags |= 2048, yr(9, Kc.bind(null, r, a, n, t), void 0, null), n;
}, useId: function() {
  var e = Ye(), t = ne.identifierPrefix;
  if (H) {
    var n = st, r = rt;
    n = (r & ~(1 << 32 - Be(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = vr++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = sf++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, uf = {
  readContext: Ie,
  useCallback: ru,
  useContext: Ie,
  useEffect: Ha,
  useImperativeHandle: nu,
  useInsertionEffect: Jc,
  useLayoutEffect: eu,
  useMemo: su,
  useReducer: ul,
  useRef: Zc,
  useState: function() {
    return ul(gr);
  },
  useDebugValue: Wa,
  useDeferredValue: function(e) {
    var t = $e();
    return lu(t, Z.memoizedState, e);
  },
  useTransition: function() {
    var e = ul(gr)[0], t = $e().memoizedState;
    return [e, t];
  },
  useMutableSource: Wc,
  useSyncExternalStore: qc,
  useId: au,
  unstable_isNewReconciler: !1
}, df = { readContext: Ie, useCallback: ru, useContext: Ie, useEffect: Ha, useImperativeHandle: nu, useInsertionEffect: Jc, useLayoutEffect: eu, useMemo: su, useReducer: dl, useRef: Zc, useState: function() {
  return dl(gr);
}, useDebugValue: Wa, useDeferredValue: function(e) {
  var t = $e();
  return Z === null ? t.memoizedState = e : lu(t, Z.memoizedState, e);
}, useTransition: function() {
  var e = dl(gr)[0], t = $e().memoizedState;
  return [e, t];
}, useMutableSource: Wc, useSyncExternalStore: qc, useId: au, unstable_isNewReconciler: !1 };
function Re(e, t) {
  if (e && e.defaultProps) {
    t = Q({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Kl(e, t, n, r) {
  t = e.memoizedState, n = n(r, t), n = n == null ? t : Q({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var Ps = { isMounted: function(e) {
  return (e = e._reactInternals) ? Gt(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var r = he(), l = Ct(e), a = lt(r, l);
  a.payload = t, n != null && (a.callback = n), t = kt(e, a, l), t !== null && (Ue(t, e, l, r), Yr(t, e, l));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var r = he(), l = Ct(e), a = lt(r, l);
  a.tag = 1, a.payload = t, n != null && (a.callback = n), t = kt(e, a, l), t !== null && (Ue(t, e, l, r), Yr(t, e, l));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = he(), r = Ct(e), l = lt(n, r);
  l.tag = 2, t != null && (l.callback = t), t = kt(e, l, r), t !== null && (Ue(t, e, r, n), Yr(t, e, r));
} };
function Ki(e, t, n, r, l, a, i) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, i) : t.prototype && t.prototype.isPureReactComponent ? !ur(n, r) || !ur(l, a) : !0;
}
function uu(e, t, n) {
  var r = !1, l = Tt, a = t.contextType;
  return typeof a == "object" && a !== null ? a = Ie(a) : (l = Ne(t) ? Ht : me.current, r = t.contextTypes, a = (r = r != null) ? kn(e, l) : Tt), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Ps, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = a), t;
}
function Yi(e, t, n, r) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Ps.enqueueReplaceState(t, t.state, null);
}
function Yl(e, t, n, r) {
  var l = e.stateNode;
  l.props = n, l.state = e.memoizedState, l.refs = {}, Oa(e);
  var a = t.contextType;
  typeof a == "object" && a !== null ? l.context = Ie(a) : (a = Ne(t) ? Ht : me.current, l.context = kn(e, a)), l.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (Kl(e, t, a, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && Ps.enqueueReplaceState(l, l.state, null), gs(e, n, l, r), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
}
function bn(e, t) {
  try {
    var n = "", r = t;
    do
      n += Rd(r), r = r.return;
    while (r);
    var l = n;
  } catch (a) {
    l = `
Error generating stack: ` + a.message + `
` + a.stack;
  }
  return { value: e, source: t, stack: l, digest: null };
}
function ml(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Gl(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var mf = typeof WeakMap == "function" ? WeakMap : Map;
function du(e, t, n) {
  n = lt(-1, n), n.tag = 3, n.payload = { element: null };
  var r = t.value;
  return n.callback = function() {
    ws || (ws = !0, aa = r), Gl(e, t);
  }, n;
}
function mu(e, t, n) {
  n = lt(-1, n), n.tag = 3;
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var l = t.value;
    n.payload = function() {
      return r(l);
    }, n.callback = function() {
      Gl(e, t);
    };
  }
  var a = e.stateNode;
  return a !== null && typeof a.componentDidCatch == "function" && (n.callback = function() {
    Gl(e, t), typeof r != "function" && (St === null ? St = /* @__PURE__ */ new Set([this]) : St.add(this));
    var i = t.stack;
    this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
  }), n;
}
function Gi(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new mf();
    var l = /* @__PURE__ */ new Set();
    r.set(t, l);
  } else l = r.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), r.set(t, l));
  l.has(n) || (l.add(n), e = Ef.bind(null, e, t, n), t.then(e, e));
}
function Xi(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Zi(e, t, n, r, l) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = l, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = lt(-1, 1), t.tag = 2, kt(n, t, 1))), n.lanes |= 1), e);
}
var ff = ut.ReactCurrentOwner, xe = !1;
function pe(e, t, n, r) {
  t.child = e === null ? Bc(t, null, n, r) : Cn(t, e.child, n, r);
}
function Ji(e, t, n, r, l) {
  n = n.render;
  var a = t.ref;
  return jn(t, l), r = Ua(e, t, n, r, a, l), n = Va(), e !== null && !xe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, ct(e, t, l)) : (H && n && _a(t), t.flags |= 1, pe(e, t, r, l), t.child);
}
function eo(e, t, n, r, l) {
  if (e === null) {
    var a = n.type;
    return typeof a == "function" && !Ja(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, fu(e, t, a, r, l)) : (e = ts(n.type, null, r, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (a = e.child, !(e.lanes & l)) {
    var i = a.memoizedProps;
    if (n = n.compare, n = n !== null ? n : ur, n(i, r) && e.ref === t.ref) return ct(e, t, l);
  }
  return t.flags |= 1, e = Et(a, r), e.ref = t.ref, e.return = t, t.child = e;
}
function fu(e, t, n, r, l) {
  if (e !== null) {
    var a = e.memoizedProps;
    if (ur(a, r) && e.ref === t.ref) if (xe = !1, t.pendingProps = r = a, (e.lanes & l) !== 0) e.flags & 131072 && (xe = !0);
    else return t.lanes = e.lanes, ct(e, t, l);
  }
  return Xl(e, t, n, r, l);
}
function pu(e, t, n) {
  var r = t.pendingProps, l = r.children, a = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, B(pn, ke), ke |= n;
  else {
    if (!(n & 1073741824)) return e = a !== null ? a.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, B(pn, ke), ke |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = a !== null ? a.baseLanes : n, B(pn, ke), ke |= r;
  }
  else a !== null ? (r = a.baseLanes | n, t.memoizedState = null) : r = n, B(pn, ke), ke |= r;
  return pe(e, t, l, n), t.child;
}
function hu(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Xl(e, t, n, r, l) {
  var a = Ne(n) ? Ht : me.current;
  return a = kn(t, a), jn(t, l), n = Ua(e, t, n, r, a, l), r = Va(), e !== null && !xe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, ct(e, t, l)) : (H && r && _a(t), t.flags |= 1, pe(e, t, n, l), t.child);
}
function to(e, t, n, r, l) {
  if (Ne(n)) {
    var a = !0;
    ms(t);
  } else a = !1;
  if (jn(t, l), t.stateNode === null) Zr(e, t), uu(t, n, r), Yl(t, n, r, l), r = !0;
  else if (e === null) {
    var i = t.stateNode, o = t.memoizedProps;
    i.props = o;
    var c = i.context, u = n.contextType;
    typeof u == "object" && u !== null ? u = Ie(u) : (u = Ne(n) ? Ht : me.current, u = kn(t, u));
    var h = n.getDerivedStateFromProps, f = typeof h == "function" || typeof i.getSnapshotBeforeUpdate == "function";
    f || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== r || c !== u) && Yi(t, i, r, u), pt = !1;
    var d = t.memoizedState;
    i.state = d, gs(t, r, i, l), c = t.memoizedState, o !== r || d !== c || je.current || pt ? (typeof h == "function" && (Kl(t, n, h, r), c = t.memoizedState), (o = pt || Ki(t, n, o, r, d, c, u)) ? (f || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), i.props = r, i.state = c, i.context = u, r = o) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
  } else {
    i = t.stateNode, Vc(e, t), o = t.memoizedProps, u = t.type === t.elementType ? o : Re(t.type, o), i.props = u, f = t.pendingProps, d = i.context, c = n.contextType, typeof c == "object" && c !== null ? c = Ie(c) : (c = Ne(n) ? Ht : me.current, c = kn(t, c));
    var g = n.getDerivedStateFromProps;
    (h = typeof g == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== f || d !== c) && Yi(t, i, r, c), pt = !1, d = t.memoizedState, i.state = d, gs(t, r, i, l);
    var j = t.memoizedState;
    o !== f || d !== j || je.current || pt ? (typeof g == "function" && (Kl(t, n, g, r), j = t.memoizedState), (u = pt || Ki(t, n, u, r, d, j, c) || !1) ? (h || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, j, c), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, j, c)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = j), i.props = r, i.state = j, i.context = c, r = u) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 1024), r = !1);
  }
  return Zl(e, t, n, r, a, l);
}
function Zl(e, t, n, r, l, a) {
  hu(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i) return l && zi(t, n, !1), ct(e, t, a);
  r = t.stateNode, ff.current = t;
  var o = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return t.flags |= 1, e !== null && i ? (t.child = Cn(t, e.child, null, a), t.child = Cn(t, null, o, a)) : pe(e, t, o, a), t.memoizedState = r.state, l && zi(t, n, !0), t.child;
}
function vu(e) {
  var t = e.stateNode;
  t.pendingContext ? Fi(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Fi(e, t.context, !1), Ra(e, t.containerInfo);
}
function no(e, t, n, r, l) {
  return Sn(), La(l), t.flags |= 256, pe(e, t, n, r), t.child;
}
var Jl = { dehydrated: null, treeContext: null, retryLane: 0 };
function ea(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function gu(e, t, n) {
  var r = t.pendingProps, l = W.current, a = !1, i = (t.flags & 128) !== 0, o;
  if ((o = i) || (o = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), o ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), B(W, l & 1), e === null)
    return ql(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (i = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, i = { mode: "hidden", children: i }, !(r & 1) && a !== null ? (a.childLanes = 0, a.pendingProps = i) : a = As(i, r, 0, null), e = Vt(e, r, n, null), a.return = t, e.return = t, a.sibling = e, t.child = a, t.child.memoizedState = ea(n), t.memoizedState = Jl, e) : qa(t, i));
  if (l = e.memoizedState, l !== null && (o = l.dehydrated, o !== null)) return pf(e, t, i, r, o, l, n);
  if (a) {
    a = r.fallback, i = t.mode, l = e.child, o = l.sibling;
    var c = { mode: "hidden", children: r.children };
    return !(i & 1) && t.child !== l ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = Et(l, c), r.subtreeFlags = l.subtreeFlags & 14680064), o !== null ? a = Et(o, a) : (a = Vt(a, i, n, null), a.flags |= 2), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, i = e.child.memoizedState, i = i === null ? ea(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, a.memoizedState = i, a.childLanes = e.childLanes & ~n, t.memoizedState = Jl, r;
  }
  return a = e.child, e = a.sibling, r = Et(a, { mode: "visible", children: r.children }), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
}
function qa(e, t) {
  return t = As({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function Fr(e, t, n, r) {
  return r !== null && La(r), Cn(t, e.child, null, n), e = qa(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function pf(e, t, n, r, l, a, i) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, r = ml(Error(k(422))), Fr(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (a = r.fallback, l = t.mode, r = As({ mode: "visible", children: r.children }, l, 0, null), a = Vt(a, l, i, null), a.flags |= 2, r.return = t, a.return = t, r.sibling = a, t.child = r, t.mode & 1 && Cn(t, e.child, null, i), t.child.memoizedState = ea(i), t.memoizedState = Jl, a);
  if (!(t.mode & 1)) return Fr(e, t, i, null);
  if (l.data === "$!") {
    if (r = l.nextSibling && l.nextSibling.dataset, r) var o = r.dgst;
    return r = o, a = Error(k(419)), r = ml(a, r, void 0), Fr(e, t, i, r);
  }
  if (o = (i & e.childLanes) !== 0, xe || o) {
    if (r = ne, r !== null) {
      switch (i & -i) {
        case 4:
          l = 2;
          break;
        case 16:
          l = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          l = 32;
          break;
        case 536870912:
          l = 268435456;
          break;
        default:
          l = 0;
      }
      l = l & (r.suspendedLanes | i) ? 0 : l, l !== 0 && l !== a.retryLane && (a.retryLane = l, ot(e, l), Ue(r, e, l, -1));
    }
    return Za(), r = ml(Error(k(421))), Fr(e, t, i, r);
  }
  return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = bf.bind(null, e), l._reactRetry = t, null) : (e = a.treeContext, Se = wt(l.nextSibling), Ce = t, H = !0, ze = null, e !== null && (De[_e++] = rt, De[_e++] = st, De[_e++] = Wt, rt = e.id, st = e.overflow, Wt = t), t = qa(t, r.children), t.flags |= 4096, t);
}
function ro(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), Ql(e.return, t, n);
}
function fl(e, t, n, r, l) {
  var a = e.memoizedState;
  a === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l } : (a.isBackwards = t, a.rendering = null, a.renderingStartTime = 0, a.last = r, a.tail = n, a.tailMode = l);
}
function yu(e, t, n) {
  var r = t.pendingProps, l = r.revealOrder, a = r.tail;
  if (pe(e, t, r.children, n), r = W.current, r & 2) r = r & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && ro(e, n, t);
      else if (e.tag === 19) ro(e, n, t);
      else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break e;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) break e;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    r &= 1;
  }
  if (B(W, r), !(t.mode & 1)) t.memoizedState = null;
  else switch (l) {
    case "forwards":
      for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && ys(e) === null && (l = n), n = n.sibling;
      n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), fl(t, !1, l, n, a);
      break;
    case "backwards":
      for (n = null, l = t.child, t.child = null; l !== null; ) {
        if (e = l.alternate, e !== null && ys(e) === null) {
          t.child = l;
          break;
        }
        e = l.sibling, l.sibling = n, n = l, l = e;
      }
      fl(t, !0, n, null, a);
      break;
    case "together":
      fl(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function Zr(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function ct(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), Qt |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(k(153));
  if (t.child !== null) {
    for (e = t.child, n = Et(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Et(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function hf(e, t, n) {
  switch (t.tag) {
    case 3:
      vu(t), Sn();
      break;
    case 5:
      Hc(t);
      break;
    case 1:
      Ne(t.type) && ms(t);
      break;
    case 4:
      Ra(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context, l = t.memoizedProps.value;
      B(hs, r._currentValue), r._currentValue = l;
      break;
    case 13:
      if (r = t.memoizedState, r !== null)
        return r.dehydrated !== null ? (B(W, W.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? gu(e, t, n) : (B(W, W.current & 1), e = ct(e, t, n), e !== null ? e.sibling : null);
      B(W, W.current & 1);
      break;
    case 19:
      if (r = (n & t.childLanes) !== 0, e.flags & 128) {
        if (r) return yu(e, t, n);
        t.flags |= 128;
      }
      if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), B(W, W.current), r) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, pu(e, t, n);
  }
  return ct(e, t, n);
}
var xu, ta, ju, Nu;
xu = function(e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      n.child.return = n, n = n.child;
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    n.sibling.return = n.return, n = n.sibling;
  }
};
ta = function() {
};
ju = function(e, t, n, r) {
  var l = e.memoizedProps;
  if (l !== r) {
    e = t.stateNode, zt(Ze.current);
    var a = null;
    switch (n) {
      case "input":
        l = kl(e, l), r = kl(e, r), a = [];
        break;
      case "select":
        l = Q({}, l, { value: void 0 }), r = Q({}, r, { value: void 0 }), a = [];
        break;
      case "textarea":
        l = El(e, l), r = El(e, r), a = [];
        break;
      default:
        typeof l.onClick != "function" && typeof r.onClick == "function" && (e.onclick = us);
    }
    Tl(n, r);
    var i;
    n = null;
    for (u in l) if (!r.hasOwnProperty(u) && l.hasOwnProperty(u) && l[u] != null) if (u === "style") {
      var o = l[u];
      for (i in o) o.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
    } else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (rr.hasOwnProperty(u) ? a || (a = []) : (a = a || []).push(u, null));
    for (u in r) {
      var c = r[u];
      if (o = l != null ? l[u] : void 0, r.hasOwnProperty(u) && c !== o && (c != null || o != null)) if (u === "style") if (o) {
        for (i in o) !o.hasOwnProperty(i) || c && c.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
        for (i in c) c.hasOwnProperty(i) && o[i] !== c[i] && (n || (n = {}), n[i] = c[i]);
      } else n || (a || (a = []), a.push(
        u,
        n
      )), n = c;
      else u === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, o = o ? o.__html : void 0, c != null && o !== c && (a = a || []).push(u, c)) : u === "children" ? typeof c != "string" && typeof c != "number" || (a = a || []).push(u, "" + c) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (rr.hasOwnProperty(u) ? (c != null && u === "onScroll" && U("scroll", e), a || o === c || (a = [])) : (a = a || []).push(u, c));
    }
    n && (a = a || []).push("style", n);
    var u = a;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
Nu = function(e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function Bn(e, t) {
  if (!H) switch (e.tailMode) {
    case "hidden":
      t = e.tail;
      for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
      n === null ? e.tail = null : n.sibling = null;
      break;
    case "collapsed":
      n = e.tail;
      for (var r = null; n !== null; ) n.alternate !== null && (r = n), n = n.sibling;
      r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
  }
}
function ue(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
  if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags & 14680064, r |= l.flags & 14680064, l.return = e, l = l.sibling;
  else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags, r |= l.flags, l.return = e, l = l.sibling;
  return e.subtreeFlags |= r, e.childLanes = n, t;
}
function vf(e, t, n) {
  var r = t.pendingProps;
  switch (Ma(t), t.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ue(t), null;
    case 1:
      return Ne(t.type) && ds(), ue(t), null;
    case 3:
      return r = t.stateNode, En(), V(je), V(me), za(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (Or(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ze !== null && (ca(ze), ze = null))), ta(e, t), ue(t), null;
    case 5:
      Fa(t);
      var l = zt(hr.current);
      if (n = t.type, e !== null && t.stateNode != null) ju(e, t, n, r, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(k(166));
          return ue(t), null;
        }
        if (e = zt(Ze.current), Or(t)) {
          r = t.stateNode, n = t.type;
          var a = t.memoizedProps;
          switch (r[Ge] = t, r[fr] = a, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              U("cancel", r), U("close", r);
              break;
            case "iframe":
            case "object":
            case "embed":
              U("load", r);
              break;
            case "video":
            case "audio":
              for (l = 0; l < Qn.length; l++) U(Qn[l], r);
              break;
            case "source":
              U("error", r);
              break;
            case "img":
            case "image":
            case "link":
              U(
                "error",
                r
              ), U("load", r);
              break;
            case "details":
              U("toggle", r);
              break;
            case "input":
              mi(r, a), U("invalid", r);
              break;
            case "select":
              r._wrapperState = { wasMultiple: !!a.multiple }, U("invalid", r);
              break;
            case "textarea":
              pi(r, a), U("invalid", r);
          }
          Tl(n, a), l = null;
          for (var i in a) if (a.hasOwnProperty(i)) {
            var o = a[i];
            i === "children" ? typeof o == "string" ? r.textContent !== o && (a.suppressHydrationWarning !== !0 && Ar(r.textContent, o, e), l = ["children", o]) : typeof o == "number" && r.textContent !== "" + o && (a.suppressHydrationWarning !== !0 && Ar(
              r.textContent,
              o,
              e
            ), l = ["children", "" + o]) : rr.hasOwnProperty(i) && o != null && i === "onScroll" && U("scroll", r);
          }
          switch (n) {
            case "input":
              Tr(r), fi(r, a, !0);
              break;
            case "textarea":
              Tr(r), hi(r);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof a.onClick == "function" && (r.onclick = us);
          }
          r = l, t.updateQueue = r, r !== null && (t.flags |= 4);
        } else {
          i = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Yo(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[Ge] = t, e[fr] = r, xu(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (i = Dl(n, r), n) {
              case "dialog":
                U("cancel", e), U("close", e), l = r;
                break;
              case "iframe":
              case "object":
              case "embed":
                U("load", e), l = r;
                break;
              case "video":
              case "audio":
                for (l = 0; l < Qn.length; l++) U(Qn[l], e);
                l = r;
                break;
              case "source":
                U("error", e), l = r;
                break;
              case "img":
              case "image":
              case "link":
                U(
                  "error",
                  e
                ), U("load", e), l = r;
                break;
              case "details":
                U("toggle", e), l = r;
                break;
              case "input":
                mi(e, r), l = kl(e, r), U("invalid", e);
                break;
              case "option":
                l = r;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!r.multiple }, l = Q({}, r, { value: void 0 }), U("invalid", e);
                break;
              case "textarea":
                pi(e, r), l = El(e, r), U("invalid", e);
                break;
              default:
                l = r;
            }
            Tl(n, l), o = l;
            for (a in o) if (o.hasOwnProperty(a)) {
              var c = o[a];
              a === "style" ? Zo(e, c) : a === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, c != null && Go(e, c)) : a === "children" ? typeof c == "string" ? (n !== "textarea" || c !== "") && sr(e, c) : typeof c == "number" && sr(e, "" + c) : a !== "suppressContentEditableWarning" && a !== "suppressHydrationWarning" && a !== "autoFocus" && (rr.hasOwnProperty(a) ? c != null && a === "onScroll" && U("scroll", e) : c != null && va(e, a, c, i));
            }
            switch (n) {
              case "input":
                Tr(e), fi(e, r, !1);
                break;
              case "textarea":
                Tr(e), hi(e);
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + bt(r.value));
                break;
              case "select":
                e.multiple = !!r.multiple, a = r.value, a != null ? vn(e, !!r.multiple, a, !1) : r.defaultValue != null && vn(
                  e,
                  !!r.multiple,
                  r.defaultValue,
                  !0
                );
                break;
              default:
                typeof l.onClick == "function" && (e.onclick = us);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break e;
              case "img":
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
      }
      return ue(t), null;
    case 6:
      if (e && t.stateNode != null) Nu(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null) throw Error(k(166));
        if (n = zt(hr.current), zt(Ze.current), Or(t)) {
          if (r = t.stateNode, n = t.memoizedProps, r[Ge] = t, (a = r.nodeValue !== n) && (e = Ce, e !== null)) switch (e.tag) {
            case 3:
              Ar(r.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && Ar(r.nodeValue, n, (e.mode & 1) !== 0);
          }
          a && (t.flags |= 4);
        } else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[Ge] = t, t.stateNode = r;
      }
      return ue(t), null;
    case 13:
      if (V(W), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (H && Se !== null && t.mode & 1 && !(t.flags & 128)) Fc(), Sn(), t.flags |= 98560, a = !1;
        else if (a = Or(t), r !== null && r.dehydrated !== null) {
          if (e === null) {
            if (!a) throw Error(k(318));
            if (a = t.memoizedState, a = a !== null ? a.dehydrated : null, !a) throw Error(k(317));
            a[Ge] = t;
          } else Sn(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ue(t), a = !1;
        } else ze !== null && (ca(ze), ze = null), a = !0;
        if (!a) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, t.mode & 1 && (e === null || W.current & 1 ? J === 0 && (J = 3) : Za())), t.updateQueue !== null && (t.flags |= 4), ue(t), null);
    case 4:
      return En(), ta(e, t), e === null && dr(t.stateNode.containerInfo), ue(t), null;
    case 10:
      return $a(t.type._context), ue(t), null;
    case 17:
      return Ne(t.type) && ds(), ue(t), null;
    case 19:
      if (V(W), a = t.memoizedState, a === null) return ue(t), null;
      if (r = (t.flags & 128) !== 0, i = a.rendering, i === null) if (r) Bn(a, !1);
      else {
        if (J !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (i = ys(e), i !== null) {
            for (t.flags |= 128, Bn(a, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) a = n, e = r, a.flags &= 14680066, i = a.alternate, i === null ? (a.childLanes = 0, a.lanes = e, a.child = null, a.subtreeFlags = 0, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null, a.stateNode = null) : (a.childLanes = i.childLanes, a.lanes = i.lanes, a.child = i.child, a.subtreeFlags = 0, a.deletions = null, a.memoizedProps = i.memoizedProps, a.memoizedState = i.memoizedState, a.updateQueue = i.updateQueue, a.type = i.type, e = i.dependencies, a.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return B(W, W.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        a.tail !== null && G() > Tn && (t.flags |= 128, r = !0, Bn(a, !1), t.lanes = 4194304);
      }
      else {
        if (!r) if (e = ys(i), e !== null) {
          if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), Bn(a, !0), a.tail === null && a.tailMode === "hidden" && !i.alternate && !H) return ue(t), null;
        } else 2 * G() - a.renderingStartTime > Tn && n !== 1073741824 && (t.flags |= 128, r = !0, Bn(a, !1), t.lanes = 4194304);
        a.isBackwards ? (i.sibling = t.child, t.child = i) : (n = a.last, n !== null ? n.sibling = i : t.child = i, a.last = i);
      }
      return a.tail !== null ? (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = G(), t.sibling = null, n = W.current, B(W, r ? n & 1 | 2 : n & 1), t) : (ue(t), null);
    case 22:
    case 23:
      return Xa(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && t.mode & 1 ? ke & 1073741824 && (ue(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ue(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(k(156, t.tag));
}
function gf(e, t) {
  switch (Ma(t), t.tag) {
    case 1:
      return Ne(t.type) && ds(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return En(), V(je), V(me), za(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return Fa(t), null;
    case 13:
      if (V(W), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(k(340));
        Sn();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return V(W), null;
    case 4:
      return En(), null;
    case 10:
      return $a(t.type._context), null;
    case 22:
    case 23:
      return Xa(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var zr = !1, de = !1, yf = typeof WeakSet == "function" ? WeakSet : Set, _ = null;
function fn(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (r) {
    Y(e, t, r);
  }
  else n.current = null;
}
function na(e, t, n) {
  try {
    n();
  } catch (r) {
    Y(e, t, r);
  }
}
var so = !1;
function xf(e, t) {
  if (Fl = is, e = Ec(), Da(e)) {
    if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else e: {
      n = (n = e.ownerDocument) && n.defaultView || window;
      var r = n.getSelection && n.getSelection();
      if (r && r.rangeCount !== 0) {
        n = r.anchorNode;
        var l = r.anchorOffset, a = r.focusNode;
        r = r.focusOffset;
        try {
          n.nodeType, a.nodeType;
        } catch {
          n = null;
          break e;
        }
        var i = 0, o = -1, c = -1, u = 0, h = 0, f = e, d = null;
        t: for (; ; ) {
          for (var g; f !== n || l !== 0 && f.nodeType !== 3 || (o = i + l), f !== a || r !== 0 && f.nodeType !== 3 || (c = i + r), f.nodeType === 3 && (i += f.nodeValue.length), (g = f.firstChild) !== null; )
            d = f, f = g;
          for (; ; ) {
            if (f === e) break t;
            if (d === n && ++u === l && (o = i), d === a && ++h === r && (c = i), (g = f.nextSibling) !== null) break;
            f = d, d = f.parentNode;
          }
          f = g;
        }
        n = o === -1 || c === -1 ? null : { start: o, end: c };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (zl = { focusedElem: e, selectionRange: n }, is = !1, _ = t; _ !== null; ) if (t = _, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, _ = e;
  else for (; _ !== null; ) {
    t = _;
    try {
      var j = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (j !== null) {
            var N = j.memoizedProps, w = j.memoizedState, p = t.stateNode, m = p.getSnapshotBeforeUpdate(t.elementType === t.type ? N : Re(t.type, N), w);
            p.__reactInternalSnapshotBeforeUpdate = m;
          }
          break;
        case 3:
          var v = t.stateNode.containerInfo;
          v.nodeType === 1 ? v.textContent = "" : v.nodeType === 9 && v.documentElement && v.removeChild(v.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(k(163));
      }
    } catch (x) {
      Y(t, t.return, x);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, _ = e;
      break;
    }
    _ = t.return;
  }
  return j = so, so = !1, j;
}
function er(e, t, n) {
  var r = t.updateQueue;
  if (r = r !== null ? r.lastEffect : null, r !== null) {
    var l = r = r.next;
    do {
      if ((l.tag & e) === e) {
        var a = l.destroy;
        l.destroy = void 0, a !== void 0 && na(t, n, a);
      }
      l = l.next;
    } while (l !== r);
  }
}
function Is(e, t) {
  if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
    var n = t = t.next;
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function ra(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : t.current = e;
  }
}
function wu(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, wu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ge], delete t[fr], delete t[Vl], delete t[ef], delete t[tf])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function ku(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function lo(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || ku(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function sa(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = us));
  else if (r !== 4 && (e = e.child, e !== null)) for (sa(e, t, n), e = e.sibling; e !== null; ) sa(e, t, n), e = e.sibling;
}
function la(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && (e = e.child, e !== null)) for (la(e, t, n), e = e.sibling; e !== null; ) la(e, t, n), e = e.sibling;
}
var le = null, Fe = !1;
function mt(e, t, n) {
  for (n = n.child; n !== null; ) Su(e, t, n), n = n.sibling;
}
function Su(e, t, n) {
  if (Xe && typeof Xe.onCommitFiberUnmount == "function") try {
    Xe.onCommitFiberUnmount(Es, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      de || fn(n, t);
    case 6:
      var r = le, l = Fe;
      le = null, mt(e, t, n), le = r, Fe = l, le !== null && (Fe ? (e = le, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : le.removeChild(n.stateNode));
      break;
    case 18:
      le !== null && (Fe ? (e = le, n = n.stateNode, e.nodeType === 8 ? al(e.parentNode, n) : e.nodeType === 1 && al(e, n), or(e)) : al(le, n.stateNode));
      break;
    case 4:
      r = le, l = Fe, le = n.stateNode.containerInfo, Fe = !0, mt(e, t, n), le = r, Fe = l;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!de && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
        l = r = r.next;
        do {
          var a = l, i = a.destroy;
          a = a.tag, i !== void 0 && (a & 2 || a & 4) && na(n, t, i), l = l.next;
        } while (l !== r);
      }
      mt(e, t, n);
      break;
    case 1:
      if (!de && (fn(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
        r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
      } catch (o) {
        Y(n, t, o);
      }
      mt(e, t, n);
      break;
    case 21:
      mt(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (de = (r = de) || n.memoizedState !== null, mt(e, t, n), de = r) : mt(e, t, n);
      break;
    default:
      mt(e, t, n);
  }
}
function ao(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new yf()), t.forEach(function(r) {
      var l = Tf.bind(null, e, r);
      n.has(r) || (n.add(r), r.then(l, l));
    });
  }
}
function Oe(e, t) {
  var n = t.deletions;
  if (n !== null) for (var r = 0; r < n.length; r++) {
    var l = n[r];
    try {
      var a = e, i = t, o = i;
      e: for (; o !== null; ) {
        switch (o.tag) {
          case 5:
            le = o.stateNode, Fe = !1;
            break e;
          case 3:
            le = o.stateNode.containerInfo, Fe = !0;
            break e;
          case 4:
            le = o.stateNode.containerInfo, Fe = !0;
            break e;
        }
        o = o.return;
      }
      if (le === null) throw Error(k(160));
      Su(a, i, l), le = null, Fe = !1;
      var c = l.alternate;
      c !== null && (c.return = null), l.return = null;
    } catch (u) {
      Y(l, t, u);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) Cu(t, e), t = t.sibling;
}
function Cu(e, t) {
  var n = e.alternate, r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (Oe(t, e), Qe(e), r & 4) {
        try {
          er(3, e, e.return), Is(3, e);
        } catch (N) {
          Y(e, e.return, N);
        }
        try {
          er(5, e, e.return);
        } catch (N) {
          Y(e, e.return, N);
        }
      }
      break;
    case 1:
      Oe(t, e), Qe(e), r & 512 && n !== null && fn(n, n.return);
      break;
    case 5:
      if (Oe(t, e), Qe(e), r & 512 && n !== null && fn(n, n.return), e.flags & 32) {
        var l = e.stateNode;
        try {
          sr(l, "");
        } catch (N) {
          Y(e, e.return, N);
        }
      }
      if (r & 4 && (l = e.stateNode, l != null)) {
        var a = e.memoizedProps, i = n !== null ? n.memoizedProps : a, o = e.type, c = e.updateQueue;
        if (e.updateQueue = null, c !== null) try {
          o === "input" && a.type === "radio" && a.name != null && Qo(l, a), Dl(o, i);
          var u = Dl(o, a);
          for (i = 0; i < c.length; i += 2) {
            var h = c[i], f = c[i + 1];
            h === "style" ? Zo(l, f) : h === "dangerouslySetInnerHTML" ? Go(l, f) : h === "children" ? sr(l, f) : va(l, h, f, u);
          }
          switch (o) {
            case "input":
              Sl(l, a);
              break;
            case "textarea":
              Ko(l, a);
              break;
            case "select":
              var d = l._wrapperState.wasMultiple;
              l._wrapperState.wasMultiple = !!a.multiple;
              var g = a.value;
              g != null ? vn(l, !!a.multiple, g, !1) : d !== !!a.multiple && (a.defaultValue != null ? vn(
                l,
                !!a.multiple,
                a.defaultValue,
                !0
              ) : vn(l, !!a.multiple, a.multiple ? [] : "", !1));
          }
          l[fr] = a;
        } catch (N) {
          Y(e, e.return, N);
        }
      }
      break;
    case 6:
      if (Oe(t, e), Qe(e), r & 4) {
        if (e.stateNode === null) throw Error(k(162));
        l = e.stateNode, a = e.memoizedProps;
        try {
          l.nodeValue = a;
        } catch (N) {
          Y(e, e.return, N);
        }
      }
      break;
    case 3:
      if (Oe(t, e), Qe(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
        or(t.containerInfo);
      } catch (N) {
        Y(e, e.return, N);
      }
      break;
    case 4:
      Oe(t, e), Qe(e);
      break;
    case 13:
      Oe(t, e), Qe(e), l = e.child, l.flags & 8192 && (a = l.memoizedState !== null, l.stateNode.isHidden = a, !a || l.alternate !== null && l.alternate.memoizedState !== null || (Ya = G())), r & 4 && ao(e);
      break;
    case 22:
      if (h = n !== null && n.memoizedState !== null, e.mode & 1 ? (de = (u = de) || h, Oe(t, e), de = u) : Oe(t, e), Qe(e), r & 8192) {
        if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !h && e.mode & 1) for (_ = e, h = e.child; h !== null; ) {
          for (f = _ = h; _ !== null; ) {
            switch (d = _, g = d.child, d.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                er(4, d, d.return);
                break;
              case 1:
                fn(d, d.return);
                var j = d.stateNode;
                if (typeof j.componentWillUnmount == "function") {
                  r = d, n = d.return;
                  try {
                    t = r, j.props = t.memoizedProps, j.state = t.memoizedState, j.componentWillUnmount();
                  } catch (N) {
                    Y(r, n, N);
                  }
                }
                break;
              case 5:
                fn(d, d.return);
                break;
              case 22:
                if (d.memoizedState !== null) {
                  oo(f);
                  continue;
                }
            }
            g !== null ? (g.return = d, _ = g) : oo(f);
          }
          h = h.sibling;
        }
        e: for (h = null, f = e; ; ) {
          if (f.tag === 5) {
            if (h === null) {
              h = f;
              try {
                l = f.stateNode, u ? (a = l.style, typeof a.setProperty == "function" ? a.setProperty("display", "none", "important") : a.display = "none") : (o = f.stateNode, c = f.memoizedProps.style, i = c != null && c.hasOwnProperty("display") ? c.display : null, o.style.display = Xo("display", i));
              } catch (N) {
                Y(e, e.return, N);
              }
            }
          } else if (f.tag === 6) {
            if (h === null) try {
              f.stateNode.nodeValue = u ? "" : f.memoizedProps;
            } catch (N) {
              Y(e, e.return, N);
            }
          } else if ((f.tag !== 22 && f.tag !== 23 || f.memoizedState === null || f === e) && f.child !== null) {
            f.child.return = f, f = f.child;
            continue;
          }
          if (f === e) break e;
          for (; f.sibling === null; ) {
            if (f.return === null || f.return === e) break e;
            h === f && (h = null), f = f.return;
          }
          h === f && (h = null), f.sibling.return = f.return, f = f.sibling;
        }
      }
      break;
    case 19:
      Oe(t, e), Qe(e), r & 4 && ao(e);
      break;
    case 21:
      break;
    default:
      Oe(
        t,
        e
      ), Qe(e);
  }
}
function Qe(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (ku(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(k(160));
      }
      switch (r.tag) {
        case 5:
          var l = r.stateNode;
          r.flags & 32 && (sr(l, ""), r.flags &= -33);
          var a = lo(e);
          la(e, a, l);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo, o = lo(e);
          sa(e, o, i);
          break;
        default:
          throw Error(k(161));
      }
    } catch (c) {
      Y(e, e.return, c);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function jf(e, t, n) {
  _ = e, Eu(e);
}
function Eu(e, t, n) {
  for (var r = (e.mode & 1) !== 0; _ !== null; ) {
    var l = _, a = l.child;
    if (l.tag === 22 && r) {
      var i = l.memoizedState !== null || zr;
      if (!i) {
        var o = l.alternate, c = o !== null && o.memoizedState !== null || de;
        o = zr;
        var u = de;
        if (zr = i, (de = c) && !u) for (_ = l; _ !== null; ) i = _, c = i.child, i.tag === 22 && i.memoizedState !== null ? co(l) : c !== null ? (c.return = i, _ = c) : co(l);
        for (; a !== null; ) _ = a, Eu(a), a = a.sibling;
        _ = l, zr = o, de = u;
      }
      io(e);
    } else l.subtreeFlags & 8772 && a !== null ? (a.return = l, _ = a) : io(e);
  }
}
function io(e) {
  for (; _ !== null; ) {
    var t = _;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            de || Is(5, t);
            break;
          case 1:
            var r = t.stateNode;
            if (t.flags & 4 && !de) if (n === null) r.componentDidMount();
            else {
              var l = t.elementType === t.type ? n.memoizedProps : Re(t.type, n.memoizedProps);
              r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
            }
            var a = t.updateQueue;
            a !== null && Wi(t, a, r);
            break;
          case 3:
            var i = t.updateQueue;
            if (i !== null) {
              if (n = null, t.child !== null) switch (t.child.tag) {
                case 5:
                  n = t.child.stateNode;
                  break;
                case 1:
                  n = t.child.stateNode;
              }
              Wi(t, i, n);
            }
            break;
          case 5:
            var o = t.stateNode;
            if (n === null && t.flags & 4) {
              n = o;
              var c = t.memoizedProps;
              switch (t.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  c.autoFocus && n.focus();
                  break;
                case "img":
                  c.src && (n.src = c.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (t.memoizedState === null) {
              var u = t.alternate;
              if (u !== null) {
                var h = u.memoizedState;
                if (h !== null) {
                  var f = h.dehydrated;
                  f !== null && or(f);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(k(163));
        }
        de || t.flags & 512 && ra(t);
      } catch (d) {
        Y(t, t.return, d);
      }
    }
    if (t === e) {
      _ = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, _ = n;
      break;
    }
    _ = t.return;
  }
}
function oo(e) {
  for (; _ !== null; ) {
    var t = _;
    if (t === e) {
      _ = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, _ = n;
      break;
    }
    _ = t.return;
  }
}
function co(e) {
  for (; _ !== null; ) {
    var t = _;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Is(4, t);
          } catch (c) {
            Y(t, n, c);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var l = t.return;
            try {
              r.componentDidMount();
            } catch (c) {
              Y(t, l, c);
            }
          }
          var a = t.return;
          try {
            ra(t);
          } catch (c) {
            Y(t, a, c);
          }
          break;
        case 5:
          var i = t.return;
          try {
            ra(t);
          } catch (c) {
            Y(t, i, c);
          }
      }
    } catch (c) {
      Y(t, t.return, c);
    }
    if (t === e) {
      _ = null;
      break;
    }
    var o = t.sibling;
    if (o !== null) {
      o.return = t.return, _ = o;
      break;
    }
    _ = t.return;
  }
}
var Nf = Math.ceil, Ns = ut.ReactCurrentDispatcher, Qa = ut.ReactCurrentOwner, Le = ut.ReactCurrentBatchConfig, O = 0, ne = null, X = null, ae = 0, ke = 0, pn = _t(0), J = 0, xr = null, Qt = 0, $s = 0, Ka = 0, tr = null, ye = null, Ya = 0, Tn = 1 / 0, tt = null, ws = !1, aa = null, St = null, Br = !1, yt = null, ks = 0, nr = 0, ia = null, Jr = -1, es = 0;
function he() {
  return O & 6 ? G() : Jr !== -1 ? Jr : Jr = G();
}
function Ct(e) {
  return e.mode & 1 ? O & 2 && ae !== 0 ? ae & -ae : rf.transition !== null ? (es === 0 && (es = uc()), es) : (e = F, e !== 0 || (e = window.event, e = e === void 0 ? 16 : gc(e.type)), e) : 1;
}
function Ue(e, t, n, r) {
  if (50 < nr) throw nr = 0, ia = null, Error(k(185));
  Nr(e, n, r), (!(O & 2) || e !== ne) && (e === ne && (!(O & 2) && ($s |= n), J === 4 && vt(e, ae)), we(e, r), n === 1 && O === 0 && !(t.mode & 1) && (Tn = G() + 500, Ms && Mt()));
}
function we(e, t) {
  var n = e.callbackNode;
  rm(e, t);
  var r = as(e, e === ne ? ae : 0);
  if (r === 0) n !== null && yi(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = r & -r, e.callbackPriority !== t) {
    if (n != null && yi(n), t === 1) e.tag === 0 ? nf(uo.bind(null, e)) : Ac(uo.bind(null, e)), Zm(function() {
      !(O & 6) && Mt();
    }), n = null;
    else {
      switch (dc(r)) {
        case 1:
          n = Na;
          break;
        case 4:
          n = oc;
          break;
        case 16:
          n = ls;
          break;
        case 536870912:
          n = cc;
          break;
        default:
          n = ls;
      }
      n = Iu(n, bu.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function bu(e, t) {
  if (Jr = -1, es = 0, O & 6) throw Error(k(327));
  var n = e.callbackNode;
  if (Nn() && e.callbackNode !== n) return null;
  var r = as(e, e === ne ? ae : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = Ss(e, r);
  else {
    t = r;
    var l = O;
    O |= 2;
    var a = Du();
    (ne !== e || ae !== t) && (tt = null, Tn = G() + 500, Ut(e, t));
    do
      try {
        Sf();
        break;
      } catch (o) {
        Tu(e, o);
      }
    while (!0);
    Ia(), Ns.current = a, O = l, X !== null ? t = 0 : (ne = null, ae = 0, t = J);
  }
  if (t !== 0) {
    if (t === 2 && (l = Il(e), l !== 0 && (r = l, t = oa(e, l))), t === 1) throw n = xr, Ut(e, 0), vt(e, r), we(e, G()), n;
    if (t === 6) vt(e, r);
    else {
      if (l = e.current.alternate, !(r & 30) && !wf(l) && (t = Ss(e, r), t === 2 && (a = Il(e), a !== 0 && (r = a, t = oa(e, a))), t === 1)) throw n = xr, Ut(e, 0), vt(e, r), we(e, G()), n;
      switch (e.finishedWork = l, e.finishedLanes = r, t) {
        case 0:
        case 1:
          throw Error(k(345));
        case 2:
          Ot(e, ye, tt);
          break;
        case 3:
          if (vt(e, r), (r & 130023424) === r && (t = Ya + 500 - G(), 10 < t)) {
            if (as(e, 0) !== 0) break;
            if (l = e.suspendedLanes, (l & r) !== r) {
              he(), e.pingedLanes |= e.suspendedLanes & l;
              break;
            }
            e.timeoutHandle = Ul(Ot.bind(null, e, ye, tt), t);
            break;
          }
          Ot(e, ye, tt);
          break;
        case 4:
          if (vt(e, r), (r & 4194240) === r) break;
          for (t = e.eventTimes, l = -1; 0 < r; ) {
            var i = 31 - Be(r);
            a = 1 << i, i = t[i], i > l && (l = i), r &= ~a;
          }
          if (r = l, r = G() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Nf(r / 1960)) - r, 10 < r) {
            e.timeoutHandle = Ul(Ot.bind(null, e, ye, tt), r);
            break;
          }
          Ot(e, ye, tt);
          break;
        case 5:
          Ot(e, ye, tt);
          break;
        default:
          throw Error(k(329));
      }
    }
  }
  return we(e, G()), e.callbackNode === n ? bu.bind(null, e) : null;
}
function oa(e, t) {
  var n = tr;
  return e.current.memoizedState.isDehydrated && (Ut(e, t).flags |= 256), e = Ss(e, t), e !== 2 && (t = ye, ye = n, t !== null && ca(t)), e;
}
function ca(e) {
  ye === null ? ye = e : ye.push.apply(ye, e);
}
function wf(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
        var l = n[r], a = l.getSnapshot;
        l = l.value;
        try {
          if (!He(a(), l)) return !1;
        } catch {
          return !1;
        }
      }
    }
    if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
  }
  return !0;
}
function vt(e, t) {
  for (t &= ~Ka, t &= ~$s, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Be(t), r = 1 << n;
    e[n] = -1, t &= ~r;
  }
}
function uo(e) {
  if (O & 6) throw Error(k(327));
  Nn();
  var t = as(e, 0);
  if (!(t & 1)) return we(e, G()), null;
  var n = Ss(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = Il(e);
    r !== 0 && (t = r, n = oa(e, r));
  }
  if (n === 1) throw n = xr, Ut(e, 0), vt(e, t), we(e, G()), n;
  if (n === 6) throw Error(k(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, Ot(e, ye, tt), we(e, G()), null;
}
function Ga(e, t) {
  var n = O;
  O |= 1;
  try {
    return e(t);
  } finally {
    O = n, O === 0 && (Tn = G() + 500, Ms && Mt());
  }
}
function Kt(e) {
  yt !== null && yt.tag === 0 && !(O & 6) && Nn();
  var t = O;
  O |= 1;
  var n = Le.transition, r = F;
  try {
    if (Le.transition = null, F = 1, e) return e();
  } finally {
    F = r, Le.transition = n, O = t, !(O & 6) && Mt();
  }
}
function Xa() {
  ke = pn.current, V(pn);
}
function Ut(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, Xm(n)), X !== null) for (n = X.return; n !== null; ) {
    var r = n;
    switch (Ma(r), r.tag) {
      case 1:
        r = r.type.childContextTypes, r != null && ds();
        break;
      case 3:
        En(), V(je), V(me), za();
        break;
      case 5:
        Fa(r);
        break;
      case 4:
        En();
        break;
      case 13:
        V(W);
        break;
      case 19:
        V(W);
        break;
      case 10:
        $a(r.type._context);
        break;
      case 22:
      case 23:
        Xa();
    }
    n = n.return;
  }
  if (ne = e, X = e = Et(e.current, null), ae = ke = t, J = 0, xr = null, Ka = $s = Qt = 0, ye = tr = null, Ft !== null) {
    for (t = 0; t < Ft.length; t++) if (n = Ft[t], r = n.interleaved, r !== null) {
      n.interleaved = null;
      var l = r.next, a = n.pending;
      if (a !== null) {
        var i = a.next;
        a.next = l, r.next = i;
      }
      n.pending = r;
    }
    Ft = null;
  }
  return e;
}
function Tu(e, t) {
  do {
    var n = X;
    try {
      if (Ia(), Gr.current = js, xs) {
        for (var r = q.memoizedState; r !== null; ) {
          var l = r.queue;
          l !== null && (l.pending = null), r = r.next;
        }
        xs = !1;
      }
      if (qt = 0, te = Z = q = null, Jn = !1, vr = 0, Qa.current = null, n === null || n.return === null) {
        J = 1, xr = t, X = null;
        break;
      }
      e: {
        var a = e, i = n.return, o = n, c = t;
        if (t = ae, o.flags |= 32768, c !== null && typeof c == "object" && typeof c.then == "function") {
          var u = c, h = o, f = h.tag;
          if (!(h.mode & 1) && (f === 0 || f === 11 || f === 15)) {
            var d = h.alternate;
            d ? (h.updateQueue = d.updateQueue, h.memoizedState = d.memoizedState, h.lanes = d.lanes) : (h.updateQueue = null, h.memoizedState = null);
          }
          var g = Xi(i);
          if (g !== null) {
            g.flags &= -257, Zi(g, i, o, a, t), g.mode & 1 && Gi(a, u, t), t = g, c = u;
            var j = t.updateQueue;
            if (j === null) {
              var N = /* @__PURE__ */ new Set();
              N.add(c), t.updateQueue = N;
            } else j.add(c);
            break e;
          } else {
            if (!(t & 1)) {
              Gi(a, u, t), Za();
              break e;
            }
            c = Error(k(426));
          }
        } else if (H && o.mode & 1) {
          var w = Xi(i);
          if (w !== null) {
            !(w.flags & 65536) && (w.flags |= 256), Zi(w, i, o, a, t), La(bn(c, o));
            break e;
          }
        }
        a = c = bn(c, o), J !== 4 && (J = 2), tr === null ? tr = [a] : tr.push(a), a = i;
        do {
          switch (a.tag) {
            case 3:
              a.flags |= 65536, t &= -t, a.lanes |= t;
              var p = du(a, c, t);
              Hi(a, p);
              break e;
            case 1:
              o = c;
              var m = a.type, v = a.stateNode;
              if (!(a.flags & 128) && (typeof m.getDerivedStateFromError == "function" || v !== null && typeof v.componentDidCatch == "function" && (St === null || !St.has(v)))) {
                a.flags |= 65536, t &= -t, a.lanes |= t;
                var x = mu(a, o, t);
                Hi(a, x);
                break e;
              }
          }
          a = a.return;
        } while (a !== null);
      }
      Mu(n);
    } catch (S) {
      t = S, X === n && n !== null && (X = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function Du() {
  var e = Ns.current;
  return Ns.current = js, e === null ? js : e;
}
function Za() {
  (J === 0 || J === 3 || J === 2) && (J = 4), ne === null || !(Qt & 268435455) && !($s & 268435455) || vt(ne, ae);
}
function Ss(e, t) {
  var n = O;
  O |= 2;
  var r = Du();
  (ne !== e || ae !== t) && (tt = null, Ut(e, t));
  do
    try {
      kf();
      break;
    } catch (l) {
      Tu(e, l);
    }
  while (!0);
  if (Ia(), O = n, Ns.current = r, X !== null) throw Error(k(261));
  return ne = null, ae = 0, J;
}
function kf() {
  for (; X !== null; ) _u(X);
}
function Sf() {
  for (; X !== null && !Kd(); ) _u(X);
}
function _u(e) {
  var t = Pu(e.alternate, e, ke);
  e.memoizedProps = e.pendingProps, t === null ? Mu(e) : X = t, Qa.current = null;
}
function Mu(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = gf(n, t), n !== null) {
        n.flags &= 32767, X = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        J = 6, X = null;
        return;
      }
    } else if (n = vf(n, t, ke), n !== null) {
      X = n;
      return;
    }
    if (t = t.sibling, t !== null) {
      X = t;
      return;
    }
    X = t = e;
  } while (t !== null);
  J === 0 && (J = 5);
}
function Ot(e, t, n) {
  var r = F, l = Le.transition;
  try {
    Le.transition = null, F = 1, Cf(e, t, n, r);
  } finally {
    Le.transition = l, F = r;
  }
  return null;
}
function Cf(e, t, n, r) {
  do
    Nn();
  while (yt !== null);
  if (O & 6) throw Error(k(327));
  n = e.finishedWork;
  var l = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(k(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var a = n.lanes | n.childLanes;
  if (sm(e, a), e === ne && (X = ne = null, ae = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Br || (Br = !0, Iu(ls, function() {
    return Nn(), null;
  })), a = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || a) {
    a = Le.transition, Le.transition = null;
    var i = F;
    F = 1;
    var o = O;
    O |= 4, Qa.current = null, xf(e, n), Cu(n, e), Hm(zl), is = !!Fl, zl = Fl = null, e.current = n, jf(n), Yd(), O = o, F = i, Le.transition = a;
  } else e.current = n;
  if (Br && (Br = !1, yt = e, ks = l), a = e.pendingLanes, a === 0 && (St = null), Zd(n.stateNode), we(e, G()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], r(l.value, { componentStack: l.stack, digest: l.digest });
  if (ws) throw ws = !1, e = aa, aa = null, e;
  return ks & 1 && e.tag !== 0 && Nn(), a = e.pendingLanes, a & 1 ? e === ia ? nr++ : (nr = 0, ia = e) : nr = 0, Mt(), null;
}
function Nn() {
  if (yt !== null) {
    var e = dc(ks), t = Le.transition, n = F;
    try {
      if (Le.transition = null, F = 16 > e ? 16 : e, yt === null) var r = !1;
      else {
        if (e = yt, yt = null, ks = 0, O & 6) throw Error(k(331));
        var l = O;
        for (O |= 4, _ = e.current; _ !== null; ) {
          var a = _, i = a.child;
          if (_.flags & 16) {
            var o = a.deletions;
            if (o !== null) {
              for (var c = 0; c < o.length; c++) {
                var u = o[c];
                for (_ = u; _ !== null; ) {
                  var h = _;
                  switch (h.tag) {
                    case 0:
                    case 11:
                    case 15:
                      er(8, h, a);
                  }
                  var f = h.child;
                  if (f !== null) f.return = h, _ = f;
                  else for (; _ !== null; ) {
                    h = _;
                    var d = h.sibling, g = h.return;
                    if (wu(h), h === u) {
                      _ = null;
                      break;
                    }
                    if (d !== null) {
                      d.return = g, _ = d;
                      break;
                    }
                    _ = g;
                  }
                }
              }
              var j = a.alternate;
              if (j !== null) {
                var N = j.child;
                if (N !== null) {
                  j.child = null;
                  do {
                    var w = N.sibling;
                    N.sibling = null, N = w;
                  } while (N !== null);
                }
              }
              _ = a;
            }
          }
          if (a.subtreeFlags & 2064 && i !== null) i.return = a, _ = i;
          else e: for (; _ !== null; ) {
            if (a = _, a.flags & 2048) switch (a.tag) {
              case 0:
              case 11:
              case 15:
                er(9, a, a.return);
            }
            var p = a.sibling;
            if (p !== null) {
              p.return = a.return, _ = p;
              break e;
            }
            _ = a.return;
          }
        }
        var m = e.current;
        for (_ = m; _ !== null; ) {
          i = _;
          var v = i.child;
          if (i.subtreeFlags & 2064 && v !== null) v.return = i, _ = v;
          else e: for (i = m; _ !== null; ) {
            if (o = _, o.flags & 2048) try {
              switch (o.tag) {
                case 0:
                case 11:
                case 15:
                  Is(9, o);
              }
            } catch (S) {
              Y(o, o.return, S);
            }
            if (o === i) {
              _ = null;
              break e;
            }
            var x = o.sibling;
            if (x !== null) {
              x.return = o.return, _ = x;
              break e;
            }
            _ = o.return;
          }
        }
        if (O = l, Mt(), Xe && typeof Xe.onPostCommitFiberRoot == "function") try {
          Xe.onPostCommitFiberRoot(Es, e);
        } catch {
        }
        r = !0;
      }
      return r;
    } finally {
      F = n, Le.transition = t;
    }
  }
  return !1;
}
function mo(e, t, n) {
  t = bn(n, t), t = du(e, t, 1), e = kt(e, t, 1), t = he(), e !== null && (Nr(e, 1, t), we(e, t));
}
function Y(e, t, n) {
  if (e.tag === 3) mo(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      mo(t, e, n);
      break;
    } else if (t.tag === 1) {
      var r = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (St === null || !St.has(r))) {
        e = bn(n, e), e = mu(t, e, 1), t = kt(t, e, 1), e = he(), t !== null && (Nr(t, 1, e), we(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function Ef(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t), t = he(), e.pingedLanes |= e.suspendedLanes & n, ne === e && (ae & n) === n && (J === 4 || J === 3 && (ae & 130023424) === ae && 500 > G() - Ya ? Ut(e, 0) : Ka |= n), we(e, t);
}
function Lu(e, t) {
  t === 0 && (e.mode & 1 ? (t = Mr, Mr <<= 1, !(Mr & 130023424) && (Mr = 4194304)) : t = 1);
  var n = he();
  e = ot(e, t), e !== null && (Nr(e, t, n), we(e, n));
}
function bf(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), Lu(e, n);
}
function Tf(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode, l = e.memoizedState;
      l !== null && (n = l.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(k(314));
  }
  r !== null && r.delete(t), Lu(e, n);
}
var Pu;
Pu = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || je.current) xe = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return xe = !1, hf(e, t, n);
    xe = !!(e.flags & 131072);
  }
  else xe = !1, H && t.flags & 1048576 && Oc(t, ps, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var r = t.type;
      Zr(e, t), e = t.pendingProps;
      var l = kn(t, me.current);
      jn(t, n), l = Ua(null, t, r, e, l, n);
      var a = Va();
      return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ne(r) ? (a = !0, ms(t)) : a = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Oa(t), l.updater = Ps, t.stateNode = l, l._reactInternals = t, Yl(t, r, e, n), t = Zl(null, t, r, !0, a, n)) : (t.tag = 0, H && a && _a(t), pe(null, t, l, n), t = t.child), t;
    case 16:
      r = t.elementType;
      e: {
        switch (Zr(e, t), e = t.pendingProps, l = r._init, r = l(r._payload), t.type = r, l = t.tag = _f(r), e = Re(r, e), l) {
          case 0:
            t = Xl(null, t, r, e, n);
            break e;
          case 1:
            t = to(null, t, r, e, n);
            break e;
          case 11:
            t = Ji(null, t, r, e, n);
            break e;
          case 14:
            t = eo(null, t, r, Re(r.type, e), n);
            break e;
        }
        throw Error(k(
          306,
          r,
          ""
        ));
      }
      return t;
    case 0:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Re(r, l), Xl(e, t, r, l, n);
    case 1:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Re(r, l), to(e, t, r, l, n);
    case 3:
      e: {
        if (vu(t), e === null) throw Error(k(387));
        r = t.pendingProps, a = t.memoizedState, l = a.element, Vc(e, t), gs(t, r, null, n);
        var i = t.memoizedState;
        if (r = i.element, a.isDehydrated) if (a = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
          l = bn(Error(k(423)), t), t = no(e, t, r, n, l);
          break e;
        } else if (r !== l) {
          l = bn(Error(k(424)), t), t = no(e, t, r, n, l);
          break e;
        } else for (Se = wt(t.stateNode.containerInfo.firstChild), Ce = t, H = !0, ze = null, n = Bc(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (Sn(), r === l) {
            t = ct(e, t, n);
            break e;
          }
          pe(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return Hc(t), e === null && ql(t), r = t.type, l = t.pendingProps, a = e !== null ? e.memoizedProps : null, i = l.children, Bl(r, l) ? i = null : a !== null && Bl(r, a) && (t.flags |= 32), hu(e, t), pe(e, t, i, n), t.child;
    case 6:
      return e === null && ql(t), null;
    case 13:
      return gu(e, t, n);
    case 4:
      return Ra(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Cn(t, null, r, n) : pe(e, t, r, n), t.child;
    case 11:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Re(r, l), Ji(e, t, r, l, n);
    case 7:
      return pe(e, t, t.pendingProps, n), t.child;
    case 8:
      return pe(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return pe(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (r = t.type._context, l = t.pendingProps, a = t.memoizedProps, i = l.value, B(hs, r._currentValue), r._currentValue = i, a !== null) if (He(a.value, i)) {
          if (a.children === l.children && !je.current) {
            t = ct(e, t, n);
            break e;
          }
        } else for (a = t.child, a !== null && (a.return = t); a !== null; ) {
          var o = a.dependencies;
          if (o !== null) {
            i = a.child;
            for (var c = o.firstContext; c !== null; ) {
              if (c.context === r) {
                if (a.tag === 1) {
                  c = lt(-1, n & -n), c.tag = 2;
                  var u = a.updateQueue;
                  if (u !== null) {
                    u = u.shared;
                    var h = u.pending;
                    h === null ? c.next = c : (c.next = h.next, h.next = c), u.pending = c;
                  }
                }
                a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), Ql(
                  a.return,
                  n,
                  t
                ), o.lanes |= n;
                break;
              }
              c = c.next;
            }
          } else if (a.tag === 10) i = a.type === t.type ? null : a.child;
          else if (a.tag === 18) {
            if (i = a.return, i === null) throw Error(k(341));
            i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), Ql(i, n, t), i = a.sibling;
          } else i = a.child;
          if (i !== null) i.return = a;
          else for (i = a; i !== null; ) {
            if (i === t) {
              i = null;
              break;
            }
            if (a = i.sibling, a !== null) {
              a.return = i.return, i = a;
              break;
            }
            i = i.return;
          }
          a = i;
        }
        pe(e, t, l.children, n), t = t.child;
      }
      return t;
    case 9:
      return l = t.type, r = t.pendingProps.children, jn(t, n), l = Ie(l), r = r(l), t.flags |= 1, pe(e, t, r, n), t.child;
    case 14:
      return r = t.type, l = Re(r, t.pendingProps), l = Re(r.type, l), eo(e, t, r, l, n);
    case 15:
      return fu(e, t, t.type, t.pendingProps, n);
    case 17:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Re(r, l), Zr(e, t), t.tag = 1, Ne(r) ? (e = !0, ms(t)) : e = !1, jn(t, n), uu(t, r, l), Yl(t, r, l, n), Zl(null, t, r, !0, e, n);
    case 19:
      return yu(e, t, n);
    case 22:
      return pu(e, t, n);
  }
  throw Error(k(156, t.tag));
};
function Iu(e, t) {
  return ic(e, t);
}
function Df(e, t, n, r) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function Me(e, t, n, r) {
  return new Df(e, t, n, r);
}
function Ja(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function _f(e) {
  if (typeof e == "function") return Ja(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === ya) return 11;
    if (e === xa) return 14;
  }
  return 2;
}
function Et(e, t) {
  var n = e.alternate;
  return n === null ? (n = Me(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function ts(e, t, n, r, l, a) {
  var i = 2;
  if (r = e, typeof e == "function") Ja(e) && (i = 1);
  else if (typeof e == "string") i = 5;
  else e: switch (e) {
    case rn:
      return Vt(n.children, l, a, t);
    case ga:
      i = 8, l |= 8;
      break;
    case xl:
      return e = Me(12, n, t, l | 2), e.elementType = xl, e.lanes = a, e;
    case jl:
      return e = Me(13, n, t, l), e.elementType = jl, e.lanes = a, e;
    case Nl:
      return e = Me(19, n, t, l), e.elementType = Nl, e.lanes = a, e;
    case Ho:
      return As(n, l, a, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case Uo:
          i = 10;
          break e;
        case Vo:
          i = 9;
          break e;
        case ya:
          i = 11;
          break e;
        case xa:
          i = 14;
          break e;
        case ft:
          i = 16, r = null;
          break e;
      }
      throw Error(k(130, e == null ? e : typeof e, ""));
  }
  return t = Me(i, n, t, l), t.elementType = e, t.type = r, t.lanes = a, t;
}
function Vt(e, t, n, r) {
  return e = Me(7, e, r, t), e.lanes = n, e;
}
function As(e, t, n, r) {
  return e = Me(22, e, r, t), e.elementType = Ho, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function pl(e, t, n) {
  return e = Me(6, e, null, t), e.lanes = n, e;
}
function hl(e, t, n) {
  return t = Me(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function Mf(e, t, n, r, l) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Ys(0), this.expirationTimes = Ys(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ys(0), this.identifierPrefix = r, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
}
function ei(e, t, n, r, l, a, i, o, c) {
  return e = new Mf(e, t, n, o, c), t === 1 ? (t = 1, a === !0 && (t |= 8)) : t = 0, a = Me(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Oa(a), e;
}
function Lf(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: nn, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
}
function $u(e) {
  if (!e) return Tt;
  e = e._reactInternals;
  e: {
    if (Gt(e) !== e || e.tag !== 1) throw Error(k(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Ne(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(k(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (Ne(n)) return $c(e, n, t);
  }
  return t;
}
function Au(e, t, n, r, l, a, i, o, c) {
  return e = ei(n, r, !0, e, l, a, i, o, c), e.context = $u(null), n = e.current, r = he(), l = Ct(n), a = lt(r, l), a.callback = t ?? null, kt(n, a, l), e.current.lanes = l, Nr(e, l, r), we(e, r), e;
}
function Os(e, t, n, r) {
  var l = t.current, a = he(), i = Ct(l);
  return n = $u(n), t.context === null ? t.context = n : t.pendingContext = n, t = lt(a, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = kt(l, t, i), e !== null && (Ue(e, l, i, a), Yr(e, l, i)), i;
}
function Cs(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function fo(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function ti(e, t) {
  fo(e, t), (e = e.alternate) && fo(e, t);
}
function Pf() {
  return null;
}
var Ou = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function ni(e) {
  this._internalRoot = e;
}
Rs.prototype.render = ni.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(k(409));
  Os(e, t, null, null);
};
Rs.prototype.unmount = ni.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Kt(function() {
      Os(null, e, null, null);
    }), t[it] = null;
  }
};
function Rs(e) {
  this._internalRoot = e;
}
Rs.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = pc();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < ht.length && t !== 0 && t < ht[n].priority; n++) ;
    ht.splice(n, 0, e), n === 0 && vc(e);
  }
};
function ri(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function Fs(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function po() {
}
function If(e, t, n, r, l) {
  if (l) {
    if (typeof r == "function") {
      var a = r;
      r = function() {
        var u = Cs(i);
        a.call(u);
      };
    }
    var i = Au(t, r, e, 0, null, !1, !1, "", po);
    return e._reactRootContainer = i, e[it] = i.current, dr(e.nodeType === 8 ? e.parentNode : e), Kt(), i;
  }
  for (; l = e.lastChild; ) e.removeChild(l);
  if (typeof r == "function") {
    var o = r;
    r = function() {
      var u = Cs(c);
      o.call(u);
    };
  }
  var c = ei(e, 0, !1, null, null, !1, !1, "", po);
  return e._reactRootContainer = c, e[it] = c.current, dr(e.nodeType === 8 ? e.parentNode : e), Kt(function() {
    Os(t, c, n, r);
  }), c;
}
function zs(e, t, n, r, l) {
  var a = n._reactRootContainer;
  if (a) {
    var i = a;
    if (typeof l == "function") {
      var o = l;
      l = function() {
        var c = Cs(i);
        o.call(c);
      };
    }
    Os(t, i, e, l);
  } else i = If(n, t, e, l, r);
  return Cs(i);
}
mc = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = qn(t.pendingLanes);
        n !== 0 && (wa(t, n | 1), we(t, G()), !(O & 6) && (Tn = G() + 500, Mt()));
      }
      break;
    case 13:
      Kt(function() {
        var r = ot(e, 1);
        if (r !== null) {
          var l = he();
          Ue(r, e, 1, l);
        }
      }), ti(e, 1);
  }
};
ka = function(e) {
  if (e.tag === 13) {
    var t = ot(e, 134217728);
    if (t !== null) {
      var n = he();
      Ue(t, e, 134217728, n);
    }
    ti(e, 134217728);
  }
};
fc = function(e) {
  if (e.tag === 13) {
    var t = Ct(e), n = ot(e, t);
    if (n !== null) {
      var r = he();
      Ue(n, e, t, r);
    }
    ti(e, t);
  }
};
pc = function() {
  return F;
};
hc = function(e, t) {
  var n = F;
  try {
    return F = e, t();
  } finally {
    F = n;
  }
};
Ml = function(e, t, n) {
  switch (t) {
    case "input":
      if (Sl(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var l = _s(r);
            if (!l) throw Error(k(90));
            qo(r), Sl(r, l);
          }
        }
      }
      break;
    case "textarea":
      Ko(e, n);
      break;
    case "select":
      t = n.value, t != null && vn(e, !!n.multiple, t, !1);
  }
};
tc = Ga;
nc = Kt;
var $f = { usingClientEntryPoint: !1, Events: [kr, on, _s, Jo, ec, Ga] }, Un = { findFiberByHostInstance: Rt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Af = { bundleType: Un.bundleType, version: Un.version, rendererPackageName: Un.rendererPackageName, rendererConfig: Un.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ut.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = lc(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Un.findFiberByHostInstance || Pf, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Ur = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Ur.isDisabled && Ur.supportsFiber) try {
    Es = Ur.inject(Af), Xe = Ur;
  } catch {
  }
}
be.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = $f;
be.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!ri(t)) throw Error(k(200));
  return Lf(e, t, null, n);
};
be.createRoot = function(e, t) {
  if (!ri(e)) throw Error(k(299));
  var n = !1, r = "", l = Ou;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = ei(e, 1, !1, null, null, n, !1, r, l), e[it] = t.current, dr(e.nodeType === 8 ? e.parentNode : e), new ni(t);
};
be.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(k(188)) : (e = Object.keys(e).join(","), Error(k(268, e)));
  return e = lc(t), e = e === null ? null : e.stateNode, e;
};
be.flushSync = function(e) {
  return Kt(e);
};
be.hydrate = function(e, t, n) {
  if (!Fs(t)) throw Error(k(200));
  return zs(null, e, t, !0, n);
};
be.hydrateRoot = function(e, t, n) {
  if (!ri(e)) throw Error(k(405));
  var r = n != null && n.hydratedSources || null, l = !1, a = "", i = Ou;
  if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (a = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = Au(t, null, e, 1, n ?? null, l, !1, a, i), e[it] = t.current, dr(e), r) for (e = 0; e < r.length; e++) n = r[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
    n,
    l
  );
  return new Rs(t);
};
be.render = function(e, t, n) {
  if (!Fs(t)) throw Error(k(200));
  return zs(null, e, t, !1, n);
};
be.unmountComponentAtNode = function(e) {
  if (!Fs(e)) throw Error(k(40));
  return e._reactRootContainer ? (Kt(function() {
    zs(null, null, e, !1, function() {
      e._reactRootContainer = null, e[it] = null;
    });
  }), !0) : !1;
};
be.unstable_batchedUpdates = Ga;
be.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
  if (!Fs(n)) throw Error(k(200));
  if (e == null || e._reactInternals === void 0) throw Error(k(38));
  return zs(e, t, n, !1, r);
};
be.version = "18.3.1-next-f1338f8080-20240426";
function Ru() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Ru);
    } catch (e) {
      console.error(e);
    }
}
Ru(), Ro.exports = be;
var Of = Ro.exports, oe, ho = Of;
oe = ho.createRoot, ho.hydrateRoot;
var Fu = { exports: {} }, Bs = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Rf = y, Ff = Symbol.for("react.element"), zf = Symbol.for("react.fragment"), Bf = Object.prototype.hasOwnProperty, Uf = Rf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, Vf = { key: !0, ref: !0, __self: !0, __source: !0 };
function zu(e, t, n) {
  var r, l = {}, a = null, i = null;
  n !== void 0 && (a = "" + n), t.key !== void 0 && (a = "" + t.key), t.ref !== void 0 && (i = t.ref);
  for (r in t) Bf.call(t, r) && !Vf.hasOwnProperty(r) && (l[r] = t[r]);
  if (e && e.defaultProps) for (r in t = e.defaultProps, t) l[r] === void 0 && (l[r] = t[r]);
  return { $$typeof: Ff, type: e, key: a, ref: i, props: l, _owner: Uf.current };
}
Bs.Fragment = zf;
Bs.jsx = zu;
Bs.jsxs = zu;
Fu.exports = Bs;
var s = Fu.exports;
const vo = {
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
  document: '<path d="M7 3.5h7l4 4v13H7v-17Z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
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
  // Visual Redesign Batch 6: a disclosure-toggle chevron, needed for
  // Dashboard's new collapsible bucket summaries — no existing icon in
  // this table serves that role. Not invented from scratch: reuses the
  // exact path geometry already drawn for .select's own dropdown arrow
  // (components.css's inline SVG background-image), so it's visually
  // identical to a shape already established elsewhere in the app rather
  // than a new, unrelated glyph.
  chevron: '<path d="M6 9l6 6 6-6"/>'
};
function Bu(e, t = "") {
  const n = vo[e] || vo.info;
  return `<svg class="${t ? `icon ${t}` : "icon"}" viewBox="0 0 24 24" aria-hidden="true">${n}</svg>`;
}
function C({ name: e, cls: t = "" }) {
  return /* @__PURE__ */ s.jsx("span", { dangerouslySetInnerHTML: { __html: Bu(e, t) } });
}
function Hf(e) {
  const [t, n] = y.useState(null), [r, l] = y.useState(!0), [a, i] = y.useState(null), o = y.useCallback(async () => {
    l(!0), i(null);
    try {
      const c = await e.get("/api/dashboard");
      n(c);
    } catch (c) {
      i(c);
    } finally {
      l(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    o();
  }, [o]), { data: t, loading: r, error: a, refetch: o };
}
function Uu(e, t) {
  return `${(e || "?")[0] || ""}${(t || "")[0] || ""}`.toUpperCase();
}
function Ve(e) {
  if (!e) return "";
  const t = new Date(e.length <= 10 ? e + "T00:00:00" : e), n = /* @__PURE__ */ new Date(), r = t.getFullYear() === n.getFullYear();
  return t.toLocaleDateString(void 0, { month: "short", day: "numeric", year: r ? void 0 : "numeric" });
}
function Vu(e) {
  const t = /* @__PURE__ */ new Date(e + "T00:00:00"), n = /* @__PURE__ */ new Date(), r = n.toISOString().slice(0, 10), l = new Date(n);
  l.setDate(l.getDate() + 1);
  const a = l.toISOString().slice(0, 10);
  return e === r ? "Today" : e === a ? "Tomorrow" : t.toLocaleDateString(void 0, { weekday: "long", month: "short", day: "numeric" });
}
function Hu(e) {
  if (!e) return "";
  if (/^\d{2}:\d{2}$/.test(e)) {
    const [t, n] = e.split(":").map(Number);
    return new Date(2e3, 0, 1, t, n).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
  return new Date(e).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
}
function Us(e) {
  if (!e) return "";
  const t = new Date(e.includes("T") || e.includes(" ") ? e.replace(" ", "T") + (e.endsWith("Z") ? "" : "Z") : e), n = Date.now() - t.getTime(), r = Math.round(n / 6e4);
  if (r < 1) return "just now";
  if (r < 60) return `${r}m ago`;
  const l = Math.round(r / 60);
  if (l < 24) return `${l}h ago`;
  const a = Math.round(l / 24);
  return a < 7 ? `${a}d ago` : Ve(e);
}
function Bt(e, t = "EUR") {
  try {
    return new Intl.NumberFormat(void 0, { style: "currency", currency: t }).format(e);
  } catch {
    return `${e} ${t}`;
  }
}
function Wu(e) {
  if (e == null) return "";
  const t = Math.floor(e / 60), n = e % 60;
  return t && n ? `${t}h ${n}m` : t ? `${t}h` : `${n}m`;
}
const si = { critical: "Critical", high: "High", medium: "Medium", low: "Low" }, Wf = { todo: "To do", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
function li(e) {
  return e == null ? "" : e < 0 ? `${Math.abs(e)}d overdue` : e === 0 ? "Due today" : e === 1 ? "Due tomorrow" : `Due in ${e}d`;
}
const qf = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };
function Qf(e) {
  const t = /* @__PURE__ */ new Date();
  t.setHours(0, 0, 0, 0);
  const n = /* @__PURE__ */ new Date(e + "T00:00:00");
  return Math.round((n - t) / 864e5);
}
function Kf({ item: e, onComplete: t }) {
  const n = e.kind === "task", r = qf[e.priority] || "badge-medium", l = e.due_date ? li(Qf(e.due_date)) : "";
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    n ? /* @__PURE__ */ s.jsx("button", { className: "row-check", "aria-label": "Complete", onClick: () => t(e.id), children: /* @__PURE__ */ s.jsx(C, { name: "check" }) }) : /* @__PURE__ */ s.jsx("div", { className: "row-check", style: { pointerEvents: "none", opacity: 0.35 }, children: /* @__PURE__ */ s.jsx(C, { name: e.kind === "bill" ? "bill" : "decision", cls: "icon-sm" }) }),
    /* @__PURE__ */ s.jsxs("a", { className: "row-main row-item-btn", href: e.link, style: { textDecoration: "none" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.title }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { className: `badge ${r}`, children: e.priority }),
        l ? /* @__PURE__ */ s.jsx("span", { children: l }) : null
      ] })
    ] })
  ] });
}
function Yf({ title: e, items: t, color: n, emptyText: r, onComplete: l, dominant: a }) {
  const [i, o] = y.useState(!1), c = a || i, u = `bucket-list-${e.toLowerCase().replace(/\s+/g, "-")}`;
  return /* @__PURE__ */ s.jsxs("div", { className: a ? "card card-pad" : "card card-pad card-flat", children: [
    a ? /* @__PURE__ */ s.jsxs("div", { className: "bucket-header", style: { marginBottom: "var(--sp-3)" }, children: [
      /* @__PURE__ */ s.jsx("span", { className: "badge-dot-lg", style: { background: n } }),
      /* @__PURE__ */ s.jsx("span", { style: { font: "var(--type-section-label)" }, children: e }),
      /* @__PURE__ */ s.jsx("span", { className: "muted text-xs", style: { marginLeft: "auto" }, children: t.length })
    ] }) : /* @__PURE__ */ s.jsxs(
      "button",
      {
        className: "bucket-header bucket-toggle",
        "aria-expanded": i,
        "aria-controls": u,
        onClick: () => o((h) => !h),
        children: [
          /* @__PURE__ */ s.jsx("span", { className: "badge-dot-lg", style: { background: n } }),
          /* @__PURE__ */ s.jsx("span", { className: "card-title", children: e }),
          /* @__PURE__ */ s.jsx("span", { className: "muted text-xs", style: { marginLeft: "auto" }, children: t.length }),
          /* @__PURE__ */ s.jsx(C, { name: "chevron", cls: "icon-sm bucket-chevron" })
        ]
      }
    ),
    c ? /* @__PURE__ */ s.jsx("div", { id: u, children: t.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: t.map((h) => /* @__PURE__ */ s.jsx(Kf, { item: h, onComplete: l }, `${h.kind}-${h.id}`)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: r }) }) : null
  ] });
}
function Gf({ goals: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Goals in progress" }),
      /* @__PURE__ */ s.jsx("a", { href: "#/goals", className: "text-xs", style: { color: "var(--brand)" }, children: "View all" })
    ] }),
    e.length ? e.map((t) => /* @__PURE__ */ s.jsxs("div", { style: { marginBottom: "var(--sp-3)" }, children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row-between text-sm", style: { marginBottom: 4 }, children: [
        /* @__PURE__ */ s.jsx("span", { children: t.title }),
        /* @__PURE__ */ s.jsxs("span", { className: "muted", children: [
          t.progress,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "progress-track", children: /* @__PURE__ */ s.jsx("div", { className: "progress-fill", style: { width: `${t.progress}%` } }) })
    ] }, t.id)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No active goals yet." })
  ] });
}
const Xf = {
  task_created: { icon: "tasks" },
  task_completed: { icon: "tasks" },
  comment: { icon: "message" },
  bill_paid: { icon: "bill", accent: "money" },
  decision_made: { icon: "decision", accent: "reasoning" },
  goal_progress: { icon: "goal", accent: "warmth" },
  member_joined: { icon: "family", accent: "warmth" },
  member_left: { icon: "family", accent: "warmth" },
  ownership_transferred: { icon: "family", accent: "warmth" },
  invite_code_changed: { icon: "family", accent: "warmth" }
}, Zf = { icon: "timeline" };
function Jf({ event: e }) {
  const t = Xf[e.type] || Zf, n = t.accent ? `module-accent--${t.accent}` : "module-accent--none", r = /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx(C, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", style: { whiteSpace: "normal", fontWeight: 500 }, children: e.summary }),
      /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: Us(e.createdAt) })
    ] })
  ] });
  return e.link ? /* @__PURE__ */ s.jsx("a", { className: `row-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ s.jsx("div", { className: `row-item ${n}`, children: r });
}
function ep({ activity: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Circle activity" }) }),
    e.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: e.slice(0, 6).map((t) => /* @__PURE__ */ s.jsx(Jf, { event: t }, t.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No circle activity yet. Create a circle to share tasks and updates." })
  ] });
}
function tp({ count: e }) {
  return /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { borderColor: "var(--warning-400)" }, children: /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-3)" }, children: [
    /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsxs("strong", { className: "text-sm", children: [
        e,
        " schedule conflict",
        e === 1 ? "" : "s",
        " detected"
      ] }),
      /* @__PURE__ */ s.jsxs("p", { className: "text-xs muted", style: { marginTop: 2 }, children: [
        "Some timed tasks overlap. ",
        /* @__PURE__ */ s.jsx("a", { href: "#/tasks", style: { color: "var(--brand)" }, children: "Review tasks" })
      ] })
    ] })
  ] }) });
}
function np({ onSeedDemo: e }) {
  const [t, n] = y.useState(!1);
  async function r() {
    n(!0), await e(), n(!1);
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "onboard-card", children: [
    /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-lg" }),
    /* @__PURE__ */ s.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ s.jsx("strong", { children: "Get started with LifeAdmin" }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginTop: 2 }, children: "Add a real task or bill, create a circle, or load sample data to see everything in action." })
    ] }),
    /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", disabled: t, onClick: r, children: t ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Adding sample data…"
    ] }) : "Load demo data" })
  ] });
}
function rp(e) {
  return e < 12 ? "Good morning" : e < 18 ? "Good afternoon" : "Good evening";
}
function sp({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { data: l, loading: a, error: i, refetch: o } = Hf(t), c = y.useMemo(() => rp((/* @__PURE__ */ new Date()).getHours()), []), u = y.useMemo(
    () => (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" }),
    []
  );
  async function h(w) {
    try {
      await t.patch(`/api/tasks/${w}`, { status: "completed" }), n("Task completed", "success"), o();
    } catch (p) {
      n(p.message, "error");
    }
  }
  async function f() {
    await t.post("/api/demo/seed"), n("Demo data added", "success");
    const { families: w } = await t.get("/api/family");
    r.families = w, o();
  }
  if (a)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Preparing your dashboard…"
    ] }) });
  if (i)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: i.message || "Something went wrong loading this page." })
    ] }) });
  const d = l.counts.tasks === 0 && l.counts.bills === 0 && !r.families.length, g = [
    ...l.overdue && l.overdue.length ? [{ key: "overdue", title: "Overdue", items: l.overdue, color: "var(--danger-500)", emptyText: "" }] : [],
    { key: "needsAttention", title: "Needs attention", items: l.needsAttention, color: "var(--danger-500)", emptyText: "Nothing needs urgent attention — nice work." },
    { key: "comingSoon", title: "Coming soon", items: l.comingSoon, color: "var(--warning-500)", emptyText: "Nothing coming up in the next few days." },
    { key: "canWait", title: "Can wait", items: l.canWait, color: "var(--priority-low)", emptyText: "Nothing low-priority queued up." }
  ], j = g.findIndex((w) => w.items.length > 0), N = j === -1;
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsxs("h1", { className: "page-title", children: [
        c,
        ", ",
        r.user.firstName
      ] }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Here's what matters in your life right now." })
    ] }) }),
    d ? /* @__PURE__ */ s.jsx(np, { onSeedDemo: f }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "today-banner", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h2", { children: l.today.count === 0 ? "Nothing urgent today" : `${l.today.count} thing${l.today.count === 1 ? "" : "s"} need${l.today.count === 1 ? "s" : ""} your attention` }),
        /* @__PURE__ */ s.jsx("p", { children: u })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "today-count", children: l.today.count })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ s.jsx("div", { className: "stack", children: N ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", style: { padding: "var(--sp-6) var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsx(C, { name: "check", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "You're all caught up" }),
        /* @__PURE__ */ s.jsx("p", { children: "Nothing needs your attention right now." })
      ] }) }) : g.map((w, p) => /* @__PURE__ */ s.jsx(
        Yf,
        {
          title: w.title,
          items: w.items,
          color: w.color,
          emptyText: w.emptyText,
          onComplete: h,
          dominant: p === j
        },
        w.key
      )) }),
      /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ s.jsx(Gf, { goals: l.goalsInProgress }),
        /* @__PURE__ */ s.jsx(ep, { activity: l.familyActivity }),
        l.conflicts > 0 ? /* @__PURE__ */ s.jsx(tp, { count: l.conflicts }) : null
      ] })
    ] })
  ] });
}
function lp(e, t, n) {
  const r = { ...e };
  return r[t] = e[t] === n ? "" : n, t === "view" && r.view !== n && (r.view = "all"), r;
}
function ap(e) {
  const [t, n] = y.useState({ view: "all", status: "", q: "" }), [r, l] = y.useState(""), [a, i] = y.useState([]), [o, c] = y.useState(!0), [u, h] = y.useState(null), f = y.useCallback(
    async (d) => {
      c(!0), h(null);
      try {
        const g = new URLSearchParams();
        d.view && d.view !== "all" && g.set("view", d.view), d.status && g.set("status", d.status), d.q && g.set("q", d.q);
        const { tasks: j } = await e.get(`/api/tasks?${g.toString()}`);
        i(j);
      } catch (g) {
        h(g);
      } finally {
        c(!1);
      }
    },
    [e]
  );
  return y.useEffect(() => {
    f(t);
  }, [t, f]), y.useEffect(() => {
    const d = r.trim(), g = setTimeout(() => {
      n((j) => j.q === d ? j : { ...j, q: d });
    }, 250);
    return () => clearTimeout(g);
  }, [r]), {
    tasks: a,
    loading: o,
    error: u,
    filters: t,
    toggleFilter: (d, g) => n((j) => lp(j, d, g)),
    searchValue: r,
    setSearchValue: l,
    refetch: () => f(t)
  };
}
const ip = [
  ["all", "All"],
  ["today", "Today"],
  ["upcoming", "Upcoming"],
  ["overdue", "Overdue"]
];
function op({ filters: e, onToggle: t, searchValue: n, onSearchChange: r }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "filter-bar", children: [
    ip.map(([l, a]) => /* @__PURE__ */ s.jsx(
      "button",
      {
        className: `pill ${e.view === l ? "active" : ""}`,
        onClick: () => t("view", l),
        children: a
      },
      l
    )),
    /* @__PURE__ */ s.jsx("div", { style: { width: 1, height: 20, background: "var(--surface-border-strong)", margin: "0 4px" } }),
    /* @__PURE__ */ s.jsx(
      "button",
      {
        className: `pill ${e.status === "completed" ? "active" : ""}`,
        onClick: () => t("status", "completed"),
        children: "Completed"
      }
    ),
    /* @__PURE__ */ s.jsx("div", { style: { flex: 1 } }),
    /* @__PURE__ */ s.jsx(
      "input",
      {
        className: "input",
        placeholder: "Search tasks…",
        style: { maxWidth: 220 },
        value: n,
        onChange: (l) => r(l.target.value)
      }
    )
  ] });
}
const cp = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };
function up({ task: e, onOpen: t, onToggleCheck: n }) {
  const r = e.status === "completed", l = e.status === "cancelled";
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ s.jsx(
      "button",
      {
        className: `row-check ${r ? "checked" : ""}`,
        disabled: l,
        "aria-label": "Toggle complete",
        onClick: () => n(e),
        children: /* @__PURE__ */ s.jsx(C, { name: "check" })
      }
    ),
    /* @__PURE__ */ s.jsxs("button", { className: "row-main row-item-btn", onClick: () => t(e.id), children: [
      /* @__PURE__ */ s.jsx("div", { className: `row-title ${r ? "done" : ""}`, children: e.title }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { className: `badge ${cp[e.priority]}`, children: si[e.priority] }),
        e.dueDate ? /* @__PURE__ */ s.jsxs("span", { children: [
          Ve(e.dueDate),
          e.startTime ? " · " + Hu(e.startTime) : ""
        ] }) : null,
        e.durationMinutes ? /* @__PURE__ */ s.jsx("span", { children: Wu(e.durationMinutes) }) : null,
        e.familyId ? /* @__PURE__ */ s.jsx(C, { name: "family", cls: "icon-sm" }) : null,
        e.recurrence ? /* @__PURE__ */ s.jsxs("span", { children: [
          /* @__PURE__ */ s.jsx(C, { name: "refresh", cls: "icon-sm" }),
          " ",
          e.recurrence
        ] }) : null,
        l ? /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: "Cancelled" }) : null
      ] })
    ] })
  ] });
}
const dp = [
  ["default", "As usual (my setting)"],
  ["none", "No reminder"],
  ["0", "When it is due"],
  ["60", "1 hour before"],
  ["300", "5 hours before"],
  ["720", "12 hours before"],
  ["1440", "1 day before"],
  ["4320", "3 days before"],
  ["7200", "5 days before"],
  ["10080", "1 week before"]
];
function mp(e) {
  return !e || e.mode === "default" ? "default" : e.mode === "none" ? "none" : String(e.minutesBefore);
}
function qu(e) {
  return !e || e === "default" ? { mode: "default" } : e === "none" ? { mode: "none" } : { mode: "custom", minutesBefore: Number(e) };
}
function Qu({ existing: e, hint: t }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "item-reminder", children: "Remind me" }),
    /* @__PURE__ */ s.jsx("select", { id: "item-reminder", className: "select", name: "reminder", defaultValue: mp(e), children: dp.map(([n, r]) => /* @__PURE__ */ s.jsx("option", { value: n, children: r }, n)) }),
    t ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginTop: "var(--sp-1)" }, children: t }) : null
  ] });
}
const Ke = document.getElementById("modal-root");
let hn = null, Vn = null, en = null, tn = null;
const fp = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function fe({ title: e, bodyHtml: t, footerHtml: n = "", size: r = "", onMount: l, onClose: a }) {
  if (Vn) {
    const c = Vn;
    Vn = null, c();
  }
  Ke.classList.contains("open") || (en = document.activeElement), tn && (document.removeEventListener("keydown", tn), tn = null), Ke.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel ${r === "lg" ? "modal-lg" : ""}" role="dialog" aria-modal="true" aria-label="${e || ""}">
      <div class="modal-header">
        <div class="modal-title">${e || ""}</div>
        <button class="icon-btn" data-close aria-label="Close">${Bu("x")}</button>
      </div>
      <div class="modal-body">${t}</div>
      ${n ? `<div class="modal-footer">${n}</div>` : ""}
    </div>
  `, Ke.classList.add("open"), document.body.style.overflow = "hidden", Vn = a || null, hn = () => {
    Ke.classList.remove("open"), Ke.innerHTML = "", document.body.style.overflow = "", a && a(), Vn = null, document.removeEventListener("keydown", i), tn === i && (tn = null), en && en.isConnected && typeof en.focus == "function" && en.focus(), en = null;
  }, Ke.querySelectorAll("[data-close]").forEach((c) => c.addEventListener("click", hn));
  function i(c) {
    if (c.key === "Escape") return hn();
    if (c.key !== "Tab") return;
    const u = Ke.querySelector(".modal-panel");
    if (!u) return;
    const h = [...u.querySelectorAll(fp)].filter((j) => j.offsetParent !== null);
    if (!h.length) return c.preventDefault();
    const f = h[0], d = h[h.length - 1], g = document.activeElement;
    u.contains(g) ? c.shiftKey && g === f ? (c.preventDefault(), d.focus()) : !c.shiftKey && g === d && (c.preventDefault(), f.focus()) : (c.preventDefault(), (c.shiftKey ? d : f).focus());
  }
  tn = i, document.addEventListener("keydown", i), l && l(Ke);
  const o = Ke.querySelector(".modal-panel");
  return setTimeout(() => {
    const c = Ke.querySelector(".modal-panel");
    if (!c || c !== o || c.contains(document.activeElement)) return;
    const u = c.querySelector(".modal-body input:not([type=hidden]):not([disabled]),.modal-body select:not([disabled]),.modal-body textarea:not([disabled])") || c.querySelector(".modal-footer button:not([disabled])") || c.querySelector(".modal-body button:not([disabled])") || c.querySelector("[data-close]");
    u && u.focus();
  }, 0), hn;
}
function re() {
  hn && hn();
}
const pp = ["critical", "high", "medium", "low"], hp = ["daily", "weekdays", "weekly", "monthly"];
function vp(e) {
  const t = new Date(e);
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}
function Ku(e) {
  return e && e.visibility === "family" && e.familyId != null ? String(e.familyId) : "";
}
function gp({ existing: e, families: t, canChangeVisibility: n = !0 }) {
  return /* @__PURE__ */ s.jsxs("form", { id: "task-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Title" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "title", required: !0, defaultValue: (e == null ? void 0 : e.title) || "" })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Description" }),
      /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "description", defaultValue: (e == null ? void 0 : e.description) || "" })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Priority" }),
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "priority", defaultValue: e == null ? void 0 : e.priority, children: pp.map((r) => /* @__PURE__ */ s.jsx("option", { value: r, children: si[r] }, r)) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Category" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", name: "category", defaultValue: e ? e.category || "" : "general" })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Due date" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", type: "date", name: "dueDate", defaultValue: (e == null ? void 0 : e.dueDate) || "" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Start time (optional)" }),
        /* @__PURE__ */ s.jsx(
          "input",
          {
            className: "input",
            type: "time",
            name: "startTimeOnly",
            defaultValue: e != null && e.startTime ? vp(e.startTime) : ""
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Duration (minutes)" }),
        /* @__PURE__ */ s.jsx(
          "input",
          {
            className: "input",
            type: "number",
            min: "5",
            step: "5",
            name: "durationMinutes",
            defaultValue: (e == null ? void 0 : e.durationMinutes) || ""
          }
        )
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Recurrence" }),
        /* @__PURE__ */ s.jsxs("select", { className: "select", name: "recurrence", defaultValue: (e == null ? void 0 : e.recurrence) || "", children: [
          /* @__PURE__ */ s.jsx("option", { value: "", children: "None" }),
          hp.map((r) => /* @__PURE__ */ s.jsx("option", { value: r, children: r }, r))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx(Qu, { existing: e == null ? void 0 : e.reminder, hint: "Needs a due date. With a start time it counts from that time; without one, from your usual hour." }),
    t.length && n ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Circle" }),
      /* @__PURE__ */ s.jsxs("select", { className: "select", name: "familyId", defaultValue: Ku(e), children: [
        /* @__PURE__ */ s.jsx("option", { value: "", children: "Private (only me)" }),
        t.map((r) => /* @__PURE__ */ s.jsxs("option", { value: r.id, children: [
          r.name,
          " — visible to the circle"
        ] }, r.id))
      ] })
    ] }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Notes" }),
      /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "notes", defaultValue: (e == null ? void 0 : e.notes) || "" })
    ] })
  ] });
}
function go({ api: e, toast: t, state: n, existing: r, onSaved: l }) {
  const a = n.families || [], i = !r || r.ownerId === n.user.id;
  let o = null;
  fe({
    title: r ? "Edit task" : "New task",
    bodyHtml: '<div id="task-form-mount"></div>',
    footerHtml: `
      <button class="btn" data-close>Cancel</button>
      <button class="btn btn-primary" id="save-task-btn">${r ? "Save changes" : "Create task"}</button>
    `,
    size: "lg",
    onMount: (c) => {
      const u = c.querySelector("#task-form-mount");
      o = oe(u), o.render(y.createElement(gp, { existing: r, families: a, canChangeVisibility: i })), document.getElementById("save-task-btn").addEventListener("click", async () => {
        const h = document.getElementById("task-form"), f = Object.fromEntries(new FormData(h).entries());
        if (!f.title.trim()) {
          t("Title is required.", "error");
          return;
        }
        const d = {
          title: f.title.trim(),
          description: f.description || null,
          priority: f.priority,
          category: f.category || "general",
          dueDate: f.dueDate || null,
          durationMinutes: f.durationMinutes ? Number(f.durationMinutes) : null,
          recurrence: f.recurrence || null,
          notes: f.notes || null,
          reminder: qu(f.reminder)
        };
        f.dueDate && f.startTimeOnly && (d.startTime = (/* @__PURE__ */ new Date(`${f.dueDate}T${f.startTimeOnly}:00`)).toISOString()), r ? i && (f.familyId || "") !== Ku(r) && (f.familyId ? (d.familyId = Number(f.familyId), d.visibility = "family") : d.visibility = "private") : f.familyId ? (d.familyId = Number(f.familyId), d.visibility = "family") : d.visibility = "private";
        try {
          r ? (await e.patch(`/api/tasks/${r.id}`, d), t("Task updated", "success")) : (await e.post("/api/tasks", d), t("Task created", "success")), re(), l();
        } catch (g) {
          t(g.message, "error");
        }
      });
    },
    onClose: () => {
      o && (o.unmount(), o = null);
    }
  });
}
document.getElementById("toast-root");
function vl(e) {
  return e == null ? "" : String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Pe({ title: e = "Are you sure?", message: t = "", confirmLabel: n = "Confirm", danger: r = !0 }) {
  return new Promise((l) => {
    fe({
      title: vl(e),
      bodyHtml: `<p class="text-sm" style="color:var(--text-secondary)">${vl(t)}</p>`,
      footerHtml: `
        <button class="btn" data-cancel>Cancel</button>
        <button class="btn ${r ? "btn-danger" : "btn-primary"}" data-confirm>${vl(n)}</button>
      `,
      onMount: (a) => {
        a.querySelector("[data-cancel]").addEventListener("click", () => {
          l(!1), re();
        }), a.querySelector("[data-confirm]").addEventListener("click", () => {
          l(!0), re();
        });
      },
      onClose: () => l(!1)
    });
  });
}
const yp = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" }, xp = ["todo", "in_progress", "completed", "cancelled"];
function jp(e) {
  return (e || "?").split(" ").map((t) => t[0]).join("").slice(0, 2).toUpperCase();
}
function Np({ comment: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "row", style: { alignItems: "flex-start", gap: "var(--sp-2)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "avatar avatar-sm", children: jp(e.authorName) }),
    /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ s.jsx("strong", { children: e.authorName }),
        " ",
        /* @__PURE__ */ s.jsx("span", { className: "muted text-xs", children: Ve(e.createdAt) })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "text-sm", children: e.body })
    ] })
  ] });
}
function wp({ taskId: e, api: t, toast: n, onEdit: r, onChanged: l }) {
  const [a, i] = y.useState(!0), [o, c] = y.useState(null), [u, h] = y.useState([]), [f, d] = y.useState(""), g = y.useCallback(async () => {
    i(!0);
    try {
      const m = await t.get(`/api/tasks/${e}`);
      c(m.task), h(m.comments), i(!1);
    } catch (m) {
      n(m.message, "error"), re();
    }
  }, [t, e, n]);
  y.useEffect(() => {
    g();
  }, [g]), y.useEffect(() => {
    if (o) {
      const m = document.querySelector("#modal-root .modal-title");
      m && (m.textContent = o.title);
    }
  }, [o]);
  async function j(m) {
    try {
      await t.patch(`/api/tasks/${o.id}`, { status: m.target.value }), n("Status updated", "success"), l();
    } catch (v) {
      n(v.message, "error");
    }
  }
  async function N() {
    await t.post(`/api/tasks/${o.id}/postpone`, { days: 1 }), n("Postponed by 1 day", "success"), re(), l();
  }
  async function w() {
    await Pe({
      title: "Delete task?",
      message: `"${o.title}" will be permanently deleted.`,
      confirmLabel: "Delete"
    }) && (await t.del(`/api/tasks/${o.id}`), n("Task deleted", "success"), re(), l());
  }
  async function p(m) {
    m.preventDefault();
    const v = f.trim();
    if (v)
      try {
        await t.post(`/api/tasks/${o.id}/comments`, { body: v }), d(""), g();
      } catch (x) {
        n(x.message, "error");
      }
  }
  return a ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) : o ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ s.jsx("span", { className: `badge ${yp[o.priority]}`, children: si[o.priority] }),
      /* @__PURE__ */ s.jsx("select", { className: "select", style: { width: "auto", height: 32 }, value: o.status, onChange: j, children: xp.map((m) => /* @__PURE__ */ s.jsx("option", { value: m, children: Wf[m] }, m)) }),
      o.dueDate ? /* @__PURE__ */ s.jsxs("span", { className: "badge badge-neutral", children: [
        /* @__PURE__ */ s.jsx(C, { name: "calendar", cls: "icon-sm" }),
        " ",
        Ve(o.dueDate)
      ] }) : null,
      o.durationMinutes ? /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: Wu(o.durationMinutes) }) : null
    ] }),
    o.description ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { marginBottom: "var(--sp-4)" }, children: o.description }) : null,
    o.notes ? /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ s.jsx("strong", { children: "Notes:" }),
      " ",
      o.notes
    ] }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "row page-actions", style: { marginBottom: "var(--sp-5)" }, children: [
      /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: N, children: [
        /* @__PURE__ */ s.jsx(C, { name: "clock", cls: "icon-sm" }),
        " Postpone 1 day"
      ] }),
      /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: () => r(o), children: [
        /* @__PURE__ */ s.jsx(C, { name: "edit", cls: "icon-sm" }),
        " Edit"
      ] }),
      /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm btn-danger", onClick: w, children: [
        /* @__PURE__ */ s.jsx(C, { name: "trash", cls: "icon-sm" }),
        " Delete"
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("hr", { className: "divider" }),
    /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Comments" }),
    /* @__PURE__ */ s.jsx("div", { className: "stack", style: { marginBottom: "var(--sp-4)" }, children: u.length ? u.map((m) => /* @__PURE__ */ s.jsx(Np, { comment: m }, m.id)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No comments yet." }) }),
    /* @__PURE__ */ s.jsxs("form", { className: "row", onSubmit: p, children: [
      /* @__PURE__ */ s.jsx(
        "input",
        {
          className: "input",
          placeholder: "Write a comment…",
          style: { flex: 1 },
          value: f,
          onChange: (m) => d(m.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", children: /* @__PURE__ */ s.jsx(C, { name: "send", cls: "icon-sm" }) })
    ] })
  ] }) : null;
}
function kp({ api: e, toast: t, taskId: n, onEdit: r, onChanged: l }) {
  let a = null;
  fe({
    title: "Task",
    bodyHtml: '<div id="task-detail-mount"></div>',
    size: "lg",
    onMount: (i) => {
      const o = i.querySelector("#task-detail-mount");
      a = oe(o), a.render(
        y.createElement(wp, {
          taskId: n,
          api: e,
          toast: t,
          onEdit: (c) => {
            re(), r(c);
          },
          onChanged: l
        })
      );
    },
    onClose: () => {
      a && (a.unmount(), a = null);
    }
  });
}
function Sp({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { tasks: l, loading: a, error: i, filters: o, toggleFilter: c, searchValue: u, setSearchValue: h, refetch: f } = ap(t);
  function d() {
    go({ api: t, toast: n, state: r, existing: null, onSaved: f });
  }
  function g(w) {
    go({ api: t, toast: n, state: r, existing: w, onSaved: f });
  }
  function j(w) {
    kp({
      api: t,
      toast: n,
      taskId: w,
      onEdit: g,
      onChanged: f
    });
  }
  async function N(w) {
    const p = w.status === "completed";
    try {
      await t.patch(`/api/tasks/${w.id}`, { status: p ? "todo" : "completed" }), f();
    } catch (m) {
      n(m.message, "error");
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "This Week" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Everything on your plate, prioritized." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: d, children: [
        /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon icon-sm" }),
        " New task"
      ] }) })
    ] }),
    /* @__PURE__ */ s.jsx(op, { filters: o, onToggle: c, searchValue: u, onSearchChange: h }),
    /* @__PURE__ */ s.jsxs("div", { className: "list-region", children: [
      /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: a || i ? "Tasks" : `${l.length} task${l.length === 1 ? "" : "s"}` }),
      a ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
        /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
        " Loading tasks…"
      ] }) : i ? (
        // Visual Redesign Batch 2: brought in line with the standard
        // icon+heading+description error pattern already used everywhere
        // else in the app (Dashboard, BillSense, Goals, ...) — the
        // original plain-text treatment here was an inconsistency, not a
        // deliberate design choice (see the prior comment this replaces).
        // Also gains a retry action wired to the existing refetch() this
        // page's own data hook already exposes — no new data-fetching
        // logic, just a button that calls it.
        /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
          /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
          /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load your tasks" }),
          /* @__PURE__ */ s.jsx("p", { children: i.message }),
          /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Try again" })
        ] })
      ) : l.length === 0 ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ s.jsx(C, { name: "tasks", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "No tasks here" }),
        /* @__PURE__ */ s.jsx("p", { children: "Add your first task to start organizing your day." }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: d, children: "Add a task" })
      ] }) : /* @__PURE__ */ s.jsx("div", { className: "row-list", children: l.map((w) => /* @__PURE__ */ s.jsx(up, { task: w, onOpen: j, onToggleCheck: N }, w.id)) })
    ] })
  ] });
}
function Cp(e, t) {
  const [n, r] = y.useState([]), [l, a] = y.useState(!0), [i, o] = y.useState(null), c = y.useCallback(async () => {
    a(!0), o(null);
    try {
      const { families: u } = await e.get("/api/family");
      r(u), t.families = u;
    } catch (u) {
      o(u);
    } finally {
      a(!1);
    }
  }, [e, t]);
  return y.useEffect(() => {
    c();
  }, [c]), { families: n, loading: l, error: i, refetch: c };
}
function Ep({ onCreate: e, onJoin: t }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Circle" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Shared responsibilities, chat, and activity." })
    ] }) }),
    /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "family", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No circle yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Create a circle to share tasks, bills, a chat and a shopping list with the people you live or work with." }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { marginTop: "var(--sp-2)", gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", onClick: e, children: "Create a circle" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: t, children: "Join with a code" })
      ] })
    ] }) })
  ] });
}
function bp() {
  return /* @__PURE__ */ s.jsx("form", { id: "family-form", className: "stack", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Circle name" }),
    /* @__PURE__ */ s.jsx("input", { className: "input", name: "name", placeholder: "The Smiths", required: !0 })
  ] }) });
}
function Tp({ api: e, toast: t, onCreated: n }) {
  let r = null;
  fe({
    title: "Create a circle",
    bodyHtml: '<div id="family-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="create-family-save">Create</button>',
    onMount: (l) => {
      r = oe(l.querySelector("#family-form-mount")), r.render(y.createElement(bp)), document.getElementById("create-family-save").addEventListener("click", async () => {
        const a = document.querySelector("#family-form [name=name]").value.trim();
        if (!a) return t("Circle name is required.", "error");
        try {
          const { family: i } = await e.post("/api/family", { name: a });
          re(), t("Circle created", "success"), n(i);
        } catch (i) {
          t(i.message, "error");
        }
      });
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
function Dp() {
  return /* @__PURE__ */ s.jsx("form", { id: "join-family-form", className: "stack", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Invite code" }),
    /* @__PURE__ */ s.jsx("input", { className: "input", name: "code", placeholder: "e.g. K7M2QX9P4RTA", style: { textTransform: "uppercase" }, required: !0 })
  ] }) });
}
function _p({ api: e, toast: t, onJoined: n }) {
  let r = null;
  fe({
    title: "Join a circle",
    bodyHtml: '<div id="join-family-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="join-family-save">Join</button>',
    onMount: (l) => {
      r = oe(l.querySelector("#join-family-form-mount")), r.render(y.createElement(Dp)), document.getElementById("join-family-save").addEventListener("click", async () => {
        const a = document.querySelector("#join-family-form [name=code]").value.trim();
        if (!a) return t("Enter an invite code.", "error");
        try {
          const { family: i } = await e.post("/api/family/join", { code: a });
          re(), t(`Joined ${i.name}`, "success"), n(i);
        } catch (i) {
          t(i.message, "error");
        }
      });
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
function Mp({ api: e, toast: t, familyId: n, family: r, myRole: l, onChanged: a }) {
  const [i, o] = y.useState(!0), [c, u] = y.useState([]), [h, f] = y.useState(null), [d, g] = y.useState(!1);
  async function j() {
    if (await Pe({
      title: "Create a new invite code?",
      message: "The current code will stop working right away. People already in the circle stay; anyone you gave the old code to will need the new one.",
      confirmLabel: "Create new code",
      danger: !1
    })) {
      g(!0);
      try {
        await e.post(`/api/family/${n}/invite-code/regenerate`, {}), t("New invite code created", "success"), a();
      } catch (p) {
        t(p.message, "error");
      } finally {
        g(!1);
      }
    }
  }
  const N = y.useCallback(() => {
    let w = !1;
    return o(!0), f(null), e.get(`/api/tasks?familyId=${n}`).then(({ tasks: p }) => {
      w || (u(p), o(!1));
    }).catch((p) => {
      w || (f(p), o(!1));
    }), () => {
      w = !0;
    };
  }, [e, n]);
  return y.useEffect(() => N(), [N]), i ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) : /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row-between", style: { marginBottom: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", style: { marginBottom: 0 }, children: "Shared tasks" }),
        /* @__PURE__ */ s.jsx("span", { className: "text-xs muted", children: c.length })
      ] }),
      h ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load shared tasks" }),
        /* @__PURE__ */ s.jsx("p", { children: h.message }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: N, children: "Try again" })
      ] }) : c.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: c.slice(0, 10).map((w) => /* @__PURE__ */ s.jsxs("a", { className: "row-item", href: `#/tasks/${w.id}`, style: { textDecoration: "none" }, children: [
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: "row-check",
            style: {
              pointerEvents: "none",
              ...w.status === "completed" ? { background: "var(--accent-500)", borderColor: "var(--accent-500)", color: "#fff" } : {}
            },
            children: w.status === "completed" ? /* @__PURE__ */ s.jsx(C, { name: "check", cls: "icon-sm" }) : null
          }
        ),
        /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
          /* @__PURE__ */ s.jsx("div", { className: `row-title ${w.status === "completed" ? "done" : ""}`, children: w.title }),
          /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: w.assigneeName ? `Assigned to ${w.assigneeName}` : "Unassigned" })
        ] })
      ] }, w.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No shared tasks yet. Create a task and set visibility to circle." })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Invite code" }) }),
      r.inviteCode ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Share this code so someone can join manually, or add them directly by phone number in the Members tab." }) : /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Only the circle owner can see and share the invite code. Ask the owner if you would like to invite someone." }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { marginTop: "var(--sp-2)", flexWrap: "wrap" }, children: [
        r.inviteCode ? /* @__PURE__ */ s.jsx(
          "code",
          {
            style: {
              background: "var(--bg-sunken)",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              letterSpacing: "0.05em",
              overflowWrap: "anywhere"
            },
            children: r.inviteCode
          }
        ) : null,
        l === "owner" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: j, disabled: d, children: "New invite code" }) : null
      ] })
    ] })
  ] });
}
function Lp() {
  return /* @__PURE__ */ s.jsxs("form", { id: "member-form", className: "stack", children: [
    /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Members are identified by phone number (names can be identical)." }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Phone number" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "phone", placeholder: "+383 44 123 456", required: !0 })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Display name (optional)" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "displayName", placeholder: "e.g. Mom" })
    ] })
  ] });
}
function Pp({ api: e, toast: t, familyId: n, onAdded: r }) {
  let l = null;
  fe({
    title: "Add a member",
    bodyHtml: '<div id="member-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="add-member-save">Add member</button>',
    onMount: (a) => {
      l = oe(a.querySelector("#member-form-mount")), l.render(y.createElement(Lp)), document.getElementById("add-member-save").addEventListener("click", async () => {
        const i = document.getElementById("member-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.phone.trim()) return t("Phone number is required.", "error");
        try {
          await e.post(`/api/family/${n}/members`, o), t("Member added", "success"), re(), r();
        } catch (c) {
          t(c.message, "error");
        }
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
function Ip({ api: e, toast: t, familyId: n, family: r, myRole: l, onChanged: a }) {
  const i = l === "owner" || l === "admin", o = l === "owner", c = r.members.some((d) => d.registered && d.role !== "owner");
  async function u(d) {
    if (!await Pe({
      title: "Remove member?",
      message: "They will lose access to shared circle data.",
      confirmLabel: "Remove"
    })) return;
    const j = await e.del(`/api/family/${n}/members/${d}`);
    t(j && j.inviteCodeRotated ? "Member removed. The invite code was changed." : "Member removed", "success"), a();
  }
  async function h(d) {
    const g = d.displayName || "this member";
    if (await Pe({
      title: "Transfer ownership?",
      message: `${g} will become the owner of “${r.name}”. You will become a regular member and lose the ability to manage members, roles and ownership. Nothing is deleted. Only the new owner can transfer ownership back.`,
      confirmLabel: "Transfer ownership",
      danger: !1
    })) {
      try {
        await e.post(`/api/family/${n}/transfer-ownership`, { memberId: d.id }), t("Ownership transferred", "success");
      } catch (N) {
        t(N && N.message || "Could not transfer ownership", "error");
      }
      a();
    }
  }
  async function f() {
    if (await Pe({
      title: "Leave this circle?",
      message: `You will lose access to “${r.name}” and its shared data. Your account and personal data stay as they are. You can rejoin later only with a new invite.`,
      confirmLabel: "Leave circle"
    })) {
      try {
        await e.post(`/api/family/${n}/leave`, {}), t("You left the circle", "success");
      } catch (g) {
        t(g && g.message || "Could not leave the circle", "error");
      }
      a();
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Members" }),
      i ? /* @__PURE__ */ s.jsxs(
        "button",
        {
          className: "btn btn-sm btn-primary",
          onClick: () => Pp({ api: e, toast: t, familyId: n, onAdded: a }),
          children: [
            /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
            " Add by phone"
          ]
        }
      ) : null
    ] }),
    /* @__PURE__ */ s.jsx("div", { className: "member-grid", children: r.members.map((d) => /* @__PURE__ */ s.jsx(
      $p,
      {
        member: d,
        canManage: i,
        canTransfer: o && d.registered && d.role !== "owner",
        onRemove: u,
        onTransfer: h
      },
      d.id
    )) }),
    o ? /* @__PURE__ */ s.jsx("p", { className: "text-xs muted member-lifecycle-note", children: c ? "You own this circle. To leave it, or to delete your account, first transfer ownership with “Make owner” on another member." : "You own this circle and are its only registered member, so you can’t leave it or transfer ownership yet. Invite someone to join first." }) : /* @__PURE__ */ s.jsx("div", { className: "member-lifecycle-note", children: /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: f, children: "Leave circle" }) })
  ] });
}
function $p({ member: e, canManage: t, canTransfer: n, onRemove: r, onTransfer: l }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card member-card", children: [
    /* @__PURE__ */ s.jsx("div", { className: "avatar", children: Uu(...(e.displayName || "").split(" ")) }),
    /* @__PURE__ */ s.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "text-sm", style: { fontWeight: 650 }, children: e.displayName }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: 6, marginTop: 4 }, children: [
        /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral member-role", children: e.role }),
        e.registered ? null : /* @__PURE__ */ s.jsx("span", { className: "text-xs muted", children: "Invited" })
      ] })
    ] }),
    t && e.role !== "owner" ? /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": `Remove ${e.displayName}`, onClick: () => r(e.id), children: /* @__PURE__ */ s.jsx(C, { name: "x", cls: "icon-sm" }) }) : null,
    n ? /* @__PURE__ */ s.jsx("div", { className: "member-actions", children: /* @__PURE__ */ s.jsx(
      "button",
      {
        className: "btn btn-sm",
        "aria-label": `Make ${e.displayName} the owner`,
        onClick: () => l(e),
        children: "Make owner"
      }
    ) }) : null
  ] });
}
function Ap({ api: e, toast: t, familyId: n }) {
  const [r, l] = y.useState(null), [a, i] = y.useState(!1);
  y.useEffect(() => {
    let u = !0;
    return e.get(`/api/family/${n}/mute`).then((h) => u && l(h.mutedUntil)).catch(() => {
    }), () => {
      u = !1;
    };
  }, [e, n]);
  async function o(u) {
    i(!0);
    try {
      const h = await u();
      l(h.mutedUntil);
    } catch (h) {
      t(h && h.message || "Could not change that", "error");
    } finally {
      i(!1);
    }
  }
  const c = { display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" };
  if (r) {
    const u = new Date(r).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return /* @__PURE__ */ s.jsxs("div", { className: "text-sm muted", style: c, role: "status", children: [
      /* @__PURE__ */ s.jsxs("span", { children: [
        "Notifications from this circle are off on your devices until ",
        u,
        "."
      ] }),
      /* @__PURE__ */ s.jsx("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: a, onClick: () => o(() => e.del(`/api/family/${n}/mute`)), children: "Turn back on" })
    ] });
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "text-sm muted", style: c, children: [
    /* @__PURE__ */ s.jsx("span", { children: "Too many notifications right now?" }),
    [1, 8, 24].map((u) => /* @__PURE__ */ s.jsxs("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: a, onClick: () => o(() => e.post(`/api/family/${n}/mute`, { hours: u })), children: [
      "Quiet for ",
      u,
      " h"
    ] }, u))
  ] });
}
function Op({ api: e, toast: t, myUserId: n, familyId: r }) {
  const [l, a] = y.useState(null), [i, o] = y.useState(""), c = y.useRef(null), u = y.useRef(!1), h = y.useCallback(async () => {
    try {
      const { messages: d } = await e.get(`/api/chat/${r}/messages`), g = c.current, j = g ? g.scrollTop + g.clientHeight >= g.scrollHeight - 40 : !0;
      a(d), requestAnimationFrame(() => {
        c.current && (j || !u.current) && (c.current.scrollTop = c.current.scrollHeight, u.current = !0);
      });
    } catch {
      a((d) => d === null ? [] : d);
    }
  }, [e, r]);
  y.useEffect(() => {
    u.current = !1, a(null), h();
    const d = setInterval(h, 6e3);
    return () => clearInterval(d);
  }, [h]);
  async function f(d) {
    d.preventDefault();
    const g = i.trim();
    if (g) {
      o("");
      try {
        await e.post(`/api/chat/${r}/messages`, { body: g }), h();
      } catch (j) {
        t(j.message, "error");
      }
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { style: { marginBottom: "var(--sp-3)" }, children: /* @__PURE__ */ s.jsx(Ap, { api: e, toast: t, familyId: r }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "chat-window", children: [
      /* @__PURE__ */ s.jsx("div", { className: "chat-messages", ref: c, children: l === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
        /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
        " Loading messages…"
      ] }) : l.length === 0 ? /* @__PURE__ */ s.jsx("div", { className: "empty-state", children: /* @__PURE__ */ s.jsx("p", { children: "No messages yet. Say hello." }) }) : l.map((d) => /* @__PURE__ */ s.jsx(Rp, { message: d, myId: n }, d.id)) }),
      /* @__PURE__ */ s.jsxs("form", { className: "chat-input-row", onSubmit: f, children: [
        /* @__PURE__ */ s.jsx(
          "input",
          {
            className: "input",
            placeholder: "Message the circle…",
            style: { flex: 1 },
            autoComplete: "off",
            value: i,
            onChange: (d) => o(d.target.value)
          }
        ),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-icon", type: "submit", "aria-label": "Send", children: /* @__PURE__ */ s.jsx(C, { name: "send", cls: "icon-sm" }) })
      ] })
    ] })
  ] });
}
function Rp({ message: e, myId: t }) {
  const n = e.authorId === t;
  return /* @__PURE__ */ s.jsxs("div", { className: `chat-bubble-row ${n ? "self" : ""}`, children: [
    n ? null : /* @__PURE__ */ s.jsx("div", { className: "avatar avatar-sm", children: Uu(...e.authorName.split(" ")) }),
    /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("div", { className: "chat-bubble", children: e.body }),
      /* @__PURE__ */ s.jsxs("div", { className: "chat-meta", children: [
        n ? "" : e.authorName + " · ",
        Us(e.createdAt)
      ] })
    ] })
  ] });
}
function Fp({ api: e, familyId: t }) {
  const [n, r] = y.useState(null), [l, a] = y.useState(""), [i, o] = y.useState(""), c = y.useCallback(async () => {
    const { items: d } = await e.get(`/api/family/${t}/shopping`);
    r(d);
  }, [e, t]);
  y.useEffect(() => {
    r(null), c();
  }, [c]);
  async function u(d) {
    d.preventDefault(), l.trim() && (await e.post(`/api/family/${t}/shopping`, { name: l, quantity: i }), a(""), o(""), c());
  }
  async function h(d) {
    await e.patch(`/api/family/${t}/shopping/${d.id}`, { done: !d.done }), c();
  }
  async function f(d) {
    await e.del(`/api/family/${t}/shopping/${d}`), c();
  }
  return n === null ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) }) : /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Shopping list" }) }),
    /* @__PURE__ */ s.jsxs("form", { className: "row", style: { marginBottom: "var(--sp-4)" }, onSubmit: u, children: [
      /* @__PURE__ */ s.jsx(
        "input",
        {
          className: "input",
          placeholder: "Add an item…",
          style: { flex: 1 },
          value: l,
          onChange: (d) => a(d.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx(
        "input",
        {
          className: "input",
          placeholder: "Qty",
          style: { width: 90 },
          value: i,
          onChange: (d) => o(d.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", children: /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }) })
    ] }),
    n.length ? /* @__PURE__ */ s.jsx("div", { className: "stack", children: n.map((d) => /* @__PURE__ */ s.jsxs("div", { className: `shopping-item ${d.done ? "done" : ""}`, children: [
      /* @__PURE__ */ s.jsx("button", { className: `row-check ${d.done ? "checked" : ""}`, onClick: () => h(d), children: /* @__PURE__ */ s.jsx(C, { name: "check" }) }),
      /* @__PURE__ */ s.jsxs("div", { className: "shopping-name", style: { flex: 1 }, children: [
        d.name,
        " ",
        d.quantity ? /* @__PURE__ */ s.jsxs("span", { className: "muted text-xs", children: [
          "(",
          d.quantity,
          ")"
        ] }) : null
      ] }),
      /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": "Remove", onClick: () => f(d.id), children: /* @__PURE__ */ s.jsx(C, { name: "x", cls: "icon-sm" }) })
    ] }, d.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "List is empty." })
  ] });
}
const zp = {
  task_created: { icon: "tasks" },
  task_completed: { icon: "tasks" },
  comment: { icon: "message" },
  bill_paid: { icon: "bill", accent: "money" },
  decision_made: { icon: "decision", accent: "reasoning" },
  goal_progress: { icon: "goal", accent: "warmth" },
  member_joined: { icon: "family", accent: "warmth" },
  member_left: { icon: "family", accent: "warmth" },
  ownership_transferred: { icon: "family", accent: "warmth" },
  invite_code_changed: { icon: "family", accent: "warmth" }
}, Bp = { icon: "timeline" };
function Up({ event: e }) {
  const t = zp[e.type] || Bp, n = t.accent ? `module-accent--${t.accent}` : "module-accent--none", r = /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx(C, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", style: { whiteSpace: "normal", fontWeight: 500 }, children: e.summary }),
      /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: Us(e.createdAt) })
    ] })
  ] });
  return e.link ? /* @__PURE__ */ s.jsx("a", { className: `row-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ s.jsx("div", { className: `row-item ${n}`, children: r });
}
function Vp({ api: e, familyId: t }) {
  const [n, r] = y.useState(null), [l, a] = y.useState(null), i = y.useCallback(() => {
    r(null), a(null), e.get(`/api/family/${t}/activity`).then(({ activity: o }) => r(o)).catch((o) => a(o));
  }, [e, t]);
  return y.useEffect(() => {
    i();
  }, [i]), /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", children: [
    /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: "Activity" }),
    l ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load activity" }),
      /* @__PURE__ */ s.jsx("p", { children: l.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Try again" })
    ] }) : n === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) : n.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: n.map((o) => /* @__PURE__ */ s.jsx(Up, { event: o }, o.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No activity yet." })
  ] });
}
const Pt = [
  ["overview", "Overview"],
  ["members", "Members"],
  ["chat", "Chat"],
  ["shopping", "Shopping list"],
  ["activity", "Activity"]
];
let yo = null, xo = "overview";
function Hp({ ctx: e }) {
  var v;
  const { api: t, toast: n, state: r } = e, { families: l, loading: a, error: i, refetch: o } = Cp(t, r), [c, u] = y.useState(yo), [h, f] = y.useState(xo);
  function d(x) {
    yo = x, u(x);
  }
  function g(x) {
    xo = x, f(x);
  }
  function j(x) {
    var L;
    const S = Pt.findIndex(([R]) => R === h);
    let b = null;
    if (x.key === "ArrowRight" ? b = (S + 1) % Pt.length : x.key === "ArrowLeft" ? b = (S - 1 + Pt.length) % Pt.length : x.key === "Home" ? b = 0 : x.key === "End" && (b = Pt.length - 1), b === null) return;
    x.preventDefault();
    const T = Pt[b][0];
    g(T), (L = document.getElementById(`family-tab-${T}`)) == null || L.focus();
  }
  y.useEffect(() => {
    l.length && !l.some((x) => x.id === c) && d(l[0].id);
  }, [l]);
  function N() {
    Tp({
      api: t,
      toast: n,
      onCreated: (x) => {
        d(x.id), o();
      }
    });
  }
  function w() {
    _p({
      api: t,
      toast: n,
      onJoined: (x) => {
        d(x.id), o();
      }
    });
  }
  if (a)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) });
  if (i)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: i.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: o, children: "Try again" })
    ] }) });
  if (!l.length)
    return /* @__PURE__ */ s.jsx(Ep, { onCreate: N, onJoin: w });
  const p = l.find((x) => x.id === c) || l[0], m = (v = p.members.find((x) => x.userId === r.user.id)) == null ? void 0 : v.role;
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Circle" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Shared responsibilities, chat, and activity." })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "page-actions", children: [
        l.length > 1 ? /* @__PURE__ */ s.jsx(
          "select",
          {
            className: "select",
            style: { width: "auto" },
            value: c ?? "",
            onChange: (x) => d(Number(x.target.value)),
            children: l.map((x) => /* @__PURE__ */ s.jsx("option", { value: x.id, children: x.name }, x.id))
          }
        ) : null,
        /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: w, children: "Join with a code" }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: N, children: [
          /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
          " New family"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("div", { className: "tabs family-tabs-wrap module-accent--warmth", role: "tablist", "aria-label": "Circle sections", onKeyDown: j, children: Pt.map(([x, S]) => /* @__PURE__ */ s.jsx(
      "div",
      {
        id: `family-tab-${x}`,
        className: `tab ${h === x ? "active" : ""}`,
        role: "tab",
        "aria-selected": h === x,
        "aria-controls": `family-panel-${x}`,
        tabIndex: h === x ? 0 : -1,
        onClick: () => g(x),
        children: S
      },
      x
    )) }),
    /* @__PURE__ */ s.jsxs("div", { id: `family-panel-${h}`, role: "tabpanel", "aria-labelledby": `family-tab-${h}`, tabIndex: 0, children: [
      h === "overview" ? /* @__PURE__ */ s.jsx(Mp, { api: t, toast: n, familyId: p.id, family: p, myRole: m, onChanged: o }) : null,
      h === "members" ? /* @__PURE__ */ s.jsx(Ip, { api: t, toast: n, familyId: p.id, family: p, myRole: m, onChanged: o }) : null,
      h === "chat" ? /* @__PURE__ */ s.jsx(Op, { api: t, toast: n, myUserId: r.user.id, familyId: p.id }) : null,
      h === "shopping" ? /* @__PURE__ */ s.jsx(Fp, { api: t, familyId: p.id }) : null,
      h === "activity" ? /* @__PURE__ */ s.jsx(Vp, { api: t, familyId: p.id }) : null
    ] })
  ] });
}
function Wp(e) {
  const [t, n] = y.useState([]), [r, l] = y.useState(null), [a, i] = y.useState([]), [o, c] = y.useState(!0), [u, h] = y.useState(null), f = y.useCallback(async () => {
    c(!0), h(null);
    try {
      const [d, g] = await Promise.all([e.get("/api/bills"), e.get("/api/bills/stats")]);
      n(d.bills), l(g.stats), i(g.overdue);
    } catch (d) {
      h(d);
    } finally {
      c(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    f();
  }, [f]), { bills: t, stats: r, overdue: a, loading: o, error: u, refetch: f };
}
const qp = { rent: "building" };
function Qp({ bill: e, onEdit: t, onMarkPaid: n }) {
  const r = e.status === "unpaid" && e.daysUntilDue < 0;
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ s.jsxs("button", { className: "row-item-btn row", onClick: () => t(e), children: [
      /* @__PURE__ */ s.jsx("div", { className: "bill-cat-icon", children: /* @__PURE__ */ s.jsx(C, { name: qp[e.category] || "bill", cls: "icon-sm" }) }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.name }),
        /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
          /* @__PURE__ */ s.jsx("span", { style: { textTransform: "capitalize" }, children: e.category }),
          /* @__PURE__ */ s.jsx("span", { children: Ve(e.dueDate) }),
          e.status === "unpaid" ? /* @__PURE__ */ s.jsx("span", { className: `badge ${r ? "badge-critical" : "badge-neutral"}`, children: li(e.daysUntilDue) }) : /* @__PURE__ */ s.jsx("span", { className: "badge badge-success", children: "Paid" })
        ] })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "bill-amount", children: Bt(e.amount, e.currency) })
    ] }),
    e.status === "unpaid" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => n(e.id), children: "Mark paid" }) : null
  ] });
}
function Kp({ byCategory: e, currency: t }) {
  const n = Object.entries(e).sort((l, a) => a[1] - l[1]);
  if (!n.length) return /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No data yet." });
  const r = Math.max(...n.map((l) => l[1]));
  return /* @__PURE__ */ s.jsx(s.Fragment, { children: n.map(([l, a]) => /* @__PURE__ */ s.jsxs("div", { className: "category-bar-row", children: [
    /* @__PURE__ */ s.jsx("span", { className: "cat-label", children: l }),
    /* @__PURE__ */ s.jsx("div", { className: "category-bar-track", children: /* @__PURE__ */ s.jsx("div", { className: "category-bar-fill", style: { width: `${a / r * 100}%` } }) }),
    /* @__PURE__ */ s.jsx("span", { className: "cat-amount", children: Bt(a, t) })
  ] }, l)) });
}
function Yp({ bills: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--danger-400)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Overdue bills" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "row-list", children: e.map((t) => /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ s.jsx("div", { className: "row-title", children: t.name }),
        /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: li(t.daysUntilDue) })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "bill-amount", children: Bt(t.amount, t.currency) })
    ] }, t.id)) })
  ] });
}
function Gp({ state: e }) {
  return e ? e.unavailable ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", children: [
    /* @__PURE__ */ s.jsx(C, { name: "info", cls: "icon-sm" }),
    " AI insights require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo."
  ] }) }) : e.loading ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Analyzing your spending…"
  ] }) }) : e.error ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsx("p", { className: "field-error", children: e.error }) }) : /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)", borderColor: "var(--brand-soft-border)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
      /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
      " AI insights"
    ] }) }),
    /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: "6px" }, children: e.data.insights.map((t, n) => /* @__PURE__ */ s.jsx("li", { className: "text-sm", children: t }, n)) })
  ] }) : null;
}
const Xp = ["electricity", "water", "internet", "phone", "rent", "subscription", "insurance", "loan", "other"], Zp = ["none", "weekly", "monthly", "yearly"];
function Jp({ existing: e }) {
  return /* @__PURE__ */ s.jsxs("form", { id: "bill-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Name" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "name", required: !0, defaultValue: e ? e.name : "" })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Amount" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", type: "number", step: "0.01", min: "0.01", name: "amount", required: !0, defaultValue: e ? e.amount : "" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Currency" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", name: "currency", defaultValue: e ? e.currency : "EUR" })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Category" }),
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "category", defaultValue: e == null ? void 0 : e.category, children: Xp.map((t) => /* @__PURE__ */ s.jsx("option", { value: t, children: t }, t)) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Recurrence" }),
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "recurrence", defaultValue: e == null ? void 0 : e.recurrence, children: Zp.map((t) => /* @__PURE__ */ s.jsx("option", { value: t, children: t }, t)) })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Due date" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", type: "date", name: "dueDate", required: !0, defaultValue: (e == null ? void 0 : e.dueDate) || "" })
    ] }),
    /* @__PURE__ */ s.jsx(Qu, { existing: e == null ? void 0 : e.reminder, hint: "For a bill that repeats, the reminder moves to the next due date each time you pay it." }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Notes" }),
      /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "notes", defaultValue: e && e.notes || "" })
    ] })
  ] });
}
function jo({ api: e, toast: t, existing: n, onSaved: r }) {
  let l = null;
  fe({
    title: n ? "Edit bill" : "Add a bill",
    bodyHtml: '<div id="bill-form-mount"></div>',
    footerHtml: `
    ${n ? '<button class="btn btn-danger" id="delete-bill-btn" style="margin-right:auto">Delete</button>' : ""}
    <button class="btn" data-close>Cancel</button>
    <button class="btn btn-primary" id="save-bill-btn">${n ? "Save changes" : "Add bill"}</button>
  `,
    onMount: (i) => {
      l = oe(i.querySelector("#bill-form-mount")), l.render(y.createElement(Jp, { existing: n })), document.getElementById("save-bill-btn").addEventListener("click", async () => {
        const c = document.getElementById("bill-form"), u = Object.fromEntries(new FormData(c).entries()), h = {
          name: u.name.trim(),
          amount: Number(u.amount),
          currency: u.currency || "EUR",
          category: u.category,
          recurrence: u.recurrence,
          dueDate: u.dueDate,
          notes: u.notes || null,
          reminder: qu(u.reminder)
        };
        try {
          n ? await e.patch(`/api/bills/${n.id}`, h) : await e.post("/api/bills", h), t(n ? "Bill updated" : "Bill added", "success"), re(), r();
        } catch (f) {
          t(f.message, "error");
        }
      });
      const o = document.getElementById("delete-bill-btn");
      o && o.addEventListener("click", async () => {
        await Pe({ title: "Delete bill?", message: `"${n.name}" will be permanently deleted.`, confirmLabel: "Delete" }) && (await e.del(`/api/bills/${n.id}`), t("Bill deleted", "success"), r());
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
function eh({ ctx: e }) {
  var w, p;
  const { api: t, toast: n, state: r } = e, { bills: l, stats: a, overdue: i, loading: o, error: c, refetch: u } = Wp(t), [h, f] = y.useState(null);
  async function d(m) {
    try {
      await t.post(`/api/bills/${m}/pay`, {}), n("Marked as paid", "success"), u();
    } catch (v) {
      n(v.message, "error");
    }
  }
  function g() {
    jo({ api: t, toast: n, existing: null, onSaved: u });
  }
  function j(m) {
    jo({ api: t, toast: n, existing: m, onSaved: u });
  }
  async function N() {
    if (!r.aiConfigured) {
      f({ unavailable: !0 });
      return;
    }
    f({ loading: !0 });
    try {
      const m = await t.post("/api/bills/insights", {});
      if (!m.ok) {
        f({ error: m.error });
        return;
      }
      f({ data: m.data });
    } catch (m) {
      f({ error: m.message });
    }
  }
  return o ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading BillSense…"
  ] }) }) : c ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
    /* @__PURE__ */ s.jsx("p", { children: c.message }),
    /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: u, children: "Try again" })
  ] }) }) : /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "BillSense" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Understand and stay ahead of recurring expenses." })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "page-actions", children: [
        /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: N, children: [
          /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " AI insights"
        ] }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: g, children: [
          /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Add bill"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "stat-row", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: (w = a.monthlyTotals) != null && w.length ? a.monthlyTotals.map((m) => Bt(m.total, m.currency)).join(" + ") : Bt(a.monthlyTotal, a.currency) }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Monthly total" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: (p = a.paidThisMonth) != null && p.length ? a.paidThisMonth.map((m) => Bt(m.total, m.currency)).join(" + ") : Bt(0) }),
        /* @__PURE__ */ s.jsxs("div", { className: "stat-label", children: [
          "Paid this month",
          a.paidThisMonthCount ? ` · ${a.paidThisMonthCount} ${a.paidThisMonthCount === 1 ? "payment" : "payments"}` : ""
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: a.overdueCount }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Overdue" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: a.upcomingCount }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Due in 14 days" })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx(Gp, { state: h }),
    /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--money", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
          "All bills",
          l.length ? ` (${l.length})` : ""
        ] }),
        l.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: l.map((m) => /* @__PURE__ */ s.jsx(Qp, { bill: m, onEdit: j, onMarkPaid: d }, m.id)) }) : /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
          /* @__PURE__ */ s.jsx(C, { name: "bill", cls: "icon-lg" }),
          /* @__PURE__ */ s.jsx("h3", { children: "No bills yet" }),
          /* @__PURE__ */ s.jsx("p", { children: "Add your first recurring bill to start understanding your monthly obligations." })
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
          /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
            "By category",
            a.mixedCurrencies ? ` (${a.currency} only)` : ""
          ] }) }),
          /* @__PURE__ */ s.jsx(Kp, { byCategory: a.byCategory, currency: a.currency })
        ] }),
        i.length ? /* @__PURE__ */ s.jsx(Yp, { bills: i }) : null
      ] })
    ] })
  ] });
}
function th(e) {
  const [t, n] = y.useState([]), [r, l] = y.useState(!0), [a, i] = y.useState(null), o = y.useCallback(async () => {
    l(!0), i(null);
    try {
      const { goals: c } = await e.get("/api/goals");
      n(c);
    } catch (c) {
      i(c);
    } finally {
      l(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    o();
  }, [o]), { goals: t, loading: r, error: a, refetch: o };
}
function nh() {
  return /* @__PURE__ */ s.jsxs("form", { id: "ms-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Title" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "title", required: !0 })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Due date (optional)" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", type: "date", name: "dueDate" })
    ] })
  ] });
}
function rh({ api: e, toast: t, goalId: n, onSaved: r }) {
  let l = null;
  fe({
    title: "Add a milestone",
    bodyHtml: '<div id="ms-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="ms-save">Add</button>',
    onMount: (a) => {
      l = oe(a.querySelector("#ms-form-mount")), l.render(y.createElement(nh)), document.getElementById("ms-save").addEventListener("click", async () => {
        const i = document.getElementById("ms-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.title.trim()) return t("Title is required.", "error");
        await e.post(`/api/goals/${n}/milestones`, { title: o.title.trim(), dueDate: o.dueDate || null }), re(), r();
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
const sh = 14;
function lh(e) {
  if (!e) return null;
  const t = new Date((/* @__PURE__ */ new Date()).toDateString()), n = Math.round((/* @__PURE__ */ new Date(`${e}T00:00:00`) - t) / 864e5);
  return n < 0 ? { cls: "is-overdue", label: `Overdue — was ${Ve(e)}` } : n <= sh ? { cls: "is-approaching", label: `Target: ${Ve(e)}` } : { cls: "is-future", label: `Target: ${Ve(e)}` };
}
function No({ goal: e, api: t, toast: n, state: r, onChanged: l, expanded: a, onToggle: i }) {
  const [o, c] = y.useState(!1), [u, h] = y.useState(!1), f = y.useRef(null);
  y.useEffect(() => {
    a && f.current && f.current.focus(), a || c(!1);
  }, [a]);
  const d = e.milestones.length, g = e.milestones.filter((E) => E.done).length, j = d ? Math.round(g / d * 100) : 0, N = e.milestones.find((E) => !E.done) || null, w = e.milestones.find((E) => !E.done && E.id !== (N == null ? void 0 : N.id)) || null, p = w ? [w] : [], m = new Set([N, ...p].filter(Boolean).map((E) => E.id)), v = e.milestones.filter((E) => !m.has(E.id)), x = lh(e.targetDate), S = `goal-detail-${e.id}`, b = `goal-milestones-${e.id}`;
  async function T(E, ee) {
    await t.patch(`/api/goals/${e.id}/milestones/${E}`, { done: !ee }), l();
  }
  async function L() {
    await Pe({ title: "Delete goal?", message: "This cannot be undone.", confirmLabel: "Delete" }) && (await t.del(`/api/goals/${e.id}`), l());
  }
  async function R() {
    if (!r.aiConfigured) return n("AI is not configured on this server.", "error");
    h(!0);
    try {
      const E = await t.post(`/api/goals/${e.id}/suggest-milestones`, {});
      E.ok || n(E.error, "error"), l();
    } catch (E) {
      n(E.message, "error");
    } finally {
      h(!1);
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "goal-row-wrap", children: [
    /* @__PURE__ */ s.jsxs("button", { className: "row-item goal-row-toggle", "aria-expanded": a, "aria-controls": S, onClick: () => i(e.id), children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "row-title", children: [
          e.title,
          e.status !== "active" ? /* @__PURE__ */ s.jsxs("span", { className: `goal-row-status ${e.status === "completed" ? "is-completed" : "is-abandoned"}`, children: [
            " ",
            "· ",
            e.status === "completed" ? "Completed" : "Abandoned"
          ] }) : null
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
          /* @__PURE__ */ s.jsx("span", { className: "goal-row-category", children: e.category }),
          /* @__PURE__ */ s.jsx("span", { children: d ? `${g} of ${d} milestones` : "No milestones yet" }),
          N ? /* @__PURE__ */ s.jsxs("span", { children: [
            "Next: ",
            N.title
          ] }) : d ? /* @__PURE__ */ s.jsx("span", { children: "All milestones complete" }) : null,
          x ? /* @__PURE__ */ s.jsx("span", { className: `goal-target ${x.cls}`, children: x.label }) : null
        ] })
      ] }),
      d ? /* @__PURE__ */ s.jsx("div", { className: "progress-track goal-row-progress", "aria-hidden": "true", children: /* @__PURE__ */ s.jsx("div", { className: "progress-fill", style: { width: `${j}%` } }) }) : null,
      /* @__PURE__ */ s.jsx("span", { className: "goal-row-pct text-xs muted", "aria-hidden": "true", children: d ? `${j}%` : "—" }),
      /* @__PURE__ */ s.jsx(C, { name: "chevron", cls: `icon-sm goal-row-chevron ${a ? "is-open" : ""}` })
    ] }),
    a ? /* @__PURE__ */ s.jsxs("div", { className: "goal-detail", id: S, children: [
      /* @__PURE__ */ s.jsxs("h3", { className: "visually-hidden", tabIndex: -1, ref: f, children: [
        e.title,
        " — details"
      ] }),
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsxs("div", { className: "row-between text-xs muted", style: { marginBottom: 4 }, children: [
          /* @__PURE__ */ s.jsx("span", { children: d ? `${g} of ${d} milestones done` : "No milestones yet" }),
          /* @__PURE__ */ s.jsx("span", { children: d ? `${j}%` : null })
        ] }),
        d ? /* @__PURE__ */ s.jsx("div", { className: "progress-track", role: "progressbar", "aria-valuenow": j, "aria-valuemin": "0", "aria-valuemax": "100", "aria-label": `${e.title} progress`, children: /* @__PURE__ */ s.jsx("div", { className: "progress-fill", style: { width: `${j}%` } }) }) : null,
        x ? /* @__PURE__ */ s.jsx("div", { className: `goal-target ${x.cls}`, style: { marginTop: 4 }, children: x.label }) : null
      ] }),
      N ? /* @__PURE__ */ s.jsxs("div", { className: "goal-detail-next", children: [
        /* @__PURE__ */ s.jsx("button", { className: "row-check", onClick: () => T(N.id, N.done), "aria-label": `Mark "${N.title}" as done`, children: /* @__PURE__ */ s.jsx(C, { name: "check", cls: "icon-sm" }) }),
        /* @__PURE__ */ s.jsxs("span", { className: "milestone-title", children: [
          "Next: ",
          N.title
        ] })
      ] }) : d ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { color: "var(--accent-600)" }, children: "All milestones complete." }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "Add a milestone, or ask AI to suggest a few." }),
      p.length ? /* @__PURE__ */ s.jsx("div", { className: "stack", style: { gap: 6 }, children: p.map((E) => /* @__PURE__ */ s.jsxs("div", { className: "milestone-row", children: [
        /* @__PURE__ */ s.jsx("button", { className: "row-check", onClick: () => T(E.id, E.done), "aria-label": `Mark "${E.title}" as done`, children: /* @__PURE__ */ s.jsx(C, { name: "check", cls: "icon-sm" }) }),
        /* @__PURE__ */ s.jsx("span", { className: "milestone-title", children: E.title })
      ] }, E.id)) }) : null,
      v.length ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm goal-show-all", "aria-expanded": o, "aria-controls": b, onClick: () => c((E) => !E), children: o ? "Show fewer" : `Show all (${v.length} more)` }) : null,
      o && v.length ? /* @__PURE__ */ s.jsx("div", { className: "stack", id: b, style: { gap: 6, marginTop: 6 }, children: v.map((E) => /* @__PURE__ */ s.jsxs("div", { className: `milestone-row ${E.done ? "done" : ""}`, children: [
        /* @__PURE__ */ s.jsx(
          "button",
          {
            className: `row-check ${E.done ? "checked" : ""}`,
            onClick: () => T(E.id, E.done),
            "aria-label": `Mark "${E.title}" as ${E.done ? "not done" : "done"}`,
            children: /* @__PURE__ */ s.jsx(C, { name: "check", cls: "icon-sm" })
          }
        ),
        /* @__PURE__ */ s.jsx("span", { className: "milestone-title", children: E.title })
      ] }, E.id)) }) : null,
      /* @__PURE__ */ s.jsxs("div", { className: "row goal-detail-actions", style: { gap: 6 }, children: [
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: () => rh({ api: t, toast: n, goalId: e.id, onSaved: l }), children: [
          /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Milestone"
        ] }),
        d ? null : /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: u, onClick: R, children: u ? /* @__PURE__ */ s.jsx("span", { className: "spinner" }) : /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " Suggest with AI"
        ] }) }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm btn-ghost", style: { marginLeft: "auto" }, onClick: L, children: [
          /* @__PURE__ */ s.jsx(C, { name: "trash", cls: "icon-sm" }),
          " Delete goal"
        ] })
      ] })
    ] }) : null
  ] });
}
const ah = ["learning", "fitness", "financial", "career", "habit", "personal"];
function ih() {
  return /* @__PURE__ */ s.jsxs("form", { id: "goal-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Title" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "title", required: !0 })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Description (optional)" }),
      /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "description" })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Category" }),
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "category", children: ah.map((e) => /* @__PURE__ */ s.jsx("option", { value: e, children: e }, e)) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Target date" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", type: "date", name: "targetDate" })
      ] })
    ] })
  ] });
}
function oh({ api: e, toast: t, onSaved: n }) {
  let r = null;
  fe({
    title: "New goal",
    bodyHtml: '<div id="goal-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="goal-save">Create goal</button>',
    onMount: (l) => {
      r = oe(l.querySelector("#goal-form-mount")), r.render(y.createElement(ih)), document.getElementById("goal-save").addEventListener("click", async () => {
        const a = document.getElementById("goal-form"), i = Object.fromEntries(new FormData(a).entries());
        if (!i.title.trim()) return t("Title is required.", "error");
        try {
          await e.post("/api/goals", { title: i.title.trim(), description: i.description || null, category: i.category, targetDate: i.targetDate || null }), t("Goal created", "success"), re(), n();
        } catch (o) {
          t(o.message, "error");
        }
      });
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
function ch({ ctx: e }) {
  const { api: t, toast: n, state: r, params: l } = e, { goals: a, loading: i, error: o, refetch: c } = th(t), [u, h] = y.useState(() => {
    const N = l && l[0], w = N ? Number(N) : null;
    return Number.isFinite(w) && w > 0 ? w : null;
  });
  y.useEffect(() => {
    u != null && !i && !a.some((N) => N.id === u) && (h(null), history.replaceState(null, "", "#/goals"));
  }, [a, i, u]);
  function f() {
    oh({ api: t, toast: n, onSaved: c });
  }
  function d(N) {
    h((w) => {
      const p = w === N ? null : N;
      return history.pushState(null, "", p ? `#/goals/${p}` : "#/goals"), p;
    });
  }
  if (i)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading goals…"
    ] }) });
  if (o)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: o.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: c, children: "Retry" })
    ] }) });
  const g = a.filter((N) => N.status === "active"), j = a.filter((N) => N.status !== "active");
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Goals" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Learning, fitness, financial and personal goals — broken into real steps." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: f, children: [
        /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
        " New goal"
      ] }) })
    ] }),
    g.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
        g.length,
        " active goal",
        g.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: g.map((N) => /* @__PURE__ */ s.jsx(No, { goal: N, api: t, toast: n, state: r, onChanged: c, expanded: u === N.id, onToggle: d }, N.id)) })
    ] }) : /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "goal", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No goals yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Set a learning, fitness, financial or personal goal and break it into milestones." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Add a goal" })
    ] }) }),
    j.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", style: { marginTop: "var(--sp-6)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: "Completed / inactive" }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: j.map((N) => /* @__PURE__ */ s.jsx(No, { goal: N, api: t, toast: n, state: r, onChanged: c, expanded: u === N.id, onToggle: d }, N.id)) })
    ] }) : null
  ] });
}
const Yu = {
  passport: "Passport",
  id_card: "Identity card",
  driving_licence: "Driving licence",
  vehicle_registration: "Vehicle registration",
  vehicle_inspection: "Vehicle inspection",
  insurance: "Insurance",
  warranty: "Warranty",
  contract: "Contract",
  subscription: "Subscription",
  medical: "Medical",
  other: "Other"
}, uh = {
  0: "On the last day",
  1: "1 day before",
  3: "3 days before",
  7: "1 week before",
  14: "2 weeks before",
  30: "1 month before",
  60: "2 months before",
  90: "3 months before"
}, Gu = 1600, Xu = Math.floor(1e6 * 4 / 3), dh = 15 * 1048576, mh = (e) => e.type === "application/pdf" || /\.pdf$/i.test(e.name || "");
async function fh(e) {
  const t = await import(
    /* @vite-ignore */
    `${window.location.origin}/vendor/pdfjs/pdf.min.mjs`
  );
  t.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
  const n = t.getDocument({ data: new Uint8Array(e), isEvalSupported: !1, enableXfa: !1, disableAutoFetch: !0, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", wasmUrl: "/vendor/pdfjs/wasm/" });
  try {
    const r = await n.promise, l = await r.getPage(1), a = l.getViewport({ scale: 1 }), i = l.getViewport({ scale: Gu / Math.max(a.width, a.height) }), o = document.createElement("canvas");
    o.width = Math.round(i.width), o.height = Math.round(i.height);
    const c = o.getContext("2d");
    return c.fillStyle = "#fff", c.fillRect(0, 0, o.width, o.height), await l.render({ canvas: o, canvasContext: c, viewport: i }).promise, { canvas: o, pages: r.numPages };
  } finally {
    await n.destroy();
  }
}
async function ph(e) {
  let t, n = {};
  if (mh(e)) {
    if (e.size > dh) throw Object.assign(new Error("too large"), { tooLarge: !0 });
    const l = await fh(await e.arrayBuffer());
    t = l.canvas, n = { pages: l.pages, isPdf: !0 };
  } else {
    const l = await createImageBitmap(e), a = Math.min(1, Gu / Math.max(l.width, l.height));
    t = document.createElement("canvas"), t.width = Math.max(1, Math.round(l.width * a)), t.height = Math.max(1, Math.round(l.height * a));
    const i = t.getContext("2d");
    i.fillStyle = "#fff", i.fillRect(0, 0, t.width, t.height), i.drawImage(l, 0, 0, t.width, t.height), l.close();
  }
  let r = "";
  for (const l of [0.88, 0.78, 0.66, 0.52])
    if (r = t.toDataURL("image/jpeg", l), r.length - r.indexOf(",") - 1 <= Xu) break;
  return { contentType: "image/jpeg", data: r.slice(r.indexOf(",") + 1), preview: r, ...n };
}
const gl = (e) => ({ contentType: e.contentType, data: e.data });
function Vr(e) {
  return !e || !e.isPdf ? null : e.pages > 1 ? `A PDF of ${e.pages} pages. Only this first page is read and kept: if the dates are on another page, enter them yourself.` : "A PDF. This picture of its page is what is read and kept; the file itself is not stored.";
}
const wo = { alignSelf: "flex-start", maxWidth: "100%", width: "auto", height: "auto", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }, hh = { title: "", kind: "other", issuer: "", issuedOn: "", expiresOn: "", notes: "" };
function vh({ api: e, toast: t, mode: n, existing: r, options: l, onCancel: a, onDone: i }) {
  const [o, c] = y.useState(
    () => r ? { title: r.title, kind: r.kind, issuer: r.issuer || "", issuedOn: r.issuedOn || "", expiresOn: r.expiresOn || "", notes: r.notes || "" } : hh
  ), [u, h] = y.useState(() => r ? r.reminderDays : l.defaultReminderDays.other), [f, d] = y.useState(!!r), [g, j] = y.useState(null), [N, w] = y.useState(!0), [p, m] = y.useState(n === "scan" ? "choose" : null), [v, x] = y.useState(!1), [S, b] = y.useState(null), [T, L] = y.useState([]), [R, E] = y.useState(!1), [ee, dt] = y.useState(null), [Je, Ln] = y.useState(!1), [Cr, Xt] = y.useState(r ? r.files : []), qe = y.useRef(null), D = y.useRef(null), P = y.useRef(null), I = (M) => ($) => c((se) => ({ ...se, [M]: $.target.value })), z = n === "scan", K = !z || p === "read", Zt = l.scan.provider || "the AI service", Ae = ee !== null && ee === o.expiresOn;
  y.useEffect(() => {
    K && P.current && !r && P.current.focus();
  }, [K, r]);
  function Pn(M) {
    const $ = M.target.value;
    c((se) => ({ ...se, kind: $ })), f || h(l.defaultReminderDays[$] || []);
  }
  function et(M) {
    d(!0), h(($) => $.includes(M) ? $.filter((se) => se !== M) : [...$, M].sort((se, In) => In - se));
  }
  async function Lt(M) {
    try {
      const $ = await ph(M);
      return $.data.length > Xu ? (t("That picture is too detailed to store. Take it a little further away, or crop it.", "error"), null) : $;
    } catch ($) {
      return console.error("[documents] the chosen file could not be opened:", $ && `${$.name}: ${$.message}` || "error"), t($ && $.tooLarge ? "That PDF is too large to open here. Take a photo of the page with the dates instead." : "That file could not be opened. Choose a photo or a PDF.", "error"), null;
    }
  }
  async function Vs(M) {
    const $ = M.target.files && M.target.files[0];
    if (M.target.value = "", !$) return;
    const se = await Lt($);
    se && (j(se), z && (m("ready"), b(null), E(!1), dt(null), L([])));
  }
  async function cd() {
    m("reading");
    try {
      const M = await e.post("/api/documents/scan", { file: gl(g), consent: !0 });
      if (!M.ok) {
        t(M.error, "error"), L(["The picture could not be read automatically. Enter the details from the document yourself."]), b(null), m("read");
        return;
      }
      const $ = M.suggestion;
      c({ title: $.title || "", kind: $.kind, issuer: $.issuer || "", issuedOn: $.issuedOn || "", expiresOn: $.expiresOn || "", notes: "" }), h($.reminderDays), L($.warnings), b(M.ticket), m("read");
    } catch (M) {
      t(M.message, "error"), m("ready");
    }
  }
  async function ud(M) {
    if (M.preventDefault(), Je) return;
    Ln(!0);
    const $ = {
      title: o.title,
      kind: o.kind,
      issuer: o.issuer || null,
      issuedOn: o.issuedOn || null,
      expiresOn: o.expiresOn || null,
      notes: o.notes || null,
      reminderDays: u
    };
    try {
      r ? (await e.patch(`/api/documents/${r.id}`, $), i("Document saved")) : (S && ($.scan = { ticket: S, confirmed: { details: R, expiresOn: ee === null ? void 0 : ee || null } }), g && N && ($.file = gl(g)), await e.post("/api/documents", $), i(o.expiresOn ? "Document saved. You will be reminded before it runs out." : "Document saved"));
    } catch (se) {
      t(se.message, "error"), Ln(!1);
    }
  }
  async function dd(M) {
    const $ = M.target.files && M.target.files[0];
    if (M.target.value = "", !$) return;
    const se = await Lt($);
    if (se)
      try {
        const In = await e.post(`/api/documents/${r.id}/files`, { file: gl(se) });
        Xt(In.document.files), t("Picture added", "success");
      } catch (In) {
        t(In.message || "That file could not be added.", "error");
      }
  }
  async function md(M) {
    if (await Pe({ title: "Remove this picture?", message: "The document and its reminders stay.", confirmLabel: "Remove" }))
      try {
        await e.del(`/api/documents/${r.id}/files/${M.id}`), Xt(($) => $.filter((se) => se.id !== M.id));
      } catch ($) {
        t($.message, "error");
      }
  }
  async function fd(M) {
    try {
      await e.patch(`/api/documents/${r.id}`, { status: M }), i(M === "archived" ? "Archived: no more reminders for it" : "Back among your documents");
    } catch ($) {
      t($.message, "error");
    }
  }
  async function pd() {
    if (await Pe({ title: "Delete this document?", message: `"${r.title}", its pictures and its reminders will be deleted for good.`, confirmLabel: "Delete" }))
      try {
        await e.del(`/api/documents/${r.id}`), i("Document deleted");
      } catch (M) {
        t(M.message, "error");
      }
  }
  const hd = r ? "Document" : z ? "Scan a document" : "Add a document", vd = !!o.title.trim() && (!S || R && Ae) && !Je;
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-4)" }, children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: hd }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: a, children: "Close" })
    ] }),
    z && p !== "read" ? /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Photograph the document with the camera, or choose a photo or a PDF you already have. Nothing is saved until you have checked what was read and confirmed it." }),
      g ? /* @__PURE__ */ s.jsx("img", { src: g.preview, alt: "The document you chose", style: { ...wo, maxHeight: 320 } }) : null,
      Vr(g) ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: Vr(g) }) : null,
      /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ s.jsx("input", { ref: D, type: "file", accept: "image/*", capture: "environment", onChange: Vs, hidden: !0 }),
        /* @__PURE__ */ s.jsx("input", { ref: qe, type: "file", accept: "image/*,application/pdf", onChange: Vs, hidden: !0 }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", disabled: p === "reading", onClick: () => D.current.click(), children: "Use the camera" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", disabled: p === "reading", onClick: () => qe.current.click(), children: "Choose a photo or PDF" })
      ] }),
      g ? /* @__PURE__ */ s.jsxs("div", { className: "stack", style: { gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { alignItems: "flex-start" }, children: [
          /* @__PURE__ */ s.jsx("input", { id: "scan-consent", type: "checkbox", checked: v, onChange: (M) => x(M.target.checked), disabled: p === "reading" }),
          /* @__PURE__ */ s.jsxs("span", { children: [
            "Send this picture to ",
            /* @__PURE__ */ s.jsx("strong", { children: Zt }),
            " to be read. Everything visible on it goes with it: on a passport or an identity card that is your name, your photograph and your numbers. LifeAdmin keeps none of it unless you save the document."
          ] })
        ] }),
        /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: 'Rather not? Close this and use "Add a document": type the name and the date yourself, and nothing is sent anywhere.' }),
        /* @__PURE__ */ s.jsx("div", { children: /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "button", disabled: !v || p === "reading", onClick: cd, children: p === "reading" ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
          " Reading…"
        ] }) : "Read the document" }) })
      ] }) : null
    ] }) : null,
    K ? /* @__PURE__ */ s.jsxs("form", { className: "stack", onSubmit: ud, children: [
      z ? /* @__PURE__ */ s.jsxs("div", { className: "stack", role: "status", children: [
        S ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { fontWeight: 600 }, children: "This was read from the picture by a machine. Compare each field with the document, above all the dates." }) : null,
        T.length ? /* @__PURE__ */ s.jsx("ul", { className: "text-sm", style: { margin: 0, paddingLeft: "var(--sp-4)", color: "var(--warning-600)" }, children: T.map((M) => /* @__PURE__ */ s.jsx("li", { children: M }, M)) }) : null,
        g ? /* @__PURE__ */ s.jsx("img", { src: g.preview, alt: "The document you chose", style: { ...wo, maxHeight: 420 } }) : null,
        Vr(g) ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: Vr(g) }) : null
      ] }) : null,
      /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-title", children: "Name" }),
          /* @__PURE__ */ s.jsx("input", { id: "doc-title", ref: P, className: "input", maxLength: 120, required: !0, value: o.title, onChange: I("title"), placeholder: "e.g. Car insurance" })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-kind", children: "Kind" }),
          /* @__PURE__ */ s.jsx("select", { id: "doc-kind", className: "select", value: o.kind, onChange: Pn, children: l.kinds.map((M) => /* @__PURE__ */ s.jsx("option", { value: M, children: Yu[M] || M }, M)) })
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-expires", children: "Valid until" }),
          /* @__PURE__ */ s.jsx("input", { id: "doc-expires", className: "input", type: "date", value: o.expiresOn, onChange: I("expiresOn") }),
          /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "The last day it is valid. Without it there is nothing to remind you of." })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-issued", children: "Issued or bought on" }),
          /* @__PURE__ */ s.jsx("input", { id: "doc-issued", className: "input", type: "date", value: o.issuedOn, onChange: I("issuedOn") })
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-issuer", children: "Issued by" }),
        /* @__PURE__ */ s.jsx("input", { id: "doc-issuer", className: "input", maxLength: 120, value: o.issuer, onChange: I("issuer"), placeholder: "An insurer, a shop, an office" })
      ] }),
      /* @__PURE__ */ s.jsxs("fieldset", { className: "field", style: { border: 0, padding: 0, margin: 0 }, disabled: !o.expiresOn, children: [
        /* @__PURE__ */ s.jsx("legend", { className: "field-label", children: "Remind me" }),
        /* @__PURE__ */ s.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "var(--sp-2) var(--sp-4)" }, children: [...l.reminderDayChoices].sort((M, $) => $ - M).map((M) => /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
          /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: u.includes(M), onChange: () => et(M) }),
          uh[M] || `${M} days before`
        ] }, M)) }),
        o.expiresOn ? null : /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Enter the last day of validity to choose reminders." })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-notes", children: "Note" }),
        /* @__PURE__ */ s.jsx("textarea", { id: "doc-notes", className: "textarea", maxLength: 1e3, value: o.notes, onChange: I("notes"), placeholder: "Where the original is kept, what is needed to renew it" }),
        /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Do not write the document's number here: a reminder does not need it." })
      ] }),
      r ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("span", { className: "field-label", children: "Pictures" }),
        /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-3)", flexWrap: "wrap", alignItems: "flex-start" }, children: [
          Cr.map((M) => /* @__PURE__ */ s.jsxs("div", { className: "stack", style: { gap: "var(--sp-1)" }, children: [
            /* @__PURE__ */ s.jsx("a", { href: M.url, target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ s.jsx("img", { src: M.url, alt: `Picture of ${r.title}`, style: { width: 180, maxHeight: 180, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" } }) }),
            /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: () => md(M), children: "Remove" })
          ] }, M.id)),
          Cr.length < l.room.maxFilesPerDocument ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
            /* @__PURE__ */ s.jsx("input", { ref: qe, type: "file", accept: "image/*,application/pdf", onChange: dd, hidden: !0 }),
            /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", type: "button", onClick: () => qe.current.click(), children: [
              /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
              " Add a photo or a PDF page"
            ] })
          ] }) : null
        ] })
      ] }) : z ? g ? /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: N, onChange: (M) => w(M.target.checked) }),
        "Keep the picture with the document"
      ] }) : null : /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("span", { className: "field-label", children: "Photo or PDF page (optional)" }),
        /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }, children: [
          g ? /* @__PURE__ */ s.jsx("img", { src: g.preview, alt: "The picture you chose", style: { width: 120, maxHeight: 120, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" } }) : null,
          /* @__PURE__ */ s.jsx("input", { ref: qe, type: "file", accept: "image/*,application/pdf", onChange: Vs, hidden: !0 }),
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: () => qe.current.click(), children: g ? "Choose another" : "Add a photo or PDF" }),
          g ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: () => j(null), children: "Remove" }) : null
        ] }),
        /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Kept here only; it is not sent anywhere to be read." })
      ] }),
      S ? /* @__PURE__ */ s.jsxs("fieldset", { className: "stack", style: { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "var(--sp-3)", margin: 0, gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("legend", { className: "field-label", style: { padding: "0 var(--sp-1)" }, children: "Before saving" }),
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { fontWeight: 600 }, children: [
          /* @__PURE__ */ s.jsx("input", { id: "confirm-details", type: "checkbox", checked: R, onChange: (M) => E(M.target.checked) }),
          "The name and the kind are right"
        ] }),
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { fontWeight: 600 }, children: [
          /* @__PURE__ */ s.jsx("input", { id: "confirm-date", type: "checkbox", checked: Ae, onChange: (M) => dt(M.target.checked ? o.expiresOn : null) }),
          o.expiresOn ? /* @__PURE__ */ s.jsxs("span", { children: [
            "The document is valid until ",
            /* @__PURE__ */ s.jsx("strong", { children: Ve(o.expiresOn) }),
            " (",
            o.expiresOn,
            "): I checked this date on the document"
          ] }) : /* @__PURE__ */ s.jsx("span", { children: "This document has no last day of validity: there will be no reminder" })
        ] })
      ] }) : null,
      /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", alignItems: "center" }, children: [
        r ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-danger", type: "button", onClick: pd, children: "Delete" }),
          /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", onClick: () => fd(r.status === "archived" ? "active" : "archived"), style: { marginRight: "auto" }, children: r.status === "archived" ? "Take out of the archive" : "Archive" })
        ] }) : null,
        /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", onClick: a, children: "Cancel" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", disabled: !vd, children: Je ? "Saving…" : r ? "Save changes" : "Save document" }),
        S && !(R && Ae) ? /* @__PURE__ */ s.jsx("span", { className: "text-sm muted", children: "Tick both boxes above to save." }) : null
      ] })
    ] }) : null
  ] });
}
const gh = [
  ["expired", "Expired"],
  ["soon", "Running out within 30 days"],
  ["valid", "Valid"],
  ["undated", "No expiry date"],
  ["archived", "Archived"]
];
function yh(e) {
  return e.state === "archived" ? "Archived" : e.daysLeft === null ? "No date" : e.daysLeft < 0 ? e.daysLeft === -1 ? "Expired yesterday" : `Expired ${-e.daysLeft} days ago` : e.daysLeft === 0 ? "Last day today" : e.daysLeft === 1 ? "1 day left" : e.daysLeft < 60 ? `${e.daysLeft} days left` : e.daysLeft < 730 ? `${Math.round(e.daysLeft / 30)} months left` : `${Math.floor(e.daysLeft / 365)} years left`;
}
const xh = { expired: "badge-critical", soon: "badge-warning", valid: "badge-success", undated: "badge-neutral", archived: "badge-neutral" };
function jh({ doc: e, onOpen: t }) {
  return /* @__PURE__ */ s.jsx("div", { className: "row-item", children: /* @__PURE__ */ s.jsxs("button", { className: "row-item-btn row", onClick: () => t(e), children: [
    /* @__PURE__ */ s.jsx("div", { className: "bill-cat-icon", children: /* @__PURE__ */ s.jsx(C, { name: "document", cls: "icon-sm" }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.title }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { children: Yu[e.kind] || e.kind }),
        e.issuer ? /* @__PURE__ */ s.jsx("span", { children: e.issuer }) : null,
        e.expiresOn ? /* @__PURE__ */ s.jsxs("span", { children: [
          "Valid until ",
          Ve(e.expiresOn)
        ] }) : null,
        e.files.length ? /* @__PURE__ */ s.jsx("span", { children: e.files.length === 1 ? "1 file" : `${e.files.length} files` }) : null
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("span", { className: `badge ${xh[e.state]}`, children: yh(e) })
  ] }) });
}
function Nh({ ctx: e }) {
  const { api: t, toast: n } = e, [r, l] = y.useState(null), [a, i] = y.useState(null), [o, c] = y.useState(null), u = y.useCallback(async () => {
    i(null);
    try {
      l(await t.get("/api/documents"));
    } catch (g) {
      i(g);
    }
  }, [t]);
  if (y.useEffect(() => {
    u();
  }, [u]), a)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: a.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: u, children: "Try again" })
    ] }) });
  if (!r)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading documents…"
    ] }) });
  const h = r.documents, f = (g) => h.filter((j) => j.state === g).length, d = (g) => {
    c(null), g && n(g, "success"), u();
  };
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Documents" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Passport, insurance, inspection, warranties: kept in one place, and remembered before they run out." })
      ] }),
      o ? null : /* @__PURE__ */ s.jsxs("div", { className: "page-actions", children: [
        r.scan.available ? /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: () => c({ mode: "scan" }), children: [
          /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " Scan a document"
        ] }) : null,
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => c({ mode: "manual" }), children: [
          /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Add a document"
        ] })
      ] })
    ] }),
    o ? /* @__PURE__ */ s.jsx(
      vh,
      {
        api: t,
        toast: n,
        mode: o.existing ? "edit" : o.mode,
        existing: o.existing || null,
        options: r,
        onCancel: () => c(null),
        onDone: d
      },
      o.existing ? `edit-${o.existing.id}` : o.mode
    ) : null,
    o ? null : /* @__PURE__ */ s.jsxs("div", { className: "stat-row", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: f("expired") }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Expired" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: f("soon") }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Within 30 days" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: f("valid") }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Valid" })
      ] })
    ] }),
    !o && !h.length ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "document", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No documents yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Add the first one: the passport, the car's insurance, a warranty. You will be reminded before it runs out." })
    ] }) : null,
    o ? null : gh.map(([g, j]) => {
      const N = h.filter((w) => w.state === g);
      return N.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region", style: { marginTop: "var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
          j,
          " (",
          N.length,
          ")"
        ] }),
        /* @__PURE__ */ s.jsx("div", { className: "row-list", children: N.map((w) => /* @__PURE__ */ s.jsx(jh, { doc: w, onOpen: (p) => c({ existing: p }) }, w.id)) })
      ] }, g) : null;
    })
  ] });
}
function wh(e) {
  const [t, n] = y.useState([]), [r, l] = y.useState(null), [a, i] = y.useState(0), [o, c] = y.useState(!0), [u, h] = y.useState(null), f = y.useCallback(async () => {
    c(!0), h(null);
    try {
      const [d, g] = await Promise.all([e.get("/api/ecolife/summary"), e.get("/api/ecolife")]);
      l(d.summary), i(d.totalLogs), n(g.logs);
    } catch (d) {
      h(d);
    } finally {
      c(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    f();
  }, [f]), { logs: t, summary: r, totalLogs: a, loading: o, error: u, refetch: f };
}
const kh = { transport: "refresh", energy: "sun", food: "cart", shopping: "cart", waste: "trash", water: "refresh" };
function Sh({ log: e, onDelete: t }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ s.jsx("div", { className: "eco-cat-icon", style: { width: 32, height: 32 }, children: /* @__PURE__ */ s.jsx(C, { name: kh[e.category] || "eco", cls: "icon-sm" }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.action }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { style: { textTransform: "capitalize" }, children: e.category }),
        e.quantity ? /* @__PURE__ */ s.jsxs("span", { children: [
          e.quantity,
          e.unit ? ` ${e.unit}` : ""
        ] }) : null,
        /* @__PURE__ */ s.jsx("span", { children: Us(e.logged_at) })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": "Delete", onClick: () => t(e.id), children: /* @__PURE__ */ s.jsx(C, { name: "x", cls: "icon-sm" }) })
  ] });
}
function Ch({ state: e }) {
  return e ? e.unavailable ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", children: [
    /* @__PURE__ */ s.jsx(C, { name: "info", cls: "icon-sm" }),
    " AI tips require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo."
  ] }) }) : e.loading ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Finding practical suggestions for you…"
  ] }) }) : e.error ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsx("p", { className: "field-error", children: e.error }) }) : /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)", borderColor: "var(--brand-soft-border)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
      /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
      " Suggestions for you"
    ] }) }),
    /* @__PURE__ */ s.jsx("div", { className: "stack", children: e.data.tips.map((t, n) => /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("strong", { className: "text-sm", style: { textTransform: "capitalize" }, children: t.area }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: t.tip })
    ] }, n)) })
  ] }) : null;
}
const Eh = ["transport", "energy", "food", "shopping", "waste", "water"], bh = { transport: "Transport", energy: "Energy", food: "Food", shopping: "Shopping", waste: "Waste", water: "Water" };
function Th() {
  return /* @__PURE__ */ s.jsxs("form", { id: "eco-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Category" }),
      /* @__PURE__ */ s.jsx("select", { className: "select", name: "category", children: Eh.map((e) => /* @__PURE__ */ s.jsx("option", { value: e, children: bh[e] }, e)) })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "What did you do?" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "action", placeholder: "e.g. Took the bus instead of driving", required: !0 })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Quantity (optional)" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", type: "number", step: "0.1", name: "quantity" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Unit" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", name: "unit", placeholder: "km, kg, kWh…" })
      ] })
    ] })
  ] });
}
function ko({ api: e, toast: t, onSaved: n }) {
  let r = null;
  fe({
    title: "Log an eco action",
    bodyHtml: '<div id="eco-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="eco-save">Log it</button>',
    onMount: (l) => {
      r = oe(l.querySelector("#eco-form-mount")), r.render(y.createElement(Th)), document.getElementById("eco-save").addEventListener("click", async () => {
        const a = document.getElementById("eco-form"), i = Object.fromEntries(new FormData(a).entries());
        if (!i.action.trim()) return t("Describe the action.", "error");
        const o = { category: i.category, action: i.action.trim(), quantity: i.quantity ? Number(i.quantity) : null, unit: i.unit || null };
        try {
          await e.post("/api/ecolife", o), t("Logged", "success"), re(), n();
        } catch (c) {
          t(c.message, "error");
        }
      });
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
const Dh = ["transport", "energy", "food", "shopping", "waste", "water"], _h = { transport: "refresh", energy: "sun", food: "cart", shopping: "cart", waste: "trash", water: "refresh" }, Mh = { transport: "Transport", energy: "Energy", food: "Food", shopping: "Shopping", waste: "Waste", water: "Water" };
function Lh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { logs: l, summary: a, totalLogs: i, loading: o, error: c, refetch: u } = wh(t), [h, f] = y.useState(null);
  async function d(j) {
    await Pe({ title: "Delete this log?", message: "This entry will be permanently removed.", confirmLabel: "Delete" }) && (await t.del(`/api/ecolife/${j}`), u());
  }
  async function g() {
    if (!r.aiConfigured) {
      f({ unavailable: !0 });
      return;
    }
    f({ loading: !0 });
    try {
      const j = await t.post("/api/ecolife/tips", {});
      if (!j.ok) {
        f({ error: j.error });
        return;
      }
      f({ data: j.data });
    } catch (j) {
      f({ error: j.message });
    }
  }
  return o ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading EcoLife…"
  ] }) }) : c ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
    /* @__PURE__ */ s.jsx("p", { children: c.message }),
    /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: u, children: "Retry" })
  ] }) }) : /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "EcoLife" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Track habits and get practical, honest sustainability suggestions." })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "page-actions", children: [
        /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: g, children: [
          /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " Get tips"
        ] }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => ko({ api: t, toast: n, onSaved: u }), children: [
          /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Log an action"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx(Ch, { state: h }),
    /* @__PURE__ */ s.jsx("div", { className: "grid-3", style: { marginBottom: "var(--sp-6)" }, children: Dh.map((j) => /* @__PURE__ */ s.jsxs("div", { className: "card eco-cat-card", children: [
      /* @__PURE__ */ s.jsx("div", { className: "eco-cat-icon", children: /* @__PURE__ */ s.jsx(C, { name: _h[j], cls: "icon" }) }),
      /* @__PURE__ */ s.jsx("div", { style: { fontWeight: 700, fontSize: "var(--fs-lg)" }, children: a[j].count }),
      /* @__PURE__ */ s.jsxs("div", { className: "muted text-xs", children: [
        Mh[j],
        " logs"
      ] })
    ] }, j)) }),
    l.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--nature", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
        i,
        " logged in the last 30 days"
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: l.slice(0, 15).map((j) => /* @__PURE__ */ s.jsx(Sh, { log: j, onDelete: d }, j.id)) }),
      l.length > 15 ? /* @__PURE__ */ s.jsx("p", { className: "muted text-xs", style: { marginTop: "var(--sp-2)" }, children: "Showing the 15 most recent." }) : null
    ] }) : /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "eco", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No logs yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Log small everyday actions — taking the bus, recycling, a meatless meal — to see patterns and get tips." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: () => ko({ api: t, toast: n, onSaved: u }), children: "Log an action" })
    ] }) })
  ] });
}
function Ph(e) {
  const t = {};
  for (const n of e) {
    const r = n.createdAt.slice(0, 10), l = Vu(r);
    t[l] || (t[l] = []), t[l].push(n);
  }
  return t;
}
const Ih = {
  task_created: { icon: "tasks" },
  task_completed: { icon: "tasks" },
  comment: { icon: "message" },
  bill_paid: { icon: "bill", accent: "money" },
  decision_made: { icon: "decision", accent: "reasoning" },
  goal_progress: { icon: "goal", accent: "warmth" },
  member_joined: { icon: "family", accent: "warmth" },
  member_left: { icon: "family", accent: "warmth" },
  ownership_transferred: { icon: "family", accent: "warmth" },
  invite_code_changed: { icon: "family", accent: "warmth" }
}, $h = { icon: "timeline" };
function Ah({ event: e }) {
  const t = Ih[e.type] || $h, n = t.accent ? `module-accent--${t.accent}` : "", r = /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx("span", { className: "timeline-time", children: Hu(e.createdAt.replace(" ", "T") + "Z") }),
    /* @__PURE__ */ s.jsx(C, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ s.jsx("span", { className: "text-sm", children: e.summary })
  ] });
  return e.link ? /* @__PURE__ */ s.jsx("a", { className: `timeline-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ s.jsx("div", { className: `timeline-item ${n}`, children: r });
}
function Oh({ ctx: e }) {
  const { api: t } = e, [n, r] = y.useState(null), [l, a] = y.useState(null), i = y.useCallback(() => {
    a(null), t.get("/api/timeline").then(({ activity: o }) => r(o)).catch((o) => a(o));
  }, [t]);
  return y.useEffect(() => {
    i();
  }, [i]), /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Ledger" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "The complete, dated record of everything that's happened." })
    ] }) }),
    /* @__PURE__ */ s.jsx("div", { className: "list-region", children: l ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load your timeline" }),
      /* @__PURE__ */ s.jsx("p", { children: l.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Try again" })
    ] }) : n === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading timeline…"
    ] }) : n.length === 0 ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "timeline", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Nothing here yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "As you complete tasks, pay bills, and make decisions, they'll show up here." })
    ] }) : Object.entries(Ph(n)).map(([o, c]) => /* @__PURE__ */ s.jsxs("div", { className: "timeline-day", children: [
      /* @__PURE__ */ s.jsx("div", { className: "timeline-day-label", children: o }),
      c.map((u) => /* @__PURE__ */ s.jsx(Ah, { event: u }, u.id))
    ] }, o)) })
  ] });
}
function Rh(e) {
  const [t, n] = y.useState([]), [r, l] = y.useState(!0), [a, i] = y.useState(null), o = y.useCallback(async () => {
    l(!0), i(null);
    try {
      const { decisions: c } = await e.get("/api/decisions");
      n(c);
    } catch (c) {
      i(c);
    } finally {
      l(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    o();
  }, [o]), { decisions: t, loading: r, error: a, refetch: o };
}
function So({ decision: e }) {
  return /* @__PURE__ */ s.jsxs("a", { className: "row-item", href: `#/decisionflow/${e.id}`, style: { textDecoration: "none" }, children: [
    /* @__PURE__ */ s.jsx(
      "div",
      {
        className: "row-check",
        style: {
          pointerEvents: "none",
          ...e.status === "decided" ? { background: "var(--accent-500)", borderColor: "var(--accent-500)", color: "#fff" } : {}
        },
        children: /* @__PURE__ */ s.jsx(C, { name: e.status === "decided" ? "check" : "decision", cls: "icon-sm" })
      }
    ),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.question }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { children: Ve(e.createdAt) }),
        e.status === "decided" ? /* @__PURE__ */ s.jsx("span", { className: "badge badge-success", children: "Decided" }) : /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: "Open" })
      ] })
    ] })
  ] });
}
function Fh() {
  return /* @__PURE__ */ s.jsx("form", { id: "decision-form", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "What are you trying to decide?" }),
    /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "question", placeholder: "Should I buy this laptop? Should I move apartments? Should I take this job?", required: !0 })
  ] }) });
}
function Co({ api: e, toast: t }) {
  let n = null;
  fe({
    title: "Start a new decision",
    bodyHtml: '<div id="decision-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="save-decision-btn">Start</button>',
    onMount: (r) => {
      n = oe(r.querySelector("#decision-form-mount")), n.render(y.createElement(Fh)), document.getElementById("save-decision-btn").addEventListener("click", async () => {
        const l = document.querySelector("#decision-form [name=question]").value.trim();
        if (!l) return t("Describe the decision first.", "error");
        try {
          const { decision: a } = await e.post("/api/decisions", { question: l });
          re(), location.hash = `#/decisionflow/${a.id}`;
        } catch (a) {
          t(a.message, "error");
        }
      });
    },
    onClose: () => {
      n && (n.unmount(), n = null);
    }
  });
}
function zh({ ctx: e }) {
  const { api: t, toast: n } = e, { decisions: r, loading: l, error: a, refetch: i } = Rh(t);
  if (l)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading decisions…"
    ] }) });
  if (a)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: a.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Retry" })
    ] }) });
  const o = r.filter((u) => u.status !== "decided"), c = r.filter((u) => u.status === "decided");
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "DecisionFlow" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Structure hard decisions with clear, transparent reasoning." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => Co({ api: t, toast: n }), children: [
        /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
        " New decision"
      ] }) })
    ] }),
    o.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--reasoning", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
        o.length,
        " open decision",
        o.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: o.map((u) => /* @__PURE__ */ s.jsx(So, { decision: u }, u.id)) })
    ] }) : /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "decision", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No open decisions" }),
      /* @__PURE__ */ s.jsx("p", { children: "Describe something you're trying to decide — LifeAdmin will help you weigh it clearly." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: () => Co({ api: t, toast: n }), children: "Start a decision" })
    ] }) }),
    c.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--reasoning", style: { marginTop: "var(--sp-6)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: "Decided" }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: c.map((u) => /* @__PURE__ */ s.jsx(So, { decision: u }, u.id)) })
    ] }) : null
  ] });
}
function Bh(e, t) {
  const [n, r] = y.useState(null), [l, a] = y.useState(!0), [i, o] = y.useState(null), c = y.useCallback(async () => {
    a(!0), o(null);
    try {
      const u = await e.get(`/api/decisions/${t}`);
      r(u);
    } catch (u) {
      o(u);
    } finally {
      a(!1);
    }
  }, [e, t]);
  return y.useEffect(() => {
    c();
  }, [c]), { ...n, loading: l, error: i, refetch: c };
}
function Uh({ criterion: e, onSetWeight: t }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "criterion-row", children: [
    /* @__PURE__ */ s.jsx("span", { className: "crit-name", children: e.name }),
    /* @__PURE__ */ s.jsx("div", { className: "weight-dots", children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ s.jsx(
      "button",
      {
        type: "button",
        className: `weight-dot ${n <= e.weight ? "filled" : ""}`,
        "aria-label": `Set weight to ${n}`,
        "aria-pressed": n <= e.weight,
        onClick: () => t(e.id, n)
      },
      n
    )) })
  ] });
}
function Vh({ scored: e, isTop: t, decisionStatus: n, onDecide: r, onDelete: l }) {
  const a = t && e.percent >= 50;
  return /* @__PURE__ */ s.jsxs("div", { className: `option-card ${a ? "recommended" : ""}`, style: { marginBottom: "var(--sp-3)" }, children: [
    a ? /* @__PURE__ */ s.jsx("div", { className: "option-rank-badge", children: "Recommended" }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "row-between", children: [
      /* @__PURE__ */ s.jsx("strong", { className: "text-sm", children: e.name }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: 6 }, children: [
        n !== "decided" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => r(e.id), children: "Choose this" }) : null,
        /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": "Remove", onClick: () => l(e.id), children: /* @__PURE__ */ s.jsx(C, { name: "x", cls: "icon-sm" }) })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "option-score-bar", children: [
      /* @__PURE__ */ s.jsx("div", { className: "progress-track", style: { flex: 1 }, children: /* @__PURE__ */ s.jsx("div", { className: "progress-fill", style: { width: `${e.percent}%` } }) }),
      /* @__PURE__ */ s.jsxs("span", { className: "text-xs muted", children: [
        e.percent,
        "%"
      ] })
    ] }),
    e.incomplete ? /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginBottom: "var(--sp-2)" }, children: "Some criteria aren't rated for this option yet (defaulted to neutral)." }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "pros-cons", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("div", { className: "pc-title", style: { color: "var(--accent-600)" }, children: "Pros" }),
        /* @__PURE__ */ s.jsx("ul", { children: (e.pros || []).length ? e.pros.map((i, o) => /* @__PURE__ */ s.jsx("li", { children: i }, o)) : /* @__PURE__ */ s.jsx("li", { className: "muted", children: "—" }) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("div", { className: "pc-title", style: { color: "var(--danger-500)" }, children: "Cons" }),
        /* @__PURE__ */ s.jsx("ul", { children: (e.cons || []).length ? e.cons.map((i, o) => /* @__PURE__ */ s.jsx("li", { children: i }, o)) : /* @__PURE__ */ s.jsx("li", { className: "muted", children: "—" }) })
      ] })
    ] }),
    e.risks && e.risks.length ? /* @__PURE__ */ s.jsxs("div", { style: { marginTop: "var(--sp-2)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "pc-title text-xs", style: { color: "var(--warning-600)" }, children: "Risks" }),
      /* @__PURE__ */ s.jsx("ul", { className: "text-xs", style: { color: "var(--text-secondary)" }, children: e.risks.map((i, o) => /* @__PURE__ */ s.jsx("li", { children: i }, o)) })
    ] }) : null
  ] });
}
function Hh() {
  return /* @__PURE__ */ s.jsx("form", { id: "opt-form", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Option name" }),
    /* @__PURE__ */ s.jsx("input", { className: "input", name: "name", required: !0 })
  ] }) });
}
function Wh({ api: e, toast: t, decisionId: n, onSaved: r }) {
  let l = null;
  fe({
    title: "Add an option",
    bodyHtml: '<div id="opt-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opt-save">Add</button>',
    onMount: (a) => {
      l = oe(a.querySelector("#opt-form-mount")), l.render(y.createElement(Hh)), document.getElementById("opt-save").addEventListener("click", async () => {
        const i = document.querySelector("#opt-form [name=name]").value.trim();
        if (!i) return t("Name is required.", "error");
        await e.post(`/api/decisions/${n}/options`, { name: i }), re(), r();
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
function qh() {
  return /* @__PURE__ */ s.jsxs("form", { id: "crit-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Criterion name" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "name", placeholder: "e.g. Cost, Risk, Convenience", required: !0 })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Weight (1-5)" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", type: "number", name: "weight", min: "1", max: "5", defaultValue: "3" })
    ] })
  ] });
}
function Qh({ api: e, toast: t, decisionId: n, onSaved: r }) {
  let l = null;
  fe({
    title: "Add a criterion",
    bodyHtml: '<div id="crit-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="crit-save">Add</button>',
    onMount: (a) => {
      l = oe(a.querySelector("#crit-form-mount")), l.render(y.createElement(qh)), document.getElementById("crit-save").addEventListener("click", async () => {
        const i = document.getElementById("crit-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.name.trim()) return t("Name is required.", "error");
        await e.post(`/api/decisions/${n}/criteria`, { name: o.name.trim(), weight: Number(o.weight) }), re(), r();
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
const Kh = { high: "badge-success", medium: "badge-medium", low: "badge-low" };
function Yh({ ctx: e, id: t }) {
  const { api: n, toast: r, state: l } = e, { decision: a, criteria: i, options: o, scoring: c, loading: u, error: h, refetch: f } = Bh(n, t), [d, g] = y.useState(!1);
  async function j(x, S) {
    await n.patch(`/api/decisions/${t}/criteria/${x}`, { weight: S }), f();
  }
  async function N(x) {
    await n.post(`/api/decisions/${t}/decide`, { optionId: x }), r("Decision recorded", "success"), f();
  }
  async function w(x) {
    await Pe({ title: "Remove option?", message: "Its pros, cons and ratings will be lost.", confirmLabel: "Remove" }) && (await n.del(`/api/decisions/${t}/options/${x}`), f());
  }
  async function p() {
    await Pe({ title: "Delete this decision?", message: "This cannot be undone.", confirmLabel: "Delete" }) && (await n.del(`/api/decisions/${t}`), r("Decision deleted", "success"), location.hash = "#/decisionflow");
  }
  async function m() {
    if (!l.aiConfigured) return r("AI is not configured on this server. Add ANTHROPIC_API_KEY to enable analysis.", "error");
    if (!o.length) return r("Add at least one option first.", "error");
    g(!0);
    try {
      const x = await n.post(`/api/decisions/${t}/analyze`, { options: o.map((S) => S.name) });
      if (!x.ok) {
        r(x.error, "error");
        return;
      }
      r("Analysis complete", "success"), f();
    } catch (x) {
      r(x.message, "error");
    } finally {
      g(!1);
    }
  }
  if (u)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) });
  if (h)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this decision" }),
      /* @__PURE__ */ s.jsx("p", { children: h.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Retry" })
    ] }) });
  const v = a.status === "decided" ? c.ranked.find((x) => x.id === a.chosenOptionId) : null;
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("a", { href: "#/decisionflow", className: "text-xs muted", children: "← All decisions" }),
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", style: { marginTop: 6 }, children: a.question }),
        a.status === "decided" ? /* @__PURE__ */ s.jsxs("p", { className: "page-subtitle", children: [
          "Decided",
          v ? `: ${v.name}` : ""
        ] }) : /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Open decision" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "page-actions", children: [
        /* @__PURE__ */ s.jsxs("button", { className: "btn", disabled: d, onClick: m, children: [
          d ? /* @__PURE__ */ s.jsx("span", { className: "spinner" }) : /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " ",
          d ? "Analyzing…" : "Analyze with AI"
        ] }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-ghost", onClick: p, children: [
          /* @__PURE__ */ s.jsx(C, { name: "trash", cls: "icon-sm" }),
          " Delete"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "card card-pad module-accent--reasoning", children: [
          /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Options" }),
            /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: () => Wh({ api: n, toast: r, decisionId: t, onSaved: f }), children: [
              /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }),
              " Add option"
            ] })
          ] }),
          /* @__PURE__ */ s.jsx("div", { className: "stack", id: "options-list", children: o.length ? c.ranked.map((x, S) => /* @__PURE__ */ s.jsx(
            Vh,
            {
              scored: x,
              isTop: S === 0,
              decisionStatus: a.status,
              onDecide: N,
              onDelete: w
            },
            x.id
          )) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "Add at least two options to compare." }) })
        ] }),
        a.recommendation ? /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--brand-soft-border)" }, children: [
          /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
              /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
              " AI reasoning"
            ] }),
            /* @__PURE__ */ s.jsxs("span", { className: `badge ${Kh[a.recommendation.confidence] || "badge-low"}`, children: [
              a.recommendation.confidence,
              " confidence"
            ] })
          ] }),
          /* @__PURE__ */ s.jsx("p", { className: "text-sm", children: a.recommendation.reasoningSummary || "" }),
          a.recommendation.missingInfo && a.recommendation.missingInfo.length ? /* @__PURE__ */ s.jsxs("div", { style: { marginTop: "var(--sp-3)" }, children: [
            /* @__PURE__ */ s.jsx("strong", { className: "text-xs", children: "What would improve confidence:" }),
            /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: 4, marginTop: 6 }, children: a.recommendation.missingInfo.map((x, S) => /* @__PURE__ */ s.jsx("li", { className: "text-sm muted", children: x }, S)) })
          ] }) : null
        ] }) : null
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad module-accent--reasoning", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
          /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Criteria & weights" }),
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => Qh({ api: n, toast: r, decisionId: t, onSaved: f }), children: /* @__PURE__ */ s.jsx(C, { name: "plus", cls: "icon-sm" }) })
        ] }),
        i.length ? i.map((x) => /* @__PURE__ */ s.jsx(Uh, { criterion: x, onSetWeight: j }, x.id)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No criteria yet — add some or use AI analysis." }),
        /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: "Weights are yours to set. Scoring math is always computed locally, never guessed by AI." })
      ] })
    ] })
  ] });
}
function Gh({ ctx: e }) {
  const t = e.params && e.params[0];
  return t ? /* @__PURE__ */ s.jsx(Yh, { ctx: e, id: Number(t) }) : /* @__PURE__ */ s.jsx(zh, { ctx: e });
}
const Xh = [
  "Organize my week",
  "What needs my attention today?",
  "I have too much going on, help me prioritize",
  "What can I change to save money this month?"
];
function Zh({ api: e, toast: t }) {
  const [n, r] = y.useState(null), [l, a] = y.useState(""), [i, o] = y.useState(!1), c = y.useRef(null);
  y.useEffect(() => {
    let f = !1;
    return e.get("/api/ai/chat/history").then(({ messages: d }) => {
      f || r(d);
    }).catch((d) => {
      f || (r([]), t(d.message || "Could not load your conversation history.", "error"));
    }), () => {
      f = !0;
    };
  }, [e, t]), y.useEffect(() => {
    c.current && (c.current.scrollTop = c.current.scrollHeight);
  }, [n, i]);
  async function u(f) {
    if (!(!f || i)) {
      a(""), r((d) => [...d || [], { role: "user", content: f }]), o(!0);
      try {
        const d = await e.post("/api/ai/chat", { message: f });
        if (!d.ok) {
          t(d.error, "error"), r((g) => g.slice(0, -1)), a(f);
          return;
        }
        r((g) => [...g, { role: "assistant", content: d.data.reply, suggestions: d.data.suggestions }]);
      } catch (d) {
        t(d.message, "error"), r((g) => g.slice(0, -1)), a(f);
      } finally {
        o(!1);
      }
    }
  }
  function h(f) {
    f.preventDefault(), u(l.trim());
  }
  return /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "assistant-shell", children: [
    /* @__PURE__ */ s.jsx("div", { className: "assistant-messages", ref: c, "aria-live": "polite", "aria-relevant": "additions", children: n === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading conversation…"
    ] }) : n.length === 0 && !i ? /* @__PURE__ */ s.jsxs("div", { className: "assistant-empty", children: [
      /* @__PURE__ */ s.jsx(C, { name: "assistant", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { style: { marginTop: "var(--sp-2)" }, children: "How can I help with your week?" }),
      /* @__PURE__ */ s.jsx("div", { className: "assistant-prompt-grid", children: Xh.map((f) => /* @__PURE__ */ s.jsx("button", { className: "assistant-prompt-chip", onClick: () => u(f), children: f }, f)) })
    ] }) : /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      n.map((f, d) => /* @__PURE__ */ s.jsxs("div", { className: `assistant-msg ${f.role}`, children: [
        /* @__PURE__ */ s.jsx("div", { className: "bubble", children: f.content }),
        f.suggestions && f.suggestions.length ? /* @__PURE__ */ s.jsx("div", { className: "assistant-suggestions", children: f.suggestions.map((g) => /* @__PURE__ */ s.jsx("button", { className: "pill", disabled: i, onClick: () => u(g), children: g }, g)) }) : null
      ] }, d)),
      i ? /* @__PURE__ */ s.jsx("div", { className: "assistant-msg assistant", children: /* @__PURE__ */ s.jsxs("div", { className: "bubble", children: [
        /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
        " Thinking…"
      ] }) }) : null
    ] }) }),
    /* @__PURE__ */ s.jsxs("form", { className: "chat-input-row", onSubmit: h, children: [
      /* @__PURE__ */ s.jsx(
        "input",
        {
          className: "input",
          "aria-label": "Message the assistant",
          placeholder: "Ask LifeAdmin anything about your week…",
          style: { flex: 1 },
          autoComplete: "off",
          value: l,
          disabled: i,
          onChange: (f) => a(f.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-icon", type: "submit", "aria-label": "Send", disabled: i, children: /* @__PURE__ */ s.jsx(C, { name: "send", cls: "icon-sm" }) })
    ] })
  ] }) });
}
function Jh({ ctx: e }) {
  const { api: t, toast: n } = e, [r, l] = y.useState(""), [a, i] = y.useState(!1), [o, c] = y.useState(null), [u, h] = y.useState(!1), [f, d] = y.useState(!1);
  async function g(N) {
    N.preventDefault();
    const w = r.trim();
    if (!(!w || a)) {
      i(!0), c(null), d(!1);
      try {
        const p = await t.post("/api/ai/plan", { text: w });
        if (!p.ok) {
          c({ error: p.error });
          return;
        }
        c({ plan: p.plan, preview: p.preview });
      } catch (p) {
        c({ error: p.message });
      } finally {
        i(!1);
      }
    }
  }
  async function j() {
    h(!0);
    const N = {};
    for (const [p, m] of Object.entries(o.preview))
      N[p] = {
        ...m,
        placed: m.placed.map((v) => ({
          ...v,
          startISO: (/* @__PURE__ */ new Date(`${p}T${v.start}:00`)).toISOString(),
          endISO: (/* @__PURE__ */ new Date(`${p}T${v.end}:00`)).toISOString()
        }))
      };
    const w = await t.post("/api/ai/plan/apply", { preview: N });
    n(`Added ${w.created} tasks to your schedule`, "success"), d(!0), h(!1);
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Describe your week in your own words. LifeAdmin protects sleep, meals and rest automatically — it won't schedule every free minute." }),
    /* @__PURE__ */ s.jsxs("form", { className: "stack", onSubmit: g, children: [
      /* @__PURE__ */ s.jsx(
        "textarea",
        {
          className: "textarea",
          "aria-label": "Describe your week",
          rows: 4,
          placeholder: "From Monday until Friday I want to study JavaScript. I'm free 8-10 in the morning, then I work until 18:00. After work I need an hour to rest and eat, but I still want to study another hour.",
          value: r,
          disabled: a,
          onChange: (N) => l(N.target.value)
        }
      ),
      /* @__PURE__ */ s.jsxs("button", { type: "submit", className: "btn btn-primary", style: { alignSelf: "flex-start" }, disabled: a, children: [
        /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
        " Build my plan"
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("div", { style: { marginTop: "var(--sp-5)" }, children: a ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Reasoning about your week — protecting sleep, meals and rest…"
    ] }) : o != null && o.error ? /* @__PURE__ */ s.jsx("p", { className: "field-error", children: o.error }) : o ? /* @__PURE__ */ s.jsx(ev, { plan: o.plan, preview: o.preview, applying: u, applied: f, onApply: j }) : null })
  ] });
}
function ev({ plan: e, preview: t, applying: n, applied: r, onApply: l }) {
  const a = Object.keys(t).sort();
  return a.length ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Reasoning" }),
    /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: 4, marginBottom: "var(--sp-5)" }, children: (e.notes || []).length ? e.notes.map((i, o) => /* @__PURE__ */ s.jsx("li", { className: "text-sm muted", children: i }, o)) : /* @__PURE__ */ s.jsx("li", { className: "muted text-sm", children: "—" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Proposed schedule" }),
    a.map((i) => /* @__PURE__ */ s.jsxs("div", { className: "plan-preview-day", children: [
      /* @__PURE__ */ s.jsx("strong", { className: "text-sm", children: Vu(i) }),
      t[i].placed.length ? t[i].placed.map((o, c) => /* @__PURE__ */ s.jsxs("div", { className: "plan-block", children: [
        /* @__PURE__ */ s.jsxs("span", { className: "plan-block-time", children: [
          o.start,
          "–",
          o.end
        ] }),
        /* @__PURE__ */ s.jsx("span", { children: o.label })
      ] }, c)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-xs", children: "Nothing placed." }),
      t[i].warnings.map((o, c) => /* @__PURE__ */ s.jsxs("p", { className: "text-xs", style: { color: "var(--warning-600)" }, children: [
        /* @__PURE__ */ s.jsx(C, { name: "alert", cls: "icon-sm" }),
        " ",
        o
      ] }, c))
    ] }, i)),
    /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-3)" }, disabled: n || r, onClick: l, children: [
      n ? /* @__PURE__ */ s.jsx("span", { className: "spinner" }) : /* @__PURE__ */ s.jsx(C, { name: "check", cls: "icon-sm" }),
      " ",
      n ? "Adding…" : r ? "Added to your tasks" : "Add these to my tasks"
    ] })
  ] }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No schedulable activities were found in that description. Try mentioning specific things you want time for." });
}
function tv({ api: e }) {
  const [t, n] = y.useState({ loading: !0 });
  if (y.useEffect(() => {
    e.post("/api/ai/weekly-review", {}).then((l) => {
      l.ok ? n({ data: l.data }) : n({ error: l.error });
    }).catch((l) => n({ error: l.message }));
  }, [e]), t.loading)
    return /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Reviewing your week…"
    ] });
  if (t.error) return /* @__PURE__ */ s.jsx("p", { className: "field-error", children: t.error });
  const r = t.data;
  return /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx("h3", { style: { marginBottom: "var(--sp-3)" }, children: r.headline }),
    r.highlights.length ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Highlights" }),
      /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: 4, marginBottom: "var(--sp-4)" }, children: r.highlights.map((l, a) => /* @__PURE__ */ s.jsx("li", { className: "text-sm", children: l }, a)) })
    ] }) : null,
    r.forgettingChecklist.length ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Things you might be forgetting" }),
      /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: 4 }, children: r.forgettingChecklist.map((l, a) => /* @__PURE__ */ s.jsx("li", { className: "text-sm muted", children: l }, a)) })
    ] }) : null
  ] });
}
function nv({ api: e, toast: t, aiConfigured: n }) {
  if (!n) return t("AI is not configured on this server.", "error");
  let r = null;
  fe({
    title: "Weekly review",
    bodyHtml: '<div id="weekly-review-mount"></div>',
    onMount: (l) => {
      r = oe(l.querySelector("#weekly-review-mount")), r.render(y.createElement(tv, { api: e }));
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
const It = [
  ["chat", "Chat"],
  ["plan", "Plan my week"]
];
let Eo = "chat";
function rv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(Eo);
  function i(c) {
    Eo = c, a(c);
  }
  function o(c) {
    var d;
    const u = It.findIndex(([g]) => g === l);
    let h = null;
    if (c.key === "ArrowRight" ? h = (u + 1) % It.length : c.key === "ArrowLeft" ? h = (u - 1 + It.length) % It.length : c.key === "Home" ? h = 0 : c.key === "End" && (h = It.length - 1), h === null) return;
    c.preventDefault();
    const f = It[h][0];
    i(f), (d = document.getElementById(`assistant-tab-${f}`)) == null || d.focus();
  }
  return r.aiConfigured ? /* @__PURE__ */ s.jsxs("div", { className: "page assistant-page-flex", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Assistant" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Ask about your week, priorities, bills, or your circle — grounded only in your real data." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: () => nv({ api: t, toast: n, aiConfigured: r.aiConfigured }), children: [
        /* @__PURE__ */ s.jsx(C, { name: "sparkle", cls: "icon-sm" }),
        " Weekly review"
      ] }) })
    ] }),
    /* @__PURE__ */ s.jsx("div", { className: "tabs", style: { marginBottom: "var(--sp-5)" }, role: "tablist", "aria-label": "Assistant views", onKeyDown: o, children: It.map(([c, u]) => /* @__PURE__ */ s.jsx(
      "div",
      {
        id: `assistant-tab-${c}`,
        className: `tab ${l === c ? "active" : ""}`,
        role: "tab",
        "aria-selected": l === c,
        "aria-controls": `assistant-panel-${c}`,
        tabIndex: l === c ? 0 : -1,
        onClick: () => i(c),
        children: u
      },
      c
    )) }),
    /* @__PURE__ */ s.jsx(
      "div",
      {
        id: `assistant-panel-${l}`,
        className: "assistant-tabpanel-fill",
        role: "tabpanel",
        "aria-labelledby": `assistant-tab-${l}`,
        tabIndex: 0,
        children: l === "chat" ? /* @__PURE__ */ s.jsx(Zh, { api: t, toast: n }) : /* @__PURE__ */ s.jsx(Jh, { ctx: e })
      }
    )
  ] }) : /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Assistant" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Your AI-powered life copilot." })
    ] }) }),
    /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(C, { name: "assistant", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "AI is not configured" }),
      /* @__PURE__ */ s.jsx("p", { children: "The assistant, natural-language planner, DecisionFlow analysis, and insights all need an ANTHROPIC_API_KEY set on the server. The rest of LifeAdmin works fully without it." })
    ] }) })
  ] });
}
function sv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(!1);
  async function i(o) {
    if (o.preventDefault(), l) return;
    const c = Object.fromEntries(new FormData(o.target).entries());
    a(!0);
    try {
      const { user: u } = await t.patch("/api/settings/profile", c);
      r.user = u, n("Profile updated", "success");
    } catch (u) {
      n(u.message, "error");
    } finally {
      a(!1);
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Profile" }) }),
    /* @__PURE__ */ s.jsxs("form", { className: "stack", style: { maxWidth: 360 }, onSubmit: i, children: [
      /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "First name" }),
          /* @__PURE__ */ s.jsx("input", { className: "input", name: "firstName", defaultValue: r.user.firstName, disabled: l })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Last name" }),
          /* @__PURE__ */ s.jsx("input", { className: "input", name: "lastName", defaultValue: r.user.lastName, disabled: l })
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Email" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", value: r.user.email, disabled: !0, readOnly: !0 }),
        /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: r.user.emailVerified ? "Verified" : "Not verified" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Phone" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", value: r.user.phone, disabled: !0, readOnly: !0 }),
        /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: r.user.phoneVerified ? "Verified" : "Not verified" })
      ] }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", style: { alignSelf: "flex-start" }, disabled: l, children: "Save changes" })
    ] })
  ] });
}
function lv({ api: e, channel: t }) {
  const [n, r] = y.useState({ loading: !0 });
  return y.useEffect(() => {
    e.post(`/api/auth/verify/${t}/request`, {}).then((l) => r({ message: l.message, demoCode: l.demoCode })).catch((l) => r({ error: l.message }));
  }, [e, t]), n.loading ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Requesting code…"
  ] }) : n.error ? /* @__PURE__ */ s.jsx("p", { className: "field-error", children: n.error }) : /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsxs("div", { style: { background: "var(--bg-sunken)", borderRadius: "var(--radius-md)", padding: "var(--sp-3)", marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginBottom: 4 }, children: n.message }),
      /* @__PURE__ */ s.jsxs("p", { className: "text-sm", children: [
        "Demo code: ",
        /* @__PURE__ */ s.jsx("strong", { style: { letterSpacing: "0.1em", fontSize: "var(--fs-md)" }, children: n.demoCode })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("form", { id: "verify-form", className: "stack", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Enter the code" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "code", maxLength: 6, required: !0 })
    ] }) })
  ] });
}
function av({ api: e, toast: t, state: n, channel: r, onVerified: l }) {
  let a = null;
  fe({
    title: `Verify your ${r}`,
    bodyHtml: '<div id="verify-modal-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="verify-confirm-btn">Confirm</button>',
    onMount: (i) => {
      a = oe(i.querySelector("#verify-modal-mount")), a.render(y.createElement(lv, { api: e, channel: r })), document.getElementById("verify-confirm-btn").addEventListener("click", async () => {
        const o = document.querySelector("#verify-form [name=code]");
        if (!o) return;
        const c = o.value.trim();
        if (!c) return t("Enter the code.", "error");
        const u = document.getElementById("verify-confirm-btn");
        u.disabled = !0;
        try {
          const h = await e.post(`/api/auth/verify/${r}/confirm`, { code: c });
          n.user = h.user, t(`${r} verified`, "success"), re(), l();
        } catch (h) {
          t(h.message, "error"), u.disabled = !1;
        }
      });
    },
    onClose: () => {
      a && (a.unmount(), a = null);
    }
  });
}
function iv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(!1), [, i] = y.useState(0);
  async function o(u) {
    if (u.preventDefault(), l) return;
    const h = Object.fromEntries(new FormData(u.target).entries());
    a(!0);
    try {
      await t.post("/api/settings/password", h), n("Password updated", "success"), u.target.reset();
    } catch (f) {
      n(f.message, "error");
    } finally {
      a(!1);
    }
  }
  function c(u) {
    av({ api: t, toast: n, state: r, channel: u, onVerified: () => i((h) => h + 1) });
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Change password" }) }),
      /* @__PURE__ */ s.jsxs("form", { className: "stack", style: { maxWidth: 340 }, onSubmit: o, children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Current password" }),
          /* @__PURE__ */ s.jsx("input", { className: "input", type: "password", name: "currentPassword", required: !0, disabled: l })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "New password" }),
          /* @__PURE__ */ s.jsx("input", { className: "input", type: "password", name: "newPassword", required: !0, disabled: l })
        ] }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", style: { alignSelf: "flex-start" }, disabled: l, children: "Update password" })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Verification" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Real SMS/email delivery requires an external provider — this is not configured in the local demo. You can still test the verification flow: a code is generated and shown to you directly (demo mode)." }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsx(bo, { channel: "phone", verified: r.user.phoneVerified, onVerify: c }),
        /* @__PURE__ */ s.jsx(bo, { channel: "email", verified: r.user.emailVerified, onVerify: c })
      ] })
    ] })
  ] });
}
function bo({ channel: e, verified: t, onVerify: n }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
    /* @__PURE__ */ s.jsxs("span", { className: `badge ${t ? "badge-success" : "badge-neutral"}`, children: [
      e,
      " ",
      t ? "verified" : "unverified"
    ] }),
    t ? null : /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => n(e), children: "Verify now" })
  ] });
}
const ov = "/js/push.js", cv = () => import(
  /* @vite-ignore */
  ov
), uv = {
  install: "On an iPhone or iPad, notifications work only for an app on the Home Screen. Open the Share menu in Safari, choose “Add to Home Screen”, then open LifeAdmin from there and come back to this page.",
  unsupported: "This browser cannot receive notifications. Try Chrome, Firefox, Edge or Safari, up to date.",
  blocked: "Notifications from LifeAdmin are blocked in this browser. Allow them in the browser’s site settings (the icon next to the address), then reload this page.",
  server: "Notifications are not set up on this server yet."
};
function dv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(null), [i, o] = y.useState(null), [c, u] = y.useState(!1);
  if (y.useEffect(() => {
    let p = !0;
    return cv().then(async (m) => {
      const v = await m.status(t);
      p && (a(m), o(v));
    }).catch(() => p && o({ configured: !1, thisDevice: !1, devices: 0, failed: !0 })), () => {
      p = !1;
    };
  }, [t]), !l || !i)
    return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Notifications on this device" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: i && i.failed ? "Could not check this device. Reload the page to try again." : "Checking this device…" })
    ] });
  const h = l.obstacle(i), f = !h && i.thisDevice && Notification.permission === "granted", d = i.devices - (i.thisDevice ? 1 : 0);
  async function g(p, m) {
    u(!0);
    try {
      await p();
    } catch (v) {
      n(v && v.message || m, "error");
    } finally {
      u(!1);
    }
  }
  const j = () => g(async () => {
    const p = await l.enable(t, i.publicKey, r.user.id);
    p.ok ? (o({ ...i, thisDevice: p.thisDevice, devices: p.devices }), n("Notifications are on for this device", "success")) : (o({ ...i }), n(p.permission === "denied" ? "Notifications were blocked for this site" : "Notifications were not allowed", "error"));
  }, "Could not turn notifications on"), N = () => g(async () => {
    const p = await l.disable(t);
    o({ ...i, thisDevice: p.thisDevice, devices: p.devices }), n("Notifications are off for this device", "success");
  }, "Could not turn notifications off"), w = () => g(async () => {
    (await l.test(t)).ok ? n("Sent. It should appear in a few seconds.", "success") : (n("This device could not be reached. Turn notifications off and on again.", "error"), o(await l.status(t)));
  }, "Could not send the test");
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Notifications on this device" }),
      /* @__PURE__ */ s.jsx("span", { className: "text-sm muted", children: f ? "On" : "Off" })
    ] }),
    /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Get reminders and your circle’s activity on this phone or computer, even when LifeAdmin is closed. A notification never shows the content of a task, a bill or a message: you see it after you open the app." }),
    h ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", role: "status", children: uv[h] }) : f ? /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-secondary", onClick: w, disabled: c, children: "Send a test notification" }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-ghost", onClick: N, disabled: c, children: "Turn off on this device" })
    ] }) : /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", onClick: j, disabled: c, children: "Turn on notifications" }),
    d > 0 && /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", style: { marginTop: "var(--sp-3)" }, children: [
      f ? "Also on" : "On for",
      " ",
      d,
      " other device",
      d === 1 ? "" : "s",
      " of yours. Each device is turned on and off on its own."
    ] })
  ] });
}
const mv = { 0: "On the day", 60: "1 hour before", 300: "5 hours before", 720: "12 hours before", 1440: "1 day before", 4320: "3 days before", 7200: "5 days before", 10080: "1 week before" }, fv = [
  ["taskTimed", "Tasks with a time"],
  ["taskDate", "Tasks with a date only"],
  ["bill", "Bills"],
  ["milestone", "Steps of a goal"],
  ["goal", "Goals without dated steps"]
];
function pv() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}
function hv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(null);
  if (y.useEffect(() => {
    let u = !0;
    return t.get("/api/settings/reminders").then((h) => u && a(h.reminders)).catch(() => {
    }), () => {
      u = !1;
    };
  }, [t]), !l) return null;
  async function i(u) {
    try {
      const { reminders: h } = await t.patch("/api/settings/reminders", u);
      a(h), r.user.timezone = h.timezone, n("Saved", "success");
    } catch (h) {
      n(h && h.message || "Could not save", "error");
    }
  }
  const o = pv(), c = l.timezone || l.effectiveTimezone;
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "When to remind me" }) }),
    /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Reminders arrive around the chosen time, usually within a quarter of an hour. These apply to everything that has no choice of its own." }),
    /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "reminder-zone", children: "Time zone" }),
        /* @__PURE__ */ s.jsxs("select", { id: "reminder-zone", className: "input", value: c, onChange: (u) => i({ timezone: u.target.value }), children: [
          !o.includes(c) && /* @__PURE__ */ s.jsx("option", { value: c, children: c }),
          o.map((u) => /* @__PURE__ */ s.jsx("option", { value: u, children: u.replace(/_/g, " ") }, u))
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "reminder-time", children: "For a date without a time, remind me at" }),
        /* @__PURE__ */ s.jsx("input", { id: "reminder-time", className: "input", type: "time", value: l.defaults.dateOnlyTime, onChange: (u) => u.target.value && i({ defaults: { dateOnlyTime: u.target.value } }) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
          /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: l.defaults.quietOn, onChange: (u) => i({ defaults: { quietOn: u.target.checked } }) }),
          "Quiet hours: hold reminders back at night"
        ] }),
        l.defaults.quietOn ? /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap", marginTop: "var(--sp-2)" }, children: [
          /* @__PURE__ */ s.jsx("label", { className: "text-sm muted", htmlFor: "quiet-start", children: "From" }),
          /* @__PURE__ */ s.jsx("input", { id: "quiet-start", className: "input", style: { width: "auto" }, type: "time", value: l.defaults.quietStart, onChange: (u) => u.target.value && i({ defaults: { quietStart: u.target.value } }) }),
          /* @__PURE__ */ s.jsx("label", { className: "text-sm muted", htmlFor: "quiet-end", children: "until" }),
          /* @__PURE__ */ s.jsx("input", { id: "quiet-end", className: "input", style: { width: "auto" }, type: "time", value: l.defaults.quietEnd, onChange: (u) => u.target.value && i({ defaults: { quietEnd: u.target.value } }) })
        ] }) : null,
        /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginTop: "var(--sp-1)" }, children: "A reminder that falls in these hours arrives when they end; none is lost." }),
        l.defaults.quietOn ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { marginTop: "var(--sp-2)" }, children: [
            /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: l.defaults.quietCircles, onChange: (u) => i({ defaults: { quietCircles: u.target.checked } }) }),
            "Keep my circles quiet in these hours too"
          ] }),
          /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginTop: "var(--sp-1)" }, children: "Off: messages and activity in your circles reach your devices at any hour. On: at night they appear under the bell only, and are not sent again in the morning." })
        ] }) : null
      ] }),
      fv.map(([u, h]) => /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `reminder-${u}`, children: h }),
        /* @__PURE__ */ s.jsxs(
          "select",
          {
            id: `reminder-${u}`,
            className: "input",
            value: l.defaults[u] === null ? "none" : String(l.defaults[u]),
            onChange: (f) => i({ defaults: { [u]: f.target.value === "none" ? null : Number(f.target.value) } }),
            children: [
              /* @__PURE__ */ s.jsx("option", { value: "none", children: "No reminder" }),
              l.offsets.map((f) => /* @__PURE__ */ s.jsx("option", { value: f, children: u === "taskTimed" && f === 0 ? "At the time" : mv[f] }, f))
            ]
          }
        )
      ] }, u))
    ] })
  ] });
}
const vv = [
  ["task", "Task reminders & deadlines"],
  ["comment", "Comments on shared items"],
  ["chat", "Circle chat messages"],
  ["bill", "Bill due dates"]
];
function gv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(() => r.user.notifPrefs || {});
  async function i(o, c) {
    const u = { ...l, [o]: c };
    a(u), await t.patch("/api/settings/preferences", { notifPrefs: u }), r.user.notifPrefs = u, n("Preferences saved", "success");
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ s.jsx(dv, { ctx: e }),
    /* @__PURE__ */ s.jsx(hv, { ctx: e }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Notification preferences" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Controls which in-app notifications (the bell icon) you receive. Turning one off stops that notification from being created for you." }),
      /* @__PURE__ */ s.jsx("div", { className: "stack", children: vv.map(([o, c]) => /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ s.jsx(
          "input",
          {
            type: "checkbox",
            checked: l[o] !== !1,
            onChange: (u) => i(o, u.target.checked)
          }
        ),
        c
      ] }, o)) })
    ] })
  ] });
}
function yv(e) {
  if (e && e !== "system") {
    document.documentElement.setAttribute("data-theme", e);
    try {
      localStorage.setItem("la-theme", e);
    } catch {
    }
  } else {
    document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.removeItem("la-theme");
    } catch {
    }
  }
}
const xv = ["system", "light", "dark"];
function jv({ ctx: e }) {
  const { api: t, state: n } = e, [r, l] = y.useState(n.user.theme);
  async function a(i) {
    const { user: o } = await t.patch("/api/settings/preferences", { theme: i });
    n.user = o, yv(i), l(i);
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Appearance" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "row", style: { gap: "var(--sp-2)" }, children: xv.map((i) => /* @__PURE__ */ s.jsx(
      "button",
      {
        className: `pill ${r === i ? "active" : ""}`,
        style: { textTransform: "capitalize" },
        onClick: () => a(i),
        children: i
      },
      i
    )) })
  ] });
}
function Nv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(r.user.aiEnabled);
  async function i(o) {
    a(o);
    const { user: c } = await t.patch("/api/settings/preferences", { aiEnabled: o });
    r.user = c, n("Preference saved", "success");
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "AI preferences" }) }),
    /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: [
      "Server status: ",
      /* @__PURE__ */ s.jsx("strong", { children: r.aiConfigured ? "AI enabled" : "AI not configured (needs ANTHROPIC_API_KEY)" })
    ] }),
    /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
      /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: l, onChange: (o) => i(o.target.checked) }),
      " Use AI features (assistant, DecisionFlow analysis, planning, insights)"
    ] }),
    /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: "LifeAdmin only sends the minimum context needed for each request — never your whole database — to control cost and protect privacy." })
  ] });
}
function wv() {
  return /* @__PURE__ */ s.jsxs("form", { id: "delete-account-form", className: "stack", children: [
    /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { color: "var(--text-secondary)" }, children: "This permanently deletes your account and everything you own. This cannot be undone." }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Enter your password to confirm" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", type: "password", name: "password", required: !0, autoFocus: !0 })
    ] })
  ] });
}
function kv({ api: e, toast: t }) {
  let n = null;
  fe({
    title: "Delete your account?",
    bodyHtml: '<div id="delete-account-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-danger" id="delete-account-confirm-btn">Delete everything</button>',
    onMount: (r) => {
      n = oe(r.querySelector("#delete-account-mount")), n.render(y.createElement(wv)), document.getElementById("delete-account-confirm-btn").addEventListener("click", async () => {
        const l = document.querySelector("#delete-account-form [name=password]"), a = l.value;
        if (!a) return t("Enter your password.", "error");
        const i = document.getElementById("delete-account-confirm-btn");
        i.disabled = !0;
        try {
          await e.del("/api/settings/account", { password: a }), location.reload();
        } catch (o) {
          t(o.message, "error"), i.disabled = !1, l.value = "", l.focus();
        }
      });
    },
    onClose: () => {
      n && (n.unmount(), n = null);
    }
  });
}
function Sv({ ctx: e }) {
  const { api: t, toast: n } = e;
  async function r() {
    const a = await (await fetch("/api/settings/export")).blob(), i = URL.createObjectURL(a), o = document.createElement("a");
    o.href = i, o.download = "lifeadmin-export.json", o.click(), URL.revokeObjectURL(i);
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Export your data" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Download everything you own as a JSON file." }),
      /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: r, children: [
        /* @__PURE__ */ s.jsx(C, { name: "download", cls: "icon-sm" }),
        " Export as JSON"
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--danger-400)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", style: { color: "var(--danger-500)" }, children: "Delete account" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Permanently deletes your account and all associated data on this machine. This cannot be undone." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-danger", onClick: () => kv({ api: t, toast: n }), children: "Delete my account" })
    ] })
  ] });
}
function Cv({ ctx: e }) {
  const { api: t, toast: n } = e;
  async function r() {
    await t.post("/api/demo/seed"), n("Demo data loaded — check the Dashboard", "success");
  }
  async function l() {
    await t.post("/api/demo/clear"), n("Demo-tagged tasks and bills cleared", "success");
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Demo mode" }) }),
    /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Load sample tasks, bills, a circle, decisions, goals and eco logs to explore LifeAdmin quickly. You can clear demo-tagged tasks/bills at any time." }),
    /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", onClick: r, children: "Load demo data" }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: l, children: "Clear demo data" })
    ] })
  ] });
}
const $t = [
  ["profile", "Profile", "family"],
  ["security", "Security", "settings"],
  ["notifications", "Notifications", "bell"],
  ["appearance", "Appearance", "sun"],
  ["ai", "AI preferences", "sparkle"],
  ["data", "Data", "download"],
  ["demo", "Demo mode", "star"]
];
let To = "profile";
function Ev({ ctx: e }) {
  const [t, n] = y.useState(To);
  function r(i) {
    To = i, n(i);
  }
  function l(i) {
    var h;
    const o = $t.findIndex(([f]) => f === t);
    let c = null;
    if (i.key === "ArrowDown" ? c = (o + 1) % $t.length : i.key === "ArrowUp" ? c = (o - 1 + $t.length) % $t.length : i.key === "Home" ? c = 0 : i.key === "End" && (c = $t.length - 1), c === null) return;
    i.preventDefault();
    const u = $t[c][0];
    r(u), (h = document.getElementById(`settings-tab-${u}`)) == null || h.focus();
  }
  const a = {
    profile: sv,
    security: iv,
    notifications: gv,
    appearance: jv,
    ai: Nv,
    data: Sv,
    demo: Cv
  }[t];
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Settings" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Manage your profile, security, and preferences." })
    ] }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "settings-layout", children: [
      /* @__PURE__ */ s.jsx("nav", { className: "settings-nav", role: "tablist", "aria-label": "Settings sections", "aria-orientation": "vertical", onKeyDown: l, children: $t.map(([i, o, c]) => /* @__PURE__ */ s.jsxs(
        "div",
        {
          id: `settings-tab-${i}`,
          className: `settings-nav-item ${t === i ? "active" : ""}`,
          role: "tab",
          "aria-selected": t === i,
          "aria-controls": `settings-panel-${i}`,
          tabIndex: t === i ? 0 : -1,
          onClick: () => r(i),
          children: [
            /* @__PURE__ */ s.jsx("span", { className: "settings-nav-icon", children: /* @__PURE__ */ s.jsx(C, { name: c, cls: "icon-sm" }) }),
            /* @__PURE__ */ s.jsx("span", { children: o })
          ]
        },
        i
      )) }),
      /* @__PURE__ */ s.jsx("div", { id: `settings-panel-${t}`, role: "tabpanel", "aria-labelledby": `settings-tab-${t}`, tabIndex: 0, children: /* @__PURE__ */ s.jsx(a, { ctx: e }) })
    ] })
  ] });
}
function We(e) {
  let t = null;
  return {
    mount(n, r) {
      t = oe(n), t.render(y.createElement(e, { ctx: r }));
    },
    unmount() {
      t && (t.unmount(), t = null);
    }
  };
}
const Zu = We(sp), bv = Zu.mount, Tv = Zu.unmount, Ju = We(Sp), Dv = Ju.mount, _v = Ju.unmount, ed = We(Hp), Mv = ed.mount, Lv = ed.unmount, td = We(eh), Pv = td.mount, Iv = td.unmount, nd = We(Nh), $v = nd.mount, Av = nd.unmount, rd = We(ch), Ov = rd.mount, Rv = rd.unmount, sd = We(Lh), Fv = sd.mount, zv = sd.unmount, ld = We(Oh), Bv = ld.mount, Uv = ld.unmount, ad = We(Gh), Vv = ad.mount, Hv = ad.unmount, id = We(rv), Wv = id.mount, qv = id.unmount, od = We(Ev), Qv = od.mount, Kv = od.unmount;
export {
  Wv as mountAssistant,
  Pv as mountBillsense,
  bv as mountDashboard,
  Vv as mountDecisionflow,
  $v as mountDocuments,
  Fv as mountEcolife,
  Mv as mountFamily,
  Ov as mountGoals,
  Qv as mountSettings,
  Dv as mountTasks,
  Bv as mountTimeline,
  go as openTaskFormModal,
  qv as unmountAssistant,
  Iv as unmountBillsense,
  Tv as unmountDashboard,
  Hv as unmountDecisionflow,
  Av as unmountDocuments,
  zv as unmountEcolife,
  Lv as unmountFamily,
  Rv as unmountGoals,
  Kv as unmountSettings,
  _v as unmountTasks,
  Uv as unmountTimeline
};
