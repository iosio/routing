import React, {useState} from 'react'

import {Link, Router} from "../../src";

export const makeTestApp = ({Routes, PageComponent, onLogoutPath, onLoginPath}) => {

    const renderLinks = () => Object.keys(Routes).map((key, i) => {
        const props = Routes[key];
        return (
            <Link key={i} to={props.path} id={props.name} params={props.params || ''}>
                {props.name}
            </Link>
        )
    });

    const renderRoutes = () => Object.keys(Routes).map((key, i) => {
        const props = Routes[key];
        return (
            <PageComponent key={i} {...props}/>
        )
    });

    const App = () => {
        const [hasAuth, setAuth] = useState(false);

        return (
            <React.Fragment>

                <button id={'toggleLogin'} onClick={() => setAuth(!hasAuth)}>loginBtn</button>

                {renderLinks()}

                <Router isAuthenticated={hasAuth}
                        onLogoutPath={onLogoutPath}
                        onLoginPath={onLoginPath}>

                    {renderRoutes()}

                </Router>


            </React.Fragment>
        )
    };

    return App;


};


