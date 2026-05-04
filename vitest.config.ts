import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    // Don't pull astro:content or any framework setup — these tests are pure.
    globals: false,
  },
});
