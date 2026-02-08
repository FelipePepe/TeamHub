import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    maxConcurrency: 1,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      concurrent: false,
    },
    env: {
      NODE_ENV: 'test',
      DISABLE_HMAC: 'true',
    },
  }
});
