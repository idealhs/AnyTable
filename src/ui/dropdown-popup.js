import i18n from '../i18n/i18n.js';
import { createShadowSurface, eventPathIncludes } from './shadow-ui.js';

let activeDropdownPopup = null;

function clampPopupLeft(left, width) {
    const minLeft = 4;
    const maxLeft = Math.max(minLeft, window.innerWidth - width - 4);
    return Math.min(Math.max(left, minLeft), maxLeft);
}

function normalizeGroups(groups) {
    if (!Array.isArray(groups)) {
        return [];
    }
    if (groups.length === 0) {
        return [];
    }
    return Array.isArray(groups[0]) ? groups : [groups];
}

function measureDropdownWidth(referenceElement, text, minWidth = 0) {
    const measure = document.createElement('span');
    const computedStyle = getComputedStyle(referenceElement);
    measure.style.cssText = [
        'all:initial',
        'position:absolute',
        'visibility:hidden',
        'white-space:nowrap',
        `font:${computedStyle.font}`,
        `letter-spacing:${computedStyle.letterSpacing}`,
        `text-transform:${computedStyle.textTransform}`
    ].join(';');
    measure.textContent = text || '';
    document.body.appendChild(measure);
    const width = Math.max(measure.offsetWidth + 30, minWidth);
    measure.remove();
    return width;
}

export function fitDropdownButtonWidth(button, minWidth = 0) {
    if (!button) {
        return;
    }
    button.style.width = `${measureDropdownWidth(button, button.textContent, minWidth)}px`;
}

export function getDropdownButtonValue(button) {
    return button?.getAttribute('data-value') || '';
}

export function setDropdownButtonValue(button, value, label, options = {}) {
    if (!button) {
        return;
    }

    const normalizedValue = value === null || value === undefined ? '' : String(value);
    const text = label ?? normalizedValue;

    button.setAttribute('data-value', normalizedValue);
    button.textContent = text;
    button.title = text;
    button.setAttribute('aria-expanded', 'false');

    if (typeof options.minWidth === 'number') {
        fitDropdownButtonWidth(button, options.minWidth);
    }
}

export function getDropdownOptionLabel(groups, value, fallback = '') {
    const normalizedValue = value === null || value === undefined ? '' : String(value);
    const normalizedGroups = normalizeGroups(groups);

    for (const group of normalizedGroups) {
        const match = group.find((option) => String(option.value) === normalizedValue);
        if (match) {
            return match.label;
        }
    }

    return fallback;
}

export function closeDropdownPopup() {
    if (activeDropdownPopup) {
        activeDropdownPopup.close();
    }
}

export function openDropdownPopup({
    anchorButton,
    currentValue,
    groups,
    onSelect,
    searchable = false,
    searchPlaceholder = ''
}) {
    const normalizedGroups = normalizeGroups(groups);

    if (!anchorButton || normalizedGroups.length === 0) {
        return;
    }

    closeDropdownPopup();

    const surface = createShadowSurface({
        parent: document.body,
        direction: i18n.getDirection?.() || 'ltr',
        hostStyles: {
            position: 'fixed',
            inset: '0',
            'z-index': '2147483647',
            'pointer-events': 'none'
        },
        containerClassName: 'anytable-shadow-layer'
    });

    const popup = document.createElement('div');
    popup.className = 'anytable-adv-select-popup';
    popup.style.pointerEvents = 'auto';

    let searchInput = null;
    if (searchable) {
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'anytable-adv-select-search';
        searchInput.placeholder = searchPlaceholder;
        popup.appendChild(searchInput);
    }

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'anytable-adv-select-options';
    popup.appendChild(optionsContainer);

    function renderOptions(filterText = '') {
        optionsContainer.textContent = '';
        const lowerFilter = filterText.trim().toLowerCase();

        normalizedGroups.forEach((group, groupIndex) => {
            const filteredOptions = group.filter((option) => {
                if (!lowerFilter) {
                    return true;
                }

                const haystacks = [
                    option.label,
                    option.value,
                    ...(Array.isArray(option.searchTerms) ? option.searchTerms : [])
                ];

                return haystacks.some((item) => String(item).toLowerCase().includes(lowerFilter));
            });

            if (filteredOptions.length === 0) {
                return;
            }

            if (groupIndex > 0 && optionsContainer.children.length > 0 && !lowerFilter) {
                const divider = document.createElement('div');
                divider.className = 'anytable-adv-select-divider';
                optionsContainer.appendChild(divider);
            }

            filteredOptions.forEach((option) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'anytable-adv-select-option';

                if (String(option.value) === String(currentValue)) {
                    optionElement.classList.add('selected');
                }
                if (option.disabled) {
                    optionElement.classList.add('disabled');
                }

                optionElement.textContent = option.label;
                optionElement.addEventListener('click', () => {
                    if (option.disabled) {
                        return;
                    }
                    onSelect(String(option.value));
                    closePopup();
                });
                optionsContainer.appendChild(optionElement);
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderOptions(searchInput.value);
        });
    }

    surface.container.appendChild(popup);
    anchorButton.setAttribute('aria-expanded', 'true');

    renderOptions('');

    const anchorRect = anchorButton.getBoundingClientRect();
    const isRtl = (i18n.getDirection?.() || 'ltr') === 'rtl';
    popup.style.top = `${anchorRect.bottom + 2}px`;
    popup.style.left = `${anchorRect.left}px`;

    const popupRect = popup.getBoundingClientRect();
    const alignedLeft = isRtl
        ? anchorRect.right - popupRect.width
        : anchorRect.left;
    popup.style.left = `${clampPopupLeft(alignedLeft, popupRect.width)}px`;
    if (popupRect.bottom > window.innerHeight) {
        popup.style.top = `${Math.max(4, anchorRect.top - popupRect.height - 2)}px`;
    }

    if (searchInput) {
        searchInput.focus();
    }

    function closePopup() {
        if (activeDropdownPopup?.popup !== popup) {
            return;
        }

        activeDropdownPopup = null;
        anchorButton.setAttribute('aria-expanded', 'false');
        document.removeEventListener('mousedown', outsideClickHandler, true);
        document.removeEventListener('keydown', escapeHandler, true);
        surface.destroy();
    }

    function outsideClickHandler(event) {
        if (!eventPathIncludes(event, popup, anchorButton, surface.host)) {
            closePopup();
        }
    }

    function escapeHandler(event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            event.preventDefault();
            closePopup();
        }
    }

    setTimeout(() => {
        document.addEventListener('mousedown', outsideClickHandler, true);
        document.addEventListener('keydown', escapeHandler, true);
    }, 0);

    activeDropdownPopup = {
        popup,
        close: closePopup
    };
}
