import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Exclude e2e tests — those run under Playwright
    exclude: ['node_modules', 'e2e/**', '.next/**'],
    globals: false,
    env: {
      NEXT_PUBLIC_APP_ORIGIN: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` throws outside the react-server build condition; tests
      // run server modules directly, so give them the package's no-op entry.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
