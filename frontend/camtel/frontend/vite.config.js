/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            // Fichiers medias servis par Django (MEDIA_URL = '/media/') : images
            // produits, couvertures d'actualites, mediatheque. Sans ce proxy, les
            // <img src="/media/..."> renvoient 404 en dev (images cassees).
            '/media': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/shared/test/setup.ts'],
        globals: true,
        css: false,
        include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
        exclude: ['tests/e2e/**', 'node_modules', 'dist', '**/playwright/**']
    },
});
