/*
 * static_checks.test.js：ファイルの中身を読んで確かめる自動テスト（画面・通信の約束と軽さ）
 * 「送らない」の文（AC-2）・CSP（AC-4）・保存しない（AC-5）・文字起こしは押すまで読まない（AC-13・27）・
 * 言い方と注意書き（AC-21）・ライセンス表示（AC-25）・最初に読む量（AC-26）・フォントと画像（AC-28）・大きさ（AC-30）。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INITIAL_LIMIT_BYTES = 300 * 1024;        // AC-26：最初に読む量の上限 300KB
const REPO_LIMIT_BYTES = 100 * 1024 * 1024;    // AC-30：リポジトリ全体の上限 100MB
const SKIP_DIRS = [".git", "node_modules", ".venv"];

/**
 * ファイルを文字として読む。
 * @param {string} path video-check フォルダからの場所
 * @returns {string} 中身
 * @example read("index.html")
 */
function read(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

/**
 * main.js から import でたどれる JS ファイル（＝ページを開いたときに読むもの）を集める。
 * @param {string} path video-check フォルダからの場所
 * @param {Set<string>} found 見つけたもの
 * @returns {Set<string>} 見つけたもの
 * @example importGraph("js/main.js", new Set())
 */
function importGraph(path, found) {
  if (found.has(path)) {
    return found;
  }
  found.add(path);
  const pattern = /^import[^"']*["']([^"']+)["']/gm;
  for (const match of read(path).matchAll(pattern)) {
    importGraph(join(dirname(path), match[1]).replace(/\\/g, "/"), found);
  }
  return found;
}

/**
 * フォルダの中のファイルを全部集める（.git などは除く）。
 * @param {string} directory フォルダ
 * @returns {string[]} ファイルの場所
 * @example listFiles(ROOT)
 */
function listFiles(directory) {
  return readdirSync(directory).flatMap(function (name) {
    if (SKIP_DIRS.includes(name)) {
      return [];
    }
    const full = join(directory, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

const INITIAL_JS = Array.from(importGraph("js/main.js", new Set()));
const VIEW_FILES = ["index.html"].concat(listFiles(join(ROOT, "js")).map(function (full) {
  return full.slice(ROOT.length + 1).replace(/\\/g, "/");
}));

test("AC-2：「動画も結果もサーバーに送らず、保存もしません」の文が、最初の画面の文として用意されている", function () {
  assert.match(read("js/messages.js"), /動画も結果もサーバーに送らず、保存もしません/);
  assert.match(read("js/start_view.js"), /safeMini\(SAFE_ONE_LINE/);
});

test("AC-4：CSP があり、外への送信先は同じサイトと GoatCounter だけ", function () {
  const html = read("index.html");
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /connect-src 'self';/);
  assert.match(csp, /img-src 'self' https:\/\/yuceo\.goatcounter\.com;/);
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval';/);
  assert.match(csp, /form-action 'none'/);
  const external = csp.match(/https?:\/\/[^\s;]+/g);
  assert.deepStrictEqual(external, ["https://yuceo.goatcounter.com"]);
});

test("AC-3・5：動画・結果を保存・送信するコードがない（localStorage・IndexedDB・Cookie・POST・送信の関数）", function () {
  VIEW_FILES.forEach(function (path) {
    const text = read(path);
    assert.doesNotMatch(text, /localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|XMLHttpRequest|method:\s*["']POST/i, path);
  });
});

test("AC-13・27：文字起こしのライブラリとモデルは、ページを開いたときの読み込みに入っていない", function () {
  assert.ok(!INITIAL_JS.includes("js/transcribe_worker.js"), "Worker が最初に読み込まれている");
  INITIAL_JS.forEach(function (path) {
    assert.doesNotMatch(read(path), /^import[^\n]*vendor\//m, path);
  });
  assert.doesNotMatch(read("index.html"), /vendor\//);
  assert.match(read("js/transcribe_worker.js"), /allowRemoteModels = false/);
});

test("AC-21：「再生の多い動画と比べて」をどこにも使わず、注意書きの2文がある", function () {
  VIEW_FILES.forEach(function (path) {
    assert.doesNotMatch(read(path), /再生の多い動画と比べて/, path);
  });
  const messages = read("js/messages.js");
  assert.match(messages, /基準は伸びるショート動画の目安です。近づけても再生が伸びることは約束できません/);
  assert.match(messages, /文字起こしは完全ではありません/);
  assert.match(messages, /自分の動画＋許可を得た動画＋公開されている調査の目安/);
});

test("AC-25：ライブラリとモデルのライセンスが、画面の下と README に書いてある", function () {
  const messages = read("js/messages.js");
  const readme = read("README.md");
  [/Transformers\.js/, /Apache-2\.0/, /Whisper tiny/, /ONNX Runtime Web/].forEach(function (pattern) {
    assert.match(messages, pattern);
    assert.match(readme, pattern);
  });
});

test("AC-26：最初に開いたときに読む量（HTML・CSS・JS・基準の表）が300KB以下", function () {
  const files = ["index.html", "css/style.css", "data/baseline.json"].concat(INITIAL_JS);
  const total = files.reduce(function (sum, path) {
    return sum + statSync(join(ROOT, path)).size;
  }, 0);
  assert.ok(total <= INITIAL_LIMIT_BYTES, "最初に読む量 " + total + " バイト");
});

test("AC-28：Webフォントを読まず、画像ファイルを置いていない（置くなら SVG か WebP で 50KB 以下）", function () {
  assert.doesNotMatch(read("css/style.css"), /@font-face|@import|url\(/);
  assert.doesNotMatch(read("index.html"), /fonts\.googleapis|<img/);
  listFiles(ROOT).forEach(function (full) {
    const extension = extname(full).toLowerCase();
    assert.ok(![".png", ".jpg", ".jpeg", ".gif"].includes(extension), "画像ファイル " + full);
    if ([".svg", ".webp"].includes(extension)) {
      assert.ok(statSync(full).size <= 50 * 1024, full);
    }
  });
});

test("AC-30：置いているモデルは1つ（量子化した小さい版）だけで、全体は100MB以下", function () {
  const models = readdirSync(join(ROOT, "vendor", "models"));
  assert.deepStrictEqual(models, ["whisper-tiny"]);
  const onnxFiles = readdirSync(join(ROOT, "vendor", "models", "whisper-tiny", "onnx"));
  assert.ok(onnxFiles.every(function (name) { return name.endsWith("_quantized.onnx"); }), onnxFiles.join(","));
  const total = listFiles(ROOT).reduce(function (sum, full) {
    return sum + statSync(full).size;
  }, 0);
  assert.ok(total < REPO_LIMIT_BYTES, "全体 " + total + " バイト");
});
