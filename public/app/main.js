var jo = { exports: {} }, P = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ur = Symbol.for("react.element"), Zu = Symbol.for("react.portal"), Xu = Symbol.for("react.fragment"), Ju = Symbol.for("react.strict_mode"), ed = Symbol.for("react.profiler"), td = Symbol.for("react.provider"), nd = Symbol.for("react.context"), rd = Symbol.for("react.forward_ref"), ld = Symbol.for("react.suspense"), sd = Symbol.for("react.memo"), ad = Symbol.for("react.lazy"), Xa = Symbol.iterator;
function id(e) {
  return e === null || typeof e != "object" ? null : (e = Xa && e[Xa] || e["@@iterator"], typeof e == "function" ? e : null);
}
var No = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, wo = Object.assign, ko = {};
function jn(e, t, n) {
  this.props = e, this.context = t, this.refs = ko, this.updater = n || No;
}
jn.prototype.isReactComponent = {};
jn.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
jn.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function So() {
}
So.prototype = jn.prototype;
function ta(e, t, n) {
  this.props = e, this.context = t, this.refs = ko, this.updater = n || No;
}
var na = ta.prototype = new So();
na.constructor = ta;
wo(na, jn.prototype);
na.isPureReactComponent = !0;
var Ja = Array.isArray, Co = Object.prototype.hasOwnProperty, ra = { current: null }, Eo = { key: !0, ref: !0, __self: !0, __source: !0 };
function To(e, t, n) {
  var r, s = {}, a = null, i = null;
  if (t != null) for (r in t.ref !== void 0 && (i = t.ref), t.key !== void 0 && (a = "" + t.key), t) Co.call(t, r) && !Eo.hasOwnProperty(r) && (s[r] = t[r]);
  var o = arguments.length - 2;
  if (o === 1) s.children = n;
  else if (1 < o) {
    for (var c = Array(o), u = 0; u < o; u++) c[u] = arguments[u + 2];
    s.children = c;
  }
  if (e && e.defaultProps) for (r in o = e.defaultProps, o) s[r] === void 0 && (s[r] = o[r]);
  return { $$typeof: ur, type: e, key: a, ref: i, props: s, _owner: ra.current };
}
function od(e, t) {
  return { $$typeof: ur, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function la(e) {
  return typeof e == "object" && e !== null && e.$$typeof === ur;
}
function cd(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var ei = /\/+/g;
function Al(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? cd("" + e.key) : t.toString(36);
}
function Pr(e, t, n, r, s) {
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
        case ur:
        case Zu:
          i = !0;
      }
  }
  if (i) return i = e, s = s(i), e = r === "" ? "." + Al(i, 0) : r, Ja(s) ? (n = "", e != null && (n = e.replace(ei, "$&/") + "/"), Pr(s, t, n, "", function(u) {
    return u;
  })) : s != null && (la(s) && (s = od(s, n + (!s.key || i && i.key === s.key ? "" : ("" + s.key).replace(ei, "$&/") + "/") + e)), t.push(s)), 1;
  if (i = 0, r = r === "" ? "." : r + ":", Ja(e)) for (var o = 0; o < e.length; o++) {
    a = e[o];
    var c = r + Al(a, o);
    i += Pr(a, t, n, c, s);
  }
  else if (c = id(e), typeof c == "function") for (e = c.call(e), o = 0; !(a = e.next()).done; ) a = a.value, c = r + Al(a, o++), i += Pr(a, t, n, c, s);
  else if (a === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return i;
}
function gr(e, t, n) {
  if (e == null) return e;
  var r = [], s = 0;
  return Pr(e, r, "", "", function(a) {
    return t.call(n, a, s++);
  }), r;
}
function ud(e) {
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
var me = { current: null }, $r = { transition: null }, dd = { ReactCurrentDispatcher: me, ReactCurrentBatchConfig: $r, ReactCurrentOwner: ra };
function bo() {
  throw Error("act(...) is not supported in production builds of React.");
}
P.Children = { map: gr, forEach: function(e, t, n) {
  gr(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return gr(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return gr(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!la(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
P.Component = jn;
P.Fragment = Xu;
P.Profiler = ed;
P.PureComponent = ta;
P.StrictMode = Ju;
P.Suspense = ld;
P.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = dd;
P.act = bo;
P.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var r = wo({}, e.props), s = e.key, a = e.ref, i = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (a = t.ref, i = ra.current), t.key !== void 0 && (s = "" + t.key), e.type && e.type.defaultProps) var o = e.type.defaultProps;
    for (c in t) Co.call(t, c) && !Eo.hasOwnProperty(c) && (r[c] = t[c] === void 0 && o !== void 0 ? o[c] : t[c]);
  }
  var c = arguments.length - 2;
  if (c === 1) r.children = n;
  else if (1 < c) {
    o = Array(c);
    for (var u = 0; u < c; u++) o[u] = arguments[u + 2];
    r.children = o;
  }
  return { $$typeof: ur, type: e.type, key: s, ref: a, props: r, _owner: i };
};
P.createContext = function(e) {
  return e = { $$typeof: nd, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: td, _context: e }, e.Consumer = e;
};
P.createElement = To;
P.createFactory = function(e) {
  var t = To.bind(null, e);
  return t.type = e, t;
};
P.createRef = function() {
  return { current: null };
};
P.forwardRef = function(e) {
  return { $$typeof: rd, render: e };
};
P.isValidElement = la;
P.lazy = function(e) {
  return { $$typeof: ad, _payload: { _status: -1, _result: e }, _init: ud };
};
P.memo = function(e, t) {
  return { $$typeof: sd, type: e, compare: t === void 0 ? null : t };
};
P.startTransition = function(e) {
  var t = $r.transition;
  $r.transition = {};
  try {
    e();
  } finally {
    $r.transition = t;
  }
};
P.unstable_act = bo;
P.useCallback = function(e, t) {
  return me.current.useCallback(e, t);
};
P.useContext = function(e) {
  return me.current.useContext(e);
};
P.useDebugValue = function() {
};
P.useDeferredValue = function(e) {
  return me.current.useDeferredValue(e);
};
P.useEffect = function(e, t) {
  return me.current.useEffect(e, t);
};
P.useId = function() {
  return me.current.useId();
};
P.useImperativeHandle = function(e, t, n) {
  return me.current.useImperativeHandle(e, t, n);
};
P.useInsertionEffect = function(e, t) {
  return me.current.useInsertionEffect(e, t);
};
P.useLayoutEffect = function(e, t) {
  return me.current.useLayoutEffect(e, t);
};
P.useMemo = function(e, t) {
  return me.current.useMemo(e, t);
};
P.useReducer = function(e, t, n) {
  return me.current.useReducer(e, t, n);
};
P.useRef = function(e) {
  return me.current.useRef(e);
};
P.useState = function(e) {
  return me.current.useState(e);
};
P.useSyncExternalStore = function(e, t, n) {
  return me.current.useSyncExternalStore(e, t, n);
};
P.useTransition = function() {
  return me.current.useTransition();
};
P.version = "18.3.1";
jo.exports = P;
var x = jo.exports, _o = { exports: {} }, Se = {}, Mo = { exports: {} }, Lo = {};
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
  function t(M, D) {
    var I = M.length;
    M.push(D);
    e: for (; 0 < I; ) {
      var Q = I - 1 >>> 1, Z = M[Q];
      if (0 < s(Z, D)) M[Q] = D, M[I] = Z, I = Q;
      else break e;
    }
  }
  function n(M) {
    return M.length === 0 ? null : M[0];
  }
  function r(M) {
    if (M.length === 0) return null;
    var D = M[0], I = M.pop();
    if (I !== D) {
      M[0] = I;
      e: for (var Q = 0, Z = M.length, hr = Z >>> 1; Q < hr; ) {
        var St = 2 * (Q + 1) - 1, $l = M[St], Ct = St + 1, vr = M[Ct];
        if (0 > s($l, I)) Ct < Z && 0 > s(vr, $l) ? (M[Q] = vr, M[Ct] = I, Q = Ct) : (M[Q] = $l, M[St] = I, Q = St);
        else if (Ct < Z && 0 > s(vr, I)) M[Q] = vr, M[Ct] = I, Q = Ct;
        else break e;
      }
    }
    return D;
  }
  function s(M, D) {
    var I = M.sortIndex - D.sortIndex;
    return I !== 0 ? I : M.id - D.id;
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
  var c = [], u = [], h = 1, f = null, d = 3, g = !1, j = !1, N = !1, k = typeof setTimeout == "function" ? setTimeout : null, p = typeof clearTimeout == "function" ? clearTimeout : null, m = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function v(M) {
    for (var D = n(u); D !== null; ) {
      if (D.callback === null) r(u);
      else if (D.startTime <= M) r(u), D.sortIndex = D.expirationTime, t(c, D);
      else break;
      D = n(u);
    }
  }
  function y(M) {
    if (N = !1, v(M), !j) if (n(c) !== null) j = !0, Il(S);
    else {
      var D = n(u);
      D !== null && Pl(y, D.startTime - M);
    }
  }
  function S(M, D) {
    j = !1, N && (N = !1, p(L), L = -1), g = !0;
    var I = d;
    try {
      for (v(D), f = n(c); f !== null && (!(f.expirationTime > D) || M && !xe()); ) {
        var Q = f.callback;
        if (typeof Q == "function") {
          f.callback = null, d = f.priorityLevel;
          var Z = Q(f.expirationTime <= D);
          D = e.unstable_now(), typeof Z == "function" ? f.callback = Z : f === n(c) && r(c), v(D);
        } else r(c);
        f = n(c);
      }
      if (f !== null) var hr = !0;
      else {
        var St = n(u);
        St !== null && Pl(y, St.startTime - D), hr = !1;
      }
      return hr;
    } finally {
      f = null, d = I, g = !1;
    }
  }
  var T = !1, _ = null, L = -1, O = 5, E = -1;
  function xe() {
    return !(e.unstable_now() - E < O);
  }
  function kn() {
    if (_ !== null) {
      var M = e.unstable_now();
      E = M;
      var D = !0;
      try {
        D = _(!0, M);
      } finally {
        D ? Sn() : (T = !1, _ = null);
      }
    } else T = !1;
  }
  var Sn;
  if (typeof m == "function") Sn = function() {
    m(kn);
  };
  else if (typeof MessageChannel < "u") {
    var Za = new MessageChannel(), Gu = Za.port2;
    Za.port1.onmessage = kn, Sn = function() {
      Gu.postMessage(null);
    };
  } else Sn = function() {
    k(kn, 0);
  };
  function Il(M) {
    _ = M, T || (T = !0, Sn());
  }
  function Pl(M, D) {
    L = k(function() {
      M(e.unstable_now());
    }, D);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(M) {
    M.callback = null;
  }, e.unstable_continueExecution = function() {
    j || g || (j = !0, Il(S));
  }, e.unstable_forceFrameRate = function(M) {
    0 > M || 125 < M ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : O = 0 < M ? Math.floor(1e3 / M) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return d;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(c);
  }, e.unstable_next = function(M) {
    switch (d) {
      case 1:
      case 2:
      case 3:
        var D = 3;
        break;
      default:
        D = d;
    }
    var I = d;
    d = D;
    try {
      return M();
    } finally {
      d = I;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(M, D) {
    switch (M) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        M = 3;
    }
    var I = d;
    d = M;
    try {
      return D();
    } finally {
      d = I;
    }
  }, e.unstable_scheduleCallback = function(M, D, I) {
    var Q = e.unstable_now();
    switch (typeof I == "object" && I !== null ? (I = I.delay, I = typeof I == "number" && 0 < I ? Q + I : Q) : I = Q, M) {
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
    return Z = I + Z, M = { id: h++, callback: D, priorityLevel: M, startTime: I, expirationTime: Z, sortIndex: -1 }, I > Q ? (M.sortIndex = I, t(u, M), n(c) === null && M === n(u) && (N ? (p(L), L = -1) : N = !0, Pl(y, I - Q))) : (M.sortIndex = Z, t(c, M), j || g || (j = !0, Il(S))), M;
  }, e.unstable_shouldYield = xe, e.unstable_wrapCallback = function(M) {
    var D = d;
    return function() {
      var I = d;
      d = D;
      try {
        return M.apply(this, arguments);
      } finally {
        d = I;
      }
    };
  };
})(Lo);
Mo.exports = Lo;
var md = Mo.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var fd = x, ke = md;
function w(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Do = /* @__PURE__ */ new Set(), qn = {};
function Ut(e, t) {
  fn(e, t), fn(e + "Capture", t);
}
function fn(e, t) {
  for (qn[e] = t, e = 0; e < t.length; e++) Do.add(t[e]);
}
var Je = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), cs = Object.prototype.hasOwnProperty, pd = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, ti = {}, ni = {};
function hd(e) {
  return cs.call(ni, e) ? !0 : cs.call(ti, e) ? !1 : pd.test(e) ? ni[e] = !0 : (ti[e] = !0, !1);
}
function vd(e, t, n, r) {
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
function gd(e, t, n, r) {
  if (t === null || typeof t > "u" || vd(e, t, n, r)) return !0;
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
function fe(e, t, n, r, s, a, i) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = s, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = a, this.removeEmptyString = i;
}
var re = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  re[e] = new fe(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  re[t] = new fe(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  re[e] = new fe(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  re[e] = new fe(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  re[e] = new fe(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  re[e] = new fe(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  re[e] = new fe(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  re[e] = new fe(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  re[e] = new fe(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var sa = /[\-:]([a-z])/g;
function aa(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    sa,
    aa
  );
  re[t] = new fe(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(sa, aa);
  re[t] = new fe(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(sa, aa);
  re[t] = new fe(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  re[e] = new fe(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
re.xlinkHref = new fe("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  re[e] = new fe(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function ia(e, t, n, r) {
  var s = re.hasOwnProperty(t) ? re[t] : null;
  (s !== null ? s.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (gd(t, n, s, r) && (n = null), r || s === null ? hd(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : s.mustUseProperty ? e[s.propertyName] = n === null ? s.type === 3 ? !1 : "" : n : (t = s.attributeName, r = s.attributeNamespace, n === null ? e.removeAttribute(t) : (s = s.type, n = s === 3 || s === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var rt = fd.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, yr = Symbol.for("react.element"), qt = Symbol.for("react.portal"), Yt = Symbol.for("react.fragment"), oa = Symbol.for("react.strict_mode"), us = Symbol.for("react.profiler"), Io = Symbol.for("react.provider"), Po = Symbol.for("react.context"), ca = Symbol.for("react.forward_ref"), ds = Symbol.for("react.suspense"), ms = Symbol.for("react.suspense_list"), ua = Symbol.for("react.memo"), st = Symbol.for("react.lazy"), $o = Symbol.for("react.offscreen"), ri = Symbol.iterator;
function Cn(e) {
  return e === null || typeof e != "object" ? null : (e = ri && e[ri] || e["@@iterator"], typeof e == "function" ? e : null);
}
var H = Object.assign, Rl;
function Pn(e) {
  if (Rl === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    Rl = t && t[1] || "";
  }
  return `
` + Rl + e;
}
var Ol = !1;
function zl(e, t) {
  if (!e || Ol) return "";
  Ol = !0;
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
      for (var s = u.stack.split(`
`), a = r.stack.split(`
`), i = s.length - 1, o = a.length - 1; 1 <= i && 0 <= o && s[i] !== a[o]; ) o--;
      for (; 1 <= i && 0 <= o; i--, o--) if (s[i] !== a[o]) {
        if (i !== 1 || o !== 1)
          do
            if (i--, o--, 0 > o || s[i] !== a[o]) {
              var c = `
` + s[i].replace(" at new ", " at ");
              return e.displayName && c.includes("<anonymous>") && (c = c.replace("<anonymous>", e.displayName)), c;
            }
          while (1 <= i && 0 <= o);
        break;
      }
    }
  } finally {
    Ol = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? Pn(e) : "";
}
function yd(e) {
  switch (e.tag) {
    case 5:
      return Pn(e.type);
    case 16:
      return Pn("Lazy");
    case 13:
      return Pn("Suspense");
    case 19:
      return Pn("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = zl(e.type, !1), e;
    case 11:
      return e = zl(e.type.render, !1), e;
    case 1:
      return e = zl(e.type, !0), e;
    default:
      return "";
  }
}
function fs(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Yt:
      return "Fragment";
    case qt:
      return "Portal";
    case us:
      return "Profiler";
    case oa:
      return "StrictMode";
    case ds:
      return "Suspense";
    case ms:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Po:
      return (e.displayName || "Context") + ".Consumer";
    case Io:
      return (e._context.displayName || "Context") + ".Provider";
    case ca:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case ua:
      return t = e.displayName || null, t !== null ? t : fs(e.type) || "Memo";
    case st:
      t = e._payload, e = e._init;
      try {
        return fs(e(t));
      } catch {
      }
  }
  return null;
}
function xd(e) {
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
      return fs(t);
    case 8:
      return t === oa ? "StrictMode" : "Mode";
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
function xt(e) {
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
function Ao(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function jd(e) {
  var t = Ao(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var s = n.get, a = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return s.call(this);
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
function xr(e) {
  e._valueTracker || (e._valueTracker = jd(e));
}
function Ro(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), r = "";
  return e && (r = Ao(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
}
function Qr(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function ps(e, t) {
  var n = t.checked;
  return H({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function li(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
  n = xt(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Oo(e, t) {
  t = t.checked, t != null && ia(e, "checked", t, !1);
}
function hs(e, t) {
  Oo(e, t);
  var n = xt(t.value), r = t.type;
  if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? vs(e, t.type, n) : t.hasOwnProperty("defaultValue") && vs(e, t.type, xt(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function si(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function vs(e, t, n) {
  (t !== "number" || Qr(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var $n = Array.isArray;
function an(e, t, n, r) {
  if (e = e.options, t) {
    t = {};
    for (var s = 0; s < n.length; s++) t["$" + n[s]] = !0;
    for (n = 0; n < e.length; n++) s = t.hasOwnProperty("$" + e[n].value), e[n].selected !== s && (e[n].selected = s), s && r && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + xt(n), t = null, s = 0; s < e.length; s++) {
      if (e[s].value === n) {
        e[s].selected = !0, r && (e[s].defaultSelected = !0);
        return;
      }
      t !== null || e[s].disabled || (t = e[s]);
    }
    t !== null && (t.selected = !0);
  }
}
function gs(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(w(91));
  return H({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function ai(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(w(92));
      if ($n(n)) {
        if (1 < n.length) throw Error(w(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: xt(n) };
}
function zo(e, t) {
  var n = xt(t.value), r = xt(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
}
function ii(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Fo(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function ys(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Fo(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var jr, Bo = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, s) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, r, s);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (jr = jr || document.createElement("div"), jr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = jr.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function Yn(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var On = {
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
}, Nd = ["Webkit", "ms", "Moz", "O"];
Object.keys(On).forEach(function(e) {
  Nd.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), On[t] = On[e];
  });
});
function Uo(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || On.hasOwnProperty(e) && On[e] ? ("" + t).trim() : t + "px";
}
function Vo(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var r = n.indexOf("--") === 0, s = Uo(n, t[n], r);
    n === "float" && (n = "cssFloat"), r ? e.setProperty(n, s) : e[n] = s;
  }
}
var wd = H({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function xs(e, t) {
  if (t) {
    if (wd[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(w(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(w(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(w(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(w(62));
  }
}
function js(e, t) {
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
var Ns = null;
function da(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var ws = null, on = null, cn = null;
function oi(e) {
  if (e = fr(e)) {
    if (typeof ws != "function") throw Error(w(280));
    var t = e.stateNode;
    t && (t = jl(t), ws(e.stateNode, e.type, t));
  }
}
function Ho(e) {
  on ? cn ? cn.push(e) : cn = [e] : on = e;
}
function Wo() {
  if (on) {
    var e = on, t = cn;
    if (cn = on = null, oi(e), t) for (e = 0; e < t.length; e++) oi(t[e]);
  }
}
function Qo(e, t) {
  return e(t);
}
function qo() {
}
var Fl = !1;
function Yo(e, t, n) {
  if (Fl) return e(t, n);
  Fl = !0;
  try {
    return Qo(e, t, n);
  } finally {
    Fl = !1, (on !== null || cn !== null) && (qo(), Wo());
  }
}
function Kn(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = jl(n);
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
  if (n && typeof n != "function") throw Error(w(231, t, typeof n));
  return n;
}
var ks = !1;
if (Je) try {
  var En = {};
  Object.defineProperty(En, "passive", { get: function() {
    ks = !0;
  } }), window.addEventListener("test", En, En), window.removeEventListener("test", En, En);
} catch {
  ks = !1;
}
function kd(e, t, n, r, s, a, i, o, c) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, u);
  } catch (h) {
    this.onError(h);
  }
}
var zn = !1, qr = null, Yr = !1, Ss = null, Sd = { onError: function(e) {
  zn = !0, qr = e;
} };
function Cd(e, t, n, r, s, a, i, o, c) {
  zn = !1, qr = null, kd.apply(Sd, arguments);
}
function Ed(e, t, n, r, s, a, i, o, c) {
  if (Cd.apply(this, arguments), zn) {
    if (zn) {
      var u = qr;
      zn = !1, qr = null;
    } else throw Error(w(198));
    Yr || (Yr = !0, Ss = u);
  }
}
function Vt(e) {
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
function Ko(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function ci(e) {
  if (Vt(e) !== e) throw Error(w(188));
}
function Td(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Vt(e), t === null) throw Error(w(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var s = n.return;
    if (s === null) break;
    var a = s.alternate;
    if (a === null) {
      if (r = s.return, r !== null) {
        n = r;
        continue;
      }
      break;
    }
    if (s.child === a.child) {
      for (a = s.child; a; ) {
        if (a === n) return ci(s), e;
        if (a === r) return ci(s), t;
        a = a.sibling;
      }
      throw Error(w(188));
    }
    if (n.return !== r.return) n = s, r = a;
    else {
      for (var i = !1, o = s.child; o; ) {
        if (o === n) {
          i = !0, n = s, r = a;
          break;
        }
        if (o === r) {
          i = !0, r = s, n = a;
          break;
        }
        o = o.sibling;
      }
      if (!i) {
        for (o = a.child; o; ) {
          if (o === n) {
            i = !0, n = a, r = s;
            break;
          }
          if (o === r) {
            i = !0, r = a, n = s;
            break;
          }
          o = o.sibling;
        }
        if (!i) throw Error(w(189));
      }
    }
    if (n.alternate !== r) throw Error(w(190));
  }
  if (n.tag !== 3) throw Error(w(188));
  return n.stateNode.current === n ? e : t;
}
function Go(e) {
  return e = Td(e), e !== null ? Zo(e) : null;
}
function Zo(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = Zo(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var Xo = ke.unstable_scheduleCallback, ui = ke.unstable_cancelCallback, bd = ke.unstable_shouldYield, _d = ke.unstable_requestPaint, q = ke.unstable_now, Md = ke.unstable_getCurrentPriorityLevel, ma = ke.unstable_ImmediatePriority, Jo = ke.unstable_UserBlockingPriority, Kr = ke.unstable_NormalPriority, Ld = ke.unstable_LowPriority, ec = ke.unstable_IdlePriority, vl = null, Ve = null;
function Dd(e) {
  if (Ve && typeof Ve.onCommitFiberRoot == "function") try {
    Ve.onCommitFiberRoot(vl, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var Ae = Math.clz32 ? Math.clz32 : $d, Id = Math.log, Pd = Math.LN2;
function $d(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (Id(e) / Pd | 0) | 0;
}
var Nr = 64, wr = 4194304;
function An(e) {
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
function Gr(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0, s = e.suspendedLanes, a = e.pingedLanes, i = n & 268435455;
  if (i !== 0) {
    var o = i & ~s;
    o !== 0 ? r = An(o) : (a &= i, a !== 0 && (r = An(a)));
  } else i = n & ~s, i !== 0 ? r = An(i) : a !== 0 && (r = An(a));
  if (r === 0) return 0;
  if (t !== 0 && t !== r && !(t & s) && (s = r & -r, a = t & -t, s >= a || s === 16 && (a & 4194240) !== 0)) return t;
  if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t; ) n = 31 - Ae(t), s = 1 << n, r |= e[n], t &= ~s;
  return r;
}
function Ad(e, t) {
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
function Rd(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, s = e.expirationTimes, a = e.pendingLanes; 0 < a; ) {
    var i = 31 - Ae(a), o = 1 << i, c = s[i];
    c === -1 ? (!(o & n) || o & r) && (s[i] = Ad(o, t)) : c <= t && (e.expiredLanes |= o), a &= ~o;
  }
}
function Cs(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function tc() {
  var e = Nr;
  return Nr <<= 1, !(Nr & 4194240) && (Nr = 64), e;
}
function Bl(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function dr(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Ae(t), e[t] = n;
}
function Od(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var s = 31 - Ae(n), a = 1 << s;
    t[s] = 0, r[s] = -1, e[s] = -1, n &= ~a;
  }
}
function fa(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var r = 31 - Ae(n), s = 1 << r;
    s & t | e[r] & t && (e[r] |= t), n &= ~s;
  }
}
var A = 0;
function nc(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var rc, pa, lc, sc, ac, Es = !1, kr = [], dt = null, mt = null, ft = null, Gn = /* @__PURE__ */ new Map(), Zn = /* @__PURE__ */ new Map(), it = [], zd = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function di(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      dt = null;
      break;
    case "dragenter":
    case "dragleave":
      mt = null;
      break;
    case "mouseover":
    case "mouseout":
      ft = null;
      break;
    case "pointerover":
    case "pointerout":
      Gn.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Zn.delete(t.pointerId);
  }
}
function Tn(e, t, n, r, s, a) {
  return e === null || e.nativeEvent !== a ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: a, targetContainers: [s] }, t !== null && (t = fr(t), t !== null && pa(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, s !== null && t.indexOf(s) === -1 && t.push(s), e);
}
function Fd(e, t, n, r, s) {
  switch (t) {
    case "focusin":
      return dt = Tn(dt, e, t, n, r, s), !0;
    case "dragenter":
      return mt = Tn(mt, e, t, n, r, s), !0;
    case "mouseover":
      return ft = Tn(ft, e, t, n, r, s), !0;
    case "pointerover":
      var a = s.pointerId;
      return Gn.set(a, Tn(Gn.get(a) || null, e, t, n, r, s)), !0;
    case "gotpointercapture":
      return a = s.pointerId, Zn.set(a, Tn(Zn.get(a) || null, e, t, n, r, s)), !0;
  }
  return !1;
}
function ic(e) {
  var t = Lt(e.target);
  if (t !== null) {
    var n = Vt(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = Ko(n), t !== null) {
          e.blockedOn = t, ac(e.priority, function() {
            lc(n);
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
function Ar(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Ts(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      Ns = r, n.target.dispatchEvent(r), Ns = null;
    } else return t = fr(n), t !== null && pa(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function mi(e, t, n) {
  Ar(e) && n.delete(t);
}
function Bd() {
  Es = !1, dt !== null && Ar(dt) && (dt = null), mt !== null && Ar(mt) && (mt = null), ft !== null && Ar(ft) && (ft = null), Gn.forEach(mi), Zn.forEach(mi);
}
function bn(e, t) {
  e.blockedOn === t && (e.blockedOn = null, Es || (Es = !0, ke.unstable_scheduleCallback(ke.unstable_NormalPriority, Bd)));
}
function Xn(e) {
  function t(s) {
    return bn(s, e);
  }
  if (0 < kr.length) {
    bn(kr[0], e);
    for (var n = 1; n < kr.length; n++) {
      var r = kr[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (dt !== null && bn(dt, e), mt !== null && bn(mt, e), ft !== null && bn(ft, e), Gn.forEach(t), Zn.forEach(t), n = 0; n < it.length; n++) r = it[n], r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < it.length && (n = it[0], n.blockedOn === null); ) ic(n), n.blockedOn === null && it.shift();
}
var un = rt.ReactCurrentBatchConfig, Zr = !0;
function Ud(e, t, n, r) {
  var s = A, a = un.transition;
  un.transition = null;
  try {
    A = 1, ha(e, t, n, r);
  } finally {
    A = s, un.transition = a;
  }
}
function Vd(e, t, n, r) {
  var s = A, a = un.transition;
  un.transition = null;
  try {
    A = 4, ha(e, t, n, r);
  } finally {
    A = s, un.transition = a;
  }
}
function ha(e, t, n, r) {
  if (Zr) {
    var s = Ts(e, t, n, r);
    if (s === null) Zl(e, t, r, Xr, n), di(e, r);
    else if (Fd(s, e, t, n, r)) r.stopPropagation();
    else if (di(e, r), t & 4 && -1 < zd.indexOf(e)) {
      for (; s !== null; ) {
        var a = fr(s);
        if (a !== null && rc(a), a = Ts(e, t, n, r), a === null && Zl(e, t, r, Xr, n), a === s) break;
        s = a;
      }
      s !== null && r.stopPropagation();
    } else Zl(e, t, r, null, n);
  }
}
var Xr = null;
function Ts(e, t, n, r) {
  if (Xr = null, e = da(r), e = Lt(e), e !== null) if (t = Vt(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = Ko(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return Xr = e, null;
}
function oc(e) {
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
      switch (Md()) {
        case ma:
          return 1;
        case Jo:
          return 4;
        case Kr:
        case Ld:
          return 16;
        case ec:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var ct = null, va = null, Rr = null;
function cc() {
  if (Rr) return Rr;
  var e, t = va, n = t.length, r, s = "value" in ct ? ct.value : ct.textContent, a = s.length;
  for (e = 0; e < n && t[e] === s[e]; e++) ;
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === s[a - r]; r++) ;
  return Rr = s.slice(e, 1 < r ? 1 - r : void 0);
}
function Or(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Sr() {
  return !0;
}
function fi() {
  return !1;
}
function Ce(e) {
  function t(n, r, s, a, i) {
    this._reactName = n, this._targetInst = s, this.type = r, this.nativeEvent = a, this.target = i, this.currentTarget = null;
    for (var o in e) e.hasOwnProperty(o) && (n = e[o], this[o] = n ? n(a) : a[o]);
    return this.isDefaultPrevented = (a.defaultPrevented != null ? a.defaultPrevented : a.returnValue === !1) ? Sr : fi, this.isPropagationStopped = fi, this;
  }
  return H(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Sr);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Sr);
  }, persist: function() {
  }, isPersistent: Sr }), t;
}
var Nn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, ga = Ce(Nn), mr = H({}, Nn, { view: 0, detail: 0 }), Hd = Ce(mr), Ul, Vl, _n, gl = H({}, mr, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: ya, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== _n && (_n && e.type === "mousemove" ? (Ul = e.screenX - _n.screenX, Vl = e.screenY - _n.screenY) : Vl = Ul = 0, _n = e), Ul);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : Vl;
} }), pi = Ce(gl), Wd = H({}, gl, { dataTransfer: 0 }), Qd = Ce(Wd), qd = H({}, mr, { relatedTarget: 0 }), Hl = Ce(qd), Yd = H({}, Nn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Kd = Ce(Yd), Gd = H({}, Nn, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), Zd = Ce(Gd), Xd = H({}, Nn, { data: 0 }), hi = Ce(Xd), Jd = {
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
}, em = {
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
}, tm = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function nm(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = tm[e]) ? !!t[e] : !1;
}
function ya() {
  return nm;
}
var rm = H({}, mr, { key: function(e) {
  if (e.key) {
    var t = Jd[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = Or(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? em[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: ya, charCode: function(e) {
  return e.type === "keypress" ? Or(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Or(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), lm = Ce(rm), sm = H({}, gl, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), vi = Ce(sm), am = H({}, mr, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: ya }), im = Ce(am), om = H({}, Nn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), cm = Ce(om), um = H({}, gl, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), dm = Ce(um), mm = [9, 13, 27, 32], xa = Je && "CompositionEvent" in window, Fn = null;
Je && "documentMode" in document && (Fn = document.documentMode);
var fm = Je && "TextEvent" in window && !Fn, uc = Je && (!xa || Fn && 8 < Fn && 11 >= Fn), gi = " ", yi = !1;
function dc(e, t) {
  switch (e) {
    case "keyup":
      return mm.indexOf(t.keyCode) !== -1;
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
function mc(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var Kt = !1;
function pm(e, t) {
  switch (e) {
    case "compositionend":
      return mc(t);
    case "keypress":
      return t.which !== 32 ? null : (yi = !0, gi);
    case "textInput":
      return e = t.data, e === gi && yi ? null : e;
    default:
      return null;
  }
}
function hm(e, t) {
  if (Kt) return e === "compositionend" || !xa && dc(e, t) ? (e = cc(), Rr = va = ct = null, Kt = !1, e) : null;
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
      return uc && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var vm = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function xi(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!vm[e.type] : t === "textarea";
}
function fc(e, t, n, r) {
  Ho(r), t = Jr(t, "onChange"), 0 < t.length && (n = new ga("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
}
var Bn = null, Jn = null;
function gm(e) {
  Sc(e, 0);
}
function yl(e) {
  var t = Xt(e);
  if (Ro(t)) return e;
}
function ym(e, t) {
  if (e === "change") return t;
}
var pc = !1;
if (Je) {
  var Wl;
  if (Je) {
    var Ql = "oninput" in document;
    if (!Ql) {
      var ji = document.createElement("div");
      ji.setAttribute("oninput", "return;"), Ql = typeof ji.oninput == "function";
    }
    Wl = Ql;
  } else Wl = !1;
  pc = Wl && (!document.documentMode || 9 < document.documentMode);
}
function Ni() {
  Bn && (Bn.detachEvent("onpropertychange", hc), Jn = Bn = null);
}
function hc(e) {
  if (e.propertyName === "value" && yl(Jn)) {
    var t = [];
    fc(t, Jn, e, da(e)), Yo(gm, t);
  }
}
function xm(e, t, n) {
  e === "focusin" ? (Ni(), Bn = t, Jn = n, Bn.attachEvent("onpropertychange", hc)) : e === "focusout" && Ni();
}
function jm(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return yl(Jn);
}
function Nm(e, t) {
  if (e === "click") return yl(t);
}
function wm(e, t) {
  if (e === "input" || e === "change") return yl(t);
}
function km(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Oe = typeof Object.is == "function" ? Object.is : km;
function er(e, t) {
  if (Oe(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var s = n[r];
    if (!cs.call(t, s) || !Oe(e[s], t[s])) return !1;
  }
  return !0;
}
function wi(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function ki(e, t) {
  var n = wi(e);
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
    n = wi(n);
  }
}
function vc(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? vc(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function gc() {
  for (var e = window, t = Qr(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = Qr(e.document);
  }
  return t;
}
function ja(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function Sm(e) {
  var t = gc(), n = e.focusedElem, r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && vc(n.ownerDocument.documentElement, n)) {
    if (r !== null && ja(n)) {
      if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var s = n.textContent.length, a = Math.min(r.start, s);
        r = r.end === void 0 ? a : Math.min(r.end, s), !e.extend && a > r && (s = r, r = a, a = s), s = ki(n, a);
        var i = ki(
          n,
          r
        );
        s && i && (e.rangeCount !== 1 || e.anchorNode !== s.node || e.anchorOffset !== s.offset || e.focusNode !== i.node || e.focusOffset !== i.offset) && (t = t.createRange(), t.setStart(s.node, s.offset), e.removeAllRanges(), a > r ? (e.addRange(t), e.extend(i.node, i.offset)) : (t.setEnd(i.node, i.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var Cm = Je && "documentMode" in document && 11 >= document.documentMode, Gt = null, bs = null, Un = null, _s = !1;
function Si(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  _s || Gt == null || Gt !== Qr(r) || (r = Gt, "selectionStart" in r && ja(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), Un && er(Un, r) || (Un = r, r = Jr(bs, "onSelect"), 0 < r.length && (t = new ga("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = Gt)));
}
function Cr(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var Zt = { animationend: Cr("Animation", "AnimationEnd"), animationiteration: Cr("Animation", "AnimationIteration"), animationstart: Cr("Animation", "AnimationStart"), transitionend: Cr("Transition", "TransitionEnd") }, ql = {}, yc = {};
Je && (yc = document.createElement("div").style, "AnimationEvent" in window || (delete Zt.animationend.animation, delete Zt.animationiteration.animation, delete Zt.animationstart.animation), "TransitionEvent" in window || delete Zt.transitionend.transition);
function xl(e) {
  if (ql[e]) return ql[e];
  if (!Zt[e]) return e;
  var t = Zt[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in yc) return ql[e] = t[n];
  return e;
}
var xc = xl("animationend"), jc = xl("animationiteration"), Nc = xl("animationstart"), wc = xl("transitionend"), kc = /* @__PURE__ */ new Map(), Ci = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Nt(e, t) {
  kc.set(e, t), Ut(t, [e]);
}
for (var Yl = 0; Yl < Ci.length; Yl++) {
  var Kl = Ci[Yl], Em = Kl.toLowerCase(), Tm = Kl[0].toUpperCase() + Kl.slice(1);
  Nt(Em, "on" + Tm);
}
Nt(xc, "onAnimationEnd");
Nt(jc, "onAnimationIteration");
Nt(Nc, "onAnimationStart");
Nt("dblclick", "onDoubleClick");
Nt("focusin", "onFocus");
Nt("focusout", "onBlur");
Nt(wc, "onTransitionEnd");
fn("onMouseEnter", ["mouseout", "mouseover"]);
fn("onMouseLeave", ["mouseout", "mouseover"]);
fn("onPointerEnter", ["pointerout", "pointerover"]);
fn("onPointerLeave", ["pointerout", "pointerover"]);
Ut("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Ut("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Ut("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Ut("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Ut("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Ut("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Rn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), bm = new Set("cancel close invalid load scroll toggle".split(" ").concat(Rn));
function Ei(e, t, n) {
  var r = e.type || "unknown-event";
  e.currentTarget = n, Ed(r, t, void 0, e), e.currentTarget = null;
}
function Sc(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n], s = r.event;
    r = r.listeners;
    e: {
      var a = void 0;
      if (t) for (var i = r.length - 1; 0 <= i; i--) {
        var o = r[i], c = o.instance, u = o.currentTarget;
        if (o = o.listener, c !== a && s.isPropagationStopped()) break e;
        Ei(s, o, u), a = c;
      }
      else for (i = 0; i < r.length; i++) {
        if (o = r[i], c = o.instance, u = o.currentTarget, o = o.listener, c !== a && s.isPropagationStopped()) break e;
        Ei(s, o, u), a = c;
      }
    }
  }
  if (Yr) throw e = Ss, Yr = !1, Ss = null, e;
}
function z(e, t) {
  var n = t[Ps];
  n === void 0 && (n = t[Ps] = /* @__PURE__ */ new Set());
  var r = e + "__bubble";
  n.has(r) || (Cc(t, e, 2, !1), n.add(r));
}
function Gl(e, t, n) {
  var r = 0;
  t && (r |= 4), Cc(n, e, r, t);
}
var Er = "_reactListening" + Math.random().toString(36).slice(2);
function tr(e) {
  if (!e[Er]) {
    e[Er] = !0, Do.forEach(function(n) {
      n !== "selectionchange" && (bm.has(n) || Gl(n, !1, e), Gl(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Er] || (t[Er] = !0, Gl("selectionchange", !1, t));
  }
}
function Cc(e, t, n, r) {
  switch (oc(t)) {
    case 1:
      var s = Ud;
      break;
    case 4:
      s = Vd;
      break;
    default:
      s = ha;
  }
  n = s.bind(null, t, n, e), s = void 0, !ks || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (s = !0), r ? s !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: s }) : e.addEventListener(t, n, !0) : s !== void 0 ? e.addEventListener(t, n, { passive: s }) : e.addEventListener(t, n, !1);
}
function Zl(e, t, n, r, s) {
  var a = r;
  if (!(t & 1) && !(t & 2) && r !== null) e: for (; ; ) {
    if (r === null) return;
    var i = r.tag;
    if (i === 3 || i === 4) {
      var o = r.stateNode.containerInfo;
      if (o === s || o.nodeType === 8 && o.parentNode === s) break;
      if (i === 4) for (i = r.return; i !== null; ) {
        var c = i.tag;
        if ((c === 3 || c === 4) && (c = i.stateNode.containerInfo, c === s || c.nodeType === 8 && c.parentNode === s)) return;
        i = i.return;
      }
      for (; o !== null; ) {
        if (i = Lt(o), i === null) return;
        if (c = i.tag, c === 5 || c === 6) {
          r = a = i;
          continue e;
        }
        o = o.parentNode;
      }
    }
    r = r.return;
  }
  Yo(function() {
    var u = a, h = da(n), f = [];
    e: {
      var d = kc.get(e);
      if (d !== void 0) {
        var g = ga, j = e;
        switch (e) {
          case "keypress":
            if (Or(n) === 0) break e;
          case "keydown":
          case "keyup":
            g = lm;
            break;
          case "focusin":
            j = "focus", g = Hl;
            break;
          case "focusout":
            j = "blur", g = Hl;
            break;
          case "beforeblur":
          case "afterblur":
            g = Hl;
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
            g = pi;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            g = Qd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            g = im;
            break;
          case xc:
          case jc:
          case Nc:
            g = Kd;
            break;
          case wc:
            g = cm;
            break;
          case "scroll":
            g = Hd;
            break;
          case "wheel":
            g = dm;
            break;
          case "copy":
          case "cut":
          case "paste":
            g = Zd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            g = vi;
        }
        var N = (t & 4) !== 0, k = !N && e === "scroll", p = N ? d !== null ? d + "Capture" : null : d;
        N = [];
        for (var m = u, v; m !== null; ) {
          v = m;
          var y = v.stateNode;
          if (v.tag === 5 && y !== null && (v = y, p !== null && (y = Kn(m, p), y != null && N.push(nr(m, y, v)))), k) break;
          m = m.return;
        }
        0 < N.length && (d = new g(d, j, null, n, h), f.push({ event: d, listeners: N }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (d = e === "mouseover" || e === "pointerover", g = e === "mouseout" || e === "pointerout", d && n !== Ns && (j = n.relatedTarget || n.fromElement) && (Lt(j) || j[et])) break e;
        if ((g || d) && (d = h.window === h ? h : (d = h.ownerDocument) ? d.defaultView || d.parentWindow : window, g ? (j = n.relatedTarget || n.toElement, g = u, j = j ? Lt(j) : null, j !== null && (k = Vt(j), j !== k || j.tag !== 5 && j.tag !== 6) && (j = null)) : (g = null, j = u), g !== j)) {
          if (N = pi, y = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (N = vi, y = "onPointerLeave", p = "onPointerEnter", m = "pointer"), k = g == null ? d : Xt(g), v = j == null ? d : Xt(j), d = new N(y, m + "leave", g, n, h), d.target = k, d.relatedTarget = v, y = null, Lt(h) === u && (N = new N(p, m + "enter", j, n, h), N.target = v, N.relatedTarget = k, y = N), k = y, g && j) t: {
            for (N = g, p = j, m = 0, v = N; v; v = Ht(v)) m++;
            for (v = 0, y = p; y; y = Ht(y)) v++;
            for (; 0 < m - v; ) N = Ht(N), m--;
            for (; 0 < v - m; ) p = Ht(p), v--;
            for (; m--; ) {
              if (N === p || p !== null && N === p.alternate) break t;
              N = Ht(N), p = Ht(p);
            }
            N = null;
          }
          else N = null;
          g !== null && Ti(f, d, g, N, !1), j !== null && k !== null && Ti(f, k, j, N, !0);
        }
      }
      e: {
        if (d = u ? Xt(u) : window, g = d.nodeName && d.nodeName.toLowerCase(), g === "select" || g === "input" && d.type === "file") var S = ym;
        else if (xi(d)) if (pc) S = wm;
        else {
          S = jm;
          var T = xm;
        }
        else (g = d.nodeName) && g.toLowerCase() === "input" && (d.type === "checkbox" || d.type === "radio") && (S = Nm);
        if (S && (S = S(e, u))) {
          fc(f, S, n, h);
          break e;
        }
        T && T(e, d, u), e === "focusout" && (T = d._wrapperState) && T.controlled && d.type === "number" && vs(d, "number", d.value);
      }
      switch (T = u ? Xt(u) : window, e) {
        case "focusin":
          (xi(T) || T.contentEditable === "true") && (Gt = T, bs = u, Un = null);
          break;
        case "focusout":
          Un = bs = Gt = null;
          break;
        case "mousedown":
          _s = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          _s = !1, Si(f, n, h);
          break;
        case "selectionchange":
          if (Cm) break;
        case "keydown":
        case "keyup":
          Si(f, n, h);
      }
      var _;
      if (xa) e: {
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
      else Kt ? dc(e, n) && (L = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (L = "onCompositionStart");
      L && (uc && n.locale !== "ko" && (Kt || L !== "onCompositionStart" ? L === "onCompositionEnd" && Kt && (_ = cc()) : (ct = h, va = "value" in ct ? ct.value : ct.textContent, Kt = !0)), T = Jr(u, L), 0 < T.length && (L = new hi(L, e, null, n, h), f.push({ event: L, listeners: T }), _ ? L.data = _ : (_ = mc(n), _ !== null && (L.data = _)))), (_ = fm ? pm(e, n) : hm(e, n)) && (u = Jr(u, "onBeforeInput"), 0 < u.length && (h = new hi("onBeforeInput", "beforeinput", null, n, h), f.push({ event: h, listeners: u }), h.data = _));
    }
    Sc(f, t);
  });
}
function nr(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function Jr(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var s = e, a = s.stateNode;
    s.tag === 5 && a !== null && (s = a, a = Kn(e, n), a != null && r.unshift(nr(e, a, s)), a = Kn(e, t), a != null && r.push(nr(e, a, s))), e = e.return;
  }
  return r;
}
function Ht(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function Ti(e, t, n, r, s) {
  for (var a = t._reactName, i = []; n !== null && n !== r; ) {
    var o = n, c = o.alternate, u = o.stateNode;
    if (c !== null && c === r) break;
    o.tag === 5 && u !== null && (o = u, s ? (c = Kn(n, a), c != null && i.unshift(nr(n, c, o))) : s || (c = Kn(n, a), c != null && i.push(nr(n, c, o)))), n = n.return;
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var _m = /\r\n?/g, Mm = /\u0000|\uFFFD/g;
function bi(e) {
  return (typeof e == "string" ? e : "" + e).replace(_m, `
`).replace(Mm, "");
}
function Tr(e, t, n) {
  if (t = bi(t), bi(e) !== t && n) throw Error(w(425));
}
function el() {
}
var Ms = null, Ls = null;
function Ds(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var Is = typeof setTimeout == "function" ? setTimeout : void 0, Lm = typeof clearTimeout == "function" ? clearTimeout : void 0, _i = typeof Promise == "function" ? Promise : void 0, Dm = typeof queueMicrotask == "function" ? queueMicrotask : typeof _i < "u" ? function(e) {
  return _i.resolve(null).then(e).catch(Im);
} : Is;
function Im(e) {
  setTimeout(function() {
    throw e;
  });
}
function Xl(e, t) {
  var n = t, r = 0;
  do {
    var s = n.nextSibling;
    if (e.removeChild(n), s && s.nodeType === 8) if (n = s.data, n === "/$") {
      if (r === 0) {
        e.removeChild(s), Xn(t);
        return;
      }
      r--;
    } else n !== "$" && n !== "$?" && n !== "$!" || r++;
    n = s;
  } while (n);
  Xn(t);
}
function pt(e) {
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
function Mi(e) {
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
var wn = Math.random().toString(36).slice(2), Ue = "__reactFiber$" + wn, rr = "__reactProps$" + wn, et = "__reactContainer$" + wn, Ps = "__reactEvents$" + wn, Pm = "__reactListeners$" + wn, $m = "__reactHandles$" + wn;
function Lt(e) {
  var t = e[Ue];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[et] || n[Ue]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Mi(e); e !== null; ) {
        if (n = e[Ue]) return n;
        e = Mi(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function fr(e) {
  return e = e[Ue] || e[et], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function Xt(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(w(33));
}
function jl(e) {
  return e[rr] || null;
}
var $s = [], Jt = -1;
function wt(e) {
  return { current: e };
}
function F(e) {
  0 > Jt || (e.current = $s[Jt], $s[Jt] = null, Jt--);
}
function R(e, t) {
  Jt++, $s[Jt] = e.current, e.current = t;
}
var jt = {}, oe = wt(jt), ve = wt(!1), Rt = jt;
function pn(e, t) {
  var n = e.type.contextTypes;
  if (!n) return jt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
  var s = {}, a;
  for (a in n) s[a] = t[a];
  return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = s), s;
}
function ge(e) {
  return e = e.childContextTypes, e != null;
}
function tl() {
  F(ve), F(oe);
}
function Li(e, t, n) {
  if (oe.current !== jt) throw Error(w(168));
  R(oe, t), R(ve, n);
}
function Ec(e, t, n) {
  var r = e.stateNode;
  if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
  r = r.getChildContext();
  for (var s in r) if (!(s in t)) throw Error(w(108, xd(e) || "Unknown", s));
  return H({}, n, r);
}
function nl(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || jt, Rt = oe.current, R(oe, e), R(ve, ve.current), !0;
}
function Di(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(w(169));
  n ? (e = Ec(e, t, Rt), r.__reactInternalMemoizedMergedChildContext = e, F(ve), F(oe), R(oe, e)) : F(ve), R(ve, n);
}
var Ye = null, Nl = !1, Jl = !1;
function Tc(e) {
  Ye === null ? Ye = [e] : Ye.push(e);
}
function Am(e) {
  Nl = !0, Tc(e);
}
function kt() {
  if (!Jl && Ye !== null) {
    Jl = !0;
    var e = 0, t = A;
    try {
      var n = Ye;
      for (A = 1; e < n.length; e++) {
        var r = n[e];
        do
          r = r(!0);
        while (r !== null);
      }
      Ye = null, Nl = !1;
    } catch (s) {
      throw Ye !== null && (Ye = Ye.slice(e + 1)), Xo(ma, kt), s;
    } finally {
      A = t, Jl = !1;
    }
  }
  return null;
}
var en = [], tn = 0, rl = null, ll = 0, Ee = [], Te = 0, Ot = null, Ke = 1, Ge = "";
function _t(e, t) {
  en[tn++] = ll, en[tn++] = rl, rl = e, ll = t;
}
function bc(e, t, n) {
  Ee[Te++] = Ke, Ee[Te++] = Ge, Ee[Te++] = Ot, Ot = e;
  var r = Ke;
  e = Ge;
  var s = 32 - Ae(r) - 1;
  r &= ~(1 << s), n += 1;
  var a = 32 - Ae(t) + s;
  if (30 < a) {
    var i = s - s % 5;
    a = (r & (1 << i) - 1).toString(32), r >>= i, s -= i, Ke = 1 << 32 - Ae(t) + s | n << s | r, Ge = a + e;
  } else Ke = 1 << a | n << s | r, Ge = e;
}
function Na(e) {
  e.return !== null && (_t(e, 1), bc(e, 1, 0));
}
function wa(e) {
  for (; e === rl; ) rl = en[--tn], en[tn] = null, ll = en[--tn], en[tn] = null;
  for (; e === Ot; ) Ot = Ee[--Te], Ee[Te] = null, Ge = Ee[--Te], Ee[Te] = null, Ke = Ee[--Te], Ee[Te] = null;
}
var we = null, Ne = null, B = !1, $e = null;
function _c(e, t) {
  var n = be(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function Ii(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, we = e, Ne = pt(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, we = e, Ne = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = Ot !== null ? { id: Ke, overflow: Ge } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = be(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, we = e, Ne = null, !0) : !1;
    default:
      return !1;
  }
}
function As(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Rs(e) {
  if (B) {
    var t = Ne;
    if (t) {
      var n = t;
      if (!Ii(e, t)) {
        if (As(e)) throw Error(w(418));
        t = pt(n.nextSibling);
        var r = we;
        t && Ii(e, t) ? _c(r, n) : (e.flags = e.flags & -4097 | 2, B = !1, we = e);
      }
    } else {
      if (As(e)) throw Error(w(418));
      e.flags = e.flags & -4097 | 2, B = !1, we = e;
    }
  }
}
function Pi(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  we = e;
}
function br(e) {
  if (e !== we) return !1;
  if (!B) return Pi(e), B = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Ds(e.type, e.memoizedProps)), t && (t = Ne)) {
    if (As(e)) throw Mc(), Error(w(418));
    for (; t; ) _c(e, t), t = pt(t.nextSibling);
  }
  if (Pi(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(w(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Ne = pt(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Ne = null;
    }
  } else Ne = we ? pt(e.stateNode.nextSibling) : null;
  return !0;
}
function Mc() {
  for (var e = Ne; e; ) e = pt(e.nextSibling);
}
function hn() {
  Ne = we = null, B = !1;
}
function ka(e) {
  $e === null ? $e = [e] : $e.push(e);
}
var Rm = rt.ReactCurrentBatchConfig;
function Mn(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(w(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(w(147, e));
      var s = r, a = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === a ? t.ref : (t = function(i) {
        var o = s.refs;
        i === null ? delete o[a] : o[a] = i;
      }, t._stringRef = a, t);
    }
    if (typeof e != "string") throw Error(w(284));
    if (!n._owner) throw Error(w(290, e));
  }
  return e;
}
function _r(e, t) {
  throw e = Object.prototype.toString.call(t), Error(w(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function $i(e) {
  var t = e._init;
  return t(e._payload);
}
function Lc(e) {
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
  function s(p, m) {
    return p = yt(p, m), p.index = 0, p.sibling = null, p;
  }
  function a(p, m, v) {
    return p.index = v, e ? (v = p.alternate, v !== null ? (v = v.index, v < m ? (p.flags |= 2, m) : v) : (p.flags |= 2, m)) : (p.flags |= 1048576, m);
  }
  function i(p) {
    return e && p.alternate === null && (p.flags |= 2), p;
  }
  function o(p, m, v, y) {
    return m === null || m.tag !== 6 ? (m = as(v, p.mode, y), m.return = p, m) : (m = s(m, v), m.return = p, m);
  }
  function c(p, m, v, y) {
    var S = v.type;
    return S === Yt ? h(p, m, v.props.children, y, v.key) : m !== null && (m.elementType === S || typeof S == "object" && S !== null && S.$$typeof === st && $i(S) === m.type) ? (y = s(m, v.props), y.ref = Mn(p, m, v), y.return = p, y) : (y = Wr(v.type, v.key, v.props, null, p.mode, y), y.ref = Mn(p, m, v), y.return = p, y);
  }
  function u(p, m, v, y) {
    return m === null || m.tag !== 4 || m.stateNode.containerInfo !== v.containerInfo || m.stateNode.implementation !== v.implementation ? (m = is(v, p.mode, y), m.return = p, m) : (m = s(m, v.children || []), m.return = p, m);
  }
  function h(p, m, v, y, S) {
    return m === null || m.tag !== 7 ? (m = At(v, p.mode, y, S), m.return = p, m) : (m = s(m, v), m.return = p, m);
  }
  function f(p, m, v) {
    if (typeof m == "string" && m !== "" || typeof m == "number") return m = as("" + m, p.mode, v), m.return = p, m;
    if (typeof m == "object" && m !== null) {
      switch (m.$$typeof) {
        case yr:
          return v = Wr(m.type, m.key, m.props, null, p.mode, v), v.ref = Mn(p, null, m), v.return = p, v;
        case qt:
          return m = is(m, p.mode, v), m.return = p, m;
        case st:
          var y = m._init;
          return f(p, y(m._payload), v);
      }
      if ($n(m) || Cn(m)) return m = At(m, p.mode, v, null), m.return = p, m;
      _r(p, m);
    }
    return null;
  }
  function d(p, m, v, y) {
    var S = m !== null ? m.key : null;
    if (typeof v == "string" && v !== "" || typeof v == "number") return S !== null ? null : o(p, m, "" + v, y);
    if (typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case yr:
          return v.key === S ? c(p, m, v, y) : null;
        case qt:
          return v.key === S ? u(p, m, v, y) : null;
        case st:
          return S = v._init, d(
            p,
            m,
            S(v._payload),
            y
          );
      }
      if ($n(v) || Cn(v)) return S !== null ? null : h(p, m, v, y, null);
      _r(p, v);
    }
    return null;
  }
  function g(p, m, v, y, S) {
    if (typeof y == "string" && y !== "" || typeof y == "number") return p = p.get(v) || null, o(m, p, "" + y, S);
    if (typeof y == "object" && y !== null) {
      switch (y.$$typeof) {
        case yr:
          return p = p.get(y.key === null ? v : y.key) || null, c(m, p, y, S);
        case qt:
          return p = p.get(y.key === null ? v : y.key) || null, u(m, p, y, S);
        case st:
          var T = y._init;
          return g(p, m, v, T(y._payload), S);
      }
      if ($n(y) || Cn(y)) return p = p.get(v) || null, h(m, p, y, S, null);
      _r(m, y);
    }
    return null;
  }
  function j(p, m, v, y) {
    for (var S = null, T = null, _ = m, L = m = 0, O = null; _ !== null && L < v.length; L++) {
      _.index > L ? (O = _, _ = null) : O = _.sibling;
      var E = d(p, _, v[L], y);
      if (E === null) {
        _ === null && (_ = O);
        break;
      }
      e && _ && E.alternate === null && t(p, _), m = a(E, m, L), T === null ? S = E : T.sibling = E, T = E, _ = O;
    }
    if (L === v.length) return n(p, _), B && _t(p, L), S;
    if (_ === null) {
      for (; L < v.length; L++) _ = f(p, v[L], y), _ !== null && (m = a(_, m, L), T === null ? S = _ : T.sibling = _, T = _);
      return B && _t(p, L), S;
    }
    for (_ = r(p, _); L < v.length; L++) O = g(_, p, L, v[L], y), O !== null && (e && O.alternate !== null && _.delete(O.key === null ? L : O.key), m = a(O, m, L), T === null ? S = O : T.sibling = O, T = O);
    return e && _.forEach(function(xe) {
      return t(p, xe);
    }), B && _t(p, L), S;
  }
  function N(p, m, v, y) {
    var S = Cn(v);
    if (typeof S != "function") throw Error(w(150));
    if (v = S.call(v), v == null) throw Error(w(151));
    for (var T = S = null, _ = m, L = m = 0, O = null, E = v.next(); _ !== null && !E.done; L++, E = v.next()) {
      _.index > L ? (O = _, _ = null) : O = _.sibling;
      var xe = d(p, _, E.value, y);
      if (xe === null) {
        _ === null && (_ = O);
        break;
      }
      e && _ && xe.alternate === null && t(p, _), m = a(xe, m, L), T === null ? S = xe : T.sibling = xe, T = xe, _ = O;
    }
    if (E.done) return n(
      p,
      _
    ), B && _t(p, L), S;
    if (_ === null) {
      for (; !E.done; L++, E = v.next()) E = f(p, E.value, y), E !== null && (m = a(E, m, L), T === null ? S = E : T.sibling = E, T = E);
      return B && _t(p, L), S;
    }
    for (_ = r(p, _); !E.done; L++, E = v.next()) E = g(_, p, L, E.value, y), E !== null && (e && E.alternate !== null && _.delete(E.key === null ? L : E.key), m = a(E, m, L), T === null ? S = E : T.sibling = E, T = E);
    return e && _.forEach(function(kn) {
      return t(p, kn);
    }), B && _t(p, L), S;
  }
  function k(p, m, v, y) {
    if (typeof v == "object" && v !== null && v.type === Yt && v.key === null && (v = v.props.children), typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case yr:
          e: {
            for (var S = v.key, T = m; T !== null; ) {
              if (T.key === S) {
                if (S = v.type, S === Yt) {
                  if (T.tag === 7) {
                    n(p, T.sibling), m = s(T, v.props.children), m.return = p, p = m;
                    break e;
                  }
                } else if (T.elementType === S || typeof S == "object" && S !== null && S.$$typeof === st && $i(S) === T.type) {
                  n(p, T.sibling), m = s(T, v.props), m.ref = Mn(p, T, v), m.return = p, p = m;
                  break e;
                }
                n(p, T);
                break;
              } else t(p, T);
              T = T.sibling;
            }
            v.type === Yt ? (m = At(v.props.children, p.mode, y, v.key), m.return = p, p = m) : (y = Wr(v.type, v.key, v.props, null, p.mode, y), y.ref = Mn(p, m, v), y.return = p, p = y);
          }
          return i(p);
        case qt:
          e: {
            for (T = v.key; m !== null; ) {
              if (m.key === T) if (m.tag === 4 && m.stateNode.containerInfo === v.containerInfo && m.stateNode.implementation === v.implementation) {
                n(p, m.sibling), m = s(m, v.children || []), m.return = p, p = m;
                break e;
              } else {
                n(p, m);
                break;
              }
              else t(p, m);
              m = m.sibling;
            }
            m = is(v, p.mode, y), m.return = p, p = m;
          }
          return i(p);
        case st:
          return T = v._init, k(p, m, T(v._payload), y);
      }
      if ($n(v)) return j(p, m, v, y);
      if (Cn(v)) return N(p, m, v, y);
      _r(p, v);
    }
    return typeof v == "string" && v !== "" || typeof v == "number" ? (v = "" + v, m !== null && m.tag === 6 ? (n(p, m.sibling), m = s(m, v), m.return = p, p = m) : (n(p, m), m = as(v, p.mode, y), m.return = p, p = m), i(p)) : n(p, m);
  }
  return k;
}
var vn = Lc(!0), Dc = Lc(!1), sl = wt(null), al = null, nn = null, Sa = null;
function Ca() {
  Sa = nn = al = null;
}
function Ea(e) {
  var t = sl.current;
  F(sl), e._currentValue = t;
}
function Os(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function dn(e, t) {
  al = e, Sa = nn = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (he = !0), e.firstContext = null);
}
function Me(e) {
  var t = e._currentValue;
  if (Sa !== e) if (e = { context: e, memoizedValue: t, next: null }, nn === null) {
    if (al === null) throw Error(w(308));
    nn = e, al.dependencies = { lanes: 0, firstContext: e };
  } else nn = nn.next = e;
  return t;
}
var Dt = null;
function Ta(e) {
  Dt === null ? Dt = [e] : Dt.push(e);
}
function Ic(e, t, n, r) {
  var s = t.interleaved;
  return s === null ? (n.next = n, Ta(t)) : (n.next = s.next, s.next = n), t.interleaved = n, tt(e, r);
}
function tt(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var at = !1;
function ba(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function Pc(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function Ze(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function ht(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (r = r.shared, $ & 2) {
    var s = r.pending;
    return s === null ? t.next = t : (t.next = s.next, s.next = t), r.pending = t, tt(e, n);
  }
  return s = r.interleaved, s === null ? (t.next = t, Ta(r)) : (t.next = s.next, s.next = t), r.interleaved = t, tt(e, n);
}
function zr(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, fa(e, n);
  }
}
function Ai(e, t) {
  var n = e.updateQueue, r = e.alternate;
  if (r !== null && (r = r.updateQueue, n === r)) {
    var s = null, a = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var i = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        a === null ? s = a = i : a = a.next = i, n = n.next;
      } while (n !== null);
      a === null ? s = a = t : a = a.next = t;
    } else s = a = t;
    n = { baseState: r.baseState, firstBaseUpdate: s, lastBaseUpdate: a, shared: r.shared, effects: r.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function il(e, t, n, r) {
  var s = e.updateQueue;
  at = !1;
  var a = s.firstBaseUpdate, i = s.lastBaseUpdate, o = s.shared.pending;
  if (o !== null) {
    s.shared.pending = null;
    var c = o, u = c.next;
    c.next = null, i === null ? a = u : i.next = u, i = c;
    var h = e.alternate;
    h !== null && (h = h.updateQueue, o = h.lastBaseUpdate, o !== i && (o === null ? h.firstBaseUpdate = u : o.next = u, h.lastBaseUpdate = c));
  }
  if (a !== null) {
    var f = s.baseState;
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
              f = H({}, f, d);
              break e;
            case 2:
              at = !0;
          }
        }
        o.callback !== null && o.lane !== 0 && (e.flags |= 64, d = s.effects, d === null ? s.effects = [o] : d.push(o));
      } else g = { eventTime: g, lane: d, tag: o.tag, payload: o.payload, callback: o.callback, next: null }, h === null ? (u = h = g, c = f) : h = h.next = g, i |= d;
      if (o = o.next, o === null) {
        if (o = s.shared.pending, o === null) break;
        d = o, o = d.next, d.next = null, s.lastBaseUpdate = d, s.shared.pending = null;
      }
    } while (!0);
    if (h === null && (c = f), s.baseState = c, s.firstBaseUpdate = u, s.lastBaseUpdate = h, t = s.shared.interleaved, t !== null) {
      s = t;
      do
        i |= s.lane, s = s.next;
      while (s !== t);
    } else a === null && (s.shared.lanes = 0);
    Ft |= i, e.lanes = i, e.memoizedState = f;
  }
}
function Ri(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var r = e[t], s = r.callback;
    if (s !== null) {
      if (r.callback = null, r = n, typeof s != "function") throw Error(w(191, s));
      s.call(r);
    }
  }
}
var pr = {}, He = wt(pr), lr = wt(pr), sr = wt(pr);
function It(e) {
  if (e === pr) throw Error(w(174));
  return e;
}
function _a(e, t) {
  switch (R(sr, t), R(lr, e), R(He, pr), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : ys(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = ys(t, e);
  }
  F(He), R(He, t);
}
function gn() {
  F(He), F(lr), F(sr);
}
function $c(e) {
  It(sr.current);
  var t = It(He.current), n = ys(t, e.type);
  t !== n && (R(lr, e), R(He, n));
}
function Ma(e) {
  lr.current === e && (F(He), F(lr));
}
var U = wt(0);
function ol(e) {
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
var es = [];
function La() {
  for (var e = 0; e < es.length; e++) es[e]._workInProgressVersionPrimary = null;
  es.length = 0;
}
var Fr = rt.ReactCurrentDispatcher, ts = rt.ReactCurrentBatchConfig, zt = 0, V = null, K = null, X = null, cl = !1, Vn = !1, ar = 0, Om = 0;
function se() {
  throw Error(w(321));
}
function Da(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!Oe(e[n], t[n])) return !1;
  return !0;
}
function Ia(e, t, n, r, s, a) {
  if (zt = a, V = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Fr.current = e === null || e.memoizedState === null ? Um : Vm, e = n(r, s), Vn) {
    a = 0;
    do {
      if (Vn = !1, ar = 0, 25 <= a) throw Error(w(301));
      a += 1, X = K = null, t.updateQueue = null, Fr.current = Hm, e = n(r, s);
    } while (Vn);
  }
  if (Fr.current = ul, t = K !== null && K.next !== null, zt = 0, X = K = V = null, cl = !1, t) throw Error(w(300));
  return e;
}
function Pa() {
  var e = ar !== 0;
  return ar = 0, e;
}
function Be() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return X === null ? V.memoizedState = X = e : X = X.next = e, X;
}
function Le() {
  if (K === null) {
    var e = V.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = K.next;
  var t = X === null ? V.memoizedState : X.next;
  if (t !== null) X = t, K = e;
  else {
    if (e === null) throw Error(w(310));
    K = e, e = { memoizedState: K.memoizedState, baseState: K.baseState, baseQueue: K.baseQueue, queue: K.queue, next: null }, X === null ? V.memoizedState = X = e : X = X.next = e;
  }
  return X;
}
function ir(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function ns(e) {
  var t = Le(), n = t.queue;
  if (n === null) throw Error(w(311));
  n.lastRenderedReducer = e;
  var r = K, s = r.baseQueue, a = n.pending;
  if (a !== null) {
    if (s !== null) {
      var i = s.next;
      s.next = a.next, a.next = i;
    }
    r.baseQueue = s = a, n.pending = null;
  }
  if (s !== null) {
    a = s.next, r = r.baseState;
    var o = i = null, c = null, u = a;
    do {
      var h = u.lane;
      if ((zt & h) === h) c !== null && (c = c.next = { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }), r = u.hasEagerState ? u.eagerState : e(r, u.action);
      else {
        var f = {
          lane: h,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null
        };
        c === null ? (o = c = f, i = r) : c = c.next = f, V.lanes |= h, Ft |= h;
      }
      u = u.next;
    } while (u !== null && u !== a);
    c === null ? i = r : c.next = o, Oe(r, t.memoizedState) || (he = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = c, n.lastRenderedState = r;
  }
  if (e = n.interleaved, e !== null) {
    s = e;
    do
      a = s.lane, V.lanes |= a, Ft |= a, s = s.next;
    while (s !== e);
  } else s === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function rs(e) {
  var t = Le(), n = t.queue;
  if (n === null) throw Error(w(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch, s = n.pending, a = t.memoizedState;
  if (s !== null) {
    n.pending = null;
    var i = s = s.next;
    do
      a = e(a, i.action), i = i.next;
    while (i !== s);
    Oe(a, t.memoizedState) || (he = !0), t.memoizedState = a, t.baseQueue === null && (t.baseState = a), n.lastRenderedState = a;
  }
  return [a, r];
}
function Ac() {
}
function Rc(e, t) {
  var n = V, r = Le(), s = t(), a = !Oe(r.memoizedState, s);
  if (a && (r.memoizedState = s, he = !0), r = r.queue, $a(Fc.bind(null, n, r, e), [e]), r.getSnapshot !== t || a || X !== null && X.memoizedState.tag & 1) {
    if (n.flags |= 2048, or(9, zc.bind(null, n, r, s, t), void 0, null), J === null) throw Error(w(349));
    zt & 30 || Oc(n, t, s);
  }
  return s;
}
function Oc(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = V.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, V.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function zc(e, t, n, r) {
  t.value = n, t.getSnapshot = r, Bc(t) && Uc(e);
}
function Fc(e, t, n) {
  return n(function() {
    Bc(t) && Uc(e);
  });
}
function Bc(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Oe(e, n);
  } catch {
    return !0;
  }
}
function Uc(e) {
  var t = tt(e, 1);
  t !== null && Re(t, e, 1, -1);
}
function Oi(e) {
  var t = Be();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: ir, lastRenderedState: e }, t.queue = e, e = e.dispatch = Bm.bind(null, V, e), [t.memoizedState, e];
}
function or(e, t, n, r) {
  return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = V.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, V.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
}
function Vc() {
  return Le().memoizedState;
}
function Br(e, t, n, r) {
  var s = Be();
  V.flags |= e, s.memoizedState = or(1 | t, n, void 0, r === void 0 ? null : r);
}
function wl(e, t, n, r) {
  var s = Le();
  r = r === void 0 ? null : r;
  var a = void 0;
  if (K !== null) {
    var i = K.memoizedState;
    if (a = i.destroy, r !== null && Da(r, i.deps)) {
      s.memoizedState = or(t, n, a, r);
      return;
    }
  }
  V.flags |= e, s.memoizedState = or(1 | t, n, a, r);
}
function zi(e, t) {
  return Br(8390656, 8, e, t);
}
function $a(e, t) {
  return wl(2048, 8, e, t);
}
function Hc(e, t) {
  return wl(4, 2, e, t);
}
function Wc(e, t) {
  return wl(4, 4, e, t);
}
function Qc(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function qc(e, t, n) {
  return n = n != null ? n.concat([e]) : null, wl(4, 4, Qc.bind(null, t, e), n);
}
function Aa() {
}
function Yc(e, t) {
  var n = Le();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Da(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
}
function Kc(e, t) {
  var n = Le();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && Da(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
}
function Gc(e, t, n) {
  return zt & 21 ? (Oe(n, t) || (n = tc(), V.lanes |= n, Ft |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, he = !0), e.memoizedState = n);
}
function zm(e, t) {
  var n = A;
  A = n !== 0 && 4 > n ? n : 4, e(!0);
  var r = ts.transition;
  ts.transition = {};
  try {
    e(!1), t();
  } finally {
    A = n, ts.transition = r;
  }
}
function Zc() {
  return Le().memoizedState;
}
function Fm(e, t, n) {
  var r = gt(e);
  if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, Xc(e)) Jc(t, n);
  else if (n = Ic(e, t, n, r), n !== null) {
    var s = de();
    Re(n, e, r, s), eu(n, t, r);
  }
}
function Bm(e, t, n) {
  var r = gt(e), s = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (Xc(e)) Jc(t, s);
  else {
    var a = e.alternate;
    if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
      var i = t.lastRenderedState, o = a(i, n);
      if (s.hasEagerState = !0, s.eagerState = o, Oe(o, i)) {
        var c = t.interleaved;
        c === null ? (s.next = s, Ta(t)) : (s.next = c.next, c.next = s), t.interleaved = s;
        return;
      }
    } catch {
    } finally {
    }
    n = Ic(e, t, s, r), n !== null && (s = de(), Re(n, e, r, s), eu(n, t, r));
  }
}
function Xc(e) {
  var t = e.alternate;
  return e === V || t !== null && t === V;
}
function Jc(e, t) {
  Vn = cl = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function eu(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    r &= e.pendingLanes, n |= r, t.lanes = n, fa(e, n);
  }
}
var ul = { readContext: Me, useCallback: se, useContext: se, useEffect: se, useImperativeHandle: se, useInsertionEffect: se, useLayoutEffect: se, useMemo: se, useReducer: se, useRef: se, useState: se, useDebugValue: se, useDeferredValue: se, useTransition: se, useMutableSource: se, useSyncExternalStore: se, useId: se, unstable_isNewReconciler: !1 }, Um = { readContext: Me, useCallback: function(e, t) {
  return Be().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: Me, useEffect: zi, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Br(
    4194308,
    4,
    Qc.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return Br(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return Br(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = Be();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var r = Be();
  return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = Fm.bind(null, V, e), [r.memoizedState, e];
}, useRef: function(e) {
  var t = Be();
  return e = { current: e }, t.memoizedState = e;
}, useState: Oi, useDebugValue: Aa, useDeferredValue: function(e) {
  return Be().memoizedState = e;
}, useTransition: function() {
  var e = Oi(!1), t = e[0];
  return e = zm.bind(null, e[1]), Be().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var r = V, s = Be();
  if (B) {
    if (n === void 0) throw Error(w(407));
    n = n();
  } else {
    if (n = t(), J === null) throw Error(w(349));
    zt & 30 || Oc(r, t, n);
  }
  s.memoizedState = n;
  var a = { value: n, getSnapshot: t };
  return s.queue = a, zi(Fc.bind(
    null,
    r,
    a,
    e
  ), [e]), r.flags |= 2048, or(9, zc.bind(null, r, a, n, t), void 0, null), n;
}, useId: function() {
  var e = Be(), t = J.identifierPrefix;
  if (B) {
    var n = Ge, r = Ke;
    n = (r & ~(1 << 32 - Ae(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = ar++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = Om++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, Vm = {
  readContext: Me,
  useCallback: Yc,
  useContext: Me,
  useEffect: $a,
  useImperativeHandle: qc,
  useInsertionEffect: Hc,
  useLayoutEffect: Wc,
  useMemo: Kc,
  useReducer: ns,
  useRef: Vc,
  useState: function() {
    return ns(ir);
  },
  useDebugValue: Aa,
  useDeferredValue: function(e) {
    var t = Le();
    return Gc(t, K.memoizedState, e);
  },
  useTransition: function() {
    var e = ns(ir)[0], t = Le().memoizedState;
    return [e, t];
  },
  useMutableSource: Ac,
  useSyncExternalStore: Rc,
  useId: Zc,
  unstable_isNewReconciler: !1
}, Hm = { readContext: Me, useCallback: Yc, useContext: Me, useEffect: $a, useImperativeHandle: qc, useInsertionEffect: Hc, useLayoutEffect: Wc, useMemo: Kc, useReducer: rs, useRef: Vc, useState: function() {
  return rs(ir);
}, useDebugValue: Aa, useDeferredValue: function(e) {
  var t = Le();
  return K === null ? t.memoizedState = e : Gc(t, K.memoizedState, e);
}, useTransition: function() {
  var e = rs(ir)[0], t = Le().memoizedState;
  return [e, t];
}, useMutableSource: Ac, useSyncExternalStore: Rc, useId: Zc, unstable_isNewReconciler: !1 };
function Ie(e, t) {
  if (e && e.defaultProps) {
    t = H({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function zs(e, t, n, r) {
  t = e.memoizedState, n = n(r, t), n = n == null ? t : H({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var kl = { isMounted: function(e) {
  return (e = e._reactInternals) ? Vt(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var r = de(), s = gt(e), a = Ze(r, s);
  a.payload = t, n != null && (a.callback = n), t = ht(e, a, s), t !== null && (Re(t, e, s, r), zr(t, e, s));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var r = de(), s = gt(e), a = Ze(r, s);
  a.tag = 1, a.payload = t, n != null && (a.callback = n), t = ht(e, a, s), t !== null && (Re(t, e, s, r), zr(t, e, s));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = de(), r = gt(e), s = Ze(n, r);
  s.tag = 2, t != null && (s.callback = t), t = ht(e, s, r), t !== null && (Re(t, e, r, n), zr(t, e, r));
} };
function Fi(e, t, n, r, s, a, i) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, i) : t.prototype && t.prototype.isPureReactComponent ? !er(n, r) || !er(s, a) : !0;
}
function tu(e, t, n) {
  var r = !1, s = jt, a = t.contextType;
  return typeof a == "object" && a !== null ? a = Me(a) : (s = ge(t) ? Rt : oe.current, r = t.contextTypes, a = (r = r != null) ? pn(e, s) : jt), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = kl, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = s, e.__reactInternalMemoizedMaskedChildContext = a), t;
}
function Bi(e, t, n, r) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && kl.enqueueReplaceState(t, t.state, null);
}
function Fs(e, t, n, r) {
  var s = e.stateNode;
  s.props = n, s.state = e.memoizedState, s.refs = {}, ba(e);
  var a = t.contextType;
  typeof a == "object" && a !== null ? s.context = Me(a) : (a = ge(t) ? Rt : oe.current, s.context = pn(e, a)), s.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (zs(e, t, a, n), s.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (t = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), t !== s.state && kl.enqueueReplaceState(s, s.state, null), il(e, n, s, r), s.state = e.memoizedState), typeof s.componentDidMount == "function" && (e.flags |= 4194308);
}
function yn(e, t) {
  try {
    var n = "", r = t;
    do
      n += yd(r), r = r.return;
    while (r);
    var s = n;
  } catch (a) {
    s = `
Error generating stack: ` + a.message + `
` + a.stack;
  }
  return { value: e, source: t, stack: s, digest: null };
}
function ls(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Bs(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var Wm = typeof WeakMap == "function" ? WeakMap : Map;
function nu(e, t, n) {
  n = Ze(-1, n), n.tag = 3, n.payload = { element: null };
  var r = t.value;
  return n.callback = function() {
    ml || (ml = !0, Zs = r), Bs(e, t);
  }, n;
}
function ru(e, t, n) {
  n = Ze(-1, n), n.tag = 3;
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var s = t.value;
    n.payload = function() {
      return r(s);
    }, n.callback = function() {
      Bs(e, t);
    };
  }
  var a = e.stateNode;
  return a !== null && typeof a.componentDidCatch == "function" && (n.callback = function() {
    Bs(e, t), typeof r != "function" && (vt === null ? vt = /* @__PURE__ */ new Set([this]) : vt.add(this));
    var i = t.stack;
    this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
  }), n;
}
function Ui(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new Wm();
    var s = /* @__PURE__ */ new Set();
    r.set(t, s);
  } else s = r.get(t), s === void 0 && (s = /* @__PURE__ */ new Set(), r.set(t, s));
  s.has(n) || (s.add(n), e = sf.bind(null, e, t, n), t.then(e, e));
}
function Vi(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Hi(e, t, n, r, s) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = s, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = Ze(-1, 1), t.tag = 2, ht(n, t, 1))), n.lanes |= 1), e);
}
var Qm = rt.ReactCurrentOwner, he = !1;
function ue(e, t, n, r) {
  t.child = e === null ? Dc(t, null, n, r) : vn(t, e.child, n, r);
}
function Wi(e, t, n, r, s) {
  n = n.render;
  var a = t.ref;
  return dn(t, s), r = Ia(e, t, n, r, a, s), n = Pa(), e !== null && !he ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~s, nt(e, t, s)) : (B && n && Na(t), t.flags |= 1, ue(e, t, r, s), t.child);
}
function Qi(e, t, n, r, s) {
  if (e === null) {
    var a = n.type;
    return typeof a == "function" && !Ha(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, lu(e, t, a, r, s)) : (e = Wr(n.type, null, r, t, t.mode, s), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (a = e.child, !(e.lanes & s)) {
    var i = a.memoizedProps;
    if (n = n.compare, n = n !== null ? n : er, n(i, r) && e.ref === t.ref) return nt(e, t, s);
  }
  return t.flags |= 1, e = yt(a, r), e.ref = t.ref, e.return = t, t.child = e;
}
function lu(e, t, n, r, s) {
  if (e !== null) {
    var a = e.memoizedProps;
    if (er(a, r) && e.ref === t.ref) if (he = !1, t.pendingProps = r = a, (e.lanes & s) !== 0) e.flags & 131072 && (he = !0);
    else return t.lanes = e.lanes, nt(e, t, s);
  }
  return Us(e, t, n, r, s);
}
function su(e, t, n) {
  var r = t.pendingProps, s = r.children, a = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, R(ln, je), je |= n;
  else {
    if (!(n & 1073741824)) return e = a !== null ? a.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, R(ln, je), je |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = a !== null ? a.baseLanes : n, R(ln, je), je |= r;
  }
  else a !== null ? (r = a.baseLanes | n, t.memoizedState = null) : r = n, R(ln, je), je |= r;
  return ue(e, t, s, n), t.child;
}
function au(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Us(e, t, n, r, s) {
  var a = ge(n) ? Rt : oe.current;
  return a = pn(t, a), dn(t, s), n = Ia(e, t, n, r, a, s), r = Pa(), e !== null && !he ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~s, nt(e, t, s)) : (B && r && Na(t), t.flags |= 1, ue(e, t, n, s), t.child);
}
function qi(e, t, n, r, s) {
  if (ge(n)) {
    var a = !0;
    nl(t);
  } else a = !1;
  if (dn(t, s), t.stateNode === null) Ur(e, t), tu(t, n, r), Fs(t, n, r, s), r = !0;
  else if (e === null) {
    var i = t.stateNode, o = t.memoizedProps;
    i.props = o;
    var c = i.context, u = n.contextType;
    typeof u == "object" && u !== null ? u = Me(u) : (u = ge(n) ? Rt : oe.current, u = pn(t, u));
    var h = n.getDerivedStateFromProps, f = typeof h == "function" || typeof i.getSnapshotBeforeUpdate == "function";
    f || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== r || c !== u) && Bi(t, i, r, u), at = !1;
    var d = t.memoizedState;
    i.state = d, il(t, r, i, s), c = t.memoizedState, o !== r || d !== c || ve.current || at ? (typeof h == "function" && (zs(t, n, h, r), c = t.memoizedState), (o = at || Fi(t, n, o, r, d, c, u)) ? (f || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), i.props = r, i.state = c, i.context = u, r = o) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
  } else {
    i = t.stateNode, Pc(e, t), o = t.memoizedProps, u = t.type === t.elementType ? o : Ie(t.type, o), i.props = u, f = t.pendingProps, d = i.context, c = n.contextType, typeof c == "object" && c !== null ? c = Me(c) : (c = ge(n) ? Rt : oe.current, c = pn(t, c));
    var g = n.getDerivedStateFromProps;
    (h = typeof g == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== f || d !== c) && Bi(t, i, r, c), at = !1, d = t.memoizedState, i.state = d, il(t, r, i, s);
    var j = t.memoizedState;
    o !== f || d !== j || ve.current || at ? (typeof g == "function" && (zs(t, n, g, r), j = t.memoizedState), (u = at || Fi(t, n, u, r, d, j, c) || !1) ? (h || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, j, c), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, j, c)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = j), i.props = r, i.state = j, i.context = c, r = u) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && d === e.memoizedState || (t.flags |= 1024), r = !1);
  }
  return Vs(e, t, n, r, a, s);
}
function Vs(e, t, n, r, s, a) {
  au(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i) return s && Di(t, n, !1), nt(e, t, a);
  r = t.stateNode, Qm.current = t;
  var o = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return t.flags |= 1, e !== null && i ? (t.child = vn(t, e.child, null, a), t.child = vn(t, null, o, a)) : ue(e, t, o, a), t.memoizedState = r.state, s && Di(t, n, !0), t.child;
}
function iu(e) {
  var t = e.stateNode;
  t.pendingContext ? Li(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Li(e, t.context, !1), _a(e, t.containerInfo);
}
function Yi(e, t, n, r, s) {
  return hn(), ka(s), t.flags |= 256, ue(e, t, n, r), t.child;
}
var Hs = { dehydrated: null, treeContext: null, retryLane: 0 };
function Ws(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function ou(e, t, n) {
  var r = t.pendingProps, s = U.current, a = !1, i = (t.flags & 128) !== 0, o;
  if ((o = i) || (o = e !== null && e.memoizedState === null ? !1 : (s & 2) !== 0), o ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (s |= 1), R(U, s & 1), e === null)
    return Rs(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (i = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, i = { mode: "hidden", children: i }, !(r & 1) && a !== null ? (a.childLanes = 0, a.pendingProps = i) : a = El(i, r, 0, null), e = At(e, r, n, null), a.return = t, e.return = t, a.sibling = e, t.child = a, t.child.memoizedState = Ws(n), t.memoizedState = Hs, e) : Ra(t, i));
  if (s = e.memoizedState, s !== null && (o = s.dehydrated, o !== null)) return qm(e, t, i, r, o, s, n);
  if (a) {
    a = r.fallback, i = t.mode, s = e.child, o = s.sibling;
    var c = { mode: "hidden", children: r.children };
    return !(i & 1) && t.child !== s ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = yt(s, c), r.subtreeFlags = s.subtreeFlags & 14680064), o !== null ? a = yt(o, a) : (a = At(a, i, n, null), a.flags |= 2), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, i = e.child.memoizedState, i = i === null ? Ws(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, a.memoizedState = i, a.childLanes = e.childLanes & ~n, t.memoizedState = Hs, r;
  }
  return a = e.child, e = a.sibling, r = yt(a, { mode: "visible", children: r.children }), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
}
function Ra(e, t) {
  return t = El({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function Mr(e, t, n, r) {
  return r !== null && ka(r), vn(t, e.child, null, n), e = Ra(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function qm(e, t, n, r, s, a, i) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, r = ls(Error(w(422))), Mr(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (a = r.fallback, s = t.mode, r = El({ mode: "visible", children: r.children }, s, 0, null), a = At(a, s, i, null), a.flags |= 2, r.return = t, a.return = t, r.sibling = a, t.child = r, t.mode & 1 && vn(t, e.child, null, i), t.child.memoizedState = Ws(i), t.memoizedState = Hs, a);
  if (!(t.mode & 1)) return Mr(e, t, i, null);
  if (s.data === "$!") {
    if (r = s.nextSibling && s.nextSibling.dataset, r) var o = r.dgst;
    return r = o, a = Error(w(419)), r = ls(a, r, void 0), Mr(e, t, i, r);
  }
  if (o = (i & e.childLanes) !== 0, he || o) {
    if (r = J, r !== null) {
      switch (i & -i) {
        case 4:
          s = 2;
          break;
        case 16:
          s = 8;
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
          s = 32;
          break;
        case 536870912:
          s = 268435456;
          break;
        default:
          s = 0;
      }
      s = s & (r.suspendedLanes | i) ? 0 : s, s !== 0 && s !== a.retryLane && (a.retryLane = s, tt(e, s), Re(r, e, s, -1));
    }
    return Va(), r = ls(Error(w(421))), Mr(e, t, i, r);
  }
  return s.data === "$?" ? (t.flags |= 128, t.child = e.child, t = af.bind(null, e), s._reactRetry = t, null) : (e = a.treeContext, Ne = pt(s.nextSibling), we = t, B = !0, $e = null, e !== null && (Ee[Te++] = Ke, Ee[Te++] = Ge, Ee[Te++] = Ot, Ke = e.id, Ge = e.overflow, Ot = t), t = Ra(t, r.children), t.flags |= 4096, t);
}
function Ki(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), Os(e.return, t, n);
}
function ss(e, t, n, r, s) {
  var a = e.memoizedState;
  a === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: s } : (a.isBackwards = t, a.rendering = null, a.renderingStartTime = 0, a.last = r, a.tail = n, a.tailMode = s);
}
function cu(e, t, n) {
  var r = t.pendingProps, s = r.revealOrder, a = r.tail;
  if (ue(e, t, r.children, n), r = U.current, r & 2) r = r & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Ki(e, n, t);
      else if (e.tag === 19) Ki(e, n, t);
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
  if (R(U, r), !(t.mode & 1)) t.memoizedState = null;
  else switch (s) {
    case "forwards":
      for (n = t.child, s = null; n !== null; ) e = n.alternate, e !== null && ol(e) === null && (s = n), n = n.sibling;
      n = s, n === null ? (s = t.child, t.child = null) : (s = n.sibling, n.sibling = null), ss(t, !1, s, n, a);
      break;
    case "backwards":
      for (n = null, s = t.child, t.child = null; s !== null; ) {
        if (e = s.alternate, e !== null && ol(e) === null) {
          t.child = s;
          break;
        }
        e = s.sibling, s.sibling = n, n = s, s = e;
      }
      ss(t, !0, n, null, a);
      break;
    case "together":
      ss(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function Ur(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function nt(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), Ft |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(w(153));
  if (t.child !== null) {
    for (e = t.child, n = yt(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = yt(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function Ym(e, t, n) {
  switch (t.tag) {
    case 3:
      iu(t), hn();
      break;
    case 5:
      $c(t);
      break;
    case 1:
      ge(t.type) && nl(t);
      break;
    case 4:
      _a(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context, s = t.memoizedProps.value;
      R(sl, r._currentValue), r._currentValue = s;
      break;
    case 13:
      if (r = t.memoizedState, r !== null)
        return r.dehydrated !== null ? (R(U, U.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? ou(e, t, n) : (R(U, U.current & 1), e = nt(e, t, n), e !== null ? e.sibling : null);
      R(U, U.current & 1);
      break;
    case 19:
      if (r = (n & t.childLanes) !== 0, e.flags & 128) {
        if (r) return cu(e, t, n);
        t.flags |= 128;
      }
      if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null, s.lastEffect = null), R(U, U.current), r) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, su(e, t, n);
  }
  return nt(e, t, n);
}
var uu, Qs, du, mu;
uu = function(e, t) {
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
Qs = function() {
};
du = function(e, t, n, r) {
  var s = e.memoizedProps;
  if (s !== r) {
    e = t.stateNode, It(He.current);
    var a = null;
    switch (n) {
      case "input":
        s = ps(e, s), r = ps(e, r), a = [];
        break;
      case "select":
        s = H({}, s, { value: void 0 }), r = H({}, r, { value: void 0 }), a = [];
        break;
      case "textarea":
        s = gs(e, s), r = gs(e, r), a = [];
        break;
      default:
        typeof s.onClick != "function" && typeof r.onClick == "function" && (e.onclick = el);
    }
    xs(n, r);
    var i;
    n = null;
    for (u in s) if (!r.hasOwnProperty(u) && s.hasOwnProperty(u) && s[u] != null) if (u === "style") {
      var o = s[u];
      for (i in o) o.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
    } else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (qn.hasOwnProperty(u) ? a || (a = []) : (a = a || []).push(u, null));
    for (u in r) {
      var c = r[u];
      if (o = s != null ? s[u] : void 0, r.hasOwnProperty(u) && c !== o && (c != null || o != null)) if (u === "style") if (o) {
        for (i in o) !o.hasOwnProperty(i) || c && c.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
        for (i in c) c.hasOwnProperty(i) && o[i] !== c[i] && (n || (n = {}), n[i] = c[i]);
      } else n || (a || (a = []), a.push(
        u,
        n
      )), n = c;
      else u === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, o = o ? o.__html : void 0, c != null && o !== c && (a = a || []).push(u, c)) : u === "children" ? typeof c != "string" && typeof c != "number" || (a = a || []).push(u, "" + c) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (qn.hasOwnProperty(u) ? (c != null && u === "onScroll" && z("scroll", e), a || o === c || (a = [])) : (a = a || []).push(u, c));
    }
    n && (a = a || []).push("style", n);
    var u = a;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
mu = function(e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function Ln(e, t) {
  if (!B) switch (e.tailMode) {
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
function ae(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
  if (t) for (var s = e.child; s !== null; ) n |= s.lanes | s.childLanes, r |= s.subtreeFlags & 14680064, r |= s.flags & 14680064, s.return = e, s = s.sibling;
  else for (s = e.child; s !== null; ) n |= s.lanes | s.childLanes, r |= s.subtreeFlags, r |= s.flags, s.return = e, s = s.sibling;
  return e.subtreeFlags |= r, e.childLanes = n, t;
}
function Km(e, t, n) {
  var r = t.pendingProps;
  switch (wa(t), t.tag) {
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
      return ae(t), null;
    case 1:
      return ge(t.type) && tl(), ae(t), null;
    case 3:
      return r = t.stateNode, gn(), F(ve), F(oe), La(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (br(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, $e !== null && (ea($e), $e = null))), Qs(e, t), ae(t), null;
    case 5:
      Ma(t);
      var s = It(sr.current);
      if (n = t.type, e !== null && t.stateNode != null) du(e, t, n, r, s), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(w(166));
          return ae(t), null;
        }
        if (e = It(He.current), br(t)) {
          r = t.stateNode, n = t.type;
          var a = t.memoizedProps;
          switch (r[Ue] = t, r[rr] = a, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              z("cancel", r), z("close", r);
              break;
            case "iframe":
            case "object":
            case "embed":
              z("load", r);
              break;
            case "video":
            case "audio":
              for (s = 0; s < Rn.length; s++) z(Rn[s], r);
              break;
            case "source":
              z("error", r);
              break;
            case "img":
            case "image":
            case "link":
              z(
                "error",
                r
              ), z("load", r);
              break;
            case "details":
              z("toggle", r);
              break;
            case "input":
              li(r, a), z("invalid", r);
              break;
            case "select":
              r._wrapperState = { wasMultiple: !!a.multiple }, z("invalid", r);
              break;
            case "textarea":
              ai(r, a), z("invalid", r);
          }
          xs(n, a), s = null;
          for (var i in a) if (a.hasOwnProperty(i)) {
            var o = a[i];
            i === "children" ? typeof o == "string" ? r.textContent !== o && (a.suppressHydrationWarning !== !0 && Tr(r.textContent, o, e), s = ["children", o]) : typeof o == "number" && r.textContent !== "" + o && (a.suppressHydrationWarning !== !0 && Tr(
              r.textContent,
              o,
              e
            ), s = ["children", "" + o]) : qn.hasOwnProperty(i) && o != null && i === "onScroll" && z("scroll", r);
          }
          switch (n) {
            case "input":
              xr(r), si(r, a, !0);
              break;
            case "textarea":
              xr(r), ii(r);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof a.onClick == "function" && (r.onclick = el);
          }
          r = s, t.updateQueue = r, r !== null && (t.flags |= 4);
        } else {
          i = s.nodeType === 9 ? s : s.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Fo(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[Ue] = t, e[rr] = r, uu(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (i = js(n, r), n) {
              case "dialog":
                z("cancel", e), z("close", e), s = r;
                break;
              case "iframe":
              case "object":
              case "embed":
                z("load", e), s = r;
                break;
              case "video":
              case "audio":
                for (s = 0; s < Rn.length; s++) z(Rn[s], e);
                s = r;
                break;
              case "source":
                z("error", e), s = r;
                break;
              case "img":
              case "image":
              case "link":
                z(
                  "error",
                  e
                ), z("load", e), s = r;
                break;
              case "details":
                z("toggle", e), s = r;
                break;
              case "input":
                li(e, r), s = ps(e, r), z("invalid", e);
                break;
              case "option":
                s = r;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!r.multiple }, s = H({}, r, { value: void 0 }), z("invalid", e);
                break;
              case "textarea":
                ai(e, r), s = gs(e, r), z("invalid", e);
                break;
              default:
                s = r;
            }
            xs(n, s), o = s;
            for (a in o) if (o.hasOwnProperty(a)) {
              var c = o[a];
              a === "style" ? Vo(e, c) : a === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, c != null && Bo(e, c)) : a === "children" ? typeof c == "string" ? (n !== "textarea" || c !== "") && Yn(e, c) : typeof c == "number" && Yn(e, "" + c) : a !== "suppressContentEditableWarning" && a !== "suppressHydrationWarning" && a !== "autoFocus" && (qn.hasOwnProperty(a) ? c != null && a === "onScroll" && z("scroll", e) : c != null && ia(e, a, c, i));
            }
            switch (n) {
              case "input":
                xr(e), si(e, r, !1);
                break;
              case "textarea":
                xr(e), ii(e);
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + xt(r.value));
                break;
              case "select":
                e.multiple = !!r.multiple, a = r.value, a != null ? an(e, !!r.multiple, a, !1) : r.defaultValue != null && an(
                  e,
                  !!r.multiple,
                  r.defaultValue,
                  !0
                );
                break;
              default:
                typeof s.onClick == "function" && (e.onclick = el);
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
      return ae(t), null;
    case 6:
      if (e && t.stateNode != null) mu(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null) throw Error(w(166));
        if (n = It(sr.current), It(He.current), br(t)) {
          if (r = t.stateNode, n = t.memoizedProps, r[Ue] = t, (a = r.nodeValue !== n) && (e = we, e !== null)) switch (e.tag) {
            case 3:
              Tr(r.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && Tr(r.nodeValue, n, (e.mode & 1) !== 0);
          }
          a && (t.flags |= 4);
        } else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[Ue] = t, t.stateNode = r;
      }
      return ae(t), null;
    case 13:
      if (F(U), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (B && Ne !== null && t.mode & 1 && !(t.flags & 128)) Mc(), hn(), t.flags |= 98560, a = !1;
        else if (a = br(t), r !== null && r.dehydrated !== null) {
          if (e === null) {
            if (!a) throw Error(w(318));
            if (a = t.memoizedState, a = a !== null ? a.dehydrated : null, !a) throw Error(w(317));
            a[Ue] = t;
          } else hn(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ae(t), a = !1;
        } else $e !== null && (ea($e), $e = null), a = !0;
        if (!a) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, t.mode & 1 && (e === null || U.current & 1 ? G === 0 && (G = 3) : Va())), t.updateQueue !== null && (t.flags |= 4), ae(t), null);
    case 4:
      return gn(), Qs(e, t), e === null && tr(t.stateNode.containerInfo), ae(t), null;
    case 10:
      return Ea(t.type._context), ae(t), null;
    case 17:
      return ge(t.type) && tl(), ae(t), null;
    case 19:
      if (F(U), a = t.memoizedState, a === null) return ae(t), null;
      if (r = (t.flags & 128) !== 0, i = a.rendering, i === null) if (r) Ln(a, !1);
      else {
        if (G !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (i = ol(e), i !== null) {
            for (t.flags |= 128, Ln(a, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) a = n, e = r, a.flags &= 14680066, i = a.alternate, i === null ? (a.childLanes = 0, a.lanes = e, a.child = null, a.subtreeFlags = 0, a.memoizedProps = null, a.memoizedState = null, a.updateQueue = null, a.dependencies = null, a.stateNode = null) : (a.childLanes = i.childLanes, a.lanes = i.lanes, a.child = i.child, a.subtreeFlags = 0, a.deletions = null, a.memoizedProps = i.memoizedProps, a.memoizedState = i.memoizedState, a.updateQueue = i.updateQueue, a.type = i.type, e = i.dependencies, a.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return R(U, U.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        a.tail !== null && q() > xn && (t.flags |= 128, r = !0, Ln(a, !1), t.lanes = 4194304);
      }
      else {
        if (!r) if (e = ol(i), e !== null) {
          if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), Ln(a, !0), a.tail === null && a.tailMode === "hidden" && !i.alternate && !B) return ae(t), null;
        } else 2 * q() - a.renderingStartTime > xn && n !== 1073741824 && (t.flags |= 128, r = !0, Ln(a, !1), t.lanes = 4194304);
        a.isBackwards ? (i.sibling = t.child, t.child = i) : (n = a.last, n !== null ? n.sibling = i : t.child = i, a.last = i);
      }
      return a.tail !== null ? (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = q(), t.sibling = null, n = U.current, R(U, r ? n & 1 | 2 : n & 1), t) : (ae(t), null);
    case 22:
    case 23:
      return Ua(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && t.mode & 1 ? je & 1073741824 && (ae(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ae(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(w(156, t.tag));
}
function Gm(e, t) {
  switch (wa(t), t.tag) {
    case 1:
      return ge(t.type) && tl(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return gn(), F(ve), F(oe), La(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return Ma(t), null;
    case 13:
      if (F(U), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(w(340));
        hn();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return F(U), null;
    case 4:
      return gn(), null;
    case 10:
      return Ea(t.type._context), null;
    case 22:
    case 23:
      return Ua(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Lr = !1, ie = !1, Zm = typeof WeakSet == "function" ? WeakSet : Set, b = null;
function rn(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (r) {
    W(e, t, r);
  }
  else n.current = null;
}
function qs(e, t, n) {
  try {
    n();
  } catch (r) {
    W(e, t, r);
  }
}
var Gi = !1;
function Xm(e, t) {
  if (Ms = Zr, e = gc(), ja(e)) {
    if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else e: {
      n = (n = e.ownerDocument) && n.defaultView || window;
      var r = n.getSelection && n.getSelection();
      if (r && r.rangeCount !== 0) {
        n = r.anchorNode;
        var s = r.anchorOffset, a = r.focusNode;
        r = r.focusOffset;
        try {
          n.nodeType, a.nodeType;
        } catch {
          n = null;
          break e;
        }
        var i = 0, o = -1, c = -1, u = 0, h = 0, f = e, d = null;
        t: for (; ; ) {
          for (var g; f !== n || s !== 0 && f.nodeType !== 3 || (o = i + s), f !== a || r !== 0 && f.nodeType !== 3 || (c = i + r), f.nodeType === 3 && (i += f.nodeValue.length), (g = f.firstChild) !== null; )
            d = f, f = g;
          for (; ; ) {
            if (f === e) break t;
            if (d === n && ++u === s && (o = i), d === a && ++h === r && (c = i), (g = f.nextSibling) !== null) break;
            f = d, d = f.parentNode;
          }
          f = g;
        }
        n = o === -1 || c === -1 ? null : { start: o, end: c };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (Ls = { focusedElem: e, selectionRange: n }, Zr = !1, b = t; b !== null; ) if (t = b, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, b = e;
  else for (; b !== null; ) {
    t = b;
    try {
      var j = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (j !== null) {
            var N = j.memoizedProps, k = j.memoizedState, p = t.stateNode, m = p.getSnapshotBeforeUpdate(t.elementType === t.type ? N : Ie(t.type, N), k);
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
          throw Error(w(163));
      }
    } catch (y) {
      W(t, t.return, y);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, b = e;
      break;
    }
    b = t.return;
  }
  return j = Gi, Gi = !1, j;
}
function Hn(e, t, n) {
  var r = t.updateQueue;
  if (r = r !== null ? r.lastEffect : null, r !== null) {
    var s = r = r.next;
    do {
      if ((s.tag & e) === e) {
        var a = s.destroy;
        s.destroy = void 0, a !== void 0 && qs(t, n, a);
      }
      s = s.next;
    } while (s !== r);
  }
}
function Sl(e, t) {
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
function Ys(e) {
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
function fu(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, fu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ue], delete t[rr], delete t[Ps], delete t[Pm], delete t[$m])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function pu(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Zi(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || pu(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Ks(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = el));
  else if (r !== 4 && (e = e.child, e !== null)) for (Ks(e, t, n), e = e.sibling; e !== null; ) Ks(e, t, n), e = e.sibling;
}
function Gs(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && (e = e.child, e !== null)) for (Gs(e, t, n), e = e.sibling; e !== null; ) Gs(e, t, n), e = e.sibling;
}
var te = null, Pe = !1;
function lt(e, t, n) {
  for (n = n.child; n !== null; ) hu(e, t, n), n = n.sibling;
}
function hu(e, t, n) {
  if (Ve && typeof Ve.onCommitFiberUnmount == "function") try {
    Ve.onCommitFiberUnmount(vl, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      ie || rn(n, t);
    case 6:
      var r = te, s = Pe;
      te = null, lt(e, t, n), te = r, Pe = s, te !== null && (Pe ? (e = te, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : te.removeChild(n.stateNode));
      break;
    case 18:
      te !== null && (Pe ? (e = te, n = n.stateNode, e.nodeType === 8 ? Xl(e.parentNode, n) : e.nodeType === 1 && Xl(e, n), Xn(e)) : Xl(te, n.stateNode));
      break;
    case 4:
      r = te, s = Pe, te = n.stateNode.containerInfo, Pe = !0, lt(e, t, n), te = r, Pe = s;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!ie && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
        s = r = r.next;
        do {
          var a = s, i = a.destroy;
          a = a.tag, i !== void 0 && (a & 2 || a & 4) && qs(n, t, i), s = s.next;
        } while (s !== r);
      }
      lt(e, t, n);
      break;
    case 1:
      if (!ie && (rn(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
        r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
      } catch (o) {
        W(n, t, o);
      }
      lt(e, t, n);
      break;
    case 21:
      lt(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (ie = (r = ie) || n.memoizedState !== null, lt(e, t, n), ie = r) : lt(e, t, n);
      break;
    default:
      lt(e, t, n);
  }
}
function Xi(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new Zm()), t.forEach(function(r) {
      var s = of.bind(null, e, r);
      n.has(r) || (n.add(r), r.then(s, s));
    });
  }
}
function De(e, t) {
  var n = t.deletions;
  if (n !== null) for (var r = 0; r < n.length; r++) {
    var s = n[r];
    try {
      var a = e, i = t, o = i;
      e: for (; o !== null; ) {
        switch (o.tag) {
          case 5:
            te = o.stateNode, Pe = !1;
            break e;
          case 3:
            te = o.stateNode.containerInfo, Pe = !0;
            break e;
          case 4:
            te = o.stateNode.containerInfo, Pe = !0;
            break e;
        }
        o = o.return;
      }
      if (te === null) throw Error(w(160));
      hu(a, i, s), te = null, Pe = !1;
      var c = s.alternate;
      c !== null && (c.return = null), s.return = null;
    } catch (u) {
      W(s, t, u);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) vu(t, e), t = t.sibling;
}
function vu(e, t) {
  var n = e.alternate, r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (De(t, e), ze(e), r & 4) {
        try {
          Hn(3, e, e.return), Sl(3, e);
        } catch (N) {
          W(e, e.return, N);
        }
        try {
          Hn(5, e, e.return);
        } catch (N) {
          W(e, e.return, N);
        }
      }
      break;
    case 1:
      De(t, e), ze(e), r & 512 && n !== null && rn(n, n.return);
      break;
    case 5:
      if (De(t, e), ze(e), r & 512 && n !== null && rn(n, n.return), e.flags & 32) {
        var s = e.stateNode;
        try {
          Yn(s, "");
        } catch (N) {
          W(e, e.return, N);
        }
      }
      if (r & 4 && (s = e.stateNode, s != null)) {
        var a = e.memoizedProps, i = n !== null ? n.memoizedProps : a, o = e.type, c = e.updateQueue;
        if (e.updateQueue = null, c !== null) try {
          o === "input" && a.type === "radio" && a.name != null && Oo(s, a), js(o, i);
          var u = js(o, a);
          for (i = 0; i < c.length; i += 2) {
            var h = c[i], f = c[i + 1];
            h === "style" ? Vo(s, f) : h === "dangerouslySetInnerHTML" ? Bo(s, f) : h === "children" ? Yn(s, f) : ia(s, h, f, u);
          }
          switch (o) {
            case "input":
              hs(s, a);
              break;
            case "textarea":
              zo(s, a);
              break;
            case "select":
              var d = s._wrapperState.wasMultiple;
              s._wrapperState.wasMultiple = !!a.multiple;
              var g = a.value;
              g != null ? an(s, !!a.multiple, g, !1) : d !== !!a.multiple && (a.defaultValue != null ? an(
                s,
                !!a.multiple,
                a.defaultValue,
                !0
              ) : an(s, !!a.multiple, a.multiple ? [] : "", !1));
          }
          s[rr] = a;
        } catch (N) {
          W(e, e.return, N);
        }
      }
      break;
    case 6:
      if (De(t, e), ze(e), r & 4) {
        if (e.stateNode === null) throw Error(w(162));
        s = e.stateNode, a = e.memoizedProps;
        try {
          s.nodeValue = a;
        } catch (N) {
          W(e, e.return, N);
        }
      }
      break;
    case 3:
      if (De(t, e), ze(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
        Xn(t.containerInfo);
      } catch (N) {
        W(e, e.return, N);
      }
      break;
    case 4:
      De(t, e), ze(e);
      break;
    case 13:
      De(t, e), ze(e), s = e.child, s.flags & 8192 && (a = s.memoizedState !== null, s.stateNode.isHidden = a, !a || s.alternate !== null && s.alternate.memoizedState !== null || (Fa = q())), r & 4 && Xi(e);
      break;
    case 22:
      if (h = n !== null && n.memoizedState !== null, e.mode & 1 ? (ie = (u = ie) || h, De(t, e), ie = u) : De(t, e), ze(e), r & 8192) {
        if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !h && e.mode & 1) for (b = e, h = e.child; h !== null; ) {
          for (f = b = h; b !== null; ) {
            switch (d = b, g = d.child, d.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Hn(4, d, d.return);
                break;
              case 1:
                rn(d, d.return);
                var j = d.stateNode;
                if (typeof j.componentWillUnmount == "function") {
                  r = d, n = d.return;
                  try {
                    t = r, j.props = t.memoizedProps, j.state = t.memoizedState, j.componentWillUnmount();
                  } catch (N) {
                    W(r, n, N);
                  }
                }
                break;
              case 5:
                rn(d, d.return);
                break;
              case 22:
                if (d.memoizedState !== null) {
                  eo(f);
                  continue;
                }
            }
            g !== null ? (g.return = d, b = g) : eo(f);
          }
          h = h.sibling;
        }
        e: for (h = null, f = e; ; ) {
          if (f.tag === 5) {
            if (h === null) {
              h = f;
              try {
                s = f.stateNode, u ? (a = s.style, typeof a.setProperty == "function" ? a.setProperty("display", "none", "important") : a.display = "none") : (o = f.stateNode, c = f.memoizedProps.style, i = c != null && c.hasOwnProperty("display") ? c.display : null, o.style.display = Uo("display", i));
              } catch (N) {
                W(e, e.return, N);
              }
            }
          } else if (f.tag === 6) {
            if (h === null) try {
              f.stateNode.nodeValue = u ? "" : f.memoizedProps;
            } catch (N) {
              W(e, e.return, N);
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
      De(t, e), ze(e), r & 4 && Xi(e);
      break;
    case 21:
      break;
    default:
      De(
        t,
        e
      ), ze(e);
  }
}
function ze(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (pu(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(w(160));
      }
      switch (r.tag) {
        case 5:
          var s = r.stateNode;
          r.flags & 32 && (Yn(s, ""), r.flags &= -33);
          var a = Zi(e);
          Gs(e, a, s);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo, o = Zi(e);
          Ks(e, o, i);
          break;
        default:
          throw Error(w(161));
      }
    } catch (c) {
      W(e, e.return, c);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function Jm(e, t, n) {
  b = e, gu(e);
}
function gu(e, t, n) {
  for (var r = (e.mode & 1) !== 0; b !== null; ) {
    var s = b, a = s.child;
    if (s.tag === 22 && r) {
      var i = s.memoizedState !== null || Lr;
      if (!i) {
        var o = s.alternate, c = o !== null && o.memoizedState !== null || ie;
        o = Lr;
        var u = ie;
        if (Lr = i, (ie = c) && !u) for (b = s; b !== null; ) i = b, c = i.child, i.tag === 22 && i.memoizedState !== null ? to(s) : c !== null ? (c.return = i, b = c) : to(s);
        for (; a !== null; ) b = a, gu(a), a = a.sibling;
        b = s, Lr = o, ie = u;
      }
      Ji(e);
    } else s.subtreeFlags & 8772 && a !== null ? (a.return = s, b = a) : Ji(e);
  }
}
function Ji(e) {
  for (; b !== null; ) {
    var t = b;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            ie || Sl(5, t);
            break;
          case 1:
            var r = t.stateNode;
            if (t.flags & 4 && !ie) if (n === null) r.componentDidMount();
            else {
              var s = t.elementType === t.type ? n.memoizedProps : Ie(t.type, n.memoizedProps);
              r.componentDidUpdate(s, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
            }
            var a = t.updateQueue;
            a !== null && Ri(t, a, r);
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
              Ri(t, i, n);
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
                  f !== null && Xn(f);
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
            throw Error(w(163));
        }
        ie || t.flags & 512 && Ys(t);
      } catch (d) {
        W(t, t.return, d);
      }
    }
    if (t === e) {
      b = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, b = n;
      break;
    }
    b = t.return;
  }
}
function eo(e) {
  for (; b !== null; ) {
    var t = b;
    if (t === e) {
      b = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, b = n;
      break;
    }
    b = t.return;
  }
}
function to(e) {
  for (; b !== null; ) {
    var t = b;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Sl(4, t);
          } catch (c) {
            W(t, n, c);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var s = t.return;
            try {
              r.componentDidMount();
            } catch (c) {
              W(t, s, c);
            }
          }
          var a = t.return;
          try {
            Ys(t);
          } catch (c) {
            W(t, a, c);
          }
          break;
        case 5:
          var i = t.return;
          try {
            Ys(t);
          } catch (c) {
            W(t, i, c);
          }
      }
    } catch (c) {
      W(t, t.return, c);
    }
    if (t === e) {
      b = null;
      break;
    }
    var o = t.sibling;
    if (o !== null) {
      o.return = t.return, b = o;
      break;
    }
    b = t.return;
  }
}
var ef = Math.ceil, dl = rt.ReactCurrentDispatcher, Oa = rt.ReactCurrentOwner, _e = rt.ReactCurrentBatchConfig, $ = 0, J = null, Y = null, ne = 0, je = 0, ln = wt(0), G = 0, cr = null, Ft = 0, Cl = 0, za = 0, Wn = null, pe = null, Fa = 0, xn = 1 / 0, qe = null, ml = !1, Zs = null, vt = null, Dr = !1, ut = null, fl = 0, Qn = 0, Xs = null, Vr = -1, Hr = 0;
function de() {
  return $ & 6 ? q() : Vr !== -1 ? Vr : Vr = q();
}
function gt(e) {
  return e.mode & 1 ? $ & 2 && ne !== 0 ? ne & -ne : Rm.transition !== null ? (Hr === 0 && (Hr = tc()), Hr) : (e = A, e !== 0 || (e = window.event, e = e === void 0 ? 16 : oc(e.type)), e) : 1;
}
function Re(e, t, n, r) {
  if (50 < Qn) throw Qn = 0, Xs = null, Error(w(185));
  dr(e, n, r), (!($ & 2) || e !== J) && (e === J && (!($ & 2) && (Cl |= n), G === 4 && ot(e, ne)), ye(e, r), n === 1 && $ === 0 && !(t.mode & 1) && (xn = q() + 500, Nl && kt()));
}
function ye(e, t) {
  var n = e.callbackNode;
  Rd(e, t);
  var r = Gr(e, e === J ? ne : 0);
  if (r === 0) n !== null && ui(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = r & -r, e.callbackPriority !== t) {
    if (n != null && ui(n), t === 1) e.tag === 0 ? Am(no.bind(null, e)) : Tc(no.bind(null, e)), Dm(function() {
      !($ & 6) && kt();
    }), n = null;
    else {
      switch (nc(r)) {
        case 1:
          n = ma;
          break;
        case 4:
          n = Jo;
          break;
        case 16:
          n = Kr;
          break;
        case 536870912:
          n = ec;
          break;
        default:
          n = Kr;
      }
      n = Cu(n, yu.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function yu(e, t) {
  if (Vr = -1, Hr = 0, $ & 6) throw Error(w(327));
  var n = e.callbackNode;
  if (mn() && e.callbackNode !== n) return null;
  var r = Gr(e, e === J ? ne : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = pl(e, r);
  else {
    t = r;
    var s = $;
    $ |= 2;
    var a = ju();
    (J !== e || ne !== t) && (qe = null, xn = q() + 500, $t(e, t));
    do
      try {
        rf();
        break;
      } catch (o) {
        xu(e, o);
      }
    while (!0);
    Ca(), dl.current = a, $ = s, Y !== null ? t = 0 : (J = null, ne = 0, t = G);
  }
  if (t !== 0) {
    if (t === 2 && (s = Cs(e), s !== 0 && (r = s, t = Js(e, s))), t === 1) throw n = cr, $t(e, 0), ot(e, r), ye(e, q()), n;
    if (t === 6) ot(e, r);
    else {
      if (s = e.current.alternate, !(r & 30) && !tf(s) && (t = pl(e, r), t === 2 && (a = Cs(e), a !== 0 && (r = a, t = Js(e, a))), t === 1)) throw n = cr, $t(e, 0), ot(e, r), ye(e, q()), n;
      switch (e.finishedWork = s, e.finishedLanes = r, t) {
        case 0:
        case 1:
          throw Error(w(345));
        case 2:
          Mt(e, pe, qe);
          break;
        case 3:
          if (ot(e, r), (r & 130023424) === r && (t = Fa + 500 - q(), 10 < t)) {
            if (Gr(e, 0) !== 0) break;
            if (s = e.suspendedLanes, (s & r) !== r) {
              de(), e.pingedLanes |= e.suspendedLanes & s;
              break;
            }
            e.timeoutHandle = Is(Mt.bind(null, e, pe, qe), t);
            break;
          }
          Mt(e, pe, qe);
          break;
        case 4:
          if (ot(e, r), (r & 4194240) === r) break;
          for (t = e.eventTimes, s = -1; 0 < r; ) {
            var i = 31 - Ae(r);
            a = 1 << i, i = t[i], i > s && (s = i), r &= ~a;
          }
          if (r = s, r = q() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * ef(r / 1960)) - r, 10 < r) {
            e.timeoutHandle = Is(Mt.bind(null, e, pe, qe), r);
            break;
          }
          Mt(e, pe, qe);
          break;
        case 5:
          Mt(e, pe, qe);
          break;
        default:
          throw Error(w(329));
      }
    }
  }
  return ye(e, q()), e.callbackNode === n ? yu.bind(null, e) : null;
}
function Js(e, t) {
  var n = Wn;
  return e.current.memoizedState.isDehydrated && ($t(e, t).flags |= 256), e = pl(e, t), e !== 2 && (t = pe, pe = n, t !== null && ea(t)), e;
}
function ea(e) {
  pe === null ? pe = e : pe.push.apply(pe, e);
}
function tf(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
        var s = n[r], a = s.getSnapshot;
        s = s.value;
        try {
          if (!Oe(a(), s)) return !1;
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
function ot(e, t) {
  for (t &= ~za, t &= ~Cl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Ae(t), r = 1 << n;
    e[n] = -1, t &= ~r;
  }
}
function no(e) {
  if ($ & 6) throw Error(w(327));
  mn();
  var t = Gr(e, 0);
  if (!(t & 1)) return ye(e, q()), null;
  var n = pl(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = Cs(e);
    r !== 0 && (t = r, n = Js(e, r));
  }
  if (n === 1) throw n = cr, $t(e, 0), ot(e, t), ye(e, q()), n;
  if (n === 6) throw Error(w(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, Mt(e, pe, qe), ye(e, q()), null;
}
function Ba(e, t) {
  var n = $;
  $ |= 1;
  try {
    return e(t);
  } finally {
    $ = n, $ === 0 && (xn = q() + 500, Nl && kt());
  }
}
function Bt(e) {
  ut !== null && ut.tag === 0 && !($ & 6) && mn();
  var t = $;
  $ |= 1;
  var n = _e.transition, r = A;
  try {
    if (_e.transition = null, A = 1, e) return e();
  } finally {
    A = r, _e.transition = n, $ = t, !($ & 6) && kt();
  }
}
function Ua() {
  je = ln.current, F(ln);
}
function $t(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, Lm(n)), Y !== null) for (n = Y.return; n !== null; ) {
    var r = n;
    switch (wa(r), r.tag) {
      case 1:
        r = r.type.childContextTypes, r != null && tl();
        break;
      case 3:
        gn(), F(ve), F(oe), La();
        break;
      case 5:
        Ma(r);
        break;
      case 4:
        gn();
        break;
      case 13:
        F(U);
        break;
      case 19:
        F(U);
        break;
      case 10:
        Ea(r.type._context);
        break;
      case 22:
      case 23:
        Ua();
    }
    n = n.return;
  }
  if (J = e, Y = e = yt(e.current, null), ne = je = t, G = 0, cr = null, za = Cl = Ft = 0, pe = Wn = null, Dt !== null) {
    for (t = 0; t < Dt.length; t++) if (n = Dt[t], r = n.interleaved, r !== null) {
      n.interleaved = null;
      var s = r.next, a = n.pending;
      if (a !== null) {
        var i = a.next;
        a.next = s, r.next = i;
      }
      n.pending = r;
    }
    Dt = null;
  }
  return e;
}
function xu(e, t) {
  do {
    var n = Y;
    try {
      if (Ca(), Fr.current = ul, cl) {
        for (var r = V.memoizedState; r !== null; ) {
          var s = r.queue;
          s !== null && (s.pending = null), r = r.next;
        }
        cl = !1;
      }
      if (zt = 0, X = K = V = null, Vn = !1, ar = 0, Oa.current = null, n === null || n.return === null) {
        G = 1, cr = t, Y = null;
        break;
      }
      e: {
        var a = e, i = n.return, o = n, c = t;
        if (t = ne, o.flags |= 32768, c !== null && typeof c == "object" && typeof c.then == "function") {
          var u = c, h = o, f = h.tag;
          if (!(h.mode & 1) && (f === 0 || f === 11 || f === 15)) {
            var d = h.alternate;
            d ? (h.updateQueue = d.updateQueue, h.memoizedState = d.memoizedState, h.lanes = d.lanes) : (h.updateQueue = null, h.memoizedState = null);
          }
          var g = Vi(i);
          if (g !== null) {
            g.flags &= -257, Hi(g, i, o, a, t), g.mode & 1 && Ui(a, u, t), t = g, c = u;
            var j = t.updateQueue;
            if (j === null) {
              var N = /* @__PURE__ */ new Set();
              N.add(c), t.updateQueue = N;
            } else j.add(c);
            break e;
          } else {
            if (!(t & 1)) {
              Ui(a, u, t), Va();
              break e;
            }
            c = Error(w(426));
          }
        } else if (B && o.mode & 1) {
          var k = Vi(i);
          if (k !== null) {
            !(k.flags & 65536) && (k.flags |= 256), Hi(k, i, o, a, t), ka(yn(c, o));
            break e;
          }
        }
        a = c = yn(c, o), G !== 4 && (G = 2), Wn === null ? Wn = [a] : Wn.push(a), a = i;
        do {
          switch (a.tag) {
            case 3:
              a.flags |= 65536, t &= -t, a.lanes |= t;
              var p = nu(a, c, t);
              Ai(a, p);
              break e;
            case 1:
              o = c;
              var m = a.type, v = a.stateNode;
              if (!(a.flags & 128) && (typeof m.getDerivedStateFromError == "function" || v !== null && typeof v.componentDidCatch == "function" && (vt === null || !vt.has(v)))) {
                a.flags |= 65536, t &= -t, a.lanes |= t;
                var y = ru(a, o, t);
                Ai(a, y);
                break e;
              }
          }
          a = a.return;
        } while (a !== null);
      }
      wu(n);
    } catch (S) {
      t = S, Y === n && n !== null && (Y = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function ju() {
  var e = dl.current;
  return dl.current = ul, e === null ? ul : e;
}
function Va() {
  (G === 0 || G === 3 || G === 2) && (G = 4), J === null || !(Ft & 268435455) && !(Cl & 268435455) || ot(J, ne);
}
function pl(e, t) {
  var n = $;
  $ |= 2;
  var r = ju();
  (J !== e || ne !== t) && (qe = null, $t(e, t));
  do
    try {
      nf();
      break;
    } catch (s) {
      xu(e, s);
    }
  while (!0);
  if (Ca(), $ = n, dl.current = r, Y !== null) throw Error(w(261));
  return J = null, ne = 0, G;
}
function nf() {
  for (; Y !== null; ) Nu(Y);
}
function rf() {
  for (; Y !== null && !bd(); ) Nu(Y);
}
function Nu(e) {
  var t = Su(e.alternate, e, je);
  e.memoizedProps = e.pendingProps, t === null ? wu(e) : Y = t, Oa.current = null;
}
function wu(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = Gm(n, t), n !== null) {
        n.flags &= 32767, Y = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        G = 6, Y = null;
        return;
      }
    } else if (n = Km(n, t, je), n !== null) {
      Y = n;
      return;
    }
    if (t = t.sibling, t !== null) {
      Y = t;
      return;
    }
    Y = t = e;
  } while (t !== null);
  G === 0 && (G = 5);
}
function Mt(e, t, n) {
  var r = A, s = _e.transition;
  try {
    _e.transition = null, A = 1, lf(e, t, n, r);
  } finally {
    _e.transition = s, A = r;
  }
  return null;
}
function lf(e, t, n, r) {
  do
    mn();
  while (ut !== null);
  if ($ & 6) throw Error(w(327));
  n = e.finishedWork;
  var s = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(w(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var a = n.lanes | n.childLanes;
  if (Od(e, a), e === J && (Y = J = null, ne = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Dr || (Dr = !0, Cu(Kr, function() {
    return mn(), null;
  })), a = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || a) {
    a = _e.transition, _e.transition = null;
    var i = A;
    A = 1;
    var o = $;
    $ |= 4, Oa.current = null, Xm(e, n), vu(n, e), Sm(Ls), Zr = !!Ms, Ls = Ms = null, e.current = n, Jm(n), _d(), $ = o, A = i, _e.transition = a;
  } else e.current = n;
  if (Dr && (Dr = !1, ut = e, fl = s), a = e.pendingLanes, a === 0 && (vt = null), Dd(n.stateNode), ye(e, q()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) s = t[n], r(s.value, { componentStack: s.stack, digest: s.digest });
  if (ml) throw ml = !1, e = Zs, Zs = null, e;
  return fl & 1 && e.tag !== 0 && mn(), a = e.pendingLanes, a & 1 ? e === Xs ? Qn++ : (Qn = 0, Xs = e) : Qn = 0, kt(), null;
}
function mn() {
  if (ut !== null) {
    var e = nc(fl), t = _e.transition, n = A;
    try {
      if (_e.transition = null, A = 16 > e ? 16 : e, ut === null) var r = !1;
      else {
        if (e = ut, ut = null, fl = 0, $ & 6) throw Error(w(331));
        var s = $;
        for ($ |= 4, b = e.current; b !== null; ) {
          var a = b, i = a.child;
          if (b.flags & 16) {
            var o = a.deletions;
            if (o !== null) {
              for (var c = 0; c < o.length; c++) {
                var u = o[c];
                for (b = u; b !== null; ) {
                  var h = b;
                  switch (h.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Hn(8, h, a);
                  }
                  var f = h.child;
                  if (f !== null) f.return = h, b = f;
                  else for (; b !== null; ) {
                    h = b;
                    var d = h.sibling, g = h.return;
                    if (fu(h), h === u) {
                      b = null;
                      break;
                    }
                    if (d !== null) {
                      d.return = g, b = d;
                      break;
                    }
                    b = g;
                  }
                }
              }
              var j = a.alternate;
              if (j !== null) {
                var N = j.child;
                if (N !== null) {
                  j.child = null;
                  do {
                    var k = N.sibling;
                    N.sibling = null, N = k;
                  } while (N !== null);
                }
              }
              b = a;
            }
          }
          if (a.subtreeFlags & 2064 && i !== null) i.return = a, b = i;
          else e: for (; b !== null; ) {
            if (a = b, a.flags & 2048) switch (a.tag) {
              case 0:
              case 11:
              case 15:
                Hn(9, a, a.return);
            }
            var p = a.sibling;
            if (p !== null) {
              p.return = a.return, b = p;
              break e;
            }
            b = a.return;
          }
        }
        var m = e.current;
        for (b = m; b !== null; ) {
          i = b;
          var v = i.child;
          if (i.subtreeFlags & 2064 && v !== null) v.return = i, b = v;
          else e: for (i = m; b !== null; ) {
            if (o = b, o.flags & 2048) try {
              switch (o.tag) {
                case 0:
                case 11:
                case 15:
                  Sl(9, o);
              }
            } catch (S) {
              W(o, o.return, S);
            }
            if (o === i) {
              b = null;
              break e;
            }
            var y = o.sibling;
            if (y !== null) {
              y.return = o.return, b = y;
              break e;
            }
            b = o.return;
          }
        }
        if ($ = s, kt(), Ve && typeof Ve.onPostCommitFiberRoot == "function") try {
          Ve.onPostCommitFiberRoot(vl, e);
        } catch {
        }
        r = !0;
      }
      return r;
    } finally {
      A = n, _e.transition = t;
    }
  }
  return !1;
}
function ro(e, t, n) {
  t = yn(n, t), t = nu(e, t, 1), e = ht(e, t, 1), t = de(), e !== null && (dr(e, 1, t), ye(e, t));
}
function W(e, t, n) {
  if (e.tag === 3) ro(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      ro(t, e, n);
      break;
    } else if (t.tag === 1) {
      var r = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (vt === null || !vt.has(r))) {
        e = yn(n, e), e = ru(t, e, 1), t = ht(t, e, 1), e = de(), t !== null && (dr(t, 1, e), ye(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function sf(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t), t = de(), e.pingedLanes |= e.suspendedLanes & n, J === e && (ne & n) === n && (G === 4 || G === 3 && (ne & 130023424) === ne && 500 > q() - Fa ? $t(e, 0) : za |= n), ye(e, t);
}
function ku(e, t) {
  t === 0 && (e.mode & 1 ? (t = wr, wr <<= 1, !(wr & 130023424) && (wr = 4194304)) : t = 1);
  var n = de();
  e = tt(e, t), e !== null && (dr(e, t, n), ye(e, n));
}
function af(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), ku(e, n);
}
function of(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode, s = e.memoizedState;
      s !== null && (n = s.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(w(314));
  }
  r !== null && r.delete(t), ku(e, n);
}
var Su;
Su = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || ve.current) he = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return he = !1, Ym(e, t, n);
    he = !!(e.flags & 131072);
  }
  else he = !1, B && t.flags & 1048576 && bc(t, ll, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var r = t.type;
      Ur(e, t), e = t.pendingProps;
      var s = pn(t, oe.current);
      dn(t, n), s = Ia(null, t, r, e, s, n);
      var a = Pa();
      return t.flags |= 1, typeof s == "object" && s !== null && typeof s.render == "function" && s.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, ge(r) ? (a = !0, nl(t)) : a = !1, t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, ba(t), s.updater = kl, t.stateNode = s, s._reactInternals = t, Fs(t, r, e, n), t = Vs(null, t, r, !0, a, n)) : (t.tag = 0, B && a && Na(t), ue(null, t, s, n), t = t.child), t;
    case 16:
      r = t.elementType;
      e: {
        switch (Ur(e, t), e = t.pendingProps, s = r._init, r = s(r._payload), t.type = r, s = t.tag = uf(r), e = Ie(r, e), s) {
          case 0:
            t = Us(null, t, r, e, n);
            break e;
          case 1:
            t = qi(null, t, r, e, n);
            break e;
          case 11:
            t = Wi(null, t, r, e, n);
            break e;
          case 14:
            t = Qi(null, t, r, Ie(r.type, e), n);
            break e;
        }
        throw Error(w(
          306,
          r,
          ""
        ));
      }
      return t;
    case 0:
      return r = t.type, s = t.pendingProps, s = t.elementType === r ? s : Ie(r, s), Us(e, t, r, s, n);
    case 1:
      return r = t.type, s = t.pendingProps, s = t.elementType === r ? s : Ie(r, s), qi(e, t, r, s, n);
    case 3:
      e: {
        if (iu(t), e === null) throw Error(w(387));
        r = t.pendingProps, a = t.memoizedState, s = a.element, Pc(e, t), il(t, r, null, n);
        var i = t.memoizedState;
        if (r = i.element, a.isDehydrated) if (a = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = a, t.memoizedState = a, t.flags & 256) {
          s = yn(Error(w(423)), t), t = Yi(e, t, r, n, s);
          break e;
        } else if (r !== s) {
          s = yn(Error(w(424)), t), t = Yi(e, t, r, n, s);
          break e;
        } else for (Ne = pt(t.stateNode.containerInfo.firstChild), we = t, B = !0, $e = null, n = Dc(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (hn(), r === s) {
            t = nt(e, t, n);
            break e;
          }
          ue(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return $c(t), e === null && Rs(t), r = t.type, s = t.pendingProps, a = e !== null ? e.memoizedProps : null, i = s.children, Ds(r, s) ? i = null : a !== null && Ds(r, a) && (t.flags |= 32), au(e, t), ue(e, t, i, n), t.child;
    case 6:
      return e === null && Rs(t), null;
    case 13:
      return ou(e, t, n);
    case 4:
      return _a(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = vn(t, null, r, n) : ue(e, t, r, n), t.child;
    case 11:
      return r = t.type, s = t.pendingProps, s = t.elementType === r ? s : Ie(r, s), Wi(e, t, r, s, n);
    case 7:
      return ue(e, t, t.pendingProps, n), t.child;
    case 8:
      return ue(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return ue(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (r = t.type._context, s = t.pendingProps, a = t.memoizedProps, i = s.value, R(sl, r._currentValue), r._currentValue = i, a !== null) if (Oe(a.value, i)) {
          if (a.children === s.children && !ve.current) {
            t = nt(e, t, n);
            break e;
          }
        } else for (a = t.child, a !== null && (a.return = t); a !== null; ) {
          var o = a.dependencies;
          if (o !== null) {
            i = a.child;
            for (var c = o.firstContext; c !== null; ) {
              if (c.context === r) {
                if (a.tag === 1) {
                  c = Ze(-1, n & -n), c.tag = 2;
                  var u = a.updateQueue;
                  if (u !== null) {
                    u = u.shared;
                    var h = u.pending;
                    h === null ? c.next = c : (c.next = h.next, h.next = c), u.pending = c;
                  }
                }
                a.lanes |= n, c = a.alternate, c !== null && (c.lanes |= n), Os(
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
            if (i = a.return, i === null) throw Error(w(341));
            i.lanes |= n, o = i.alternate, o !== null && (o.lanes |= n), Os(i, n, t), i = a.sibling;
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
        ue(e, t, s.children, n), t = t.child;
      }
      return t;
    case 9:
      return s = t.type, r = t.pendingProps.children, dn(t, n), s = Me(s), r = r(s), t.flags |= 1, ue(e, t, r, n), t.child;
    case 14:
      return r = t.type, s = Ie(r, t.pendingProps), s = Ie(r.type, s), Qi(e, t, r, s, n);
    case 15:
      return lu(e, t, t.type, t.pendingProps, n);
    case 17:
      return r = t.type, s = t.pendingProps, s = t.elementType === r ? s : Ie(r, s), Ur(e, t), t.tag = 1, ge(r) ? (e = !0, nl(t)) : e = !1, dn(t, n), tu(t, r, s), Fs(t, r, s, n), Vs(null, t, r, !0, e, n);
    case 19:
      return cu(e, t, n);
    case 22:
      return su(e, t, n);
  }
  throw Error(w(156, t.tag));
};
function Cu(e, t) {
  return Xo(e, t);
}
function cf(e, t, n, r) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function be(e, t, n, r) {
  return new cf(e, t, n, r);
}
function Ha(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function uf(e) {
  if (typeof e == "function") return Ha(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === ca) return 11;
    if (e === ua) return 14;
  }
  return 2;
}
function yt(e, t) {
  var n = e.alternate;
  return n === null ? (n = be(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function Wr(e, t, n, r, s, a) {
  var i = 2;
  if (r = e, typeof e == "function") Ha(e) && (i = 1);
  else if (typeof e == "string") i = 5;
  else e: switch (e) {
    case Yt:
      return At(n.children, s, a, t);
    case oa:
      i = 8, s |= 8;
      break;
    case us:
      return e = be(12, n, t, s | 2), e.elementType = us, e.lanes = a, e;
    case ds:
      return e = be(13, n, t, s), e.elementType = ds, e.lanes = a, e;
    case ms:
      return e = be(19, n, t, s), e.elementType = ms, e.lanes = a, e;
    case $o:
      return El(n, s, a, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case Io:
          i = 10;
          break e;
        case Po:
          i = 9;
          break e;
        case ca:
          i = 11;
          break e;
        case ua:
          i = 14;
          break e;
        case st:
          i = 16, r = null;
          break e;
      }
      throw Error(w(130, e == null ? e : typeof e, ""));
  }
  return t = be(i, n, t, s), t.elementType = e, t.type = r, t.lanes = a, t;
}
function At(e, t, n, r) {
  return e = be(7, e, r, t), e.lanes = n, e;
}
function El(e, t, n, r) {
  return e = be(22, e, r, t), e.elementType = $o, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function as(e, t, n) {
  return e = be(6, e, null, t), e.lanes = n, e;
}
function is(e, t, n) {
  return t = be(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function df(e, t, n, r, s) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Bl(0), this.expirationTimes = Bl(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Bl(0), this.identifierPrefix = r, this.onRecoverableError = s, this.mutableSourceEagerHydrationData = null;
}
function Wa(e, t, n, r, s, a, i, o, c) {
  return e = new df(e, t, n, o, c), t === 1 ? (t = 1, a === !0 && (t |= 8)) : t = 0, a = be(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, ba(a), e;
}
function mf(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: qt, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
}
function Eu(e) {
  if (!e) return jt;
  e = e._reactInternals;
  e: {
    if (Vt(e) !== e || e.tag !== 1) throw Error(w(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (ge(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(w(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (ge(n)) return Ec(e, n, t);
  }
  return t;
}
function Tu(e, t, n, r, s, a, i, o, c) {
  return e = Wa(n, r, !0, e, s, a, i, o, c), e.context = Eu(null), n = e.current, r = de(), s = gt(n), a = Ze(r, s), a.callback = t ?? null, ht(n, a, s), e.current.lanes = s, dr(e, s, r), ye(e, r), e;
}
function Tl(e, t, n, r) {
  var s = t.current, a = de(), i = gt(s);
  return n = Eu(n), t.context === null ? t.context = n : t.pendingContext = n, t = Ze(a, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = ht(s, t, i), e !== null && (Re(e, s, i, a), zr(e, s, i)), i;
}
function hl(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function lo(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Qa(e, t) {
  lo(e, t), (e = e.alternate) && lo(e, t);
}
function ff() {
  return null;
}
var bu = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function qa(e) {
  this._internalRoot = e;
}
bl.prototype.render = qa.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(w(409));
  Tl(e, t, null, null);
};
bl.prototype.unmount = qa.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Bt(function() {
      Tl(null, e, null, null);
    }), t[et] = null;
  }
};
function bl(e) {
  this._internalRoot = e;
}
bl.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = sc();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < it.length && t !== 0 && t < it[n].priority; n++) ;
    it.splice(n, 0, e), n === 0 && ic(e);
  }
};
function Ya(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function _l(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function so() {
}
function pf(e, t, n, r, s) {
  if (s) {
    if (typeof r == "function") {
      var a = r;
      r = function() {
        var u = hl(i);
        a.call(u);
      };
    }
    var i = Tu(t, r, e, 0, null, !1, !1, "", so);
    return e._reactRootContainer = i, e[et] = i.current, tr(e.nodeType === 8 ? e.parentNode : e), Bt(), i;
  }
  for (; s = e.lastChild; ) e.removeChild(s);
  if (typeof r == "function") {
    var o = r;
    r = function() {
      var u = hl(c);
      o.call(u);
    };
  }
  var c = Wa(e, 0, !1, null, null, !1, !1, "", so);
  return e._reactRootContainer = c, e[et] = c.current, tr(e.nodeType === 8 ? e.parentNode : e), Bt(function() {
    Tl(t, c, n, r);
  }), c;
}
function Ml(e, t, n, r, s) {
  var a = n._reactRootContainer;
  if (a) {
    var i = a;
    if (typeof s == "function") {
      var o = s;
      s = function() {
        var c = hl(i);
        o.call(c);
      };
    }
    Tl(t, i, e, s);
  } else i = pf(n, t, e, s, r);
  return hl(i);
}
rc = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = An(t.pendingLanes);
        n !== 0 && (fa(t, n | 1), ye(t, q()), !($ & 6) && (xn = q() + 500, kt()));
      }
      break;
    case 13:
      Bt(function() {
        var r = tt(e, 1);
        if (r !== null) {
          var s = de();
          Re(r, e, 1, s);
        }
      }), Qa(e, 1);
  }
};
pa = function(e) {
  if (e.tag === 13) {
    var t = tt(e, 134217728);
    if (t !== null) {
      var n = de();
      Re(t, e, 134217728, n);
    }
    Qa(e, 134217728);
  }
};
lc = function(e) {
  if (e.tag === 13) {
    var t = gt(e), n = tt(e, t);
    if (n !== null) {
      var r = de();
      Re(n, e, t, r);
    }
    Qa(e, t);
  }
};
sc = function() {
  return A;
};
ac = function(e, t) {
  var n = A;
  try {
    return A = e, t();
  } finally {
    A = n;
  }
};
ws = function(e, t, n) {
  switch (t) {
    case "input":
      if (hs(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var s = jl(r);
            if (!s) throw Error(w(90));
            Ro(r), hs(r, s);
          }
        }
      }
      break;
    case "textarea":
      zo(e, n);
      break;
    case "select":
      t = n.value, t != null && an(e, !!n.multiple, t, !1);
  }
};
Qo = Ba;
qo = Bt;
var hf = { usingClientEntryPoint: !1, Events: [fr, Xt, jl, Ho, Wo, Ba] }, Dn = { findFiberByHostInstance: Lt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, vf = { bundleType: Dn.bundleType, version: Dn.version, rendererPackageName: Dn.rendererPackageName, rendererConfig: Dn.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: rt.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = Go(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Dn.findFiberByHostInstance || ff, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Ir = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Ir.isDisabled && Ir.supportsFiber) try {
    vl = Ir.inject(vf), Ve = Ir;
  } catch {
  }
}
Se.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = hf;
Se.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Ya(t)) throw Error(w(200));
  return mf(e, t, null, n);
};
Se.createRoot = function(e, t) {
  if (!Ya(e)) throw Error(w(299));
  var n = !1, r = "", s = bu;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (s = t.onRecoverableError)), t = Wa(e, 1, !1, null, null, n, !1, r, s), e[et] = t.current, tr(e.nodeType === 8 ? e.parentNode : e), new qa(t);
};
Se.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(w(188)) : (e = Object.keys(e).join(","), Error(w(268, e)));
  return e = Go(t), e = e === null ? null : e.stateNode, e;
};
Se.flushSync = function(e) {
  return Bt(e);
};
Se.hydrate = function(e, t, n) {
  if (!_l(t)) throw Error(w(200));
  return Ml(null, e, t, !0, n);
};
Se.hydrateRoot = function(e, t, n) {
  if (!Ya(e)) throw Error(w(405));
  var r = n != null && n.hydratedSources || null, s = !1, a = "", i = bu;
  if (n != null && (n.unstable_strictMode === !0 && (s = !0), n.identifierPrefix !== void 0 && (a = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = Tu(t, null, e, 1, n ?? null, s, !1, a, i), e[et] = t.current, tr(e), r) for (e = 0; e < r.length; e++) n = r[e], s = n._getVersion, s = s(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, s] : t.mutableSourceEagerHydrationData.push(
    n,
    s
  );
  return new bl(t);
};
Se.render = function(e, t, n) {
  if (!_l(t)) throw Error(w(200));
  return Ml(null, e, t, !1, n);
};
Se.unmountComponentAtNode = function(e) {
  if (!_l(e)) throw Error(w(40));
  return e._reactRootContainer ? (Bt(function() {
    Ml(null, null, e, !1, function() {
      e._reactRootContainer = null, e[et] = null;
    });
  }), !0) : !1;
};
Se.unstable_batchedUpdates = Ba;
Se.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
  if (!_l(n)) throw Error(w(200));
  if (e == null || e._reactInternals === void 0) throw Error(w(38));
  return Ml(e, t, n, !1, r);
};
Se.version = "18.3.1-next-f1338f8080-20240426";
function _u() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(_u);
    } catch (e) {
      console.error(e);
    }
}
_u(), _o.exports = Se;
var gf = _o.exports, le, ao = gf;
le = ao.createRoot, ao.hydrateRoot;
var Mu = { exports: {} }, Ll = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var yf = x, xf = Symbol.for("react.element"), jf = Symbol.for("react.fragment"), Nf = Object.prototype.hasOwnProperty, wf = yf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, kf = { key: !0, ref: !0, __self: !0, __source: !0 };
function Lu(e, t, n) {
  var r, s = {}, a = null, i = null;
  n !== void 0 && (a = "" + n), t.key !== void 0 && (a = "" + t.key), t.ref !== void 0 && (i = t.ref);
  for (r in t) Nf.call(t, r) && !kf.hasOwnProperty(r) && (s[r] = t[r]);
  if (e && e.defaultProps) for (r in t = e.defaultProps, t) s[r] === void 0 && (s[r] = t[r]);
  return { $$typeof: xf, type: e, key: a, ref: i, props: s, _owner: wf.current };
}
Ll.Fragment = jf;
Ll.jsx = Lu;
Ll.jsxs = Lu;
Mu.exports = Ll;
var l = Mu.exports;
const io = {
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
  // Visual Redesign Batch 6: a disclosure-toggle chevron, needed for
  // Dashboard's new collapsible bucket summaries — no existing icon in
  // this table serves that role. Not invented from scratch: reuses the
  // exact path geometry already drawn for .select's own dropdown arrow
  // (components.css's inline SVG background-image), so it's visually
  // identical to a shape already established elsewhere in the app rather
  // than a new, unrelated glyph.
  chevron: '<path d="M6 9l6 6 6-6"/>'
};
function Du(e, t = "") {
  const n = io[e] || io.info;
  return `<svg class="${t ? `icon ${t}` : "icon"}" viewBox="0 0 24 24" aria-hidden="true">${n}</svg>`;
}
function C({ name: e, cls: t = "" }) {
  return /* @__PURE__ */ l.jsx("span", { dangerouslySetInnerHTML: { __html: Du(e, t) } });
}
function Sf(e) {
  const [t, n] = x.useState(null), [r, s] = x.useState(!0), [a, i] = x.useState(null), o = x.useCallback(async () => {
    s(!0), i(null);
    try {
      const c = await e.get("/api/dashboard");
      n(c);
    } catch (c) {
      i(c);
    } finally {
      s(!1);
    }
  }, [e]);
  return x.useEffect(() => {
    o();
  }, [o]), { data: t, loading: r, error: a, refetch: o };
}
function Iu(e, t) {
  return `${(e || "?")[0] || ""}${(t || "")[0] || ""}`.toUpperCase();
}
function Xe(e) {
  if (!e) return "";
  const t = new Date(e.length <= 10 ? e + "T00:00:00" : e), n = /* @__PURE__ */ new Date(), r = t.getFullYear() === n.getFullYear();
  return t.toLocaleDateString(void 0, { month: "short", day: "numeric", year: r ? void 0 : "numeric" });
}
function Pu(e) {
  const t = /* @__PURE__ */ new Date(e + "T00:00:00"), n = /* @__PURE__ */ new Date(), r = n.toISOString().slice(0, 10), s = new Date(n);
  s.setDate(s.getDate() + 1);
  const a = s.toISOString().slice(0, 10);
  return e === r ? "Today" : e === a ? "Tomorrow" : t.toLocaleDateString(void 0, { weekday: "long", month: "short", day: "numeric" });
}
function $u(e) {
  if (!e) return "";
  if (/^\d{2}:\d{2}$/.test(e)) {
    const [t, n] = e.split(":").map(Number);
    return new Date(2e3, 0, 1, t, n).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
  return new Date(e).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
}
function Dl(e) {
  if (!e) return "";
  const t = new Date(e.includes("T") || e.includes(" ") ? e.replace(" ", "T") + (e.endsWith("Z") ? "" : "Z") : e), n = Date.now() - t.getTime(), r = Math.round(n / 6e4);
  if (r < 1) return "just now";
  if (r < 60) return `${r}m ago`;
  const s = Math.round(r / 60);
  if (s < 24) return `${s}h ago`;
  const a = Math.round(s / 24);
  return a < 7 ? `${a}d ago` : Xe(e);
}
function Pt(e, t = "EUR") {
  try {
    return new Intl.NumberFormat(void 0, { style: "currency", currency: t }).format(e);
  } catch {
    return `${e} ${t}`;
  }
}
function Au(e) {
  if (e == null) return "";
  const t = Math.floor(e / 60), n = e % 60;
  return t && n ? `${t}h ${n}m` : t ? `${t}h` : `${n}m`;
}
const Ka = { critical: "Critical", high: "High", medium: "Medium", low: "Low" }, Cf = { todo: "To do", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
function Ga(e) {
  return e == null ? "" : e < 0 ? `${Math.abs(e)}d overdue` : e === 0 ? "Due today" : e === 1 ? "Due tomorrow" : `Due in ${e}d`;
}
const Ef = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };
function Tf(e) {
  const t = /* @__PURE__ */ new Date();
  t.setHours(0, 0, 0, 0);
  const n = /* @__PURE__ */ new Date(e + "T00:00:00");
  return Math.round((n - t) / 864e5);
}
function bf({ item: e, onComplete: t }) {
  const n = e.kind === "task", r = Ef[e.priority] || "badge-medium", s = e.due_date ? Ga(Tf(e.due_date)) : "";
  return /* @__PURE__ */ l.jsxs("div", { className: "row-item", children: [
    n ? /* @__PURE__ */ l.jsx("button", { className: "row-check", "aria-label": "Complete", onClick: () => t(e.id), children: /* @__PURE__ */ l.jsx(C, { name: "check" }) }) : /* @__PURE__ */ l.jsx("div", { className: "row-check", style: { pointerEvents: "none", opacity: 0.35 }, children: /* @__PURE__ */ l.jsx(C, { name: e.kind === "bill" ? "bill" : "decision", cls: "icon-sm" }) }),
    /* @__PURE__ */ l.jsxs("a", { className: "row-main row-item-btn", href: e.link, style: { textDecoration: "none" }, children: [
      /* @__PURE__ */ l.jsx("div", { className: "row-title", children: e.title }),
      /* @__PURE__ */ l.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ l.jsx("span", { className: `badge ${r}`, children: e.priority }),
        s ? /* @__PURE__ */ l.jsx("span", { children: s }) : null
      ] })
    ] })
  ] });
}
function _f({ title: e, items: t, color: n, emptyText: r, onComplete: s, dominant: a }) {
  const [i, o] = x.useState(!1), c = a || i, u = `bucket-list-${e.toLowerCase().replace(/\s+/g, "-")}`;
  return /* @__PURE__ */ l.jsxs("div", { className: a ? "card card-pad" : "card card-pad card-flat", children: [
    a ? /* @__PURE__ */ l.jsxs("div", { className: "bucket-header", style: { marginBottom: "var(--sp-3)" }, children: [
      /* @__PURE__ */ l.jsx("span", { className: "badge-dot-lg", style: { background: n } }),
      /* @__PURE__ */ l.jsx("span", { style: { font: "var(--type-section-label)" }, children: e }),
      /* @__PURE__ */ l.jsx("span", { className: "muted text-xs", style: { marginLeft: "auto" }, children: t.length })
    ] }) : /* @__PURE__ */ l.jsxs(
      "button",
      {
        className: "bucket-header bucket-toggle",
        "aria-expanded": i,
        "aria-controls": u,
        onClick: () => o((h) => !h),
        children: [
          /* @__PURE__ */ l.jsx("span", { className: "badge-dot-lg", style: { background: n } }),
          /* @__PURE__ */ l.jsx("span", { className: "card-title", children: e }),
          /* @__PURE__ */ l.jsx("span", { className: "muted text-xs", style: { marginLeft: "auto" }, children: t.length }),
          /* @__PURE__ */ l.jsx(C, { name: "chevron", cls: "icon-sm bucket-chevron" })
        ]
      }
    ),
    c ? /* @__PURE__ */ l.jsx("div", { id: u, children: t.length ? /* @__PURE__ */ l.jsx("div", { className: "row-list", children: t.map((h) => /* @__PURE__ */ l.jsx(bf, { item: h, onComplete: s }, `${h.kind}-${h.id}`)) }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: r }) }) : null
  ] });
}
function Mf({ goals: e }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Goals in progress" }),
      /* @__PURE__ */ l.jsx("a", { href: "#/goals", className: "text-xs", style: { color: "var(--brand)" }, children: "View all" })
    ] }),
    e.length ? e.map((t) => /* @__PURE__ */ l.jsxs("div", { style: { marginBottom: "var(--sp-3)" }, children: [
      /* @__PURE__ */ l.jsxs("div", { className: "row-between text-sm", style: { marginBottom: 4 }, children: [
        /* @__PURE__ */ l.jsx("span", { children: t.title }),
        /* @__PURE__ */ l.jsxs("span", { className: "muted", children: [
          t.progress,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "progress-track", children: /* @__PURE__ */ l.jsx("div", { className: "progress-fill", style: { width: `${t.progress}%` } }) })
    ] }, t.id)) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No active goals yet." })
  ] });
}
const Lf = {
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
}, Df = { icon: "timeline" };
function If({ event: e }) {
  const t = Lf[e.type] || Df, n = t.accent ? `module-accent--${t.accent}` : "module-accent--none", r = /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsx(C, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ l.jsx("div", { className: "row-title", style: { whiteSpace: "normal", fontWeight: 500 }, children: e.summary }),
      /* @__PURE__ */ l.jsx("div", { className: "row-meta", children: Dl(e.createdAt) })
    ] })
  ] });
  return e.link ? /* @__PURE__ */ l.jsx("a", { className: `row-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ l.jsx("div", { className: `row-item ${n}`, children: r });
}
function Pf({ activity: e }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Circle activity" }) }),
    e.length ? /* @__PURE__ */ l.jsx("div", { className: "row-list", children: e.slice(0, 6).map((t) => /* @__PURE__ */ l.jsx(If, { event: t }, t.id)) }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No circle activity yet. Create a circle to share tasks and updates." })
  ] });
}
function $f({ count: e }) {
  return /* @__PURE__ */ l.jsx("div", { className: "card card-pad", style: { borderColor: "var(--warning-400)" }, children: /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: "var(--sp-3)" }, children: [
    /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsxs("strong", { className: "text-sm", children: [
        e,
        " schedule conflict",
        e === 1 ? "" : "s",
        " detected"
      ] }),
      /* @__PURE__ */ l.jsxs("p", { className: "text-xs muted", style: { marginTop: 2 }, children: [
        "Some timed tasks overlap. ",
        /* @__PURE__ */ l.jsx("a", { href: "#/tasks", style: { color: "var(--brand)" }, children: "Review tasks" })
      ] })
    ] })
  ] }) });
}
function Af({ onSeedDemo: e }) {
  const [t, n] = x.useState(!1);
  async function r() {
    n(!0), await e(), n(!1);
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "onboard-card", children: [
    /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-lg" }),
    /* @__PURE__ */ l.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ l.jsx("strong", { children: "Get started with LifeAdmin" }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginTop: 2 }, children: "Add a real task or bill, create a circle, or load sample data to see everything in action." })
    ] }),
    /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", disabled: t, onClick: r, children: t ? /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Adding sample data…"
    ] }) : "Load demo data" })
  ] });
}
function Rf(e) {
  return e < 12 ? "Good morning" : e < 18 ? "Good afternoon" : "Good evening";
}
function Of({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { data: s, loading: a, error: i, refetch: o } = Sf(t), c = x.useMemo(() => Rf((/* @__PURE__ */ new Date()).getHours()), []), u = x.useMemo(
    () => (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" }),
    []
  );
  async function h(k) {
    try {
      await t.patch(`/api/tasks/${k}`, { status: "completed" }), n("Task completed", "success"), o();
    } catch (p) {
      n(p.message, "error");
    }
  }
  async function f() {
    await t.post("/api/demo/seed"), n("Demo data added", "success");
    const { families: k } = await t.get("/api/family");
    r.families = k, o();
  }
  if (a)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Preparing your dashboard…"
    ] }) });
  if (i)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ l.jsx("p", { children: i.message || "Something went wrong loading this page." })
    ] }) });
  const d = s.counts.tasks === 0 && s.counts.bills === 0 && !r.families.length, g = [
    ...s.overdue && s.overdue.length ? [{ key: "overdue", title: "Overdue", items: s.overdue, color: "var(--danger-500)", emptyText: "" }] : [],
    { key: "needsAttention", title: "Needs attention", items: s.needsAttention, color: "var(--danger-500)", emptyText: "Nothing needs urgent attention — nice work." },
    { key: "comingSoon", title: "Coming soon", items: s.comingSoon, color: "var(--warning-500)", emptyText: "Nothing coming up in the next few days." },
    { key: "canWait", title: "Can wait", items: s.canWait, color: "var(--priority-low)", emptyText: "Nothing low-priority queued up." }
  ], j = g.findIndex((k) => k.items.length > 0), N = j === -1;
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsx("div", { className: "page-header", children: /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsxs("h1", { className: "page-title", children: [
        c,
        ", ",
        r.user.firstName
      ] }),
      /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Here's what matters in your life right now." })
    ] }) }),
    d ? /* @__PURE__ */ l.jsx(Af, { onSeedDemo: f }) : null,
    /* @__PURE__ */ l.jsxs("div", { className: "today-banner", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h2", { children: s.today.count === 0 ? "Nothing urgent today" : `${s.today.count} thing${s.today.count === 1 ? "" : "s"} need${s.today.count === 1 ? "s" : ""} your attention` }),
        /* @__PURE__ */ l.jsx("p", { children: u })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "today-count", children: s.today.count })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ l.jsx("div", { className: "stack", children: N ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", style: { padding: "var(--sp-6) var(--sp-4)" }, children: [
        /* @__PURE__ */ l.jsx(C, { name: "check", cls: "icon-lg" }),
        /* @__PURE__ */ l.jsx("h3", { children: "You're all caught up" }),
        /* @__PURE__ */ l.jsx("p", { children: "Nothing needs your attention right now." })
      ] }) }) : g.map((k, p) => /* @__PURE__ */ l.jsx(
        _f,
        {
          title: k.title,
          items: k.items,
          color: k.color,
          emptyText: k.emptyText,
          onComplete: h,
          dominant: p === j
        },
        k.key
      )) }),
      /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ l.jsx(Mf, { goals: s.goalsInProgress }),
        /* @__PURE__ */ l.jsx(Pf, { activity: s.familyActivity }),
        s.conflicts > 0 ? /* @__PURE__ */ l.jsx($f, { count: s.conflicts }) : null
      ] })
    ] })
  ] });
}
function zf(e, t, n) {
  const r = { ...e };
  return r[t] = e[t] === n ? "" : n, t === "view" && r.view !== n && (r.view = "all"), r;
}
function Ff(e) {
  const [t, n] = x.useState({ view: "all", status: "", q: "" }), [r, s] = x.useState(""), [a, i] = x.useState([]), [o, c] = x.useState(!0), [u, h] = x.useState(null), f = x.useCallback(
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
  return x.useEffect(() => {
    f(t);
  }, [t, f]), x.useEffect(() => {
    const d = r.trim(), g = setTimeout(() => {
      n((j) => j.q === d ? j : { ...j, q: d });
    }, 250);
    return () => clearTimeout(g);
  }, [r]), {
    tasks: a,
    loading: o,
    error: u,
    filters: t,
    toggleFilter: (d, g) => n((j) => zf(j, d, g)),
    searchValue: r,
    setSearchValue: s,
    refetch: () => f(t)
  };
}
const Bf = [
  ["all", "All"],
  ["today", "Today"],
  ["upcoming", "Upcoming"],
  ["overdue", "Overdue"]
];
function Uf({ filters: e, onToggle: t, searchValue: n, onSearchChange: r }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "filter-bar", children: [
    Bf.map(([s, a]) => /* @__PURE__ */ l.jsx(
      "button",
      {
        className: `pill ${e.view === s ? "active" : ""}`,
        onClick: () => t("view", s),
        children: a
      },
      s
    )),
    /* @__PURE__ */ l.jsx("div", { style: { width: 1, height: 20, background: "var(--surface-border-strong)", margin: "0 4px" } }),
    /* @__PURE__ */ l.jsx(
      "button",
      {
        className: `pill ${e.status === "completed" ? "active" : ""}`,
        onClick: () => t("status", "completed"),
        children: "Completed"
      }
    ),
    /* @__PURE__ */ l.jsx("div", { style: { flex: 1 } }),
    /* @__PURE__ */ l.jsx(
      "input",
      {
        className: "input",
        placeholder: "Search tasks…",
        style: { maxWidth: 220 },
        value: n,
        onChange: (s) => r(s.target.value)
      }
    )
  ] });
}
const Vf = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" };
function Hf({ task: e, onOpen: t, onToggleCheck: n }) {
  const r = e.status === "completed", s = e.status === "cancelled";
  return /* @__PURE__ */ l.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ l.jsx(
      "button",
      {
        className: `row-check ${r ? "checked" : ""}`,
        disabled: s,
        "aria-label": "Toggle complete",
        onClick: () => n(e),
        children: /* @__PURE__ */ l.jsx(C, { name: "check" })
      }
    ),
    /* @__PURE__ */ l.jsxs("button", { className: "row-main row-item-btn", onClick: () => t(e.id), children: [
      /* @__PURE__ */ l.jsx("div", { className: `row-title ${r ? "done" : ""}`, children: e.title }),
      /* @__PURE__ */ l.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ l.jsx("span", { className: `badge ${Vf[e.priority]}`, children: Ka[e.priority] }),
        e.dueDate ? /* @__PURE__ */ l.jsxs("span", { children: [
          Xe(e.dueDate),
          e.startTime ? " · " + $u(e.startTime) : ""
        ] }) : null,
        e.durationMinutes ? /* @__PURE__ */ l.jsx("span", { children: Au(e.durationMinutes) }) : null,
        e.familyId ? /* @__PURE__ */ l.jsx(C, { name: "family", cls: "icon-sm" }) : null,
        e.recurrence ? /* @__PURE__ */ l.jsxs("span", { children: [
          /* @__PURE__ */ l.jsx(C, { name: "refresh", cls: "icon-sm" }),
          " ",
          e.recurrence
        ] }) : null,
        s ? /* @__PURE__ */ l.jsx("span", { className: "badge badge-neutral", children: "Cancelled" }) : null
      ] })
    ] })
  ] });
}
const Wf = [
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
function Qf(e) {
  return !e || e.mode === "default" ? "default" : e.mode === "none" ? "none" : String(e.minutesBefore);
}
function Ru(e) {
  return !e || e === "default" ? { mode: "default" } : e === "none" ? { mode: "none" } : { mode: "custom", minutesBefore: Number(e) };
}
function Ou({ existing: e, hint: t }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ l.jsx("label", { className: "field-label", htmlFor: "item-reminder", children: "Remind me" }),
    /* @__PURE__ */ l.jsx("select", { id: "item-reminder", className: "select", name: "reminder", defaultValue: Qf(e), children: Wf.map(([n, r]) => /* @__PURE__ */ l.jsx("option", { value: n, children: r }, n)) }),
    t ? /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginTop: "var(--sp-1)" }, children: t }) : null
  ] });
}
const Fe = document.getElementById("modal-root");
let sn = null, In = null, Wt = null, Qt = null;
const qf = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function ce({ title: e, bodyHtml: t, footerHtml: n = "", size: r = "", onMount: s, onClose: a }) {
  if (In) {
    const c = In;
    In = null, c();
  }
  Fe.classList.contains("open") || (Wt = document.activeElement), Qt && (document.removeEventListener("keydown", Qt), Qt = null), Fe.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel ${r === "lg" ? "modal-lg" : ""}" role="dialog" aria-modal="true" aria-label="${e || ""}">
      <div class="modal-header">
        <div class="modal-title">${e || ""}</div>
        <button class="icon-btn" data-close aria-label="Close">${Du("x")}</button>
      </div>
      <div class="modal-body">${t}</div>
      ${n ? `<div class="modal-footer">${n}</div>` : ""}
    </div>
  `, Fe.classList.add("open"), document.body.style.overflow = "hidden", In = a || null, sn = () => {
    Fe.classList.remove("open"), Fe.innerHTML = "", document.body.style.overflow = "", a && a(), In = null, document.removeEventListener("keydown", i), Qt === i && (Qt = null), Wt && Wt.isConnected && typeof Wt.focus == "function" && Wt.focus(), Wt = null;
  }, Fe.querySelectorAll("[data-close]").forEach((c) => c.addEventListener("click", sn));
  function i(c) {
    if (c.key === "Escape") return sn();
    if (c.key !== "Tab") return;
    const u = Fe.querySelector(".modal-panel");
    if (!u) return;
    const h = [...u.querySelectorAll(qf)].filter((j) => j.offsetParent !== null);
    if (!h.length) return c.preventDefault();
    const f = h[0], d = h[h.length - 1], g = document.activeElement;
    u.contains(g) ? c.shiftKey && g === f ? (c.preventDefault(), d.focus()) : !c.shiftKey && g === d && (c.preventDefault(), f.focus()) : (c.preventDefault(), (c.shiftKey ? d : f).focus());
  }
  Qt = i, document.addEventListener("keydown", i), s && s(Fe);
  const o = Fe.querySelector(".modal-panel");
  return setTimeout(() => {
    const c = Fe.querySelector(".modal-panel");
    if (!c || c !== o || c.contains(document.activeElement)) return;
    const u = c.querySelector(".modal-body input:not([type=hidden]):not([disabled]),.modal-body select:not([disabled]),.modal-body textarea:not([disabled])") || c.querySelector(".modal-footer button:not([disabled])") || c.querySelector(".modal-body button:not([disabled])") || c.querySelector("[data-close]");
    u && u.focus();
  }, 0), sn;
}
function ee() {
  sn && sn();
}
const Yf = ["critical", "high", "medium", "low"], Kf = ["daily", "weekdays", "weekly", "monthly"];
function Gf(e) {
  const t = new Date(e);
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}
function zu(e) {
  return e && e.visibility === "family" && e.familyId != null ? String(e.familyId) : "";
}
function Zf({ existing: e, families: t, canChangeVisibility: n = !0 }) {
  return /* @__PURE__ */ l.jsxs("form", { id: "task-form", className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Title" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "title", required: !0, defaultValue: (e == null ? void 0 : e.title) || "" })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Description" }),
      /* @__PURE__ */ l.jsx("textarea", { className: "textarea", name: "description", defaultValue: (e == null ? void 0 : e.description) || "" })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Priority" }),
        /* @__PURE__ */ l.jsx("select", { className: "select", name: "priority", defaultValue: e == null ? void 0 : e.priority, children: Yf.map((r) => /* @__PURE__ */ l.jsx("option", { value: r, children: Ka[r] }, r)) })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Category" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", name: "category", defaultValue: e ? e.category || "" : "general" })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Due date" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", type: "date", name: "dueDate", defaultValue: (e == null ? void 0 : e.dueDate) || "" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Start time (optional)" }),
        /* @__PURE__ */ l.jsx(
          "input",
          {
            className: "input",
            type: "time",
            name: "startTimeOnly",
            defaultValue: e != null && e.startTime ? Gf(e.startTime) : ""
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Duration (minutes)" }),
        /* @__PURE__ */ l.jsx(
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
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Recurrence" }),
        /* @__PURE__ */ l.jsxs("select", { className: "select", name: "recurrence", defaultValue: (e == null ? void 0 : e.recurrence) || "", children: [
          /* @__PURE__ */ l.jsx("option", { value: "", children: "None" }),
          Kf.map((r) => /* @__PURE__ */ l.jsx("option", { value: r, children: r }, r))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l.jsx(Ou, { existing: e == null ? void 0 : e.reminder, hint: "Needs a due date. With a start time it counts from that time; without one, from your usual hour." }),
    t.length && n ? /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Circle" }),
      /* @__PURE__ */ l.jsxs("select", { className: "select", name: "familyId", defaultValue: zu(e), children: [
        /* @__PURE__ */ l.jsx("option", { value: "", children: "Private (only me)" }),
        t.map((r) => /* @__PURE__ */ l.jsxs("option", { value: r.id, children: [
          r.name,
          " — visible to the circle"
        ] }, r.id))
      ] })
    ] }) : null,
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Notes" }),
      /* @__PURE__ */ l.jsx("textarea", { className: "textarea", name: "notes", defaultValue: (e == null ? void 0 : e.notes) || "" })
    ] })
  ] });
}
function oo({ api: e, toast: t, state: n, existing: r, onSaved: s }) {
  const a = n.families || [], i = !r || r.ownerId === n.user.id;
  let o = null;
  ce({
    title: r ? "Edit task" : "New task",
    bodyHtml: '<div id="task-form-mount"></div>',
    footerHtml: `
      <button class="btn" data-close>Cancel</button>
      <button class="btn btn-primary" id="save-task-btn">${r ? "Save changes" : "Create task"}</button>
    `,
    size: "lg",
    onMount: (c) => {
      const u = c.querySelector("#task-form-mount");
      o = le(u), o.render(x.createElement(Zf, { existing: r, families: a, canChangeVisibility: i })), document.getElementById("save-task-btn").addEventListener("click", async () => {
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
          reminder: Ru(f.reminder)
        };
        f.dueDate && f.startTimeOnly && (d.startTime = (/* @__PURE__ */ new Date(`${f.dueDate}T${f.startTimeOnly}:00`)).toISOString()), r ? i && (f.familyId || "") !== zu(r) && (f.familyId ? (d.familyId = Number(f.familyId), d.visibility = "family") : d.visibility = "private") : f.familyId ? (d.familyId = Number(f.familyId), d.visibility = "family") : d.visibility = "private";
        try {
          r ? (await e.patch(`/api/tasks/${r.id}`, d), t("Task updated", "success")) : (await e.post("/api/tasks", d), t("Task created", "success")), ee(), s();
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
function os(e) {
  return e == null ? "" : String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function We({ title: e = "Are you sure?", message: t = "", confirmLabel: n = "Confirm", danger: r = !0 }) {
  return new Promise((s) => {
    ce({
      title: os(e),
      bodyHtml: `<p class="text-sm" style="color:var(--text-secondary)">${os(t)}</p>`,
      footerHtml: `
        <button class="btn" data-cancel>Cancel</button>
        <button class="btn ${r ? "btn-danger" : "btn-primary"}" data-confirm>${os(n)}</button>
      `,
      onMount: (a) => {
        a.querySelector("[data-cancel]").addEventListener("click", () => {
          s(!1), ee();
        }), a.querySelector("[data-confirm]").addEventListener("click", () => {
          s(!0), ee();
        });
      },
      onClose: () => s(!1)
    });
  });
}
const Xf = { critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low" }, Jf = ["todo", "in_progress", "completed", "cancelled"];
function ep(e) {
  return (e || "?").split(" ").map((t) => t[0]).join("").slice(0, 2).toUpperCase();
}
function tp({ comment: e }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "row", style: { alignItems: "flex-start", gap: "var(--sp-2)" }, children: [
    /* @__PURE__ */ l.jsx("div", { className: "avatar avatar-sm", children: ep(e.authorName) }),
    /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ l.jsx("strong", { children: e.authorName }),
        " ",
        /* @__PURE__ */ l.jsx("span", { className: "muted text-xs", children: Xe(e.createdAt) })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "text-sm", children: e.body })
    ] })
  ] });
}
function np({ taskId: e, api: t, toast: n, onEdit: r, onChanged: s }) {
  const [a, i] = x.useState(!0), [o, c] = x.useState(null), [u, h] = x.useState([]), [f, d] = x.useState(""), g = x.useCallback(async () => {
    i(!0);
    try {
      const m = await t.get(`/api/tasks/${e}`);
      c(m.task), h(m.comments), i(!1);
    } catch (m) {
      n(m.message, "error"), ee();
    }
  }, [t, e, n]);
  x.useEffect(() => {
    g();
  }, [g]), x.useEffect(() => {
    if (o) {
      const m = document.querySelector("#modal-root .modal-title");
      m && (m.textContent = o.title);
    }
  }, [o]);
  async function j(m) {
    try {
      await t.patch(`/api/tasks/${o.id}`, { status: m.target.value }), n("Status updated", "success"), s();
    } catch (v) {
      n(v.message, "error");
    }
  }
  async function N() {
    await t.post(`/api/tasks/${o.id}/postpone`, { days: 1 }), n("Postponed by 1 day", "success"), ee(), s();
  }
  async function k() {
    await We({
      title: "Delete task?",
      message: `"${o.title}" will be permanently deleted.`,
      confirmLabel: "Delete"
    }) && (await t.del(`/api/tasks/${o.id}`), n("Task deleted", "success"), ee(), s());
  }
  async function p(m) {
    m.preventDefault();
    const v = f.trim();
    if (v)
      try {
        await t.post(`/api/tasks/${o.id}/comments`, { body: v }), d(""), g();
      } catch (y) {
        n(y.message, "error");
      }
  }
  return a ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) : o ? /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ l.jsx("span", { className: `badge ${Xf[o.priority]}`, children: Ka[o.priority] }),
      /* @__PURE__ */ l.jsx("select", { className: "select", style: { width: "auto", height: 32 }, value: o.status, onChange: j, children: Jf.map((m) => /* @__PURE__ */ l.jsx("option", { value: m, children: Cf[m] }, m)) }),
      o.dueDate ? /* @__PURE__ */ l.jsxs("span", { className: "badge badge-neutral", children: [
        /* @__PURE__ */ l.jsx(C, { name: "calendar", cls: "icon-sm" }),
        " ",
        Xe(o.dueDate)
      ] }) : null,
      o.durationMinutes ? /* @__PURE__ */ l.jsx("span", { className: "badge badge-neutral", children: Au(o.durationMinutes) }) : null
    ] }),
    o.description ? /* @__PURE__ */ l.jsx("p", { className: "text-sm", style: { marginBottom: "var(--sp-4)" }, children: o.description }) : null,
    o.notes ? /* @__PURE__ */ l.jsxs("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ l.jsx("strong", { children: "Notes:" }),
      " ",
      o.notes
    ] }) : null,
    /* @__PURE__ */ l.jsxs("div", { className: "row page-actions", style: { marginBottom: "var(--sp-5)" }, children: [
      /* @__PURE__ */ l.jsxs("button", { className: "btn btn-sm", onClick: N, children: [
        /* @__PURE__ */ l.jsx(C, { name: "clock", cls: "icon-sm" }),
        " Postpone 1 day"
      ] }),
      /* @__PURE__ */ l.jsxs("button", { className: "btn btn-sm", onClick: () => r(o), children: [
        /* @__PURE__ */ l.jsx(C, { name: "edit", cls: "icon-sm" }),
        " Edit"
      ] }),
      /* @__PURE__ */ l.jsxs("button", { className: "btn btn-sm btn-danger", onClick: k, children: [
        /* @__PURE__ */ l.jsx(C, { name: "trash", cls: "icon-sm" }),
        " Delete"
      ] })
    ] }),
    /* @__PURE__ */ l.jsx("hr", { className: "divider" }),
    /* @__PURE__ */ l.jsx("div", { className: "section-title", children: "Comments" }),
    /* @__PURE__ */ l.jsx("div", { className: "stack", style: { marginBottom: "var(--sp-4)" }, children: u.length ? u.map((m) => /* @__PURE__ */ l.jsx(tp, { comment: m }, m.id)) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No comments yet." }) }),
    /* @__PURE__ */ l.jsxs("form", { className: "row", onSubmit: p, children: [
      /* @__PURE__ */ l.jsx(
        "input",
        {
          className: "input",
          placeholder: "Write a comment…",
          style: { flex: 1 },
          value: f,
          onChange: (m) => d(m.target.value)
        }
      ),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", type: "submit", children: /* @__PURE__ */ l.jsx(C, { name: "send", cls: "icon-sm" }) })
    ] })
  ] }) : null;
}
function rp({ api: e, toast: t, taskId: n, onEdit: r, onChanged: s }) {
  let a = null;
  ce({
    title: "Task",
    bodyHtml: '<div id="task-detail-mount"></div>',
    size: "lg",
    onMount: (i) => {
      const o = i.querySelector("#task-detail-mount");
      a = le(o), a.render(
        x.createElement(np, {
          taskId: n,
          api: e,
          toast: t,
          onEdit: (c) => {
            ee(), r(c);
          },
          onChanged: s
        })
      );
    },
    onClose: () => {
      a && (a.unmount(), a = null);
    }
  });
}
function lp({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { tasks: s, loading: a, error: i, filters: o, toggleFilter: c, searchValue: u, setSearchValue: h, refetch: f } = Ff(t);
  function d() {
    oo({ api: t, toast: n, state: r, existing: null, onSaved: f });
  }
  function g(k) {
    oo({ api: t, toast: n, state: r, existing: k, onSaved: f });
  }
  function j(k) {
    rp({
      api: t,
      toast: n,
      taskId: k,
      onEdit: g,
      onChanged: f
    });
  }
  async function N(k) {
    const p = k.status === "completed";
    try {
      await t.patch(`/api/tasks/${k.id}`, { status: p ? "todo" : "completed" }), f();
    } catch (m) {
      n(m.message, "error");
    }
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "This Week" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Everything on your plate, prioritized." })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "page-actions", children: /* @__PURE__ */ l.jsxs("button", { className: "btn btn-primary", onClick: d, children: [
        /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon icon-sm" }),
        " New task"
      ] }) })
    ] }),
    /* @__PURE__ */ l.jsx(Uf, { filters: o, onToggle: c, searchValue: u, onSearchChange: h }),
    /* @__PURE__ */ l.jsxs("div", { className: "list-region", children: [
      /* @__PURE__ */ l.jsx("div", { className: "list-region-heading", children: a || i ? "Tasks" : `${s.length} task${s.length === 1 ? "" : "s"}` }),
      a ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
        /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
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
        /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
          /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
          /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load your tasks" }),
          /* @__PURE__ */ l.jsx("p", { children: i.message }),
          /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Try again" })
        ] })
      ) : s.length === 0 ? /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ l.jsx(C, { name: "tasks", cls: "icon-lg" }),
        /* @__PURE__ */ l.jsx("h3", { children: "No tasks here" }),
        /* @__PURE__ */ l.jsx("p", { children: "Add your first task to start organizing your day." }),
        /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: d, children: "Add a task" })
      ] }) : /* @__PURE__ */ l.jsx("div", { className: "row-list", children: s.map((k) => /* @__PURE__ */ l.jsx(Hf, { task: k, onOpen: j, onToggleCheck: N }, k.id)) })
    ] })
  ] });
}
function sp(e, t) {
  const [n, r] = x.useState([]), [s, a] = x.useState(!0), [i, o] = x.useState(null), c = x.useCallback(async () => {
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
  return x.useEffect(() => {
    c();
  }, [c]), { families: n, loading: s, error: i, refetch: c };
}
function ap({ onCreate: e, onJoin: t }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsx("div", { className: "page-header", children: /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Circle" }),
      /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Shared responsibilities, chat, and activity." })
    ] }) }),
    /* @__PURE__ */ l.jsx("div", { className: "card", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "family", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "No circle yet" }),
      /* @__PURE__ */ l.jsx("p", { children: "Create a circle to share tasks, bills, a chat and a shopping list with the people you live or work with." }),
      /* @__PURE__ */ l.jsxs("div", { className: "row", style: { marginTop: "var(--sp-2)", gap: "var(--sp-2)" }, children: [
        /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", onClick: e, children: "Create a circle" }),
        /* @__PURE__ */ l.jsx("button", { className: "btn", onClick: t, children: "Join with a code" })
      ] })
    ] }) })
  ] });
}
function ip() {
  return /* @__PURE__ */ l.jsx("form", { id: "family-form", className: "stack", children: /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Circle name" }),
    /* @__PURE__ */ l.jsx("input", { className: "input", name: "name", placeholder: "The Smiths", required: !0 })
  ] }) });
}
function op({ api: e, toast: t, onCreated: n }) {
  let r = null;
  ce({
    title: "Create a circle",
    bodyHtml: '<div id="family-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="create-family-save">Create</button>',
    onMount: (s) => {
      r = le(s.querySelector("#family-form-mount")), r.render(x.createElement(ip)), document.getElementById("create-family-save").addEventListener("click", async () => {
        const a = document.querySelector("#family-form [name=name]").value.trim();
        if (!a) return t("Circle name is required.", "error");
        try {
          const { family: i } = await e.post("/api/family", { name: a });
          ee(), t("Circle created", "success"), n(i);
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
function cp() {
  return /* @__PURE__ */ l.jsx("form", { id: "join-family-form", className: "stack", children: /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Invite code" }),
    /* @__PURE__ */ l.jsx("input", { className: "input", name: "code", placeholder: "e.g. K7M2QX9P4RTA", style: { textTransform: "uppercase" }, required: !0 })
  ] }) });
}
function up({ api: e, toast: t, onJoined: n }) {
  let r = null;
  ce({
    title: "Join a circle",
    bodyHtml: '<div id="join-family-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="join-family-save">Join</button>',
    onMount: (s) => {
      r = le(s.querySelector("#join-family-form-mount")), r.render(x.createElement(cp)), document.getElementById("join-family-save").addEventListener("click", async () => {
        const a = document.querySelector("#join-family-form [name=code]").value.trim();
        if (!a) return t("Enter an invite code.", "error");
        try {
          const { family: i } = await e.post("/api/family/join", { code: a });
          ee(), t(`Joined ${i.name}`, "success"), n(i);
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
function dp({ api: e, toast: t, familyId: n, family: r, myRole: s, onChanged: a }) {
  const [i, o] = x.useState(!0), [c, u] = x.useState([]), [h, f] = x.useState(null), [d, g] = x.useState(!1);
  async function j() {
    if (await We({
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
  const N = x.useCallback(() => {
    let k = !1;
    return o(!0), f(null), e.get(`/api/tasks?familyId=${n}`).then(({ tasks: p }) => {
      k || (u(p), o(!1));
    }).catch((p) => {
      k || (f(p), o(!1));
    }), () => {
      k = !0;
    };
  }, [e, n]);
  return x.useEffect(() => N(), [N]), i ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) : /* @__PURE__ */ l.jsxs("div", { className: "dash-grid", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--warmth", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "row-between", style: { marginBottom: "var(--sp-2)" }, children: [
        /* @__PURE__ */ l.jsx("div", { className: "list-region-heading", style: { marginBottom: 0 }, children: "Shared tasks" }),
        /* @__PURE__ */ l.jsx("span", { className: "text-xs muted", children: c.length })
      ] }),
      h ? /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
        /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
        /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load shared tasks" }),
        /* @__PURE__ */ l.jsx("p", { children: h.message }),
        /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: N, children: "Try again" })
      ] }) : c.length ? /* @__PURE__ */ l.jsx("div", { className: "row-list", children: c.slice(0, 10).map((k) => /* @__PURE__ */ l.jsxs("a", { className: "row-item", href: `#/tasks/${k.id}`, style: { textDecoration: "none" }, children: [
        /* @__PURE__ */ l.jsx(
          "div",
          {
            className: "row-check",
            style: {
              pointerEvents: "none",
              ...k.status === "completed" ? { background: "var(--accent-500)", borderColor: "var(--accent-500)", color: "#fff" } : {}
            },
            children: k.status === "completed" ? /* @__PURE__ */ l.jsx(C, { name: "check", cls: "icon-sm" }) : null
          }
        ),
        /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
          /* @__PURE__ */ l.jsx("div", { className: `row-title ${k.status === "completed" ? "done" : ""}`, children: k.title }),
          /* @__PURE__ */ l.jsx("div", { className: "row-meta", children: k.assigneeName ? `Assigned to ${k.assigneeName}` : "Unassigned" })
        ] })
      ] }, k.id)) }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No shared tasks yet. Create a task and set visibility to circle." })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Invite code" }) }),
      r.inviteCode ? /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", children: "Share this code so someone can join manually, or add them directly by phone number in the Members tab." }) : /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", children: "Only the circle owner can see and share the invite code. Ask the owner if you would like to invite someone." }),
      /* @__PURE__ */ l.jsxs("div", { className: "row", style: { marginTop: "var(--sp-2)", flexWrap: "wrap" }, children: [
        r.inviteCode ? /* @__PURE__ */ l.jsx(
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
        s === "owner" ? /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", onClick: j, disabled: d, children: "New invite code" }) : null
      ] })
    ] })
  ] });
}
function mp() {
  return /* @__PURE__ */ l.jsxs("form", { id: "member-form", className: "stack", children: [
    /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", children: "Members are identified by phone number (names can be identical)." }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Phone number" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "phone", placeholder: "+383 44 123 456", required: !0 })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Display name (optional)" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "displayName", placeholder: "e.g. Mom" })
    ] })
  ] });
}
function fp({ api: e, toast: t, familyId: n, onAdded: r }) {
  let s = null;
  ce({
    title: "Add a member",
    bodyHtml: '<div id="member-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="add-member-save">Add member</button>',
    onMount: (a) => {
      s = le(a.querySelector("#member-form-mount")), s.render(x.createElement(mp)), document.getElementById("add-member-save").addEventListener("click", async () => {
        const i = document.getElementById("member-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.phone.trim()) return t("Phone number is required.", "error");
        try {
          await e.post(`/api/family/${n}/members`, o), t("Member added", "success"), ee(), r();
        } catch (c) {
          t(c.message, "error");
        }
      });
    },
    onClose: () => {
      s && (s.unmount(), s = null);
    }
  });
}
function pp({ api: e, toast: t, familyId: n, family: r, myRole: s, onChanged: a }) {
  const i = s === "owner" || s === "admin", o = s === "owner", c = r.members.some((d) => d.registered && d.role !== "owner");
  async function u(d) {
    if (!await We({
      title: "Remove member?",
      message: "They will lose access to shared circle data.",
      confirmLabel: "Remove"
    })) return;
    const j = await e.del(`/api/family/${n}/members/${d}`);
    t(j && j.inviteCodeRotated ? "Member removed. The invite code was changed." : "Member removed", "success"), a();
  }
  async function h(d) {
    const g = d.displayName || "this member";
    if (await We({
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
    if (await We({
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
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Members" }),
      i ? /* @__PURE__ */ l.jsxs(
        "button",
        {
          className: "btn btn-sm btn-primary",
          onClick: () => fp({ api: e, toast: t, familyId: n, onAdded: a }),
          children: [
            /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
            " Add by phone"
          ]
        }
      ) : null
    ] }),
    /* @__PURE__ */ l.jsx("div", { className: "member-grid", children: r.members.map((d) => /* @__PURE__ */ l.jsx(
      hp,
      {
        member: d,
        canManage: i,
        canTransfer: o && d.registered && d.role !== "owner",
        onRemove: u,
        onTransfer: h
      },
      d.id
    )) }),
    o ? /* @__PURE__ */ l.jsx("p", { className: "text-xs muted member-lifecycle-note", children: c ? "You own this circle. To leave it, or to delete your account, first transfer ownership with “Make owner” on another member." : "You own this circle and are its only registered member, so you can’t leave it or transfer ownership yet. Invite someone to join first." }) : /* @__PURE__ */ l.jsx("div", { className: "member-lifecycle-note", children: /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", onClick: f, children: "Leave circle" }) })
  ] });
}
function hp({ member: e, canManage: t, canTransfer: n, onRemove: r, onTransfer: s }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "card member-card", children: [
    /* @__PURE__ */ l.jsx("div", { className: "avatar", children: Iu(...(e.displayName || "").split(" ")) }),
    /* @__PURE__ */ l.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ l.jsx("div", { className: "text-sm", style: { fontWeight: 650 }, children: e.displayName }),
      /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: 6, marginTop: 4 }, children: [
        /* @__PURE__ */ l.jsx("span", { className: "badge badge-neutral member-role", children: e.role }),
        e.registered ? null : /* @__PURE__ */ l.jsx("span", { className: "text-xs muted", children: "Invited" })
      ] })
    ] }),
    t && e.role !== "owner" ? /* @__PURE__ */ l.jsx("button", { className: "icon-btn", "aria-label": `Remove ${e.displayName}`, onClick: () => r(e.id), children: /* @__PURE__ */ l.jsx(C, { name: "x", cls: "icon-sm" }) }) : null,
    n ? /* @__PURE__ */ l.jsx("div", { className: "member-actions", children: /* @__PURE__ */ l.jsx(
      "button",
      {
        className: "btn btn-sm",
        "aria-label": `Make ${e.displayName} the owner`,
        onClick: () => s(e),
        children: "Make owner"
      }
    ) }) : null
  ] });
}
function vp({ api: e, toast: t, familyId: n }) {
  const [r, s] = x.useState(null), [a, i] = x.useState(!1);
  x.useEffect(() => {
    let u = !0;
    return e.get(`/api/family/${n}/mute`).then((h) => u && s(h.mutedUntil)).catch(() => {
    }), () => {
      u = !1;
    };
  }, [e, n]);
  async function o(u) {
    i(!0);
    try {
      const h = await u();
      s(h.mutedUntil);
    } catch (h) {
      t(h && h.message || "Could not change that", "error");
    } finally {
      i(!1);
    }
  }
  const c = { display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" };
  if (r) {
    const u = new Date(r).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return /* @__PURE__ */ l.jsxs("div", { className: "text-sm muted", style: c, role: "status", children: [
      /* @__PURE__ */ l.jsxs("span", { children: [
        "Notifications from this circle are off on your devices until ",
        u,
        "."
      ] }),
      /* @__PURE__ */ l.jsx("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: a, onClick: () => o(() => e.del(`/api/family/${n}/mute`)), children: "Turn back on" })
    ] });
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "text-sm muted", style: c, children: [
    /* @__PURE__ */ l.jsx("span", { children: "Too many notifications right now?" }),
    [1, 8, 24].map((u) => /* @__PURE__ */ l.jsxs("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: a, onClick: () => o(() => e.post(`/api/family/${n}/mute`, { hours: u })), children: [
      "Quiet for ",
      u,
      " h"
    ] }, u))
  ] });
}
function gp({ api: e, toast: t, myUserId: n, familyId: r }) {
  const [s, a] = x.useState(null), [i, o] = x.useState(""), c = x.useRef(null), u = x.useRef(!1), h = x.useCallback(async () => {
    try {
      const { messages: d } = await e.get(`/api/chat/${r}/messages`), g = c.current, j = g ? g.scrollTop + g.clientHeight >= g.scrollHeight - 40 : !0;
      a(d), requestAnimationFrame(() => {
        c.current && (j || !u.current) && (c.current.scrollTop = c.current.scrollHeight, u.current = !0);
      });
    } catch {
      a((d) => d === null ? [] : d);
    }
  }, [e, r]);
  x.useEffect(() => {
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
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { style: { marginBottom: "var(--sp-3)" }, children: /* @__PURE__ */ l.jsx(vp, { api: e, toast: t, familyId: r }) }),
    /* @__PURE__ */ l.jsxs("div", { className: "chat-window", children: [
      /* @__PURE__ */ l.jsx("div", { className: "chat-messages", ref: c, children: s === null ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
        /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
        " Loading messages…"
      ] }) : s.length === 0 ? /* @__PURE__ */ l.jsx("div", { className: "empty-state", children: /* @__PURE__ */ l.jsx("p", { children: "No messages yet. Say hello." }) }) : s.map((d) => /* @__PURE__ */ l.jsx(yp, { message: d, myId: n }, d.id)) }),
      /* @__PURE__ */ l.jsxs("form", { className: "chat-input-row", onSubmit: f, children: [
        /* @__PURE__ */ l.jsx(
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
        /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary btn-icon", type: "submit", "aria-label": "Send", children: /* @__PURE__ */ l.jsx(C, { name: "send", cls: "icon-sm" }) })
      ] })
    ] })
  ] });
}
function yp({ message: e, myId: t }) {
  const n = e.authorId === t;
  return /* @__PURE__ */ l.jsxs("div", { className: `chat-bubble-row ${n ? "self" : ""}`, children: [
    n ? null : /* @__PURE__ */ l.jsx("div", { className: "avatar avatar-sm", children: Iu(...e.authorName.split(" ")) }),
    /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsx("div", { className: "chat-bubble", children: e.body }),
      /* @__PURE__ */ l.jsxs("div", { className: "chat-meta", children: [
        n ? "" : e.authorName + " · ",
        Dl(e.createdAt)
      ] })
    ] })
  ] });
}
function xp({ api: e, familyId: t }) {
  const [n, r] = x.useState(null), [s, a] = x.useState(""), [i, o] = x.useState(""), c = x.useCallback(async () => {
    const { items: d } = await e.get(`/api/family/${t}/shopping`);
    r(d);
  }, [e, t]);
  x.useEffect(() => {
    r(null), c();
  }, [c]);
  async function u(d) {
    d.preventDefault(), s.trim() && (await e.post(`/api/family/${t}/shopping`, { name: s, quantity: i }), a(""), o(""), c());
  }
  async function h(d) {
    await e.patch(`/api/family/${t}/shopping/${d.id}`, { done: !d.done }), c();
  }
  async function f(d) {
    await e.del(`/api/family/${t}/shopping/${d}`), c();
  }
  return n === null ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Loading…"
  ] }) }) : /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Shopping list" }) }),
    /* @__PURE__ */ l.jsxs("form", { className: "row", style: { marginBottom: "var(--sp-4)" }, onSubmit: u, children: [
      /* @__PURE__ */ l.jsx(
        "input",
        {
          className: "input",
          placeholder: "Add an item…",
          style: { flex: 1 },
          value: s,
          onChange: (d) => a(d.target.value)
        }
      ),
      /* @__PURE__ */ l.jsx(
        "input",
        {
          className: "input",
          placeholder: "Qty",
          style: { width: 90 },
          value: i,
          onChange: (d) => o(d.target.value)
        }
      ),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", type: "submit", children: /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }) })
    ] }),
    n.length ? /* @__PURE__ */ l.jsx("div", { className: "stack", children: n.map((d) => /* @__PURE__ */ l.jsxs("div", { className: `shopping-item ${d.done ? "done" : ""}`, children: [
      /* @__PURE__ */ l.jsx("button", { className: `row-check ${d.done ? "checked" : ""}`, onClick: () => h(d), children: /* @__PURE__ */ l.jsx(C, { name: "check" }) }),
      /* @__PURE__ */ l.jsxs("div", { className: "shopping-name", style: { flex: 1 }, children: [
        d.name,
        " ",
        d.quantity ? /* @__PURE__ */ l.jsxs("span", { className: "muted text-xs", children: [
          "(",
          d.quantity,
          ")"
        ] }) : null
      ] }),
      /* @__PURE__ */ l.jsx("button", { className: "icon-btn", "aria-label": "Remove", onClick: () => f(d.id), children: /* @__PURE__ */ l.jsx(C, { name: "x", cls: "icon-sm" }) })
    ] }, d.id)) }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "List is empty." })
  ] });
}
const jp = {
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
}, Np = { icon: "timeline" };
function wp({ event: e }) {
  const t = jp[e.type] || Np, n = t.accent ? `module-accent--${t.accent}` : "module-accent--none", r = /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsx(C, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ l.jsx("div", { className: "row-title", style: { whiteSpace: "normal", fontWeight: 500 }, children: e.summary }),
      /* @__PURE__ */ l.jsx("div", { className: "row-meta", children: Dl(e.createdAt) })
    ] })
  ] });
  return e.link ? /* @__PURE__ */ l.jsx("a", { className: `row-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ l.jsx("div", { className: `row-item ${n}`, children: r });
}
function kp({ api: e, familyId: t }) {
  const [n, r] = x.useState(null), [s, a] = x.useState(null), i = x.useCallback(() => {
    r(null), a(null), e.get(`/api/family/${t}/activity`).then(({ activity: o }) => r(o)).catch((o) => a(o));
  }, [e, t]);
  return x.useEffect(() => {
    i();
  }, [i]), /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--warmth", children: [
    /* @__PURE__ */ l.jsx("div", { className: "list-region-heading", children: "Activity" }),
    s ? /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load activity" }),
      /* @__PURE__ */ l.jsx("p", { children: s.message }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Try again" })
    ] }) : n === null ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) : n.length ? /* @__PURE__ */ l.jsx("div", { className: "row-list", children: n.map((o) => /* @__PURE__ */ l.jsx(wp, { event: o }, o.id)) }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No activity yet." })
  ] });
}
const Et = [
  ["overview", "Overview"],
  ["members", "Members"],
  ["chat", "Chat"],
  ["shopping", "Shopping list"],
  ["activity", "Activity"]
];
let co = null, uo = "overview";
function Sp({ ctx: e }) {
  var v;
  const { api: t, toast: n, state: r } = e, { families: s, loading: a, error: i, refetch: o } = sp(t, r), [c, u] = x.useState(co), [h, f] = x.useState(uo);
  function d(y) {
    co = y, u(y);
  }
  function g(y) {
    uo = y, f(y);
  }
  function j(y) {
    var L;
    const S = Et.findIndex(([O]) => O === h);
    let T = null;
    if (y.key === "ArrowRight" ? T = (S + 1) % Et.length : y.key === "ArrowLeft" ? T = (S - 1 + Et.length) % Et.length : y.key === "Home" ? T = 0 : y.key === "End" && (T = Et.length - 1), T === null) return;
    y.preventDefault();
    const _ = Et[T][0];
    g(_), (L = document.getElementById(`family-tab-${_}`)) == null || L.focus();
  }
  x.useEffect(() => {
    s.length && !s.some((y) => y.id === c) && d(s[0].id);
  }, [s]);
  function N() {
    op({
      api: t,
      toast: n,
      onCreated: (y) => {
        d(y.id), o();
      }
    });
  }
  function k() {
    up({
      api: t,
      toast: n,
      onJoined: (y) => {
        d(y.id), o();
      }
    });
  }
  if (a)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) });
  if (i)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ l.jsx("p", { children: i.message }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: o, children: "Try again" })
    ] }) });
  if (!s.length)
    return /* @__PURE__ */ l.jsx(ap, { onCreate: N, onJoin: k });
  const p = s.find((y) => y.id === c) || s[0], m = (v = p.members.find((y) => y.userId === r.user.id)) == null ? void 0 : v.role;
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Circle" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Shared responsibilities, chat, and activity." })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "page-actions", children: [
        s.length > 1 ? /* @__PURE__ */ l.jsx(
          "select",
          {
            className: "select",
            style: { width: "auto" },
            value: c ?? "",
            onChange: (y) => d(Number(y.target.value)),
            children: s.map((y) => /* @__PURE__ */ l.jsx("option", { value: y.id, children: y.name }, y.id))
          }
        ) : null,
        /* @__PURE__ */ l.jsx("button", { className: "btn", onClick: k, children: "Join with a code" }),
        /* @__PURE__ */ l.jsxs("button", { className: "btn", onClick: N, children: [
          /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
          " New family"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l.jsx("div", { className: "tabs family-tabs-wrap module-accent--warmth", role: "tablist", "aria-label": "Circle sections", onKeyDown: j, children: Et.map(([y, S]) => /* @__PURE__ */ l.jsx(
      "div",
      {
        id: `family-tab-${y}`,
        className: `tab ${h === y ? "active" : ""}`,
        role: "tab",
        "aria-selected": h === y,
        "aria-controls": `family-panel-${y}`,
        tabIndex: h === y ? 0 : -1,
        onClick: () => g(y),
        children: S
      },
      y
    )) }),
    /* @__PURE__ */ l.jsxs("div", { id: `family-panel-${h}`, role: "tabpanel", "aria-labelledby": `family-tab-${h}`, tabIndex: 0, children: [
      h === "overview" ? /* @__PURE__ */ l.jsx(dp, { api: t, toast: n, familyId: p.id, family: p, myRole: m, onChanged: o }) : null,
      h === "members" ? /* @__PURE__ */ l.jsx(pp, { api: t, toast: n, familyId: p.id, family: p, myRole: m, onChanged: o }) : null,
      h === "chat" ? /* @__PURE__ */ l.jsx(gp, { api: t, toast: n, myUserId: r.user.id, familyId: p.id }) : null,
      h === "shopping" ? /* @__PURE__ */ l.jsx(xp, { api: t, familyId: p.id }) : null,
      h === "activity" ? /* @__PURE__ */ l.jsx(kp, { api: t, familyId: p.id }) : null
    ] })
  ] });
}
function Cp(e) {
  const [t, n] = x.useState([]), [r, s] = x.useState(null), [a, i] = x.useState([]), [o, c] = x.useState(!0), [u, h] = x.useState(null), f = x.useCallback(async () => {
    c(!0), h(null);
    try {
      const [d, g] = await Promise.all([e.get("/api/bills"), e.get("/api/bills/stats")]);
      n(d.bills), s(g.stats), i(g.overdue);
    } catch (d) {
      h(d);
    } finally {
      c(!1);
    }
  }, [e]);
  return x.useEffect(() => {
    f();
  }, [f]), { bills: t, stats: r, overdue: a, loading: o, error: u, refetch: f };
}
const Ep = { rent: "building" };
function Tp({ bill: e, onEdit: t, onMarkPaid: n }) {
  const r = e.status === "unpaid" && e.daysUntilDue < 0;
  return /* @__PURE__ */ l.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ l.jsxs("button", { className: "row-item-btn row", onClick: () => t(e), children: [
      /* @__PURE__ */ l.jsx("div", { className: "bill-cat-icon", children: /* @__PURE__ */ l.jsx(C, { name: Ep[e.category] || "bill", cls: "icon-sm" }) }),
      /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ l.jsx("div", { className: "row-title", children: e.name }),
        /* @__PURE__ */ l.jsxs("div", { className: "row-meta", children: [
          /* @__PURE__ */ l.jsx("span", { style: { textTransform: "capitalize" }, children: e.category }),
          /* @__PURE__ */ l.jsx("span", { children: Xe(e.dueDate) }),
          e.status === "unpaid" ? /* @__PURE__ */ l.jsx("span", { className: `badge ${r ? "badge-critical" : "badge-neutral"}`, children: Ga(e.daysUntilDue) }) : /* @__PURE__ */ l.jsx("span", { className: "badge badge-success", children: "Paid" })
        ] })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "bill-amount", children: Pt(e.amount, e.currency) })
    ] }),
    e.status === "unpaid" ? /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", onClick: () => n(e.id), children: "Mark paid" }) : null
  ] });
}
function bp({ byCategory: e, currency: t }) {
  const n = Object.entries(e).sort((s, a) => a[1] - s[1]);
  if (!n.length) return /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No data yet." });
  const r = Math.max(...n.map((s) => s[1]));
  return /* @__PURE__ */ l.jsx(l.Fragment, { children: n.map(([s, a]) => /* @__PURE__ */ l.jsxs("div", { className: "category-bar-row", children: [
    /* @__PURE__ */ l.jsx("span", { className: "cat-label", children: s }),
    /* @__PURE__ */ l.jsx("div", { className: "category-bar-track", children: /* @__PURE__ */ l.jsx("div", { className: "category-bar-fill", style: { width: `${a / r * 100}%` } }) }),
    /* @__PURE__ */ l.jsx("span", { className: "cat-amount", children: Pt(a, t) })
  ] }, s)) });
}
function _p({ bills: e }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--danger-400)" }, children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Overdue bills" }) }),
    /* @__PURE__ */ l.jsx("div", { className: "row-list", children: e.map((t) => /* @__PURE__ */ l.jsxs("div", { className: "row-item", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ l.jsx("div", { className: "row-title", children: t.name }),
        /* @__PURE__ */ l.jsx("div", { className: "row-meta", children: Ga(t.daysUntilDue) })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "bill-amount", children: Pt(t.amount, t.currency) })
    ] }, t.id)) })
  ] });
}
function Mp({ state: e }) {
  return e ? e.unavailable ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ l.jsxs("p", { className: "text-sm muted", children: [
    /* @__PURE__ */ l.jsx(C, { name: "info", cls: "icon-sm" }),
    " AI insights require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo."
  ] }) }) : e.loading ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Analyzing your spending…"
  ] }) }) : e.error ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ l.jsx("p", { className: "field-error", children: e.error }) }) : /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)", borderColor: "var(--brand-soft-border)" }, children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsxs("span", { className: "card-title", children: [
      /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
      " AI insights"
    ] }) }),
    /* @__PURE__ */ l.jsx("ul", { className: "stack", style: { gap: "6px" }, children: e.data.insights.map((t, n) => /* @__PURE__ */ l.jsx("li", { className: "text-sm", children: t }, n)) })
  ] }) : null;
}
const Lp = ["electricity", "water", "internet", "phone", "rent", "subscription", "insurance", "loan", "other"], Dp = ["none", "weekly", "monthly", "yearly"];
function Ip({ existing: e }) {
  return /* @__PURE__ */ l.jsxs("form", { id: "bill-form", className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Name" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "name", required: !0, defaultValue: e ? e.name : "" })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Amount" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", type: "number", step: "0.01", min: "0.01", name: "amount", required: !0, defaultValue: e ? e.amount : "" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Currency" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", name: "currency", defaultValue: e ? e.currency : "EUR" })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Category" }),
        /* @__PURE__ */ l.jsx("select", { className: "select", name: "category", defaultValue: e == null ? void 0 : e.category, children: Lp.map((t) => /* @__PURE__ */ l.jsx("option", { value: t, children: t }, t)) })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Recurrence" }),
        /* @__PURE__ */ l.jsx("select", { className: "select", name: "recurrence", defaultValue: e == null ? void 0 : e.recurrence, children: Dp.map((t) => /* @__PURE__ */ l.jsx("option", { value: t, children: t }, t)) })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Due date" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", type: "date", name: "dueDate", required: !0, defaultValue: (e == null ? void 0 : e.dueDate) || "" })
    ] }),
    /* @__PURE__ */ l.jsx(Ou, { existing: e == null ? void 0 : e.reminder, hint: "For a bill that repeats, the reminder moves to the next due date each time you pay it." }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Notes" }),
      /* @__PURE__ */ l.jsx("textarea", { className: "textarea", name: "notes", defaultValue: e && e.notes || "" })
    ] })
  ] });
}
function mo({ api: e, toast: t, existing: n, onSaved: r }) {
  let s = null;
  ce({
    title: n ? "Edit bill" : "Add a bill",
    bodyHtml: '<div id="bill-form-mount"></div>',
    footerHtml: `
    ${n ? '<button class="btn btn-danger" id="delete-bill-btn" style="margin-right:auto">Delete</button>' : ""}
    <button class="btn" data-close>Cancel</button>
    <button class="btn btn-primary" id="save-bill-btn">${n ? "Save changes" : "Add bill"}</button>
  `,
    onMount: (i) => {
      s = le(i.querySelector("#bill-form-mount")), s.render(x.createElement(Ip, { existing: n })), document.getElementById("save-bill-btn").addEventListener("click", async () => {
        const c = document.getElementById("bill-form"), u = Object.fromEntries(new FormData(c).entries()), h = {
          name: u.name.trim(),
          amount: Number(u.amount),
          currency: u.currency || "EUR",
          category: u.category,
          recurrence: u.recurrence,
          dueDate: u.dueDate,
          notes: u.notes || null,
          reminder: Ru(u.reminder)
        };
        try {
          n ? await e.patch(`/api/bills/${n.id}`, h) : await e.post("/api/bills", h), t(n ? "Bill updated" : "Bill added", "success"), ee(), r();
        } catch (f) {
          t(f.message, "error");
        }
      });
      const o = document.getElementById("delete-bill-btn");
      o && o.addEventListener("click", async () => {
        await We({ title: "Delete bill?", message: `"${n.name}" will be permanently deleted.`, confirmLabel: "Delete" }) && (await e.del(`/api/bills/${n.id}`), t("Bill deleted", "success"), r());
      });
    },
    onClose: () => {
      s && (s.unmount(), s = null);
    }
  });
}
function Pp({ ctx: e }) {
  var k, p;
  const { api: t, toast: n, state: r } = e, { bills: s, stats: a, overdue: i, loading: o, error: c, refetch: u } = Cp(t), [h, f] = x.useState(null);
  async function d(m) {
    try {
      await t.post(`/api/bills/${m}/pay`, {}), n("Marked as paid", "success"), u();
    } catch (v) {
      n(v.message, "error");
    }
  }
  function g() {
    mo({ api: t, toast: n, existing: null, onSaved: u });
  }
  function j(m) {
    mo({ api: t, toast: n, existing: m, onSaved: u });
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
  return o ? /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Loading BillSense…"
  ] }) }) : c ? /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this page" }),
    /* @__PURE__ */ l.jsx("p", { children: c.message }),
    /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: u, children: "Try again" })
  ] }) }) : /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "BillSense" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Understand and stay ahead of recurring expenses." })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "page-actions", children: [
        /* @__PURE__ */ l.jsxs("button", { className: "btn", onClick: N, children: [
          /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " AI insights"
        ] }),
        /* @__PURE__ */ l.jsxs("button", { className: "btn btn-primary", onClick: g, children: [
          /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Add bill"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "stat-row", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ l.jsx("div", { className: "stat-value", children: (k = a.monthlyTotals) != null && k.length ? a.monthlyTotals.map((m) => Pt(m.total, m.currency)).join(" + ") : Pt(a.monthlyTotal, a.currency) }),
        /* @__PURE__ */ l.jsx("div", { className: "stat-label", children: "Monthly total" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ l.jsx("div", { className: "stat-value", children: (p = a.paidThisMonth) != null && p.length ? a.paidThisMonth.map((m) => Pt(m.total, m.currency)).join(" + ") : Pt(0) }),
        /* @__PURE__ */ l.jsxs("div", { className: "stat-label", children: [
          "Paid this month",
          a.paidThisMonthCount ? ` · ${a.paidThisMonthCount} ${a.paidThisMonthCount === 1 ? "payment" : "payments"}` : ""
        ] })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ l.jsx("div", { className: "stat-value", children: a.overdueCount }),
        /* @__PURE__ */ l.jsx("div", { className: "stat-label", children: "Overdue" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "card card-pad stat-tile", children: [
        /* @__PURE__ */ l.jsx("div", { className: "stat-value", children: a.upcomingCount }),
        /* @__PURE__ */ l.jsx("div", { className: "stat-label", children: "Due in 14 days" })
      ] })
    ] }),
    /* @__PURE__ */ l.jsx(Mp, { state: h }),
    /* @__PURE__ */ l.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--money", children: [
        /* @__PURE__ */ l.jsxs("div", { className: "list-region-heading", children: [
          "All bills",
          s.length ? ` (${s.length})` : ""
        ] }),
        s.length ? /* @__PURE__ */ l.jsx("div", { className: "row-list", children: s.map((m) => /* @__PURE__ */ l.jsx(Tp, { bill: m, onEdit: j, onMarkPaid: d }, m.id)) }) : /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
          /* @__PURE__ */ l.jsx(C, { name: "bill", cls: "icon-lg" }),
          /* @__PURE__ */ l.jsx("h3", { children: "No bills yet" }),
          /* @__PURE__ */ l.jsx("p", { children: "Add your first recurring bill to start understanding your monthly obligations." })
        ] })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
          /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsxs("span", { className: "card-title", children: [
            "By category",
            a.mixedCurrencies ? ` (${a.currency} only)` : ""
          ] }) }),
          /* @__PURE__ */ l.jsx(bp, { byCategory: a.byCategory, currency: a.currency })
        ] }),
        i.length ? /* @__PURE__ */ l.jsx(_p, { bills: i }) : null
      ] })
    ] })
  ] });
}
function $p(e) {
  const [t, n] = x.useState([]), [r, s] = x.useState(!0), [a, i] = x.useState(null), o = x.useCallback(async () => {
    s(!0), i(null);
    try {
      const { goals: c } = await e.get("/api/goals");
      n(c);
    } catch (c) {
      i(c);
    } finally {
      s(!1);
    }
  }, [e]);
  return x.useEffect(() => {
    o();
  }, [o]), { goals: t, loading: r, error: a, refetch: o };
}
function Ap() {
  return /* @__PURE__ */ l.jsxs("form", { id: "ms-form", className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Title" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "title", required: !0 })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Due date (optional)" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", type: "date", name: "dueDate" })
    ] })
  ] });
}
function Rp({ api: e, toast: t, goalId: n, onSaved: r }) {
  let s = null;
  ce({
    title: "Add a milestone",
    bodyHtml: '<div id="ms-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="ms-save">Add</button>',
    onMount: (a) => {
      s = le(a.querySelector("#ms-form-mount")), s.render(x.createElement(Ap)), document.getElementById("ms-save").addEventListener("click", async () => {
        const i = document.getElementById("ms-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.title.trim()) return t("Title is required.", "error");
        await e.post(`/api/goals/${n}/milestones`, { title: o.title.trim(), dueDate: o.dueDate || null }), ee(), r();
      });
    },
    onClose: () => {
      s && (s.unmount(), s = null);
    }
  });
}
const Op = 14;
function zp(e) {
  if (!e) return null;
  const t = new Date((/* @__PURE__ */ new Date()).toDateString()), n = Math.round((/* @__PURE__ */ new Date(`${e}T00:00:00`) - t) / 864e5);
  return n < 0 ? { cls: "is-overdue", label: `Overdue — was ${Xe(e)}` } : n <= Op ? { cls: "is-approaching", label: `Target: ${Xe(e)}` } : { cls: "is-future", label: `Target: ${Xe(e)}` };
}
function fo({ goal: e, api: t, toast: n, state: r, onChanged: s, expanded: a, onToggle: i }) {
  const [o, c] = x.useState(!1), [u, h] = x.useState(!1), f = x.useRef(null);
  x.useEffect(() => {
    a && f.current && f.current.focus(), a || c(!1);
  }, [a]);
  const d = e.milestones.length, g = e.milestones.filter((E) => E.done).length, j = d ? Math.round(g / d * 100) : 0, N = e.milestones.find((E) => !E.done) || null, k = e.milestones.find((E) => !E.done && E.id !== (N == null ? void 0 : N.id)) || null, p = k ? [k] : [], m = new Set([N, ...p].filter(Boolean).map((E) => E.id)), v = e.milestones.filter((E) => !m.has(E.id)), y = zp(e.targetDate), S = `goal-detail-${e.id}`, T = `goal-milestones-${e.id}`;
  async function _(E, xe) {
    await t.patch(`/api/goals/${e.id}/milestones/${E}`, { done: !xe }), s();
  }
  async function L() {
    await We({ title: "Delete goal?", message: "This cannot be undone.", confirmLabel: "Delete" }) && (await t.del(`/api/goals/${e.id}`), s());
  }
  async function O() {
    if (!r.aiConfigured) return n("AI is not configured on this server.", "error");
    h(!0);
    try {
      const E = await t.post(`/api/goals/${e.id}/suggest-milestones`, {});
      E.ok || n(E.error, "error"), s();
    } catch (E) {
      n(E.message, "error");
    } finally {
      h(!1);
    }
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "goal-row-wrap", children: [
    /* @__PURE__ */ l.jsxs("button", { className: "row-item goal-row-toggle", "aria-expanded": a, "aria-controls": S, onClick: () => i(e.id), children: [
      /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
        /* @__PURE__ */ l.jsxs("div", { className: "row-title", children: [
          e.title,
          e.status !== "active" ? /* @__PURE__ */ l.jsxs("span", { className: `goal-row-status ${e.status === "completed" ? "is-completed" : "is-abandoned"}`, children: [
            " ",
            "· ",
            e.status === "completed" ? "Completed" : "Abandoned"
          ] }) : null
        ] }),
        /* @__PURE__ */ l.jsxs("div", { className: "row-meta", children: [
          /* @__PURE__ */ l.jsx("span", { className: "goal-row-category", children: e.category }),
          /* @__PURE__ */ l.jsx("span", { children: d ? `${g} of ${d} milestones` : "No milestones yet" }),
          N ? /* @__PURE__ */ l.jsxs("span", { children: [
            "Next: ",
            N.title
          ] }) : d ? /* @__PURE__ */ l.jsx("span", { children: "All milestones complete" }) : null,
          y ? /* @__PURE__ */ l.jsx("span", { className: `goal-target ${y.cls}`, children: y.label }) : null
        ] })
      ] }),
      d ? /* @__PURE__ */ l.jsx("div", { className: "progress-track goal-row-progress", "aria-hidden": "true", children: /* @__PURE__ */ l.jsx("div", { className: "progress-fill", style: { width: `${j}%` } }) }) : null,
      /* @__PURE__ */ l.jsx("span", { className: "goal-row-pct text-xs muted", "aria-hidden": "true", children: d ? `${j}%` : "—" }),
      /* @__PURE__ */ l.jsx(C, { name: "chevron", cls: `icon-sm goal-row-chevron ${a ? "is-open" : ""}` })
    ] }),
    a ? /* @__PURE__ */ l.jsxs("div", { className: "goal-detail", id: S, children: [
      /* @__PURE__ */ l.jsxs("h3", { className: "visually-hidden", tabIndex: -1, ref: f, children: [
        e.title,
        " — details"
      ] }),
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsxs("div", { className: "row-between text-xs muted", style: { marginBottom: 4 }, children: [
          /* @__PURE__ */ l.jsx("span", { children: d ? `${g} of ${d} milestones done` : "No milestones yet" }),
          /* @__PURE__ */ l.jsx("span", { children: d ? `${j}%` : null })
        ] }),
        d ? /* @__PURE__ */ l.jsx("div", { className: "progress-track", role: "progressbar", "aria-valuenow": j, "aria-valuemin": "0", "aria-valuemax": "100", "aria-label": `${e.title} progress`, children: /* @__PURE__ */ l.jsx("div", { className: "progress-fill", style: { width: `${j}%` } }) }) : null,
        y ? /* @__PURE__ */ l.jsx("div", { className: `goal-target ${y.cls}`, style: { marginTop: 4 }, children: y.label }) : null
      ] }),
      N ? /* @__PURE__ */ l.jsxs("div", { className: "goal-detail-next", children: [
        /* @__PURE__ */ l.jsx("button", { className: "row-check", onClick: () => _(N.id, N.done), "aria-label": `Mark "${N.title}" as done`, children: /* @__PURE__ */ l.jsx(C, { name: "check", cls: "icon-sm" }) }),
        /* @__PURE__ */ l.jsxs("span", { className: "milestone-title", children: [
          "Next: ",
          N.title
        ] })
      ] }) : d ? /* @__PURE__ */ l.jsx("p", { className: "text-sm", style: { color: "var(--accent-600)" }, children: "All milestones complete." }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "Add a milestone, or ask AI to suggest a few." }),
      p.length ? /* @__PURE__ */ l.jsx("div", { className: "stack", style: { gap: 6 }, children: p.map((E) => /* @__PURE__ */ l.jsxs("div", { className: "milestone-row", children: [
        /* @__PURE__ */ l.jsx("button", { className: "row-check", onClick: () => _(E.id, E.done), "aria-label": `Mark "${E.title}" as done`, children: /* @__PURE__ */ l.jsx(C, { name: "check", cls: "icon-sm" }) }),
        /* @__PURE__ */ l.jsx("span", { className: "milestone-title", children: E.title })
      ] }, E.id)) }) : null,
      v.length ? /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm goal-show-all", "aria-expanded": o, "aria-controls": T, onClick: () => c((E) => !E), children: o ? "Show fewer" : `Show all (${v.length} more)` }) : null,
      o && v.length ? /* @__PURE__ */ l.jsx("div", { className: "stack", id: T, style: { gap: 6, marginTop: 6 }, children: v.map((E) => /* @__PURE__ */ l.jsxs("div", { className: `milestone-row ${E.done ? "done" : ""}`, children: [
        /* @__PURE__ */ l.jsx(
          "button",
          {
            className: `row-check ${E.done ? "checked" : ""}`,
            onClick: () => _(E.id, E.done),
            "aria-label": `Mark "${E.title}" as ${E.done ? "not done" : "done"}`,
            children: /* @__PURE__ */ l.jsx(C, { name: "check", cls: "icon-sm" })
          }
        ),
        /* @__PURE__ */ l.jsx("span", { className: "milestone-title", children: E.title })
      ] }, E.id)) }) : null,
      /* @__PURE__ */ l.jsxs("div", { className: "row goal-detail-actions", style: { gap: 6 }, children: [
        /* @__PURE__ */ l.jsxs("button", { className: "btn btn-sm", onClick: () => Rp({ api: t, toast: n, goalId: e.id, onSaved: s }), children: [
          /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Milestone"
        ] }),
        d ? null : /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", disabled: u, onClick: O, children: u ? /* @__PURE__ */ l.jsx("span", { className: "spinner" }) : /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
          /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " Suggest with AI"
        ] }) }),
        /* @__PURE__ */ l.jsxs("button", { className: "btn btn-sm btn-ghost", style: { marginLeft: "auto" }, onClick: L, children: [
          /* @__PURE__ */ l.jsx(C, { name: "trash", cls: "icon-sm" }),
          " Delete goal"
        ] })
      ] })
    ] }) : null
  ] });
}
const Fp = ["learning", "fitness", "financial", "career", "habit", "personal"];
function Bp() {
  return /* @__PURE__ */ l.jsxs("form", { id: "goal-form", className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Title" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "title", required: !0 })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Description (optional)" }),
      /* @__PURE__ */ l.jsx("textarea", { className: "textarea", name: "description" })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Category" }),
        /* @__PURE__ */ l.jsx("select", { className: "select", name: "category", children: Fp.map((e) => /* @__PURE__ */ l.jsx("option", { value: e, children: e }, e)) })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Target date" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", type: "date", name: "targetDate" })
      ] })
    ] })
  ] });
}
function Up({ api: e, toast: t, onSaved: n }) {
  let r = null;
  ce({
    title: "New goal",
    bodyHtml: '<div id="goal-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="goal-save">Create goal</button>',
    onMount: (s) => {
      r = le(s.querySelector("#goal-form-mount")), r.render(x.createElement(Bp)), document.getElementById("goal-save").addEventListener("click", async () => {
        const a = document.getElementById("goal-form"), i = Object.fromEntries(new FormData(a).entries());
        if (!i.title.trim()) return t("Title is required.", "error");
        try {
          await e.post("/api/goals", { title: i.title.trim(), description: i.description || null, category: i.category, targetDate: i.targetDate || null }), t("Goal created", "success"), ee(), n();
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
function Vp({ ctx: e }) {
  const { api: t, toast: n, state: r, params: s } = e, { goals: a, loading: i, error: o, refetch: c } = $p(t), [u, h] = x.useState(() => {
    const N = s && s[0], k = N ? Number(N) : null;
    return Number.isFinite(k) && k > 0 ? k : null;
  });
  x.useEffect(() => {
    u != null && !i && !a.some((N) => N.id === u) && (h(null), history.replaceState(null, "", "#/goals"));
  }, [a, i, u]);
  function f() {
    Up({ api: t, toast: n, onSaved: c });
  }
  function d(N) {
    h((k) => {
      const p = k === N ? null : N;
      return history.pushState(null, "", p ? `#/goals/${p}` : "#/goals"), p;
    });
  }
  if (i)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading goals…"
    ] }) });
  if (o)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ l.jsx("p", { children: o.message }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: c, children: "Retry" })
    ] }) });
  const g = a.filter((N) => N.status === "active"), j = a.filter((N) => N.status !== "active");
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Goals" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Learning, fitness, financial and personal goals — broken into real steps." })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "page-actions", children: /* @__PURE__ */ l.jsxs("button", { className: "btn btn-primary", onClick: f, children: [
        /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
        " New goal"
      ] }) })
    ] }),
    g.length ? /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--warmth", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "list-region-heading", children: [
        g.length,
        " active goal",
        g.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "row-list", children: g.map((N) => /* @__PURE__ */ l.jsx(fo, { goal: N, api: t, toast: n, state: r, onChanged: c, expanded: u === N.id, onToggle: d }, N.id)) })
    ] }) : /* @__PURE__ */ l.jsx("div", { className: "card", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "goal", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "No goals yet" }),
      /* @__PURE__ */ l.jsx("p", { children: "Set a learning, fitness, financial or personal goal and break it into milestones." }),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Add a goal" })
    ] }) }),
    j.length ? /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--warmth", style: { marginTop: "var(--sp-6)" }, children: [
      /* @__PURE__ */ l.jsx("div", { className: "list-region-heading", children: "Completed / inactive" }),
      /* @__PURE__ */ l.jsx("div", { className: "row-list", children: j.map((N) => /* @__PURE__ */ l.jsx(fo, { goal: N, api: t, toast: n, state: r, onChanged: c, expanded: u === N.id, onToggle: d }, N.id)) })
    ] }) : null
  ] });
}
function Hp(e) {
  const [t, n] = x.useState([]), [r, s] = x.useState(null), [a, i] = x.useState(0), [o, c] = x.useState(!0), [u, h] = x.useState(null), f = x.useCallback(async () => {
    c(!0), h(null);
    try {
      const [d, g] = await Promise.all([e.get("/api/ecolife/summary"), e.get("/api/ecolife")]);
      s(d.summary), i(d.totalLogs), n(g.logs);
    } catch (d) {
      h(d);
    } finally {
      c(!1);
    }
  }, [e]);
  return x.useEffect(() => {
    f();
  }, [f]), { logs: t, summary: r, totalLogs: a, loading: o, error: u, refetch: f };
}
const Wp = { transport: "refresh", energy: "sun", food: "cart", shopping: "cart", waste: "trash", water: "refresh" };
function Qp({ log: e, onDelete: t }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "row-item", children: [
    /* @__PURE__ */ l.jsx("div", { className: "eco-cat-icon", style: { width: 32, height: 32 }, children: /* @__PURE__ */ l.jsx(C, { name: Wp[e.category] || "eco", cls: "icon-sm" }) }),
    /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ l.jsx("div", { className: "row-title", children: e.action }),
      /* @__PURE__ */ l.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ l.jsx("span", { style: { textTransform: "capitalize" }, children: e.category }),
        e.quantity ? /* @__PURE__ */ l.jsxs("span", { children: [
          e.quantity,
          e.unit ? ` ${e.unit}` : ""
        ] }) : null,
        /* @__PURE__ */ l.jsx("span", { children: Dl(e.logged_at) })
      ] })
    ] }),
    /* @__PURE__ */ l.jsx("button", { className: "icon-btn", "aria-label": "Delete", onClick: () => t(e.id), children: /* @__PURE__ */ l.jsx(C, { name: "x", cls: "icon-sm" }) })
  ] });
}
function qp({ state: e }) {
  return e ? e.unavailable ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ l.jsxs("p", { className: "text-sm muted", children: [
    /* @__PURE__ */ l.jsx(C, { name: "info", cls: "icon-sm" }),
    " AI tips require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo."
  ] }) }) : e.loading ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Finding practical suggestions for you…"
  ] }) }) : e.error ? /* @__PURE__ */ l.jsx("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)" }, children: /* @__PURE__ */ l.jsx("p", { className: "field-error", children: e.error }) }) : /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", style: { marginBottom: "var(--sp-5)", borderColor: "var(--brand-soft-border)" }, children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsxs("span", { className: "card-title", children: [
      /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
      " Suggestions for you"
    ] }) }),
    /* @__PURE__ */ l.jsx("div", { className: "stack", children: e.data.tips.map((t, n) => /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsx("strong", { className: "text-sm", style: { textTransform: "capitalize" }, children: t.area }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", children: t.tip })
    ] }, n)) })
  ] }) : null;
}
const Yp = ["transport", "energy", "food", "shopping", "waste", "water"], Kp = { transport: "Transport", energy: "Energy", food: "Food", shopping: "Shopping", waste: "Waste", water: "Water" };
function Gp() {
  return /* @__PURE__ */ l.jsxs("form", { id: "eco-form", className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Category" }),
      /* @__PURE__ */ l.jsx("select", { className: "select", name: "category", children: Yp.map((e) => /* @__PURE__ */ l.jsx("option", { value: e, children: Kp[e] }, e)) })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "What did you do?" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "action", placeholder: "e.g. Took the bus instead of driving", required: !0 })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Quantity (optional)" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", type: "number", step: "0.1", name: "quantity" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Unit" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", name: "unit", placeholder: "km, kg, kWh…" })
      ] })
    ] })
  ] });
}
function po({ api: e, toast: t, onSaved: n }) {
  let r = null;
  ce({
    title: "Log an eco action",
    bodyHtml: '<div id="eco-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="eco-save">Log it</button>',
    onMount: (s) => {
      r = le(s.querySelector("#eco-form-mount")), r.render(x.createElement(Gp)), document.getElementById("eco-save").addEventListener("click", async () => {
        const a = document.getElementById("eco-form"), i = Object.fromEntries(new FormData(a).entries());
        if (!i.action.trim()) return t("Describe the action.", "error");
        const o = { category: i.category, action: i.action.trim(), quantity: i.quantity ? Number(i.quantity) : null, unit: i.unit || null };
        try {
          await e.post("/api/ecolife", o), t("Logged", "success"), ee(), n();
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
const Zp = ["transport", "energy", "food", "shopping", "waste", "water"], Xp = { transport: "refresh", energy: "sun", food: "cart", shopping: "cart", waste: "trash", water: "refresh" }, Jp = { transport: "Transport", energy: "Energy", food: "Food", shopping: "Shopping", waste: "Waste", water: "Water" };
function eh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, { logs: s, summary: a, totalLogs: i, loading: o, error: c, refetch: u } = Hp(t), [h, f] = x.useState(null);
  async function d(j) {
    await We({ title: "Delete this log?", message: "This entry will be permanently removed.", confirmLabel: "Delete" }) && (await t.del(`/api/ecolife/${j}`), u());
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
  return o ? /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Loading EcoLife…"
  ] }) }) : c ? /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
    /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
    /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this page" }),
    /* @__PURE__ */ l.jsx("p", { children: c.message }),
    /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: u, children: "Retry" })
  ] }) }) : /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "EcoLife" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Track habits and get practical, honest sustainability suggestions." })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "page-actions", children: [
        /* @__PURE__ */ l.jsxs("button", { className: "btn", onClick: g, children: [
          /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " Get tips"
        ] }),
        /* @__PURE__ */ l.jsxs("button", { className: "btn btn-primary", onClick: () => po({ api: t, toast: n, onSaved: u }), children: [
          /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
          " Log an action"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l.jsx(qp, { state: h }),
    /* @__PURE__ */ l.jsx("div", { className: "grid-3", style: { marginBottom: "var(--sp-6)" }, children: Zp.map((j) => /* @__PURE__ */ l.jsxs("div", { className: "card eco-cat-card", children: [
      /* @__PURE__ */ l.jsx("div", { className: "eco-cat-icon", children: /* @__PURE__ */ l.jsx(C, { name: Xp[j], cls: "icon" }) }),
      /* @__PURE__ */ l.jsx("div", { style: { fontWeight: 700, fontSize: "var(--fs-lg)" }, children: a[j].count }),
      /* @__PURE__ */ l.jsxs("div", { className: "muted text-xs", children: [
        Jp[j],
        " logs"
      ] })
    ] }, j)) }),
    s.length ? /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--nature", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "list-region-heading", children: [
        i,
        " logged in the last 30 days"
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "row-list", children: s.slice(0, 15).map((j) => /* @__PURE__ */ l.jsx(Qp, { log: j, onDelete: d }, j.id)) }),
      s.length > 15 ? /* @__PURE__ */ l.jsx("p", { className: "muted text-xs", style: { marginTop: "var(--sp-2)" }, children: "Showing the 15 most recent." }) : null
    ] }) : /* @__PURE__ */ l.jsx("div", { className: "card", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "eco", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "No logs yet" }),
      /* @__PURE__ */ l.jsx("p", { children: "Log small everyday actions — taking the bus, recycling, a meatless meal — to see patterns and get tips." }),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: () => po({ api: t, toast: n, onSaved: u }), children: "Log an action" })
    ] }) })
  ] });
}
function th(e) {
  const t = {};
  for (const n of e) {
    const r = n.createdAt.slice(0, 10), s = Pu(r);
    t[s] || (t[s] = []), t[s].push(n);
  }
  return t;
}
const nh = {
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
}, rh = { icon: "timeline" };
function lh({ event: e }) {
  const t = nh[e.type] || rh, n = t.accent ? `module-accent--${t.accent}` : "", r = /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsx("span", { className: "timeline-time", children: $u(e.createdAt.replace(" ", "T") + "Z") }),
    /* @__PURE__ */ l.jsx(C, { name: t.icon, cls: "icon-sm timeline-icon" }),
    /* @__PURE__ */ l.jsx("span", { className: "text-sm", children: e.summary })
  ] });
  return e.link ? /* @__PURE__ */ l.jsx("a", { className: `timeline-item ${n}`, href: e.link, style: { textDecoration: "none" }, children: r }) : /* @__PURE__ */ l.jsx("div", { className: `timeline-item ${n}`, children: r });
}
function sh({ ctx: e }) {
  const { api: t } = e, [n, r] = x.useState(null), [s, a] = x.useState(null), i = x.useCallback(() => {
    a(null), t.get("/api/timeline").then(({ activity: o }) => r(o)).catch((o) => a(o));
  }, [t]);
  return x.useEffect(() => {
    i();
  }, [i]), /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsx("div", { className: "page-header", children: /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Ledger" }),
      /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "The complete, dated record of everything that's happened." })
    ] }) }),
    /* @__PURE__ */ l.jsx("div", { className: "list-region", children: s ? /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load your timeline" }),
      /* @__PURE__ */ l.jsx("p", { children: s.message }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Try again" })
    ] }) : n === null ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading timeline…"
    ] }) : n.length === 0 ? /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "timeline", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Nothing here yet" }),
      /* @__PURE__ */ l.jsx("p", { children: "As you complete tasks, pay bills, and make decisions, they'll show up here." })
    ] }) : Object.entries(th(n)).map(([o, c]) => /* @__PURE__ */ l.jsxs("div", { className: "timeline-day", children: [
      /* @__PURE__ */ l.jsx("div", { className: "timeline-day-label", children: o }),
      c.map((u) => /* @__PURE__ */ l.jsx(lh, { event: u }, u.id))
    ] }, o)) })
  ] });
}
function ah(e) {
  const [t, n] = x.useState([]), [r, s] = x.useState(!0), [a, i] = x.useState(null), o = x.useCallback(async () => {
    s(!0), i(null);
    try {
      const { decisions: c } = await e.get("/api/decisions");
      n(c);
    } catch (c) {
      i(c);
    } finally {
      s(!1);
    }
  }, [e]);
  return x.useEffect(() => {
    o();
  }, [o]), { decisions: t, loading: r, error: a, refetch: o };
}
function ho({ decision: e }) {
  return /* @__PURE__ */ l.jsxs("a", { className: "row-item", href: `#/decisionflow/${e.id}`, style: { textDecoration: "none" }, children: [
    /* @__PURE__ */ l.jsx(
      "div",
      {
        className: "row-check",
        style: {
          pointerEvents: "none",
          ...e.status === "decided" ? { background: "var(--accent-500)", borderColor: "var(--accent-500)", color: "#fff" } : {}
        },
        children: /* @__PURE__ */ l.jsx(C, { name: e.status === "decided" ? "check" : "decision", cls: "icon-sm" })
      }
    ),
    /* @__PURE__ */ l.jsxs("div", { className: "row-main", children: [
      /* @__PURE__ */ l.jsx("div", { className: "row-title", children: e.question }),
      /* @__PURE__ */ l.jsxs("div", { className: "row-meta", children: [
        /* @__PURE__ */ l.jsx("span", { children: Xe(e.createdAt) }),
        e.status === "decided" ? /* @__PURE__ */ l.jsx("span", { className: "badge badge-success", children: "Decided" }) : /* @__PURE__ */ l.jsx("span", { className: "badge badge-neutral", children: "Open" })
      ] })
    ] })
  ] });
}
function ih() {
  return /* @__PURE__ */ l.jsx("form", { id: "decision-form", children: /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "What are you trying to decide?" }),
    /* @__PURE__ */ l.jsx("textarea", { className: "textarea", name: "question", placeholder: "Should I buy this laptop? Should I move apartments? Should I take this job?", required: !0 })
  ] }) });
}
function vo({ api: e, toast: t }) {
  let n = null;
  ce({
    title: "Start a new decision",
    bodyHtml: '<div id="decision-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="save-decision-btn">Start</button>',
    onMount: (r) => {
      n = le(r.querySelector("#decision-form-mount")), n.render(x.createElement(ih)), document.getElementById("save-decision-btn").addEventListener("click", async () => {
        const s = document.querySelector("#decision-form [name=question]").value.trim();
        if (!s) return t("Describe the decision first.", "error");
        try {
          const { decision: a } = await e.post("/api/decisions", { question: s });
          ee(), location.hash = `#/decisionflow/${a.id}`;
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
function oh({ ctx: e }) {
  const { api: t, toast: n } = e, { decisions: r, loading: s, error: a, refetch: i } = ah(t);
  if (s)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading decisions…"
    ] }) });
  if (a)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this page" }),
      /* @__PURE__ */ l.jsx("p", { children: a.message }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: i, children: "Retry" })
    ] }) });
  const o = r.filter((u) => u.status !== "decided"), c = r.filter((u) => u.status === "decided");
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "DecisionFlow" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Structure hard decisions with clear, transparent reasoning." })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "page-actions", children: /* @__PURE__ */ l.jsxs("button", { className: "btn btn-primary", onClick: () => vo({ api: t, toast: n }), children: [
        /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
        " New decision"
      ] }) })
    ] }),
    o.length ? /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--reasoning", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "list-region-heading", children: [
        o.length,
        " open decision",
        o.length === 1 ? "" : "s"
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "row-list", children: o.map((u) => /* @__PURE__ */ l.jsx(ho, { decision: u }, u.id)) })
    ] }) : /* @__PURE__ */ l.jsx("div", { className: "card", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "decision", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "No open decisions" }),
      /* @__PURE__ */ l.jsx("p", { children: "Describe something you're trying to decide — LifeAdmin will help you weigh it clearly." }),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-2)" }, onClick: () => vo({ api: t, toast: n }), children: "Start a decision" })
    ] }) }),
    c.length ? /* @__PURE__ */ l.jsxs("div", { className: "list-region module-accent--reasoning", style: { marginTop: "var(--sp-6)" }, children: [
      /* @__PURE__ */ l.jsx("div", { className: "list-region-heading", children: "Decided" }),
      /* @__PURE__ */ l.jsx("div", { className: "row-list", children: c.map((u) => /* @__PURE__ */ l.jsx(ho, { decision: u }, u.id)) })
    ] }) : null
  ] });
}
function ch(e, t) {
  const [n, r] = x.useState(null), [s, a] = x.useState(!0), [i, o] = x.useState(null), c = x.useCallback(async () => {
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
  return x.useEffect(() => {
    c();
  }, [c]), { ...n, loading: s, error: i, refetch: c };
}
function uh({ criterion: e, onSetWeight: t }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "criterion-row", children: [
    /* @__PURE__ */ l.jsx("span", { className: "crit-name", children: e.name }),
    /* @__PURE__ */ l.jsx("div", { className: "weight-dots", children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ l.jsx(
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
function dh({ scored: e, isTop: t, decisionStatus: n, onDecide: r, onDelete: s }) {
  const a = t && e.percent >= 50;
  return /* @__PURE__ */ l.jsxs("div", { className: `option-card ${a ? "recommended" : ""}`, style: { marginBottom: "var(--sp-3)" }, children: [
    a ? /* @__PURE__ */ l.jsx("div", { className: "option-rank-badge", children: "Recommended" }) : null,
    /* @__PURE__ */ l.jsxs("div", { className: "row-between", children: [
      /* @__PURE__ */ l.jsx("strong", { className: "text-sm", children: e.name }),
      /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: 6 }, children: [
        n !== "decided" ? /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", onClick: () => r(e.id), children: "Choose this" }) : null,
        /* @__PURE__ */ l.jsx("button", { className: "icon-btn", "aria-label": "Remove", onClick: () => s(e.id), children: /* @__PURE__ */ l.jsx(C, { name: "x", cls: "icon-sm" }) })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "option-score-bar", children: [
      /* @__PURE__ */ l.jsx("div", { className: "progress-track", style: { flex: 1 }, children: /* @__PURE__ */ l.jsx("div", { className: "progress-fill", style: { width: `${e.percent}%` } }) }),
      /* @__PURE__ */ l.jsxs("span", { className: "text-xs muted", children: [
        e.percent,
        "%"
      ] })
    ] }),
    e.incomplete ? /* @__PURE__ */ l.jsx("p", { className: "text-xs muted", style: { marginBottom: "var(--sp-2)" }, children: "Some criteria aren't rated for this option yet (defaulted to neutral)." }) : null,
    /* @__PURE__ */ l.jsxs("div", { className: "pros-cons", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("div", { className: "pc-title", style: { color: "var(--accent-600)" }, children: "Pros" }),
        /* @__PURE__ */ l.jsx("ul", { children: (e.pros || []).length ? e.pros.map((i, o) => /* @__PURE__ */ l.jsx("li", { children: i }, o)) : /* @__PURE__ */ l.jsx("li", { className: "muted", children: "—" }) })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("div", { className: "pc-title", style: { color: "var(--danger-500)" }, children: "Cons" }),
        /* @__PURE__ */ l.jsx("ul", { children: (e.cons || []).length ? e.cons.map((i, o) => /* @__PURE__ */ l.jsx("li", { children: i }, o)) : /* @__PURE__ */ l.jsx("li", { className: "muted", children: "—" }) })
      ] })
    ] }),
    e.risks && e.risks.length ? /* @__PURE__ */ l.jsxs("div", { style: { marginTop: "var(--sp-2)" }, children: [
      /* @__PURE__ */ l.jsx("div", { className: "pc-title text-xs", style: { color: "var(--warning-600)" }, children: "Risks" }),
      /* @__PURE__ */ l.jsx("ul", { className: "text-xs", style: { color: "var(--text-secondary)" }, children: e.risks.map((i, o) => /* @__PURE__ */ l.jsx("li", { children: i }, o)) })
    ] }) : null
  ] });
}
function mh() {
  return /* @__PURE__ */ l.jsx("form", { id: "opt-form", children: /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
    /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Option name" }),
    /* @__PURE__ */ l.jsx("input", { className: "input", name: "name", required: !0 })
  ] }) });
}
function fh({ api: e, toast: t, decisionId: n, onSaved: r }) {
  let s = null;
  ce({
    title: "Add an option",
    bodyHtml: '<div id="opt-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opt-save">Add</button>',
    onMount: (a) => {
      s = le(a.querySelector("#opt-form-mount")), s.render(x.createElement(mh)), document.getElementById("opt-save").addEventListener("click", async () => {
        const i = document.querySelector("#opt-form [name=name]").value.trim();
        if (!i) return t("Name is required.", "error");
        await e.post(`/api/decisions/${n}/options`, { name: i }), ee(), r();
      });
    },
    onClose: () => {
      s && (s.unmount(), s = null);
    }
  });
}
function ph() {
  return /* @__PURE__ */ l.jsxs("form", { id: "crit-form", className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Criterion name" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "name", placeholder: "e.g. Cost, Risk, Convenience", required: !0 })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Weight (1-5)" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", type: "number", name: "weight", min: "1", max: "5", defaultValue: "3" })
    ] })
  ] });
}
function hh({ api: e, toast: t, decisionId: n, onSaved: r }) {
  let s = null;
  ce({
    title: "Add a criterion",
    bodyHtml: '<div id="crit-form-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="crit-save">Add</button>',
    onMount: (a) => {
      s = le(a.querySelector("#crit-form-mount")), s.render(x.createElement(ph)), document.getElementById("crit-save").addEventListener("click", async () => {
        const i = document.getElementById("crit-form"), o = Object.fromEntries(new FormData(i).entries());
        if (!o.name.trim()) return t("Name is required.", "error");
        await e.post(`/api/decisions/${n}/criteria`, { name: o.name.trim(), weight: Number(o.weight) }), ee(), r();
      });
    },
    onClose: () => {
      s && (s.unmount(), s = null);
    }
  });
}
const vh = { high: "badge-success", medium: "badge-medium", low: "badge-low" };
function gh({ ctx: e, id: t }) {
  const { api: n, toast: r, state: s } = e, { decision: a, criteria: i, options: o, scoring: c, loading: u, error: h, refetch: f } = ch(n, t), [d, g] = x.useState(!1);
  async function j(y, S) {
    await n.patch(`/api/decisions/${t}/criteria/${y}`, { weight: S }), f();
  }
  async function N(y) {
    await n.post(`/api/decisions/${t}/decide`, { optionId: y }), r("Decision recorded", "success"), f();
  }
  async function k(y) {
    await We({ title: "Remove option?", message: "Its pros, cons and ratings will be lost.", confirmLabel: "Remove" }) && (await n.del(`/api/decisions/${t}/options/${y}`), f());
  }
  async function p() {
    await We({ title: "Delete this decision?", message: "This cannot be undone.", confirmLabel: "Delete" }) && (await n.del(`/api/decisions/${t}`), r("Decision deleted", "success"), location.hash = "#/decisionflow");
  }
  async function m() {
    if (!s.aiConfigured) return r("AI is not configured on this server. Add ANTHROPIC_API_KEY to enable analysis.", "error");
    if (!o.length) return r("Add at least one option first.", "error");
    g(!0);
    try {
      const y = await n.post(`/api/decisions/${t}/analyze`, { options: o.map((S) => S.name) });
      if (!y.ok) {
        r(y.error, "error");
        return;
      }
      r("Analysis complete", "success"), f();
    } catch (y) {
      r(y.message, "error");
    } finally {
      g(!1);
    }
  }
  if (u)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading…"
    ] }) });
  if (h)
    return /* @__PURE__ */ l.jsx("div", { className: "page", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "Couldn't load this decision" }),
      /* @__PURE__ */ l.jsx("p", { children: h.message }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", style: { marginTop: "var(--sp-2)" }, onClick: f, children: "Retry" })
    ] }) });
  const v = a.status === "decided" ? c.ranked.find((y) => y.id === a.chosenOptionId) : null;
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("a", { href: "#/decisionflow", className: "text-xs muted", children: "← All decisions" }),
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", style: { marginTop: 6 }, children: a.question }),
        a.status === "decided" ? /* @__PURE__ */ l.jsxs("p", { className: "page-subtitle", children: [
          "Decided",
          v ? `: ${v.name}` : ""
        ] }) : /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Open decision" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "page-actions", children: [
        /* @__PURE__ */ l.jsxs("button", { className: "btn", disabled: d, onClick: m, children: [
          d ? /* @__PURE__ */ l.jsx("span", { className: "spinner" }) : /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
          " ",
          d ? "Analyzing…" : "Analyze with AI"
        ] }),
        /* @__PURE__ */ l.jsxs("button", { className: "btn btn-ghost", onClick: p, children: [
          /* @__PURE__ */ l.jsx(C, { name: "trash", cls: "icon-sm" }),
          " Delete"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "dash-grid", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ l.jsxs("div", { className: "card card-pad module-accent--reasoning", children: [
          /* @__PURE__ */ l.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Options" }),
            /* @__PURE__ */ l.jsxs("button", { className: "btn btn-sm", onClick: () => fh({ api: n, toast: r, decisionId: t, onSaved: f }), children: [
              /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }),
              " Add option"
            ] })
          ] }),
          /* @__PURE__ */ l.jsx("div", { className: "stack", id: "options-list", children: o.length ? c.ranked.map((y, S) => /* @__PURE__ */ l.jsx(
            dh,
            {
              scored: y,
              isTop: S === 0,
              decisionStatus: a.status,
              onDecide: N,
              onDelete: k
            },
            y.id
          )) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "Add at least two options to compare." }) })
        ] }),
        a.recommendation ? /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--brand-soft-border)" }, children: [
          /* @__PURE__ */ l.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ l.jsxs("span", { className: "card-title", children: [
              /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
              " AI reasoning"
            ] }),
            /* @__PURE__ */ l.jsxs("span", { className: `badge ${vh[a.recommendation.confidence] || "badge-low"}`, children: [
              a.recommendation.confidence,
              " confidence"
            ] })
          ] }),
          /* @__PURE__ */ l.jsx("p", { className: "text-sm", children: a.recommendation.reasoningSummary || "" }),
          a.recommendation.missingInfo && a.recommendation.missingInfo.length ? /* @__PURE__ */ l.jsxs("div", { style: { marginTop: "var(--sp-3)" }, children: [
            /* @__PURE__ */ l.jsx("strong", { className: "text-xs", children: "What would improve confidence:" }),
            /* @__PURE__ */ l.jsx("ul", { className: "stack", style: { gap: 4, marginTop: 6 }, children: a.recommendation.missingInfo.map((y, S) => /* @__PURE__ */ l.jsx("li", { className: "text-sm muted", children: y }, S)) })
          ] }) : null
        ] }) : null
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "card card-pad module-accent--reasoning", children: [
        /* @__PURE__ */ l.jsxs("div", { className: "card-header", children: [
          /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Criteria & weights" }),
          /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", onClick: () => hh({ api: n, toast: r, decisionId: t, onSaved: f }), children: /* @__PURE__ */ l.jsx(C, { name: "plus", cls: "icon-sm" }) })
        ] }),
        i.length ? i.map((y) => /* @__PURE__ */ l.jsx(uh, { criterion: y, onSetWeight: j }, y.id)) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No criteria yet — add some or use AI analysis." }),
        /* @__PURE__ */ l.jsx("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: "Weights are yours to set. Scoring math is always computed locally, never guessed by AI." })
      ] })
    ] })
  ] });
}
function yh({ ctx: e }) {
  const t = e.params && e.params[0];
  return t ? /* @__PURE__ */ l.jsx(gh, { ctx: e, id: Number(t) }) : /* @__PURE__ */ l.jsx(oh, { ctx: e });
}
const xh = [
  "Organize my week",
  "What needs my attention today?",
  "I have too much going on, help me prioritize",
  "What can I change to save money this month?"
];
function jh({ api: e, toast: t }) {
  const [n, r] = x.useState(null), [s, a] = x.useState(""), [i, o] = x.useState(!1), c = x.useRef(null);
  x.useEffect(() => {
    let f = !1;
    return e.get("/api/ai/chat/history").then(({ messages: d }) => {
      f || r(d);
    }).catch((d) => {
      f || (r([]), t(d.message || "Could not load your conversation history.", "error"));
    }), () => {
      f = !0;
    };
  }, [e, t]), x.useEffect(() => {
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
    f.preventDefault(), u(s.trim());
  }
  return /* @__PURE__ */ l.jsx("div", { className: "card card-pad", children: /* @__PURE__ */ l.jsxs("div", { className: "assistant-shell", children: [
    /* @__PURE__ */ l.jsx("div", { className: "assistant-messages", ref: c, "aria-live": "polite", "aria-relevant": "additions", children: n === null ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Loading conversation…"
    ] }) : n.length === 0 && !i ? /* @__PURE__ */ l.jsxs("div", { className: "assistant-empty", children: [
      /* @__PURE__ */ l.jsx(C, { name: "assistant", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { style: { marginTop: "var(--sp-2)" }, children: "How can I help with your week?" }),
      /* @__PURE__ */ l.jsx("div", { className: "assistant-prompt-grid", children: xh.map((f) => /* @__PURE__ */ l.jsx("button", { className: "assistant-prompt-chip", onClick: () => u(f), children: f }, f)) })
    ] }) : /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
      n.map((f, d) => /* @__PURE__ */ l.jsxs("div", { className: `assistant-msg ${f.role}`, children: [
        /* @__PURE__ */ l.jsx("div", { className: "bubble", children: f.content }),
        f.suggestions && f.suggestions.length ? /* @__PURE__ */ l.jsx("div", { className: "assistant-suggestions", children: f.suggestions.map((g) => /* @__PURE__ */ l.jsx("button", { className: "pill", disabled: i, onClick: () => u(g), children: g }, g)) }) : null
      ] }, d)),
      i ? /* @__PURE__ */ l.jsx("div", { className: "assistant-msg assistant", children: /* @__PURE__ */ l.jsxs("div", { className: "bubble", children: [
        /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
        " Thinking…"
      ] }) }) : null
    ] }) }),
    /* @__PURE__ */ l.jsxs("form", { className: "chat-input-row", onSubmit: h, children: [
      /* @__PURE__ */ l.jsx(
        "input",
        {
          className: "input",
          "aria-label": "Message the assistant",
          placeholder: "Ask LifeAdmin anything about your week…",
          style: { flex: 1 },
          autoComplete: "off",
          value: s,
          disabled: i,
          onChange: (f) => a(f.target.value)
        }
      ),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary btn-icon", type: "submit", "aria-label": "Send", disabled: i, children: /* @__PURE__ */ l.jsx(C, { name: "send", cls: "icon-sm" }) })
    ] })
  ] }) });
}
function Nh({ ctx: e }) {
  const { api: t, toast: n } = e, [r, s] = x.useState(""), [a, i] = x.useState(!1), [o, c] = x.useState(null), [u, h] = x.useState(!1), [f, d] = x.useState(!1);
  async function g(N) {
    N.preventDefault();
    const k = r.trim();
    if (!(!k || a)) {
      i(!0), c(null), d(!1);
      try {
        const p = await t.post("/api/ai/plan", { text: k });
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
    const k = await t.post("/api/ai/plan/apply", { preview: N });
    n(`Added ${k.created} tasks to your schedule`, "success"), d(!0), h(!1);
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Describe your week in your own words. LifeAdmin protects sleep, meals and rest automatically — it won't schedule every free minute." }),
    /* @__PURE__ */ l.jsxs("form", { className: "stack", onSubmit: g, children: [
      /* @__PURE__ */ l.jsx(
        "textarea",
        {
          className: "textarea",
          "aria-label": "Describe your week",
          rows: 4,
          placeholder: "From Monday until Friday I want to study JavaScript. I'm free 8-10 in the morning, then I work until 18:00. After work I need an hour to rest and eat, but I still want to study another hour.",
          value: r,
          disabled: a,
          onChange: (N) => s(N.target.value)
        }
      ),
      /* @__PURE__ */ l.jsxs("button", { type: "submit", className: "btn btn-primary", style: { alignSelf: "flex-start" }, disabled: a, children: [
        /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
        " Build my plan"
      ] })
    ] }),
    /* @__PURE__ */ l.jsx("div", { style: { marginTop: "var(--sp-5)" }, children: a ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Reasoning about your week — protecting sleep, meals and rest…"
    ] }) : o != null && o.error ? /* @__PURE__ */ l.jsx("p", { className: "field-error", children: o.error }) : o ? /* @__PURE__ */ l.jsx(wh, { plan: o.plan, preview: o.preview, applying: u, applied: f, onApply: j }) : null })
  ] });
}
function wh({ plan: e, preview: t, applying: n, applied: r, onApply: s }) {
  const a = Object.keys(t).sort();
  return a.length ? /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsx("div", { className: "section-title", children: "Reasoning" }),
    /* @__PURE__ */ l.jsx("ul", { className: "stack", style: { gap: 4, marginBottom: "var(--sp-5)" }, children: (e.notes || []).length ? e.notes.map((i, o) => /* @__PURE__ */ l.jsx("li", { className: "text-sm muted", children: i }, o)) : /* @__PURE__ */ l.jsx("li", { className: "muted text-sm", children: "—" }) }),
    /* @__PURE__ */ l.jsx("div", { className: "section-title", children: "Proposed schedule" }),
    a.map((i) => /* @__PURE__ */ l.jsxs("div", { className: "plan-preview-day", children: [
      /* @__PURE__ */ l.jsx("strong", { className: "text-sm", children: Pu(i) }),
      t[i].placed.length ? t[i].placed.map((o, c) => /* @__PURE__ */ l.jsxs("div", { className: "plan-block", children: [
        /* @__PURE__ */ l.jsxs("span", { className: "plan-block-time", children: [
          o.start,
          "–",
          o.end
        ] }),
        /* @__PURE__ */ l.jsx("span", { children: o.label })
      ] }, c)) : /* @__PURE__ */ l.jsx("p", { className: "muted text-xs", children: "Nothing placed." }),
      t[i].warnings.map((o, c) => /* @__PURE__ */ l.jsxs("p", { className: "text-xs", style: { color: "var(--warning-600)" }, children: [
        /* @__PURE__ */ l.jsx(C, { name: "alert", cls: "icon-sm" }),
        " ",
        o
      ] }, c))
    ] }, i)),
    /* @__PURE__ */ l.jsxs("button", { className: "btn btn-primary", style: { marginTop: "var(--sp-3)" }, disabled: n || r, onClick: s, children: [
      n ? /* @__PURE__ */ l.jsx("span", { className: "spinner" }) : /* @__PURE__ */ l.jsx(C, { name: "check", cls: "icon-sm" }),
      " ",
      n ? "Adding…" : r ? "Added to your tasks" : "Add these to my tasks"
    ] })
  ] }) : /* @__PURE__ */ l.jsx("p", { className: "muted text-sm", children: "No schedulable activities were found in that description. Try mentioning specific things you want time for." });
}
function kh({ api: e }) {
  const [t, n] = x.useState({ loading: !0 });
  if (x.useEffect(() => {
    e.post("/api/ai/weekly-review", {}).then((s) => {
      s.ok ? n({ data: s.data }) : n({ error: s.error });
    }).catch((s) => n({ error: s.message }));
  }, [e]), t.loading)
    return /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
      /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
      " Reviewing your week…"
    ] });
  if (t.error) return /* @__PURE__ */ l.jsx("p", { className: "field-error", children: t.error });
  const r = t.data;
  return /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsx("h3", { style: { marginBottom: "var(--sp-3)" }, children: r.headline }),
    r.highlights.length ? /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
      /* @__PURE__ */ l.jsx("div", { className: "section-title", children: "Highlights" }),
      /* @__PURE__ */ l.jsx("ul", { className: "stack", style: { gap: 4, marginBottom: "var(--sp-4)" }, children: r.highlights.map((s, a) => /* @__PURE__ */ l.jsx("li", { className: "text-sm", children: s }, a)) })
    ] }) : null,
    r.forgettingChecklist.length ? /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
      /* @__PURE__ */ l.jsx("div", { className: "section-title", children: "Things you might be forgetting" }),
      /* @__PURE__ */ l.jsx("ul", { className: "stack", style: { gap: 4 }, children: r.forgettingChecklist.map((s, a) => /* @__PURE__ */ l.jsx("li", { className: "text-sm muted", children: s }, a)) })
    ] }) : null
  ] });
}
function Sh({ api: e, toast: t, aiConfigured: n }) {
  if (!n) return t("AI is not configured on this server.", "error");
  let r = null;
  ce({
    title: "Weekly review",
    bodyHtml: '<div id="weekly-review-mount"></div>',
    onMount: (s) => {
      r = le(s.querySelector("#weekly-review-mount")), r.render(x.createElement(kh, { api: e }));
    },
    onClose: () => {
      r && (r.unmount(), r = null);
    }
  });
}
const Tt = [
  ["chat", "Chat"],
  ["plan", "Plan my week"]
];
let go = "chat";
function Ch({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(go);
  function i(c) {
    go = c, a(c);
  }
  function o(c) {
    var d;
    const u = Tt.findIndex(([g]) => g === s);
    let h = null;
    if (c.key === "ArrowRight" ? h = (u + 1) % Tt.length : c.key === "ArrowLeft" ? h = (u - 1 + Tt.length) % Tt.length : c.key === "Home" ? h = 0 : c.key === "End" && (h = Tt.length - 1), h === null) return;
    c.preventDefault();
    const f = Tt[h][0];
    i(f), (d = document.getElementById(`assistant-tab-${f}`)) == null || d.focus();
  }
  return r.aiConfigured ? /* @__PURE__ */ l.jsxs("div", { className: "page assistant-page-flex", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "page-header", children: [
      /* @__PURE__ */ l.jsxs("div", { children: [
        /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Assistant" }),
        /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Ask about your week, priorities, bills, or your circle — grounded only in your real data." })
      ] }),
      /* @__PURE__ */ l.jsx("div", { className: "page-actions", children: /* @__PURE__ */ l.jsxs("button", { className: "btn", onClick: () => Sh({ api: t, toast: n, aiConfigured: r.aiConfigured }), children: [
        /* @__PURE__ */ l.jsx(C, { name: "sparkle", cls: "icon-sm" }),
        " Weekly review"
      ] }) })
    ] }),
    /* @__PURE__ */ l.jsx("div", { className: "tabs", style: { marginBottom: "var(--sp-5)" }, role: "tablist", "aria-label": "Assistant views", onKeyDown: o, children: Tt.map(([c, u]) => /* @__PURE__ */ l.jsx(
      "div",
      {
        id: `assistant-tab-${c}`,
        className: `tab ${s === c ? "active" : ""}`,
        role: "tab",
        "aria-selected": s === c,
        "aria-controls": `assistant-panel-${c}`,
        tabIndex: s === c ? 0 : -1,
        onClick: () => i(c),
        children: u
      },
      c
    )) }),
    /* @__PURE__ */ l.jsx(
      "div",
      {
        id: `assistant-panel-${s}`,
        className: "assistant-tabpanel-fill",
        role: "tabpanel",
        "aria-labelledby": `assistant-tab-${s}`,
        tabIndex: 0,
        children: s === "chat" ? /* @__PURE__ */ l.jsx(jh, { api: t, toast: n }) : /* @__PURE__ */ l.jsx(Nh, { ctx: e })
      }
    )
  ] }) : /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsx("div", { className: "page-header", children: /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Assistant" }),
      /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Your AI-powered life copilot." })
    ] }) }),
    /* @__PURE__ */ l.jsx("div", { className: "card", children: /* @__PURE__ */ l.jsxs("div", { className: "empty-state", children: [
      /* @__PURE__ */ l.jsx(C, { name: "assistant", cls: "icon-lg" }),
      /* @__PURE__ */ l.jsx("h3", { children: "AI is not configured" }),
      /* @__PURE__ */ l.jsx("p", { children: "The assistant, natural-language planner, DecisionFlow analysis, and insights all need an ANTHROPIC_API_KEY set on the server. The rest of LifeAdmin works fully without it." })
    ] }) })
  ] });
}
function Eh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(!1);
  async function i(o) {
    if (o.preventDefault(), s) return;
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
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Profile" }) }),
    /* @__PURE__ */ l.jsxs("form", { className: "stack", style: { maxWidth: 360 }, onSubmit: i, children: [
      /* @__PURE__ */ l.jsxs("div", { className: "grid-2", children: [
        /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "First name" }),
          /* @__PURE__ */ l.jsx("input", { className: "input", name: "firstName", defaultValue: r.user.firstName, disabled: s })
        ] }),
        /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Last name" }),
          /* @__PURE__ */ l.jsx("input", { className: "input", name: "lastName", defaultValue: r.user.lastName, disabled: s })
        ] })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Email" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", value: r.user.email, disabled: !0, readOnly: !0 }),
        /* @__PURE__ */ l.jsx("span", { className: "field-hint", children: r.user.emailVerified ? "Verified" : "Not verified" })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Phone" }),
        /* @__PURE__ */ l.jsx("input", { className: "input", value: r.user.phone, disabled: !0, readOnly: !0 }),
        /* @__PURE__ */ l.jsx("span", { className: "field-hint", children: r.user.phoneVerified ? "Verified" : "Not verified" })
      ] }),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", type: "submit", style: { alignSelf: "flex-start" }, disabled: s, children: "Save changes" })
    ] })
  ] });
}
function Th({ api: e, channel: t }) {
  const [n, r] = x.useState({ loading: !0 });
  return x.useEffect(() => {
    e.post(`/api/auth/verify/${t}/request`, {}).then((s) => r({ message: s.message, demoCode: s.demoCode })).catch((s) => r({ error: s.message }));
  }, [e, t]), n.loading ? /* @__PURE__ */ l.jsxs("div", { className: "loading-line", children: [
    /* @__PURE__ */ l.jsx("span", { className: "spinner" }),
    " Requesting code…"
  ] }) : n.error ? /* @__PURE__ */ l.jsx("p", { className: "field-error", children: n.error }) : /* @__PURE__ */ l.jsxs(l.Fragment, { children: [
    /* @__PURE__ */ l.jsxs("div", { style: { background: "var(--bg-sunken)", borderRadius: "var(--radius-md)", padding: "var(--sp-3)", marginBottom: "var(--sp-4)" }, children: [
      /* @__PURE__ */ l.jsx("p", { className: "text-xs muted", style: { marginBottom: 4 }, children: n.message }),
      /* @__PURE__ */ l.jsxs("p", { className: "text-sm", children: [
        "Demo code: ",
        /* @__PURE__ */ l.jsx("strong", { style: { letterSpacing: "0.1em", fontSize: "var(--fs-md)" }, children: n.demoCode })
      ] })
    ] }),
    /* @__PURE__ */ l.jsx("form", { id: "verify-form", className: "stack", children: /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Enter the code" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", name: "code", maxLength: 6, required: !0 })
    ] }) })
  ] });
}
function bh({ api: e, toast: t, state: n, channel: r, onVerified: s }) {
  let a = null;
  ce({
    title: `Verify your ${r}`,
    bodyHtml: '<div id="verify-modal-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="verify-confirm-btn">Confirm</button>',
    onMount: (i) => {
      a = le(i.querySelector("#verify-modal-mount")), a.render(x.createElement(Th, { api: e, channel: r })), document.getElementById("verify-confirm-btn").addEventListener("click", async () => {
        const o = document.querySelector("#verify-form [name=code]");
        if (!o) return;
        const c = o.value.trim();
        if (!c) return t("Enter the code.", "error");
        const u = document.getElementById("verify-confirm-btn");
        u.disabled = !0;
        try {
          const h = await e.post(`/api/auth/verify/${r}/confirm`, { code: c });
          n.user = h.user, t(`${r} verified`, "success"), ee(), s();
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
function _h({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(!1), [, i] = x.useState(0);
  async function o(u) {
    if (u.preventDefault(), s) return;
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
    bh({ api: t, toast: n, state: r, channel: u, onVerified: () => i((h) => h + 1) });
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Change password" }) }),
      /* @__PURE__ */ l.jsxs("form", { className: "stack", style: { maxWidth: 340 }, onSubmit: o, children: [
        /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Current password" }),
          /* @__PURE__ */ l.jsx("input", { className: "input", type: "password", name: "currentPassword", required: !0, disabled: s })
        ] }),
        /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
          /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "New password" }),
          /* @__PURE__ */ l.jsx("input", { className: "input", type: "password", name: "newPassword", required: !0, disabled: s })
        ] }),
        /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", type: "submit", style: { alignSelf: "flex-start" }, disabled: s, children: "Update password" })
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Verification" }) }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Real SMS/email delivery requires an external provider — this is not configured in the local demo. You can still test the verification flow: a code is generated and shown to you directly (demo mode)." }),
      /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: "var(--sp-4)" }, children: [
        /* @__PURE__ */ l.jsx(yo, { channel: "phone", verified: r.user.phoneVerified, onVerify: c }),
        /* @__PURE__ */ l.jsx(yo, { channel: "email", verified: r.user.emailVerified, onVerify: c })
      ] })
    ] })
  ] });
}
function yo({ channel: e, verified: t, onVerify: n }) {
  return /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
    /* @__PURE__ */ l.jsxs("span", { className: `badge ${t ? "badge-success" : "badge-neutral"}`, children: [
      e,
      " ",
      t ? "verified" : "unverified"
    ] }),
    t ? null : /* @__PURE__ */ l.jsx("button", { className: "btn btn-sm", onClick: () => n(e), children: "Verify now" })
  ] });
}
const Mh = "/js/push.js", Lh = () => import(
  /* @vite-ignore */
  Mh
), Dh = {
  install: "On an iPhone or iPad, notifications work only for an app on the Home Screen. Open the Share menu in Safari, choose “Add to Home Screen”, then open LifeAdmin from there and come back to this page.",
  unsupported: "This browser cannot receive notifications. Try Chrome, Firefox, Edge or Safari, up to date.",
  blocked: "Notifications from LifeAdmin are blocked in this browser. Allow them in the browser’s site settings (the icon next to the address), then reload this page.",
  server: "Notifications are not set up on this server yet."
};
function Ih({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(null), [i, o] = x.useState(null), [c, u] = x.useState(!1);
  if (x.useEffect(() => {
    let p = !0;
    return Lh().then(async (m) => {
      const v = await m.status(t);
      p && (a(m), o(v));
    }).catch(() => p && o({ configured: !1, thisDevice: !1, devices: 0, failed: !0 })), () => {
      p = !1;
    };
  }, [t]), !s || !i)
    return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Notifications on this device" }) }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", children: i && i.failed ? "Could not check this device. Reload the page to try again." : "Checking this device…" })
    ] });
  const h = s.obstacle(i), f = !h && i.thisDevice && Notification.permission === "granted", d = i.devices - (i.thisDevice ? 1 : 0);
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
    const p = await s.enable(t, i.publicKey, r.user.id);
    p.ok ? (o({ ...i, thisDevice: p.thisDevice, devices: p.devices }), n("Notifications are on for this device", "success")) : (o({ ...i }), n(p.permission === "denied" ? "Notifications were blocked for this site" : "Notifications were not allowed", "error"));
  }, "Could not turn notifications on"), N = () => g(async () => {
    const p = await s.disable(t);
    o({ ...i, thisDevice: p.thisDevice, devices: p.devices }), n("Notifications are off for this device", "success");
  }, "Could not turn notifications off"), k = () => g(async () => {
    (await s.test(t)).ok ? n("Sent. It should appear in a few seconds.", "success") : (n("This device could not be reached. Turn notifications off and on again.", "error"), o(await s.status(t)));
  }, "Could not send the test");
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "card-header", children: [
      /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Notifications on this device" }),
      /* @__PURE__ */ l.jsx("span", { className: "text-sm muted", children: f ? "On" : "Off" })
    ] }),
    /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Get reminders and your circle’s activity on this phone or computer, even when LifeAdmin is closed. A notification never shows the content of a task, a bill or a message: you see it after you open the app." }),
    h ? /* @__PURE__ */ l.jsx("p", { className: "text-sm", role: "status", children: Dh[h] }) : f ? /* @__PURE__ */ l.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-secondary", onClick: k, disabled: c, children: "Send a test notification" }),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-ghost", onClick: N, disabled: c, children: "Turn off on this device" })
    ] }) : /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", onClick: j, disabled: c, children: "Turn on notifications" }),
    d > 0 && /* @__PURE__ */ l.jsxs("p", { className: "text-sm muted", style: { marginTop: "var(--sp-3)" }, children: [
      f ? "Also on" : "On for",
      " ",
      d,
      " other device",
      d === 1 ? "" : "s",
      " of yours. Each device is turned on and off on its own."
    ] })
  ] });
}
const Ph = { 0: "On the day", 60: "1 hour before", 300: "5 hours before", 720: "12 hours before", 1440: "1 day before", 4320: "3 days before", 7200: "5 days before", 10080: "1 week before" }, $h = [
  ["taskTimed", "Tasks with a time"],
  ["taskDate", "Tasks with a date only"],
  ["bill", "Bills"],
  ["milestone", "Steps of a goal"],
  ["goal", "Goals without dated steps"]
];
function Ah() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}
function Rh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(null);
  if (x.useEffect(() => {
    let u = !0;
    return t.get("/api/settings/reminders").then((h) => u && a(h.reminders)).catch(() => {
    }), () => {
      u = !1;
    };
  }, [t]), !s) return null;
  async function i(u) {
    try {
      const { reminders: h } = await t.patch("/api/settings/reminders", u);
      a(h), r.user.timezone = h.timezone, n("Saved", "success");
    } catch (h) {
      n(h && h.message || "Could not save", "error");
    }
  }
  const o = Ah(), c = s.timezone || s.effectiveTimezone;
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "When to remind me" }) }),
    /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Reminders arrive around the chosen time, usually within a quarter of an hour. These apply to everything that has no choice of its own." }),
    /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", htmlFor: "reminder-zone", children: "Time zone" }),
        /* @__PURE__ */ l.jsxs("select", { id: "reminder-zone", className: "input", value: c, onChange: (u) => i({ timezone: u.target.value }), children: [
          !o.includes(c) && /* @__PURE__ */ l.jsx("option", { value: c, children: c }),
          o.map((u) => /* @__PURE__ */ l.jsx("option", { value: u, children: u.replace(/_/g, " ") }, u))
        ] })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", htmlFor: "reminder-time", children: "For a date without a time, remind me at" }),
        /* @__PURE__ */ l.jsx("input", { id: "reminder-time", className: "input", type: "time", value: s.defaults.dateOnlyTime, onChange: (u) => u.target.value && i({ defaults: { dateOnlyTime: u.target.value } }) })
      ] }),
      /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsxs("label", { className: "checkbox-row", children: [
          /* @__PURE__ */ l.jsx("input", { type: "checkbox", checked: s.defaults.quietOn, onChange: (u) => i({ defaults: { quietOn: u.target.checked } }) }),
          "Quiet hours: hold reminders back at night"
        ] }),
        s.defaults.quietOn ? /* @__PURE__ */ l.jsxs("div", { style: { display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap", marginTop: "var(--sp-2)" }, children: [
          /* @__PURE__ */ l.jsx("label", { className: "text-sm muted", htmlFor: "quiet-start", children: "From" }),
          /* @__PURE__ */ l.jsx("input", { id: "quiet-start", className: "input", style: { width: "auto" }, type: "time", value: s.defaults.quietStart, onChange: (u) => u.target.value && i({ defaults: { quietStart: u.target.value } }) }),
          /* @__PURE__ */ l.jsx("label", { className: "text-sm muted", htmlFor: "quiet-end", children: "until" }),
          /* @__PURE__ */ l.jsx("input", { id: "quiet-end", className: "input", style: { width: "auto" }, type: "time", value: s.defaults.quietEnd, onChange: (u) => u.target.value && i({ defaults: { quietEnd: u.target.value } }) })
        ] }) : null,
        /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginTop: "var(--sp-1)" }, children: "A reminder that falls in these hours arrives when they end; none is lost. Messages and activity in your circles are not held back." })
      ] }),
      $h.map(([u, h]) => /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
        /* @__PURE__ */ l.jsx("label", { className: "field-label", htmlFor: `reminder-${u}`, children: h }),
        /* @__PURE__ */ l.jsxs(
          "select",
          {
            id: `reminder-${u}`,
            className: "input",
            value: s.defaults[u] === null ? "none" : String(s.defaults[u]),
            onChange: (f) => i({ defaults: { [u]: f.target.value === "none" ? null : Number(f.target.value) } }),
            children: [
              /* @__PURE__ */ l.jsx("option", { value: "none", children: "No reminder" }),
              s.offsets.map((f) => /* @__PURE__ */ l.jsx("option", { value: f, children: u === "taskTimed" && f === 0 ? "At the time" : Ph[f] }, f))
            ]
          }
        )
      ] }, u))
    ] })
  ] });
}
const Oh = [
  ["task", "Task reminders & deadlines"],
  ["comment", "Comments on shared items"],
  ["chat", "Circle chat messages"],
  ["bill", "Bill due dates"]
];
function zh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(() => r.user.notifPrefs || {});
  async function i(o, c) {
    const u = { ...s, [o]: c };
    a(u), await t.patch("/api/settings/preferences", { notifPrefs: u }), r.user.notifPrefs = u, n("Preferences saved", "success");
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ l.jsx(Ih, { ctx: e }),
    /* @__PURE__ */ l.jsx(Rh, { ctx: e }),
    /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Notification preferences" }) }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Controls which in-app notifications (the bell icon) you receive. Turning one off stops that notification from being created for you." }),
      /* @__PURE__ */ l.jsx("div", { className: "stack", children: Oh.map(([o, c]) => /* @__PURE__ */ l.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ l.jsx(
          "input",
          {
            type: "checkbox",
            checked: s[o] !== !1,
            onChange: (u) => i(o, u.target.checked)
          }
        ),
        c
      ] }, o)) })
    ] })
  ] });
}
function Fh(e) {
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
const Bh = ["system", "light", "dark"];
function Uh({ ctx: e }) {
  const { api: t, state: n } = e, [r, s] = x.useState(n.user.theme);
  async function a(i) {
    const { user: o } = await t.patch("/api/settings/preferences", { theme: i });
    n.user = o, Fh(i), s(i);
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Appearance" }) }),
    /* @__PURE__ */ l.jsx("div", { className: "row", style: { gap: "var(--sp-2)" }, children: Bh.map((i) => /* @__PURE__ */ l.jsx(
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
function Vh({ ctx: e }) {
  const { api: t, toast: n, state: r } = e, [s, a] = x.useState(r.user.aiEnabled);
  async function i(o) {
    a(o);
    const { user: c } = await t.patch("/api/settings/preferences", { aiEnabled: o });
    r.user = c, n("Preference saved", "success");
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "AI preferences" }) }),
    /* @__PURE__ */ l.jsxs("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: [
      "Server status: ",
      /* @__PURE__ */ l.jsx("strong", { children: r.aiConfigured ? "AI enabled" : "AI not configured (needs ANTHROPIC_API_KEY)" })
    ] }),
    /* @__PURE__ */ l.jsxs("label", { className: "checkbox-row", children: [
      /* @__PURE__ */ l.jsx("input", { type: "checkbox", checked: s, onChange: (o) => i(o.target.checked) }),
      " Use AI features (assistant, DecisionFlow analysis, planning, insights)"
    ] }),
    /* @__PURE__ */ l.jsx("p", { className: "text-xs muted", style: { marginTop: "var(--sp-3)" }, children: "LifeAdmin only sends the minimum context needed for each request — never your whole database — to control cost and protect privacy." })
  ] });
}
function Hh() {
  return /* @__PURE__ */ l.jsxs("form", { id: "delete-account-form", className: "stack", children: [
    /* @__PURE__ */ l.jsx("p", { className: "text-sm", style: { color: "var(--text-secondary)" }, children: "This permanently deletes your account and everything you own. This cannot be undone." }),
    /* @__PURE__ */ l.jsxs("div", { className: "field", children: [
      /* @__PURE__ */ l.jsx("label", { className: "field-label", children: "Enter your password to confirm" }),
      /* @__PURE__ */ l.jsx("input", { className: "input", type: "password", name: "password", required: !0, autoFocus: !0 })
    ] })
  ] });
}
function Wh({ api: e, toast: t }) {
  let n = null;
  ce({
    title: "Delete your account?",
    bodyHtml: '<div id="delete-account-mount"></div>',
    footerHtml: '<button class="btn" data-close>Cancel</button><button class="btn btn-danger" id="delete-account-confirm-btn">Delete everything</button>',
    onMount: (r) => {
      n = le(r.querySelector("#delete-account-mount")), n.render(x.createElement(Hh)), document.getElementById("delete-account-confirm-btn").addEventListener("click", async () => {
        const s = document.querySelector("#delete-account-form [name=password]"), a = s.value;
        if (!a) return t("Enter your password.", "error");
        const i = document.getElementById("delete-account-confirm-btn");
        i.disabled = !0;
        try {
          await e.del("/api/settings/account", { password: a }), location.reload();
        } catch (o) {
          t(o.message, "error"), i.disabled = !1, s.value = "", s.focus();
        }
      });
    },
    onClose: () => {
      n && (n.unmount(), n = null);
    }
  });
}
function Qh({ ctx: e }) {
  const { api: t, toast: n } = e;
  async function r() {
    const a = await (await fetch("/api/settings/export")).blob(), i = URL.createObjectURL(a), o = document.createElement("a");
    o.href = i, o.download = "lifeadmin-export.json", o.click(), URL.revokeObjectURL(i);
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "stack", children: [
    /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Export your data" }) }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Download everything you own as a JSON file." }),
      /* @__PURE__ */ l.jsxs("button", { className: "btn", onClick: r, children: [
        /* @__PURE__ */ l.jsx(C, { name: "download", cls: "icon-sm" }),
        " Export as JSON"
      ] })
    ] }),
    /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", style: { borderColor: "var(--danger-400)" }, children: [
      /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", style: { color: "var(--danger-500)" }, children: "Delete account" }) }),
      /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Permanently deletes your account and all associated data on this machine. This cannot be undone." }),
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-danger", onClick: () => Wh({ api: t, toast: n }), children: "Delete my account" })
    ] })
  ] });
}
function qh({ ctx: e }) {
  const { api: t, toast: n } = e;
  async function r() {
    await t.post("/api/demo/seed"), n("Demo data loaded — check the Dashboard", "success");
  }
  async function s() {
    await t.post("/api/demo/clear"), n("Demo-tagged tasks and bills cleared", "success");
  }
  return /* @__PURE__ */ l.jsxs("div", { className: "card card-pad", children: [
    /* @__PURE__ */ l.jsx("div", { className: "card-header", children: /* @__PURE__ */ l.jsx("span", { className: "card-title", children: "Demo mode" }) }),
    /* @__PURE__ */ l.jsx("p", { className: "text-sm muted", style: { marginBottom: "var(--sp-3)" }, children: "Load sample tasks, bills, a circle, decisions, goals and eco logs to explore LifeAdmin quickly. You can clear demo-tagged tasks/bills at any time." }),
    /* @__PURE__ */ l.jsxs("div", { className: "row", style: { gap: "var(--sp-2)" }, children: [
      /* @__PURE__ */ l.jsx("button", { className: "btn btn-primary", onClick: r, children: "Load demo data" }),
      /* @__PURE__ */ l.jsx("button", { className: "btn", onClick: s, children: "Clear demo data" })
    ] })
  ] });
}
const bt = [
  ["profile", "Profile", "family"],
  ["security", "Security", "settings"],
  ["notifications", "Notifications", "bell"],
  ["appearance", "Appearance", "sun"],
  ["ai", "AI preferences", "sparkle"],
  ["data", "Data", "download"],
  ["demo", "Demo mode", "star"]
];
let xo = "profile";
function Yh({ ctx: e }) {
  const [t, n] = x.useState(xo);
  function r(i) {
    xo = i, n(i);
  }
  function s(i) {
    var h;
    const o = bt.findIndex(([f]) => f === t);
    let c = null;
    if (i.key === "ArrowDown" ? c = (o + 1) % bt.length : i.key === "ArrowUp" ? c = (o - 1 + bt.length) % bt.length : i.key === "Home" ? c = 0 : i.key === "End" && (c = bt.length - 1), c === null) return;
    i.preventDefault();
    const u = bt[c][0];
    r(u), (h = document.getElementById(`settings-tab-${u}`)) == null || h.focus();
  }
  const a = {
    profile: Eh,
    security: _h,
    notifications: zh,
    appearance: Uh,
    ai: Vh,
    data: Qh,
    demo: qh
  }[t];
  return /* @__PURE__ */ l.jsxs("div", { className: "page", children: [
    /* @__PURE__ */ l.jsx("div", { className: "page-header", children: /* @__PURE__ */ l.jsxs("div", { children: [
      /* @__PURE__ */ l.jsx("h1", { className: "page-title", children: "Settings" }),
      /* @__PURE__ */ l.jsx("p", { className: "page-subtitle", children: "Manage your profile, security, and preferences." })
    ] }) }),
    /* @__PURE__ */ l.jsxs("div", { className: "settings-layout", children: [
      /* @__PURE__ */ l.jsx("nav", { className: "settings-nav", role: "tablist", "aria-label": "Settings sections", "aria-orientation": "vertical", onKeyDown: s, children: bt.map(([i, o, c]) => /* @__PURE__ */ l.jsxs(
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
            /* @__PURE__ */ l.jsx("span", { className: "settings-nav-icon", children: /* @__PURE__ */ l.jsx(C, { name: c, cls: "icon-sm" }) }),
            /* @__PURE__ */ l.jsx("span", { children: o })
          ]
        },
        i
      )) }),
      /* @__PURE__ */ l.jsx("div", { id: `settings-panel-${t}`, role: "tabpanel", "aria-labelledby": `settings-tab-${t}`, tabIndex: 0, children: /* @__PURE__ */ l.jsx(a, { ctx: e }) })
    ] })
  ] });
}
function Qe(e) {
  let t = null;
  return {
    mount(n, r) {
      t = le(n), t.render(x.createElement(e, { ctx: r }));
    },
    unmount() {
      t && (t.unmount(), t = null);
    }
  };
}
const Fu = Qe(Of), Kh = Fu.mount, Gh = Fu.unmount, Bu = Qe(lp), Zh = Bu.mount, Xh = Bu.unmount, Uu = Qe(Sp), Jh = Uu.mount, ev = Uu.unmount, Vu = Qe(Pp), tv = Vu.mount, nv = Vu.unmount, Hu = Qe(Vp), rv = Hu.mount, lv = Hu.unmount, Wu = Qe(eh), sv = Wu.mount, av = Wu.unmount, Qu = Qe(sh), iv = Qu.mount, ov = Qu.unmount, qu = Qe(yh), cv = qu.mount, uv = qu.unmount, Yu = Qe(Ch), dv = Yu.mount, mv = Yu.unmount, Ku = Qe(Yh), fv = Ku.mount, pv = Ku.unmount;
export {
  dv as mountAssistant,
  tv as mountBillsense,
  Kh as mountDashboard,
  cv as mountDecisionflow,
  sv as mountEcolife,
  Jh as mountFamily,
  rv as mountGoals,
  fv as mountSettings,
  Zh as mountTasks,
  iv as mountTimeline,
  oo as openTaskFormModal,
  mv as unmountAssistant,
  nv as unmountBillsense,
  Gh as unmountDashboard,
  uv as unmountDecisionflow,
  av as unmountEcolife,
  ev as unmountFamily,
  lv as unmountGoals,
  pv as unmountSettings,
  Xh as unmountTasks,
  ov as unmountTimeline
};
