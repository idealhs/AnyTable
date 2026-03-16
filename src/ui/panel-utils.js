import i18n from '../i18n/i18n.js';
import { createShadowSurface } from './shadow-ui.js';

export function escapeHtml(text) {
    return (text ?? '')
        .toString()
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export const MATERIAL_CLOSE_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>';

export function createCloseIconSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
    svg.appendChild(path);
    return svg;
}

// 安全地设置 HTML 内容（所有内容都已通过 escapeHtml 转义）
export function setInnerHTML(element, htmlString) {
    // 使用 DOMParser 安全地解析 HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    element.textContent = '';
    Array.from(doc.body.childNodes).forEach(node => {
        element.appendChild(node.cloneNode(true));
    });
}

export function parseNumberLike(value) {
    if (value === null || value === undefined) return NaN;
    const normalized = value.toString().replace(/,/g, '').trim();
    return Number(normalized);
}

export function translate(key, params = null) {
    const message = i18n.t(key);
    if (!params || typeof message !== 'string') {
        return message;
    }

    return Object.entries(params).reduce(
        (output, [name, value]) => output.replaceAll(`{${name}}`, String(value)),
        message
    );
}

export function createOverlayAndDialog() {
    const surface = createShadowSurface({
        parent: document.body,
        hostStyles: {
            position: 'fixed',
            inset: '0',
            'z-index': '2147483646'
        },
        containerClassName: 'anytable-shadow-layer'
    });

    const overlay = document.createElement('div');
    overlay.className = 'anytable-advanced-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'anytable-advanced-dialog';

    overlay.appendChild(dialog);
    surface.container.appendChild(overlay);

    return {
        overlay,
        dialog,
        host: surface.host,
        destroy: surface.destroy
    };
}
