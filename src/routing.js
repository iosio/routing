import React from 'react';
import {Subscription} from "@iosio/utils/lib/subscription";
import {typeOf} from '@iosio/utils/lib/typeOf';
import {getParams, stringifyParams, flattenChildren, preparePath} from "./utils";
// npm publish --access public
const ROUTERS = [];
let h = window.history;
const sub = Subscription();
const notify = () => sub.notify(getLoc());
export const subscribe = (fn) => sub.subscribe(fn);
export const unsubscribe = (fn) => sub.unsubscribe(fn);
export const goBack = () => h.go(-1);
export const goForward = () => h.go(1);

export const getLoc = () => ({
    pathname: window.location.pathname,
    search: window.location.search,
    params: getParams()
});

export const makeRoutable = (_path, _search) => {
    let path = _path || getLoc().pathname;
    let search = _search ? (typeOf(_search) === 'object' ? stringifyParams(_search) : _search) : '';
    const hasSlashAlready = path.length && (path.charAt(path.length - 1) === "/");
    const slash = hasSlashAlready ? "" : (search ? "/" : "");
    return {path, search, url: path + slash + search}
};

export const getUrl = () => makeRoutable(getLoc().pathname, getLoc().search).url;

let lastUrl = getUrl();
export const setUrl = (url, type = "push") => {
    h[type + 'State'](null, null, url || '');
    lastUrl = url;
};

const canRoute = (path) => {
    for (let i = ROUTERS.length; i--;) if (ROUTERS[i].canRoute(path)) return true;
    return false;
};

/** Tell all router instances to handle the given URL.  */
function routeTo(path) {
    for (let i = 0; i < ROUTERS.length; i++) {
        ROUTERS[i].routeTo(path)
    }
    notify();
}

const tryRoute = (_path, _params, type = 'push') => {
    const {path, url} = makeRoutable(_path, _params);
    if (url === lastUrl) return;
    if (canRoute(preparePath(path))) {
        setUrl(url);
        routeTo(path);
    }
};

/**
 * handles familiar arguments of type {pathname:'/', search: '?id=3'}
 * or pass the path and search in separate arguments ('/', {id: 3})
 * @returns {undefined} - returns nothing
 */
export const goTo = function () {
    const arg1 = arguments.length <= 0 ? undefined : arguments[0];
    typeOf(arg1) === 'object'
        ? tryRoute(arg1.pathname, arg1.search)
        : tryRoute.apply(undefined, arguments)
};

let inited = false;
const initEventListeners = () => {
    if (inited) return;
    inited = true;
    window.addEventListener("popstate", () => {
        routeTo(getLoc().pathname);
    });
};

export class Router extends React.Component {
    constructor(props) {
        super(props);
        initEventListeners();
        this.state = {CurrentRoute: null};
        this.accessible = [];
        this.excluded = [];
        this.pathMap = {};

        this.lastPath = preparePath(true);

        const hasChildren = this.getChildren().length;
        if (hasChildren > 0) {
            this.register();
            if (!this.canRoute()) {
                let p = this.getRedirectPath();
                setUrl(p, 'replace');
                this.lastPath = p;
            }
            this.state = {
                CurrentRoute: this.pathMap[this.lastPath] || null
            };

        }

        ROUTERS.push(this);
    }

    routeTo = (path) => {
        const pn = preparePath(path);
        this.setState({
            CurrentRoute: this.pathMap[pn] || null
        });
        this.lastPath = pn;
    };

    getRedirectPath = () => {
        const {noMatchRedirectTo, root} = this.props;
        //assuming we cant route to the existing base path

        let redirectTo = '/';
        //is there is a default path provided? and can we go there?
        if (noMatchRedirectTo && this.canRoute(noMatchRedirectTo)) {
            redirectTo = noMatchRedirectTo;
            // console.log('going to "noMatchRedirectTo"');
        }
        //if not see if we can go back to the last path
        //only if it doesnt match the current - to prevent infinite loops
        else if ((preparePath(true) !== this.lastPath) && this.canRoute(this.lastPath)) {
            redirectTo = this.lastPath;
            // console.log("no 'noMatchRedirectTo' prop exists. will go to last Path");
        }
        //if we cant go back to the last path
        //see if we can go back to the root if its provided
        else if (root && this.canRoute(root)) {
            // console.log("going to root");
            redirectTo = root;
        } else {
            // console.log('hoping for a "/" path ');
        }
        //if neither one of those work, lets hope they have a root "/" path set up
        //otherwise this.getMatchingComponent will return null;
        return redirectTo;
    };

    canRoute = (path) => this.accessible.includes(path || preparePath(true));

    getChildren = (children) => flattenChildren(children || this.props.children);

    register = () => {
        const {isAuthenticated} = this.props;
        this.accessible = [];
        this.excluded = [];
        this.pathMap = {};

        this.getChildren().forEach((child) => {
            const props = child ? (child.length ? child[0].props : child.props) : {};
            const {authOnly, notAuth, restricted, path} = props;
            const pathName = preparePath(path);
            let excluded = false;
            if (pathName) {
                if ((!isAuthenticated && authOnly) || (isAuthenticated && notAuth)) {
                    excluded = true;
                }
                if (restricted && !restricted.canView) {
                    excluded = true;
                }
                if (!excluded) {
                    this.accessible.push(pathName);
                    this.pathMap[pathName] = child;
                } else {
                    this.excluded.push(pathName);
                }
            }
        });
    };

    componentDidUpdate(prevProps) {
        const {isAuthenticated, onLogoutPath, onLoginPath, userChange, onUserChangePath} = this.props;

        this.register();

        if (prevProps.userChange !== userChange) {

            if (onUserChangePath) {
                setUrl(onUserChangePath, 'replace');
                this.routeTo(onUserChangePath);
                notify();
            }
        }
        if (prevProps.isAuthenticated !== isAuthenticated) {
            if (!isAuthenticated) {
                if (onLogoutPath && this.excluded.includes(preparePath(true))) {
                    setUrl(onLogoutPath, 'replace');
                    this.routeTo(onLogoutPath);
                    notify();
                }
            } else if (onLoginPath) {
                setUrl(onLoginPath);
                this.routeTo(onLoginPath);
                notify();
            }
        }
    }

    componentWillUnmount() {
        ROUTERS.splice(ROUTERS.indexOf(this), 1);
    }

    render() {
        return this.state.CurrentRoute;
    }
}

export class Link extends React.Component {
    constructor(props) {
        super(props);
        this.state = getLoc();
        this.unsubscribe = sub.subscribe((location) => {
            this.setState({...location});
        })
    }

    componentWillUnmount() {
        this.unsubscribe && this.unsubscribe();
    }

    render() {
        const {render, children, to, params, href, ...rest} = this.props;
        const place = to || href;
        return (
            <a href={place}
               onClick={(e) => {
                   if (to) {
                       if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                       if (e.stopPropagation) e.stopPropagation();
                       goTo(to, params);
                       e.preventDefault();
                   }
               }} {...rest}>
                {render ? render({...this.state}) : children}
            </a>
        )
    }
}



