import React, {useState} from 'react'
import renderer from 'react-test-renderer';
import {Router, Link, goTo, getLoc, subscribe} from "../src";
import {makeRoutable, getUrl, setUrl} from "../src/routing";
import {render, fireEvent, cleanup, queryByAttribute} from 'react-testing-library';

import ReactDOM from 'react-dom';
import 'jest-dom/extend-expect'

const getById = queryByAttribute.bind(null, 'id');


describe('Routing', () => {

    it('getLoc should return the correct object', () => {

        expect(getLoc()).toMatchObject({
            pathname: '/',
            search: '',
            params: false
        })
    });

    it('makeRoutable should construct an object containing a path, stringified search as well as a combined pathname and search as url', () => {

        const expectedSearch = '?id=3&user=Joe%20Dirt';

        expect(makeRoutable('/', expectedSearch)).toMatchObject({
            path: '/',
            search: expectedSearch,
            url: '/' + expectedSearch
        });

        expect(makeRoutable('/', {id: 3, user: 'Joe Dirt'})).toMatchObject({
            path: '/',
            search: expectedSearch,
            url: '/' + expectedSearch
        });

        expect(makeRoutable('/hello', {id: 3, user: 'Joe Dirt'})).toMatchObject({
            path: '/hello',
            search: expectedSearch,
            url: '/hello/' + expectedSearch
        });

        expect(makeRoutable('/hello/', {id: 3, user: 'Joe Dirt'})).toMatchObject({
            path: '/hello/',
            search: expectedSearch,
            url: '/hello/' + expectedSearch
        });

    });

    it('setUrl should set the correct url, getUrl should return it, subscribe should pic up the changes', () => {
        setUrl('/hello');
        expect(getUrl()).toBe("/hello");

        setUrl('/hello/?id=3');
        expect(getUrl()).toBe("/hello/?id=3");
    });


});

/*

        const cb = jest.fn();

        let locObj = {};

        const unsubscribe = subscribe((location)=>{
            locObj = location;
            cb(location)
        });
        expect(cb).toHaveBeenCalledWith(locObj)
 */


const Page = (props) => {
    return (
        <div className={'page'}>
            <label>{props.name}</label>

            <br/>
            <br/>
            props: {JSON.stringify(props, null, 4)}

        </div>
    )
};

let canView = false;
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
        restricted: {canView},
        name: 'Admin only!'
    },
    {
        path: '/login',
        Component: Page,
        notAuth: true,
        name: 'Login Page',
    }
];

const renderRoutes = () => routes.map(({Component, ...rest}, i) => (
    <Component key={i} {...rest}/>
));

afterEach(() => {
    cleanup();
});

describe('Router functionality', () => {


    it('renders without crashing', () => {
        setUrl('/');

        const tree = renderer.create(
            <Router/>
        );


        expect(tree).toMatchSnapshot();


        tree.unmount();

    });


    it('renders the correct routes and replaces the history if no path exists before mounting', () => {
        setUrl('/hello');

        const tree = renderer.create(
            <Router>
                {renderRoutes()}
            </Router>
        );


        expect(tree).toMatchSnapshot();
        expect(getUrl()).toBe('/')

        tree.unmount();
        setUrl('/');
    });


    it('renders the login page when navigated to and when notAuth is present on the page props', () => {
        expect(getUrl()).toBe('/')


        const tree = renderer.create(
            <Router>
                {renderRoutes()}
            </Router>
        );

        goTo('/login')

        expect(tree).toMatchSnapshot();


        tree.unmount();
        setUrl('/');

    });


    // beforeEach(() => {
    //     container = document.createElement('div');
    //     document.body.appendChild(container);
    // });
    //
    // afterEach(() => {
    //     document.body.removeChild(container);
    //     container = null;
    // });


    it('Goes to the appropriate route when authState Changes', () => {

        setUrl('/');
        expect(getUrl()).toBe('/')

        const onLoginPath = '/authOnly';

        const rendered = jest.fn();

        const Page = (props) => {
            rendered(props.name);
            return (
                <div>
                    {props.aux && props.aux()}
                    <label>{props.name}</label>
                </div>
            )
        };

        const App = () => {
            const [hasAuth, setAuth] = useState(false);

            return (
                <React.Fragment>
                    <button id={'toggleLogin'} onClick={() => setAuth(!hasAuth)}>loginBtn</button>

                    <Router isAuthenticated={hasAuth}
                            onLogoutPath={'/login'}
                            onLoginPath={onLoginPath}>

                        <Page path={'/'} name={'Home'} notAuth
                              aux={() => <button id={'goTo'} onClick={() => goTo('/login')}>go to login page</button>}
                        />

                        <Page path={'/login'} name={'loginPage'} notAuth/>

                        <Page path={onLoginPath} authOnly name={'authOnly'}/>

                    </Router>
                </React.Fragment>
            )
        };

        const {container} = render(<App/>);

        fireEvent.click(getById(container, "goTo"));

        expect(rendered).toHaveBeenCalledWith('loginPage');

        expect(getUrl()).toBe('/login');

        fireEvent.click(getById(container, "toggleLogin"));

        expect(rendered).toHaveBeenCalledWith('authOnly');

        expect(getUrl()).toBe('/authOnly')

        fireEvent.click(getById(container, "toggleLogin"));

        expect(getUrl()).toBe('/login')

    })

});


