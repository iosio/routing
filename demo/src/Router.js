import React, {useState} from 'react';
import {Router, goTo, Link} from "../../src/routing";
import {lsdb} from "@iosio/utils/lib/lsdb";

const Page = (props) => {
    return (
        <div className={'page'}>
            <h1>{props.name} </h1>
            {props.aux && props.aux()}
            <br/>
            <br/>
            props: {JSON.stringify(props, null, 4)}

        </div>
    )
};


export const RouterTest = () => {
    const [text, setText] = useState('');
    const [isAdmin, setAdmin] = useState(false);
    const [loggedIn, setLoggedIn] = useState(lsdb.get('loggedIn'));

    const go = (here) => {
        if (!here || !text) return;
        const path = here || text;
        goTo(path);
    };
    const onSubmit = (e) => {
        e.preventDefault();
        go();
        setText('');
    };

    const login = () => {
        lsdb.set('loggedIn', true);
        setLoggedIn(true);
    };
    const logout = () => {
        lsdb.set('loggedIn', false);
        setLoggedIn(false);
    };

    const LoginButton = () => (
        <button className={'btn'} onClick={login}>
            Login
        </button>
    );

    const routes = [
        {
            path: '/',
            Component: Page,
            name: 'Home Page'
        },
        {
            path: '/detail',
            Component: Page,
            name: 'Detail'
        },
        {
            path: '/authOnly',
            Component: Page,
            authOnly: true,
            name: 'Authenticated only!'
        },
        {
            path: '/restricted',
            Component: Page,
            authOnly: true,
            restricted: {canView: isAdmin},
            name: 'Admin only!'
        },
        {
            path: '/login',
            Component: Page,
            notAuth: true,
            name: 'Login Page',
            aux: () => <LoginButton/>
        }
    ];

    const renderRoutes = () => routes.map(({Component, ...rest}, i) => (
        <Component key={i} {...rest}/>
    ));

    const renderLinks = () => routes.map(({path, name}, i) => (
        <Link to={path} className={'btn'} key={i}>{name}</Link>
    ));

    return (
        <React.Fragment>
            <nav className={'nav'}>

                <div className={'flexRow'}>

                    <form onSubmit={onSubmit}>
                        <input value={text} onChange={({target}) => setText(target.value)}/>
                    </form>

                    <button className={'btn'} onClick={() => go()}> go</button>

                    <Link to={'/detail'} params={{id: 3, user: "Joe Dirt"}} render={({pathname}) => (
                        <span className={pathname === '/detail/' ? 'currPath' : null}>
                            go to detail with params
                        </span>
                    )}/>

                    {renderLinks()}


                </div>

                <div className={'flexRow'}>
                    {loggedIn &&
                    <button className={'btn'} onClick={logout}>Logout</button>
                    }
                    <button className={'btn'} onClick={() => setAdmin(!isAdmin)}>
                        is Admin: {isAdmin ? "true" : "false"}
                    </button>
                </div>

            </nav>

            <Router
                isAuthenticated={loggedIn}
                onLogoutPath={'/login'}
                onLoginPath={'/onlyAuth'}
                userChange={isAdmin}
                onUserChangePath={'/'}>

                {renderRoutes()}

            </Router>


        </React.Fragment>
    );
}