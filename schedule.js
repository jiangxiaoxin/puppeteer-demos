import cron from 'node-cron';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runCapture(commandArgs) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['run', ...commandArgs], {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', code => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`capture exited with code ${code}`));
    });
  });
}

// 每天 12:00 执行
cron.schedule('0 12 * * *', async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  try {
    await runCapture(['capture:login', '--', 'http://127.0.0.1:3333', '--png', `--out=after-login-${timestamp}.png`]);
  } catch (err) {
    console.error('Scheduled capture failed:', err.message);
  }
}, { timezone: 'Asia/Shanghai' });

console.log('Scheduler started. Job: every day 12:00 Asia/Shanghai');


