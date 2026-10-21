var $o = { exports: {} }, R = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ns = Symbol.for("react.element"), Cd = Symbol.for("react.portal"), Ed = Symbol.for("react.fragment"), Td = Symbol.for("react.strict_mode"), Dd = Symbol.for("react.profiler"), Ld = Symbol.for("react.provider"), Md = Symbol.for("react.context"), _d = Symbol.for("react.forward_ref"), $d = Symbol.for("react.suspense"), Id = Symbol.for("react.memo"), Pd = Symbol.for("react.lazy"), ii = Symbol.iterator;
function Ad(e) {
  return e === null || typeof e != "object" ? null : (e = ii && e[ii] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Io = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, Po = Object.assign, Ao = {};
function Mn(e, t, n) {
  this.props = e, this.context = t, this.refs = Ao, this.updater = n || Io;
}
Mn.prototype.isReactComponent = {};
Mn.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Mn.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Ro() {
}
Ro.prototype = Mn.prototype;
function da(e, t, n) {
  this.props = e, this.context = t, this.refs = Ao, this.updater = n || Io;
}
var ma = da.prototype = new Ro();
ma.constructor = da;
Po(ma, Mn.prototype);
ma.isPureReactComponent = !0;
var oi = Array.isArray, Oo = Object.prototype.hasOwnProperty, fa = { current: null }, Fo = { key: !0, ref: !0, __self: !0, __source: !0 };
function zo(e, t, n) {
  var r, l = {}, a = null, i = null;
  if (t != null) for (r in t.ref !== void 0 && (i = t.ref), t.key !== void 0 && (a = "" + t.key), t) Oo.call(t, r) && !Fo.hasOwnProperty(r) && (l[r] = t[r]);
  var o = arguments.length - 2;
  if (o === 1) l.children = n;
  else if (1 < o) {
    for (var c = Array(o), u = 0; u < o; u++) c[u] = arguments[u + 2];
    l.children = c;
  }
  if (e && e.defaultProps) for (r in o = e.defaultProps, o) l[r] === void 0 && (l[r] = o[r]);
  return { $$typeof: Ns, type: e, key: a, ref: i, props: l, _owner: fa.current };
}
function Rd(e, t) {
  return { $$typeof: Ns, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function ha(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Ns;
}
function Od(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var ci = /\/+/g;
function Wr(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Od("" + e.key) : t.toString(36);
}
function Ws(e, t, n, r, l) {
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
        case Ns:
        case Cd:
          i = !0;
      }
  }
  if (i) return i = e, l = l(i), e = r === "" ? "." + Wr(i, 0) : r, oi(l) ? (n = "", e != null && (n = e.replace(ci, "$&/") + "/"), Ws(l, t, n, "", function(u) {
    return u;
  })) : l != null && (ha(l) && (l = Rd(l, n + (!l.key || i && i.key === l.key ? "" : ("" + l.key).replace(ci, "$&/") + "/") + e)), t.push(l)), 1;
  if (i = 0, r = r === "" ? "." : r + ":", oi(e)) for (var o = 0; o < e.length; o++) {
    a = e[o];
    var c = r + Wr(a, o);
    i += Ws(a, t, n, c, l);
  }
  else if (c = Ad(e), typeof c == "function") for (e = c.call(e), o = 0; !(a = e.next()).done; ) a = a.value, c = r + Wr(a, o++), i += Ws(a, t, n, c, l);
  else if (a === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return i;
}
function Cs(e, t, n) {
  if (e == null) return e;
  var r = [], l = 0;
  return Ws(e, r, "", "", function(a) {
    return t.call(n, a, l++);
  }), r;
}
function Fd(e) {
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
var je = { current: null }, Hs = { transition: null }, zd = { ReactCurrentDispatcher: je, ReactCurrentBatchConfig: Hs, ReactCurrentOwner: fa };
function Bo() {
  throw Error("act(...) is not supported in production builds of React.");
}
R.Children = { map: Cs, forEach: function(e, t, n) {
  Cs(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return Cs(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return Cs(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!ha(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
R.Component = Mn;
R.Fragment = Ed;
R.Profiler = Dd;
R.PureComponent = da;
R.StrictMode = Td;
R.Suspense = $d;
R.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = zd;
R.act = Bo;
R.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var r = Po({}, e.props), l = e.key, a = e.ref, i = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (a = t.ref, i = fa.current), t.key !== void 0 && (l = "" + t.key), e.type && e.type.defaultProps) var o = e.type.defaultProps;
    for (c in t) Oo.call(t, c) && !Fo.hasOwnProperty(c) && (r[c] = t[c] === void 0 && o !== void 0 ? o[c] : t[c]);
  }
  var c = arguments.length - 2;
  if (c === 1) r.children = n;
  else if (1 < c) {
    o = Array(c);
    for (var u = 0; u < c; u++) o[u] = arguments[u + 2];
    r.children = o;
  }
  return { $$typeof: Ns, type: e.type, key: l, ref: a, props: r, _owner: i };
};
R.createContext = function(e) {
  return e = { $$typeof: Md, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: Ld, _context: e }, e.Consumer = e;
};
R.createElement = zo;
R.createFactory = function(e) {
  var t = zo.bind(null, e);
  return t.type = e, t;
};
R.createRef = function() {
  return { current: null };
};
R.forwardRef = function(e) {
  return { $$typeof: _d, render: e };
};
R.isValidElement = ha;
R.lazy = function(e) {
  return { $$typeof: Pd, _payload: { _status: -1, _result: e }, _init: Fd };
};
R.memo = function(e, t) {
  return { $$typeof: Id, type: e, compare: t === void 0 ? null : t };
};
R.startTransition = function(e) {
  var t = Hs.transition;
  Hs.transition = {};
  try {
    e();
  } finally {
    Hs.transition = t;
  }
};
R.unstable_act = Bo;
R.useCallback = function(e, t) {
  return je.current.useCallback(e, t);
};
R.useContext = function(e) {
  return je.current.useContext(e);
};
R.useDebugValue = function() {
};
R.useDeferredValue = function(e) {
  return je.current.useDeferredValue(e);
};
R.useEffect = function(e, t) {
  return je.current.useEffect(e, t);
};
R.useId = function() {
  return je.current.useId();
};
R.useImperativeHandle = function(e, t, n) {
  return je.current.useImperativeHandle(e, t, n);
};
R.useInsertionEffect = function(e, t) {
  return je.current.useInsertionEffect(e, t);
};
R.useLayoutEffect = function(e, t) {
  return je.current.useLayoutEffect(e, t);
};
R.useMemo = function(e, t) {
  return je.current.useMemo(e, t);
};
R.useReducer = function(e, t, n) {
  return je.current.useReducer(e, t, n);
};
R.useRef = function(e) {
  return je.current.useRef(e);
};
R.useState = function(e) {
  return je.current.useState(e);
};
R.useSyncExternalStore = function(e, t, n) {
  return je.current.useSyncExternalStore(e, t, n);
};
R.useTransition = function() {
  return je.current.useTransition();
};
R.version = "18.3.1";
$o.exports = R;
var y = $o.exports, Uo = { exports: {} }, _e = {}, Vo = { exports: {} }, Wo = {};
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
  function t(D, I) {
    var P = D.length;
    D.push(I);
    e: for (; 0 < P; ) {
      var U = P - 1 >>> 1, Z = D[U];
      if (0 < l(Z, I)) D[U] = I, D[P] = Z, P = U;
      else break e;
    }
  }
  function n(D) {
    return D.length === 0 ? null : D[0];
  }
  function r(D) {
    if (D.length === 0) return null;
    var I = D[0], P = D.pop();
    if (P !== I) {
      D[0] = P;
      e: for (var U = 0, Z = D.length, en = Z >>> 1; U < en; ) {
        var Ve = 2 * (U + 1) - 1, In = D[Ve], rt = Ve + 1, Pt = D[rt];
        if (0 > l(In, P)) rt < Z && 0 > l(Pt, In) ? (D[U] = Pt, D[rt] = P, U = rt) : (D[U] = In, D[Ve] = P, U = Ve);
        else if (rt < Z && 0 > l(Pt, P)) D[U] = Pt, D[rt] = P, U = rt;
        else break e;
      }
    }
    return I;
  }
  function l(D, I) {
    var P = D.sortIndex - I.sortIndex;
    return P !== 0 ? P : D.id - I.id;
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
  var c = [], u = [], h = 1, m = null, f = 3, g = !1, N = !1, j = !1, w = typeof setTimeout == "function" ? setTimeout : null, p = typeof clearTimeout == "function" ? clearTimeout : null, d = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function v(D) {
    for (var I = n(u); I !== null; ) {
      if (I.callback === null) r(u);
      else if (I.startTime <= D) r(u), I.sortIndex = I.expirationTime, t(c, I);
      else break;
      I = n(u);
    }
  }
  function x(D) {
    if (j = !1, v(D), !N) if (n(c) !== null) N = !0, z(k);
    else {
      var I = n(u);
      I !== null && ge(x, I.startTime - D);
    }
  }
  function k(D, I) {
    N = !1, j && (j = !1, p(M), M = -1), g = !0;
    var P = f;
    try {
      for (v(I), m = n(c); m !== null && (!(m.expirationTime > I) || D && !ee()); ) {
        var U = m.callback;
        if (typeof U == "function") {
          m.callback = null, f = m.priorityLevel;
          var Z = U(m.expirationTime <= I);
          I = e.unstable_now(), typeof Z == "function" ? m.callback = Z : m === n(c) && r(c), v(I);
        } else r(c);
        m = n(c);
      }
      if (m !== null) var en = !0;
      else {
        var Ve = n(u);
        Ve !== null && ge(x, Ve.startTime - I), en = !1;
      }
      return en;
    } finally {
      m = null, f = P, g = !1;
    }
  }
  var C = !1, T = null, M = -1, O = 5, E = -1;
  function ee() {
    return !(e.unstable_now() - E < O);
  }
  function Pe() {
    if (T !== null) {
      var D = e.unstable_now();
      E = D;
      var I = !0;
      try {
        I = T(!0, D);
      } finally {
        I ? Ue() : (C = !1, T = null);
      }
    } else C = !1;
  }
  var Ue;
  if (typeof d == "function") Ue = function() {
    d(Pe);
  };
  else if (typeof MessageChannel < "u") {
    var $ = new MessageChannel(), Q = $.port2;
    $.port1.onmessage = Pe, Ue = function() {
      Q.postMessage(null);
    };
  } else Ue = function() {
    w(Pe, 0);
  };
  function z(D) {
    T = D, C || (C = !0, Ue());
  }
  function ge(D, I) {
    M = w(function() {
      D(e.unstable_now());
    }, I);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(D) {
    D.callback = null;
  }, e.unstable_continueExecution = function() {
    N || g || (N = !0, z(k));
  }, e.unstable_forceFrameRate = function(D) {
    0 > D || 125 < D ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : O = 0 < D ? Math.floor(1e3 / D) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return f;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(c);
  }, e.unstable_next = function(D) {
    switch (f) {
      case 1:
      case 2:
      case 3:
        var I = 3;
        break;
      default:
        I = f;
    }
    var P = f;
    f = I;
    try {
      return D();
    } finally {
      f = P;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(D, I) {
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
    var P = f;
    f = D;
    try {
      return I();
    } finally {
      f = P;
    }
  }, e.unstable_scheduleCallback = function(D, I, P) {
    var U = e.unstable_now();
    switch (typeof P == "object" && P !== null ? (P = P.delay, P = typeof P == "number" && 0 < P ? U + P : U) : P = U, D) {
      case 1:
        var Z = -1;
        break;
      case 2:
        Z = 250;
        break;
      case 5:
        Z = 1073741823;
        break;
      case 4:
        Z = 1e4;
        break;
      default:
        Z = 5e3;
    }
    return Z = P + Z, D = { id: h++, callback: I, priorityLevel: D, startTime: P, expirationTime: Z, sortIndex: -1 }, P > U ? (D.sortIndex = P, t(u, D), n(c) === null && D === n(u) && (j ? (p(M), M = -1) : j = !0, ge(x, P - U))) : (D.sortIndex = Z, t(c, D), N || g || (N = !0, z(k))), D;
  }, e.unstable_shouldYield = ee, e.unstable_wrapCallback = function(D) {
    var I = f;
    return function() {
      var P = f;
      f = I;
      try {
        return D.apply(this, arguments);
      } finally {
        f = P;
      }
    };
  };
})(Wo);
Vo.exports = Wo;
var Bd = Vo.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ud = y, Me = Bd;
function S(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Ho = /* @__PURE__ */ new Set(), rs = {};
function Xt(e, t) {
  Sn(e, t), Sn(e + "Capture", t);
}
function Sn(e, t) {
  for (rs[e] = t, e = 0; e < t.length; e++) Ho.add(t[e]);
}
var ut = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), yl = Object.prototype.hasOwnProperty, Vd = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, ui = {}, di = {};
function Wd(e) {
  return yl.call(di, e) ? !0 : yl.call(ui, e) ? !1 : Vd.test(e) ? di[e] = !0 : (ui[e] = !0, !1);
}
function Hd(e, t, n, r) {
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
function Qd(e, t, n, r) {
  if (t === null || typeof t > "u" || Hd(e, t, n, r)) return !0;
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
function Ne(e, t, n, r, l, a, i) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = a, this.removeEmptyString = i;
}
var ue = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  ue[e] = new Ne(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  ue[t] = new Ne(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  ue[e] = new Ne(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  ue[e] = new Ne(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  ue[e] = new Ne(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  ue[e] = new Ne(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  ue[e] = new Ne(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  ue[e] = new Ne(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  ue[e] = new Ne(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var pa = /[\-:]([a-z])/g;
function va(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    pa,
    va
  );
  ue[t] = new Ne(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(pa, va);
  ue[t] = new Ne(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(pa, va);
  ue[t] = new Ne(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  ue[e] = new Ne(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
ue.xlinkHref = new Ne("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  ue[e] = new Ne(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function ga(e, t, n, r) {
  var l = ue.hasOwnProperty(t) ? ue[t] : null;
  (l !== null ? l.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (Qd(t, n, l, r) && (n = null), r || l === null ? Wd(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, r = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var ht = Ud.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Es = Symbol.for("react.element"), rn = Symbol.for("react.portal"), ln = Symbol.for("react.fragment"), ya = Symbol.for("react.strict_mode"), xl = Symbol.for("react.profiler"), Qo = Symbol.for("react.provider"), qo = Symbol.for("react.context"), xa = Symbol.for("react.forward_ref"), jl = Symbol.for("react.suspense"), Nl = Symbol.for("react.suspense_list"), ja = Symbol.for("react.memo"), vt = Symbol.for("react.lazy"), Yo = Symbol.for("react.offscreen"), mi = Symbol.iterator;
function An(e) {
  return e === null || typeof e != "object" ? null : (e = mi && e[mi] || e["@@iterator"], typeof e == "function" ? e : null);
}
var G = Object.assign, Hr;
function Hn(e) {
  if (Hr === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    Hr = t && t[1] || "";
  }
  return `
` + Hr + e;
}
var Qr = !1;
function qr(e, t) {
  if (!e || Qr) return "";
  Qr = !0;
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
    Qr = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? Hn(e) : "";
}
function qd(e) {
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
      return e = qr(e.type, !1), e;
    case 11:
      return e = qr(e.type.render, !1), e;
    case 1:
      return e = qr(e.type, !0), e;
    default:
      return "";
  }
}
function wl(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case ln:
      return "Fragment";
    case rn:
      return "Portal";
    case xl:
      return "Profiler";
    case ya:
      return "StrictMode";
    case jl:
      return "Suspense";
    case Nl:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case qo:
      return (e.displayName || "Context") + ".Consumer";
    case Qo:
      return (e._context.displayName || "Context") + ".Provider";
    case xa:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case ja:
      return t = e.displayName || null, t !== null ? t : wl(e.type) || "Memo";
    case vt:
      t = e._payload, e = e._init;
      try {
        return wl(e(t));
      } catch {
      }
  }
  return null;
}
function Yd(e) {
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
      return t === ya ? "StrictMode" : "Mode";
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
function Lt(e) {
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
function Ko(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function Kd(e) {
  var t = Ko(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
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
function Ts(e) {
  e._valueTracker || (e._valueTracker = Kd(e));
}
function Go(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), r = "";
  return e && (r = Ko(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
}
function nr(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function kl(e, t) {
  var n = t.checked;
  return G({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function fi(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
  n = Lt(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Zo(e, t) {
  t = t.checked, t != null && ga(e, "checked", t, !1);
}
function Sl(e, t) {
  Zo(e, t);
  var n = Lt(t.value), r = t.type;
  if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? bl(e, t.type, n) : t.hasOwnProperty("defaultValue") && bl(e, t.type, Lt(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function hi(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function bl(e, t, n) {
  (t !== "number" || nr(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var Qn = Array.isArray;
function yn(e, t, n, r) {
  if (e = e.options, t) {
    t = {};
    for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
    for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + Lt(n), t = null, l = 0; l < e.length; l++) {
      if (e[l].value === n) {
        e[l].selected = !0, r && (e[l].defaultSelected = !0);
        return;
      }
      t !== null || e[l].disabled || (t = e[l]);
    }
    t !== null && (t.selected = !0);
  }
}
function Cl(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(S(91));
  return G({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function pi(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(S(92));
      if (Qn(n)) {
        if (1 < n.length) throw Error(S(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: Lt(n) };
}
function Xo(e, t) {
  var n = Lt(t.value), r = Lt(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
}
function vi(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Jo(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function El(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Jo(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Ds, ec = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, l) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, r, l);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (Ds = Ds || document.createElement("div"), Ds.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Ds.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function ls(e, t) {
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
}, Gd = ["Webkit", "ms", "Moz", "O"];
Object.keys(Kn).forEach(function(e) {
  Gd.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), Kn[t] = Kn[e];
  });
});
function tc(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Kn.hasOwnProperty(e) && Kn[e] ? ("" + t).trim() : t + "px";
}
function nc(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var r = n.indexOf("--") === 0, l = tc(n, t[n], r);
    n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : e[n] = l;
  }
}
var Zd = G({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function Tl(e, t) {
  if (t) {
    if (Zd[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(S(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(S(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(S(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(S(62));
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
var Ll = null;
function Na(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var Ml = null, xn = null, jn = null;
function gi(e) {
  if (e = Ss(e)) {
    if (typeof Ml != "function") throw Error(S(280));
    var t = e.stateNode;
    t && (t = Lr(t), Ml(e.stateNode, e.type, t));
  }
}
function sc(e) {
  xn ? jn ? jn.push(e) : jn = [e] : xn = e;
}
function rc() {
  if (xn) {
    var e = xn, t = jn;
    if (jn = xn = null, gi(e), t) for (e = 0; e < t.length; e++) gi(t[e]);
  }
}
function lc(e, t) {
  return e(t);
}
function ac() {
}
var Yr = !1;
function ic(e, t, n) {
  if (Yr) return e(t, n);
  Yr = !0;
  try {
    return lc(e, t, n);
  } finally {
    Yr = !1, (xn !== null || jn !== null) && (ac(), rc());
  }
}
function as(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = Lr(n);
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
  if (n && typeof n != "function") throw Error(S(231, t, typeof n));
  return n;
}
var _l = !1;
if (ut) try {
  var Rn = {};
  Object.defineProperty(Rn, "passive", { get: function() {
    _l = !0;
  } }), window.addEventListener("test", Rn, Rn), window.removeEventListener("test", Rn, Rn);
} catch {
  _l = !1;
}
function Xd(e, t, n, r, l, a, i, o, c) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, u);
  } catch (h) {
    this.onError(h);
  }
}
var Gn = !1, sr = null, rr = !1, $l = null, Jd = { onError: function(e) {
  Gn = !0, sr = e;
} };
function em(e, t, n, r, l, a, i, o, c) {
  Gn = !1, sr = null, Xd.apply(Jd, arguments);
}
function tm(e, t, n, r, l, a, i, o, c) {
  if (em.apply(this, arguments), Gn) {
    if (Gn) {
      var u = sr;
      Gn = !1, sr = null;
    } else throw Error(S(198));
    rr || (rr = !0, $l = u);
  }
}
function Jt(e) {
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
function oc(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function yi(e) {
  if (Jt(e) !== e) throw Error(S(188));
}
function nm(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Jt(e), t === null) throw Error(S(188));
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
        if (a === n) return yi(l), e;
        if (a === r) return yi(l), t;
        a = a.sibling;
      }
      throw Error(S(188));
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
        if (!i) throw Error(S(189));
      }
    }
    if (n.alternate !== r) throw Error(S(190));
  }
  if (n.tag !== 3) throw Error(S(188));
  return n.stateNode.current === n ? e : t;
}
function cc(e) {
  return e = nm(e), e !== null ? uc(e) : null;
}
function uc(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = uc(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var dc = Me.unstable_scheduleCallback, xi = Me.unstable_cancelCallback, sm = Me.unstable_shouldYield, rm = Me.unstable_requestPaint, J = Me.unstable_now, lm = Me.unstable_getCurrentPriorityLevel, wa = Me.unstable_ImmediatePriority, mc = Me.unstable_UserBlockingPriority, lr = Me.unstable_NormalPriority, am = Me.unstable_LowPriority, fc = Me.unstable_IdlePriority, Cr = null, nt = null;
function im(e) {
  if (nt && typeof nt.onCommitFiberRoot == "function") try {
    nt.onCommitFiberRoot(Cr, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var Ye = Math.clz32 ? Math.clz32 : um, om = Math.log, cm = Math.LN2;
function um(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (om(e) / cm | 0) | 0;
}
var Ls = 64, Ms = 4194304;
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
function ar(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0, l = e.suspendedLanes, a = e.pingedLanes, i = n & 268435455;
  if (i !== 0) {
    var o = i & ~l;
    o !== 0 ? r = qn(o) : (a &= i, a !== 0 && (r = qn(a)));
  } else i = n & ~l, i !== 0 ? r = qn(i) : a !== 0 && (r = qn(a));
  if (r === 0) return 0;
  if (t !== 0 && t !== r && !(t & l) && (l = r & -r, a = t & -t, l >= a || l === 16 && (a & 4194240) !== 0)) return t;
  if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t; ) n = 31 - Ye(t), l = 1 << n, r |= e[n], t &= ~l;
  return r;
}
function dm(e, t) {
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
function mm(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, a = e.pendingLanes; 0 < a; ) {
    var i = 31 - Ye(a), o = 1 << i, c = l[i];
    c === -1 ? (!(o & n) || o & r) && (l[i] = dm(o, t)) : c <= t && (e.expiredLanes |= o), a &= ~o;
  }
}
function Il(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function hc() {
  var e = Ls;
  return Ls <<= 1, !(Ls & 4194240) && (Ls = 64), e;
}
function Kr(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function ws(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Ye(t), e[t] = n;
}
function fm(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var l = 31 - Ye(n), a = 1 << l;
    t[l] = 0, r[l] = -1, e[l] = -1, n &= ~a;
  }
}
function ka(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var r = 31 - Ye(n), l = 1 << r;
    l & t | e[r] & t && (e[r] |= t), n &= ~l;
  }
}
var B = 0;
function pc(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var vc, Sa, gc, yc, xc, Pl = !1, _s = [], wt = null, kt = null, St = null, is = /* @__PURE__ */ new Map(), os = /* @__PURE__ */ new Map(), yt = [], hm = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function ji(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      wt = null;
      break;
    case "dragenter":
    case "dragleave":
      kt = null;
      break;
    case "mouseover":
    case "mouseout":
      St = null;
      break;
    case "pointerover":
    case "pointerout":
      is.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      os.delete(t.pointerId);
  }
}
function On(e, t, n, r, l, a) {
  return e === null || e.nativeEvent !== a ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: a, targetContainers: [l] }, t !== null && (t = Ss(t), t !== null && Sa(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
}
function pm(e, t, n, r, l) {
  switch (t) {
    case "focusin":
      return wt = On(wt, e, t, n, r, l), !0;
    case "dragenter":
      return kt = On(kt, e, t, n, r, l), !0;
    case "mouseover":
      return St = On(St, e, t, n, r, l), !0;
    case "pointerover":
      var a = l.pointerId;
      return is.set(a, On(is.get(a) || null, e, t, n, r, l)), !0;
    case "gotpointercapture":
      return a = l.pointerId, os.set(a, On(os.get(a) || null, e, t, n, r, l)), !0;
  }
  return !1;
}
function jc(e) {
  var t = Bt(e.target);
  if (t !== null) {
    var n = Jt(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = oc(n), t !== null) {
          e.blockedOn = t, xc(e.priority, function() {
            gc(n);
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
function Qs(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Al(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      Ll = r, n.target.dispatchEvent(r), Ll = null;
    } else return t = Ss(n), t !== null && Sa(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function Ni(e, t, n) {
  Qs(e) && n.delete(t);
}
function vm() {
  Pl = !1, wt !== null && Qs(wt) && (wt = null), kt !== null && Qs(kt) && (kt = null), St !== null && Qs(St) && (St = null), is.forEach(Ni), os.forEach(Ni);
}
function Fn(e, t) {
  e.blockedOn === t && (e.blockedOn = null, Pl || (Pl = !0, Me.unstable_scheduleCallback(Me.unstable_NormalPriority, vm)));
}
function cs(e) {
  function t(l) {
    return Fn(l, e);
  }
  if (0 < _s.length) {
    Fn(_s[0], e);
    for (var n = 1; n < _s.length; n++) {
      var r = _s[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (wt !== null && Fn(wt, e), kt !== null && Fn(kt, e), St !== null && Fn(St, e), is.forEach(t), os.forEach(t), n = 0; n < yt.length; n++) r = yt[n], r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < yt.length && (n = yt[0], n.blockedOn === null); ) jc(n), n.blockedOn === null && yt.shift();
}
var Nn = ht.ReactCurrentBatchConfig, ir = !0;
function gm(e, t, n, r) {
  var l = B, a = Nn.transition;
  Nn.transition = null;
  try {
    B = 1, ba(e, t, n, r);
  } finally {
    B = l, Nn.transition = a;
  }
}
function ym(e, t, n, r) {
  var l = B, a = Nn.transition;
  Nn.transition = null;
  try {
    B = 4, ba(e, t, n, r);
  } finally {
    B = l, Nn.transition = a;
  }
}
function ba(e, t, n, r) {
  if (ir) {
    var l = Al(e, t, n, r);
    if (l === null) ll(e, t, r, or, n), ji(e, r);
    else if (pm(l, e, t, n, r)) r.stopPropagation();
    else if (ji(e, r), t & 4 && -1 < hm.indexOf(e)) {
      for (; l !== null; ) {
        var a = Ss(l);
        if (a !== null && vc(a), a = Al(e, t, n, r), a === null && ll(e, t, r, or, n), a === l) break;
        l = a;
      }
      l !== null && r.stopPropagation();
    } else ll(e, t, r, null, n);
  }
}
var or = null;
function Al(e, t, n, r) {
  if (or = null, e = Na(r), e = Bt(e), e !== null) if (t = Jt(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = oc(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return or = e, null;
}
function Nc(e) {
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
      switch (lm()) {
        case wa:
          return 1;
        case mc:
          return 4;
        case lr:
        case am:
          return 16;
        case fc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var jt = null, Ca = null, qs = null;
function wc() {
  if (qs) return qs;
  var e, t = Ca, n = t.length, r, l = "value" in jt ? jt.value : jt.textContent, a = l.length;
  for (e = 0; e < n && t[e] === l[e]; e++) ;
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === l[a - r]; r++) ;
  return qs = l.slice(e, 1 < r ? 1 - r : void 0);
}
function Ys(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function $s() {
  return !0;
}
function wi() {
  return !1;
}
function $e(e) {
  function t(n, r, l, a, i) {
    this._reactName = n, this._targetInst = l, this.type = r, this.nativeEvent = a, this.target = i, this.currentTarget = null;
    for (var o in e) e.hasOwnProperty(o) && (n = e[o], this[o] = n ? n(a) : a[o]);
    return this.isDefaultPrevented = (a.defaultPrevented != null ? a.defaultPrevented : a.returnValue === !1) ? $s : wi, this.isPropagationStopped = wi, this;
  }
  return G(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = $s);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = $s);
  }, persist: function() {
  }, isPersistent: $s }), t;
}
var _n = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, Ea = $e(_n), ks = G({}, _n, { view: 0, detail: 0 }), xm = $e(ks), Gr, Zr, zn, Er = G({}, ks, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: Ta, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== zn && (zn && e.type === "mousemove" ? (Gr = e.screenX - zn.screenX, Zr = e.screenY - zn.screenY) : Zr = Gr = 0, zn = e), Gr);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : Zr;
} }), ki = $e(Er), jm = G({}, Er, { dataTransfer: 0 }), Nm = $e(jm), wm = G({}, ks, { relatedTarget: 0 }), Xr = $e(wm), km = G({}, _n, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Sm = $e(km), bm = G({}, _n, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), Cm = $e(bm), Em = G({}, _n, { data: 0 }), Si = $e(Em), Tm = {
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
}, Dm = {
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
}, Lm = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Mm(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Lm[e]) ? !!t[e] : !1;
}
function Ta() {
  return Mm;
}
var _m = G({}, ks, { key: function(e) {
  if (e.key) {
    var t = Tm[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = Ys(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Dm[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: Ta, charCode: function(e) {
  return e.type === "keypress" ? Ys(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Ys(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), $m = $e(_m), Im = G({}, Er, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), bi = $e(Im), Pm = G({}, ks, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: Ta }), Am = $e(Pm), Rm = G({}, _n, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Om = $e(Rm), Fm = G({}, Er, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), zm = $e(Fm), Bm = [9, 13, 27, 32], Da = ut && "CompositionEvent" in window, Zn = null;
ut && "documentMode" in document && (Zn = document.documentMode);
var Um = ut && "TextEvent" in window && !Zn, kc = ut && (!Da || Zn && 8 < Zn && 11 >= Zn), Ci = " ", Ei = !1;
function Sc(e, t) {
  switch (e) {
    case "keyup":
      return Bm.indexOf(t.keyCode) !== -1;
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
function bc(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var an = !1;
function Vm(e, t) {
  switch (e) {
    case "compositionend":
      return bc(t);
    case "keypress":
      return t.which !== 32 ? null : (Ei = !0, Ci);
    case "textInput":
      return e = t.data, e === Ci && Ei ? null : e;
    default:
      return null;
  }
}
function Wm(e, t) {
  if (an) return e === "compositionend" || !Da && Sc(e, t) ? (e = wc(), qs = Ca = jt = null, an = !1, e) : null;
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
      return kc && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Hm = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function Ti(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Hm[e.type] : t === "textarea";
}
function Cc(e, t, n, r) {
  sc(r), t = cr(t, "onChange"), 0 < t.length && (n = new Ea("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
}
var Xn = null, us = null;
function Qm(e) {
  Rc(e, 0);
}
function Tr(e) {
  var t = un(e);
  if (Go(t)) return e;
}
function qm(e, t) {
  if (e === "change") return t;
}
var Ec = !1;
if (ut) {
  var Jr;
  if (ut) {
    var el = "oninput" in document;
    if (!el) {
      var Di = document.createElement("div");
      Di.setAttribute("oninput", "return;"), el = typeof Di.oninput == "function";
    }
    Jr = el;
  } else Jr = !1;
  Ec = Jr && (!document.documentMode || 9 < document.documentMode);
}
function Li() {
  Xn && (Xn.detachEvent("onpropertychange", Tc), us = Xn = null);
}
function Tc(e) {
  if (e.propertyName === "value" && Tr(us)) {
    var t = [];
    Cc(t, us, e, Na(e)), ic(Qm, t);
  }
}
function Ym(e, t, n) {
  e === "focusin" ? (Li(), Xn = t, us = n, Xn.attachEvent("onpropertychange", Tc)) : e === "focusout" && Li();
}
function Km(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return Tr(us);
}
function Gm(e, t) {
  if (e === "click") return Tr(t);
}
function Zm(e, t) {
  if (e === "input" || e === "change") return Tr(t);
}
function Xm(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Ze = typeof Object.is == "function" ? Object.is : Xm;
function ds(e, t) {
  if (Ze(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var l = n[r];
    if (!yl.call(t, l) || !Ze(e[l], t[l])) return !1;
  }
  return !0;
}
function Mi(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function _i(e, t) {
  var n = Mi(e);
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
    n = Mi(n);
  }
}
function Dc(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Dc(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Lc() {
  for (var e = window, t = nr(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = nr(e.document);
  }
  return t;
}
function La(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function Jm(e) {
  var t = Lc(), n = e.focusedElem, r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && Dc(n.ownerDocument.documentElement, n)) {
    if (r !== null && La(n)) {
      if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var l = n.textContent.length, a = Math.min(r.start, l);
        r = r.end === void 0 ? a : Math.min(r.end, l), !e.extend && a > r && (l = r, r = a, a = l), l = _i(n, a);
        var i = _i(
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
var ef = ut && "documentMode" in document && 11 >= document.documentMode, on = null, Rl = null, Jn = null, Ol = !1;
function $i(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  Ol || on == null || on !== nr(r) || (r = on, "selectionStart" in r && La(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), Jn && ds(Jn, r) || (Jn = r, r = cr(Rl, "onSelect"), 0 < r.length && (t = new Ea("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = on)));
}
function Is(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var cn = { animationend: Is("Animation", "AnimationEnd"), animationiteration: Is("Animation", "AnimationIteration"), animationstart: Is("Animation", "AnimationStart"), transitionend: Is("Transition", "TransitionEnd") }, tl = {}, Mc = {};
ut && (Mc = document.createElement("div").style, "AnimationEvent" in window || (delete cn.animationend.animation, delete cn.animationiteration.animation, delete cn.animationstart.animation), "TransitionEvent" in window || delete cn.transitionend.transition);
function Dr(e) {
  if (tl[e]) return tl[e];
  if (!cn[e]) return e;
  var t = cn[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in Mc) return tl[e] = t[n];
  return e;
}
var _c = Dr("animationend"), $c = Dr("animationiteration"), Ic = Dr("animationstart"), Pc = Dr("transitionend"), Ac = /* @__PURE__ */ new Map(), Ii = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function _t(e, t) {
  Ac.set(e, t), Xt(t, [e]);
}
for (var nl = 0; nl < Ii.length; nl++) {
  var sl = Ii[nl], tf = sl.toLowerCase(), nf = sl[0].toUpperCase() + sl.slice(1);
  _t(tf, "on" + nf);
}
_t(_c, "onAnimationEnd");
_t($c, "onAnimationIteration");
_t(Ic, "onAnimationStart");
_t("dblclick", "onDoubleClick");
_t("focusin", "onFocus");
_t("focusout", "onBlur");
_t(Pc, "onTransitionEnd");
Sn("onMouseEnter", ["mouseout", "mouseover"]);
Sn("onMouseLeave", ["mouseout", "mouseover"]);
Sn("onPointerEnter", ["pointerout", "pointerover"]);
Sn("onPointerLeave", ["pointerout", "pointerover"]);
Xt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Xt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Xt("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Xt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Xt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Xt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Yn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), sf = new Set("cancel close invalid load scroll toggle".split(" ").concat(Yn));
function Pi(e, t, n) {
  var r = e.type || "unknown-event";
  e.currentTarget = n, tm(r, t, void 0, e), e.currentTarget = null;
}
function Rc(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n], l = r.event;
    r = r.listeners;
    e: {
      var a = void 0;
      if (t) for (var i = r.length - 1; 0 <= i; i--) {
        var o = r[i], c = o.instance, u = o.currentTarget;
        if (o = o.listener, c !== a && l.isPropagationStopped()) break e;
        Pi(l, o, u), a = c;
      }
      else for (i = 0; i < r.length; i++) {
        if (o = r[i], c = o.instance, u = o.currentTarget, o = o.listener, c !== a && l.isPropagationStopped()) break e;
        Pi(l, o, u), a = c;
      }
    }
  }
  if (rr) throw e = $l, rr = !1, $l = null, e;
}
function W(e, t) {
  var n = t[Vl];
  n === void 0 && (n = t[Vl] = /* @__PURE__ */ new Set());
  var r = e + "__bubble";
  n.has(r) || (Oc(t, e, 2, !1), n.add(r));
}
function rl(e, t, n) {
  var r = 0;
  t && (r |= 4), Oc(n, e, r, t);
}
var Ps = "_reactListening" + Math.random().toString(36).slice(2);
function ms(e) {
  if (!e[Ps]) {
    e[Ps] = !0, Ho.forEach(function(n) {
      n !== "selectionchange" && (sf.has(n) || rl(n, !1, e), rl(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Ps] || (t[Ps] = !0, rl("selectionchange", !1, t));
  }
}
function Oc(e, t, n, r) {
  switch (Nc(t)) {
    case 1:
      var l = gm;
      break;
    case 4:
      l = ym;
      break;
    default:
      l = ba;
  }
  n = l.bind(null, t, n, e), l = void 0, !_l || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), r ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
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
        if (i = Bt(o), i === null) return;
        if (c = i.tag, c === 5 || c === 6) {
          r = a = i;
          continue e;
        }
        o = o.parentNode;
      }
    }
    r = r.return;
  }
  ic(function() {
    var u = a, h = Na(n), m = [];
    e: {
      var f = Ac.get(e);
      if (f !== void 0) {
        var g = Ea, N = e;
        switch (e) {
          case "keypress":
            if (Ys(n) === 0) break e;
          case "keydown":
          case "keyup":
            g = $m;
            break;
          case "focusin":
            N = "focus", g = Xr;
            break;
          case "focusout":
            N = "blur", g = Xr;
            break;
          case "beforeblur":
          case "afterblur":
            g = Xr;
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
            g = ki;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            g = Nm;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            g = Am;
            break;
          case _c:
          case $c:
          case Ic:
            g = Sm;
            break;
          case Pc:
            g = Om;
            break;
          case "scroll":
            g = xm;
            break;
          case "wheel":
            g = zm;
            break;
          case "copy":
          case "cut":
          case "paste":
            g = Cm;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            g = bi;
        }
        var j = (t & 4) !== 0, w = !j && e === "scroll", p = j ? f !== null ? f + "Capture" : null : f;
        j = [];
        for (var d = u, v; d !== null; ) {
          v = d;
          var x = v.stateNode;
          if (v.tag === 5 && x !== null && (v = x, p !== null && (x = as(d, p), x != null && j.push(fs(d, x, v)))), w) break;
          d = d.return;
        }
        0 < j.length && (f = new g(f, N, null, n, h), m.push({ event: f, listeners: j }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (f = e === "mouseover" || e === "pointerover", g = e === "mouseout" || e === "pointerout", f && n !== Ll && (N = n.relatedTarget || n.fromElement) && (Bt(N) || N[dt])) break e;
        if ((g || f) && (f = h.window === h ? h : (f = h.ownerDocument) ? f.defaultView || f.parentWindow : window, g ? (N = n.relatedTarget || n.toElement, g = u, N = N ? Bt(N) : null, N !== null && (w = Jt(N), N !== w || N.tag !== 5 && N.tag !== 6) && (N = null)) : (g = null, N = u), g !== N)) {
          if (j = ki, x = "onMouseLeave", p = "onMouseEnter", d = "mouse", (e === "pointerout" || e === "pointerover") && (j = bi, x = "onPointerLeave", p = "onPointerEnter", d = "pointer"), w = g == null ? f : un(g), v = N == null ? f : un(N), f = new j(x, d + "leave", g, n, h), f.target = w, f.relatedTarget = v, x = null, Bt(h) === u && (j = new j(p, d + "enter", N, n, h), j.target = v, j.relatedTarget = w, x = j), w = x, g && N) t: {
            for (j = g, p = N, d = 0, v = j; v; v = tn(v)) d++;
            for (v = 0, x = p; x; x = tn(x)) v++;
            for (; 0 < d - v; ) j = tn(j), d--;
            for (; 0 < v - d; ) p = tn(p), v--;
            for (; d--; ) {
              if (j === p || p !== null && j === p.alternate) break t;
              j = tn(j), p = tn(p);
            }
            j = null;
          }
          else j = null;
          g !== null && Ai(m, f, g, j, !1), N !== null && w !== null && Ai(m, w, N, j, !0);
        }
      }
      e: {
        if (f = u ? un(u) : window, g = f.nodeName && f.nodeName.toLowerCase(), g === "select" || g === "input" && f.type === "file") var k = qm;
        else if (Ti(f)) if (Ec) k = Zm;
        else {
          k = Km;
          var C = Ym;
        }
        else (g = f.nodeName) && g.toLowerCase() === "input" && (f.type === "checkbox" || f.type === "radio") && (k = Gm);
        if (k && (k = k(e, u))) {
          Cc(m, k, n, h);
          break e;
        }
        C && C(e, f, u), e === "focusout" && (C = f._wrapperState) && C.controlled && f.type === "number" && bl(f, "number", f.value);
      }
      switch (C = u ? un(u) : window, e) {
        case "focusin":
          (Ti(C) || C.contentEditable === "true") && (on = C, Rl = u, Jn = null);
          break;
        case "focusout":
          Jn = Rl = on = null;
          break;
        case "mousedown":
          Ol = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Ol = !1, $i(m, n, h);
          break;
        case "selectionchange":
          if (ef) break;
        case "keydown":
        case "keyup":
          $i(m, n, h);
      }
      var T;
      if (Da) e: {
        switch (e) {
          case "compositionstart":
            var M = "onCompositionStart";
            break e;
          case "compositionend":
            M = "onCompositionEnd";
            break e;
          case "compositionupdate":
            M = "onCompositionUpdate";
            break e;
        }
        M = void 0;
      }
      else an ? Sc(e, n) && (M = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (M = "onCompositionStart");
      M && (kc && n.locale !== "ko" && (an || M !== "onCompositionStart" ? M === "onCompositionEnd" && an && (T = wc()) : (jt = h, Ca = "value" in jt ? jt.value : jt.textContent, an = !0)), C = cr(u, M), 0 < C.length && (M = new Si(M, e, null, n, h), m.push({ event: M, listeners: C }), T ? M.data = T : (T = bc(n), T !== null && (M.data = T)))), (T = Um ? Vm(e, n) : Wm(e, n)) && (u = cr(u, "onBeforeInput"), 0 < u.length && (h = new Si("onBeforeInput", "beforeinput", null, n, h), m.push({ event: h, listeners: u }), h.data = T));
    }
    Rc(m, t);
  });
}
function fs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function cr(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var l = e, a = l.stateNode;
    l.tag === 5 && a !== null && (l = a, a = as(e, n), a != null && r.unshift(fs(e, a, l)), a = as(e, t), a != null && r.push(fs(e, a, l))), e = e.return;
  }
  return r;
}
function tn(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function Ai(e, t, n, r, l) {
  for (var a = t._reactName, i = []; n !== null && n !== r; ) {
    var o = n, c = o.alternate, u = o.stateNode;
    if (c !== null && c === r) break;
    o.tag === 5 && u !== null && (o = u, l ? (c = as(n, a), c != null && i.unshift(fs(n, c, o))) : l || (c = as(n, a), c != null && i.push(fs(n, c, o)))), n = n.return;
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var rf = /\r\n?/g, lf = /\u0000|\uFFFD/g;
function Ri(e) {
  return (typeof e == "string" ? e : "" + e).replace(rf, `
`).replace(lf, "");
}
function As(e, t, n) {
  if (t = Ri(t), Ri(e) !== t && n) throw Error(S(425));
}
function ur() {
}
var Fl = null, zl = null;
function Bl(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var Ul = typeof setTimeout == "function" ? setTimeout : void 0, af = typeof clearTimeout == "function" ? clearTimeout : void 0, Oi = typeof Promise == "function" ? Promise : void 0, of = typeof queueMicrotask == "function" ? queueMicrotask : typeof Oi < "u" ? function(e) {
  return Oi.resolve(null).then(e).catch(cf);
} : Ul;
function cf(e) {
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
        e.removeChild(l), cs(t);
        return;
      }
      r--;
    } else n !== "$" && n !== "$?" && n !== "$!" || r++;
    n = l;
  } while (n);
  cs(t);
}
function bt(e) {
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
function Fi(e) {
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
var $n = Math.random().toString(36).slice(2), tt = "__reactFiber$" + $n, hs = "__reactProps$" + $n, dt = "__reactContainer$" + $n, Vl = "__reactEvents$" + $n, uf = "__reactListeners$" + $n, df = "__reactHandles$" + $n;
function Bt(e) {
  var t = e[tt];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[dt] || n[tt]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Fi(e); e !== null; ) {
        if (n = e[tt]) return n;
        e = Fi(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function Ss(e) {
  return e = e[tt] || e[dt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function un(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(S(33));
}
function Lr(e) {
  return e[hs] || null;
}
var Wl = [], dn = -1;
function $t(e) {
  return { current: e };
}
function H(e) {
  0 > dn || (e.current = Wl[dn], Wl[dn] = null, dn--);
}
function V(e, t) {
  dn++, Wl[dn] = e.current, e.current = t;
}
var Mt = {}, pe = $t(Mt), Se = $t(!1), qt = Mt;
function bn(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Mt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
  var l = {}, a;
  for (a in n) l[a] = t[a];
  return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
}
function be(e) {
  return e = e.childContextTypes, e != null;
}
function dr() {
  H(Se), H(pe);
}
function zi(e, t, n) {
  if (pe.current !== Mt) throw Error(S(168));
  V(pe, t), V(Se, n);
}
function Fc(e, t, n) {
  var r = e.stateNode;
  if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
  r = r.getChildContext();
  for (var l in r) if (!(l in t)) throw Error(S(108, Yd(e) || "Unknown", l));
  return G({}, n, r);
}
function mr(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Mt, qt = pe.current, V(pe, e), V(Se, Se.current), !0;
}
function Bi(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(S(169));
  n ? (e = Fc(e, t, qt), r.__reactInternalMemoizedMergedChildContext = e, H(Se), H(pe), V(pe, e)) : H(Se), V(Se, n);
}
var at = null, Mr = !1, il = !1;
function zc(e) {
  at === null ? at = [e] : at.push(e);
}
function mf(e) {
  Mr = !0, zc(e);
}
function It() {
  if (!il && at !== null) {
    il = !0;
    var e = 0, t = B;
    try {
      var n = at;
      for (B = 1; e < n.length; e++) {
        var r = n[e];
        do
          r = r(!0);
        while (r !== null);
      }
      at = null, Mr = !1;
    } catch (l) {
      throw at !== null && (at = at.slice(e + 1)), dc(wa, It), l;
    } finally {
      B = t, il = !1;
    }
  }
  return null;
}
var mn = [], fn = 0, fr = null, hr = 0, Ae = [], Re = 0, Yt = null, it = 1, ot = "";
function Ft(e, t) {
  mn[fn++] = hr, mn[fn++] = fr, fr = e, hr = t;
}
function Bc(e, t, n) {
  Ae[Re++] = it, Ae[Re++] = ot, Ae[Re++] = Yt, Yt = e;
  var r = it;
  e = ot;
  var l = 32 - Ye(r) - 1;
  r &= ~(1 << l), n += 1;
  var a = 32 - Ye(t) + l;
  if (30 < a) {
    var i = l - l % 5;
    a = (r & (1 << i) - 1).toString(32), r >>= i, l -= i, it = 1 << 32 - Ye(t) + l | n << l | r, ot = a + e;
  } else it = 1 << a | n << l | r, ot = e;
}
function Ma(e) {
  e.return !== null && (Ft(e, 1), Bc(e, 1, 0));
}
function _a(e) {
  for (; e === fr; ) fr = mn[--fn], mn[fn] = null, hr = mn[--fn], mn[fn] = null;
  for (; e === Yt; ) Yt = Ae[--Re], Ae[Re] = null, ot = Ae[--Re], Ae[Re] = null, it = Ae[--Re], Ae[Re] = null;
}
var Le = null, De = null, q = !1, qe = null;
function Uc(e, t) {
  var n = Oe(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function Ui(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Le = e, De = bt(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Le = e, De = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = Yt !== null ? { id: it, overflow: ot } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = Oe(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Le = e, De = null, !0) : !1;
    default:
      return !1;
  }
}
function Hl(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Ql(e) {
  if (q) {
    var t = De;
    if (t) {
      var n = t;
      if (!Ui(e, t)) {
        if (Hl(e)) throw Error(S(418));
        t = bt(n.nextSibling);
        var r = Le;
        t && Ui(e, t) ? Uc(r, n) : (e.flags = e.flags & -4097 | 2, q = !1, Le = e);
      }
    } else {
      if (Hl(e)) throw Error(S(418));
      e.flags = e.flags & -4097 | 2, q = !1, Le = e;
    }
  }
}
function Vi(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Le = e;
}
function Rs(e) {
  if (e !== Le) return !1;
  if (!q) return Vi(e), q = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Bl(e.type, e.memoizedProps)), t && (t = De)) {
    if (Hl(e)) throw Vc(), Error(S(418));
    for (; t; ) Uc(e, t), t = bt(t.nextSibling);
  }
  if (Vi(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(S(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              De = bt(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      De = null;
    }
  } else De = Le ? bt(e.stateNode.nextSibling) : null;
  return !0;
}
function Vc() {
  for (var e = De; e; ) e = bt(e.nextSibling);
}
function Cn() {
  De = Le = null, q = !1;
}
function $a(e) {
  qe === null ? qe = [e] : qe.push(e);
}
var ff = ht.ReactCurrentBatchConfig;
function Bn(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(S(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(S(147, e));
      var l = r, a = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : (t = function(i) {
        var o = l.refs;
        i === null ? delete o[a] : o[a] = i;
      }, t._stringRef = a, t);
    }
    if (typeof e != "string") throw Error(S(284));
    if (!n._owner) throw Error(S(290, e));
  }
  return e;
}
function Os(e, t) {
  throw e = Object.prototype.toString.call(t), Error(S(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function Wi(e) {
  var t = e._init;
  return t(e._payload);
}
function Wc(e) {
  function t(p, d) {
    if (e) {
      var v = p.deletions;
      v === null ? (p.deletions = [d], p.flags |= 16) : v.push(d);
    }
  }
  function n(p, d) {
    if (!e) return null;
    for (; d !== null; ) t(p, d), d = d.sibling;
    return null;
  }
  function r(p, d) {
    for (p = /* @__PURE__ */ new Map(); d !== null; ) d.key !== null ? p.set(d.key, d) : p.set(d.index, d), d = d.sibling;
    return p;
  }
  function l(p, d) {
    return p = Dt(p, d), p.index = 0, p.sibling = null, p;
  }
  function a(p, d, v) {
    return p.index = v, e ? (v = p.alternate, v !== null ? (v = v.index, v < d ? (p.flags |= 2, d) : v) : (p.flags |= 2, d)) : (p.flags |= 1048576, d);
  }
  function i(p) {
    return e && p.alternate === null && (p.flags |= 2), p;
  }
  function o(p, d, v, x) {
    return d === null || d.tag !== 6 ? (d = hl(v, p.mode, x), d.return = p, d) : (d = l(d, v), d.return = p, d);
  }
  function c(p, d, v, x) {
    var k = v.type;
    return k === ln ? h(p, d, v.props.children, x, v.key) : d !== null && (d.elementType === k || typeof k == "object" && k !== null && k.$$typeof === vt && Wi(k) === d.type) ? (x = l(d, v.props), x.ref = Bn(p, d, v), x.return = p, x) : (x = tr(v.type, v.key, v.props, null, p.mode, x), x.ref = Bn(p, d, v), x.return = p, x);
  }
  function u(p, d, v, x) {
    return d === null || d.tag !== 4 || d.stateNode.containerInfo !== v.containerInfo || d.stateNode.implementation !== v.implementation ? (d = pl(v, p.mode, x), d.return = p, d) : (d = l(d, v.children || []), d.return = p, d);
  }
  function h(p, d, v, x, k) {
    return d === null || d.tag !== 7 ? (d = Qt(v, p.mode, x, k), d.return = p, d) : (d = l(d, v), d.return = p, d);
  }
  function m(p, d, v) {
    if (typeof d == "string" && d !== "" || typeof d == "number") return d = hl("" + d, p.mode, v), d.return = p, d;
    if (typeof d == "object" && d !== null) {
      switch (d.$$typeof) {
        case Es:
          return v = tr(d.type, d.key, d.props, null, p.mode, v), v.ref = Bn(p, null, d), v.return = p, v;
        case rn:
          return d = pl(d, p.mode, v), d.return = p, d;
        case vt:
          var x = d._init;
          return m(p, x(d._payload), v);
      }
      if (Qn(d) || An(d)) return d = Qt(d, p.mode, v, null), d.return = p, d;
      Os(p, d);
    }
    return null;
  }
  function f(p, d, v, x) {
    var k = d !== null ? d.key : null;
    if (typeof v == "string" && v !== "" || typeof v == "number") return k !== null ? null : o(p, d, "" + v, x);
    if (typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case Es:
          return v.key === k ? c(p, d, v, x) : null;
        case rn:
          return v.key === k ? u(p, d, v, x) : null;
        case vt:
          return k = v._init, f(
            p,
            d,
            k(v._payload),
            x
          );
      }
      if (Qn(v) || An(v)) return k !== null ? null : h(p, d, v, x, null);
      Os(p, v);
    }
    return null;
  }
  function g(p, d, v, x, k) {
    if (typeof x == "string" && x !== "" || typeof x == "number") return p = p.get(v) || null, o(d, p, "" + x, k);
    if (typeof x == "object" && x !== null) {
      switch (x.$$typeof) {
        case Es:
          return p = p.get(x.key === null ? v : x.key) || null, c(d, p, x, k);
        case rn:
          return p = p.get(x.key === null ? v : x.key) || null, u(d, p, x, k);
        case vt:
          var C = x._init;
          return g(p, d, v, C(x._payload), k);
      }
      if (Qn(x) || An(x)) return p = p.get(v) || null, h(d, p, x, k, null);
      Os(d, x);
    }
    return null;
  }
  function N(p, d, v, x) {
    for (var k = null, C = null, T = d, M = d = 0, O = null; T !== null && M < v.length; M++) {
      T.index > M ? (O = T, T = null) : O = T.sibling;
      var E = f(p, T, v[M], x);
      if (E === null) {
        T === null && (T = O);
        break;
      }
      e && T && E.alternate === null && t(p, T), d = a(E, d, M), C === null ? k = E : C.sibling = E, C = E, T = O;
    }
    if (M === v.length) return n(p, T), q && Ft(p, M), k;
    if (T === null) {
      for (; M < v.length; M++) T = m(p, v[M], x), T !== null && (d = a(T, d, M), C === null ? k = T : C.sibling = T, C = T);
      return q && Ft(p, M), k;
    }
    for (T = r(p, T); M < v.length; M++) O = g(T, p, M, v[M], x), O !== null && (e && O.alternate !== null && T.delete(O.key === null ? M : O.key), d = a(O, d, M), C === null ? k = O : C.sibling = O, C = O);
    return e && T.forEach(function(ee) {
      return t(p, ee);
    }), q && Ft(p, M), k;
  }
  function j(p, d, v, x) {
    var k = An(v);
    if (typeof k != "function") throw Error(S(150));
    if (v = k.call(v), v == null) throw Error(S(151));
    for (var C = k = null, T = d, M = d = 0, O = null, E = v.next(); T !== null && !E.done; M++, E = v.next()) {
      T.index > M ? (O = T, T = null) : O = T.sibling;
      var ee = f(p, T, E.value, x);
      if (ee === null) {
        T === null && (T = O);
        break;
      }
      e && T && ee.alternate === null && t(p, T), d = a(ee, d, M), C === null ? k = ee : C.sibling = ee, C = ee, T = O;
    }
    if (E.done) return n(
      p,
      T
    ), q && Ft(p, M), k;
    if (T === null) {
      for (; !E.done; M++, E = v.next()) E = m(p, E.value, x), E !== null && (d = a(E, d, M), C === null ? k = E : C.sibling = E, C = E);
      return q && Ft(p, M), k;
    }
    for (T = r(p, T); !E.done; M++, E = v.next()) E = g(T, p, M, E.value, x), E !== null && (e && E.alternate !== null && T.delete(E.key === null ? M : E.key), d = a(E, d, M), C === null ? k = E : C.sibling = E, C = E);
    return e && T.forEach(function(Pe) {
      return t(p, Pe);
    }), q && Ft(p, M), k;
  }
  function w(p, d, v, x) {
    if (typeof v == "object" && v !== null && v.type === ln && v.key === null && (v = v.props.children), typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case Es:
          e: {
            for (var k = v.key, C = d; C !== null; ) {
              if (C.key === k) {
                if (k = v.type, k === ln) {
                  if (C.tag === 7) {
                    n(p, C.sibling), d = l(C, v.props.children), d.return = p, p = d;
                    break e;
                  }
                } else if (C.elementType === k || typeof k == "object" && k !== null && k.$$typeof === vt && Wi(k) === C.type) {
                  n(p, C.sibling), d = l(C, v.props), d.ref = Bn(p, C, v), d.return = p, p = d;
                  break e;
                }
                n(p, C);
                break;
              } else t(p, C);
              C = C.sibling;
            }
            v.type === ln ? (d = Qt(v.props.children, p.mode, x, v.key), d.return = p, p = d) : (x = tr(v.type, v.key, v.props, null, p.mode, x), x.ref = Bn(p, d, v), x.return = p, p = x);
          }
          return i(p);
        case rn:
          e: {
            for (C = v.key; d !== null; ) {
              if (d.key === C) if (d.tag === 4 && d.stateNode.containerInfo === v.containerInfo && d.stateNode.implementation === v.implementation) {
                n(p, d.sibling), d = l(d, v.children || []), d.return = p, p = d;
                break e;
              } else {
                n(p, d);
                break;
              }
              else t(p, d);
              d = d.sibling;
            }
            d = pl(v, p.mode, x), d.return = p, p = d;
          }
          return i(p);
        case vt:
          return C = v._init, w(p, d, C(v._payload), x);
      }
      if (Qn(v)) return N(p, d, v, x);
      if (An(v)) return j(p, d, v, x);
      Os(p, v);
    }
    return typeof v == "string" && v !== "" || typeof v == "number" ? (v = "" + v, d !== null && d.tag === 6 ? (n(p, d.sibling), d = l(d, v), d.return = p, p = d) : (n(p, d), d = hl(v, p.mode, x), d.return = p, p = d), i(p)) : n(p, d);
  }
  return w;
}
var En = Wc(!0), Hc = Wc(!1), pr = $t(null), vr = null, hn = null, Ia = null;
function Pa() {
  Ia = hn = vr = null;
}
function Aa(e) {
  var t = pr.current;
  H(pr), e._currentValue = t;
}
function ql(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function wn(e, t) {
  vr = e, Ia = hn = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (ke = !0), e.firstContext = null);
}
function ze(e) {
  var t = e._currentValue;
  if (Ia !== e) if (e = { context: e, memoizedValue: t, next: null }, hn === null) {
    if (vr === null) throw Error(S(308));
    hn = e, vr.dependencies = { lanes: 0, firstContext: e };
  } else hn = hn.next = e;
  return t;
}
var Ut = null;
function Ra(e) {
  Ut === null ? Ut = [e] : Ut.push(e);
}
function Qc(e, t, n, r) {
  var l = t.interleaved;
  return l === null ? (n.next = n, Ra(t)) : (n.next = l.next, l.next = n), t.interleaved = n, mt(e, r);
}
function mt(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var gt = !1;
function Oa(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function qc(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function ct(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Ct(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (r = r.shared, F & 2) {
    var l = r.pending;
    return l === null ? t.next = t : (t.next = l.next, l.next = t), r.pending = t, mt(e, n);
  }
  return l = r.interleaved, l === null ? (t.next = t, Ra(r)) : (t.next = l.next, l.next = t), r.interleaved = t, mt(e, n);
}
function Ks(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, ka(e, n);
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
function gr(e, t, n, r) {
  var l = e.updateQueue;
  gt = !1;
  var a = l.firstBaseUpdate, i = l.lastBaseUpdate, o = l.shared.pending;
  if (o !== null) {
    l.shared.pending = null;
    var c = o, u = c.next;
    c.next = null, i === null ? a = u : i.next = u, i = c;
    var h = e.alternate;
    h !== null && (h = h.updateQueue, o = h.lastBaseUpdate, o !== i && (o === null ? h.firstBaseUpdate = u : o.next = u, h.lastBaseUpdate = c));
  }
  if (a !== null) {
    var m = l.baseState;
    i = 0, h = u = c = null, o = a;
    do {
      var f = o.lane, g = o.eventTime;
      if ((r & f) === f) {
        h !== null && (h = h.next = {
          eventTime: g,
          lane: 0,
          tag: o.tag,
          payload: o.payload,
          callback: o.callback,
          next: null
        });
        e: {
          var N = e, j = o;
          switch (f = t, g = n, j.tag) {
            case 1:
              if (N = j.payload, typeof N == "function") {
                m = N.call(g, m, f);
                break e;
              }
              m = N;
              break e;
            case 3:
              N.flags = N.flags & -65537 | 128;
            case 0:
              if (N = j.payload, f = typeof N == "function" ? N.call(g, m, f) : N, f == null) break e;
              m = G({}, m, f);
              break e;
            case 2:
              gt = !0;
          }
        }
        o.callback !== null && o.lane !== 0 && (e.flags |= 64, f = l.effects, f === null ? l.effects = [o] : f.push(o));
      } else g = { eventTime: g, lane: f, tag: o.tag, payload: o.payload, callback: o.callback, next: null }, h === null ? (u = h = g, c = m) : h = h.next = g, i |= f;
      if (o = o.next, o === null) {
        if (o = l.shared.pending, o === null) break;
        f = o, o = f.next, f.next = null, l.lastBaseUpdate = f, l.shared.pending = null;
      }
    } while (!0);
    if (h === null && (c = m), l.baseState = c, l.firstBaseUpdate = u, l.lastBaseUpdate = h, t = l.shared.interleaved, t !== null) {
      l = t;
      do
        i |= l.lane, l = l.next;
      while (l !== t);
    } else a === null && (l.shared.lanes = 0);
    Gt |= i, e.lanes = i, e.memoizedState = m;
  }
}
function Qi(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var r = e[t], l = r.callback;
    if (l !== null) {
      if (r.callback = null, r = n, typeof l != "function") throw Error(S(191, l));
      l.call(r);
    }
  }
}
var bs = {}, st = $t(bs), ps = $t(bs), vs = $t(bs);
function Vt(e) {
  if (e === bs) throw Error(S(174));
  return e;
}
function Fa(e, t) {
  switch (V(vs, t), V(ps, e), V(st, bs), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : El(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = El(t, e);
  }
  H(st), V(st, t);
}
function Tn() {
  H(st), H(ps), H(vs);
}
function Yc(e) {
  Vt(vs.current);
  var t = Vt(st.current), n = El(t, e.type);
  t !== n && (V(ps, e), V(st, n));
}
function za(e) {
  ps.current === e && (H(st), H(ps));
}
var Y = $t(0);
function yr(e) {
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
function Ba() {
  for (var e = 0; e < ol.length; e++) ol[e]._workInProgressVersionPrimary = null;
  ol.length = 0;
}
var Gs = ht.ReactCurrentDispatcher, cl = ht.ReactCurrentBatchConfig, Kt = 0, K = null, ne = null, re = null, xr = !1, es = !1, gs = 0, hf = 0;
function me() {
  throw Error(S(321));
}
function Ua(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!Ze(e[n], t[n])) return !1;
  return !0;
}
function Va(e, t, n, r, l, a) {
  if (Kt = a, K = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Gs.current = e === null || e.memoizedState === null ? yf : xf, e = n(r, l), es) {
    a = 0;
    do {
      if (es = !1, gs = 0, 25 <= a) throw Error(S(301));
      a += 1, re = ne = null, t.updateQueue = null, Gs.current = jf, e = n(r, l);
    } while (es);
  }
  if (Gs.current = jr, t = ne !== null && ne.next !== null, Kt = 0, re = ne = K = null, xr = !1, t) throw Error(S(300));
  return e;
}
function Wa() {
  var e = gs !== 0;
  return gs = 0, e;
}
function et() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return re === null ? K.memoizedState = re = e : re = re.next = e, re;
}
function Be() {
  if (ne === null) {
    var e = K.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = ne.next;
  var t = re === null ? K.memoizedState : re.next;
  if (t !== null) re = t, ne = e;
  else {
    if (e === null) throw Error(S(310));
    ne = e, e = { memoizedState: ne.memoizedState, baseState: ne.baseState, baseQueue: ne.baseQueue, queue: ne.queue, next: null }, re === null ? K.memoizedState = re = e : re = re.next = e;
  }
  return re;
}
function ys(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function ul(e) {
  var t = Be(), n = t.queue;
  if (n === null) throw Error(S(311));
  n.lastRenderedReducer = e;
  var r = ne, l = r.baseQueue, a = n.pending;
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
      if ((Kt & h) === h) c !== null && (c = c.next = { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }), r = u.hasEagerState ? u.eagerState : e(r, u.action);
      else {
        var m = {
          lane: h,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null
        };
        c === null ? (o = c = m, i = r) : c = c.next = m, K.lanes |= h, Gt |= h;
      }
      u = u.next;
    } while (u !== null && u !== a);
    c === null ? i = r : c.next = o, Ze(r, t.memoizedState) || (ke = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = c, n.lastRenderedState = r;
  }
  if (e = n.interleaved, e !== null) {
    l = e;
    do
      a = l.lane, K.lanes |= a, Gt |= a, l = l.next;
    while (l !== e);
  } else l === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function dl(e) {
  var t = Be(), n = t.queue;
  if (n === null) throw Error(S(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch, l = n.pending, a = t.memoizedState;
  if (l !== null) {
    n.pending = null;
    var i = l = l.next;
    do
      a = e(a, i.action), i = i.next;
    while (i !== l);
    Ze(a, t.memoizedState) || (ke = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
  }
  return [a, r];
}
function Kc() {
}
function Gc(e, t) {
  var n = K, r = Be(), l = t(), a = !Ze(r.memoizedState, l);
  if (a && (r.memoizedState = l, ke = !0), r = r.queue, Ha(Jc.bind(null, n, r, e), [e]), r.getSnapshot !== t || a || re !== null && re.memoizedState.tag & 1) {
    if (n.flags |= 2048, xs(9, Xc.bind(null, n, r, l, t), void 0, null), le === null) throw Error(S(349));
    Kt & 30 || Zc(n, t, l);
  }
  return l;
}
function Zc(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = K.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, K.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function Xc(e, t, n, r) {
  t.value = n, t.getSnapshot = r, eu(t) && tu(e);
}
function Jc(e, t, n) {
  return n(function() {
    eu(t) && tu(e);
  });
}
function eu(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Ze(e, n);
  } catch {
    return !0;
  }
}
function tu(e) {
  var t = mt(e, 1);
  t !== null && Ke(t, e, 1, -1);
}
function qi(e) {
  var t = et();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: ys, lastRenderedState: e }, t.queue = e, e = e.dispatch = gf.bind(null, K, e), [t.memoizedState, e];
}
function xs(e, t, n, r) {
  return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = K.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, K.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
}
function nu() {
  return Be().memoizedState;
}
function Zs(e, t, n, r) {
  var l = et();
  K.flags |= e, l.memoizedState = xs(1 | t, n, void 0, r === void 0 ? null : r);
}
function _r(e, t, n, r) {
  var l = Be();
  r = r === void 0 ? null : r;
  var a = void 0;
  if (ne !== null) {
    var i = ne.memoizedState;
    if (a = i.destroy, r !== null && Ua(r, i.deps)) {
      l.memoizedState = xs(t, n, a, r);
      return;
    }
  }
  K.flags |= e, l.memoizedState = xs(1 | t, n, a, r);
}
function Yi(e, t) {
  return Zs(8390656, 8, e, t);
}
function Ha(e, t) {
  return _r(2048, 8, e, t);
}
function su(e, t) {
  return _r(4, 2, e, t);
}
function ru(e, t) {
  return _r(4, 4, e, t);
}
function lu(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function au(e, t, n) {
  return n = n != null ? n.concat([e]) : null, _r(4, 4, lu.bind(null, t, e), n);
}
function Qa() {
}
function iu(e, t) {
  var n = Be();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Ua(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
}
function ou(e, t) {
  var n = Be();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Ua(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
}
function cu(e, t, n) {
  return Kt & 21 ? (Ze(n, t) || (n = hc(), K.lanes |= n, Gt |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, ke = !0), e.memoizedState = n);
}
function pf(e, t) {
  var n = B;
  B = n !== 0 && 4 > n ? n : 4, e(!0);
  var r = cl.transition;
  cl.transition = {};
  try {
    e(!1), t();
  } finally {
    B = n, cl.transition = r;
  }
}
function uu() {
  return Be().memoizedState;
}
function vf(e, t, n) {
  var r = Tt(e);
  if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, du(e)) mu(t, n);
  else if (n = Qc(e, t, n, r), n !== null) {
    var l = xe();
    Ke(n, e, r, l), fu(n, t, r);
  }
}
function gf(e, t, n) {
  var r = Tt(e), l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (du(e)) mu(t, l);
  else {
    var a = e.alternate;
    if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
      var i = t.lastRenderedState, o = a(i, n);
      if (l.hasEagerState = !0, l.eagerState = o, Ze(o, i)) {
        var c = t.interleaved;
        c === null ? (l.next = l, Ra(t)) : (l.next = c.next, c.next = l), t.interleaved = l;
        return;
      }
    } catch {
    } finally {
    }
    n = Qc(e, t, l, r), n !== null && (l = xe(), Ke(n, e, r, l), fu(n, t, r));
  }
}
function du(e) {
  var t = e.alternate;
  return e === K || t !== null && t === K;
}
function mu(e, t) {
  es = xr = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function fu(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, ka(e, n);
  }
}
var jr = { readContext: ze, useCallback: me, useContext: me, useEffect: me, useImperativeHandle: me, useInsertionEffect: me, useLayoutEffect: me, useMemo: me, useReducer: me, useRef: me, useState: me, useDebugValue: me, useDeferredValue: me, useTransition: me, useMutableSource: me, useSyncExternalStore: me, useId: me, unstable_isNewReconciler: !1 }, yf = { readContext: ze, useCallback: function(e, t) {
  return et().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: ze, useEffect: Yi, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Zs(
    4194308,
    4,
    lu.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return Zs(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return Zs(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = et();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var r = et();
  return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = vf.bind(null, K, e), [r.memoizedState, e];
}, useRef: function(e) {
  var t = et();
  return e = { current: e }, t.memoizedState = e;
}, useState: qi, useDebugValue: Qa, useDeferredValue: function(e) {
  return et().memoizedState = e;
}, useTransition: function() {
  var e = qi(!1), t = e[0];
  return e = pf.bind(null, e[1]), et().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var r = K, l = et();
  if (q) {
    if (n === void 0) throw Error(S(407));
    n = n();
  } else {
    if (n = t(), le === null) throw Error(S(349));
    Kt & 30 || Zc(r, t, n);
  }
  l.memoizedState = n;
  var a = { value: n, getSnapshot: t };
  return l.queue = a, Yi(Jc.bind(
    null,
    r,
    a,
    e
  ), [e]), r.flags |= 2048, xs(9, Xc.bind(null, r, a, n, t), void 0, null), n;
}, useId: function() {
  var e = et(), t = le.identifierPrefix;
  if (q) {
    var n = ot, r = it;
    n = (r & ~(1 << 32 - Ye(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = gs++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = hf++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, xf = {
  readContext: ze,
  useCallback: iu,
  useContext: ze,
  useEffect: Ha,
  useImperativeHandle: au,
  useInsertionEffect: su,
  useLayoutEffect: ru,
  useMemo: ou,
  useReducer: ul,
  useRef: nu,
  useState: function() {
    return ul(ys);
  },
  useDebugValue: Qa,
  useDeferredValue: function(e) {
    var t = Be();
    return cu(t, ne.memoizedState, e);
  },
  useTransition: function() {
    var e = ul(ys)[0], t = Be().memoizedState;
    return [e, t];
  },
  useMutableSource: Kc,
  useSyncExternalStore: Gc,
  useId: uu,
  unstable_isNewReconciler: !1
}, jf = { readContext: ze, useCallback: iu, useContext: ze, useEffect: Ha, useImperativeHandle: au, useInsertionEffect: su, useLayoutEffect: ru, useMemo: ou, useReducer: dl, useRef: nu, useState: function() {
  return dl(ys);
}, useDebugValue: Qa, useDeferredValue: function(e) {
  var t = Be();
  return ne === null ? t.memoizedState = e : cu(t, ne.memoizedState, e);
}, useTransition: function() {
  var e = dl(ys)[0], t = Be().memoizedState;
  return [e, t];
}, useMutableSource: Kc, useSyncExternalStore: Gc, useId: uu, unstable_isNewReconciler: !1 };
function He(e, t) {
  if (e && e.defaultProps) {
    t = G({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Yl(e, t, n, r) {
  t = e.memoizedState, n = n(r, t), n = n == null ? t : G({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var $r = { isMounted: function(e) {
  return (e = e._reactInternals) ? Jt(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var r = xe(), l = Tt(e), a = ct(r, l);
  a.payload = t, n != null && (a.callback = n), t = Ct(e, a, l), t !== null && (Ke(t, e, l, r), Ks(t, e, l));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var r = xe(), l = Tt(e), a = ct(r, l);
  a.tag = 1, a.payload = t, n != null && (a.callback = n), t = Ct(e, a, l), t !== null && (Ke(t, e, l, r), Ks(t, e, l));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = xe(), r = Tt(e), l = ct(n, r);
  l.tag = 2, t != null && (l.callback = t), t = Ct(e, l, r), t !== null && (Ke(t, e, r, n), Ks(t, e, r));
} };
function Ki(e, t, n, r, l, a, i) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, i) : t.prototype && t.prototype.isPureReactComponent ? !ds(n, r) || !ds(l, a) : !0;
}
function hu(e, t, n) {
  var r = !1, l = Mt, a = t.contextType;
  return typeof a == "object" && a !== null ? a = ze(a) : (l = be(t) ? qt : pe.current, r = t.contextTypes, a = (r = r != null) ? bn(e, l) : Mt), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = $r, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = a), t;
}
function Gi(e, t, n, r) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && $r.enqueueReplaceState(t, t.state, null);
}
function Kl(e, t, n, r) {
  var l = e.stateNode;
  l.props = n, l.state = e.memoizedState, l.refs = {}, Oa(e);
  var a = t.contextType;
  typeof a == "object" && a !== null ? l.context = ze(a) : (a = be(t) ? qt : pe.current, l.context = bn(e, a)), l.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (Yl(e, t, a, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && $r.enqueueReplaceState(l, l.state, null), gr(e, n, l, r), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
}
function Dn(e, t) {
  try {
    var n = "", r = t;
    do
      n += qd(r), r = r.return;
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
var Nf = typeof WeakMap == "function" ? WeakMap : Map;
function pu(e, t, n) {
  n = ct(-1, n), n.tag = 3, n.payload = { element: null };
  var r = t.value;
  return n.callback = function() {
    wr || (wr = !0, aa = r), Gl(e, t);
  }, n;
}
function vu(e, t, n) {
  n = ct(-1, n), n.tag = 3;
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
    Gl(e, t), typeof r != "function" && (Et === null ? Et = /* @__PURE__ */ new Set([this]) : Et.add(this));
    var i = t.stack;
    this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
  }), n;
}
function Zi(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new Nf();
    var l = /* @__PURE__ */ new Set();
    r.set(t, l);
  } else l = r.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), r.set(t, l));
  l.has(n) || (l.add(n), e = Pf.bind(null, e, t, n), t.then(e, e));
}
function Xi(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Ji(e, t, n, r, l) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = l, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = ct(-1, 1), t.tag = 2, Ct(n, t, 1))), n.lanes |= 1), e);
}
var wf = ht.ReactCurrentOwner, ke = !1;
function ye(e, t, n, r) {
  t.child = e === null ? Hc(t, null, n, r) : En(t, e.child, n, r);
}
function eo(e, t, n, r, l) {
  n = n.render;
  var a = t.ref;
  return wn(t, l), r = Va(e, t, n, r, a, l), n = Wa(), e !== null && !ke ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, ft(e, t, l)) : (q && n && Ma(t), t.flags |= 1, ye(e, t, r, l), t.child);
}
function to(e, t, n, r, l) {
  if (e === null) {
    var a = n.type;
    return typeof a == "function" && !ei(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, gu(e, t, a, r, l)) : (e = tr(n.type, null, r, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (a = e.child, !(e.lanes & l)) {
    var i = a.memoizedProps;
    if (n = n.compare, n = n !== null ? n : ds, n(i, r) && e.ref === t.ref) return ft(e, t, l);
  }
  return t.flags |= 1, e = Dt(a, r), e.ref = t.ref, e.return = t, t.child = e;
}
function gu(e, t, n, r, l) {
  if (e !== null) {
    var a = e.memoizedProps;
    if (ds(a, r) && e.ref === t.ref) if (ke = !1, t.pendingProps = r = a, (e.lanes & l) !== 0) e.flags & 131072 && (ke = !0);
    else return t.lanes = e.lanes, ft(e, t, l);
  }
  return Zl(e, t, n, r, l);
}
function yu(e, t, n) {
  var r = t.pendingProps, l = r.children, a = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, V(vn, Te), Te |= n;
  else {
    if (!(n & 1073741824)) return e = a !== null ? a.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, V(vn, Te), Te |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = a !== null ? a.baseLanes : n, V(vn, Te), Te |= r;
  }
  else a !== null ? (r = a.baseLanes | n, t.memoizedState = null) : r = n, V(vn, Te), Te |= r;
  return ye(e, t, l, n), t.child;
}
function xu(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Zl(e, t, n, r, l) {
  var a = be(n) ? qt : pe.current;
  return a = bn(t, a), wn(t, l), n = Va(e, t, n, r, a, l), r = Wa(), e !== null && !ke ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, ft(e, t, l)) : (q && r && Ma(t), t.flags |= 1, ye(e, t, n, l), t.child);
}
function no(e, t, n, r, l) {
  if (be(n)) {
    var a = !0;
    mr(t);
  } else a = !1;
  if (wn(t, l), t.stateNode === null) Xs(e, t), hu(t, n, r), Kl(t, n, r, l), r = !0;
  else if (e === null) {
    var i = t.stateNode, o = t.memoizedProps;
    i.props = o;
    var c = i.context, u = n.contextType;
    typeof u == "object" && u !== null ? u = ze(u) : (u = be(n) ? qt : pe.current, u = bn(t, u));
    var h = n.getDerivedStateFromProps, m = typeof h == "function" || typeof i.getSnapshotBeforeUpdate == "function";
    m || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== r || c !== u) && Gi(t, i, r, u), gt = !1;
    var f = t.memoizedState;
    i.state = f, gr(t, r, i, l), c = t.memoizedState, o !== r || f !== c || Se.current || gt ? (typeof h == "function" && (Yl(t, n, h, r), c = t.memoizedState), (o = gt || Ki(t, n, o, r, f, c, u)) ? (m || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), i.props = r, i.state = c, i.context = u, r = o) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
  } else {
    i = t.stateNode, qc(e, t), o = t.memoizedProps, u = t.type === t.elementType ? o : He(t.type, o), i.props = u, m = t.pendingProps, f = i.context, c = n.contextType, typeof c == "object" && c !== null ? c = ze(c) : (c = be(n) ? qt : pe.current, c = bn(t, c));
    var g = n.getDerivedStateFromProps;
    (h = typeof g == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== m || f !== c) && Gi(t, i, r, c), gt = !1, f = t.memoizedState, i.state = f, gr(t, r, i, l);
    var N = t.memoizedState;
    o !== m || f !== N || Se.current || gt ? (typeof g == "function" && (Yl(t, n, g, r), N = t.memoizedState), (u = gt || Ki(t, n, u, r, f, N, c) || !1) ? (h || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, N, c), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, N, c)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = N), i.props = r, i.state = N, i.context = c, r = u) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
  }
  return Xl(e, t, n, r, a, l);
}
function Xl(e, t, n, r, l, a) {
  xu(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i) return l && Bi(t, n, !1), ft(e, t, a);
  r = t.stateNode, wf.current = t;
  var o = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return t.flags |= 1, e !== null && i ? (t.child = En(t, e.child, null, a), t.child = En(t, null, o, a)) : ye(e, t, o, a), t.memoizedState = r.state, l && Bi(t, n, !0), t.child;
}
function ju(e) {
  var t = e.stateNode;
  t.pendingContext ? zi(e, t.pendingContext, t.pendingContext !== t.context) : t.context && zi(e, t.context, !1), Fa(e, t.containerInfo);
}
function so(e, t, n, r, l) {
  return Cn(), $a(l), t.flags |= 256, ye(e, t, n, r), t.child;
}
var Jl = { dehydrated: null, treeContext: null, retryLane: 0 };
function ea(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Nu(e, t, n) {
  var r = t.pendingProps, l = Y.current, a = !1, i = (t.flags & 128) !== 0, o;
  if ((o = i) || (o = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), o ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), V(Y, l & 1), e === null)
    return Ql(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (i = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, i = { mode: "hidden", children: i }, !(r & 1) && a !== null ? (a.childLanes = 0, a.pendingProps = i) : a = Ar(i, r, 0, null), e = Qt(e, r, n, null), a.return = t, e.return = t, a.sibling = e, t.child = a, t.child.memoizedState = ea(n), t.memoizedState = Jl, e) : qa(t, i));
  if (l = e.memoizedState, l !== null && (o = l.dehydrated, o !== null)) return kf(e, t, i, r, o, l, n);
  if (a) {
    a = r.fallback, i = t.mode, l = e.child, o = l.sibling;
    var c = { mode: "hidden", children: r.children };
    return !(i & 1) && t.child !== l ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = Dt(l, c), r.subtreeFlags = l.subtreeFlags & 14680064), o !== null ? a = Dt(o, a) : (a = Qt(a, i, n, null), a.flags |= 2), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, i = e.child.memoizedState, i = i === null ? ea(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, a.memoizedState = i, a.childLanes = e.childLanes & ~n, t.memoizedState = Jl, r;
  }
  return a = e.child, e = a.sibling, r = Dt(a, { mode: "visible", children: r.children }), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
}
function qa(e, t) {
  return t = Ar({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function Fs(e, t, n, r) {
  return r !== null && $a(r), En(t, e.child, null, n), e = qa(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function kf(e, t, n, r, l, a, i) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, r = ml(Error(S(422))), Fs(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (a = r.fallback, l = t.mode, r = Ar({ mode: "visible", children: r.children }, l, 0, null), a = Qt(a, l, i, null), a.flags |= 2, r.return = t, a.return = t, r.sibling = a, t.child = r, t.mode & 1 && En(t, e.child, null, i), t.child.memoizedState = ea(i), t.memoizedState = Jl, a);
  if (!(t.mode & 1)) return Fs(e, t, i, null);
  if (l.data === "$!") {
    if (r = l.nextSibling && l.nextSibling.dataset, r) var o = r.dgst;
    return r = o, a = Error(S(419)), r = ml(a, r, void 0), Fs(e, t, i, r);
  }
  if (o = (i & e.childLanes) !== 0, ke || o) {
    if (r = le, r !== null) {
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
      l = l & (r.suspendedLanes | i) ? 0 : l, l !== 0 && l !== a.retryLane && (a.retryLane = l, mt(e, l), Ke(r, e, l, -1));
    }
    return Ja(), r = ml(Error(S(421))), Fs(e, t, i, r);
  }
  return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Af.bind(null, e), l._reactRetry = t, null) : (e = a.treeContext, De = bt(l.nextSibling), Le = t, q = !0, qe = null, e !== null && (Ae[Re++] = it, Ae[Re++] = ot, Ae[Re++] = Yt, it = e.id, ot = e.overflow, Yt = t), t = qa(t, r.children), t.flags |= 4096, t);
}
function ro(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), ql(e.return, t, n);
}
function fl(e, t, n, r, l) {
  var a = e.memoizedState;
  a === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l } : (a.isBackwards = t, a.rendering = null, a.renderingStartTime = 0, a.last = r, a.tail = n, a.tailMode = l);
}
function wu(e, t, n) {
  var r = t.pendingProps, l = r.revealOrder, a = r.tail;
  if (ye(e, t, r.children, n), r = Y.current, r & 2) r = r & 1 | 2, t.flags |= 128;
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
  if (V(Y, r), !(t.mode & 1)) t.memoizedState = null;
  else switch (l) {
    case "forwards":
      for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && yr(e) === null && (l = n), n = n.sibling;
      n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), fl(t, !1, l, n, a);
      break;
    case "backwards":
      for (n = null, l = t.child, t.child = null; l !== null; ) {
        if (e = l.alternate, e !== null && yr(e) === null) {
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
function Xs(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function ft(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), Gt |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(S(153));
  if (t.child !== null) {
    for (e = t.child, n = Dt(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Dt(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function Sf(e, t, n) {
  switch (t.tag) {
    case 3:
      ju(t), Cn();
      break;
    case 5:
      Yc(t);
      break;
    case 1:
      be(t.type) && mr(t);
      break;
    case 4:
      Fa(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context, l = t.memoizedProps.value;
      V(pr, r._currentValue), r._currentValue = l;
      break;
    case 13:
      if (r = t.memoizedState, r !== null)
        return r.dehydrated !== null ? (V(Y, Y.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? Nu(e, t, n) : (V(Y, Y.current & 1), e = ft(e, t, n), e !== null ? e.sibling : null);
      V(Y, Y.current & 1);
      break;
    case 19:
      if (r = (n & t.childLanes) !== 0, e.flags & 128) {
        if (r) return wu(e, t, n);
        t.flags |= 128;
      }
      if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), V(Y, Y.current), r) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, yu(e, t, n);
  }
  return ft(e, t, n);
}
var ku, ta, Su, bu;
ku = function(e, t) {
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
Su = function(e, t, n, r) {
  var l = e.memoizedProps;
  if (l !== r) {
    e = t.stateNode, Vt(st.current);
    var a = null;
    switch (n) {
      case "input":
        l = kl(e, l), r = kl(e, r), a = [];
        break;
      case "select":
        l = G({}, l, { value: void 0 }), r = G({}, r, { value: void 0 }), a = [];
        break;
      case "textarea":
        l = Cl(e, l), r = Cl(e, r), a = [];
        break;
      default:
        typeof l.onClick != "function" && typeof r.onClick == "function" && (e.onclick = ur);
    }
    Tl(n, r);
    var i;
    n = null;
    for (u in l) if (!r.hasOwnProperty(u) && l.hasOwnProperty(u) && l[u] != null) if (u === "style") {
      var o = l[u];
      for (i in o) o.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
    } else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (rs.hasOwnProperty(u) ? a || (a = []) : (a = a || []).push(u, null));
    for (u in r) {
      var c = r[u];
      if (o = l != null ? l[u] : void 0, r.hasOwnProperty(u) && c !== o && (c != null || o != null)) if (u === "style") if (o) {
        for (i in o) !o.hasOwnProperty(i) || c && c.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
        for (i in c) c.hasOwnProperty(i) && o[i] !== c[i] && (n || (n = {}), n[i] = c[i]);
      } else n || (a || (a = []), a.push(
        u,
        n
      )), n = c;
      else u === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, o = o ? o.__html : void 0, c != null && o !== c && (a = a || []).push(u, c)) : u === "children" ? typeof c != "string" && typeof c != "number" || (a = a || []).push(u, "" + c) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (rs.hasOwnProperty(u) ? (c != null && u === "onScroll" && W("scroll", e), a || o === c || (a = [])) : (a = a || []).push(u, c));
    }
    n && (a = a || []).push("style", n);
    var u = a;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
bu = function(e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function Un(e, t) {
  if (!q) switch (e.tailMode) {
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
function fe(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
  if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags & 14680064, r |= l.flags & 14680064, l.return = e, l = l.sibling;
  else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags, r |= l.flags, l.return = e, l = l.sibling;
  return e.subtreeFlags |= r, e.childLanes = n, t;
}
function bf(e, t, n) {
  var r = t.pendingProps;
  switch (_a(t), t.tag) {
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
      return fe(t), null;
    case 1:
      return be(t.type) && dr(), fe(t), null;
    case 3:
      return r = t.stateNode, Tn(), H(Se), H(pe), Ba(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (Rs(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, qe !== null && (ca(qe), qe = null))), ta(e, t), fe(t), null;
    case 5:
      za(t);
      var l = Vt(vs.current);
      if (n = t.type, e !== null && t.stateNode != null) Su(e, t, n, r, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(S(166));
          return fe(t), null;
        }
        if (e = Vt(st.current), Rs(t)) {
          r = t.stateNode, n = t.type;
          var a = t.memoizedProps;
          switch (r[tt] = t, r[hs] = a, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              W("cancel", r), W("close", r);
              break;
            case "iframe":
            case "object":
            case "embed":
              W("load", r);
              break;
            case "video":
            case "audio":
              for (l = 0; l < Yn.length; l++) W(Yn[l], r);
              break;
            case "source":
              W("error", r);
              break;
            case "img":
            case "image":
            case "link":
              W(
                "error",
                r
              ), W("load", r);
              break;
            case "details":
              W("toggle", r);
              break;
            case "input":
              fi(r, a), W("invalid", r);
              break;
            case "select":
              r._wrapperState = { wasMultiple: !!a.multiple }, W("invalid", r);
              break;
            case "textarea":
              pi(r, a), W("invalid", r);
          }
          Tl(n, a), l = null;
          for (var i in a) if (a.hasOwnProperty(i)) {
            var o = a[i];
            i === "children" ? typeof o == "string" ? r.textContent !== o && (a.suppressHydrationWarning !== !0 && As(r.textContent, o, e), l = ["children", o]) : typeof o == "number" && r.textContent !== "" + o && (a.suppressHydrationWarning !== !0 && As(
              r.textContent,
              o,
              e
            ), l = ["children", "" + o]) : rs.hasOwnProperty(i) && o != null && i === "onScroll" && W("scroll", r);
          }
          switch (n) {
            case "input":
              Ts(r), hi(r, a, !0);
              break;
            case "textarea":
              Ts(r), vi(r);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof a.onClick == "function" && (r.onclick = ur);
          }
          r = l, t.updateQueue = r, r !== null && (t.flags |= 4);
        } else {
          i = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Jo(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[tt] = t, e[hs] = r, ku(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (i = Dl(n, r), n) {
              case "dialog":
                W("cancel", e), W("close", e), l = r;
                break;
              case "iframe":
              case "object":
              case "embed":
                W("load", e), l = r;
                break;
              case "video":
              case "audio":
                for (l = 0; l < Yn.length; l++) W(Yn[l], e);
                l = r;
                break;
              case "source":
                W("error", e), l = r;
                break;
              case "img":
              case "image":
              case "link":
                W(
                  "error",
                  e
                ), W("load", e), l = r;
                break;
              case "details":
                W("toggle", e), l = r;
                break;
              case "input":
                fi(e, r), l = kl(e, r), W("invalid", e);
                break;
              case "option":
                l = r;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!r.multiple }, l = G({}, r, { value: void 0 }), W("invalid", e);
                break;
              case "textarea":
                pi(e, r), l = Cl(e, r), W("invalid", e);
                break;
              default:
                l = r;
            }
            Tl(n, l), o = l;
            for (a in o) if (o.hasOwnProperty(a)) {
              var c = o[a];
              a === "style" ? nc(e, c) : a === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, c != null && ec(e, c)) : a === "children" ? typeof c == "string" ? (n !== "textarea" || c !== "") && ls(e, c) : typeof c == "number" && ls(e, "" + c) : a !== "suppressContentEditableWarning" && a !== "suppressHydrationWarning" && a !== "autoFocus" && (rs.hasOwnProperty(a) ? c != null && a === "onScroll" && W("scroll", e) : c != null && ga(e, a, c, i));
            }
            switch (n) {
              case "input":
                Ts(e), hi(e, r, !1);
                break;
              case "textarea":
                Ts(e), vi(e);
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + Lt(r.value));
                break;
              case "select":
                e.multiple = !!r.multiple, a = r.value, a != null ? yn(e, !!r.multiple, a, !1) : r.defaultValue != null && yn(
                  e,
                  !!r.multiple,
                  r.defaultValue,
                  !0
                );
                break;
              default:
                typeof l.onClick == "function" && (e.onclick = ur);
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
      return fe(t), null;
    case 6:
      if (e && t.stateNode != null) bu(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null) throw Error(S(166));
        if (n = Vt(vs.current), Vt(st.current), Rs(t)) {
          if (r = t.stateNode, n = t.memoizedProps, r[tt] = t, (a = r.nodeValue !== n) && (e = Le, e !== null)) switch (e.tag) {
            case 3:
              As(r.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && As(r.nodeValue, n, (e.mode & 1) !== 0);
          }
          a && (t.flags |= 4);
        } else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[tt] = t, t.stateNode = r;
      }
      return fe(t), null;
    case 13:
      if (H(Y), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (q && De !== null && t.mode & 1 && !(t.flags & 128)) Vc(), Cn(), t.flags |= 98560, a = !1;
        else if (a = Rs(t), r !== null && r.dehydrated !== null) {
          if (e === null) {
            if (!a) throw Error(S(318));
            if (a = t.memoizedState, a = a !== null ? a.dehydrated : null, !a) throw Error(S(317));
            a[tt] = t;
          } else Cn(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          fe(t), a = !1;
        } else qe !== null && (ca(qe), qe = null), a = !0;
        if (!a) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, t.mode & 1 && (e === null || Y.current & 1 ? se === 0 && (se = 3) : Ja())), t.updateQueue !== null && (t.flags |= 4), fe(t), null);
    case 4:
      return Tn(), ta(e, t), e === null && ms(t.stateNode.containerInfo), fe(t), null;
    case 10:
      return Aa(t.type._context), fe(t), null;
    case 17:
      return be(t.type) && dr(), fe(t), null;
    case 19:
      if (H(Y), a = t.memoizedState, a === null) return fe(t), null;
      if (r = (t.flags & 128) !== 0, i = a.rendering, i === null) if (r) Un(a, !1);
      else {
        if (se !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (i = yr(e), i !== null) {
            for (t.flags |= 128, Un(a, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) a = n, e = r, a.flags &= 14680066, i = a.alternate, i === null ? (a.childLanes = 0, a.lanes = e, a.child = null, a.subtreeFlags = 0, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null, a.stateNode = null) : (a.childLanes = i.childLanes, a.lanes = i.lanes, a.child = i.child, a.subtreeFlags = 0, a.deletions = null, a.memoizedProps = i.memoizedProps, a.memoizedState = i.memoizedState, a.updateQueue = i.updateQueue, a.type = i.type, e = i.dependencies, a.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return V(Y, Y.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        a.tail !== null && J() > Ln && (t.flags |= 128, r = !0, Un(a, !1), t.lanes = 4194304);
      }
      else {
        if (!r) if (e = yr(i), e !== null) {
          if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), Un(a, !0), a.tail === null && a.tailMode === "hidden" && !i.alternate && !q) return fe(t), null;
        } else 2 * J() - a.renderingStartTime > Ln && n !== 1073741824 && (t.flags |= 128, r = !0, Un(a, !1), t.lanes = 4194304);
        a.isBackwards ? (i.sibling = t.child, t.child = i) : (n = a.last, n !== null ? n.sibling = i : t.child = i, a.last = i);
      }
      return a.tail !== null ? (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = J(), t.sibling = null, n = Y.current, V(Y, r ? n & 1 | 2 : n & 1), t) : (fe(t), null);
    case 22:
    case 23:
      return Xa(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && t.mode & 1 ? Te & 1073741824 && (fe(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : fe(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(S(156, t.tag));
}
function Cf(e, t) {
  switch (_a(t), t.tag) {
    case 1:
      return be(t.type) && dr(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return Tn(), H(Se), H(pe), Ba(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return za(t), null;
    case 13:
      if (H(Y), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(S(340));
        Cn();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return H(Y), null;
    case 4:
      return Tn(), null;
    case 10:
      return Aa(t.type._context), null;
    case 22:
    case 23:
      return Xa(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var zs = !1, he = !1, Ef = typeof WeakSet == "function" ? WeakSet : Set, L = null;
function pn(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (r) {
    X(e, t, r);
  }
  else n.current = null;
}
function na(e, t, n) {
  try {
    n();
  } catch (r) {
    X(e, t, r);
  }
}
var lo = !1;
function Tf(e, t) {
  if (Fl = ir, e = Lc(), La(e)) {
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
        var i = 0, o = -1, c = -1, u = 0, h = 0, m = e, f = null;
        t: for (; ; ) {
          for (var g; m !== n || l !== 0 && m.nodeType !== 3 || (o = i + l), m !== a || r !== 0 && m.nodeType !== 3 || (c = i + r), m.nodeType === 3 && (i += m.nodeValue.length), (g = m.firstChild) !== null; )
            f = m, m = g;
          for (; ; ) {
            if (m === e) break t;
            if (f === n && ++u === l && (o = i), f === a && ++h === r && (c = i), (g = m.nextSibling) !== null) break;
            m = f, f = m.parentNode;
          }
          m = g;
        }
        n = o === -1 || c === -1 ? null : { start: o, end: c };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (zl = { focusedElem: e, selectionRange: n }, ir = !1, L = t; L !== null; ) if (t = L, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, L = e;
  else for (; L !== null; ) {
    t = L;
    try {
      var N = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (N !== null) {
            var j = N.memoizedProps, w = N.memoizedState, p = t.stateNode, d = p.getSnapshotBeforeUpdate(t.elementType === t.type ? j : He(t.type, j), w);
            p.__reactInternalSnapshotBeforeUpdate = d;
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
          throw Error(S(163));
      }
    } catch (x) {
      X(t, t.return, x);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, L = e;
      break;
    }
    L = t.return;
  }
  return N = lo, lo = !1, N;
}
function ts(e, t, n) {
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
function Ir(e, t) {
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
function sa(e) {
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
function Cu(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, Cu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[tt], delete t[hs], delete t[Vl], delete t[uf], delete t[df])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function Eu(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function ao(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || Eu(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function ra(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = ur));
  else if (r !== 4 && (e = e.child, e !== null)) for (ra(e, t, n), e = e.sibling; e !== null; ) ra(e, t, n), e = e.sibling;
}
function la(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && (e = e.child, e !== null)) for (la(e, t, n), e = e.sibling; e !== null; ) la(e, t, n), e = e.sibling;
}
var oe = null, Qe = !1;
function pt(e, t, n) {
  for (n = n.child; n !== null; ) Tu(e, t, n), n = n.sibling;
}
function Tu(e, t, n) {
  if (nt && typeof nt.onCommitFiberUnmount == "function") try {
    nt.onCommitFiberUnmount(Cr, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      he || pn(n, t);
    case 6:
      var r = oe, l = Qe;
      oe = null, pt(e, t, n), oe = r, Qe = l, oe !== null && (Qe ? (e = oe, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : oe.removeChild(n.stateNode));
      break;
    case 18:
      oe !== null && (Qe ? (e = oe, n = n.stateNode, e.nodeType === 8 ? al(e.parentNode, n) : e.nodeType === 1 && al(e, n), cs(e)) : al(oe, n.stateNode));
      break;
    case 4:
      r = oe, l = Qe, oe = n.stateNode.containerInfo, Qe = !0, pt(e, t, n), oe = r, Qe = l;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!he && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
        l = r = r.next;
        do {
          var a = l, i = a.destroy;
          a = a.tag, i !== void 0 && (a & 2 || a & 4) && na(n, t, i), l = l.next;
        } while (l !== r);
      }
      pt(e, t, n);
      break;
    case 1:
      if (!he && (pn(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
        r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
      } catch (o) {
        X(n, t, o);
      }
      pt(e, t, n);
      break;
    case 21:
      pt(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (he = (r = he) || n.memoizedState !== null, pt(e, t, n), he = r) : pt(e, t, n);
      break;
    default:
      pt(e, t, n);
  }
}
function io(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new Ef()), t.forEach(function(r) {
      var l = Rf.bind(null, e, r);
      n.has(r) || (n.add(r), r.then(l, l));
    });
  }
}
function We(e, t) {
  var n = t.deletions;
  if (n !== null) for (var r = 0; r < n.length; r++) {
    var l = n[r];
    try {
      var a = e, i = t, o = i;
      e: for (; o !== null; ) {
        switch (o.tag) {
          case 5:
            oe = o.stateNode, Qe = !1;
            break e;
          case 3:
            oe = o.stateNode.containerInfo, Qe = !0;
            break e;
          case 4:
            oe = o.stateNode.containerInfo, Qe = !0;
            break e;
        }
        o = o.return;
      }
      if (oe === null) throw Error(S(160));
      Tu(a, i, l), oe = null, Qe = !1;
      var c = l.alternate;
      c !== null && (c.return = null), l.return = null;
    } catch (u) {
      X(l, t, u);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) Du(t, e), t = t.sibling;
}
function Du(e, t) {
  var n = e.alternate, r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (We(t, e), Xe(e), r & 4) {
        try {
          ts(3, e, e.return), Ir(3, e);
        } catch (j) {
          X(e, e.return, j);
        }
        try {
          ts(5, e, e.return);
        } catch (j) {
          X(e, e.return, j);
        }
      }
      break;
    case 1:
      We(t, e), Xe(e), r & 512 && n !== null && pn(n, n.return);
      break;
    case 5:
      if (We(t, e), Xe(e), r & 512 && n !== null && pn(n, n.return), e.flags & 32) {
        var l = e.stateNode;
        try {
          ls(l, "");
        } catch (j) {
          X(e, e.return, j);
        }
      }
      if (r & 4 && (l = e.stateNode, l != null)) {
        var a = e.memoizedProps, i = n !== null ? n.memoizedProps : a, o = e.type, c = e.updateQueue;
        if (e.updateQueue = null, c !== null) try {
          o === "input" && a.type === "radio" && a.name != null && Zo(l, a), Dl(o, i);
          var u = Dl(o, a);
          for (i = 0; i < c.length; i += 2) {
            var h = c[i], m = c[i + 1];
            h === "style" ? nc(l, m) : h === "dangerouslySetInnerHTML" ? ec(l, m) : h === "children" ? ls(l, m) : ga(l, h, m, u);
          }
          switch (o) {
            case "input":
              Sl(l, a);
              break;
            case "textarea":
              Xo(l, a);
              break;
            case "select":
              var f = l._wrapperState.wasMultiple;
              l._wrapperState.wasMultiple = !!a.multiple;
              var g = a.value;
              g != null ? yn(l, !!a.multiple, g, !1) : f !== !!a.multiple && (a.defaultValue != null ? yn(
                l,
                !!a.multiple,
                a.defaultValue,
                !0
              ) : yn(l, !!a.multiple, a.multiple ? [] : "", !1));
          }
          l[hs] = a;
        } catch (j) {
          X(e, e.return, j);
        }
      }
      break;
    case 6:
      if (We(t, e), Xe(e), r & 4) {
        if (e.stateNode === null) throw Error(S(162));
        l = e.stateNode, a = e.memoizedProps;
        try {
          l.nodeValue = a;
        } catch (j) {
          X(e, e.return, j);
        }
      }
      break;
    case 3:
      if (We(t, e), Xe(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
        cs(t.containerInfo);
      } catch (j) {
        X(e, e.return, j);
      }
      break;
    case 4:
      We(t, e), Xe(e);
      break;
    case 13:
      We(t, e), Xe(e), l = e.child, l.flags & 8192 && (a = l.memoizedState !== null, l.stateNode.isHidden = a, !a || l.alternate !== null && l.alternate.memoizedState !== null || (Ga = J())), r & 4 && io(e);
      break;
    case 22:
      if (h = n !== null && n.memoizedState !== null, e.mode & 1 ? (he = (u = he) || h, We(t, e), he = u) : We(t, e), Xe(e), r & 8192) {
        if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !h && e.mode & 1) for (L = e, h = e.child; h !== null; ) {
          for (m = L = h; L !== null; ) {
            switch (f = L, g = f.child, f.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                ts(4, f, f.return);
                break;
              case 1:
                pn(f, f.return);
                var N = f.stateNode;
                if (typeof N.componentWillUnmount == "function") {
                  r = f, n = f.return;
                  try {
                    t = r, N.props = t.memoizedProps, N.state = t.memoizedState, N.componentWillUnmount();
                  } catch (j) {
                    X(r, n, j);
                  }
                }
                break;
              case 5:
                pn(f, f.return);
                break;
              case 22:
                if (f.memoizedState !== null) {
                  co(m);
                  continue;
                }
            }
            g !== null ? (g.return = f, L = g) : co(m);
          }
          h = h.sibling;
        }
        e: for (h = null, m = e; ; ) {
          if (m.tag === 5) {
            if (h === null) {
              h = m;
              try {
                l = m.stateNode, u ? (a = l.style, typeof a.setProperty == "function" ? a.setProperty("display", "none", "important") : a.display = "none") : (o = m.stateNode, c = m.memoizedProps.style, i = c != null && c.hasOwnProperty("display") ? c.display : null, o.style.display = tc("display", i));
              } catch (j) {
                X(e, e.return, j);
              }
            }
          } else if (m.tag === 6) {
            if (h === null) try {
              m.stateNode.nodeValue = u ? "" : m.memoizedProps;
            } catch (j) {
              X(e, e.return, j);
            }
          } else if ((m.tag !== 22 && m.tag !== 23 || m.memoizedState === null || m === e) && m.child !== null) {
            m.child.return = m, m = m.child;
            continue;
          }
          if (m === e) break e;
          for (; m.sibling === null; ) {
            if (m.return === null || m.return === e) break e;
            h === m && (h = null), m = m.return;
          }
          h === m && (h = null), m.sibling.return = m.return, m = m.sibling;
        }
      }
      break;
    case 19:
      We(t, e), Xe(e), r & 4 && io(e);
      break;
    case 21:
      break;
    default:
      We(
        t,
        e
      ), Xe(e);
  }
}
function Xe(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (Eu(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(S(160));
      }
      switch (r.tag) {
        case 5:
          var l = r.stateNode;
          r.flags & 32 && (ls(l, ""), r.flags &= -33);
          var a = ao(e);
          la(e, a, l);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo, o = ao(e);
          ra(e, o, i);
          break;
        default:
          throw Error(S(161));
      }
    } catch (c) {
      X(e, e.return, c);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function Df(e, t, n) {
  L = e, Lu(e);
}
function Lu(e, t, n) {
  for (var r = (e.mode & 1) !== 0; L !== null; ) {
    var l = L, a = l.child;
    if (l.tag === 22 && r) {
      var i = l.memoizedState !== null || zs;
      if (!i) {
        var o = l.alternate, c = o !== null && o.memoizedState !== null || he;
        o = zs;
        var u = he;
        if (zs = i, (he = c) && !u) for (L = l; L !== null; ) i = L, c = i.child, i.tag === 22 && i.memoizedState !== null ? uo(l) : c !== null ? (c.return = i, L = c) : uo(l);
        for (; a !== null; ) L = a, Lu(a), a = a.sibling;
        L = l, zs = o, he = u;
      }
      oo(e);
    } else l.subtreeFlags & 8772 && a !== null ? (a.return = l, L = a) : oo(e);
  }
}
function oo(e) {
  for (; L !== null; ) {
    var t = L;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            he || Ir(5, t);
            break;
          case 1:
            var r = t.stateNode;
            if (t.flags & 4 && !he) if (n === null) r.componentDidMount();
            else {
              var l = t.elementType === t.type ? n.memoizedProps : He(t.type, n.memoizedProps);
              r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
            }
            var a = t.updateQueue;
            a !== null && Qi(t, a, r);
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
              Qi(t, i, n);
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
                  var m = h.dehydrated;
                  m !== null && cs(m);
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
            throw Error(S(163));
        }
        he || t.flags & 512 && sa(t);
      } catch (f) {
        X(t, t.return, f);
      }
    }
    if (t === e) {
      L = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, L = n;
      break;
    }
    L = t.return;
  }
}
function co(e) {
  for (; L !== null; ) {
    var t = L;
    if (t === e) {
      L = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, L = n;
      break;
    }
    L = t.return;
  }
}
function uo(e) {
  for (; L !== null; ) {
    var t = L;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Ir(4, t);
          } catch (c) {
            X(t, n, c);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var l = t.return;
            try {
              r.componentDidMount();
            } catch (c) {
              X(t, l, c);
            }
          }
          var a = t.return;
          try {
            sa(t);
          } catch (c) {
            X(t, a, c);
          }
          break;
        case 5:
          var i = t.return;
          try {
            sa(t);
          } catch (c) {
            X(t, i, c);
          }
      }
    } catch (c) {
      X(t, t.return, c);
    }
    if (t === e) {
      L = null;
      break;
    }
    var o = t.sibling;
    if (o !== null) {
      o.return = t.return, L = o;
      break;
    }
    L = t.return;
  }
}
var Lf = Math.ceil, Nr = ht.ReactCurrentDispatcher, Ya = ht.ReactCurrentOwner, Fe = ht.ReactCurrentBatchConfig, F = 0, le = null, te = null, ce = 0, Te = 0, vn = $t(0), se = 0, js = null, Gt = 0, Pr = 0, Ka = 0, ns = null, we = null, Ga = 0, Ln = 1 / 0, lt = null, wr = !1, aa = null, Et = null, Bs = !1, Nt = null, kr = 0, ss = 0, ia = null, Js = -1, er = 0;
function xe() {
  return F & 6 ? J() : Js !== -1 ? Js : Js = J();
}
function Tt(e) {
  return e.mode & 1 ? F & 2 && ce !== 0 ? ce & -ce : ff.transition !== null ? (er === 0 && (er = hc()), er) : (e = B, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Nc(e.type)), e) : 1;
}
function Ke(e, t, n, r) {
  if (50 < ss) throw ss = 0, ia = null, Error(S(185));
  ws(e, n, r), (!(F & 2) || e !== le) && (e === le && (!(F & 2) && (Pr |= n), se === 4 && xt(e, ce)), Ce(e, r), n === 1 && F === 0 && !(t.mode & 1) && (Ln = J() + 500, Mr && It()));
}
function Ce(e, t) {
  var n = e.callbackNode;
  mm(e, t);
  var r = ar(e, e === le ? ce : 0);
  if (r === 0) n !== null && xi(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = r & -r, e.callbackPriority !== t) {
    if (n != null && xi(n), t === 1) e.tag === 0 ? mf(mo.bind(null, e)) : zc(mo.bind(null, e)), of(function() {
      !(F & 6) && It();
    }), n = null;
    else {
      switch (pc(r)) {
        case 1:
          n = wa;
          break;
        case 4:
          n = mc;
          break;
        case 16:
          n = lr;
          break;
        case 536870912:
          n = fc;
          break;
        default:
          n = lr;
      }
      n = Ou(n, Mu.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function Mu(e, t) {
  if (Js = -1, er = 0, F & 6) throw Error(S(327));
  var n = e.callbackNode;
  if (kn() && e.callbackNode !== n) return null;
  var r = ar(e, e === le ? ce : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = Sr(e, r);
  else {
    t = r;
    var l = F;
    F |= 2;
    var a = $u();
    (le !== e || ce !== t) && (lt = null, Ln = J() + 500, Ht(e, t));
    do
      try {
        $f();
        break;
      } catch (o) {
        _u(e, o);
      }
    while (!0);
    Pa(), Nr.current = a, F = l, te !== null ? t = 0 : (le = null, ce = 0, t = se);
  }
  if (t !== 0) {
    if (t === 2 && (l = Il(e), l !== 0 && (r = l, t = oa(e, l))), t === 1) throw n = js, Ht(e, 0), xt(e, r), Ce(e, J()), n;
    if (t === 6) xt(e, r);
    else {
      if (l = e.current.alternate, !(r & 30) && !Mf(l) && (t = Sr(e, r), t === 2 && (a = Il(e), a !== 0 && (r = a, t = oa(e, a))), t === 1)) throw n = js, Ht(e, 0), xt(e, r), Ce(e, J()), n;
      switch (e.finishedWork = l, e.finishedLanes = r, t) {
        case 0:
        case 1:
          throw Error(S(345));
        case 2:
          zt(e, we, lt);
          break;
        case 3:
          if (xt(e, r), (r & 130023424) === r && (t = Ga + 500 - J(), 10 < t)) {
            if (ar(e, 0) !== 0) break;
            if (l = e.suspendedLanes, (l & r) !== r) {
              xe(), e.pingedLanes |= e.suspendedLanes & l;
              break;
            }
            e.timeoutHandle = Ul(zt.bind(null, e, we, lt), t);
            break;
          }
          zt(e, we, lt);
          break;
        case 4:
          if (xt(e, r), (r & 4194240) === r) break;
          for (t = e.eventTimes, l = -1; 0 < r; ) {
            var i = 31 - Ye(r);
            a = 1 << i, i = t[i], i > l && (l = i), r &= ~a;
          }
          if (r = l, r = J() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Lf(r / 1960)) - r, 10 < r) {
            e.timeoutHandle = Ul(zt.bind(null, e, we, lt), r);
            break;
          }
          zt(e, we, lt);
          break;
        case 5:
          zt(e, we, lt);
          break;
        default:
          throw Error(S(329));
      }
    }
  }
  return Ce(e, J()), e.callbackNode === n ? Mu.bind(null, e) : null;
}
function oa(e, t) {
  var n = ns;
  return e.current.memoizedState.isDehydrated && (Ht(e, t).flags |= 256), e = Sr(e, t), e !== 2 && (t = we, we = n, t !== null && ca(t)), e;
}
function ca(e) {
  we === null ? we = e : we.push.apply(we, e);
}
function Mf(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
        var l = n[r], a = l.getSnapshot;
        l = l.value;
        try {
          if (!Ze(a(), l)) return !1;
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
function xt(e, t) {
  for (t &= ~Ka, t &= ~Pr, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Ye(t), r = 1 << n;
    e[n] = -1, t &= ~r;
  }
}
function mo(e) {
  if (F & 6) throw Error(S(327));
  kn();
  var t = ar(e, 0);
  if (!(t & 1)) return Ce(e, J()), null;
  var n = Sr(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = Il(e);
    r !== 0 && (t = r, n = oa(e, r));
  }
  if (n === 1) throw n = js, Ht(e, 0), xt(e, t), Ce(e, J()), n;
  if (n === 6) throw Error(S(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, zt(e, we, lt), Ce(e, J()), null;
}
function Za(e, t) {
  var n = F;
  F |= 1;
  try {
    return e(t);
  } finally {
    F = n, F === 0 && (Ln = J() + 500, Mr && It());
  }
}
function Zt(e) {
  Nt !== null && Nt.tag === 0 && !(F & 6) && kn();
  var t = F;
  F |= 1;
  var n = Fe.transition, r = B;
  try {
    if (Fe.transition = null, B = 1, e) return e();
  } finally {
    B = r, Fe.transition = n, F = t, !(F & 6) && It();
  }
}
function Xa() {
  Te = vn.current, H(vn);
}
function Ht(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, af(n)), te !== null) for (n = te.return; n !== null; ) {
    var r = n;
    switch (_a(r), r.tag) {
      case 1:
        r = r.type.childContextTypes, r != null && dr();
        break;
      case 3:
        Tn(), H(Se), H(pe), Ba();
        break;
      case 5:
        za(r);
        break;
      case 4:
        Tn();
        break;
      case 13:
        H(Y);
        break;
      case 19:
        H(Y);
        break;
      case 10:
        Aa(r.type._context);
        break;
      case 22:
      case 23:
        Xa();
    }
    n = n.return;
  }
  if (le = e, te = e = Dt(e.current, null), ce = Te = t, se = 0, js = null, Ka = Pr = Gt = 0, we = ns = null, Ut !== null) {
    for (t = 0; t < Ut.length; t++) if (n = Ut[t], r = n.interleaved, r !== null) {
      n.interleaved = null;
      var l = r.next, a = n.pending;
      if (a !== null) {
        var i = a.next;
        a.next = l, r.next = i;
      }
      n.pending = r;
    }
    Ut = null;
  }
  return e;
}
function _u(e, t) {
  do {
    var n = te;
    try {
      if (Pa(), Gs.current = jr, xr) {
        for (var r = K.memoizedState; r !== null; ) {
          var l = r.queue;
          l !== null && (l.pending = null), r = r.next;
        }
        xr = !1;
      }
      if (Kt = 0, re = ne = K = null, es = !1, gs = 0, Ya.current = null, n === null || n.return === null) {
        se = 1, js = t, te = null;
        break;
      }
      e: {
        var a = e, i = n.return, o = n, c = t;
        if (t = ce, o.flags |= 32768, c !== null && typeof c == "object" && typeof c.then == "function") {
          var u = c, h = o, m = h.tag;
          if (!(h.mode & 1) && (m === 0 || m === 11 || m === 15)) {
            var f = h.alternate;
            f ? (h.updateQueue = f.updateQueue, h.memoizedState = f.memoizedState, h.lanes = f.lanes) : (h.updateQueue = null, h.memoizedState = null);
          }
          var g = Xi(i);
          if (g !== null) {
            g.flags &= -257, Ji(g, i, o, a, t), g.mode & 1 && Zi(a, u, t), t = g, c = u;
            var N = t.updateQueue;
            if (N === null) {
              var j = /* @__PURE__ */ new Set();
              j.add(c), t.updateQueue = j;
            } else N.add(c);
            break e;
          } else {
            if (!(t & 1)) {
              Zi(a, u, t), Ja();
              break e;
            }
            c = Error(S(426));
          }
        } else if (q && o.mode & 1) {
          var w = Xi(i);
          if (w !== null) {
            !(w.flags & 65536) && (w.flags |= 256), Ji(w, i, o, a, t), $a(Dn(c, o));
            break e;
          }
        }
        a = c = Dn(c, o), se !== 4 && (se = 2), ns === null ? ns = [a] : ns.push(a), a = i;
        do {
          switch (a.tag) {
            case 3:
              a.flags |= 65536, t &= -t, a.lanes |= t;
              var p = pu(a, c, t);
              Hi(a, p);
              break e;
            case 1:
              o = c;
              var d = a.type, v = a.stateNode;
              if (!(a.flags & 128) && (typeof d.getDerivedStateFromError == "function" || v !== null && typeof v.componentDidCatch == "function" && (Et === null || !Et.has(v)))) {
                a.flags |= 65536, t &= -t, a.lanes |= t;
                var x = vu(a, o, t);
                Hi(a, x);
                break e;
              }
          }
          a = a.return;
        } while (a !== null);
      }
      Pu(n);
    } catch (k) {
      t = k, te === n && n !== null && (te = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function $u() {
  var e = Nr.current;
  return Nr.current = jr, e === null ? jr : e;
}
function Ja() {
  (se === 0 || se === 3 || se === 2) && (se = 4), le === null || !(Gt & 268435455) && !(Pr & 268435455) || xt(le, ce);
}
function Sr(e, t) {
  var n = F;
  F |= 2;
  var r = $u();
  (le !== e || ce !== t) && (lt = null, Ht(e, t));
  do
    try {
      _f();
      break;
    } catch (l) {
      _u(e, l);
    }
  while (!0);
  if (Pa(), F = n, Nr.current = r, te !== null) throw Error(S(261));
  return le = null, ce = 0, se;
}
function _f() {
  for (; te !== null; ) Iu(te);
}
function $f() {
  for (; te !== null && !sm(); ) Iu(te);
}
function Iu(e) {
  var t = Ru(e.alternate, e, Te);
  e.memoizedProps = e.pendingProps, t === null ? Pu(e) : te = t, Ya.current = null;
}
function Pu(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = Cf(n, t), n !== null) {
        n.flags &= 32767, te = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        se = 6, te = null;
        return;
      }
    } else if (n = bf(n, t, Te), n !== null) {
      te = n;
      return;
    }
    if (t = t.sibling, t !== null) {
      te = t;
      return;
    }
    te = t = e;
  } while (t !== null);
  se === 0 && (se = 5);
}
function zt(e, t, n) {
  var r = B, l = Fe.transition;
  try {
    Fe.transition = null, B = 1, If(e, t, n, r);
  } finally {
    Fe.transition = l, B = r;
  }
  return null;
}
function If(e, t, n, r) {
  do
    kn();
  while (Nt !== null);
  if (F & 6) throw Error(S(327));
  n = e.finishedWork;
  var l = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(S(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var a = n.lanes | n.childLanes;
  if (fm(e, a), e === le && (te = le = null, ce = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Bs || (Bs = !0, Ou(lr, function() {
    return kn(), null;
  })), a = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || a) {
    a = Fe.transition, Fe.transition = null;
    var i = B;
    B = 1;
    var o = F;
    F |= 4, Ya.current = null, Tf(e, n), Du(n, e), Jm(zl), ir = !!Fl, zl = Fl = null, e.current = n, Df(n), rm(), F = o, B = i, Fe.transition = a;
  } else e.current = n;
  if (Bs && (Bs = !1, Nt = e, kr = l), a = e.pendingLanes, a === 0 && (Et = null), im(n.stateNode), Ce(e, J()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], r(l.value, { componentStack: l.stack, digest: l.digest });
  if (wr) throw wr = !1, e = aa, aa = null, e;
  return kr & 1 && e.tag !== 0 && kn(), a = e.pendingLanes, a & 1 ? e === ia ? ss++ : (ss = 0, ia = e) : ss = 0, It(), null;
}
function kn() {
  if (Nt !== null) {
    var e = pc(kr), t = Fe.transition, n = B;
    try {
      if (Fe.transition = null, B = 16 > e ? 16 : e, Nt === null) var r = !1;
      else {
        if (e = Nt, Nt = null, kr = 0, F & 6) throw Error(S(331));
        var l = F;
        for (F |= 4, L = e.current; L !== null; ) {
          var a = L, i = a.child;
          if (L.flags & 16) {
            var o = a.deletions;
            if (o !== null) {
              for (var c = 0; c < o.length; c++) {
                var u = o[c];
                for (L = u; L !== null; ) {
                  var h = L;
                  switch (h.tag) {
                    case 0:
                    case 11:
                    case 15:
                      ts(8, h, a);
                  }
                  var m = h.child;
                  if (m !== null) m.return = h, L = m;
                  else for (; L !== null; ) {
                    h = L;
                    var f = h.sibling, g = h.return;
                    if (Cu(h), h === u) {
                      L = null;
                      break;
                    }
                    if (f !== null) {
                      f.return = g, L = f;
                      break;
                    }
                    L = g;
                  }
                }
              }
              var N = a.alternate;
              if (N !== null) {
                var j = N.child;
                if (j !== null) {
                  N.child = null;
                  do {
                    var w = j.sibling;
                    j.sibling = null, j = w;
                  } while (j !== null);
                }
              }
              L = a;
            }
          }
          if (a.subtreeFlags & 2064 && i !== null) i.return = a, L = i;
          else e: for (; L !== null; ) {
            if (a = L, a.flags & 2048) switch (a.tag) {
              case 0:
              case 11:
              case 15:
                ts(9, a, a.return);
            }
            var p = a.sibling;
            if (p !== null) {
              p.return = a.return, L = p;
              break e;
            }
            L = a.return;
          }
        }
        var d = e.current;
        for (L = d; L !== null; ) {
          i = L;
          var v = i.child;
          if (i.subtreeFlags & 2064 && v !== null) v.return = i, L = v;
          else e: for (i = d; L !== null; ) {
            if (o = L, o.flags & 2048) try {
              switch (o.tag) {
                case 0:
                case 11:
                case 15:
                  Ir(9, o);
              }
            } catch (k) {
              X(o, o.return, k);
            }
            if (o === i) {
              L = null;
              break e;
            }
            var x = o.sibling;
            if (x !== null) {
              x.return = o.return, L = x;
              break e;
            }
            L = o.return;
          }
        }
        if (F = l, It(), nt && typeof nt.onPostCommitFiberRoot == "function") try {
          nt.onPostCommitFiberRoot(Cr, e);
        } catch {
        }
        r = !0;
      }
      return r;
    } finally {
      B = n, Fe.transition = t;
    }
  }
  return !1;
}
function fo(e, t, n) {
  t = Dn(n, t), t = pu(e, t, 1), e = Ct(e, t, 1), t = xe(), e !== null && (ws(e, 1, t), Ce(e, t));
}
function X(e, t, n) {
  if (e.tag === 3) fo(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      fo(t, e, n);
      break;
    } else if (t.tag === 1) {
      var r = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (Et === null || !Et.has(r))) {
        e = Dn(n, e), e = vu(t, e, 1), t = Ct(t, e, 1), e = xe(), t !== null && (ws(t, 1, e), Ce(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function Pf(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t), t = xe(), e.pingedLanes |= e.suspendedLanes & n, le === e && (ce & n) === n && (se === 4 || se === 3 && (ce & 130023424) === ce && 500 > J() - Ga ? Ht(e, 0) : Ka |= n), Ce(e, t);
}
function Au(e, t) {
  t === 0 && (e.mode & 1 ? (t = Ms, Ms <<= 1, !(Ms & 130023424) && (Ms = 4194304)) : t = 1);
  var n = xe();
  e = mt(e, t), e !== null && (ws(e, t, n), Ce(e, n));
}
function Af(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), Au(e, n);
}
function Rf(e, t) {
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
      throw Error(S(314));
  }
  r !== null && r.delete(t), Au(e, n);
}
var Ru;
Ru = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || Se.current) ke = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return ke = !1, Sf(e, t, n);
    ke = !!(e.flags & 131072);
  }
  else ke = !1, q && t.flags & 1048576 && Bc(t, hr, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var r = t.type;
      Xs(e, t), e = t.pendingProps;
      var l = bn(t, pe.current);
      wn(t, n), l = Va(null, t, r, e, l, n);
      var a = Wa();
      return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, be(r) ? (a = !0, mr(t)) : a = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Oa(t), l.updater = $r, t.stateNode = l, l._reactInternals = t, Kl(t, r, e, n), t = Xl(null, t, r, !0, a, n)) : (t.tag = 0, q && a && Ma(t), ye(null, t, l, n), t = t.child), t;
    case 16:
      r = t.elementType;
      e: {
        switch (Xs(e, t), e = t.pendingProps, l = r._init, r = l(r._payload), t.type = r, l = t.tag = Ff(r), e = He(r, e), l) {
          case 0:
            t = Zl(null, t, r, e, n);
            break e;
          case 1:
            t = no(null, t, r, e, n);
            break e;
          case 11:
            t = eo(null, t, r, e, n);
            break e;
          case 14:
            t = to(null, t, r, He(r.type, e), n);
            break e;
        }
        throw Error(S(
          306,
          r,
          ""
        ));
      }
      return t;
    case 0:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : He(r, l), Zl(e, t, r, l, n);
    case 1:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : He(r, l), no(e, t, r, l, n);
    case 3:
      e: {
        if (ju(t), e === null) throw Error(S(387));
        r = t.pendingProps, a = t.memoizedState, l = a.element, qc(e, t), gr(t, r, null, n);
        var i = t.memoizedState;
        if (r = i.element, a.isDehydrated) if (a = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
          l = Dn(Error(S(423)), t), t = so(e, t, r, n, l);
          break e;
        } else if (r !== l) {
          l = Dn(Error(S(424)), t), t = so(e, t, r, n, l);
          break e;
        } else for (De = bt(t.stateNode.containerInfo.firstChild), Le = t, q = !0, qe = null, n = Hc(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (Cn(), r === l) {
            t = ft(e, t, n);
            break e;
          }
          ye(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return Yc(t), e === null && Ql(t), r = t.type, l = t.pendingProps, a = e !== null ? e.memoizedProps : null, i = l.children, Bl(r, l) ? i = null : a !== null && Bl(r, a) && (t.flags |= 32), xu(e, t), ye(e, t, i, n), t.child;
    case 6:
      return e === null && Ql(t), null;
    case 13:
      return Nu(e, t, n);
    case 4:
      return Fa(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = En(t, null, r, n) : ye(e, t, r, n), t.child;
    case 11:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : He(r, l), eo(e, t, r, l, n);
    case 7:
      return ye(e, t, t.pendingProps, n), t.child;
    case 8:
      return ye(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return ye(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (r = t.type._context, l = t.pendingProps, a = t.memoizedProps, i = l.value, V(pr, r._currentValue), r._currentValue = i, a !== null) if (Ze(a.value, i)) {
          if (a.children === l.children && !Se.current) {
            t = ft(e, t, n);
            break e;
          }
        } else for (a = t.child, a !== null && (a.return = t); a !== null; ) {
          var o = a.dependencies;
          if (o !== null) {
            i = a.child;
            for (var c = o.firstContext; c !== null; ) {
              if (c.context === r) {
                if (a.tag === 1) {
                  c = ct(-1, n & -n), c.tag = 2;
                  var u = a.updateQueue;
                  if (u !== null) {
                    u = u.shared;
                    var h = u.pending;
                    h === null ? c.next = c : (c.next = h.next, h.next = c), u.pending = c;
                  }
                }
                a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), ql(
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
            if (i = a.return, i === null) throw Error(S(341));
            i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), ql(i, n, t), i = a.sibling;
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
        ye(e, t, l.children, n), t = t.child;
      }
      return t;
    case 9:
      return l = t.type, r = t.pendingProps.children, wn(t, n), l = ze(l), r = r(l), t.flags |= 1, ye(e, t, r, n), t.child;
    case 14:
      return r = t.type, l = He(r, t.pendingProps), l = He(r.type, l), to(e, t, r, l, n);
    case 15:
      return gu(e, t, t.type, t.pendingProps, n);
    case 17:
      return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : He(r, l), Xs(e, t), t.tag = 1, be(r) ? (e = !0, mr(t)) : e = !1, wn(t, n), hu(t, r, l), Kl(t, r, l, n), Xl(null, t, r, !0, e, n);
    case 19:
      return wu(e, t, n);
    case 22:
      return yu(e, t, n);
  }
  throw Error(S(156, t.tag));
};
function Ou(e, t) {
  return dc(e, t);
}
function Of(e, t, n, r) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function Oe(e, t, n, r) {
  return new Of(e, t, n, r);
}
function ei(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function Ff(e) {
  if (typeof e == "function") return ei(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === xa) return 11;
    if (e === ja) return 14;
  }
  return 2;
}
function Dt(e, t) {
  var n = e.alternate;
  return n === null ? (n = Oe(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function tr(e, t, n, r, l, a) {
  var i = 2;
  if (r = e, typeof e == "function") ei(e) && (i = 1);
  else if (typeof e == "string") i = 5;
  else e: switch (e) {
    case ln:
      return Qt(n.children, l, a, t);
    case ya:
      i = 8, l |= 8;
      break;
    case xl:
      return e = Oe(12, n, t, l | 2), e.elementType = xl, e.lanes = a, e;
    case jl:
      return e = Oe(13, n, t, l), e.elementType = jl, e.lanes = a, e;
    case Nl:
      return e = Oe(19, n, t, l), e.elementType = Nl, e.lanes = a, e;
    case Yo:
      return Ar(n, l, a, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case Qo:
          i = 10;
          break e;
        case qo:
          i = 9;
          break e;
        case xa:
          i = 11;
          break e;
        case ja:
          i = 14;
          break e;
        case vt:
          i = 16, r = null;
          break e;
      }
      throw Error(S(130, e == null ? e : typeof e, ""));
  }
  return t = Oe(i, n, t, l), t.elementType = e, t.type = r, t.lanes = a, t;
}
function Qt(e, t, n, r) {
  return e = Oe(7, e, r, t), e.lanes = n, e;
}
function Ar(e, t, n, r) {
  return e = Oe(22, e, r, t), e.elementType = Yo, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function hl(e, t, n) {
  return e = Oe(6, e, null, t), e.lanes = n, e;
}
function pl(e, t, n) {
  return t = Oe(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function zf(e, t, n, r, l) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Kr(0), this.expirationTimes = Kr(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Kr(0), this.identifierPrefix = r, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
}
function ti(e, t, n, r, l, a, i, o, c) {
  return e = new zf(e, t, n, o, c), t === 1 ? (t = 1, a === !0 && (t |= 8)) : t = 0, a = Oe(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Oa(a), e;
}
function Bf(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: rn, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
}
function Fu(e) {
  if (!e) return Mt;
  e = e._reactInternals;
  e: {
    if (Jt(e) !== e || e.tag !== 1) throw Error(S(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (be(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(S(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (be(n)) return Fc(e, n, t);
  }
  return t;
}
function zu(e, t, n, r, l, a, i, o, c) {
  return e = ti(n, r, !0, e, l, a, i, o, c), e.context = Fu(null), n = e.current, r = xe(), l = Tt(n), a = ct(r, l), a.callback = t ?? null, Ct(n, a, l), e.current.lanes = l, ws(e, l, r), Ce(e, r), e;
}
function Rr(e, t, n, r) {
  var l = t.current, a = xe(), i = Tt(l);
  return n = Fu(n), t.context === null ? t.context = n : t.pendingContext = n, t = ct(a, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Ct(l, t, i), e !== null && (Ke(e, l, i, a), Ks(e, l, i)), i;
}
function br(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function ho(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function ni(e, t) {
  ho(e, t), (e = e.alternate) && ho(e, t);
}
function Uf() {
  return null;
}
var Bu = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function si(e) {
  this._internalRoot = e;
}
Or.prototype.render = si.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(S(409));
  Rr(e, t, null, null);
};
Or.prototype.unmount = si.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Zt(function() {
      Rr(null, e, null, null);
    }), t[dt] = null;
  }
};
function Or(e) {
  this._internalRoot = e;
}
Or.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = yc();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < yt.length && t !== 0 && t < yt[n].priority; n++) ;
    yt.splice(n, 0, e), n === 0 && jc(e);
  }
};
function ri(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function Fr(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function po() {
}
function Vf(e, t, n, r, l) {
  if (l) {
    if (typeof r == "function") {
      var a = r;
      r = function() {
        var u = br(i);
        a.call(u);
      };
    }
    var i = zu(t, r, e, 0, null, !1, !1, "", po);
    return e._reactRootContainer = i, e[dt] = i.current, ms(e.nodeType === 8 ? e.parentNode : e), Zt(), i;
  }
  for (; l = e.lastChild; ) e.removeChild(l);
  if (typeof r == "function") {
    var o = r;
    r = function() {
      var u = br(c);
      o.call(u);
    };
  }
  var c = ti(e, 0, !1, null, null, !1, !1, "", po);
  return e._reactRootContainer = c, e[dt] = c.current, ms(e.nodeType === 8 ? e.parentNode : e), Zt(function() {
    Rr(t, c, n, r);
  }), c;
}
function zr(e, t, n, r, l) {
  var a = n._reactRootContainer;
  if (a) {
    var i = a;
    if (typeof l == "function") {
      var o = l;
      l = function() {
        var c = br(i);
        o.call(c);
      };
    }
    Rr(t, i, e, l);
  } else i = Vf(n, t, e, l, r);
  return br(i);
}
vc = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = qn(t.pendingLanes);
        n !== 0 && (ka(t, n | 1), Ce(t, J()), !(F & 6) && (Ln = J() + 500, It()));
      }
      break;
    case 13:
      Zt(function() {
        var r = mt(e, 1);
        if (r !== null) {
          var l = xe();
          Ke(r, e, 1, l);
        }
      }), ni(e, 1);
  }
};
Sa = function(e) {
  if (e.tag === 13) {
    var t = mt(e, 134217728);
    if (t !== null) {
      var n = xe();
      Ke(t, e, 134217728, n);
    }
    ni(e, 134217728);
  }
};
gc = function(e) {
  if (e.tag === 13) {
    var t = Tt(e), n = mt(e, t);
    if (n !== null) {
      var r = xe();
      Ke(n, e, t, r);
    }
    ni(e, t);
  }
};
yc = function() {
  return B;
};
xc = function(e, t) {
  var n = B;
  try {
    return B = e, t();
  } finally {
    B = n;
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
            var l = Lr(r);
            if (!l) throw Error(S(90));
            Go(r), Sl(r, l);
          }
        }
      }
      break;
    case "textarea":
      Xo(e, n);
      break;
    case "select":
      t = n.value, t != null && yn(e, !!n.multiple, t, !1);
  }
};
lc = Za;
ac = Zt;
var Wf = { usingClientEntryPoint: !1, Events: [Ss, un, Lr, sc, rc, Za] }, Vn = { findFiberByHostInstance: Bt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Hf = { bundleType: Vn.bundleType, version: Vn.version, rendererPackageName: Vn.rendererPackageName, rendererConfig: Vn.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ht.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = cc(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Vn.findFiberByHostInstance || Uf, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Us = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Us.isDisabled && Us.supportsFiber) try {
    Cr = Us.inject(Hf), nt = Us;
  } catch {
  }
}
_e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Wf;
_e.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!ri(t)) throw Error(S(200));
  return Bf(e, t, null, n);
};
_e.createRoot = function(e, t) {
  if (!ri(e)) throw Error(S(299));
  var n = !1, r = "", l = Bu;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = ti(e, 1, !1, null, null, n, !1, r, l), e[dt] = t.current, ms(e.nodeType === 8 ? e.parentNode : e), new si(t);
};
_e.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(S(188)) : (e = Object.keys(e).join(","), Error(S(268, e)));
  return e = cc(t), e = e === null ? null : e.stateNode, e;
};
_e.flushSync = function(e) {
  return Zt(e);
};
_e.hydrate = function(e, t, n) {
  if (!Fr(t)) throw Error(S(200));
  return zr(null, e, t, !0, n);
};
_e.hydrateRoot = function(e, t, n) {
  if (!ri(e)) throw Error(S(405));
  var r = n != null && n.hydratedSources || null, l = !1, a = "", i = Bu;
  if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (a = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = zu(t, null, e, 1, n ?? null, l, !1, a, i), e[dt] = t.current, ms(e), r) for (e = 0; e < r.length; e++) n = r[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
    n,
    l
  );
  return new Or(t);
};
_e.render = function(e, t, n) {
  if (!Fr(t)) throw Error(S(200));
  return zr(null, e, t, !1, n);
};
_e.unmountComponentAtNode = function(e) {
  if (!Fr(e)) throw Error(S(40));
  return e._reactRootContainer ? (Zt(function() {
    zr(null, null, e, !1, function() {
      e._reactRootContainer = null, e[dt] = null;
    });
  }), !0) : !1;
};
_e.unstable_batchedUpdates = Za;
_e.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
  if (!Fr(n)) throw Error(S(200));
  if (e == null || e._reactInternals === void 0) throw Error(S(38));
  return zr(e, t, n, !1, r);
};
_e.version = "18.3.1-next-f1338f8080-20240426";
function Uu() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Uu);
    } catch (e) {
      console.error(e);
    }
}
Uu(), Uo.exports = _e;
var Qf = Uo.exports, de, vo = Qf;
de = vo.createRoot, vo.hydrateRoot;
var Vu = { exports: {} }, Br = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var qf = y, Yf = Symbol.for("react.element"), Kf = Symbol.for("react.fragment"), Gf = Object.prototype.hasOwnProperty, Zf = qf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, Xf = { key: !0, ref: !0, __self: !0, __source: !0 };
function Wu(e, t, n) {
  var r, l = {}, a = null, i = null;
  n !== void 0 && (a = "" + n), t.key !== void 0 && (a = "" + t.key), t.ref !== void 0 && (i = t.ref);
  for (r in t) Gf.call(t, r) && !Xf.hasOwnProperty(r) && (l[r] = t[r]);
  if (e && e.defaultProps) for (r in t = e.defaultProps, t) l[r] === void 0 && (l[r] = t[r]);
  return { $$typeof: Yf, type: e, key: a, ref: i, props: l, _owner: Zf.current };
}
Br.Fragment = Kf;
Br.jsx = Wu;
Br.jsxs = Wu;
Vu.exports = Br;
var s = Vu.exports;
const go = {
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
function Hu(e, t = "") {
  const n = go[e] || go.info;
  return `<svg class="${t ? `icon ${t}` : "icon"}" viewBox="0 0 24 24" aria-hidden="true">${n}</svg>`;
}
function b({ name: e, cls: t = "" }) {
  return /* @__PURE__ */ s.jsx("span", { dangerouslySetInnerHTML: { __html: Hu(e, t) } });
}
function Jf(e) {
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
function Qu(e, t) {
  return `${(e || "?")[0] || ""}${(t || "")[0] || ""}`.toUpperCase();
}
function Ge(e) {
  if (!e) return "";
  const t = new Date(e.length <= 10 ? e + "T00:00:00" : e), n = /* @__PURE__ */ new Date(), r = t.getFullYear() === n.getFullYear();
  return t.toLocaleDateString(void 0, { month: "short", day: "numeric", year: r ? void 0 : "numeric" });
}
function qu(e) {
  const t = /* @__PURE__ */ new Date(e + "T00:00:00"), n = /* @__PURE__ */ new Date(), r = n.toISOString().slice(0, 10), l = new Date(n);
  l.setDate(l.getDate() + 1);
  const a = l.toISOString().slice(0, 10);
  return e === r ? "Today" : e === a ? "Tomorrow" : t.toLocaleDateString(void 0, { weekday: "long", month: "short", day: "numeric" });
}
function Yu(e) {
  if (!e) return "";
  if (/^\d{2}:\d{2}$/.test(e)) {
    const [t, n] = e.split(":").map(Number);
    return new Date(2e3, 0, 1, t, n).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
  return new Date(e).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
}
function Ur(e) {
  if (!e) return "";
  const t = new Date(e.includes("T") || e.includes(" ") ? e.replace(" ", "T") + (e.endsWith("Z") ? "" : "Z") : e), n = Date.now() - t.getTime(), r = Math.round(n / 6e4);
  if (r < 1) return "just now";
  if (r < 60) return `${r}m ago`;
  const l = Math.round(r / 60);
  if (l < 24) return `${l}h ago`;
  const a = Math.round(l / 24);
  return a < 7 ? `${a}d ago` : Ge(e);
}
function Wt(e, t = "EUR") {
  try {
    return new Intl.NumberFormat(void 0, { style: "currency", currency: t }).format(e);
  } catch {
    return `${e} ${t}`;
  }
}
function Ku(e) {
  if (e == null) return "";
  const t = Math.floor(e / 60), n = e % 60;
  return t && n ? `${t}h ${n}m` : t ? `${t}h` : `${n}m`;
}
const li = { critical: "Critical", high: "High", medium: "Medium", low: "Low" }, eh = { todo: "To do", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
function ai(e) {
  return e == null ? "" : e < 0 ? `${Math.abs(e)}d overdue` : e === 0 ? "Due today" : e === 1 ? "Due tomorrow" : `Due in ${e}d`;
}
function Gu(e, t) {
  if (!e || !t) return;
  const r = t.offsetLeft - e.offsetLeft - (e.clientWidth - t.offsetWidth) / 2, l = e.scrollWidth - e.clientWidth;
  l <= 0 || (e.scrollLeft = Math.max(0, Math.min(l, r)));
}
const th = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };
function nh(e) {
  const t = /* @__PURE__ */ new Date();
  t.setHours(0, 0, 0, 0);
  const n = /* @__PURE__ */ new Date(e + "T00:00:00");
  return Math.round((n - t) / 864e5);
}
function sh({ item: e, onComplete: t }) {
  const n = e.kind === "task", r = th[e.priority] || "badge-medium", l = e.due_date ? ai(nh(e.due_date)) : "";
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    n ? /* @__PURE__ */ s.jsx("button", { className: "row-check", "aria-label": "Complete", onClick: () => t(e.id), children: /* @__PURE__ */ s.jsx(b, { name: "check" }) }) : /* @__PURE__ */ s.jsx("div", { className: "row-check", style: { pointerEvents: "none", opacity: 0.35 }, children: /* @__PURE__ */ s.jsx(b, { name: e.kind === "bill" ? "bill" : "decision", cls: "icon-sm" }) }),
    /* @__PURE__ */ s.jsxs("a", { className: "row-main row-item-btn", href: e.link, style: { textDecoration: "none" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.title }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { className: `badge ${r}`, children: e.priority }),
        l ? /* @__PURE__ */ s.jsx("span", { children: l }) : null
      ] })
    ] })
  ] });
}
function rh({ title: e, items: t, color: n, emptyText: r, onComplete: l, dominant: a }) {
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
          /* @__PURE__ */ s.jsx(b, { name: "chevron", cls: "icon-sm bucket-chevron" })
        ]
      }
    ),
    c ? /* @__PURE__ */ s.jsx("div", { id: u, children: t.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: t.map((h) => /* @__PURE__ */ s.jsx(sh, { item: h, onComplete: l }, `${h.kind}-${h.id}`)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: r }) }) : null
  ] });
}
function lh({ goals: e }) {
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
const ah = {
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
}, ih = { icon: "timeline" };
function oh({ event: e }) {
  const t = ah[e.type] || ih, n = t.accent ? `module-accent--${t.accent}` : "module-accent--none", r = /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx(b, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", style: { whiteSpace: "normal", fontWeight: 500 }, children: e.summary }),
      /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: Ur(e.createdAt) })
    ] })
  ] });
  return e.link ? /* @__PURE__ */ s.jsx("a", { className: `row-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ s.jsx("div", { className: `row-item ${n}`, children: r });
}
function ch({ activity: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Circle activity" }) }),
    e.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: e.slice(0, 6).map((t) => /* @__PURE__ */ s.jsx(oh, { event: t }, t.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No circle activity yet. Create a circle to share tasks and updates." })
  ] });
}
function uh({ count: e }) {
  return /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { borderColor: "var(--warning-400)" }, children: /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-3)" }, children: [
    /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
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
function dh({ onSeedDemo: e }) {
  const [t, n] = y.useState(!1);
  async function r() {
    n(!0), await e(), n(!1);
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "onboard-card", children: [
    /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-lg" }),
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
function mh(e) {
  return e < 12 ? "Good morning" : e < 18 ? "Good afternoon" : "Good evening";
}
function fh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { data: l, loading: a, error: i, refetch: o } = Jf(t), c = y.useMemo(() => mh((/* @__PURE__ */ new Date()).getHours()), []), u = y.useMemo(
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
  async function m() {
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
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: i.message || "Something went wrong loading this page." })
    ] }) });
  const f = l.counts.tasks === 0 && l.counts.bills === 0 && !r.families.length, g = [
    ...l.overdue && l.overdue.length ? [{ key: "overdue", title: "Overdue", items: l.overdue, color: "var(--danger-500)", emptyText: "" }] : [],
    { key: "needsAttention", title: "Needs attention", items: l.needsAttention, color: "var(--danger-500)", emptyText: "Nothing needs urgent attention — nice work." },
    { key: "comingSoon", title: "Coming soon", items: l.comingSoon, color: "var(--warning-500)", emptyText: "Nothing coming up in the next few days." },
    { key: "canWait", title: "Can wait", items: l.canWait, color: "var(--priority-low)", emptyText: "Nothing low-priority queued up." }
  ], N = g.findIndex((w) => w.items.length > 0), j = N === -1;
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsxs("h1", { className: "page-title", children: [
        c,
        ", ",
        r.user.firstName
      ] }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Here's what matters in your life right now." })
    ] }) }),
    f ? /* @__PURE__ */ s.jsx(dh, { onSeedDemo: m }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "today-banner", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h2", { children: l.today.count === 0 ? "Nothing urgent today" : `${l.today.count} thing${l.today.count === 1 ? "" : "s"} need${l.today.count === 1 ? "s" : ""} your attention` }),
        /* @__PURE__ */ s.jsx("p", { children: u })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "today-count", children: l.today.count })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ s.jsx("div", { className: "stack", children: j ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", style: { padding: "var(--sp-6) var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsx(b, { name: "check", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "You're all caught up" }),
        /* @__PURE__ */ s.jsx("p", { children: "Nothing needs your attention right now." })
      ] }) }) : g.map((w, p) => /* @__PURE__ */ s.jsx(
        rh,
        {
          title: w.title,
          items: w.items,
          color: w.color,
          emptyText: w.emptyText,
          onComplete: h,
          dominant: p === N
        },
        w.key
      )) }),
      /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ s.jsx(lh, { goals: l.goalsInProgress }),
        /* @__PURE__ */ s.jsx(ch, { activity: l.familyActivity }),
        l.conflicts > 0 ? /* @__PURE__ */ s.jsx(uh, { count: l.conflicts }) : null
      ] })
    ] })
  ] });
}
function hh(e, t, n) {
  const r = { ...e };
  return r[t] = e[t] === n ? "" : n, t === "view" && r.view !== n && (r.view = "all"), r;
}
function ph(e) {
  const [t, n] = y.useState({ view: "all", status: "", q: "" }), [r, l] = y.useState(""), [a, i] = y.useState([]), [o, c] = y.useState(!0), [u, h] = y.useState(null), m = y.useCallback(
    async (f) => {
      c(!0), h(null);
      try {
        const g = new URLSearchParams();
        f.view && f.view !== "all" && g.set("view", f.view), f.status && g.set("status", f.status), f.q && g.set("q", f.q);
        const { tasks: N } = await e.get(`/api/tasks?${g.toString()}`);
        i(N);
      } catch (g) {
        h(g);
      } finally {
        c(!1);
      }
    },
    [e]
  );
  return y.useEffect(() => {
    m(t);
  }, [t, m]), y.useEffect(() => {
    const f = r.trim(), g = setTimeout(() => {
      n((N) => N.q === f ? N : { ...N, q: f });
    }, 250);
    return () => clearTimeout(g);
  }, [r]), {
    tasks: a,
    loading: o,
    error: u,
    filters: t,
    toggleFilter: (f, g) => n((N) => hh(N, f, g)),
    searchValue: r,
    setSearchValue: l,
    refetch: () => m(t)
  };
}
const vh = [
  ["all", "All"],
  ["today", "Today"],
  ["upcoming", "Upcoming"],
  ["overdue", "Overdue"]
];
function gh({ filters: e, onToggle: t, searchValue: n, onSearchChange: r }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "filter-bar", children: [
    vh.map(([l, a]) => /* @__PURE__ */ s.jsx(
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
const yh = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };
function xh({ task: e, onOpen: t, onToggleCheck: n }) {
  const r = e.status === "completed", l = e.status === "cancelled";
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ s.jsx(
      "button",
      {
        className: `row-check ${r ? "checked" : ""}`,
        disabled: l,
        "aria-label": "Toggle complete",
        onClick: () => n(e),
        children: /* @__PURE__ */ s.jsx(b, { name: "check" })
      }
    ),
    /* @__PURE__ */ s.jsxs("button", { className: "row-main row-item-btn", onClick: () => t(e.id), children: [
      /* @__PURE__ */ s.jsx("div", { className: `row-title ${r ? "done" : ""}`, children: e.title }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { className: `badge ${yh[e.priority]}`, children: li[e.priority] }),
        e.dueDate ? /* @__PURE__ */ s.jsxs("span", { children: [
          Ge(e.dueDate),
          e.startTime ? " · " + Yu(e.startTime) : ""
        ] }) : null,
        e.durationMinutes ? /* @__PURE__ */ s.jsx("span", { children: Ku(e.durationMinutes) }) : null,
        e.familyId ? /* @__PURE__ */ s.jsx(b, { name: "family", cls: "icon-sm" }) : null,
        e.recurrence ? /* @__PURE__ */ s.jsxs("span", { children: [
          /* @__PURE__ */ s.jsx(b, { name: "refresh", cls: "icon-sm" }),
          " ",
          e.recurrence
        ] }) : null,
        l ? /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: "Cancelled" }) : null
      ] })
    ] })
  ] });
}
const jh = [
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
function Nh(e) {
  return !e || e.mode === "default" ? "default" : e.mode === "none" ? "none" : String(e.minutesBefore);
}
function Zu(e) {
  return !e || e === "default" ? { mode: "default" } : e === "none" ? { mode: "none" } : { mode: "custom", minutesBefore: Number(e) };
}
function Xu({ existing: e, hint: t }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "item-reminder", children: "Remind me" }),
    /* @__PURE__ */ s.jsx("select", { id: "item-reminder", className: "select", name: "reminder", defaultValue: Nh(e), children: jh.map(([n, r]) => /* @__PURE__ */ s.jsx("option", { value: n, children: r }, n)) }),
    t ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginTop: "var(--sp-1)" }, children: t }) : null
  ] });
}
const Je = document.getElementById("modal-root");
let gn = null, Wn = null, nn = null, sn = null;
const wh = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function ve({ title: e, bodyHtml: t, footerHtml: n = "", size: r = "", onMount: l, onClose: a }) {
  if (Wn) {
    const c = Wn;
    Wn = null, c();
  }
  Je.classList.contains("open") || (nn = document.activeElement), sn && (document.removeEventListener("keydown", sn), sn = null), Je.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel ${r === "lg" ? "modal-lg" : ""}" role="dialog" aria-modal="true" aria-label="${e || ""}">
      <div class="modal-header">
        <div class="modal-title">${e || ""}</div>
        <button class="icon-btn" data-close aria-label="Close">${Hu("x")}</button>
      </div>
      <div class="modal-body">${t}</div>
      ${n ? `<div class="modal-footer">${n}</div>` : ""}
    </div>
  `, Je.classList.add("open"), document.body.style.overflow = "hidden", Wn = a || null, gn = () => {
    Je.classList.remove("open"), Je.innerHTML = "", document.body.style.overflow = "", a && a(), Wn = null, document.removeEventListener("keydown", i), sn === i && (sn = null), nn && nn.isConnected && typeof nn.focus == "function" && nn.focus(), nn = null;
  }, Je.querySelectorAll("[data-close]").forEach((c) => c.addEventListener("click", gn));
  function i(c) {
    if (c.key === "Escape") return gn();
    if (c.key !== "Tab") return;
    const u = Je.querySelector(".modal-panel");
    if (!u) return;
    const h = [...u.querySelectorAll(wh)].filter((N) => N.offsetParent !== null);
    if (!h.length) return c.preventDefault();
    const m = h[0], f = h[h.length - 1], g = document.activeElement;
    u.contains(g) ? c.shiftKey && g === m ? (c.preventDefault(), f.focus()) : !c.shiftKey && g === f && (c.preventDefault(), m.focus()) : (c.preventDefault(), (c.shiftKey ? f : m).focus());
  }
  sn = i, document.addEventListener("keydown", i), l && l(Je);
  const o = Je.querySelector(".modal-panel");
  return setTimeout(() => {
    const c = Je.querySelector(".modal-panel");
    if (!c || c !== o || c.contains(document.activeElement)) return;
    const u = c.querySelector(".modal-body input:not([type=hidden]):not([disabled]),.modal-body select:not([disabled]),.modal-body textarea:not([disabled])") || c.querySelector(".modal-footer button:not([disabled])") || c.querySelector(".modal-body button:not([disabled])") || c.querySelector("[data-close]");
    u && u.focus();
  }, 0), gn;
}
function ae() {
  gn && gn();
}
const kh = ["critical", "high", "medium", "low"], Sh = ["daily", "weekdays", "weekly", "monthly"];
function bh(e) {
  const t = new Date(e);
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}
function Ju(e) {
  return e && e.visibility === "family" && e.familyId != null ? String(e.familyId) : "";
}
function Ch({ existing: e, families: t, canChangeVisibility: n = !0 }) {
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
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "priority", defaultValue: e == null ? void 0 : e.priority, children: kh.map((r) => /* @__PURE__ */ s.jsx("option", { value: r, children: li[r] }, r)) })
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
            defaultValue: e != null && e.startTime ? bh(e.startTime) : ""
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
          Sh.map((r) => /* @__PURE__ */ s.jsx("option", { value: r, children: r }, r))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx(Xu, { existing: e == null ? void 0 : e.reminder, hint: "Needs a due date. With a start time it counts from that time; without one, from your usual hour." }),
    t.length && n ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Circle" }),
      /* @__PURE__ */ s.jsxs("select", { className: "select", name: "familyId", defaultValue: Ju(e), children: [
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
function yo({ api: e, toast: t, state: n, existing: r, onSaved: l }) {
  const a = n.families || [], i = !r || r.ownerId === n.user.id;
  let o = null;
  ve({
    title: r ? "Edit task" : "New task",
    bodyHtml: '<div id="task-form-mount"></div>',
    footerHtml: `
      <button class="btn" data-close>Cancel</button>
      <button class="btn btn-primary" id="save-task-btn">${r ? "Save changes" : "Create task"}</button>
    `,
    size: "lg",
    onMount: (c) => {
      const u = c.querySelector("#task-form-mount");
      o = de(u), o.render(y.createElement(Ch, { existing: r, families: a, canChangeVisibility: i })), document.getElementById("save-task-btn").addEventListener("click", async () => {
        const h = document.getElementById("task-form"), m = Object.fromEntries(new FormData(h).entries());
        if (!m.title.trim()) {
          t("Title is required.", "error");
          return;
        }
        const f = {
          title: m.title.trim(),
          description: m.description || null,
          priority: m.priority,
          category: m.category || "general",
          dueDate: m.dueDate || null,
          durationMinutes: m.durationMinutes ? Number(m.durationMinutes) : null,
          recurrence: m.recurrence || null,
          notes: m.notes || null,
          reminder: Zu(m.reminder)
        };
        m.dueDate && m.startTimeOnly && (f.startTime = (/* @__PURE__ */ new Date(`${m.dueDate}T${m.startTimeOnly}:00`)).toISOString()), r ? i && (m.familyId || "") !== Ju(r) && (m.familyId ? (f.familyId = Number(m.familyId), f.visibility = "family") : f.visibility = "private") : m.familyId ? (f.familyId = Number(m.familyId), f.visibility = "family") : f.visibility = "private";
        try {
          r ? (await e.patch(`/api/tasks/${r.id}`, f), t("Task updated", "success")) : (await e.post("/api/tasks", f), t("Task created", "success")), ae(), l();
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
function Ee({ title: e = "Are you sure?", message: t = "", confirmLabel: n = "Confirm", danger: r = !0 }) {
  return new Promise((l) => {
    ve({
      title: vl(e),
      bodyHtml: `<p class="text-sm" style="color:var(--text-secondary)">${vl(t)}</p>`,
      footerHtml: `
        <button class="btn" data-cancel>Cancel</button>
        <button class="btn ${r ? "btn-danger" : "btn-primary"}" data-confirm>${vl(n)}</button>
      `,
      onMount: (a) => {
        a.querySelector("[data-cancel]").addEventListener("click", () => {
          l(!1), ae();
        }), a.querySelector("[data-confirm]").addEventListener("click", () => {
          l(!0), ae();
        });
      },
      onClose: () => l(!1)
    });
  });
}
const Eh = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" }, Th = ["todo", "in_progress", "completed", "cancelled"];
function Dh(e) {
  return (e || "?").split(" ").map((t) => t[0]).join("").slice(0, 2).toUpperCase();
}
function Lh({ comment: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "row", style: { alignItems: "flex-start", gap: "var(--sp-2)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "avatar avatar-sm", children: Dh(e.authorName) }),
    /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ s.jsx("strong", { children: e.authorName }),
        " ",
        /* @__PURE__ */ s.jsx("span", { className: "muted text-xs", children: Ge(e.createdAt) })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "text-sm", children: e.body })
    ] })
  ] });
}
function Mh({ taskId: e, api: t, toast: n, onEdit: r, onChanged: l }) {
  const [a, i] = y.useState(!0), [o, c] = y.useState(null), [u, h] = y.useState([]), [m, f] = y.useState(""), g = y.useCallback(async () => {
    i(!0);
    try {
      const d = await t.get(`/api/tasks/${e}`);
      c(d.task), h(d.comments), i(!1);
    } catch (d) {
      n(d.message, "error"), ae();
    }
  }, [t, e, n]);
  y.useEffect(() => {
    g();
  }, [g]), y.useEffect(() => {
    if (o) {
      const d = document.querySelector("#modal-root .modal-title");
      d && (d.textContent = o.title);
    }
  }, [o]);
  async function N(d) {
    try {
      await t.patch(`/api/tasks/${o.id}`, { status: d.target.value }), n("Status updated", "success"), l();
    } catch (v) {
      n(v.message, "error");
    }
  }
  async function j() {
    await t.post(`/api/tasks/${o.id}/postpone`, { days: 1 }), n("Postponed by 1 day", "success"), ae(), l();
  }
  async function w() {
    await Ee({
      title: "Delete task?",
      message: `"${o.title}" will be permanently deleted.`,
      confirmLabel: "Delete"
    }) && (await t.del(`/api/tasks/${o.id}`), n("Task deleted", "success"), ae(), l());
  }
  async function p(d) {
    d.preventDefault();
    const v = m.trim();
    if (v)
      try {
        await t.post(`/api/tasks/${o.id}/comments`, { body: v }), f(""), g();
      } catch (x) {
        n(x.message, "error");
      }
  }
  return a ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) : o ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ s.jsx("span", { className: `badge ${Eh[o.priority]}`, children: li[o.priority] }),
      /* @__PURE__ */ s.jsx("select", { className: "select", style: { width: "auto", height: 32 }, value: o.status, onChange: N, children: Th.map((d) => /* @__PURE__ */ s.jsx("option", { value: d, children: eh[d] }, d)) }),
      o.dueDate ? /* @__PURE__ */ s.jsxs("span", { className: "badge badge-neutral", children: [
        /* @__PURE__ */ s.jsx(b, { name: "calendar", cls: "icon-sm" }),
        " ",
        Ge(o.dueDate)
      ] }) : null,
      o.durationMinutes ? /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: Ku(o.durationMinutes) }) : null
    ] }),
    o.description ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { marginBottom: "var(--sp-4)" }, children: o.description }) : null,
    o.notes ? /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ s.jsx("strong", { children: "Notes:" }),
      " ",
      o.notes
    ] }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "row page-actions", style: { marginBottom: "var(--sp-5)" }, children: [
      /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: j, children: [
        /* @__PURE__ */ s.jsx(b, { name: "clock", cls: "icon-sm" }),
        " Postpone 1 day"
      ] }),
      /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: () => r(o), children: [
        /* @__PURE__ */ s.jsx(b, { name: "edit", cls: "icon-sm" }),
        " Edit"
      ] }),
      /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm btn-danger", onClick: w, children: [
        /* @__PURE__ */ s.jsx(b, { name: "trash", cls: "icon-sm" }),
        " Delete"
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("hr", { className: "divider" }),
    /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Comments" }),
    /* @__PURE__ */ s.jsx("div", { className: "stack", style: { marginBottom: "var(--sp-4)" }, children: u.length ? u.map((d) => /* @__PURE__ */ s.jsx(Lh, { comment: d }, d.id)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No comments yet." }) }),
    /* @__PURE__ */ s.jsxs("form", { className: "row", onSubmit: p, children: [
      /* @__PURE__ */ s.jsx(
        "input",
        {
          className: "input",
          placeholder: "Write a comment…",
          style: { flex: 1 },
          value: m,
          onChange: (d) => f(d.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", children: /* @__PURE__ */ s.jsx(b, { name: "send", cls: "icon-sm" }) })
    ] })
  ] }) : null;
}
function _h({ api: e, toast: t, taskId: n, onEdit: r, onChanged: l }) {
  let a = null;
  ve({
    title: "Task",
    bodyHtml: '<div id="task-detail-mount"></div>',
    size: "lg",
    onMount: (i) => {
      const o = i.querySelector("#task-detail-mount");
      a = de(o), a.render(
        y.createElement(Mh, {
          taskId: n,
          api: e,
          toast: t,
          onEdit: (c) => {
            ae(), r(c);
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
function $h({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { tasks: l, loading: a, error: i, filters: o, toggleFilter: c, searchValue: u, setSearchValue: h, refetch: m } = ph(t);
  function f() {
    yo({ api: t, toast: n, state: r, existing: null, onSaved: m });
  }
  function g(w) {
    yo({ api: t, toast: n, state: r, existing: w, onSaved: m });
  }
  function N(w) {
    _h({
      api: t,
      toast: n,
      taskId: w,
      onEdit: g,
      onChanged: m
    });
  }
  async function j(w) {
    const p = w.status === "completed";
    try {
      await t.patch(`/api/tasks/${w.id}`, { status: p ? "todo" : "completed" }), m();
    } catch (d) {
      n(d.message, "error");
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "This Week" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Everything on your plate, prioritized." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: f, children: [
        /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon icon-sm" }),
        " New task"
      ] }) })
    ] }),
    /* @__PURE__ */ s.jsx(gh, { filters: o, onToggle: c, searchValue: u, onSearchChange: h }),
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
          /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
          /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load your tasks" }),
          /* @__PURE__ */ s.jsx("p", { children: i.message }),
          /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: m, children: "Try again" })
        ] })
      ) : l.length === 0 ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ s.jsx(b, { name: "tasks", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "No tasks here" }),
        /* @__PURE__ */ s.jsx("p", { children: "Add your first task to start organizing your day." }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Add a task" })
      ] }) : /* @__PURE__ */ s.jsx("div", { className: "row-list", children: l.map((w) => /* @__PURE__ */ s.jsx(xh, { task: w, onOpen: N, onToggleCheck: j }, w.id)) })
    ] })
  ] });
}
function Ih(e, t) {
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
function Ph({ onCreate: e, onJoin: t, extra: n = null }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Circle" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Shared responsibilities, chat, and activity." })
    ] }) }),
    n,
    /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "family", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No circle yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Create a circle to share tasks, bills, a chat and a shopping list with the people you live or work with." }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { marginTop: "var(--sp-2)", gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", onClick: e, children: "Create a circle" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: t, children: "Join with a code" })
      ] })
    ] }) })
  ] });
}
function Ah() {
  return /* @__PURE__ */ s.jsx("form", { id: "family-form", className: "stack", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Circle name" }),
    /* @__PURE__ */ s.jsx("input", { className: "input", name: "name", placeholder: "The Smiths", required: !0 })
  ] }) });
}
function Rh({ api: e, toast: t, onCreated: n }) {
  let r = null;
  ve({
    title: "Create a circle",
    bodyHtml: '<div id="family-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="create-family-save">Create</button>',
    onMount: (l) => {
      r = de(l.querySelector("#family-form-mount")), r.render(y.createElement(Ah)), document.getElementById("create-family-save").addEventListener("click", async () => {
        const a = document.querySelector("#family-form [name=name]").value.trim();
        if (!a) return t("Circle name is required.", "error");
        try {
          const { family: i } = await e.post("/api/family", { name: a });
          ae(), t("Circle created", "success"), n(i);
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
function Oh() {
  return /* @__PURE__ */ s.jsx("form", { id: "join-family-form", className: "stack", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Invite code" }),
    /* @__PURE__ */ s.jsx("input", { className: "input", name: "code", placeholder: "e.g. K7M2QX9P4RTA", style: { textTransform: "uppercase" }, required: !0 })
  ] }) });
}
function Fh({ api: e, toast: t, onJoined: n }) {
  let r = null;
  ve({
    title: "Join a circle",
    bodyHtml: '<div id="join-family-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="join-family-save">Join</button>',
    onMount: (l) => {
      r = de(l.querySelector("#join-family-form-mount")), r.render(y.createElement(Oh)), document.getElementById("join-family-save").addEventListener("click", async () => {
        const a = document.querySelector("#join-family-form [name=code]").value.trim();
        if (!a) return t("Enter an invite code.", "error");
        try {
          const { family: i } = await e.post("/api/family/join", { code: a });
          ae(), t(`Joined ${i.name}`, "success"), n(i);
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
function zh({ api: e, toast: t, familyId: n, family: r, myRole: l, onChanged: a }) {
  const [i, o] = y.useState(!0), [c, u] = y.useState([]), [h, m] = y.useState(null), [f, g] = y.useState(!1);
  async function N() {
    if (await Ee({
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
  const j = y.useCallback(() => {
    let w = !1;
    return o(!0), m(null), e.get(`/api/tasks?familyId=${n}`).then(({ tasks: p }) => {
      w || (u(p), o(!1));
    }).catch((p) => {
      w || (m(p), o(!1));
    }), () => {
      w = !0;
    };
  }, [e, n]);
  return y.useEffect(() => j(), [j]), i ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) : /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row-between", style: { marginBottom: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", style: { marginBottom: 0 }, children: "Shared tasks" }),
        /* @__PURE__ */ s.jsx("span", { className: "text-xs muted", children: c.length })
      ] }),
      h ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load shared tasks" }),
        /* @__PURE__ */ s.jsx("p", { children: h.message }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: j, children: "Try again" })
      ] }) : c.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: c.slice(0, 10).map((w) => /* @__PURE__ */ s.jsxs("a", { className: "row-item", href: `#/tasks/${w.id}`, style: { textDecoration: "none" }, children: [
        /* @__PURE__ */ s.jsx(
          "div",
          {
            className: "row-check",
            style: {
              pointerEvents: "none",
              ...w.status === "completed" ? { background: "var(--accent-500)", borderColor: "var(--accent-500)", color: "#fff" } : {}
            },
            children: w.status === "completed" ? /* @__PURE__ */ s.jsx(b, { name: "check", cls: "icon-sm" }) : null
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
        l === "owner" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: N, disabled: f, children: "New invite code" }) : null
      ] })
    ] })
  ] });
}
function Bh() {
  return /* @__PURE__ */ s.jsxs("form", { id: "member-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Invite by email" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "email", type: "email", inputMode: "email", autoComplete: "off", placeholder: "name@example.com" }),
      /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "They get an invitation to accept with their confirmed email address." })
    ] }),
    /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", children: "Or add someone by phone number instead (leave the email empty):" }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Phone number" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "phone", placeholder: "+383 44 123 456" })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Display name (optional)" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", name: "displayName", placeholder: "e.g. Mom" })
    ] })
  ] });
}
function Uh({ api: e, toast: t, familyId: n, onAdded: r }) {
  let l = null;
  ve({
    title: "Invite a member",
    bodyHtml: '<div id="member-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="add-member-save">Send</button>',
    onMount: (a) => {
      l = de(a.querySelector("#member-form-mount")), l.render(y.createElement(Bh)), document.getElementById("add-member-save").addEventListener("click", async () => {
        const i = document.getElementById("member-form"), o = Object.fromEntries(new FormData(i).entries()), c = (o.email || "").trim();
        if (!c && !o.phone.trim()) return t("Enter an email address or a phone number.", "error");
        const u = document.getElementById("add-member-save");
        u.disabled = !0;
        try {
          if (c) {
            const h = await e.post(`/api/family/${n}/invitations`, { email: c });
            t(h.message || "Invitation sent", "success");
          } else
            await e.post(`/api/family/${n}/members`, { phone: o.phone, displayName: o.displayName }), t("Member added", "success");
          ae(), r();
        } catch (h) {
          t(h.message, "error"), u.disabled = !1;
        }
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
function xo({ api: e, toast: t, onChanged: n }) {
  const [r, l] = y.useState([]), [a, i] = y.useState(null), o = y.useCallback(() => {
    e.get("/api/family/invitations/mine").then((u) => l(u.invitations || [])).catch(() => l([]));
  }, [e]);
  y.useEffect(o, [o]);
  async function c(u, h) {
    if (!a) {
      i(u.id);
      try {
        await e.post(`/api/family/invitations/${u.id}/${h ? "accept" : "decline"}`, {}), t(h ? `You joined ${u.familyName}` : "Invitation declined", "success"), o(), h && n();
      } catch (m) {
        t(m && m.message || "Could not answer the invitation", "error"), o();
      } finally {
        i(null);
      }
    }
  }
  return r.length ? /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-4)" }, role: "region", "aria-label": "Invitations", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "You are invited" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "stack", children: r.map((u) => /* @__PURE__ */ s.jsxs("div", { className: "row", style: { justifyContent: "space-between", gap: "var(--sp-3)", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ s.jsxs("span", { className: "text-sm", children: [
        "Join the circle ",
        /* @__PURE__ */ s.jsx("strong", { children: u.familyName })
      ] }),
      /* @__PURE__ */ s.jsxs("span", { className: "row", style: { gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm btn-primary", disabled: a === u.id, onClick: () => c(u, !0), children: "Accept" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: a === u.id, onClick: () => c(u, !1), children: "Decline" })
      ] })
    ] }, u.id)) })
  ] }) : null;
}
function Vh({ api: e, toast: t, familyId: n, refreshKey: r }) {
  const [l, a] = y.useState([]), i = y.useCallback(() => {
    e.get(`/api/family/${n}/invitations`).then((c) => a((c.invitations || []).filter((u) => u.status === "pending"))).catch(() => a([]));
  }, [e, n]);
  y.useEffect(i, [i, r]);
  async function o(c) {
    try {
      await e.del(`/api/family/${n}/invitations/${c.id}`), t("Invitation withdrawn", "success");
    } catch (u) {
      t(u && u.message || "Could not withdraw the invitation", "error");
    }
    i();
  }
  return l.length ? /* @__PURE__ */ s.jsxs("div", { style: { marginTop: "var(--sp-4)" }, children: [
    /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginBottom: "var(--sp-2)" }, children: "Waiting for an answer (valid for 7 days)" }),
    /* @__PURE__ */ s.jsx("div", { className: "stack", children: l.map((c) => /* @__PURE__ */ s.jsxs("div", { className: "row", style: { justifyContent: "space-between", gap: "var(--sp-3)" }, children: [
      /* @__PURE__ */ s.jsx("span", { className: "text-sm", style: { wordBreak: "break-all" }, children: c.email }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => o(c), children: "Withdraw" })
    ] }, c.id)) })
  ] }) : null;
}
function Wh({ api: e, toast: t, familyId: n, family: r, myRole: l, onChanged: a }) {
  const i = l === "owner" || l === "admin", o = l === "owner", [c, u] = y.useState(0), h = r.members.some((N) => N.registered && N.role !== "owner");
  async function m(N) {
    if (!await Ee({
      title: "Remove member?",
      message: "They will lose access to shared circle data.",
      confirmLabel: "Remove"
    })) return;
    const w = await e.del(`/api/family/${n}/members/${N}`);
    t(w && w.inviteCodeRotated ? "Member removed. The invite code was changed." : "Member removed", "success"), a();
  }
  async function f(N) {
    const j = N.displayName || "this member";
    if (await Ee({
      title: "Transfer ownership?",
      message: `${j} will become the owner of “${r.name}”. You will become a regular member and lose the ability to manage members, roles and ownership. Nothing is deleted. Only the new owner can transfer ownership back.`,
      confirmLabel: "Transfer ownership",
      danger: !1
    })) {
      try {
        await e.post(`/api/family/${n}/transfer-ownership`, { memberId: N.id }), t("Ownership transferred", "success");
      } catch (p) {
        t(p && p.message || "Could not transfer ownership", "error");
      }
      a();
    }
  }
  async function g() {
    if (await Ee({
      title: "Leave this circle?",
      message: `You will lose access to “${r.name}” and its shared data. Your account and personal data stay as they are. You can rejoin later only with a new invite.`,
      confirmLabel: "Leave circle"
    })) {
      try {
        await e.post(`/api/family/${n}/leave`, {}), t("You left the circle", "success");
      } catch (j) {
        t(j && j.message || "Could not leave the circle", "error");
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
          onClick: () => Uh({ api: e, toast: t, familyId: n, onAdded: () => {
            u((N) => N + 1), a();
          } }),
          children: [
            /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
            " Invite"
          ]
        }
      ) : null
    ] }),
    /* @__PURE__ */ s.jsx("div", { className: "member-grid", children: r.members.map((N) => /* @__PURE__ */ s.jsx(
      Hh,
      {
        member: N,
        canManage: i,
        canTransfer: o && N.registered && N.role !== "owner",
        onRemove: m,
        onTransfer: f
      },
      N.id
    )) }),
    i ? /* @__PURE__ */ s.jsx(Vh, { api: e, toast: t, familyId: n, refreshKey: c }) : null,
    o ? /* @__PURE__ */ s.jsx("p", { className: "text-xs muted member-lifecycle-note", children: h ? "You own this circle. To leave it, or to delete your account, first transfer ownership with “Make owner” on another member." : "You own this circle and are its only registered member, so you can’t leave it or transfer ownership yet. Invite someone to join first." }) : /* @__PURE__ */ s.jsx("div", { className: "member-lifecycle-note", children: /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: g, children: "Leave circle" }) })
  ] });
}
function Hh({ member: e, canManage: t, canTransfer: n, onRemove: r, onTransfer: l }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card member-card", children: [
    /* @__PURE__ */ s.jsx("div", { className: "avatar", children: Qu(...(e.displayName || "").split(" ")) }),
    /* @__PURE__ */ s.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "text-sm", style: { fontWeight: 650 }, children: e.displayName }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: 6, marginTop: 4 }, children: [
        /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral member-role", children: e.role }),
        e.registered ? null : /* @__PURE__ */ s.jsx("span", { className: "text-xs muted", children: "Invited" })
      ] })
    ] }),
    t && e.role !== "owner" ? /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": `Remove ${e.displayName}`, onClick: () => r(e.id), children: /* @__PURE__ */ s.jsx(b, { name: "x", cls: "icon-sm" }) }) : null,
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
function Qh({ api: e, toast: t, familyId: n }) {
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
function qh({ api: e, toast: t, myUserId: n, familyId: r }) {
  const [l, a] = y.useState(null), [i, o] = y.useState(""), c = y.useRef(null), u = y.useRef(!1), h = y.useCallback(async () => {
    try {
      const { messages: f } = await e.get(`/api/chat/${r}/messages`), g = c.current, N = g ? g.scrollTop + g.clientHeight >= g.scrollHeight - 40 : !0;
      a(f), requestAnimationFrame(() => {
        c.current && (N || !u.current) && (c.current.scrollTop = c.current.scrollHeight, u.current = !0);
      });
    } catch {
      a((f) => f === null ? [] : f);
    }
  }, [e, r]);
  y.useEffect(() => {
    u.current = !1, a(null), h();
    const f = setInterval(h, 6e3);
    return () => clearInterval(f);
  }, [h]);
  async function m(f) {
    f.preventDefault();
    const g = i.trim();
    if (g) {
      o("");
      try {
        await e.post(`/api/chat/${r}/messages`, { body: g }), h();
      } catch (N) {
        t(N.message, "error");
      }
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { style: { marginBottom: "var(--sp-3)" }, children: /* @__PURE__ */ s.jsx(Qh, { api: e, toast: t, familyId: r }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "chat-window", children: [
      /* @__PURE__ */ s.jsx("div", { className: "chat-messages", ref: c, children: l === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
        /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
        " Loading messages…"
      ] }) : l.length === 0 ? /* @__PURE__ */ s.jsx("div", { className: "empty-state", children: /* @__PURE__ */ s.jsx("p", { children: "No messages yet. Say hello." }) }) : l.map((f) => /* @__PURE__ */ s.jsx(Yh, { message: f, myId: n }, f.id)) }),
      /* @__PURE__ */ s.jsxs("form", { className: "chat-input-row", onSubmit: m, children: [
        /* @__PURE__ */ s.jsx(
          "input",
          {
            className: "input",
            placeholder: "Message the circle…",
            style: { flex: 1 },
            autoComplete: "off",
            value: i,
            onChange: (f) => o(f.target.value)
          }
        ),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-icon", type: "submit", "aria-label": "Send", children: /* @__PURE__ */ s.jsx(b, { name: "send", cls: "icon-sm" }) })
      ] })
    ] })
  ] });
}
function Yh({ message: e, myId: t }) {
  const n = e.authorId === t;
  return /* @__PURE__ */ s.jsxs("div", { className: `chat-bubble-row ${n ? "self" : ""}`, children: [
    n ? null : /* @__PURE__ */ s.jsx("div", { className: "avatar avatar-sm", children: Qu(...e.authorName.split(" ")) }),
    /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("div", { className: "chat-bubble", children: e.body }),
      /* @__PURE__ */ s.jsxs("div", { className: "chat-meta", children: [
        n ? "" : e.authorName + " · ",
        Ur(e.createdAt)
      ] })
    ] })
  ] });
}
function Kh({ api: e, familyId: t }) {
  const [n, r] = y.useState(null), [l, a] = y.useState(""), [i, o] = y.useState(""), c = y.useCallback(async () => {
    const { items: f } = await e.get(`/api/family/${t}/shopping`);
    r(f);
  }, [e, t]);
  y.useEffect(() => {
    r(null), c();
  }, [c]);
  async function u(f) {
    f.preventDefault(), l.trim() && (await e.post(`/api/family/${t}/shopping`, { name: l, quantity: i }), a(""), o(""), c());
  }
  async function h(f) {
    await e.patch(`/api/family/${t}/shopping/${f.id}`, { done: !f.done }), c();
  }
  async function m(f) {
    await e.del(`/api/family/${t}/shopping/${f}`), c();
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
          onChange: (f) => a(f.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx(
        "input",
        {
          className: "input",
          placeholder: "Qty",
          style: { width: 90 },
          value: i,
          onChange: (f) => o(f.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", children: /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }) })
    ] }),
    n.length ? /* @__PURE__ */ s.jsx("div", { className: "stack", children: n.map((f) => /* @__PURE__ */ s.jsxs("div", { className: `shopping-item ${f.done ? "done" : ""}`, children: [
      /* @__PURE__ */ s.jsx("button", { className: `row-check ${f.done ? "checked" : ""}`, onClick: () => h(f), children: /* @__PURE__ */ s.jsx(b, { name: "check" }) }),
      /* @__PURE__ */ s.jsxs("div", { className: "shopping-name", style: { flex: 1 }, children: [
        f.name,
        " ",
        f.quantity ? /* @__PURE__ */ s.jsxs("span", { className: "muted text-xs", children: [
          "(",
          f.quantity,
          ")"
        ] }) : null
      ] }),
      /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": "Remove", onClick: () => m(f.id), children: /* @__PURE__ */ s.jsx(b, { name: "x", cls: "icon-sm" }) })
    ] }, f.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "List is empty." })
  ] });
}
const Gh = {
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
}, Zh = { icon: "timeline" };
function Xh({ event: e }) {
  const t = Gh[e.type] || Zh, n = t.accent ? `module-accent--${t.accent}` : "module-accent--none", r = /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx(b, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", style: { whiteSpace: "normal", fontWeight: 500 }, children: e.summary }),
      /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: Ur(e.createdAt) })
    ] })
  ] });
  return e.link ? /* @__PURE__ */ s.jsx("a", { className: `row-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ s.jsx("div", { className: `row-item ${n}`, children: r });
}
function Jh({ api: e, familyId: t }) {
  const [n, r] = y.useState(null), [l, a] = y.useState(null), i = y.useCallback(() => {
    r(null), a(null), e.get(`/api/family/${t}/activity`).then(({ activity: o }) => r(o)).catch((o) => a(o));
  }, [e, t]);
  return y.useEffect(() => {
    i();
  }, [i]), /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", children: [
    /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: "Activity" }),
    l ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load activity" }),
      /* @__PURE__ */ s.jsx("p", { children: l.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Try again" })
    ] }) : n === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) : n.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: n.map((o) => /* @__PURE__ */ s.jsx(Xh, { event: o }, o.id)) }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No activity yet." })
  ] });
}
const At = [
  ["overview", "Overview"],
  ["members", "Members"],
  ["chat", "Chat"],
  ["shopping", "Shopping list"],
  ["activity", "Activity"]
];
let jo = null, No = "overview";
function ep({ ctx: e }) {
  var v;
  const { api: t, toast: n, state: r } = e, { families: l, loading: a, error: i, refetch: o } = Ih(t, r), [c, u] = y.useState(jo), [h, m] = y.useState(No);
  function f(x) {
    jo = x, u(x);
  }
  function g(x) {
    No = x, m(x);
  }
  function N(x) {
    var M;
    const k = At.findIndex(([O]) => O === h);
    let C = null;
    if (x.key === "ArrowRight" ? C = (k + 1) % At.length : x.key === "ArrowLeft" ? C = (k - 1 + At.length) % At.length : x.key === "Home" ? C = 0 : x.key === "End" && (C = At.length - 1), C === null) return;
    x.preventDefault();
    const T = At[C][0];
    g(T), (M = document.getElementById(`family-tab-${T}`)) == null || M.focus();
  }
  y.useEffect(() => {
    l.length && !l.some((x) => x.id === c) && f(l[0].id);
  }, [l]), y.useEffect(() => {
    const x = document.getElementById(`family-tab-${h}`);
    Gu(x && x.parentElement, x);
  }, [h, l]);
  function j() {
    Rh({
      api: t,
      toast: n,
      onCreated: (x) => {
        f(x.id), o();
      }
    });
  }
  function w() {
    Fh({
      api: t,
      toast: n,
      onJoined: (x) => {
        f(x.id), o();
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
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: i.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: o, children: "Try again" })
    ] }) });
  if (!l.length)
    return /* @__PURE__ */ s.jsx(Ph, { onCreate: j, onJoin: w, extra: /* @__PURE__ */ s.jsx(xo, { api: t, toast: n, onChanged: o }) });
  const p = l.find((x) => x.id === c) || l[0], d = (v = p.members.find((x) => x.userId === r.user.id)) == null ? void 0 : v.role;
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
            onChange: (x) => f(Number(x.target.value)),
            children: l.map((x) => /* @__PURE__ */ s.jsx("option", { value: x.id, children: x.name }, x.id))
          }
        ) : null,
        /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: w, children: "Join with a code" }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: j, children: [
          /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
          " New family"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx(xo, { api: t, toast: n, onChanged: o }),
    /* @__PURE__ */ s.jsx("div", { className: "tabs family-tabs-wrap module-accent--warmth", role: "tablist", "aria-label": "Circle sections", onKeyDown: N, children: At.map(([x, k]) => /* @__PURE__ */ s.jsx(
      "div",
      {
        id: `family-tab-${x}`,
        className: `tab ${h === x ? "active" : ""}`,
        role: "tab",
        "aria-selected": h === x,
        "aria-controls": `family-panel-${x}`,
        tabIndex: h === x ? 0 : -1,
        onClick: () => g(x),
        children: k
      },
      x
    )) }),
    /* @__PURE__ */ s.jsxs("div", { id: `family-panel-${h}`, role: "tabpanel", "aria-labelledby": `family-tab-${h}`, tabIndex: 0, children: [
      h === "overview" ? /* @__PURE__ */ s.jsx(zh, { api: t, toast: n, familyId: p.id, family: p, myRole: d, onChanged: o }) : null,
      h === "members" ? /* @__PURE__ */ s.jsx(Wh, { api: t, toast: n, familyId: p.id, family: p, myRole: d, onChanged: o }) : null,
      h === "chat" ? /* @__PURE__ */ s.jsx(qh, { api: t, toast: n, myUserId: r.user.id, familyId: p.id }) : null,
      h === "shopping" ? /* @__PURE__ */ s.jsx(Kh, { api: t, familyId: p.id }) : null,
      h === "activity" ? /* @__PURE__ */ s.jsx(Jh, { api: t, familyId: p.id }) : null
    ] })
  ] });
}
function tp(e) {
  const [t, n] = y.useState([]), [r, l] = y.useState(null), [a, i] = y.useState([]), [o, c] = y.useState(!0), [u, h] = y.useState(null), m = y.useCallback(async () => {
    c(!0), h(null);
    try {
      const [f, g] = await Promise.all([e.get("/api/bills"), e.get("/api/bills/stats")]);
      n(f.bills), l(g.stats), i(g.overdue);
    } catch (f) {
      h(f);
    } finally {
      c(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    m();
  }, [m]), { bills: t, stats: r, overdue: a, loading: o, error: u, refetch: m };
}
const np = { rent: "building" };
function sp({ bill: e, onEdit: t, onMarkPaid: n }) {
  const r = e.status === "unpaid" && e.daysUntilDue < 0;
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ s.jsxs("button", { className: "row-item-btn row", onClick: () => t(e), children: [
      /* @__PURE__ */ s.jsx("div", { className: "bill-cat-icon", children: /* @__PURE__ */ s.jsx(b, { name: np[e.category] || "bill", cls: "icon-sm" }) }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.name }),
        /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
          /* @__PURE__ */ s.jsx("span", { style: { textTransform: "capitalize" }, children: e.category }),
          /* @__PURE__ */ s.jsx("span", { children: Ge(e.dueDate) }),
          e.status === "unpaid" ? /* @__PURE__ */ s.jsx("span", { className: `badge ${r ? "badge-critical" : "badge-neutral"}`, children: ai(e.daysUntilDue) }) : /* @__PURE__ */ s.jsx("span", { className: "badge badge-success", children: "Paid" })
        ] })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "bill-amount", children: Wt(e.amount, e.currency) })
    ] }),
    e.status === "unpaid" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => n(e.id), children: "Mark paid" }) : null
  ] });
}
function rp({ byCategory: e, currency: t }) {
  const n = Object.entries(e).sort((l, a) => a[1] - l[1]);
  if (!n.length) return /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No data yet." });
  const r = Math.max(...n.map((l) => l[1]));
  return /* @__PURE__ */ s.jsx(s.Fragment, { children: n.map(([l, a]) => /* @__PURE__ */ s.jsxs("div", { className: "category-bar-row", children: [
    /* @__PURE__ */ s.jsx("span", { className: "cat-label", children: l }),
    /* @__PURE__ */ s.jsx("div", { className: "category-bar-track", children: /* @__PURE__ */ s.jsx("div", { className: "category-bar-fill", style: { width: `${a / r * 100}%` } }) }),
    /* @__PURE__ */ s.jsx("span", { className: "cat-amount", children: Wt(a, t) })
  ] }, l)) });
}
function lp({ bills: e }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--danger-400)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Overdue bills" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "row-list", children: e.map((t) => /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ s.jsx("div", { className: "row-title", children: t.name }),
        /* @__PURE__ */ s.jsx("div", { className: "row-meta", children: ai(t.daysUntilDue) })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "bill-amount", children: Wt(t.amount, t.currency) })
    ] }, t.id)) })
  ] });
}
function ap({ state: e }) {
  return e ? e.unavailable ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", children: [
    /* @__PURE__ */ s.jsx(b, { name: "info", cls: "icon-sm" }),
    " AI insights require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo."
  ] }) }) : e.loading ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Analyzing your spending…"
  ] }) }) : e.error ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsx("p", { className: "field-error", children: e.error }) }) : /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)", borderColor: "var(--brand-soft-border)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
      /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
      " AI insights"
    ] }) }),
    /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: "6px" }, children: e.data.insights.map((t, n) => /* @__PURE__ */ s.jsx("li", { className: "text-sm", children: t }, n)) })
  ] }) : null;
}
const ip = ["electricity", "water", "internet", "phone", "rent", "subscription", "insurance", "loan", "other"], op = ["none", "weekly", "monthly", "yearly"];
function cp({ existing: e }) {
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
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "category", defaultValue: e == null ? void 0 : e.category, children: ip.map((t) => /* @__PURE__ */ s.jsx("option", { value: t, children: t }, t)) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Recurrence" }),
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "recurrence", defaultValue: e == null ? void 0 : e.recurrence, children: op.map((t) => /* @__PURE__ */ s.jsx("option", { value: t, children: t }, t)) })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Due date" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", type: "date", name: "dueDate", required: !0, defaultValue: (e == null ? void 0 : e.dueDate) || "" })
    ] }),
    /* @__PURE__ */ s.jsx(Xu, { existing: e == null ? void 0 : e.reminder, hint: "For a bill that repeats, the reminder moves to the next due date each time you pay it." }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Notes" }),
      /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "notes", defaultValue: e && e.notes || "" })
    ] })
  ] });
}
function wo({ api: e, toast: t, existing: n, onSaved: r }) {
  let l = null;
  ve({
    title: n ? "Edit bill" : "Add a bill",
    bodyHtml: '<div id="bill-form-mount"></div>',
    footerHtml: `
    ${n ? '<button class="btn btn-danger" id="delete-bill-btn" style="margin-right:auto">Delete</button>' : ""}
    <button class="btn" data-close>Cancel</button>
    <button class="btn btn-primary" id="save-bill-btn">${n ? "Save changes" : "Add bill"}</button>
  `,
    onMount: (i) => {
      l = de(i.querySelector("#bill-form-mount")), l.render(y.createElement(cp, { existing: n })), document.getElementById("save-bill-btn").addEventListener("click", async () => {
        const c = document.getElementById("bill-form"), u = Object.fromEntries(new FormData(c).entries()), h = {
          name: u.name.trim(),
          amount: Number(u.amount),
          currency: u.currency || "EUR",
          category: u.category,
          recurrence: u.recurrence,
          dueDate: u.dueDate,
          notes: u.notes || null,
          reminder: Zu(u.reminder)
        };
        try {
          n ? await e.patch(`/api/bills/${n.id}`, h) : await e.post("/api/bills", h), t(n ? "Bill updated" : "Bill added", "success"), ae(), r();
        } catch (m) {
          t(m.message, "error");
        }
      });
      const o = document.getElementById("delete-bill-btn");
      o && o.addEventListener("click", async () => {
        await Ee({ title: "Delete bill?", message: `"${n.name}" will be permanently deleted.`, confirmLabel: "Delete" }) && (await e.del(`/api/bills/${n.id}`), t("Bill deleted", "success"), r());
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
function up({ ctx: e }) {
  var w, p;
  const { api: t, toast: n, state: r } = e, { bills: l, stats: a, overdue: i, loading: o, error: c, refetch: u } = tp(t), [h, m] = y.useState(null);
  async function f(d) {
    try {
      await t.post(`/api/bills/${d}/pay`, {}), n("Marked as paid", "success"), u();
    } catch (v) {
      n(v.message, "error");
    }
  }
  function g() {
    wo({ api: t, toast: n, existing: null, onSaved: u });
  }
  function N(d) {
    wo({ api: t, toast: n, existing: d, onSaved: u });
  }
  async function j() {
    if (!r.aiConfigured) {
      m({ unavailable: !0 });
      return;
    }
    m({ loading: !0 });
    try {
      const d = await t.post("/api/bills/insights", {});
      if (!d.ok) {
        m({ error: d.error });
        return;
      }
      m({ data: d.data });
    } catch (d) {
      m({ error: d.message });
    }
  }
  return o ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading BillSense…"
  ] }) }) : c ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
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
        /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: j, children: [
          /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
          " AI insights"
        ] }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: g, children: [
          /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
          " Add bill"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "stat-row", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: (w = a.monthlyTotals) != null && w.length ? a.monthlyTotals.map((d) => Wt(d.total, d.currency)).join(" + ") : Wt(a.monthlyTotal, a.currency) }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Monthly total" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: (p = a.paidThisMonth) != null && p.length ? a.paidThisMonth.map((d) => Wt(d.total, d.currency)).join(" + ") : Wt(0) }),
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
    /* @__PURE__ */ s.jsx(ap, { state: h }),
    /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--money", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
          "All bills",
          l.length ? ` (${l.length})` : ""
        ] }),
        l.length ? /* @__PURE__ */ s.jsx("div", { className: "row-list", children: l.map((d) => /* @__PURE__ */ s.jsx(sp, { bill: d, onEdit: N, onMarkPaid: f }, d.id)) }) : /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
          /* @__PURE__ */ s.jsx(b, { name: "bill", cls: "icon-lg" }),
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
          /* @__PURE__ */ s.jsx(rp, { byCategory: a.byCategory, currency: a.currency })
        ] }),
        i.length ? /* @__PURE__ */ s.jsx(lp, { bills: i }) : null
      ] })
    ] })
  ] });
}
function dp(e) {
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
function mp() {
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
function fp({ api: e, toast: t, goalId: n, onSaved: r }) {
  let l = null;
  ve({
    title: "Add a milestone",
    bodyHtml: '<div id="ms-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="ms-save">Add</button>',
    onMount: (a) => {
      l = de(a.querySelector("#ms-form-mount")), l.render(y.createElement(mp)), document.getElementById("ms-save").addEventListener("click", async () => {
        const i = document.getElementById("ms-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.title.trim()) return t("Title is required.", "error");
        await e.post(`/api/goals/${n}/milestones`, { title: o.title.trim(), dueDate: o.dueDate || null }), ae(), r();
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
const hp = 14;
function pp(e) {
  if (!e) return null;
  const t = new Date((/* @__PURE__ */ new Date()).toDateString()), n = Math.round((/* @__PURE__ */ new Date(`${e}T00:00:00`) - t) / 864e5);
  return n < 0 ? { cls: "is-overdue", label: `Overdue — was ${Ge(e)}` } : n <= hp ? { cls: "is-approaching", label: `Target: ${Ge(e)}` } : { cls: "is-future", label: `Target: ${Ge(e)}` };
}
function ko({ goal: e, api: t, toast: n, state: r, onChanged: l, expanded: a, onToggle: i }) {
  const [o, c] = y.useState(!1), [u, h] = y.useState(!1), m = y.useRef(null);
  y.useEffect(() => {
    a && m.current && m.current.focus(), a || c(!1);
  }, [a]);
  const f = e.milestones.length, g = e.milestones.filter((E) => E.done).length, N = f ? Math.round(g / f * 100) : 0, j = e.milestones.find((E) => !E.done) || null, w = e.milestones.find((E) => !E.done && E.id !== (j == null ? void 0 : j.id)) || null, p = w ? [w] : [], d = new Set([j, ...p].filter(Boolean).map((E) => E.id)), v = e.milestones.filter((E) => !d.has(E.id)), x = pp(e.targetDate), k = `goal-detail-${e.id}`, C = `goal-milestones-${e.id}`;
  async function T(E, ee) {
    await t.patch(`/api/goals/${e.id}/milestones/${E}`, { done: !ee }), l();
  }
  async function M() {
    await Ee({ title: "Delete goal?", message: "This cannot be undone.", confirmLabel: "Delete" }) && (await t.del(`/api/goals/${e.id}`), l());
  }
  async function O() {
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
    /* @__PURE__ */ s.jsxs("button", { className: "row-item goal-row-toggle", "aria-expanded": a, "aria-controls": k, onClick: () => i(e.id), children: [
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
          /* @__PURE__ */ s.jsx("span", { children: f ? `${g} of ${f} milestones` : "No milestones yet" }),
          j ? /* @__PURE__ */ s.jsxs("span", { children: [
            "Next: ",
            j.title
          ] }) : f ? /* @__PURE__ */ s.jsx("span", { children: "All milestones complete" }) : null,
          x ? /* @__PURE__ */ s.jsx("span", { className: `goal-target ${x.cls}`, children: x.label }) : null
        ] })
      ] }),
      f ? /* @__PURE__ */ s.jsx("div", { className: "progress-track goal-row-progress", "aria-hidden": "true", children: /* @__PURE__ */ s.jsx("div", { className: "progress-fill", style: { width: `${N}%` } }) }) : null,
      /* @__PURE__ */ s.jsx("span", { className: "goal-row-pct text-xs muted", "aria-hidden": "true", children: f ? `${N}%` : "—" }),
      /* @__PURE__ */ s.jsx(b, { name: "chevron", cls: `icon-sm goal-row-chevron ${a ? "is-open" : ""}` })
    ] }),
    a ? /* @__PURE__ */ s.jsxs("div", { className: "goal-detail", id: k, children: [
      /* @__PURE__ */ s.jsxs("h3", { className: "visually-hidden", tabIndex: -1, ref: m, children: [
        e.title,
        " — details"
      ] }),
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsxs("div", { className: "row-between text-xs muted", style: { marginBottom: 4 }, children: [
          /* @__PURE__ */ s.jsx("span", { children: f ? `${g} of ${f} milestones done` : "No milestones yet" }),
          /* @__PURE__ */ s.jsx("span", { children: f ? `${N}%` : null })
        ] }),
        f ? /* @__PURE__ */ s.jsx("div", { className: "progress-track", role: "progressbar", "aria-valuenow": N, "aria-valuemin": "0", "aria-valuemax": "100", "aria-label": `${e.title} progress`, children: /* @__PURE__ */ s.jsx("div", { className: "progress-fill", style: { width: `${N}%` } }) }) : null,
        x ? /* @__PURE__ */ s.jsx("div", { className: `goal-target ${x.cls}`, style: { marginTop: 4 }, children: x.label }) : null
      ] }),
      j ? /* @__PURE__ */ s.jsxs("div", { className: "goal-detail-next", children: [
        /* @__PURE__ */ s.jsx("button", { className: "row-check", onClick: () => T(j.id, j.done), "aria-label": `Mark "${j.title}" as done`, children: /* @__PURE__ */ s.jsx(b, { name: "check", cls: "icon-sm" }) }),
        /* @__PURE__ */ s.jsxs("span", { className: "milestone-title", children: [
          "Next: ",
          j.title
        ] })
      ] }) : f ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { color: "var(--accent-600)" }, children: "All milestones complete." }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "Add a milestone, or ask AI to suggest a few." }),
      p.length ? /* @__PURE__ */ s.jsx("div", { className: "stack", style: { gap: 6 }, children: p.map((E) => /* @__PURE__ */ s.jsxs("div", { className: "milestone-row", children: [
        /* @__PURE__ */ s.jsx("button", { className: "row-check", onClick: () => T(E.id, E.done), "aria-label": `Mark "${E.title}" as done`, children: /* @__PURE__ */ s.jsx(b, { name: "check", cls: "icon-sm" }) }),
        /* @__PURE__ */ s.jsx("span", { className: "milestone-title", children: E.title })
      ] }, E.id)) }) : null,
      v.length ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm goal-show-all", "aria-expanded": o, "aria-controls": C, onClick: () => c((E) => !E), children: o ? "Show fewer" : `Show all (${v.length} more)` }) : null,
      o && v.length ? /* @__PURE__ */ s.jsx("div", { className: "stack", id: C, style: { gap: 6, marginTop: 6 }, children: v.map((E) => /* @__PURE__ */ s.jsxs("div", { className: `milestone-row ${E.done ? "done" : ""}`, children: [
        /* @__PURE__ */ s.jsx(
          "button",
          {
            className: `row-check ${E.done ? "checked" : ""}`,
            onClick: () => T(E.id, E.done),
            "aria-label": `Mark "${E.title}" as ${E.done ? "not done" : "done"}`,
            children: /* @__PURE__ */ s.jsx(b, { name: "check", cls: "icon-sm" })
          }
        ),
        /* @__PURE__ */ s.jsx("span", { className: "milestone-title", children: E.title })
      ] }, E.id)) }) : null,
      /* @__PURE__ */ s.jsxs("div", { className: "row goal-detail-actions", style: { gap: 6 }, children: [
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: () => fp({ api: t, toast: n, goalId: e.id, onSaved: l }), children: [
          /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
          " Milestone"
        ] }),
        f ? null : /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: u, onClick: O, children: u ? /* @__PURE__ */ s.jsx("span", { className: "spinner" }) : /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
          " Suggest with AI"
        ] }) }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm btn-ghost", style: { marginLeft: "auto" }, onClick: M, children: [
          /* @__PURE__ */ s.jsx(b, { name: "trash", cls: "icon-sm" }),
          " Delete goal"
        ] })
      ] })
    ] }) : null
  ] });
}
const vp = ["learning", "fitness", "financial", "career", "habit", "personal"];
function gp() {
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
        /* @__PURE__ */ s.jsx("select", { className: "select", name: "category", children: vp.map((e) => /* @__PURE__ */ s.jsx("option", { value: e, children: e }, e)) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Target date" }),
        /* @__PURE__ */ s.jsx("input", { className: "input", type: "date", name: "targetDate" })
      ] })
    ] })
  ] });
}
function yp({ api: e, toast: t, onSaved: n }) {
  let r = null;
  ve({
    title: "New goal",
    bodyHtml: '<div id="goal-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="goal-save">Create goal</button>',
    onMount: (l) => {
      r = de(l.querySelector("#goal-form-mount")), r.render(y.createElement(gp)), document.getElementById("goal-save").addEventListener("click", async () => {
        const a = document.getElementById("goal-form"), i = Object.fromEntries(new FormData(a).entries());
        if (!i.title.trim()) return t("Title is required.", "error");
        try {
          await e.post("/api/goals", { title: i.title.trim(), description: i.description || null, category: i.category, targetDate: i.targetDate || null }), t("Goal created", "success"), ae(), n();
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
function xp({ ctx: e }) {
  const { api: t, toast: n, state: r, params: l } = e, { goals: a, loading: i, error: o, refetch: c } = dp(t), [u, h] = y.useState(() => {
    const j = l && l[0], w = j ? Number(j) : null;
    return Number.isFinite(w) && w > 0 ? w : null;
  });
  y.useEffect(() => {
    u != null && !i && !a.some((j) => j.id === u) && (h(null), history.replaceState(null, "", "#/goals"));
  }, [a, i, u]);
  function m() {
    yp({ api: t, toast: n, onSaved: c });
  }
  function f(j) {
    h((w) => {
      const p = w === j ? null : j;
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
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: o.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: c, children: "Retry" })
    ] }) });
  const g = a.filter((j) => j.status === "active"), N = a.filter((j) => j.status !== "active");
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Goals" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Learning, fitness, financial and personal goals — broken into real steps." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: m, children: [
        /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
        " New goal"
      ] }) })
    ] }),
    g.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
        g.length,
        " active goal",
        g.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: g.map((j) => /* @__PURE__ */ s.jsx(ko, { goal: j, api: t, toast: n, state: r, onChanged: c, expanded: u === j.id, onToggle: f }, j.id)) })
    ] }) : /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "goal", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No goals yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Set a learning, fitness, financial or personal goal and break it into milestones." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: m, children: "Add a goal" })
    ] }) }),
    N.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--warmth", style: { marginTop: "var(--sp-6)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: "Completed / inactive" }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: N.map((j) => /* @__PURE__ */ s.jsx(ko, { goal: j, api: t, toast: n, state: r, onChanged: c, expanded: u === j.id, onToggle: f }, j.id)) })
    ] }) : null
  ] });
}
const ed = {
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
}, jp = {
  0: "On the last day",
  1: "1 day before",
  3: "3 days before",
  7: "1 week before",
  14: "2 weeks before",
  30: "1 month before",
  60: "2 months before",
  90: "3 months before"
}, td = 1600, nd = Math.floor(1e6 * 4 / 3), Np = 15 * 1048576, wp = (e) => e.type === "application/pdf" || /\.pdf$/i.test(e.name || "");
async function kp(e) {
  const t = await import(
    /* @vite-ignore */
    `${window.location.origin}/vendor/pdfjs/pdf.min.mjs`
  );
  t.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
  const n = t.getDocument({ data: new Uint8Array(e), isEvalSupported: !1, enableXfa: !1, disableAutoFetch: !0, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", wasmUrl: "/vendor/pdfjs/wasm/" });
  try {
    const r = await n.promise, l = await r.getPage(1), a = l.getViewport({ scale: 1 }), i = l.getViewport({ scale: td / Math.max(a.width, a.height) }), o = document.createElement("canvas");
    o.width = Math.round(i.width), o.height = Math.round(i.height);
    const c = o.getContext("2d");
    return c.fillStyle = "#fff", c.fillRect(0, 0, o.width, o.height), await l.render({ canvas: o, canvasContext: c, viewport: i }).promise, { canvas: o, pages: r.numPages };
  } finally {
    await n.destroy();
  }
}
async function Sp(e) {
  let t, n = {};
  if (wp(e)) {
    if (e.size > Np) throw Object.assign(new Error("too large"), { tooLarge: !0 });
    const l = await kp(await e.arrayBuffer());
    t = l.canvas, n = { pages: l.pages, isPdf: !0 };
  } else {
    const l = await createImageBitmap(e), a = Math.min(1, td / Math.max(l.width, l.height));
    t = document.createElement("canvas"), t.width = Math.max(1, Math.round(l.width * a)), t.height = Math.max(1, Math.round(l.height * a));
    const i = t.getContext("2d");
    i.fillStyle = "#fff", i.fillRect(0, 0, t.width, t.height), i.drawImage(l, 0, 0, t.width, t.height), l.close();
  }
  let r = "";
  for (const l of [0.88, 0.78, 0.66, 0.52])
    if (r = t.toDataURL("image/jpeg", l), r.length - r.indexOf(",") - 1 <= nd) break;
  return { contentType: "image/jpeg", data: r.slice(r.indexOf(",") + 1), preview: r, ...n };
}
const gl = (e) => ({ contentType: e.contentType, data: e.data });
function Vs(e) {
  return !e || !e.isPdf ? null : e.pages > 1 ? `A PDF of ${e.pages} pages. Only this first page is read and kept: if the dates are on another page, enter them yourself.` : "A PDF. This picture of its page is what is read and kept; the file itself is not stored.";
}
const So = { alignSelf: "flex-start", maxWidth: "100%", width: "auto", height: "auto", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }, bp = { title: "", kind: "other", issuer: "", issuedOn: "", expiresOn: "", notes: "" };
function Cp({ api: e, toast: t, mode: n, existing: r, options: l, onCancel: a, onDone: i }) {
  const [o, c] = y.useState(
    () => r ? { title: r.title, kind: r.kind, issuer: r.issuer || "", issuedOn: r.issuedOn || "", expiresOn: r.expiresOn || "", notes: r.notes || "" } : bp
  ), [u, h] = y.useState(() => r ? r.reminderDays : l.defaultReminderDays.other), [m, f] = y.useState(!!r), [g, N] = y.useState(null), [j, w] = y.useState(!0), [p, d] = y.useState(n === "scan" ? "choose" : null), [v, x] = y.useState(!1), [k, C] = y.useState(null), [T, M] = y.useState([]), [O, E] = y.useState(!1), [ee, Pe] = y.useState(null), [Ue, $] = y.useState(!1), [Q, z] = y.useState(r ? r.files : []), ge = y.useRef(null), D = y.useRef(null), I = y.useRef(null), P = (_) => (A) => c((ie) => ({ ...ie, [_]: A.target.value })), U = n === "scan", Z = !U || p === "read", en = l.scan.provider || "the AI service", Ve = ee !== null && ee === o.expiresOn;
  y.useEffect(() => {
    Z && I.current && !r && I.current.focus();
  }, [Z, r]);
  function In(_) {
    const A = _.target.value;
    c((ie) => ({ ...ie, kind: A })), m || h(l.defaultReminderDays[A] || []);
  }
  function rt(_) {
    f(!0), h((A) => A.includes(_) ? A.filter((ie) => ie !== _) : [...A, _].sort((ie, Pn) => Pn - ie));
  }
  async function Pt(_) {
    try {
      const A = await Sp(_);
      return A.data.length > nd ? (t("That picture is too detailed to store. Take it a little further away, or crop it.", "error"), null) : A;
    } catch (A) {
      return console.error("[documents] the chosen file could not be opened:", A && `${A.name}: ${A.message}` || "error"), t(A && A.tooLarge ? "That PDF is too large to open here. Take a photo of the page with the dates instead." : "That file could not be opened. Choose a photo or a PDF.", "error"), null;
    }
  }
  async function Vr(_) {
    const A = _.target.files && _.target.files[0];
    if (_.target.value = "", !A) return;
    const ie = await Pt(A);
    ie && (N(ie), U && (d("ready"), C(null), E(!1), Pe(null), M([])));
  }
  async function yd() {
    d("reading");
    try {
      const _ = await e.post("/api/documents/scan", { file: gl(g), consent: !0 });
      if (!_.ok) {
        t(_.error, "error"), M(["The picture could not be read automatically. Enter the details from the document yourself."]), C(null), d("read");
        return;
      }
      const A = _.suggestion;
      c({ title: A.title || "", kind: A.kind, issuer: A.issuer || "", issuedOn: A.issuedOn || "", expiresOn: A.expiresOn || "", notes: "" }), h(A.reminderDays), M(A.warnings), C(_.ticket), d("read");
    } catch (_) {
      t(_.message, "error"), d("ready");
    }
  }
  async function xd(_) {
    if (_.preventDefault(), Ue) return;
    $(!0);
    const A = {
      title: o.title,
      kind: o.kind,
      issuer: o.issuer || null,
      issuedOn: o.issuedOn || null,
      expiresOn: o.expiresOn || null,
      notes: o.notes || null,
      reminderDays: u
    };
    try {
      r ? (await e.patch(`/api/documents/${r.id}`, A), i("Document saved")) : (k && (A.scan = { ticket: k, confirmed: { details: O, expiresOn: ee === null ? void 0 : ee || null } }), g && j && (A.file = gl(g)), await e.post("/api/documents", A), i(o.expiresOn ? "Document saved. You will be reminded before it runs out." : "Document saved"));
    } catch (ie) {
      t(ie.message, "error"), $(!1);
    }
  }
  async function jd(_) {
    const A = _.target.files && _.target.files[0];
    if (_.target.value = "", !A) return;
    const ie = await Pt(A);
    if (ie)
      try {
        const Pn = await e.post(`/api/documents/${r.id}/files`, { file: gl(ie) });
        z(Pn.document.files), t("Picture added", "success");
      } catch (Pn) {
        t(Pn.message || "That file could not be added.", "error");
      }
  }
  async function Nd(_) {
    if (await Ee({ title: "Remove this picture?", message: "The document and its reminders stay.", confirmLabel: "Remove" }))
      try {
        await e.del(`/api/documents/${r.id}/files/${_.id}`), z((A) => A.filter((ie) => ie.id !== _.id));
      } catch (A) {
        t(A.message, "error");
      }
  }
  async function wd(_) {
    try {
      await e.patch(`/api/documents/${r.id}`, { status: _ }), i(_ === "archived" ? "Archived: no more reminders for it" : "Back among your documents");
    } catch (A) {
      t(A.message, "error");
    }
  }
  async function kd() {
    if (await Ee({ title: "Delete this document?", message: `"${r.title}", its pictures and its reminders will be deleted for good.`, confirmLabel: "Delete" }))
      try {
        await e.del(`/api/documents/${r.id}`), i("Document deleted");
      } catch (_) {
        t(_.message, "error");
      }
  }
  const Sd = r ? "Document" : U ? "Scan a document" : "Add a document", bd = !!o.title.trim() && (!k || O && Ve) && !Ue;
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-4)" }, children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: Sd }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: a, children: "Close" })
    ] }),
    U && p !== "read" ? /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Photograph the document with the camera, or choose a photo or a PDF you already have. Nothing is saved until you have checked what was read and confirmed it." }),
      g ? /* @__PURE__ */ s.jsx("img", { src: g.preview, alt: "The document you chose", style: { ...So, maxHeight: 320 } }) : null,
      Vs(g) ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: Vs(g) }) : null,
      /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ s.jsx("input", { ref: D, type: "file", accept: "image/*", capture: "environment", onChange: Vr, hidden: !0 }),
        /* @__PURE__ */ s.jsx("input", { ref: ge, type: "file", accept: "image/*,application/pdf", onChange: Vr, hidden: !0 }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", disabled: p === "reading", onClick: () => D.current.click(), children: "Use the camera" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", disabled: p === "reading", onClick: () => ge.current.click(), children: "Choose a photo or PDF" })
      ] }),
      g ? /* @__PURE__ */ s.jsxs("div", { className: "stack", style: { gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { alignItems: "flex-start" }, children: [
          /* @__PURE__ */ s.jsx("input", { id: "scan-consent", type: "checkbox", checked: v, onChange: (_) => x(_.target.checked), disabled: p === "reading" }),
          /* @__PURE__ */ s.jsxs("span", { children: [
            "Send this picture to ",
            /* @__PURE__ */ s.jsx("strong", { children: en }),
            " to be read. Everything visible on it goes with it: on a passport or an identity card that is your name, your photograph and your numbers. LifeAdmin keeps none of it unless you save the document."
          ] })
        ] }),
        /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: 'Rather not? Close this and use "Add a document": type the name and the date yourself, and nothing is sent anywhere.' }),
        /* @__PURE__ */ s.jsx("div", { children: /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "button", disabled: !v || p === "reading", onClick: yd, children: p === "reading" ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
          " Reading…"
        ] }) : "Read the document" }) })
      ] }) : null
    ] }) : null,
    Z ? /* @__PURE__ */ s.jsxs("form", { className: "stack", onSubmit: xd, children: [
      U ? /* @__PURE__ */ s.jsxs("div", { className: "stack", role: "status", children: [
        k ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { fontWeight: 600 }, children: "This was read from the picture by a machine. Compare each field with the document, above all the dates." }) : null,
        T.length ? /* @__PURE__ */ s.jsx("ul", { className: "text-sm", style: { margin: 0, paddingLeft: "var(--sp-4)", color: "var(--warning-600)" }, children: T.map((_) => /* @__PURE__ */ s.jsx("li", { children: _ }, _)) }) : null,
        g ? /* @__PURE__ */ s.jsx("img", { src: g.preview, alt: "The document you chose", style: { ...So, maxHeight: 420 } }) : null,
        Vs(g) ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: Vs(g) }) : null
      ] }) : null,
      /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-title", children: "Name" }),
          /* @__PURE__ */ s.jsx("input", { id: "doc-title", ref: I, className: "input", maxLength: 120, required: !0, value: o.title, onChange: P("title"), placeholder: "e.g. Car insurance" })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-kind", children: "Kind" }),
          /* @__PURE__ */ s.jsx("select", { id: "doc-kind", className: "select", value: o.kind, onChange: In, children: l.kinds.map((_) => /* @__PURE__ */ s.jsx("option", { value: _, children: ed[_] || _ }, _)) })
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-expires", children: "Valid until" }),
          /* @__PURE__ */ s.jsx("input", { id: "doc-expires", className: "input", type: "date", value: o.expiresOn, onChange: P("expiresOn") }),
          /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "The last day it is valid. Without it there is nothing to remind you of." })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-issued", children: "Issued or bought on" }),
          /* @__PURE__ */ s.jsx("input", { id: "doc-issued", className: "input", type: "date", value: o.issuedOn, onChange: P("issuedOn") })
        ] })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-issuer", children: "Issued by" }),
        /* @__PURE__ */ s.jsx("input", { id: "doc-issuer", className: "input", maxLength: 120, value: o.issuer, onChange: P("issuer"), placeholder: "An insurer, a shop, an office" })
      ] }),
      /* @__PURE__ */ s.jsxs("fieldset", { className: "field", style: { border: 0, padding: 0, margin: 0 }, disabled: !o.expiresOn, children: [
        /* @__PURE__ */ s.jsx("legend", { className: "field-label", children: "Remind me" }),
        /* @__PURE__ */ s.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "var(--sp-2) var(--sp-4)" }, children: [...l.reminderDayChoices].sort((_, A) => A - _).map((_) => /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
          /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: u.includes(_), onChange: () => rt(_) }),
          jp[_] || `${_} days before`
        ] }, _)) }),
        o.expiresOn ? null : /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Enter the last day of validity to choose reminders." })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "doc-notes", children: "Note" }),
        /* @__PURE__ */ s.jsx("textarea", { id: "doc-notes", className: "textarea", maxLength: 1e3, value: o.notes, onChange: P("notes"), placeholder: "Where the original is kept, what is needed to renew it" }),
        /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Do not write the document's number here: a reminder does not need it." })
      ] }),
      r ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("span", { className: "field-label", children: "Pictures" }),
        /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-3)", flexWrap: "wrap", alignItems: "flex-start" }, children: [
          Q.map((_) => /* @__PURE__ */ s.jsxs("div", { className: "stack", style: { gap: "var(--sp-1)" }, children: [
            /* @__PURE__ */ s.jsx("a", { href: _.url, target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ s.jsx("img", { src: _.url, alt: `Picture of ${r.title}`, style: { width: 180, maxHeight: 180, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" } }) }),
            /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: () => Nd(_), children: "Remove" })
          ] }, _.id)),
          Q.length < l.room.maxFilesPerDocument ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
            /* @__PURE__ */ s.jsx("input", { ref: ge, type: "file", accept: "image/*,application/pdf", onChange: jd, hidden: !0 }),
            /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", type: "button", onClick: () => ge.current.click(), children: [
              /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
              " Add a photo or a PDF page"
            ] })
          ] }) : null
        ] })
      ] }) : U ? g ? /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: j, onChange: (_) => w(_.target.checked) }),
        "Keep the picture with the document"
      ] }) : null : /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("span", { className: "field-label", children: "Photo or PDF page (optional)" }),
        /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }, children: [
          g ? /* @__PURE__ */ s.jsx("img", { src: g.preview, alt: "The picture you chose", style: { width: 120, maxHeight: 120, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" } }) : null,
          /* @__PURE__ */ s.jsx("input", { ref: ge, type: "file", accept: "image/*,application/pdf", onChange: Vr, hidden: !0 }),
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: () => ge.current.click(), children: g ? "Choose another" : "Add a photo or PDF" }),
          g ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "button", onClick: () => N(null), children: "Remove" }) : null
        ] }),
        /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Kept here only; it is not sent anywhere to be read." })
      ] }),
      k ? /* @__PURE__ */ s.jsxs("fieldset", { className: "stack", style: { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "var(--sp-3)", margin: 0, gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("legend", { className: "field-label", style: { padding: "0 var(--sp-1)" }, children: "Before saving" }),
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { fontWeight: 600 }, children: [
          /* @__PURE__ */ s.jsx("input", { id: "confirm-details", type: "checkbox", checked: O, onChange: (_) => E(_.target.checked) }),
          "The name and the kind are right"
        ] }),
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", style: { fontWeight: 600 }, children: [
          /* @__PURE__ */ s.jsx("input", { id: "confirm-date", type: "checkbox", checked: Ve, onChange: (_) => Pe(_.target.checked ? o.expiresOn : null) }),
          o.expiresOn ? /* @__PURE__ */ s.jsxs("span", { children: [
            "The document is valid until ",
            /* @__PURE__ */ s.jsx("strong", { children: Ge(o.expiresOn) }),
            " (",
            o.expiresOn,
            "): I checked this date on the document"
          ] }) : /* @__PURE__ */ s.jsx("span", { children: "This document has no last day of validity: there will be no reminder" })
        ] })
      ] }) : null,
      /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", alignItems: "center" }, children: [
        r ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-danger", type: "button", onClick: kd, children: "Delete" }),
          /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", onClick: () => wd(r.status === "archived" ? "active" : "archived"), style: { marginRight: "auto" }, children: r.status === "archived" ? "Take out of the archive" : "Archive" })
        ] }) : null,
        /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", onClick: a, children: "Cancel" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", disabled: !bd, children: Ue ? "Saving…" : r ? "Save changes" : "Save document" }),
        k && !(O && Ve) ? /* @__PURE__ */ s.jsx("span", { className: "text-sm muted", children: "Tick both boxes above to save." }) : null
      ] })
    ] }) : null
  ] });
}
const Ep = [
  ["expired", "Expired"],
  ["soon", "Running out within 30 days"],
  ["valid", "Valid"],
  ["undated", "No expiry date"],
  ["archived", "Archived"]
];
function Tp(e) {
  return e.state === "archived" ? "Archived" : e.daysLeft === null ? "No date" : e.daysLeft < 0 ? e.daysLeft === -1 ? "Expired yesterday" : `Expired ${-e.daysLeft} days ago` : e.daysLeft === 0 ? "Last day today" : e.daysLeft === 1 ? "1 day left" : e.daysLeft < 60 ? `${e.daysLeft} days left` : e.daysLeft < 730 ? `${Math.round(e.daysLeft / 30)} months left` : `${Math.floor(e.daysLeft / 365)} years left`;
}
const Dp = { expired: "badge-critical", soon: "badge-warning", valid: "badge-success", undated: "badge-neutral", archived: "badge-neutral" };
function Lp({ doc: e, onOpen: t }) {
  return /* @__PURE__ */ s.jsx("div", { className: "row-item", children: /* @__PURE__ */ s.jsxs("button", { className: "row-item-btn row", onClick: () => t(e), children: [
    /* @__PURE__ */ s.jsx("div", { className: "bill-cat-icon", children: /* @__PURE__ */ s.jsx(b, { name: "document", cls: "icon-sm" }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.title }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { children: ed[e.kind] || e.kind }),
        e.issuer ? /* @__PURE__ */ s.jsx("span", { children: e.issuer }) : null,
        e.expiresOn ? /* @__PURE__ */ s.jsxs("span", { children: [
          "Valid until ",
          Ge(e.expiresOn)
        ] }) : null,
        e.files.length ? /* @__PURE__ */ s.jsx("span", { children: e.files.length === 1 ? "1 file" : `${e.files.length} files` }) : null
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("span", { className: `badge ${Dp[e.state]}`, children: Tp(e) })
  ] }) });
}
function Mp({ ctx: e }) {
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
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: a.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: u, children: "Try again" })
    ] }) });
  if (!r)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading documents…"
    ] }) });
  const h = r.documents, m = (g) => h.filter((N) => N.state === g).length, f = (g) => {
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
          /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
          " Scan a document"
        ] }) : null,
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => c({ mode: "manual" }), children: [
          /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
          " Add a document"
        ] })
      ] })
    ] }),
    o ? /* @__PURE__ */ s.jsx(
      Cp,
      {
        api: t,
        toast: n,
        mode: o.existing ? "edit" : o.mode,
        existing: o.existing || null,
        options: r,
        onCancel: () => c(null),
        onDone: f
      },
      o.existing ? `edit-${o.existing.id}` : o.mode
    ) : null,
    o ? null : /* @__PURE__ */ s.jsxs("div", { className: "stat-row", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: m("expired") }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Expired" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: m("soon") }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Within 30 days" })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ s.jsx("div", { className: "stat-value", children: m("valid") }),
        /* @__PURE__ */ s.jsx("div", { className: "stat-label", children: "Valid" })
      ] })
    ] }),
    !o && !h.length ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "document", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No documents yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Add the first one: the passport, the car's insurance, a warranty. You will be reminded before it runs out." })
    ] }) : null,
    o ? null : Ep.map(([g, N]) => {
      const j = h.filter((w) => w.state === g);
      return j.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region", style: { marginTop: "var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
          N,
          " (",
          j.length,
          ")"
        ] }),
        /* @__PURE__ */ s.jsx("div", { className: "row-list", children: j.map((w) => /* @__PURE__ */ s.jsx(Lp, { doc: w, onOpen: (p) => c({ existing: p }) }, w.id)) })
      ] }, g) : null;
    })
  ] });
}
function _p(e) {
  const [t, n] = y.useState([]), [r, l] = y.useState(null), [a, i] = y.useState(0), [o, c] = y.useState(!0), [u, h] = y.useState(null), m = y.useCallback(async () => {
    c(!0), h(null);
    try {
      const [f, g] = await Promise.all([e.get("/api/ecolife/summary"), e.get("/api/ecolife")]);
      l(f.summary), i(f.totalLogs), n(g.logs);
    } catch (f) {
      h(f);
    } finally {
      c(!1);
    }
  }, [e]);
  return y.useEffect(() => {
    m();
  }, [m]), { logs: t, summary: r, totalLogs: a, loading: o, error: u, refetch: m };
}
const $p = { transport: "refresh", energy: "sun", food: "cart", shopping: "cart", waste: "trash", water: "refresh" };
function Ip({ log: e, onDelete: t }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ s.jsx("div", { className: "eco-cat-icon", style: { width: 32, height: 32 }, children: /* @__PURE__ */ s.jsx(b, { name: $p[e.category] || "eco", cls: "icon-sm" }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.action }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { style: { textTransform: "capitalize" }, children: e.category }),
        e.quantity ? /* @__PURE__ */ s.jsxs("span", { children: [
          e.quantity,
          e.unit ? ` ${e.unit}` : ""
        ] }) : null,
        /* @__PURE__ */ s.jsx("span", { children: Ur(e.logged_at) })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": "Delete", onClick: () => t(e.id), children: /* @__PURE__ */ s.jsx(b, { name: "x", cls: "icon-sm" }) })
  ] });
}
function Pp({ state: e }) {
  return e ? e.unavailable ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", children: [
    /* @__PURE__ */ s.jsx(b, { name: "info", cls: "icon-sm" }),
    " AI tips require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo."
  ] }) }) : e.loading ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Finding practical suggestions for you…"
  ] }) }) : e.error ? /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ s.jsx("p", { className: "field-error", children: e.error }) }) : /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)", borderColor: "var(--brand-soft-border)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
      /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
      " Suggestions for you"
    ] }) }),
    /* @__PURE__ */ s.jsx("div", { className: "stack", children: e.data.tips.map((t, n) => /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("strong", { className: "text-sm", style: { textTransform: "capitalize" }, children: t.area }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: t.tip })
    ] }, n)) })
  ] }) : null;
}
const Ap = ["transport", "energy", "food", "shopping", "waste", "water"], Rp = { transport: "Transport", energy: "Energy", food: "Food", shopping: "Shopping", waste: "Waste", water: "Water" };
function Op() {
  return /* @__PURE__ */ s.jsxs("form", { id: "eco-form", className: "stack", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Category" }),
      /* @__PURE__ */ s.jsx("select", { className: "select", name: "category", children: Ap.map((e) => /* @__PURE__ */ s.jsx("option", { value: e, children: Rp[e] }, e)) })
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
function bo({ api: e, toast: t, onSaved: n }) {
  let r = null;
  ve({
    title: "Log an eco action",
    bodyHtml: '<div id="eco-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="eco-save">Log it</button>',
    onMount: (l) => {
      r = de(l.querySelector("#eco-form-mount")), r.render(y.createElement(Op)), document.getElementById("eco-save").addEventListener("click", async () => {
        const a = document.getElementById("eco-form"), i = Object.fromEntries(new FormData(a).entries());
        if (!i.action.trim()) return t("Describe the action.", "error");
        const o = { category: i.category, action: i.action.trim(), quantity: i.quantity ? Number(i.quantity) : null, unit: i.unit || null };
        try {
          await e.post("/api/ecolife", o), t("Logged", "success"), ae(), n();
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
const Fp = ["transport", "energy", "food", "shopping", "waste", "water"], zp = { transport: "refresh", energy: "sun", food: "cart", shopping: "cart", waste: "trash", water: "refresh" }, Bp = { transport: "Transport", energy: "Energy", food: "Food", shopping: "Shopping", waste: "Waste", water: "Water" };
function Up({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { logs: l, summary: a, totalLogs: i, loading: o, error: c, refetch: u } = _p(t), [h, m] = y.useState(null);
  async function f(N) {
    await Ee({ title: "Delete this log?", message: "This entry will be permanently removed.", confirmLabel: "Delete" }) && (await t.del(`/api/ecolife/${N}`), u());
  }
  async function g() {
    if (!r.aiConfigured) {
      m({ unavailable: !0 });
      return;
    }
    m({ loading: !0 });
    try {
      const N = await t.post("/api/ecolife/tips", {});
      if (!N.ok) {
        m({ error: N.error });
        return;
      }
      m({ data: N.data });
    } catch (N) {
      m({ error: N.message });
    }
  }
  return o ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading EcoLife…"
  ] }) }) : c ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
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
          /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
          " Get tips"
        ] }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => bo({ api: t, toast: n, onSaved: u }), children: [
          /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
          " Log an action"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsx(Pp, { state: h }),
    /* @__PURE__ */ s.jsx("div", { className: "grid-3", style: { marginBottom: "var(--sp-6)" }, children: Fp.map((N) => /* @__PURE__ */ s.jsxs("div", { className: "card eco-cat-card", children: [
      /* @__PURE__ */ s.jsx("div", { className: "eco-cat-icon", children: /* @__PURE__ */ s.jsx(b, { name: zp[N], cls: "icon" }) }),
      /* @__PURE__ */ s.jsx("div", { style: { fontWeight: 700, fontSize: "var(--fs-lg)" }, children: a[N].count }),
      /* @__PURE__ */ s.jsxs("div", { className: "muted text-xs", children: [
        Bp[N],
        " logs"
      ] })
    ] }, N)) }),
    l.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--nature", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
        i,
        " logged in the last 30 days"
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: l.slice(0, 15).map((N) => /* @__PURE__ */ s.jsx(Ip, { log: N, onDelete: f }, N.id)) }),
      l.length > 15 ? /* @__PURE__ */ s.jsx("p", { className: "muted text-xs", style: { marginTop: "var(--sp-2)" }, children: "Showing the 15 most recent." }) : null
    ] }) : /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "eco", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No logs yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "Log small everyday actions — taking the bus, recycling, a meatless meal — to see patterns and get tips." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: () => bo({ api: t, toast: n, onSaved: u }), children: "Log an action" })
    ] }) })
  ] });
}
function Vp(e) {
  const t = {};
  for (const n of e) {
    const r = n.createdAt.slice(0, 10), l = qu(r);
    t[l] || (t[l] = []), t[l].push(n);
  }
  return t;
}
const Wp = {
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
}, Hp = { icon: "timeline" };
function Qp({ event: e }) {
  const t = Wp[e.type] || Hp, n = t.accent ? `module-accent--${t.accent}` : "", r = /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx("span", { className: "timeline-time", children: Yu(e.createdAt.replace(" ", "T") + "Z") }),
    /* @__PURE__ */ s.jsx(b, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ s.jsx("span", { className: "text-sm", children: e.summary })
  ] });
  return e.link ? /* @__PURE__ */ s.jsx("a", { className: `timeline-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ s.jsx("div", { className: `timeline-item ${n}`, children: r });
}
function qp({ ctx: e }) {
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
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load your timeline" }),
      /* @__PURE__ */ s.jsx("p", { children: l.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Try again" })
    ] }) : n === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading timeline…"
    ] }) : n.length === 0 ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "timeline", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Nothing here yet" }),
      /* @__PURE__ */ s.jsx("p", { children: "As you complete tasks, pay bills, and make decisions, they'll show up here." })
    ] }) : Object.entries(Vp(n)).map(([o, c]) => /* @__PURE__ */ s.jsxs("div", { className: "timeline-day", children: [
      /* @__PURE__ */ s.jsx("div", { className: "timeline-day-label", children: o }),
      c.map((u) => /* @__PURE__ */ s.jsx(Qp, { event: u }, u.id))
    ] }, o)) })
  ] });
}
function Yp(e) {
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
function Co({ decision: e }) {
  return /* @__PURE__ */ s.jsxs("a", { className: "row-item", href: `#/decisionflow/${e.id}`, style: { textDecoration: "none" }, children: [
    /* @__PURE__ */ s.jsx(
      "div",
      {
        className: "row-check",
        style: {
          pointerEvents: "none",
          ...e.status === "decided" ? { background: "var(--accent-500)", borderColor: "var(--accent-500)", color: "#fff" } : {}
        },
        children: /* @__PURE__ */ s.jsx(b, { name: e.status === "decided" ? "check" : "decision", cls: "icon-sm" })
      }
    ),
    /* @__PURE__ */ s.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ s.jsx("div", { className: "row-title", children: e.question }),
      /* @__PURE__ */ s.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ s.jsx("span", { children: Ge(e.createdAt) }),
        e.status === "decided" ? /* @__PURE__ */ s.jsx("span", { className: "badge badge-success", children: "Decided" }) : /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: "Open" })
      ] })
    ] })
  ] });
}
function Kp() {
  return /* @__PURE__ */ s.jsx("form", { id: "decision-form", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "What are you trying to decide?" }),
    /* @__PURE__ */ s.jsx("textarea", { className: "textarea", name: "question", placeholder: "Should I buy this laptop? Should I move apartments? Should I take this job?", required: !0 })
  ] }) });
}
function Eo({ api: e, toast: t }) {
  let n = null;
  ve({
    title: "Start a new decision",
    bodyHtml: '<div id="decision-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="save-decision-btn">Start</button>',
    onMount: (r) => {
      n = de(r.querySelector("#decision-form-mount")), n.render(y.createElement(Kp)), document.getElementById("save-decision-btn").addEventListener("click", async () => {
        const l = document.querySelector("#decision-form [name=question]").value.trim();
        if (!l) return t("Describe the decision first.", "error");
        try {
          const { decision: a } = await e.post("/api/decisions", { question: l });
          ae(), location.hash = `#/decisionflow/${a.id}`;
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
function Gp({ ctx: e }) {
  const { api: t, toast: n } = e, { decisions: r, loading: l, error: a, refetch: i } = Yp(t);
  if (l)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading decisions…"
    ] }) });
  if (a)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
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
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => Eo({ api: t, toast: n }), children: [
        /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
        " New decision"
      ] }) })
    ] }),
    o.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--reasoning", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "list-region-heading", children: [
        o.length,
        " open decision",
        o.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: o.map((u) => /* @__PURE__ */ s.jsx(Co, { decision: u }, u.id)) })
    ] }) : /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "decision", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "No open decisions" }),
      /* @__PURE__ */ s.jsx("p", { children: "Describe something you're trying to decide — LifeAdmin will help you weigh it clearly." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: () => Eo({ api: t, toast: n }), children: "Start a decision" })
    ] }) }),
    c.length ? /* @__PURE__ */ s.jsxs("div", { className: "list-region module-accent--reasoning", style: { marginTop: "var(--sp-6)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "list-region-heading", children: "Decided" }),
      /* @__PURE__ */ s.jsx("div", { className: "row-list", children: c.map((u) => /* @__PURE__ */ s.jsx(Co, { decision: u }, u.id)) })
    ] }) : null
  ] });
}
function Zp(e, t) {
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
function Xp({ criterion: e, onSetWeight: t }) {
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
function Jp({ scored: e, isTop: t, decisionStatus: n, onDecide: r, onDelete: l }) {
  const a = t && e.percent >= 50;
  return /* @__PURE__ */ s.jsxs("div", { className: `option-card ${a ? "recommended" : ""}`, style: { marginBottom: "var(--sp-3)" }, children: [
    a ? /* @__PURE__ */ s.jsx("div", { className: "option-rank-badge", children: "Recommended" }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "row-between", children: [
      /* @__PURE__ */ s.jsx("strong", { className: "text-sm", children: e.name }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: 6 }, children: [
        n !== "decided" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => r(e.id), children: "Choose this" }) : null,
        /* @__PURE__ */ s.jsx("button", { className: "icon-btn", "aria-label": "Remove", onClick: () => l(e.id), children: /* @__PURE__ */ s.jsx(b, { name: "x", cls: "icon-sm" }) })
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
function ev() {
  return /* @__PURE__ */ s.jsx("form", { id: "opt-form", children: /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Option name" }),
    /* @__PURE__ */ s.jsx("input", { className: "input", name: "name", required: !0 })
  ] }) });
}
function tv({ api: e, toast: t, decisionId: n, onSaved: r }) {
  let l = null;
  ve({
    title: "Add an option",
    bodyHtml: '<div id="opt-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opt-save">Add</button>',
    onMount: (a) => {
      l = de(a.querySelector("#opt-form-mount")), l.render(y.createElement(ev)), document.getElementById("opt-save").addEventListener("click", async () => {
        const i = document.querySelector("#opt-form [name=name]").value.trim();
        if (!i) return t("Name is required.", "error");
        await e.post(`/api/decisions/${n}/options`, { name: i }), ae(), r();
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
function nv() {
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
function sv({ api: e, toast: t, decisionId: n, onSaved: r }) {
  let l = null;
  ve({
    title: "Add a criterion",
    bodyHtml: '<div id="crit-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="crit-save">Add</button>',
    onMount: (a) => {
      l = de(a.querySelector("#crit-form-mount")), l.render(y.createElement(nv)), document.getElementById("crit-save").addEventListener("click", async () => {
        const i = document.getElementById("crit-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.name.trim()) return t("Name is required.", "error");
        await e.post(`/api/decisions/${n}/criteria`, { name: o.name.trim(), weight: Number(o.weight) }), ae(), r();
      });
    },
    onClose: () => {
      l && (l.unmount(), l = null);
    }
  });
}
const rv = { high: "badge-success", medium: "badge-medium", low: "badge-low" };
function lv({ ctx: e, id: t }) {
  const { api: n, toast: r, state: l } = e, { decision: a, criteria: i, options: o, scoring: c, loading: u, error: h, refetch: m } = Zp(n, t), [f, g] = y.useState(!1);
  async function N(x, k) {
    await n.patch(`/api/decisions/${t}/criteria/${x}`, { weight: k }), m();
  }
  async function j(x) {
    await n.post(`/api/decisions/${t}/decide`, { optionId: x }), r("Decision recorded", "success"), m();
  }
  async function w(x) {
    await Ee({ title: "Remove option?", message: "Its pros, cons and ratings will be lost.", confirmLabel: "Remove" }) && (await n.del(`/api/decisions/${t}/options/${x}`), m());
  }
  async function p() {
    await Ee({ title: "Delete this decision?", message: "This cannot be undone.", confirmLabel: "Delete" }) && (await n.del(`/api/decisions/${t}`), r("Decision deleted", "success"), location.hash = "#/decisionflow");
  }
  async function d() {
    if (!l.aiConfigured) return r("AI is not configured on this server. Add ANTHROPIC_API_KEY to enable analysis.", "error");
    if (!o.length) return r("Add at least one option first.", "error");
    g(!0);
    try {
      const x = await n.post(`/api/decisions/${t}/analyze`, { options: o.map((k) => k.name) });
      if (!x.ok) {
        r(x.error, "error");
        return;
      }
      r("Analysis complete", "success"), m();
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
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this decision" }),
      /* @__PURE__ */ s.jsx("p", { children: h.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: m, children: "Retry" })
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
        /* @__PURE__ */ s.jsxs("button", { className: "btn", disabled: f, onClick: d, children: [
          f ? /* @__PURE__ */ s.jsx("span", { className: "spinner" }) : /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
          " ",
          f ? "Analyzing…" : "Analyze with AI"
        ] }),
        /* @__PURE__ */ s.jsxs("button", { className: "btn btn-ghost", onClick: p, children: [
          /* @__PURE__ */ s.jsx(b, { name: "trash", cls: "icon-sm" }),
          " Delete"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "card card-pad module-accent--reasoning", children: [
          /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Options" }),
            /* @__PURE__ */ s.jsxs("button", { className: "btn btn-sm", onClick: () => tv({ api: n, toast: r, decisionId: t, onSaved: m }), children: [
              /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
              " Add option"
            ] })
          ] }),
          /* @__PURE__ */ s.jsx("div", { className: "stack", id: "options-list", children: o.length ? c.ranked.map((x, k) => /* @__PURE__ */ s.jsx(
            Jp,
            {
              scored: x,
              isTop: k === 0,
              decisionStatus: a.status,
              onDecide: j,
              onDelete: w
            },
            x.id
          )) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "Add at least two options to compare." }) })
        ] }),
        a.recommendation ? /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--brand-soft-border)" }, children: [
          /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ s.jsxs("span", { className: "card-title", children: [
              /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
              " AI reasoning"
            ] }),
            /* @__PURE__ */ s.jsxs("span", { className: `badge ${rv[a.recommendation.confidence] || "badge-low"}`, children: [
              a.recommendation.confidence,
              " confidence"
            ] })
          ] }),
          /* @__PURE__ */ s.jsx("p", { className: "text-sm", children: a.recommendation.reasoningSummary || "" }),
          a.recommendation.missingInfo && a.recommendation.missingInfo.length ? /* @__PURE__ */ s.jsxs("div", { style: { marginTop: "var(--sp-3)" }, children: [
            /* @__PURE__ */ s.jsx("strong", { className: "text-xs", children: "What would improve confidence:" }),
            /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: 4, marginTop: 6 }, children: a.recommendation.missingInfo.map((x, k) => /* @__PURE__ */ s.jsx("li", { className: "text-sm muted", children: x }, k)) })
          ] }) : null
        ] }) : null
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "card card-pad module-accent--reasoning", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
          /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Criteria & weights" }),
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => sv({ api: n, toast: r, decisionId: t, onSaved: m }), children: /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }) })
        ] }),
        i.length ? i.map((x) => /* @__PURE__ */ s.jsx(Xp, { criterion: x, onSetWeight: N }, x.id)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No criteria yet — add some or use AI analysis." }),
        /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: "Weights are yours to set. Scoring math is always computed locally, never guessed by AI." })
      ] })
    ] })
  ] });
}
function av({ ctx: e }) {
  const t = e.params && e.params[0];
  return t ? /* @__PURE__ */ s.jsx(lv, { ctx: e, id: Number(t) }) : /* @__PURE__ */ s.jsx(Gp, { ctx: e });
}
const iv = [
  "Organize my week",
  "What needs my attention today?",
  "I have too much going on, help me prioritize",
  "What can I change to save money this month?"
];
function ov({ api: e, toast: t }) {
  const [n, r] = y.useState(null), [l, a] = y.useState(""), [i, o] = y.useState(!1), c = y.useRef(null);
  y.useEffect(() => {
    let m = !1;
    return e.get("/api/ai/chat/history").then(({ messages: f }) => {
      m || r(f);
    }).catch((f) => {
      m || (r([]), t(f.message || "Could not load your conversation history.", "error"));
    }), () => {
      m = !0;
    };
  }, [e, t]), y.useEffect(() => {
    c.current && (c.current.scrollTop = c.current.scrollHeight);
  }, [n, i]);
  async function u(m) {
    if (!(!m || i)) {
      a(""), r((f) => [...f || [], { role: "user", content: m }]), o(!0);
      try {
        const f = await e.post("/api/ai/chat", { message: m });
        if (!f.ok) {
          t(f.error, "error"), r((g) => g.slice(0, -1)), a(m);
          return;
        }
        r((g) => [...g, { role: "assistant", content: f.data.reply, suggestions: f.data.suggestions }]);
      } catch (f) {
        t(f.message, "error"), r((g) => g.slice(0, -1)), a(m);
      } finally {
        o(!1);
      }
    }
  }
  function h(m) {
    m.preventDefault(), u(l.trim());
  }
  return /* @__PURE__ */ s.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ s.jsxs("div", { className: "assistant-shell", children: [
    /* @__PURE__ */ s.jsx("div", { className: "assistant-messages", ref: c, "aria-live": "polite", "aria-relevant": "additions", children: n === null ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading conversation…"
    ] }) : n.length === 0 && !i ? /* @__PURE__ */ s.jsxs("div", { className: "assistant-empty", children: [
      /* @__PURE__ */ s.jsx(b, { name: "assistant", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { style: { marginTop: "var(--sp-2)" }, children: "How can I help with your week?" }),
      /* @__PURE__ */ s.jsx("div", { className: "assistant-prompt-grid", children: iv.map((m) => /* @__PURE__ */ s.jsx("button", { className: "assistant-prompt-chip", onClick: () => u(m), children: m }, m)) })
    ] }) : /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      n.map((m, f) => /* @__PURE__ */ s.jsxs("div", { className: `assistant-msg ${m.role}`, children: [
        /* @__PURE__ */ s.jsx("div", { className: "bubble", children: m.content }),
        m.suggestions && m.suggestions.length ? /* @__PURE__ */ s.jsx("div", { className: "assistant-suggestions", children: m.suggestions.map((g) => /* @__PURE__ */ s.jsx("button", { className: "pill", disabled: i, onClick: () => u(g), children: g }, g)) }) : null
      ] }, f)),
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
          onChange: (m) => a(m.target.value)
        }
      ),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-icon", type: "submit", "aria-label": "Send", disabled: i, children: /* @__PURE__ */ s.jsx(b, { name: "send", cls: "icon-sm" }) })
    ] })
  ] }) });
}
function cv({ ctx: e }) {
  const { api: t, toast: n } = e, [r, l] = y.useState(""), [a, i] = y.useState(!1), [o, c] = y.useState(null), [u, h] = y.useState(!1), [m, f] = y.useState(!1);
  async function g(j) {
    j.preventDefault();
    const w = r.trim();
    if (!(!w || a)) {
      i(!0), c(null), f(!1);
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
  async function N() {
    h(!0);
    const j = {};
    for (const [p, d] of Object.entries(o.preview))
      j[p] = {
        ...d,
        placed: d.placed.map((v) => ({
          ...v,
          startISO: (/* @__PURE__ */ new Date(`${p}T${v.start}:00`)).toISOString(),
          endISO: (/* @__PURE__ */ new Date(`${p}T${v.end}:00`)).toISOString()
        }))
      };
    const w = await t.post("/api/ai/plan/apply", { preview: j });
    n(`Added ${w.created} tasks to your schedule`, "success"), f(!0), h(!1);
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
          onChange: (j) => l(j.target.value)
        }
      ),
      /* @__PURE__ */ s.jsxs("button", { type: "submit", className: "btn btn-primary", style: { alignSelf: "flex-start" }, disabled: a, children: [
        /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
        " Build my plan"
      ] })
    ] }),
    /* @__PURE__ */ s.jsx("div", { style: { marginTop: "var(--sp-5)" }, children: a ? /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Reasoning about your week — protecting sleep, meals and rest…"
    ] }) : o != null && o.error ? /* @__PURE__ */ s.jsx("p", { className: "field-error", children: o.error }) : o ? /* @__PURE__ */ s.jsx(uv, { plan: o.plan, preview: o.preview, applying: u, applied: m, onApply: N }) : null })
  ] });
}
function uv({ plan: e, preview: t, applying: n, applied: r, onApply: l }) {
  const a = Object.keys(t).sort();
  return a.length ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
    /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Reasoning" }),
    /* @__PURE__ */ s.jsx("ul", { className: "stack", style: { gap: 4, marginBottom: "var(--sp-5)" }, children: (e.notes || []).length ? e.notes.map((i, o) => /* @__PURE__ */ s.jsx("li", { className: "text-sm muted", children: i }, o)) : /* @__PURE__ */ s.jsx("li", { className: "muted text-sm", children: "—" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "section-title", children: "Proposed schedule" }),
    a.map((i) => /* @__PURE__ */ s.jsxs("div", { className: "plan-preview-day", children: [
      /* @__PURE__ */ s.jsx("strong", { className: "text-sm", children: qu(i) }),
      t[i].placed.length ? t[i].placed.map((o, c) => /* @__PURE__ */ s.jsxs("div", { className: "plan-block", children: [
        /* @__PURE__ */ s.jsxs("span", { className: "plan-block-time", children: [
          o.start,
          "–",
          o.end
        ] }),
        /* @__PURE__ */ s.jsx("span", { children: o.label })
      ] }, c)) : /* @__PURE__ */ s.jsx("p", { className: "muted text-xs", children: "Nothing placed." }),
      t[i].warnings.map((o, c) => /* @__PURE__ */ s.jsxs("p", { className: "text-xs", style: { color: "var(--warning-600)" }, children: [
        /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-sm" }),
        " ",
        o
      ] }, c))
    ] }, i)),
    /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-3)" }, disabled: n || r, onClick: l, children: [
      n ? /* @__PURE__ */ s.jsx("span", { className: "spinner" }) : /* @__PURE__ */ s.jsx(b, { name: "check", cls: "icon-sm" }),
      " ",
      n ? "Adding…" : r ? "Added to your tasks" : "Add these to my tasks"
    ] })
  ] }) : /* @__PURE__ */ s.jsx("p", { className: "muted text-sm", children: "No schedulable activities were found in that description. Try mentioning specific things you want time for." });
}
function dv({ api: e }) {
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
function mv({ api: e, toast: t, aiConfigured: n }) {
  if (!n) return t("AI is not configured on this server.", "error");
  let r = null;
  ve({
    title: "Weekly review",
    bodyHtml: '<div id="weekly-review-mount"></div>',
    onMount: (l) => {
      r = de(l.querySelector("#weekly-review-mount")), r.render(y.createElement(dv, { api: e }));
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
const Rt = [
  ["chat", "Chat"],
  ["plan", "Plan my week"]
];
let To = "chat";
function fv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(To);
  function i(c) {
    To = c, a(c);
  }
  y.useEffect(() => {
    const c = document.getElementById(`assistant-tab-${l}`);
    Gu(c && c.parentElement, c);
  }, [l]);
  function o(c) {
    var f;
    const u = Rt.findIndex(([g]) => g === l);
    let h = null;
    if (c.key === "ArrowRight" ? h = (u + 1) % Rt.length : c.key === "ArrowLeft" ? h = (u - 1 + Rt.length) % Rt.length : c.key === "Home" ? h = 0 : c.key === "End" && (h = Rt.length - 1), h === null) return;
    c.preventDefault();
    const m = Rt[h][0];
    i(m), (f = document.getElementById(`assistant-tab-${m}`)) == null || f.focus();
  }
  return r.aiConfigured ? /* @__PURE__ */ s.jsxs("div", { className: "page assistant-page-flex", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Assistant" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Ask about your week, priorities, bills, or your circle — grounded only in your real data." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn", onClick: () => mv({ api: t, toast: n, aiConfigured: r.aiConfigured }), children: [
        /* @__PURE__ */ s.jsx(b, { name: "sparkle", cls: "icon-sm" }),
        " Weekly review"
      ] }) })
    ] }),
    /* @__PURE__ */ s.jsx("div", { className: "tabs", style: { marginBottom: "var(--sp-5)" }, role: "tablist", "aria-label": "Assistant views", onKeyDown: o, children: Rt.map(([c, u]) => /* @__PURE__ */ s.jsx(
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
        children: l === "chat" ? /* @__PURE__ */ s.jsx(ov, { api: t, toast: n }) : /* @__PURE__ */ s.jsx(cv, { ctx: e })
      }
    )
  ] }) : /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Assistant" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Your AI-powered life copilot." })
    ] }) }),
    /* @__PURE__ */ s.jsx("div", { className: "card", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "assistant", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "AI is not configured" }),
      /* @__PURE__ */ s.jsx("p", { children: "The assistant, natural-language planner, DecisionFlow analysis, and insights all need an ANTHROPIC_API_KEY set on the server. The rest of LifeAdmin works fully without it." })
    ] }) })
  ] });
}
function hv({ ctx: e }) {
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
function pv({ api: e, channel: t }) {
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
function vv({ api: e, toast: t, state: n, channel: r, onVerified: l }) {
  let a = null;
  ve({
    title: `Verify your ${r}`,
    bodyHtml: '<div id="verify-modal-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="verify-confirm-btn">Confirm</button>',
    onMount: (i) => {
      a = de(i.querySelector("#verify-modal-mount")), a.render(y.createElement(pv, { api: e, channel: r })), document.getElementById("verify-confirm-btn").addEventListener("click", async () => {
        const o = document.querySelector("#verify-form [name=code]");
        if (!o) return;
        const c = o.value.trim();
        if (!c) return t("Enter the code.", "error");
        const u = document.getElementById("verify-confirm-btn");
        u.disabled = !0;
        try {
          const h = await e.post(`/api/auth/verify/${r}/confirm`, { code: c });
          n.user = h.user, t(`${r} verified`, "success"), ae(), l();
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
function gv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(!1), [, i] = y.useState(0);
  async function o(u) {
    if (u.preventDefault(), l) return;
    const h = Object.fromEntries(new FormData(u.target).entries());
    a(!0);
    try {
      await t.post("/api/settings/password", h), n("Password updated", "success"), u.target.reset();
    } catch (m) {
      n(m.message, "error");
    } finally {
      a(!1);
    }
  }
  async function c(u) {
    if (u === "email") {
      try {
        const h = await t.post("/api/auth/verify-email/resend", {});
        n(h.alreadyVerified ? "Your email is already confirmed." : h.message, h.delivered === !1 ? "error" : "success");
      } catch (h) {
        n(h && h.message || "Could not send the link", "error");
      }
      return;
    }
    vv({ api: t, toast: n, state: r, channel: u, onVerified: () => i((h) => h + 1) });
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
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Email: we send a confirmation link to your address; it proves the address is yours and unlocks inviting people by email. Phone: real SMS needs a paid provider, so the phone check stays a demo (the code is shown to you here) and proves nothing." }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsx(Do, { channel: "phone", verified: r.user.phoneVerified, onVerify: c }),
        /* @__PURE__ */ s.jsx(Do, { channel: "email", verified: r.user.emailVerified, onVerify: c })
      ] })
    ] })
  ] });
}
function Do({ channel: e, verified: t, onVerify: n }) {
  return /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
    /* @__PURE__ */ s.jsxs("span", { className: `badge ${t ? "badge-success" : "badge-neutral"}`, children: [
      e,
      " ",
      t ? "verified" : "unverified"
    ] }),
    t ? null : /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => n(e), children: e === "email" ? "Send confirmation link" : "Verify now" })
  ] });
}
const yv = "/js/push.js", xv = () => import(
  /* @vite-ignore */
  yv
), jv = {
  install: "On an iPhone or iPad, notifications work only for an app on the Home Screen. Open the Share menu in Safari, choose “Add to Home Screen”, then open LifeAdmin from there and come back to this page.",
  unsupported: "This browser cannot receive notifications. Try Chrome, Firefox, Edge or Safari, up to date.",
  blocked: "Notifications from LifeAdmin are blocked in this browser. Allow them in the browser’s site settings (the icon next to the address), then reload this page.",
  server: "Notifications are not set up on this server yet."
};
function Nv({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(null), [i, o] = y.useState(null), [c, u] = y.useState(!1);
  if (y.useEffect(() => {
    let p = !0;
    return xv().then(async (d) => {
      const v = await d.status(t);
      p && (a(d), o(v));
    }).catch(() => p && o({ configured: !1, thisDevice: !1, devices: 0, failed: !0 })), () => {
      p = !1;
    };
  }, [t]), !l || !i)
    return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Notifications on this device" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: i && i.failed ? "Could not check this device. Reload the page to try again." : "Checking this device…" })
    ] });
  const h = l.obstacle(i), m = !h && i.thisDevice && Notification.permission === "granted", f = i.devices - (i.thisDevice ? 1 : 0);
  async function g(p, d) {
    u(!0);
    try {
      await p();
    } catch (v) {
      n(v && v.message || d, "error");
    } finally {
      u(!1);
    }
  }
  const N = () => g(async () => {
    const p = await l.enable(t, i.publicKey, r.user.id);
    p.ok ? (o({ ...i, thisDevice: p.thisDevice, devices: p.devices }), n("Notifications are on for this device", "success")) : (o({ ...i }), n(p.permission === "denied" ? "Notifications were blocked for this site" : "Notifications were not allowed", "error"));
  }, "Could not turn notifications on"), j = () => g(async () => {
    const p = await l.disable(t);
    o({ ...i, thisDevice: p.thisDevice, devices: p.devices }), n("Notifications are off for this device", "success");
  }, "Could not turn notifications off"), w = () => g(async () => {
    (await l.test(t)).ok ? n("Sent. It should appear in a few seconds.", "success") : (n("This device could not be reached. Turn notifications off and on again.", "error"), o(await l.status(t)));
  }, "Could not send the test");
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Notifications on this device" }),
      /* @__PURE__ */ s.jsx("span", { className: "text-sm muted", children: m ? "On" : "Off" })
    ] }),
    /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Get reminders and your circle’s activity on this phone or computer, even when LifeAdmin is closed. A notification never shows the content of a task, a bill or a message: you see it after you open the app." }),
    h ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", role: "status", children: jv[h] }) : m ? /* @__PURE__ */ s.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-secondary", onClick: w, disabled: c, children: "Send a test notification" }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-ghost", onClick: j, disabled: c, children: "Turn off on this device" })
    ] }) : /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", onClick: N, disabled: c, children: "Turn on notifications" }),
    /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: "Without notifications nothing is lost: every reminder is also kept in the bell inside the app, and Routines shows what was missed, for when you open LifeAdmin. A phone that is off, offline or in battery-saver mode may receive a notification late or not at all; on an iPhone this only works for the app added to the Home Screen." }),
    f > 0 && /* @__PURE__ */ s.jsxs("p", { className: "text-sm muted", style: { marginTop: "var(--sp-3)" }, children: [
      m ? "Also on" : "On for",
      " ",
      f,
      " other device",
      f === 1 ? "" : "s",
      " of yours. Each device is turned on and off on its own."
    ] })
  ] });
}
const wv = { 0: "On the day", 60: "1 hour before", 300: "5 hours before", 720: "12 hours before", 1440: "1 day before", 4320: "3 days before", 7200: "5 days before", 10080: "1 week before" }, kv = [
  ["taskTimed", "Tasks with a time"],
  ["taskDate", "Tasks with a date only"],
  ["bill", "Bills"],
  ["milestone", "Steps of a goal"],
  ["goal", "Goals without dated steps"]
];
function Sv() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}
function bv({ ctx: e }) {
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
  const o = Sv(), c = l.timezone || l.effectiveTimezone;
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
      kv.map(([u, h]) => /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `reminder-${u}`, children: h }),
        /* @__PURE__ */ s.jsxs(
          "select",
          {
            id: `reminder-${u}`,
            className: "input",
            value: l.defaults[u] === null ? "none" : String(l.defaults[u]),
            onChange: (m) => i({ defaults: { [u]: m.target.value === "none" ? null : Number(m.target.value) } }),
            children: [
              /* @__PURE__ */ s.jsx("option", { value: "none", children: "No reminder" }),
              l.offsets.map((m) => /* @__PURE__ */ s.jsx("option", { value: m, children: u === "taskTimed" && m === 0 ? "At the time" : wv[m] }, m))
            ]
          }
        )
      ] }, u))
    ] })
  ] });
}
const Cv = [
  ["task", "Task reminders & deadlines"],
  ["comment", "Comments on shared items"],
  ["chat", "Circle chat messages"],
  ["bill", "Bill due dates"]
];
function Ev({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [l, a] = y.useState(() => r.user.notifPrefs || {});
  async function i(o, c) {
    const u = { ...l, [o]: c };
    a(u), await t.patch("/api/settings/preferences", { notifPrefs: u }), r.user.notifPrefs = u, n("Preferences saved", "success");
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ s.jsx(Nv, { ctx: e }),
    /* @__PURE__ */ s.jsx(bv, { ctx: e }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Notification preferences" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Controls which in-app notifications (the bell icon) you receive. Turning one off stops that notification from being created for you." }),
      /* @__PURE__ */ s.jsx("div", { className: "stack", children: Cv.map(([o, c]) => /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ s.jsx(
          "input",
          {
            type: "checkbox",
            checked: l[o] !== !1,
            onChange: (u) => i(o, u.target.checked)
          }
        ),
        c
      ] }, o)) }),
      /* @__PURE__ */ s.jsxs("div", { className: "stack", style: { marginTop: "var(--sp-4)" }, children: [
        /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
          /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: l.richPush === !0, onChange: (o) => i("richPush", o.target.checked) }),
          "Show an encouraging line on my lock screen for goal reminders"
        ] }),
        /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", children: "Off by default: the lock screen then says only “Time for a small step toward your goal.” The line is a short, general sentence. It never contains your goal’s name; that stays inside the app." })
      ] })
    ] })
  ] });
}
function Tv(e) {
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
const Dv = ["system", "light", "dark"];
function Lv({ ctx: e }) {
  const { api: t, state: n } = e, [r, l] = y.useState(n.user.theme);
  async function a(i) {
    const { user: o } = await t.patch("/api/settings/preferences", { theme: i });
    n.user = o, Tv(i), l(i);
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Appearance" }) }),
    /* @__PURE__ */ s.jsx("div", { className: "row", style: { gap: "var(--sp-2)" }, children: Dv.map((i) => /* @__PURE__ */ s.jsx(
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
function Mv({ ctx: e }) {
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
function _v() {
  return /* @__PURE__ */ s.jsxs("form", { id: "delete-account-form", className: "stack", children: [
    /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { color: "var(--text-secondary)" }, children: "This permanently deletes your account and everything you own. This cannot be undone." }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", children: "Enter your password to confirm" }),
      /* @__PURE__ */ s.jsx("input", { className: "input", type: "password", name: "password", required: !0, autoFocus: !0 })
    ] })
  ] });
}
function $v({ api: e, toast: t }) {
  let n = null;
  ve({
    title: "Delete your account?",
    bodyHtml: '<div id="delete-account-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-danger" id="delete-account-confirm-btn">Delete everything</button>',
    onMount: (r) => {
      n = de(r.querySelector("#delete-account-mount")), n.render(y.createElement(_v)), document.getElementById("delete-account-confirm-btn").addEventListener("click", async () => {
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
function Iv({ ctx: e }) {
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
        /* @__PURE__ */ s.jsx(b, { name: "download", cls: "icon-sm" }),
        " Export as JSON"
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--danger-400)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", style: { color: "var(--danger-500)" }, children: "Delete account" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Permanently deletes your account and all associated data on this machine. This cannot be undone." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-danger", onClick: () => $v({ api: t, toast: n }), children: "Delete my account" })
    ] })
  ] });
}
function Pv({ ctx: e }) {
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
const Ot = [
  ["profile", "Profile", "family"],
  ["security", "Security", "settings"],
  ["notifications", "Notifications", "bell"],
  ["appearance", "Appearance", "sun"],
  ["ai", "AI preferences", "sparkle"],
  ["data", "Data", "download"],
  ["demo", "Demo mode", "star"]
];
let Lo = "profile";
function Av({ ctx: e }) {
  const [t, n] = y.useState(Lo);
  function r(i) {
    Lo = i, n(i);
  }
  function l(i) {
    var h;
    const o = Ot.findIndex(([m]) => m === t);
    let c = null;
    if (i.key === "ArrowDown" ? c = (o + 1) % Ot.length : i.key === "ArrowUp" ? c = (o - 1 + Ot.length) % Ot.length : i.key === "Home" ? c = 0 : i.key === "End" && (c = Ot.length - 1), c === null) return;
    i.preventDefault();
    const u = Ot[c][0];
    r(u), (h = document.getElementById(`settings-tab-${u}`)) == null || h.focus();
  }
  const a = {
    profile: hv,
    security: gv,
    notifications: Ev,
    appearance: Lv,
    ai: Mv,
    data: Iv,
    demo: Pv
  }[t];
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Settings" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Manage your profile, security, and preferences." })
    ] }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "settings-layout", children: [
      /* @__PURE__ */ s.jsx("nav", { className: "settings-nav", role: "tablist", "aria-label": "Settings sections", "aria-orientation": "vertical", onKeyDown: l, children: Ot.map(([i, o, c]) => /* @__PURE__ */ s.jsxs(
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
            /* @__PURE__ */ s.jsx("span", { className: "settings-nav-icon", children: /* @__PURE__ */ s.jsx(b, { name: c, cls: "icon-sm" }) }),
            /* @__PURE__ */ s.jsx("span", { children: o })
          ]
        },
        i
      )) }),
      /* @__PURE__ */ s.jsx("div", { id: `settings-panel-${t}`, role: "tabpanel", "aria-labelledby": `settings-tab-${t}`, tabIndex: 0, children: /* @__PURE__ */ s.jsx(a, { ctx: e }) })
    ] })
  ] });
}
const sd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], rd = [1, 2, 3, 4, 5, 6, 0], Rv = [
  ["exercise", "Exercise"],
  ["meditation", "Meditation"],
  ["medication", "Medication (you name it)"],
  ["other", "Other"]
], Mo = {
  upcoming: ["Upcoming", "badge-neutral"],
  due: ["Due now", "badge-warning"],
  missed: ["Missed", "badge-danger"],
  done: ["Done (you ticked it)", "badge-success"]
}, Ov = { title: "", details: "", kind: "exercise", time: "07:30", days: [] };
function Fv(e) {
  return `${e.days.length === 0 || e.days.length === 7 ? "Every day" : rd.filter((n) => e.days.includes(n)).map((n) => sd[n]).join(", ")} at ${e.time}`;
}
function zv(e) {
  if (!e.enabled) return "Paused";
  if (!e.nextAt) return "";
  try {
    return `Next: ${new Intl.DateTimeFormat(void 0, { timeZone: e.timezone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(e.nextAt))}`;
  } catch {
    return "";
  }
}
function Bv({ initial: e, saving: t, onSave: n, onCancel: r }) {
  const [l, a] = y.useState(e), [i, o] = y.useState({}), c = (m) => a((f) => ({ ...f, ...m })), u = (m) => c({ days: l.days.includes(m) ? l.days.filter((f) => f !== m) : [...l.days, m] });
  async function h(m) {
    m.preventDefault();
    const f = {};
    if (l.title.trim() || (f.title = "Give it a name."), /^([01]\d|2[0-3]):[0-5]\d$/.test(l.time) || (f.time = "Pick a time."), o(f), Object.keys(f).length) return;
    const g = await n({ ...l, days: l.days.length === 7 ? [] : l.days });
    g && o(g);
  }
  return /* @__PURE__ */ s.jsxs("form", { className: "card card-pad stack", onSubmit: h, style: { marginBottom: "var(--sp-4)" }, children: [
    /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: e.id ? "Edit routine" : "New routine" }) }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "routine-title", children: "Name" }),
      /* @__PURE__ */ s.jsx("input", { id: "routine-title", className: "input", value: l.title, maxLength: 80, placeholder: "e.g. Morning run", onChange: (m) => c({ title: m.target.value }), disabled: t }),
      i.title ? /* @__PURE__ */ s.jsx("span", { className: "field-error", children: i.title }) : null
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "routine-kind", children: "Kind" }),
        /* @__PURE__ */ s.jsx("select", { id: "routine-kind", className: "select", value: l.kind, onChange: (m) => c({ kind: m.target.value }), disabled: t, children: Rv.map(([m, f]) => /* @__PURE__ */ s.jsx("option", { value: m, children: f }, m)) })
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "routine-time", children: "Time" }),
        /* @__PURE__ */ s.jsx("input", { id: "routine-time", className: "input", type: "time", value: l.time, onChange: (m) => c({ time: m.target.value }), disabled: t }),
        i.time ? /* @__PURE__ */ s.jsx("span", { className: "field-error", children: i.time }) : null
      ] })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("span", { className: "field-label", id: "routine-days-label", children: "Days (none selected: every day)" }),
      /* @__PURE__ */ s.jsx("div", { className: "row", role: "group", "aria-labelledby": "routine-days-label", style: { gap: "var(--sp-2)", flexWrap: "wrap" }, children: rd.map((m) => /* @__PURE__ */ s.jsx("button", { type: "button", className: `pill ${l.days.includes(m) ? "active" : ""}`, "aria-pressed": l.days.includes(m), onClick: () => u(m), disabled: t, children: sd[m] }, m)) })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: "routine-details", children: "Details (optional)" }),
      /* @__PURE__ */ s.jsx("textarea", { id: "routine-details", className: "textarea", value: l.details, maxLength: 500, onChange: (m) => c({ details: m.target.value }), disabled: t })
    ] }),
    l.kind === "medication" ? /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", role: "note", children: "You type what you take and when. A reminder is not medical advice, LifeAdmin never suggests a medicine or a dose, and a reminder does not show that you took it: you tick it yourself. Ask your doctor or pharmacist about your treatment." }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", disabled: t, children: t ? "Saving…" : "Save" }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", type: "button", onClick: r, disabled: t, children: "Cancel" })
    ] })
  ] });
}
function Uv({ ctx: e }) {
  const { api: t, toast: n } = e, [r, l] = y.useState(null), [a, i] = y.useState([]), [o, c] = y.useState(null), [u, h] = y.useState(null), [m, f] = y.useState(!1), [g, N] = y.useState(null), j = y.useCallback(async () => {
    try {
      const [v, x] = await Promise.all([t.get("/api/routines"), t.get("/api/routines/today")]);
      l(v.routines), i(x.items), c(null);
    } catch (v) {
      c(v);
    }
  }, [t]);
  y.useEffect(() => {
    j();
  }, [j]);
  async function w(v) {
    if (m) return null;
    f(!0);
    try {
      const x = { title: v.title, details: v.details, kind: v.kind, time: v.time, days: v.days };
      return v.id ? await t.patch(`/api/routines/${v.id}`, x) : await t.post("/api/routines", x), n("Routine saved", "success"), h(null), await j(), null;
    } catch (x) {
      return n(x && x.message || "Could not save the routine", "error"), x && x.fields || {};
    } finally {
      f(!1);
    }
  }
  async function p(v, x, k) {
    if (!g) {
      N(v);
      try {
        await x(), k && n(k, "success"), await j();
      } catch (C) {
        n(C && C.message || "That did not work", "error");
      } finally {
        N(null);
      }
    }
  }
  async function d(v) {
    await Ee({ title: "Delete this routine?", message: "Its reminders stop. Nothing else changes.", confirmLabel: "Delete" }) && p(v.id, () => t.del(`/api/routines/${v.id}`), "Routine deleted");
  }
  return o ? /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
    /* @__PURE__ */ s.jsx("p", { children: o.message }),
    /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: j, children: "Try again" })
  ] }) }) : r ? /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ s.jsxs("div", { children: [
        /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Routines" }),
        /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Things you do again and again, with a reminder at the time you choose." })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "page-actions", children: /* @__PURE__ */ s.jsxs("button", { className: "btn btn-primary", onClick: () => h({ ...Ov }), disabled: !!u, children: [
        /* @__PURE__ */ s.jsx(b, { name: "plus", cls: "icon-sm" }),
        " New routine"
      ] }) })
    ] }),
    u ? /* @__PURE__ */ s.jsx(Bv, { initial: u, saving: m, onSave: w, onCancel: () => h(null) }) : null,
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Today" }) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginBottom: "var(--sp-3)" }, children: "A reminder only tells you it is time. It does not show that you did it: tick it yourself. What you did not tick shows as missed." }),
      a.length === 0 ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Nothing is planned for today." }) : /* @__PURE__ */ s.jsx("div", { className: "stack", children: a.map((v) => {
        const [x, k] = Mo[v.status] || Mo.upcoming, C = `${v.routineId}-${v.date}`;
        return /* @__PURE__ */ s.jsxs("div", { className: "row", style: { justifyContent: "space-between", gap: "var(--sp-3)", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ s.jsxs("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ s.jsxs("div", { className: "text-sm", style: { fontWeight: 650 }, children: [
              v.day === "yesterday" ? "Yesterday " : "",
              v.time,
              " · ",
              v.title
            ] }),
            /* @__PURE__ */ s.jsx("span", { className: `badge ${k}`, children: x }),
            v.note ? /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginTop: 4 }, children: v.note }) : null
          ] }),
          v.status === "done" ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: g === C, onClick: () => p(C, () => t.del(`/api/routines/${v.routineId}/checkin/${v.date}`)), children: "Undo" }) : /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm btn-primary", disabled: g === C, onClick: () => p(C, () => t.post(`/api/routines/${v.routineId}/checkin`, { date: v.date })), children: "I did it" })
        ] }, C);
      }) })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsx("div", { className: "card-header", children: /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Your routines" }) }),
      r.length === 0 ? /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ s.jsx(b, { name: "clock", cls: "icon-lg" }),
        /* @__PURE__ */ s.jsx("h3", { children: "No routines yet" }),
        /* @__PURE__ */ s.jsx("p", { children: "Add one, for example a morning walk, ten minutes of meditation, or a medicine you take." })
      ] }) : /* @__PURE__ */ s.jsx("div", { className: "stack", children: r.map((v) => /* @__PURE__ */ s.jsx("div", { className: "card card-pad", style: { opacity: v.enabled ? 1 : 0.7 }, children: /* @__PURE__ */ s.jsxs("div", { className: "row", style: { justifyContent: "space-between", gap: "var(--sp-3)", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ s.jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ s.jsx("div", { className: "text-sm", style: { fontWeight: 650 }, children: v.title }),
          /* @__PURE__ */ s.jsxs("div", { className: "text-xs muted", children: [
            Fv(v),
            " · ",
            v.timezone
          ] }),
          /* @__PURE__ */ s.jsx("div", { className: "text-xs muted", children: zv(v) }),
          v.details ? /* @__PURE__ */ s.jsx("p", { className: "text-sm", style: { marginTop: 4 }, children: v.details }) : null,
          v.note ? /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", style: { marginTop: 4 }, children: v.note }) : null
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: g === v.id, onClick: () => p(v.id, () => t.patch(`/api/routines/${v.id}`, { enabled: !v.enabled }), v.enabled ? "Paused" : "Resumed"), children: v.enabled ? "Pause" : "Resume" }),
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => h({ id: v.id, title: v.title, details: v.details, kind: v.kind, time: v.time, days: v.days }), children: "Edit" }),
          /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: g === v.id, onClick: () => d(v), children: "Delete" })
        ] })
      ] }) }, v.id)) }),
      /* @__PURE__ */ s.jsxs("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: [
        "Reminders appear in the bell inside the app. To get them on your phone too, turn on device notifications in ",
        /* @__PURE__ */ s.jsx("a", { href: "#/settings", children: "Settings" }),
        "; delivery to a phone that is off or has no connection is not guaranteed."
      ] })
    ] })
  ] }) : /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) });
}
const Vv = ["critical", "high", "medium", "low"], Wv = ["learning", "fitness", "financial", "career", "habit", "personal"], Hv = ["exercise", "meditation", "medication", "other"], Qv = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], qv = [1, 2, 3, 4, 5, 6, 0], ua = { task: "Task", goal: "Goal", routine: "Routine" };
function _o({ proposal: e, onAccept: t, onReject: n, onRevise: r, busy: l }) {
  const [a, i] = y.useState(e.fields), [o, c] = y.useState({}), [u, h] = y.useState(!1), [m, f] = y.useState(""), g = (d) => i((v) => ({ ...v, ...d })), N = e.status === "pending", j = e.kind === "task" ? "dueDate" : e.kind === "goal" ? "targetDate" : null, w = (d) => e.needsInput.includes(d) && !a[d];
  async function p() {
    const d = await t(e, a);
    c(d || {});
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad stack", style: { marginTop: "var(--sp-2)" }, role: "group", "aria-label": `Suggested ${ua[e.kind]}`, children: [
    /* @__PURE__ */ s.jsxs("div", { className: "row", style: { justifyContent: "space-between", gap: "var(--sp-2)" }, children: [
      /* @__PURE__ */ s.jsxs("strong", { className: "text-sm", children: [
        "Suggested ",
        ua[e.kind].toLowerCase(),
        " — not saved yet"
      ] }),
      N ? null : /* @__PURE__ */ s.jsx("span", { className: "badge badge-neutral", children: e.status === "accepted" ? "Saved" : e.status === "rejected" ? "Dismissed" : "Replaced" })
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `p-title-${e.id}`, children: e.kind === "routine" ? "Name" : "Title" }),
      /* @__PURE__ */ s.jsx("input", { id: `p-title-${e.id}`, className: "input", value: a.title, maxLength: e.kind === "routine" ? 80 : 120, disabled: !N, onChange: (d) => g({ title: d.target.value }) }),
      o.title ? /* @__PURE__ */ s.jsx("span", { className: "field-error", children: o.title }) : null
    ] }),
    /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsxs("label", { className: "field-label", htmlFor: `p-desc-${e.id}`, children: [
        e.kind === "routine" ? "Details" : "Description",
        " (optional)"
      ] }),
      /* @__PURE__ */ s.jsx("textarea", { id: `p-desc-${e.id}`, className: "textarea", value: (e.kind === "routine" ? a.details : a.description) || "", maxLength: 500, disabled: !N, onChange: (d) => g(e.kind === "routine" ? { details: d.target.value } : { description: d.target.value }) })
    ] }),
    e.kind === "task" ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `p-pri-${e.id}`, children: "Priority" }),
      /* @__PURE__ */ s.jsx("select", { id: `p-pri-${e.id}`, className: "select", value: a.priority, disabled: !N, onChange: (d) => g({ priority: d.target.value }), children: Vv.map((d) => /* @__PURE__ */ s.jsx("option", { value: d, children: d }, d)) })
    ] }) : null,
    e.kind === "goal" ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `p-cat-${e.id}`, children: "Category" }),
      /* @__PURE__ */ s.jsx("select", { id: `p-cat-${e.id}`, className: "select", value: a.category, disabled: !N, onChange: (d) => g({ category: d.target.value }), children: Wv.map((d) => /* @__PURE__ */ s.jsx("option", { value: d, children: d }, d)) })
    ] }) : null,
    j ? /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ s.jsxs("label", { className: "field-label", htmlFor: `p-date-${e.id}`, children: [
        e.kind === "task" ? "Due date" : "Target date",
        " (optional)"
      ] }),
      /* @__PURE__ */ s.jsx("input", { id: `p-date-${e.id}`, className: "input", type: "date", value: a[j] || "", disabled: !N, onChange: (d) => g({ [j]: d.target.value || null }) }),
      w(j) ? /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Needs your input: the AI never picks a date for you. Leave it empty if you do not want one." }) : null,
      o[j] ? /* @__PURE__ */ s.jsx("span", { className: "field-error", children: o[j] }) : null
    ] }) : null,
    e.kind === "routine" ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `p-kind-${e.id}`, children: "Kind" }),
          /* @__PURE__ */ s.jsx("select", { id: `p-kind-${e.id}`, className: "select", value: a.kind, disabled: !N, onChange: (d) => g({ kind: d.target.value }), children: Hv.map((d) => /* @__PURE__ */ s.jsx("option", { value: d, children: d }, d)) })
        ] }),
        /* @__PURE__ */ s.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ s.jsx("label", { className: "field-label", htmlFor: `p-time-${e.id}`, children: "Time" }),
          /* @__PURE__ */ s.jsx("input", { id: `p-time-${e.id}`, className: "input", type: "time", value: a.time, disabled: !N, onChange: (d) => g({ time: d.target.value }) }),
          e.needsInput.includes("time") ? /* @__PURE__ */ s.jsx("span", { className: "field-hint", children: "Needs your input: you did not say when. Check this time." }) : null
        ] })
      ] }),
      /* @__PURE__ */ s.jsx("div", { className: "row", role: "group", "aria-label": "Days", style: { gap: "var(--sp-2)", flexWrap: "wrap" }, children: qv.map((d) => /* @__PURE__ */ s.jsx("button", { type: "button", className: `pill ${a.days.includes(d) ? "active" : ""}`, "aria-pressed": a.days.includes(d), disabled: !N, onClick: () => g({ days: a.days.includes(d) ? a.days.filter((v) => v !== d) : [...a.days, d] }), children: Qv[d] }, d)) }),
      /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", children: "No day selected means every day." })
    ] }) : null,
    N ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-sm", disabled: l, onClick: p, children: "Save this" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: l, onClick: () => h((d) => !d), children: "Revise" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: l, onClick: () => n(e), children: "Not now" })
      ] }),
      u ? /* @__PURE__ */ s.jsxs(
        "form",
        {
          className: "row",
          style: { gap: "var(--sp-2)" },
          onSubmit: (d) => {
            d.preventDefault(), m.trim() && (r(e, m.trim()), f(""), h(!1));
          },
          children: [
            /* @__PURE__ */ s.jsx("input", { className: "input", "aria-label": "How should it change?", placeholder: "How should it change?", value: m, maxLength: 500, onChange: (d) => f(d.target.value) }),
            /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", type: "submit", disabled: l, children: "Ask" })
          ]
        }
      ) : null
    ] }) : null
  ] });
}
function Yv({ api: e, toast: t, status: n, onChanged: r }) {
  const [l, a] = y.useState(!1), [i, o] = y.useState(!1), [c, u] = y.useState(null), [h, m] = y.useState(!1), f = n.disclosure;
  async function g(j) {
    if (!h) {
      m(!0);
      try {
        await e.patch("/api/reflection/insights", { enabled: j, acknowledged: j ? i : void 0 }), a(!1), o(!1), j || u(null), r();
      } catch (w) {
        t(w && w.message || "Could not change that", "error");
      } finally {
        m(!1);
      }
    }
  }
  async function N() {
    if (!h) {
      m(!0);
      try {
        u(await e.post("/api/reflection/insights/run", {}));
      } catch (j) {
        t(j && j.message || "Could not make the summary", "error");
      } finally {
        m(!1);
      }
    }
  }
  return /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-4)" }, children: [
    /* @__PURE__ */ s.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Insights from my data" }),
      /* @__PURE__ */ s.jsx("span", { className: `badge ${n.insightsEnabled ? "badge-success" : "badge-neutral"}`, children: n.insightsEnabled ? "On" : "Off" })
    ] }),
    !n.insightsEnabled && !l ? /* @__PURE__ */ s.jsxs(s.Fragment, { children: [
      /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "Off by default. If you turn it on, Reflection can use a small summary of your own tasks, goals and bills to give you suggestions." }),
      /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", style: { marginTop: "var(--sp-2)" }, onClick: () => a(!0), children: "Read what is used and turn on…" })
    ] }) : null,
    !n.insightsEnabled && l ? /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
      /* @__PURE__ */ s.jsx("p", { className: "text-sm", children: /* @__PURE__ */ s.jsx("strong", { children: "What is used:" }) }),
      /* @__PURE__ */ s.jsx("ul", { className: "text-sm", style: { paddingLeft: "var(--sp-5)" }, children: f.uses.map((j) => /* @__PURE__ */ s.jsx("li", { children: j }, j)) }),
      /* @__PURE__ */ s.jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ s.jsx("strong", { children: "Not used:" }),
        " ",
        f.doesNotUse.join(" ")
      ] }),
      /* @__PURE__ */ s.jsx("p", { className: "text-sm", children: f.provider }),
      /* @__PURE__ */ s.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ s.jsx("input", { type: "checkbox", checked: i, onChange: (j) => o(j.target.checked) }),
        "I understand which data is used and that an external AI provider processes it."
      ] }),
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-sm", disabled: !i || h, onClick: () => g(!0), children: "Turn on" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: () => a(!1), children: "Cancel" })
      ] })
    ] }) : null,
    n.insightsEnabled ? /* @__PURE__ */ s.jsxs("div", { className: "stack", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary btn-sm", disabled: h, onClick: N, children: h ? "Working…" : "Show my summary" }),
        /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", disabled: h, onClick: () => g(!1), children: "Turn off" })
      ] }),
      c ? /* @__PURE__ */ s.jsxs("div", { className: "stack", "aria-live": "polite", children: [
        /* @__PURE__ */ s.jsxs("div", { children: [
          /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", children: "From your data" }),
          /* @__PURE__ */ s.jsx("ul", { className: "text-sm", style: { paddingLeft: "var(--sp-5)" }, children: c.facts.map((j) => /* @__PURE__ */ s.jsx("li", { children: j }, j)) })
        ] }),
        c.calculations.length ? /* @__PURE__ */ s.jsxs("div", { children: [
          /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", children: "Calculated by the app" }),
          /* @__PURE__ */ s.jsx("ul", { className: "text-sm", style: { paddingLeft: "var(--sp-5)" }, children: c.calculations.map((j) => /* @__PURE__ */ s.jsx("li", { children: j }, j)) })
        ] }) : null,
        /* @__PURE__ */ s.jsxs("div", { children: [
          /* @__PURE__ */ s.jsx("p", { className: "text-xs muted", children: "Suggestions (ideas from the AI, not facts)" }),
          c.suggestions.length ? /* @__PURE__ */ s.jsx("ul", { className: "text-sm", style: { paddingLeft: "var(--sp-5)" }, children: c.suggestions.map((j) => /* @__PURE__ */ s.jsx("li", { children: j }, j)) }) : /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: c.suggestionsNote })
        ] })
      ] }) : null
    ] }) : null
  ] });
}
function Kv({ ctx: e }) {
  const { api: t, toast: n } = e, [r, l] = y.useState(null), [a, i] = y.useState(null), [o, c] = y.useState([]), [u, h] = y.useState(null), [m, f] = y.useState([]), [g, N] = y.useState([]), [j, w] = y.useState(""), [p, d] = y.useState(!1), [v, x] = y.useState(!1), k = y.useRef(null), C = y.useCallback(async () => {
    try {
      l(await t.get("/api/reflection/status")), c((await t.get("/api/reflection/conversations")).conversations);
    } catch ($) {
      i($);
    }
  }, [t]);
  y.useEffect(() => {
    C();
  }, [C]), y.useEffect(() => {
    k.current && k.current.scrollIntoView && k.current.scrollIntoView({ block: "nearest" });
  }, [m, g]);
  async function T($) {
    if (h($), !$) {
      f([]), N([]);
      return;
    }
    try {
      const Q = await t.get(`/api/reflection/conversations/${$}`);
      f(Q.messages), N(Q.proposals);
    } catch (Q) {
      n(Q && Q.message || "Could not open it", "error");
    }
  }
  async function M($, Q) {
    if (!(p || !$.trim())) {
      d(!0), f((z) => [...z, { id: `tmp-${Date.now()}`, role: "user", content: $ }]), w("");
      try {
        const z = await t.post("/api/reflection/message", { conversationId: u || void 0, message: $, reviseProposalId: Q });
        if (z.ok === !1) {
          n(z.error || "The AI could not answer. Please try again.", "error"), z.conversationId && await T(z.conversationId);
          return;
        }
        await T(z.conversationId), z.note && n(z.note, "info"), c((await t.get("/api/reflection/conversations")).conversations);
      } catch (z) {
        n(z && z.message || "Could not send that", "error"), u && await T(u);
      } finally {
        d(!1);
      }
    }
  }
  async function O($, Q) {
    if (v) return null;
    x(!0);
    try {
      const z = await t.post(`/api/reflection/proposals/${$.id}/accept`, { fields: Q });
      return n(z.alreadyAccepted ? "It was already saved." : `${ua[$.kind]} saved`, "success"), await T(u), null;
    } catch (z) {
      n(z && z.message || "Could not save it", "error");
      const ge = {};
      for (const [D, I] of Object.entries(z && z.fields || {})) ge[D] = I;
      return ge;
    } finally {
      x(!1);
    }
  }
  async function E($) {
    if (!v) {
      x(!0);
      try {
        await t.post(`/api/reflection/proposals/${$.id}/reject`, {}), await T(u);
      } catch (Q) {
        n(Q && Q.message || "Could not do that", "error");
      } finally {
        x(!1);
      }
    }
  }
  async function ee() {
    if (await Ee({ title: "Delete this conversation?", message: "The messages and suggestions are deleted for good. Anything you already saved from it stays.", confirmLabel: "Delete" }))
      try {
        await t.del(`/api/reflection/conversations/${u}`), await T(null), await C();
      } catch (Q) {
        n(Q && Q.message || "Could not delete it", "error");
      }
  }
  if (a)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ s.jsx(b, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ s.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ s.jsx("p", { children: a.message }),
      /* @__PURE__ */ s.jsx("button", { className: "btn", onClick: () => {
        i(null), C();
      }, children: "Try again" })
    ] }) });
  if (!r)
    return /* @__PURE__ */ s.jsx("div", { className: "page", children: /* @__PURE__ */ s.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ s.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) });
  const Pe = r.configured && r.aiEnabled, Ue = [...m].map(($, Q) => [$, Q]).filter(([$]) => $.role === "assistant").map(([, $]) => $).pop();
  return /* @__PURE__ */ s.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ s.jsx("div", { className: "page-header", children: /* @__PURE__ */ s.jsxs("div", { children: [
      /* @__PURE__ */ s.jsx("h1", { className: "page-title", children: "Reflection" }),
      /* @__PURE__ */ s.jsx("p", { className: "page-subtitle", children: "Think a personal topic through and turn it into one small step." })
    ] }) }),
    /* @__PURE__ */ s.jsx("p", { className: "text-sm", role: "note", style: { marginBottom: "var(--sp-4)" }, children: r.notice }),
    /* @__PURE__ */ s.jsx(Yv, { api: t, toast: n, status: r, onChanged: C }),
    /* @__PURE__ */ s.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ s.jsxs("div", { className: "card-header", style: { flexWrap: "wrap", gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ s.jsx("span", { className: "card-title", children: "Conversation" }),
        /* @__PURE__ */ s.jsxs("span", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ s.jsxs("select", { className: "select", style: { width: "auto", maxWidth: 180 }, "aria-label": "Conversations", value: u || "", onChange: ($) => T($.target.value ? Number($.target.value) : null), children: [
            /* @__PURE__ */ s.jsx("option", { value: "", children: "New conversation" }),
            o.map(($) => /* @__PURE__ */ s.jsx("option", { value: $.id, children: $.title || "Conversation" }, $.id))
          ] }),
          u ? /* @__PURE__ */ s.jsx("button", { className: "btn btn-sm", onClick: ee, children: "Delete" }) : null
        ] })
      ] }),
      Pe ? null : /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: r.aiEnabled ? "The AI is not available right now." : "AI features are turned off in Settings." }),
      /* @__PURE__ */ s.jsxs("div", { className: "stack", style: { marginBottom: "var(--sp-3)" }, "aria-live": "polite", children: [
        m.length === 0 ? /* @__PURE__ */ s.jsx("p", { className: "text-sm muted", children: "What is on your mind? Your conversation is private to you." }) : null,
        m.map(($, Q) => /* @__PURE__ */ s.jsxs("div", { style: { alignSelf: $.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }, children: [
          /* @__PURE__ */ s.jsx("div", { className: "chat-bubble", style: $.role === "user" ? { background: "var(--brand)", color: "var(--text-on-brand)" } : void 0, children: $.content }),
          Q === Ue ? g.filter((z) => z.status === "pending").map((z) => /* @__PURE__ */ s.jsx(_o, { proposal: z, onAccept: O, onReject: E, onRevise: (ge, D) => M(D, ge.id), busy: v || p }, z.id)) : null
        ] }, $.id)),
        g.filter(($) => $.status !== "pending").map(($) => /* @__PURE__ */ s.jsx(_o, { proposal: $, onAccept: O, onReject: E, onRevise: () => {
        }, busy: !0 }, $.id)),
        /* @__PURE__ */ s.jsx("div", { ref: k })
      ] }),
      /* @__PURE__ */ s.jsxs(
        "form",
        {
          className: "chat-input-row",
          onSubmit: ($) => {
            $.preventDefault(), M(j);
          },
          children: [
            /* @__PURE__ */ s.jsx("textarea", { className: "textarea", "aria-label": "Your message", style: { minHeight: 44, height: 44 }, value: j, maxLength: r.maxMessageLength, placeholder: "Write here…", disabled: !Pe || p, onChange: ($) => w($.target.value) }),
            /* @__PURE__ */ s.jsx("button", { className: "btn btn-primary", type: "submit", disabled: !Pe || p || !j.trim(), children: p ? "Thinking…" : "Send" })
          ]
        }
      )
    ] })
  ] });
}
function Ie(e) {
  let t = null;
  return {
    mount(n, r) {
      t = de(n), t.render(y.createElement(e, { ctx: r }));
    },
    unmount() {
      t && (t.unmount(), t = null);
    }
  };
}
const ld = Ie(fh), Gv = ld.mount, Zv = ld.unmount, ad = Ie($h), Xv = ad.mount, Jv = ad.unmount, id = Ie(ep), eg = id.mount, tg = id.unmount, od = Ie(up), ng = od.mount, sg = od.unmount, cd = Ie(Mp), rg = cd.mount, lg = cd.unmount, ud = Ie(xp), ag = ud.mount, ig = ud.unmount, dd = Ie(Up), og = dd.mount, cg = dd.unmount, md = Ie(qp), ug = md.mount, dg = md.unmount, fd = Ie(av), mg = fd.mount, fg = fd.unmount, hd = Ie(fv), hg = hd.mount, pg = hd.unmount, pd = Ie(Kv), vg = pd.mount, gg = pd.unmount, vd = Ie(Uv), yg = vd.mount, xg = vd.unmount, gd = Ie(Av), jg = gd.mount, Ng = gd.unmount;
export {
  hg as mountAssistant,
  ng as mountBillsense,
  Gv as mountDashboard,
  mg as mountDecisionflow,
  rg as mountDocuments,
  og as mountEcolife,
  eg as mountFamily,
  ag as mountGoals,
  vg as mountReflection,
  yg as mountRoutines,
  jg as mountSettings,
  Xv as mountTasks,
  ug as mountTimeline,
  yo as openTaskFormModal,
  pg as unmountAssistant,
  sg as unmountBillsense,
  Zv as unmountDashboard,
  fg as unmountDecisionflow,
  lg as unmountDocuments,
  cg as unmountEcolife,
  tg as unmountFamily,
  ig as unmountGoals,
  gg as unmountReflection,
  xg as unmountRoutines,
  Ng as unmountSettings,
  Jv as unmountTasks,
  dg as unmountTimeline
};
