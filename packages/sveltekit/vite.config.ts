import { defineConfig } from 'vitest/config';

export default defineConfig({
  // this is the package root, even when tests are being run at the repo level
  root: process.cwd(),
  define: {
    __DEBUG_BUILD__: true,
  },
  test: {
    globals: true,
    coverage: {
      enabled: true,
      reportsDirectory: '../../coverage',
    },
  },
});
