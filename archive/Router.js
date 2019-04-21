import React, {cloneElement} from 'react';

export class Router extends React.Component {
    constructor(props) {
        super(props);
        this.state = {CurrentRoute: null};
        if (!props.history || !props.history.push || !props.history.listen || !props.history.replace) {
            console.error('Router requires a history object passed via history prop that includes: {push,listen,replace}');
            return;
        }
        // gather all the children to:
        // create the accessiblePaths list and excludedPaths list.
        // and create the componentPathMap
        // and so we can set the state before it mounts
        this.gatherChildren();

        this.lastPath = this.getBasePath();//we only care about "/(just this pathname)/"
        //make sure we can route to the base path and redirect if needed
        this.checkPath();
        //after the component path map is created
        //initialize the state
        this.state = {
            CurrentRoute: this.getMatchingComponent(this.lastPath)
        };
        this.unlisten = props.history.listen(({pathname}) => {
            const newBasePath = this.getBasePath(pathname);
            //skip work if not needed
            if (newBasePath !== this.lastPath) {
                this.checkPath();
                this.setRoute();
            }
        });
    }

    /**
     * we only care about the base path with this simple router
     * @param {string|undefined} path - will grab the path off of location if not provided
     * @returns {string} - returns a "/" + the first and only first value after the first slash in the pathname
     */
    getBasePath = (path) => {
        const p = path || window.location.pathname;
        return "/" + p.split('/')[1];
    };

    /**
     * gets and stores the pathname and access rights from the props of each child
     * @returns {undefined} - returns nothing
     */
    gatherChildren = () => {
        console.log('gathering children');
        const {isAuthenticated, children} = this.props;
        this.accessiblePaths = [];
        this.excludedPaths = [];
        this.componentPathMap = {};

        const gatherer = (child) => {
            const childProps = child.length ? child[0].props : child.props;

            let excluded = false;
            if (childProps.path) {

                if ((!isAuthenticated && childProps.onlyAuth) || (isAuthenticated && childProps.notAuth)) {
                    excluded = true;
                }
                if (childProps.restricted && !childProps.restricted.canView) {
                    excluded = true;
                }

                const bp = this.getBasePath(childProps.path);

                if (!excluded) {
                    this.accessiblePaths.push(bp);
                    this.componentPathMap[bp] = child;
                } else {
                    this.excludedPaths.push(bp);
                }
            }
        };

        if (children) {
            children.length
                ? children.forEach(gatherer)
                : gatherer(children)
        }
    };

    canRoute = (path) => this.accessiblePaths.includes(path || this.getBasePath());


    getRedirectPath = () => {
        //assuming we cant route to the existing base path
        let {noMatchRedirectTo, root} = this.props;

        let redirectTo = '/';
        //is there is a default path provided? and can we go there?
        if (noMatchRedirectTo && this.canRoute(noMatchRedirectTo)) {
            redirectTo = noMatchRedirectTo;
            // console.log('going to "noMatchRedirectTo"');
        }
        //if not see if we can go back to the last path
        //only if it doesnt match the current - to prevent infinite loops
        else if ((this.getBasePath() !== this.lastPath) && this.canRoute(this.lastPath)) {
            redirectTo = this.lastPath;
            // console.log("no 'noMatchRedirectTo' prop exists. will go to last Path");
        }
        //if we cant go back to the last path
        //see if we can go back to the root if its provided
        else if (root && this.canRoute(root)) {
            console.log("going to root");
            redirectTo = root;
        } else {
            // console.log('hoping for a "/" path ');
        }
        //if neither one of those work, lets hope they have a root "/" path set up
        //otherwise this.getMatchingComponent will return null;
        return redirectTo;
    };

    /**
     * if the path is a path that can be accessed
     * and if not, redirects to the last path or the root path
     * @returns {undefined} - returns nothing
     */
    checkPath = () => {
        // console.log('checking path');
        //if we hit a path that doesn't exist
        if (!this.canRoute()) {
            const tryToRedirectTo = this.getRedirectPath();
            console.log('redirect to: ', tryToRedirectTo)
            this.props.history.replace(tryToRedirectTo);
            this.lastPath = tryToRedirectTo;
        } else {
            console.log('path is valid')
            this.lastPath = this.getBasePath();
        }

    };

    // set the matching component if it exists otherwise render null
    getMatchingComponent = (pn) => this.componentPathMap[pn] || null;
    // {
    //     const comp = this.componentPathMap[pn] || null;
    //     console.log(`does path: "${pn}" have matching component?`, !!comp ? 'yes' : 'no - rendering null');
    //     return comp;
    // };

    /**
     * uses the path name to find the component to render if it exists
     * updates the CurrentRoute on state.
     * @param pathname
     */
    setRoute = (pathname) => {
        // console.log('setting the route');
        this.setState({
            CurrentRoute: this.getMatchingComponent(pathname || this.getBasePath())
        });
    };

    /**
     * when the auth state changes
     * go to a onLogin or onLogout path if specified
     * @param prevProps
     */
    componentDidUpdate(prevProps) {
        const {isAuthenticated, onLogoutPath, onLoginPath, history} = this.props;
        if (!history) return;

        this.gatherChildren();

        if (prevProps.isAuthenticated !== isAuthenticated) {
            if (!isAuthenticated) {
                if (onLogoutPath && this.excludedPaths.includes(this.getBasePath())) {
                    history.push({pathname: onLogoutPath});
                }
            } else {
                onLoginPath && history.push({pathname: onLoginPath});
            }
        }
    }

    componentWillUnmount() {
        this.unlisten && this.unlisten();
    }

    render() {
        return this.state.CurrentRoute
            ? cloneElement(this.state.CurrentRoute)
            : null;
    }
}

