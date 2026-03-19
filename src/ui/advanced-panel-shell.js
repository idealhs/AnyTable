import { createCloseIconSvg, createOverlayAndDialog, translate } from './panel-utils.js';

const browserApi = globalThis.browser || globalThis.chrome;
const BRAND_LOGO_URL = browserApi?.runtime?.getURL('icons/anytable-96.png') || '';

export function createAdvancedPanelShell({
    title,
    contentClassName,
    actionButtons = []
}) {
    const {overlay, dialog, destroy} = createOverlayAndDialog();

    const header = document.createElement('div');
    header.className = 'anytable-advanced-header';

    const titleElement = document.createElement('div');
    titleElement.className = 'anytable-advanced-title';

    if (BRAND_LOGO_URL) {
        const logoElement = document.createElement('img');
        logoElement.className = 'anytable-advanced-title-logo';
        logoElement.src = BRAND_LOGO_URL;
        logoElement.alt = '';
        titleElement.appendChild(logoElement);
    }

    const titleTextElement = document.createElement('span');
    titleTextElement.className = 'anytable-advanced-title-text';
    titleTextElement.textContent = title;
    titleElement.appendChild(titleTextElement);
    header.appendChild(titleElement);

    const closeButton = document.createElement('button');
    closeButton.className = 'anytable-advanced-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', translate('advancedPanel.common.close'));
    closeButton.appendChild(createCloseIconSvg());
    header.appendChild(closeButton);

    const body = document.createElement('div');
    body.className = 'anytable-advanced-body';

    const content = document.createElement('div');
    if (contentClassName) {
        content.className = contentClassName;
    }
    body.appendChild(content);

    const actionButtonMap = {};
    let actionContainer = null;
    if (actionButtons.length > 0) {
        actionContainer = document.createElement('div');
        actionContainer.className = 'anytable-adv-group-actions';

        actionButtons.forEach(({key, className, label}) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `anytable-advanced-btn ${className}`;
            button.textContent = label;
            actionContainer.appendChild(button);
            actionButtonMap[key] = button;
        });

        body.appendChild(actionContainer);
    }

    const hintElement = document.createElement('div');
    hintElement.className = 'anytable-advanced-hint';
    hintElement.setAttribute('data-role', 'hint');
    body.appendChild(hintElement);

    const footer = document.createElement('div');
    footer.className = 'anytable-advanced-footer';

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'anytable-advanced-btn anytable-advanced-reset';
    resetButton.textContent = translate('advancedPanel.common.reset');
    footer.appendChild(resetButton);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'anytable-advanced-btn anytable-advanced-cancel';
    cancelButton.textContent = translate('advancedPanel.common.cancel');
    footer.appendChild(cancelButton);

    const applyButton = document.createElement('button');
    applyButton.type = 'button';
    applyButton.className = 'anytable-advanced-btn primary anytable-advanced-apply';
    applyButton.textContent = translate('advancedPanel.common.apply');
    footer.appendChild(applyButton);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);

    return {
        overlay,
        dialog,
        destroy,
        body,
        content,
        actionContainer,
        actionButtons: actionButtonMap,
        buttons: {
            close: closeButton,
            reset: resetButton,
            cancel: cancelButton,
            apply: applyButton
        },
        setHint(message, isError = false) {
            hintElement.textContent = message || '';
            hintElement.classList.toggle('error', Boolean(isError));
        }
    };
}
