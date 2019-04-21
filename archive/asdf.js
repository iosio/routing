import React, {cloneElement} from 'react';



const nope = {
    textDecoration: 'none',
    backgroundColor: 'transparent',
    outline: 0,
    '-webkit-tap-highlight-color': 'transparent',
};

const noDefaults = {
    ...nope,
    '&:focus': {...nope},
    '&:hover': {...nope,},
    '&:active': {...nope},
    '&:link': {...nope},
    '&:visited': {...nope},
};

function routeFromLink(node) {
    // only valid elements
    if (!node || !node.getAttribute) return;

    let href = node.getAttribute('href'),
        target = node.getAttribute('target');

    // ignore links with targets and non-path URLs
    if (!href || !href.match(/^\//g) || (target && !target.match(/^_?self$/i))) return;

    // attempt to route, if no match simply cede control to browser
    return href;
}


function prevent(e) {
    if (e) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();
    }
    return false;
}

function handleLinkClick(e, goTo, to) {
    if (e.button == 0) {
        routeFromLink(e.currentTarget || e.target || this);
        return prevent(e);
    }
}


const Link_ = (props) => {

    const {
        cn, classes, className, style,
        block, pad,
        pathname, goTo,
        to, href,
        children,
        //ignore
        events, theme,
        ...rest
    } = props;

    const place = to || href;

    return (
        <a href={place}
           style={{
               display: block ? 'block' : 'inline',
               ...style
           }}
           onClick={(e) => handleLinkClick(e, goTo, to)}
           className={cn(classes.a, className)} {...rest}>

            {children}
        </a>
    )
};

export const Link = Capsule({
    styles: {a: noDefaults},
    mapState: {routing: 'pathname'},
    mapLogic: {routing: 'goTo'}
})(Link_);
