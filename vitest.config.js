import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        include: [
            'test/unit/**/*.test.js',
            'test/integration/**/*.test.js'
        ],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.js'],
            exclude: [
                'src/i18n/*.js',
                'src/content-entry.js',
                'src/content.js',
                'src/control-panel-manager.js',
                'src/popup/popup-app.js',
                'src/popup/popup-preferences.js',
                'src/popup/popup-view.js',
                'src/ui/statistics-panel.js',
                'src/ui/statistics-panel-renderer.js',
                'src/ui/statistics-panel-state.js',
                'src/ui/statistics-renderer.js'
            ],
            thresholds: {
                statements: 70,
                branches: 59,
                functions: 70,
                lines: 70
            }
        }
    }
});
