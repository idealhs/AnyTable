function isTableElement(node) {
    const tagName = node?.tagName || node?.nodeName;
    return typeof tagName === 'string' && tagName.toUpperCase() === 'TABLE';
}

function collectNodeText(node) {
    if (!node) {
        return '';
    }

    if (node.nodeType === 3) {
        return node.nodeValue ?? '';
    }

    if (isTableElement(node)) {
        return '';
    }

    if (!node.childNodes || node.childNodes.length === 0) {
        return node.textContent ?? '';
    }

    return Array.from(node.childNodes)
        .map((childNode) => collectNodeText(childNode))
        .join('');
}

export function getOwnCellText(cell) {
    if (!cell) {
        return '';
    }

    if (!cell.childNodes || cell.childNodes.length === 0) {
        return cell.textContent?.trim() ?? '';
    }

    return collectNodeText(cell).trim();
}
