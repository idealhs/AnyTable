// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadShadowUi({ api = 'chrome', fetchImpl } = {}) {
    vi.resetModules();
    document.body.innerHTML = '';

    delete globalThis.browser;
    delete globalThis.chrome;

    const runtime = {
        getURL: vi.fn((path) => `chrome-extension://anytable/${path}`)
    };
    if (api === 'browser') {
        globalThis.browser = { runtime };
    } else {
        globalThis.chrome = { runtime };
    }

    globalThis.fetch = fetchImpl || vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('.anytable { color: red; }')
    });

    const shadowUi = await import('../../src/ui/shadow-ui.js');
    return {
        runtime,
        ...shadowUi
    };
}

describe('shadow-ui', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.browser;
        delete globalThis.chrome;
        delete globalThis.fetch;
        document.body.innerHTML = '';
    });

    it('缓存预加载的样式文本，后续调用不再重复请求', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('.cached { display: block; }')
        });
        const { runtime, preloadShadowStyles } = await loadShadowUi({
            api: 'browser',
            fetchImpl: fetchMock
        });

        await expect(preloadShadowStyles()).resolves.toBe('.cached { display: block; }');
        await expect(preloadShadowStyles()).resolves.toBe('.cached { display: block; }');

        expect(runtime.getURL).toHaveBeenCalledTimes(1);
        expect(runtime.getURL).toHaveBeenCalledWith('src/styles.css');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('chrome-extension://anytable/src/styles.css');
    });

    it('在样式请求失败时抛出明确错误', async () => {
        const { preloadShadowStyles } = await loadShadowUi({
            fetchImpl: vi.fn().mockResolvedValue({
                ok: false,
                status: 503
            })
        });

        await expect(preloadShadowStyles()).rejects.toThrow('Failed to load AnyTable stylesheet: 503');
    });

    it('创建 shadow surface 前会校验父节点和预加载状态', async () => {
        const { createShadowSurface } = await loadShadowUi();

        expect(() => createShadowSurface({})).toThrow('createShadowSurface requires a parent element.');
        expect(() => createShadowSurface({ parent: document.body })).toThrow(
            'AnyTable shadow styles have not been preloaded.'
        );
    });

    it('创建的 shadow surface 会附加样式、容器和宿主样式，并支持销毁', async () => {
        const { preloadShadowStyles, createShadowSurface } = await loadShadowUi({
            fetchImpl: vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('.surface { position: fixed; }')
            })
        });
        await preloadShadowStyles();

        const parent = document.createElement('div');
        document.body.appendChild(parent);

        const surface = createShadowSurface({
            parent,
            direction: 'rtl',
            hostStyles: {
                position: 'fixed',
                top: '12px'
            },
            containerTag: 'section',
            containerClassName: 'surface'
        });

        expect(parent.querySelector('anytable-shadow-host')).toBe(surface.host);
        expect(surface.host.style.getPropertyValue('all')).toBe('initial');
        expect(surface.host.style.getPropertyValue('display')).toBe('block');
        expect(surface.host.style.getPropertyValue('position')).toBe('fixed');
        expect(surface.host.style.getPropertyValue('top')).toBe('12px');
        expect(surface.host.getAttribute('dir')).toBe('rtl');
        expect(surface.container.tagName).toBe('SECTION');
        expect(surface.container.className).toBe('surface');
        expect(surface.shadowRoot.querySelector('style')?.textContent).toBe('.surface { position: fixed; }');
        expect(surface.shadowRoot.querySelector('section.surface')).toBe(surface.container);

        surface.destroy();

        expect(parent.querySelector('anytable-shadow-host')).toBeNull();
    });

    it('未显式传入方向时默认使用 ltr 宿主方向', async () => {
        const { preloadShadowStyles, createShadowSurface } = await loadShadowUi();
        await preloadShadowStyles();

        const parent = document.createElement('div');
        document.body.appendChild(parent);

        const surface = createShadowSurface({ parent });

        expect(surface.host.getAttribute('dir')).toBe('ltr');
    });

    it('eventPathIncludes 同时支持 composedPath、contains 回退和空输入保护', async () => {
        const { eventPathIncludes } = await loadShadowUi();
        const container = document.createElement('div');
        const child = document.createElement('span');
        const outsider = document.createElement('button');
        container.appendChild(child);

        expect(eventPathIncludes(null, container)).toBe(false);
        expect(eventPathIncludes({ target: child })).toBe(false);
        expect(eventPathIncludes({
            target: outsider,
            composedPath: () => [outsider, container]
        }, container)).toBe(true);
        expect(eventPathIncludes({
            target: child,
            composedPath: () => []
        }, container)).toBe(true);
        expect(eventPathIncludes({
            target: outsider,
            composedPath: () => [outsider]
        }, null, container)).toBe(false);
    });
});
