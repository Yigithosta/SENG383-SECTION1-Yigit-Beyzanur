const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const backendDir = path.resolve(__dirname, '../backend');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seng383-e2e-'));
const dbFile = path.join(tempDir, 'test.sqlite');

const env = {
  ...process.env,
  DB_FILE: dbFile,
  JWT_SECRET: 'seng383-playwright-test-secret-only',
  PORT: '3001',
};

function cleanup() {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Prepare a fresh database with demo accounts before starting the server.
const seed = spawnSync(process.execPath, ['src/db/seed.js'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
});

if (seed.status !== 0) {
  cleanup();
  process.exit(seed.status || 1);
}

const server = spawn(process.execPath, ['src/server.js'], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
});

server.on('error', (error) => {
  console.error(error);
  cleanup();
  process.exit(1);
});

server.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});

// Playwright stops this process after the tests finish.
// Forward the signal so the backend shuts down too.
function shutdown() {
  server.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);