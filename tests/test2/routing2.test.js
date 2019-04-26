import React, {useState} from 'react'
import renderer from 'react-test-renderer';
import {Router, Link, goTo, getLoc, subscribe} from "../../src";
import {getUrl, setUrl} from "../../src/routing";
import {render, fireEvent, queryByAttribute} from 'react-testing-library';

import 'jest-dom/extend-expect'

import {makeTestApp} from "./TestApp";

const getById = queryByAttribute.bind(null, 'id');

const onLoginPath = '/authOnly';
const onLogoutPath = '/login';

const rendered = jest.fn();




const home = {
    path: '/',
    name: 'home'
};
const detail = {
    path: '/detail',
    name: 'detail'
};
const authOnly = {
    path: '/authOnly',
    authOnly: true,
    name: 'authOnly'
};
const restricted = {
    path: '/restricted',
    authOnly: true,
    name: 'restricted'
};

const login = {
    path: '/login',
    notAuth: true,
    name: 'login',
};

const Routes = {
    home,
    detail,
    authOnly,
    restricted,
    login
};

const PageComponent = ({aux, name}) => {
    rendered(name);
    return (
        <div>
            {aux && aux()}
            <label>{name}</label>
        </div>
    )
};

const App = makeTestApp({Routes, PageComponent, onLoginPath, onLogoutPath});


describe('Goes to the appropriate route when clicking link and when authState Changes', () => {

    setUrl('/');
    expect(getUrl()).toBe('/');


    const {container} = render(<App/>);

    const clickIt = (cont, id) => {
        fireEvent.click(getById(cont, id));
    };

    const runTest = ({click, expected = {}}) => {

        const {name, url, search} = expected;

        click && clickIt(container, click);

        search && expect(getLoc().search).toBe(search);

        name && expect(rendered).toHaveBeenCalledWith(name);

        url && expect(getUrl()).toBe(url);
    };


    it('renders the home page', () => {

        runTest({
            expected: {
                name: home.name,
                url: home.path
            },
        });

    });

    it('renders the detail page when routed to', ()=>{
        runTest({
            click: detail.name,
            expected: {
                name: detail.name,
                url: detail.path
            }
        })
    });

    it('goes back to home page from detail', () => {

        runTest({
            click: home.name,
            expected: {
                name: home.name,
                url: home.path
            },
        });

    });


    it('renders the login page after clicking the login page button', () => {

        runTest({
            click: login.name,
            expected: {
                name: login.name,
                url: login.path
            },

        });
    });


    it('render the authOnly page after changing the authentication state', () => {

        runTest({
            click: 'toggleLogin',
            expected: {
                name: authOnly.name,
                url:  authOnly.path
            }
        });

    });

    it('return to login page after logging out', () => {

        runTest({
            click: 'toggleLogin',
            expected: {
                name: login.name,
                url: login.path
            }
        });

    })

});


