import React, {cloneElement} from 'react';

// function routeFromLink(node) {
//     // only valid elements
//     if (!node || !node.getAttribute) return;
//
//     let href = node.getAttribute('href'),
//         target = node.getAttribute('target');
//
//     // ignore links with targets and non-path URLs
//     if (!href || !href.match(/^\//g) || (target && !target.match(/^_?self$/i))) return;
//
//     // attempt to route, if no match simply cede control to browser
//     return href;
// }
//
//
// function prevent(e) {
//     if (e) {
//         if (e.stopImmediatePropagation) e.stopImmediatePropagation();
//         if (e.stopPropagation) e.stopPropagation();
//         e.preventDefault();
//     }
//     return false;
// }
//
// export const Link = (props) => {
//
//     const {
//         active,
//         render,
//         to, href,
//         children,
//         ...rest
//     } = props;
//
//     const place = to || href;
//
//     const goTo = (place) => {
//         console.log('go To:', place);
//     };
//
//     return (
//         <a href={place}
//            onClick={(e) => {
//                if (to) {
//                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
//                    if (e.stopPropagation) e.stopPropagation();
//                    goTo(place);
//                    e.preventDefault();
//                }
//            }} {...rest}>
//
//             {render ? render({}) : children}
//         </a>
//     )
// };

export class Link extends React.Component {
    constructor(props) {
        super(props);

        let state = {
            pathname: window.location.pathname,
            search: window.location.search,
        };

        if (props.history.getParams) {
            state = {
                ...state,
                params: props.history.getParams()
            }
        }

        this.state = state;

        this.unlisten = props.history.listen((location) => {
            this.setState({...location});
        })
    }

    componentWillUnmount() {
        this.unlisten && this.unlisten();
    }

    render() {
        const {render, children, history, to, href} = this.props;
        if(!history)return null;
        const place = to || href;

        return (
            <a href={place}
               onClick={(e) => {
                   if (to) {
                       if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                       if (e.stopPropagation) e.stopPropagation();
                       history.push(place);
                       e.preventDefault();
                   }
               }} {...rest}>

                {render ? render({...this.state.location}) : children}
            </a>
        )
    }
}

// && cloneElement(children, {...children.props, active,})
export const createLink = (history) => {


    return (props) => {

        const {
            active,
            render,
            to, href,
            children,
            ...rest
        } = props;

        const place = to || href;

        const goTo = (place) => {
            console.log('go To:', place);
        };

        return (
            <a href={place}
               onClick={(e) => {
                   if (to) {
                       if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                       if (e.stopPropagation) e.stopPropagation();
                       goTo(place);
                       e.preventDefault();
                   }
               }} {...rest}>

                {render ? render({}) : children}
            </a>
        )
    };


};