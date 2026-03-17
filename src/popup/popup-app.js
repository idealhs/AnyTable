import i18n from '../i18n/i18n.js';
import { createPopupController } from './popup-controller.js';
import { createPopupPageClient } from './popup-page-client.js';
import { createPopupPreferenceStore } from './popup-preferences.js';
import { createPopupView } from './popup-view.js';

export function bootstrapPopup() {
    document.addEventListener('DOMContentLoaded', async () => {
        const browserApi = window.browser || chrome;
        const view = createPopupView({
            document,
            window,
            i18n
        });
        const controller = createPopupController({
            i18n,
            view,
            pageClient: createPopupPageClient({browserApi}),
            preferenceStore: createPopupPreferenceStore({
                storageApi: browserApi.storage.local
            })
        });

        await controller.init();
    });
}
