import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	base: '/',
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false
	},
	server: {
		port: 5173,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:8787',
				changeOrigin: true
			},
			'/socket.io': {
				target: process.env.VITE_API_URL || 'http://localhost:8787',
				changeOrigin: true,
				ws: true
			}
		}
	},
	define: {
		'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '')
	}
});

