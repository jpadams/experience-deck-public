#!/usr/bin/env node
/**
 * Export the deck as PNGs (and optionally animations) plus a PPTX.
 *
 * One headless Chrome is driven over the DevTools protocol. Every slide is
 * rendered at its final fragment step with the deck in export mode
 * (`?export=1`: bare 1600×900 stage, no HUD) and every Flow diagram parked
 * statically (`?t=hold`, the frame `loop=0` ends on). Animated slides can
 * additionally be rendered frame by frame through Flow's `window.__flow.seek`
 * hook and encoded with ffmpeg. The PNGs (or animations) are placed
 * full-bleed on 16:9 PowerPoint slides; the slide's visible text goes into
 * the speaker notes so the deck stays searchable.
 *
 * Usage
 *   pnpm export                          build, serve, export to export/, clean up
 *   pnpm export -- --scale 3             4800×2700 stills (default 2 → 3200×1800)
 *   pnpm export -- --video gif           animated slides as GIF (autoplays in PowerPoint)
 *   pnpm export -- --video mp4           animated slides as H.264 video with the hold frame as cover
 *   pnpm export -- --video both          MP4 on the slide, GIF written alongside
 *   pnpm export -- --fps 24              frame rate for animations (default 24)
 *   pnpm export -- --all-steps           one slide per fragment state instead of final only
 *   pnpm export -- --only 8,9,21         a subset
 *   pnpm export -- --base http://localhost:4173   use a server you already run
 *   pnpm export -- --no-build            skip `vite build` (dist/ must exist)
 *   pnpm export -- --keep-frames         keep the per-frame PNGs under export/frames/
 *
 * Output goes to export/ (gitignored), never under dist/, which the build empties.
 */
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// ── Options ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
};
const flag = (name) => args.includes(`--${name}`);

const BASE_ARG = opt("base", "");
const OUT = resolve(root, opt("out", "export"));
const SCALE = Number(opt("scale", "2"));
const VIDEO = opt("video", "none"); // none | gif | mp4 | both
const FPS = Number(opt("fps", "24"));
const ALL_STEPS = flag("all-steps");
const KEEP_FRAMES = flag("keep-frames");
const ONLY = opt("only", "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n > 0);
if (!["none", "gif", "mp4", "both"].includes(VIDEO)) {
  console.error(`--video must be none, gif, mp4 or both (got ${VIDEO})`);
  process.exit(1);
}

const CHROME =
  process.env.CHROME ||
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(
    existsSync,
  );
if (!CHROME) {
  console.error("No Chrome found. Set CHROME=/path/to/chrome.");
  process.exit(1);
}
const FFMPEG = process.env.FFMPEG || "ffmpeg";
if (VIDEO !== "none") {
  try {
    execFileSync(FFMPEG, ["-version"], { stdio: "ignore" });
  } catch {
    console.error(`--video needs ffmpeg on PATH (or FFMPEG=/path/to/ffmpeg). brew install ffmpeg`);
    process.exit(1);
  }
}

// ── Slide order and step counts, from the `slides` array in src/slides.tsx ──
const src = readFileSync(resolve(root, "src/slides.tsx"), "utf8");
const block = src.slice(src.indexOf("export const slides"));
const defs = [...block.matchAll(/\{\s*(?:steps:\s*(\d+),\s*)?render:\s*\(\)\s*=>\s*<(\w+)\s*\/>\s*\}/g)].map((m) => ({
  name: m[2],
  steps: Number(m[1] ?? 0),
}));
if (!defs.length) {
  console.error("Could not read the slides array from src/slides.tsx");
  process.exit(1);
}

// ── Serve the built deck (unless --base points at a running server) ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () =>
  new Promise((res, rej) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
    srv.on("error", rej);
  });
const waitFor = async (url, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`server at ${url} did not answer within ${ms} ms`);
};

let BASE = BASE_ARG;
let server = null;
let chrome = null;
const cleanup = () => {
  if (server && !server.killed) server.kill();
  if (chrome && !chrome.killed) chrome.kill();
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

if (!BASE) {
  if (!flag("no-build")) {
    process.stdout.write("vite build … ");
    execFileSync("pnpm", ["build"], { cwd: root, stdio: ["ignore", "ignore", "inherit"] });
    console.log("ok");
  } else if (!existsSync(resolve(root, "dist/index.html"))) {
    console.error("dist/index.html missing: run `pnpm build` or drop --no-build");
    process.exit(1);
  }
  const port = await freePort();
  BASE = `http://127.0.0.1:${port}`;
  server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], {
    cwd: root,
    stdio: "ignore",
  });
  await waitFor(`${BASE}/`);
  console.log(`serving dist/ at ${BASE}`);
}

mkdirSync(OUT, { recursive: true });

// ── Chrome over the DevTools protocol ────────────────────────────────
const launchChrome = () =>
  new Promise((res, rej) => {
    chrome = spawn(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--remote-debugging-port=0",
        "--window-size=1600,900",
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let err = "";
    chrome.stderr.on("data", (d) => {
      err += d.toString();
      const m = /DevTools listening on (ws:\/\/[^\s]+)/.exec(err);
      if (m) res(m[1]);
    });
    chrome.on("exit", (code) => rej(new Error(`Chrome exited (${code}) before DevTools came up:\n${err}`)));
    setTimeout(() => rej(new Error("Chrome did not expose DevTools within 15 s")), 15000);
  });

const browserWs = await launchChrome();
const httpBase = browserWs.replace(/^ws:\/\/([^/]+).*$/, "http://$1");
let pageTarget = null;
for (let i = 0; i < 50 && !pageTarget; i++) {
  const list = await (await fetch(`${httpBase}/json/list`)).json();
  pageTarget = list.find((t) => t.type === "page");
  if (!pageTarget) await sleep(100);
}
if (!pageTarget) throw new Error("No page target in Chrome");

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let nextId = 1;
const pending = new Map();
const listeners = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) rej(new Error(`${msg.error.message} ${msg.error.data ?? ""}`));
    else res(msg.result);
  } else if (msg.method && listeners.has(msg.method)) {
    for (const fn of listeners.get(msg.method)) fn(msg.params);
  }
};
const cdp = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
const once = (method) =>
  new Promise((res) => {
    const set = listeners.get(method) ?? new Set();
    const fn = (p) => {
      set.delete(fn);
      res(p);
    };
    set.add(fn);
    listeners.set(method, set);
  });
const evaluate = async (expression, awaitPromise = false) => {
  const r = await cdp("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "evaluate failed");
  return r.result.value;
};
const setScale = (dsf) =>
  cdp("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: dsf, mobile: false });
const screenshot = async (file) => {
  const { data } = await cdp("Page.captureScreenshot", { format: "png" });
  writeFileSync(file, Buffer.from(data, "base64"));
};

await cdp("Page.enable");
await cdp("Runtime.enable");
await setScale(SCALE);

let shotSeq = 0;
const openSlide = async (n, step) => {
  // A unique query param forces a real navigation even though only the hash differs.
  const url = `${BASE}/?export=1&t=hold&loop=0&_=${++shotSeq}#${n}.${step}`;
  const loaded = once("Page.loadEventFired");
  await cdp("Page.navigate", { url });
  await loaded;
  await evaluate("document.fonts.ready.then(() => true)", true);
  await sleep(450); // fragment transitions settle
  const ok = await evaluate("!!document.querySelector('section.slide')");
  if (!ok) {
    console.error(`\nThe deck did not render at ${url}. Is the built deck served there?`);
    process.exit(1);
  }
  return url;
};

const notesOf = () =>
  evaluate(`(() => {
    const s = document.querySelector('section.slide');
    if (!s) return "";
    const parts = [s.querySelector(':scope > .kicker')?.innerText, s.querySelector('.slide-body')?.innerText];
    return parts.filter(Boolean).join('\\n').replace(/\\n{3,}/g, '\\n\\n').trim();
  })()`);

// ── Animation frames → gif / mp4 ─────────────────────────────────────
const encode = (framesDir, base, holdFile) => {
  const outputs = { cover: holdFile };
  const input = ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(FPS), "-i", resolve(framesDir, "f%05d.png")];
  if (VIDEO === "gif" || VIDEO === "both") {
    const gif = `${base}.gif`;
    execFileSync(FFMPEG, [
      ...input,
      "-vf",
      `fps=${Math.min(FPS, 20)},scale=1600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
      "-loop",
      "0",
      gif,
    ]);
    outputs.gif = gif;
  }
  if (VIDEO === "mp4" || VIDEO === "both") {
    const mp4 = `${base}.mp4`;
    execFileSync(FFMPEG, [
      ...input,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "17",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "scale=1600:-2",
      "-movflags",
      "+faststart",
      mp4,
    ]);
    outputs.mp4 = mp4;
  }
  return outputs;
};

// ── Render every slide ───────────────────────────────────────────────
const shots = [];
for (let i = 0; i < defs.length; i++) {
  const d = defs[i];
  const n = i + 1;
  if (ONLY.length && !ONLY.includes(n)) continue;
  const stepList = ALL_STEPS ? Array.from({ length: d.steps + 1 }, (_, k) => k) : [d.steps];
  for (const step of stepList) {
    const stem = `${String(n).padStart(2, "0")}${ALL_STEPS ? `-${step}` : ""}`;
    const file = resolve(OUT, `${stem}.png`);
    process.stdout.write(`slide ${n}/${defs.length} step ${step} ${d.name} … `);
    await openSlide(n, step);
    await screenshot(file);
    const notes = await notesOf();
    const shot = { n, step, name: d.name, file, notes, media: null };

    const roots = VIDEO === "none" ? [] : await evaluate("window.__flow ? window.__flow.roots() : []");
    if (roots.length) {
      const holdAt = Math.max(...roots.map((r) => r.holdAt));
      const frames = Math.ceil((holdAt / 1000) * FPS) + 1;
      const framesDir = resolve(OUT, "frames", stem);
      mkdirSync(framesDir, { recursive: true });
      await setScale(1); // frames are encoded at 1600×900
      for (let f = 0; f < frames; f++) {
        const t = Math.min((f / FPS) * 1000, holdAt);
        await evaluate(`window.__flow.seek(${t}); true`);
        await screenshot(resolve(framesDir, `f${String(f).padStart(5, "0")}.png`));
      }
      await setScale(SCALE);
      process.stdout.write(`${frames} frames → ffmpeg … `);
      shot.media = encode(framesDir, resolve(OUT, stem), file);
      if (!KEEP_FRAMES) rmSync(framesDir, { recursive: true, force: true });
    }
    shots.push(shot);
    console.log("ok");
  }
}
if (!KEEP_FRAMES) rmSync(resolve(OUT, "frames"), { recursive: true, force: true });

// ── PPTX ─────────────────────────────────────────────────────────────
const { default: PptxGenJS } = await import("pptxgenjs");
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in, 16:9
pptx.title = "Experience Is Abundant. Knowledge Is Distilled.";
pptx.author = "Jeremy Adams · Neo4j";
const full = { x: 0, y: 0, w: "100%", h: "100%" };
for (const s of shots) {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  if (s.media?.mp4) {
    const cover = `image/png;base64,${readFileSync(s.media.cover).toString("base64")}`;
    slide.addMedia({ type: "video", path: s.media.mp4, cover, ...full });
  } else if (s.media?.gif) {
    slide.addImage({ path: s.media.gif, ...full });
  } else {
    slide.addImage({ path: s.file, ...full });
  }
  if (s.notes) slide.addNotes(s.notes);
}
const pptxPath = resolve(OUT, "experience-deck.pptx");
await pptx.writeFile({ fileName: pptxPath });
const animated = shots.filter((s) => s.media).length;
console.log(`\n${shots.length} slides${animated ? ` (${animated} animated as ${VIDEO})` : ""} → ${pptxPath}`);
ws.close();
cleanup();
