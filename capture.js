import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getArgFromList(args, key, defaultValue = undefined) {
  const prefix = key.includes('=') ? key : `${key}=`;
  const exact = args.find(a => a === key);
  if (exact) return true;
  const found = args.find(a => a.startsWith(prefix));
  if (!found) return defaultValue;
  const [, value] = found.split('=');
  return value ?? true;
}

function parseIntArg(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function tryImportPuppeteer() {
  const localExecutable = detectLocalChromiumPath();
  if (localExecutable) {
    try {
      const mod = await import('puppeteer-core');
      return {
        puppeteer: mod.default,
        launchOptions: { headless: 'new', executablePath: localExecutable, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      };
    } catch (err) {
      throw new Error(`已检测到本地 Chrome/Edge，但未安装 puppeteer-core。请运行: pnpm add puppeteer-core\n错误: ${err.message}`);
    }
  }

  try {
    const mod = await import('puppeteer');
    return { puppeteer: mod.default, launchOptions: { headless: 'new' } };
  } catch (err) {
    throw new Error(`未找到可用的浏览器。请执行以下任一操作:\n1) 安装 puppeteer (会自动下载浏览器): pnpm add puppeteer\n2) 安装 puppeteer-core 并设置 PUPPETEER_EXECUTABLE_PATH 指向本地 Chrome/Edge\n原始错误: ${err.message}`);
  }
}

function detectLocalChromiumPath() {
  const envPath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    envPath,
    // Common Windows Chrome/Edge paths
    'C://Program Files//Google//Chrome//Application//chrome.exe',
    'C://Program Files (x86)//Google//Chrome//Application//chrome.exe',
    `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
    'C://Program Files//Microsoft//Edge//Application//msedge.exe',
    'C://Program Files (x86)//Microsoft//Edge//Application//msedge.exe',
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }
  return undefined;
}

async function autoScroll(page, { step = 400, delayMs = 50 } = {}) {
  await page.evaluate(async (scrollStep, delay) => {
    await new Promise(resolve => {
      let totalScrolled = 0;
      const timer = setInterval(() => {
        const el = document.scrollingElement || document.documentElement;
        const maxScrollable = el.scrollHeight - window.innerHeight;
        window.scrollBy(0, scrollStep);
        totalScrolled += scrollStep;
        if (totalScrolled >= maxScrollable - 2) {
          window.scrollTo(0, el.scrollHeight);
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  }, step, delayMs);
}

function buildOutputPath(urlString, format, explicitName) {
  const url = new URL(urlString);
  const safeHost = url.hostname.replace(/[^a-z0-9.-]/gi, '-');
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const base = explicitName && explicitName.trim().length > 0 ? explicitName.trim() : `${safeHost}-${date}.${format}`;
  return resolve(__dirname, base);
}

async function main() {
  const argv = process.argv.slice(2).filter(a => a !== '--');
  const positional = argv.filter(a => !a.startsWith('-'));
  let url = positional[0] || 'http://127.0.0.1:3333';
  // Normalize URL if missing protocol
  try { new URL(url); } catch { url = `http://${url}`; }

  const wantPdf = Boolean(getArgFromList(argv, '--pdf', false));
  const wantPng = Boolean(getArgFromList(argv, '--png', !wantPdf));
  const outName = getArgFromList(argv, '--out');
  const width = parseIntArg(getArgFromList(argv, '--width'), 1920);
  const height = parseIntArg(getArgFromList(argv, '--height'), 1080);
  const delayAfterScrollMs = parseIntArg(getArgFromList(argv, '--wait'), 300);
  const timeoutMs = parseIntArg(getArgFromList(argv, '--timeout'), 60_000);

  if (!wantPdf && !wantPng) {
    console.error('请指定输出格式: 使用 --png 或 --pdf');
    process.exit(2);
  }

  const format = wantPdf ? 'pdf' : 'png';
  const outputPath = buildOutputPath(url, format, outName === true ? undefined : outName);

  const { puppeteer, launchOptions } = await tryImportPuppeteer();
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
  await autoScroll(page);
  if (delayAfterScrollMs > 0) await new Promise(resolve => setTimeout(resolve, delayAfterScrollMs));

  if (wantPng) {
    /**
     * fullPage: 
     * false . 上面调用了autoScroll ，这里false，就只截图页面最下面那部分
     * true 则会将页面完整的截图出来
     */
    await page.screenshot({ path: outputPath, fullPage: true, type: 'png' });
    console.log(`已保存完整页面 PNG: ${outputPath}`);
  } else if (wantPdf) {
    const dimensions = await page.evaluate(() => {
      const el = document.documentElement;
      const width = Math.max(el.clientWidth, el.scrollWidth, el.offsetWidth);
      const height = Math.max(el.clientHeight, el.scrollHeight, el.offsetHeight);
      return { width, height };
    });

    await page.pdf({
      path: outputPath,
      printBackground: true,
      pageRanges: '1',
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      preferCSSPageSize: false,
      scale: 1,
    });
    console.log(`已保存完整页面 PDF: ${outputPath}`);
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


