import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;

console.log('\x1b[36m[NEXUS-LMS]\x1b[0m Starting Backend API & Frontend Client...');

const serverProc = spawn(nodeCmd, ['backend/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

const clientProc = spawn(npmCmd, ['run', 'dev', '--prefix', 'frontend'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env
});

const cleanup = () => {
  console.log('\n\x1b[33m[NEXUS-LMS]\x1b[0m Shutting down servers...');
  serverProc.kill('SIGINT');
  clientProc.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
