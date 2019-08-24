import {extend as t, isArray as e, isObj as a} from "@iosio/util";

const r = r => {
    let l = window, n = t => {
        if (!t) return "";
        var e = decodeURIComponent(t);
        return "false" !== e && ("true" === e || (0 * +e == 0 ? +e : e))
    }, o = t => {
        let e, a, r, o = {};
        if ((r = (t = t || l.location.search).indexOf("?")) < 0) return;
        let s = (t = t.substr(r + 1)).split("&");
        for (; e = s.shift();) void 0 !== o[a = (e = e.split("=")).shift()] ? o[a] = [].concat(o[a], n(e.shift())) : o[a] = n(e.shift());
        return o
    }, s = t => {
        var a, r, l, n = encodeURIComponent, o = "";
        for (a in t) if (void 0 !== (l = t[a])) if (e(l)) for (r = 0; r < l.length; r++) o && (o += "&"), o += n(a) + "=" + n(l[r]); else o && (o += "&"), o += n(a) + "=" + n(l);
        return "?" + o
    }, p = () => {
        let {pathname: t, search: e} = l.location;
        return {url: t + e, pathname: t, search: e, params: o()}
    }, i = p(), {url: h, pathname: c} = i, u = r(t({
        $lastUrl: h,
        $lastPathname: c,
        $lastType: "initial",
        getParams: o,
        stringifyParams: s,
        getLocation: p,
        route(t, e, r) {
            r = r || "push", t = t || location.pathname, e = e || "";
            const {pathname: n, url: o} = p();
            "replace" !== r && (h = o, c = n), ((t, e, r) => {
                e = a(e) ? s(e) : e, l.history[r + "State"](null, null, t + e)
            })(t, e, r), "replace" === r ? setTimeout(() => m({type: r})) : m({type: r})
        }
    }, i));
    u.routerSwitch = t => {
        let {root: e, pathMap: a, noMatch: r} = t, l = null,
            n = !1, {pathname: o, $lastPathname: s, $lastUrl: p, $lastType: i, url: h} = u, c = h === p;
        return r = r || "/", e ? l = a["/" + o.split("/")[1]] || a[r] : a[o] ? l = a[o] : s !== o && a[s] ?
            (u.route(p, location.search, "replace"), l = a[s], n = !0) : r && a[r] && (u.route(r, location.search, "replace"), l = a[r]), {
            next: l,
            toLast: n,
            noChange: c,
            replacedLast: "replace" === i
        }
    };
    let m = e => {
        u.$merge(t({
            $lastUrl: "popstate" === e.type ? u.url : h,
            $lastPathname: "popstate" === e.type ? u.pathname : c,
            $lastType: e.type
        }, p()))
    };
    return l.addEventListener("popstate", m), u
};
export {r as createRouting};
