import {typeOf} from '@iosio/utils/lib/typeOf'
import {stringifyParams, getParams} from "./utils";

//history and query-string minified = 4.11 KB
//this minified = 1.47 KB



/**
 * Simple history stand in with additional helpers
 * @returns {{goBack: (function(): void), goTo: route, replace: (function(*=, *=): void), goForward: (function(): void), push: route, listen: (function(*=): function(): void), getParams: getParams}}
 */
export const createHistory = () => {
    let h = window.history;

    const sub = Subscription();

    /**
     * gets the current location and parsed search params
     * @returns {Object}  - just pathname, search and an additional parsed search params prop
     */
    const getLoc = () => ({
        pathname: window.location.pathname,
        search: window.location.search,
        params: getParams()
    });

    /**
     * calls all subscriptions
     * @returns {undefined} - returns nothing
     */
    const notify =() => sub.notify(getLoc());

    window.addEventListener("popstate", notify);


    /**
     * if an object is passed, then stringify it, else pass the string
     * @param {Object|string} search - string or object params
     * @returns {string} - returns the stringified params
     */
    const getSearch = (search) =>
        search ? (typeOf(search) === 'object' ? stringifyParams(search) : search) : '';

    /**
     * sets the url of the browser, updating the history object and notifies the listeners
     * @param {string} path - pathname '/home'
     * @param {string|Object} params - string search or object params
     * @param {undefined| string} type - defaults to push
     * @returns {undefined} - returns nothing
     */
    const setUrl = (path, params, type = 'push') => {
        h[type + 'State'](null, null, (path || getLoc().pathname) + (getSearch(params)));
        notify();
    };

    /**
     * handles familiar arguments of type {pathname:'/', search: '?id=3'}
     * or pass the path and search in separate arguments (path,search)
     * @returns {undefined} - returns nothing
     */
    const route = function () {
        const arg1 = arguments.length <= 0 ? undefined : arguments[0];
        typeOf(arg1) === 'object'
            ? setUrl(arg1.pathname, arg1.search)
            : setUrl.apply(undefined, arguments)
    };

    return {
        getLocation: getLoc,
        goTo: route,
        push: route,
        listen: sub.subscribe,
        goBack: () => h.go(-1),
        goForward: () => h.go(1),
        replace: (path, search) => route(path, search, 'replace'),
        getParams,
    }
};



