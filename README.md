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
pnpm run capture:login -- http://127.0.0.1:3333 --png --out=after-login.png
# Options
# --user=<username> (default admin)
# --pass=<password> (default 123456)
# --pdf to export single-page full-height PDF
pnpm run capture:login -- http://127.0.0.1:3333 --pdf --out=after-login.pdf
# 这个例子就能说明，可以登录页面，等跳转完毕后，调接口获取数据，形成页面后，再截图保存
```

### Schedule with Node (daily 12:00)

```bash
pnpm run schedule
# Keep this process running (e.g. in a background service or PM2)
```

The scheduler uses `node-cron` with timezone `Asia/Shanghai` and calls the login capture daily at 12:00. Edit `schedule.js` to change the command or time.

Parameters:

- `--png` / `--pdf`: output format (one is required; png is default if neither specified)
- `--out=<filename>`: output filename; default is auto-generated in current folder
- `--width=<px>` `--height=<px>`: viewport size for rendering (default 1280x800)
- `--wait=<ms>`: extra wait after scrolling to settle layout (default 300)
- `--timeout=<ms>`: navigation timeout (default 60000)
- `--selector=<css>`: container capture only; defaults to `.export-container`

Notes:

- For `puppeteer-core`, the script attempts to auto-detect Chrome/Edge on Windows paths. Set `PUPPETEER_EXECUTABLE_PATH` or `CHROME_PATH` if needed.



```shell
# 可以用pm2启动schedule任务，这样让脚本在后台长期运行、异常崩溃自动重启、集中管理日志，并支持开机自启。后台就不需要定时调用node脚本了，他只要定时去查看路径下有没有当天的图片，有就发送邮件。没有就发邮件给开发，及时让开发看问题。
# 安装
npm i -g pm2

# 启动并命名
pm2 start schedule.js --name node-screen-scheduler

# 查看状态/日志
pm2 ls
pm2 logs node-screen-scheduler

# 重启/停止/删除
pm2 restart node-screen-scheduler
pm2 stop node-screen-scheduler
pm2 delete node-screen-scheduler

# 保存当前进程列表（用于开机自启恢复）
pm2 save

# 配置开机自启（按提示执行生成的命令）
pm2 startup
```