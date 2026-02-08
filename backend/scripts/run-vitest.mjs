import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const localStoragePath = path.join(tmpdir(), 'node-localstorage');
process.env.NODE_OPTIONS = `--localstorage-file=${localStoragePath}`;

const result = spawnSync('vitest', args, {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
