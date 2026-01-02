import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    mdx(),
  ],
  devToolbar: {
    enabled: false,
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['jszip'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    ssr: {
      noExternal: ['jszip'],
    },
    build: {
      commonjsOptions: {
        include: [/jszip/, /node_modules/],
      },
    },
  },
  server: {
    host: true,
    port: 8080,
  },
});

