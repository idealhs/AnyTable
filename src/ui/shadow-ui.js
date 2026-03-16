const browserApi = globalThis.browser || globalThis.chrome;

let shadowStyleText = null;
let shadowStylePromise = null;

function applyInlineStyles(element, styles = {}) {
    Object.entries(styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
    });
}

function createHostElement(hostStyles = {}) {
    const host = document.createElement('anytable-shadow-host');
    host.style.setProperty('all', 'initial');
    host.style.setProperty('display', 'block');
    applyInlineStyles(host, hostStyles);
    return host;
}

function createStyleElement() {
    if (shadowStyleText === null) {
        throw new Error('AnyTable shadow styles have not been preloaded.');
    }
    const style = document.createElement('style');
    style.textContent = shadowStyleText;
    return style;
}

export async function preloadShadowStyles() {
    if (shadowStyleText !== null) {
        return shadowStyleText;
    }

    if (!shadowStylePromise) {
        const stylesheetUrl = browserApi.runtime.getURL('src/styles.css');
        shadowStylePromise = fetch(stylesheetUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load AnyTable stylesheet: ${response.status}`);
                }
                return response.text();
            })
            .then((text) => {
                shadowStyleText = text;
                return text;
            });
    }

    return shadowStylePromise;
}

export function createShadowSurface({
    parent,
    hostStyles = {},
    containerTag = 'div',
    containerClassName = ''
}) {
    if (!parent) {
        throw new Error('createShadowSurface requires a parent element.');
    }

    const host = createHostElement(hostStyles);
    const shadowRoot = host.attachShadow({mode: 'open'});
    const container = document.createElement(containerTag);

    if (containerClassName) {
        container.className = containerClassName;
    }

    shadowRoot.appendChild(createStyleElement());
    shadowRoot.appendChild(container);
    parent.appendChild(host);

    return {
        host,
        shadowRoot,
        container,
        destroy() {
            host.remove();
        }
    };
}

export function eventPathIncludes(event, ...elements) {
    if (!event || elements.length === 0) {
        return false;
    }

    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    return elements.some((element) => {
        if (!element) {
            return false;
        }
        if (path.includes(element)) {
            return true;
        }
        return typeof element.contains === 'function' && element.contains(event.target);
    });
}

