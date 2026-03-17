// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createAnchorButton(rect = {}) {
    const button = document.createElement('button');
    const normalizedRect = {
        left: 24,
        top: 48,
        bottom: 72,
        right: 124,
        width: 100,
        height: 24,
        ...rect
    };

    button.setAttribute('aria-expanded', 'false');
    button.getBoundingClientRect = () => normalizedRect;
    document.body.appendChild(button);
    return button;
}

function mockSpanOffsetWidth(width) {
    const originalCreateElement = document.createElement.bind(document);
    return vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
        const element = originalCreateElement(tagName, options);
        if (String(tagName).toLowerCase() === 'span') {
            Object.defineProperty(element, 'offsetWidth', {
                configurable: true,
                get: () => width
            });
        }
        return element;
    });
}

async function loadDropdownPopupModule({ eventPathIncludesImpl } = {}) {
    vi.resetModules();
    document.body.innerHTML = '';

    const surfaces = [];
    const createShadowSurfaceMock = vi.fn(({ parent }) => {
        const host = document.createElement('div');
        const container = document.createElement('div');
        host.className = 'mock-shadow-host';
        host.appendChild(container);
        parent.appendChild(host);

        const surface = {
            host,
            container,
            destroy: vi.fn(() => {
                host.remove();
            })
        };
        surfaces.push(surface);
        return surface;
    });
    const eventPathIncludesMock = vi.fn(eventPathIncludesImpl || (() => false));

    vi.doMock('../../src/ui/shadow-ui.js', () => ({
        createShadowSurface: createShadowSurfaceMock,
        eventPathIncludes: eventPathIncludesMock
    }));

    const dropdownPopup = await import('../../src/ui/dropdown-popup.js');
    return {
        ...dropdownPopup,
        createShadowSurfaceMock,
        eventPathIncludesMock,
        surfaces
    };
}

describe('dropdown-popup', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.resetModules();
        document.body.innerHTML = '';
    });

    it('getDropdownOptionLabel handles invalid groups, single groups, multi groups and fallback', async () => {
        const { getDropdownOptionLabel } = await loadDropdownPopupModule();

        expect(getDropdownOptionLabel(null, '1', 'fallback')).toBe('fallback');
        expect(getDropdownOptionLabel([], '1', 'fallback')).toBe('fallback');
        expect(getDropdownOptionLabel([
            { value: '1', label: '一号' }
        ], '1', 'fallback')).toBe('一号');
        expect(getDropdownOptionLabel([
            [{ value: '1', label: '一号' }],
            [{ value: '2', label: '二号' }]
        ], '2', 'fallback')).toBe('二号');
        expect(getDropdownOptionLabel([
            [{ value: '1', label: '一号' }]
        ], '9', 'fallback')).toBe('fallback');
    });

    it('fitDropdownButtonWidth handles null buttons and sets a measured width for normal buttons', async () => {
        const { fitDropdownButtonWidth } = await loadDropdownPopupModule();
        const button = document.createElement('button');
        button.textContent = '当前排序';
        document.body.appendChild(button);
        mockSpanOffsetWidth(72);

        expect(() => fitDropdownButtonWidth(null)).not.toThrow();

        fitDropdownButtonWidth(button, 120);

        expect(button.style.width).toBe('120px');
    });

    it('setDropdownButtonValue syncs button state and supports normalized fallback values', async () => {
        const { setDropdownButtonValue } = await loadDropdownPopupModule();
        const button = document.createElement('button');
        document.body.appendChild(button);
        mockSpanOffsetWidth(18);

        setDropdownButtonValue(button, null);

        expect(button.getAttribute('data-value')).toBe('');
        expect(button.textContent).toBe('');
        expect(button.title).toBe('');
        expect(button.getAttribute('aria-expanded')).toBe('false');

        setDropdownButtonValue(button, 42, undefined, { minWidth: 96 });

        expect(button.getAttribute('data-value')).toBe('42');
        expect(button.textContent).toBe('42');
        expect(button.title).toBe('42');
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(button.style.width).toBe('96px');
    });

    it('openDropdownPopup returns early when anchorButton is missing or groups normalize to empty', async () => {
        const { openDropdownPopup, createShadowSurfaceMock } = await loadDropdownPopupModule();
        const anchorButton = createAnchorButton();

        openDropdownPopup({
            anchorButton: null,
            currentValue: '',
            groups: [[{ value: 'a', label: '选项 A' }]],
            onSelect: vi.fn()
        });
        openDropdownPopup({
            anchorButton,
            currentValue: '',
            groups: null,
            onSelect: vi.fn()
        });

        expect(createShadowSurfaceMock).not.toHaveBeenCalled();
        expect(document.querySelector('.anytable-adv-select-popup')).toBeNull();
    });

    it('renders selected and disabled options, ignores disabled clicks, and closes after selecting a normal option', async () => {
        const { openDropdownPopup, surfaces } = await loadDropdownPopupModule();
        const anchorButton = createAnchorButton();
        const onSelect = vi.fn();

        openDropdownPopup({
            anchorButton,
            currentValue: 'b',
            groups: [[
                { value: 'a', label: '选项 A' },
                { value: 'b', label: '选项 B' },
                { value: 'c', label: '选项 C', disabled: true }
            ]],
            onSelect
        });

        const options = Array.from(document.querySelectorAll('.anytable-adv-select-option'));

        expect(anchorButton.getAttribute('aria-expanded')).toBe('true');
        expect(options).toHaveLength(3);
        expect(options[1].classList.contains('selected')).toBe(true);
        expect(options[2].classList.contains('disabled')).toBe(true);

        options[2].click();

        expect(onSelect).not.toHaveBeenCalled();
        expect(surfaces[0].destroy).not.toHaveBeenCalled();

        options[0].click();

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('a');
        expect(surfaces[0].destroy).toHaveBeenCalledTimes(1);
        expect(anchorButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('renders a search input and filters by label, value, and searchTerms without dividers in search mode', async () => {
        const { openDropdownPopup } = await loadDropdownPopupModule();

        openDropdownPopup({
            anchorButton: createAnchorButton(),
            currentValue: '',
            searchable: true,
            searchPlaceholder: '搜索选项',
            groups: [
                [
                    { value: 'alpha', label: 'Alpha' },
                    { value: 'beta', label: 'Beta' }
                ],
                [
                    { value: 'gamma', label: 'Gamma', searchTerms: ['alias'] }
                ]
            ],
            onSelect: vi.fn()
        });

        const searchInput = document.querySelector('.anytable-adv-select-search');
        expect(searchInput?.getAttribute('placeholder')).toBe('搜索选项');

        searchInput.value = 'alias';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        const optionTexts = Array.from(document.querySelectorAll('.anytable-adv-select-option'))
            .map((element) => element.textContent);

        expect(optionTexts).toEqual(['Gamma']);
        expect(document.querySelectorAll('.anytable-adv-select-divider')).toHaveLength(0);
    });

    it('inserts dividers between non-empty groups when search is not active', async () => {
        const { openDropdownPopup } = await loadDropdownPopupModule();

        openDropdownPopup({
            anchorButton: createAnchorButton(),
            currentValue: '',
            groups: [
                [{ value: 'a', label: 'A' }],
                [{ value: 'b', label: 'B' }],
                [{ value: 'c', label: 'C' }]
            ],
            onSelect: vi.fn()
        });

        expect(document.querySelectorAll('.anytable-adv-select-divider')).toHaveLength(2);
    });

    it('closes the previous popup before opening a new one and ignores stale close logic from the old popup', async () => {
        const { openDropdownPopup, surfaces } = await loadDropdownPopupModule();
        const firstAnchorButton = createAnchorButton({ left: 20, right: 120 });
        const secondAnchorButton = createAnchorButton({ left: 200, right: 300 });
        const firstOnSelect = vi.fn();

        openDropdownPopup({
            anchorButton: firstAnchorButton,
            currentValue: '',
            groups: [[{ value: 'first', label: '第一项' }]],
            onSelect: firstOnSelect
        });

        const staleOption = document.querySelector('.anytable-adv-select-option');
        const firstSurface = surfaces[0];

        openDropdownPopup({
            anchorButton: secondAnchorButton,
            currentValue: '',
            groups: [[{ value: 'second', label: '第二项' }]],
            onSelect: vi.fn()
        });

        expect(firstSurface.destroy).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll('.anytable-adv-select-popup')).toHaveLength(1);
        expect(secondAnchorButton.getAttribute('aria-expanded')).toBe('true');

        staleOption.click();

        expect(firstOnSelect).toHaveBeenCalledWith('first');
        expect(surfaces[1].destroy).not.toHaveBeenCalled();
        expect(document.querySelectorAll('.anytable-adv-select-popup')).toHaveLength(1);
    });

    it('handles outside clicks after deferred listener registration and keeps the popup open for inside clicks', async () => {
        const { openDropdownPopup, closeDropdownPopup, eventPathIncludesMock, surfaces } = await loadDropdownPopupModule();
        const anchorButton = createAnchorButton();

        expect(() => closeDropdownPopup()).not.toThrow();

        openDropdownPopup({
            anchorButton,
            currentValue: '',
            groups: [[{ value: 'a', label: '选项 A' }]],
            onSelect: vi.fn()
        });

        vi.runAllTimers();

        eventPathIncludesMock.mockReturnValue(true);
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        expect(surfaces[0].destroy).not.toHaveBeenCalled();
        expect(anchorButton.getAttribute('aria-expanded')).toBe('true');

        eventPathIncludesMock.mockReturnValue(false);
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

        expect(surfaces[0].destroy).toHaveBeenCalledTimes(1);
        expect(anchorButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape, prevents default handling, and ignores other keys', async () => {
        const { openDropdownPopup, surfaces } = await loadDropdownPopupModule();

        openDropdownPopup({
            anchorButton: createAnchorButton(),
            currentValue: '',
            groups: [[{ value: 'a', label: '选项 A' }]],
            onSelect: vi.fn()
        });

        vi.runAllTimers();

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true
        }));

        expect(surfaces[0].destroy).not.toHaveBeenCalled();

        const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true
        });
        const stopPropagation = vi.fn();
        const preventDefault = vi.fn();
        Object.defineProperty(escapeEvent, 'stopPropagation', {
            configurable: true,
            value: stopPropagation
        });
        Object.defineProperty(escapeEvent, 'preventDefault', {
            configurable: true,
            value: preventDefault
        });

        document.dispatchEvent(escapeEvent);

        expect(stopPropagation).toHaveBeenCalledTimes(1);
        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(surfaces[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('repositions the popup when it would overflow the viewport on the right or bottom side', async () => {
        const { openDropdownPopup } = await loadDropdownPopupModule();
        const anchorButton = createAnchorButton({
            left: 250,
            top: 180,
            bottom: 210,
            right: 310,
            width: 60,
            height: 30
        });

        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 300
        });
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            value: 220
        });

        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect() {
            if (this.classList?.contains('anytable-adv-select-popup')) {
                return {
                    left: 250,
                    top: 210,
                    right: 340,
                    bottom: 290,
                    width: 120,
                    height: 80
                };
            }

            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: 0,
                height: 0
            };
        });

        openDropdownPopup({
            anchorButton,
            currentValue: '',
            groups: [[{ value: 'a', label: '选项 A' }]],
            onSelect: vi.fn()
        });

        const popup = document.querySelector('.anytable-adv-select-popup');

        expect(popup.style.left).toBe('176px');
        expect(popup.style.top).toBe('98px');
    });

    it('closeDropdownPopup is safe without an active popup and closes the current popup when one exists', async () => {
        const { openDropdownPopup, closeDropdownPopup, surfaces } = await loadDropdownPopupModule();

        expect(() => closeDropdownPopup()).not.toThrow();

        const anchorButton = createAnchorButton();
        openDropdownPopup({
            anchorButton,
            currentValue: '',
            groups: [[{ value: 'a', label: '选项 A' }]],
            onSelect: vi.fn()
        });

        closeDropdownPopup();

        expect(surfaces[0].destroy).toHaveBeenCalledTimes(1);
        expect(anchorButton.getAttribute('aria-expanded')).toBe('false');
    });
});
