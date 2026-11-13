import { defineConfig } from 'vitest/config';

// base './' để game chạy được ở mọi đường dẫn con (GitHub Pages, thư mục bất kỳ).
export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 2000, assetsInlineLimit: 0 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
