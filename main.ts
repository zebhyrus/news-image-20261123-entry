// THE WORLD - front page for Monday 23 November 2026.
// Node stdlib only. Draws a 1024x1024 newspaper front page with a
// hand-written 5x7 bitmap font and a hand-written PNG encoder.
// Deterministic: no clock, no random, no network, no file reads.
// Output: $MAKEFUN_OUTPUT_DIR/entry.png, or ./entry.png.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---- palette -------------------------------------------------------------
const PAPER = [247, 242, 231];
const INK = [18, 18, 18];
const RED = [178, 34, 34];
const BLUE = [24, 62, 120];
const LIGHT = [232, 226, 210];
const GREY = [110, 104, 90];
const GREEN = [34, 96, 56];
const GOLD = [196, 148, 44];

// ---- canvas --------------------------------------------------------------
const px = new Uint8Array(W * H * 3);
function fill(c: number[]) {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function set(x: number, y: number, c: number[]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: number[]) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) set(i, j, c);
}
function box(x: number, y: number, w: number, h: number, c: number[], t: number) {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}
function hline(x: number, y: number, w: number, c: number[], t = 2) {
  rect(x, y, w, t, c);
}
function circle(cx: number, cy: number, r: number, c: number[]) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r) set(cx + x, cy + y, c);
}
function ring(cx: number, cy: number, r: number, c: number[], t: number) {
  for (let a = 0; a < 360; a++) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < t; k++) {
      set(Math.round(cx + (r + k) * Math.cos(rad)), Math.round(cy + (r + k) * Math.sin(rad)), c);
    }
  }
}
// Filled triangle (scanline).
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number[]) {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const a = Math.min(...xs);
      const b = Math.max(...xs);
      for (let x = Math.ceil(a); x <= Math.floor(b); x++) set(x, y, c);
    }
  }
}

// ---- PNG encoder ---------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- 5x7 bitmap font -----------------------------------------------------
// Each glyph: 7 rows of 5 bits, "#" = on, "." = off.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", "01100", "01100"],
  ",": [".....", ".....", ".....", ".....", "01100", "00100", "01000"],
  ":": [".....", "01100", "01100", ".....", "01100", "01100", "....."],
  ";": [".....", "01100", "01100", ".....", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "01110", ".....", ".....", "....."],
  "!": ["00100", "00100", "00100", "00100", "00100", ".....", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", ".....", "00100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": [".....", "00100", "00100", "11111", "00100", "00100", "....."],
  "=": [".....", ".....", "11111", ".....", "11111", ".....", "....."],
  "*": [".....", "10101", "01110", "11111", "01110", "10101", "....."],
  '"': ["01010", "01010", ".....", ".....", ".....", ".....", "....."],
};
function glyph(ch: string): string[] {
  return FONT[ch] ?? FONT["?"];
}
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}
function drawText(s: string, x: number, y: number, scale: number, c: number[]) {
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const g = glyph(up[i]);
    for (let r = 0; r < 7; r++)
      for (let col = 0; col < 5; col++)
        if (g[r][col] === "1")
          rect(x + i * 6 * scale + col * scale, y + r * scale, scale, scale, c);
  }
}
function textCenter(s: string, y: number, scale: number, c: number[], cx = W / 2) {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}
// Greedy word wrap; returns lines that fit maxW pixels.
function wrap(s: string, scale: number, maxW: number): string[] {
  const words = s.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(s: string, x: number, y: number, scale: number, maxW: number, c: number[], lh?: number): number {
  const lines = wrap(s, scale, maxW);
  const step = lh ?? 9 * scale;
  lines.forEach((ln, i) => drawText(ln, x, y + i * step, scale, c));
  return y + lines.length * step;
}

// ---- layout ----------------------------------------------------------------
const MX = 32; // margin
const CW = W - 2 * MX; // 960

function kicker(s: string, x: number, y: number) {
  drawText(s, x, y, 2, RED);
}
function storyBox(x: number, y: number, w: number, h: number, kick: string, head: string[], sub: string) {
  box(x, y, w, h, INK, 3);
  kicker(kick, x + 20, y + 16);
  head.forEach((ln, i) => drawText(ln, x + 20, y + 44 + i * 28, 3, INK));
  drawPara(sub, x + 20, y + 44 + head.length * 28 + 10, 2, w - 40, INK, 18);
}

function main() {
  fill(PAPER);
  // Masthead.
  textCenter("THE WORLD", 26, 8, INK);
  hline(MX, 96, CW, INK, 4);
  textCenter("MONDAY 23 NOVEMBER 2026", 108, 2, INK);
  hline(MX, 134, CW, INK, 2);

  // ---- HERO: NATO meets on the Poland incursion ----
  const hy = 148;
  const hh = 288;
  box(MX, hy, CW, hh, INK, 4);
  kicker("EUROPE - SECURITY", MX + 24, hy + 18);
  drawText("NATO MEETS ON", MX + 24, hy + 48, 4, INK);
  drawText("POLAND INCURSION", MX + 24, hy + 86, 4, INK);
  drawPara(
    "The North Atlantic Council meets in Brussels today after Polish prosecutors said all three objects that fell on Poland were Russian Kh-101 missiles.",
    MX + 24, hy + 140, 2, 540, INK, 18
  );
  drawPara(
    "No one was hurt. Poland calls it a deliberate provocation.",
    MX + 24, hy + 140 + 5 * 18, 2, 540, RED, 18
  );
  // Hero art: NATO compass star on blue, with a red warning band.
  const ax = 668, ay = hy + 18, aw = 324, ah = hh - 36;
  rect(ax, ay, aw, ah, BLUE);
  box(ax, ay, aw, ah, [255, 255, 255], 2);
  const cx = ax + aw / 2, cy = ay + ah / 2 - 14;
  ring(cx, cy, 78, [255, 255, 255], 3);
  tri(cx, cy - 74, cx - 16, cy, cx + 16, cy, [255, 255, 255]);
  tri(cx, cy + 74, cx - 16, cy, cx + 16, cy, [255, 255, 255]);
  tri(cx - 74, cy, cx, cy - 16, cx, cy + 16, [255, 255, 255]);
  tri(cx + 74, cy, cx, cy - 16, cx, cy + 16, [255, 255, 255]);
  circle(cx, cy, 12, [255, 255, 255]);
  drawText("BRUSSELS", ax + 24, ay + ah - 34, 2, [255, 255, 255]);
  drawText("TODAY", ax + aw - 24 - textWidth("TODAY", 2), ay + ah - 34, 2, GOLD);

  // ---- Row A ----
  const ry = 450;
  const rh = 196;
  storyBox(MX, ry, 472, rh, "ASIA - DIPLOMACY",
    ["SHAH MEETS MODI", "IN NEW DELHI"],
    "Nepal's prime minister holds talks with Narendra Modi today, his first trip to India since taking office in March.");
  storyBox(MX + 488, ry, 472, rh, "ASIA - DISASTER",
    ["JAVA FACTORY", "SEARCH RESUMES"],
    "Search resumes this morning at the Cikande candy factory. 24 body bags were removed on Sunday. 29 are still missing.");

  // ---- Row B ----
  const by = 660;
  storyBox(MX, by, 472, rh, "MIDDLE EAST - GAZA",
    ["NINE MORE KILLED", "IN GAZA"],
    "Gaza's health ministry said on Monday nine people died in 24 hours. 970 have died since the October 2025 ceasefire.");
  storyBox(MX + 488, by, 472, rh, "ASIA - WORK",
    ["GARMENT PAY TALKS", "OPEN TODAY"],
    "Factory owners table a wage offer for nearly 4 million garment workers in Bangladesh. Unions want Tk32,000 a month, up from Tk12,500.");

  // ---- Sport strip ----
  const sy = 866;
  const sh = 106;
  box(MX, sy, CW, sh, INK, 3);
  kicker("SPORT - CRICKET", MX + 24, sy + 14);
  drawText("INDIA EYE WELLINGTON WIN ON FINAL DAY", MX + 24, sy + 40, 3, INK);
  drawPara(
    "India declared on a record 720 for 9. New Zealand are 119 for 2, still 233 behind with eight wickets in hand.",
    MX + 24, sy + 68, 2, 800, INK, 18
  );
  circle(924, sy + 52, 26, RED);
  ring(924, sy + 52, 26, [255, 255, 255], 2);

  // ---- Footer: sources ----
  hline(MX, 984, CW, GREY, 1);
  textCenter("SOURCES: EU TODAY - IANS - REUTERS - WE NEWS - BUSINESS STANDARD - ESPNCRICINFO", 994, 1, GREY);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || ".";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG());
}

main();
