## Webpage Scroll Capture (Image/PDF)

Use a Node.js script to open a URL, auto-scroll, and save a full-page PNG or a single-page full-height PDF to the same folder.

### Install

Option A: bundled Chromium

```bash
npm i puppeteer
```

Option B: use local Chrome/Edge

```bash
npm i puppeteer-core
# optionally set env var if auto-detect fails
# set PUPPETEER_EXECUTABLE_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
```

### Usage

```bash
# PNG (default)
node capture.js http://127.0.0.1:3333 --png --out=homepage.png

# PDF (single page sized to full content)
node capture.js http://127.0.0.1:3333 --pdf --out=homepage.pdf

node capture.js https://echarts.apache.org/handbook/zh/how-to/cross-platform/server/#%E6%9C%8D%E5%8A%A1%E7%AB%AF-canvas-%E6%B8%B2%E6%9F%93 --pdf --out=echarts.pdf

node capture.js https://echarts.apache.org/handbook/zh/how-to/cross-platform/server/#%E6%9C%8D%E5%8A%A1%E7%AB%AF-canvas-%E6%B8%B2%E6%9F%93 --png --out=echarts.

node capture.js https://echarts.apache.org/handbook/zh/how-to/cross-platform/server/ --pdf --out=echarts.pdf

# Custom viewport and waits
node capture.js http://127.0.0.1:3333 --png --width=1440 --height=900 --wait=300

# Capture container only (class .export-container by default)
node capture-container.js http://127.0.0.1:3333 --png --out=container.png
# or via npm script
pnpm run capture:container -- http://127.0.0.1:3333 --png --out=container.png
pnpm run capture:container -- http://127.0.0.1:3333 --pdf --out=container.pdf

# Capture after login (fill #username/#password, click #login)
pnpm run capture:login -- http://127.0.0.1:3333/login --png --out=after-login.png
# Options
# --user=<username> (default admin)
# --pass=<password> (default 123456)
# --pdf to export single-page full-height PDF
pnpm run capture:login -- http://127.0.0.1:3333/login --pdf --out=after-login.pdf
```

Parameters:

- `--png` / `--pdf`: output format (one is required; png is default if neither specified)
- `--out=<filename>`: output filename; default is auto-generated in current folder
- `--width=<px>` `--height=<px>`: viewport size for rendering (default 1280x800)
- `--wait=<ms>`: extra wait after scrolling to settle layout (default 300)
- `--timeout=<ms>`: navigation timeout (default 60000)
- `--selector=<css>`: container capture only; defaults to `.export-container`

Notes:

- For `puppeteer-core`, the script attempts to auto-detect Chrome/Edge on Windows paths. Set `PUPPETEER_EXECUTABLE_PATH` or `CHROME_PATH` if needed.



