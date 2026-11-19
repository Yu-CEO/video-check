/*
 * v2_checks.test.js：初心者向けの画面（仕様 7章・AC-31〜45）を、ファイルの中身を読んで確かめる自動テスト
 * 文言が仕様と1字も違わないこと（AC-39）・画面に版・本数・「仮」が出ないこと（AC-40）・約束に見える言い方がないこと（AC-42）・
 * 13px未満の文字がないこと（AC-43）・次の行動と「← Yu」（AC-38）などを確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AXIS_TEXT, LEVEL_LABEL, MODE_TEXT, SAFE_TEXT, SAFE_ONE_LINE, CAUTION_BASELINE, OTHERS_VIDEO_NOTE, NEXT_AGAIN, NEXT_BACK, PORTAL_URL,
  START_ERRORS, PICK_NOTE, ITEMS_LEAD, HOW_BASELINE_MADE, BASELINE_TRIAL, KEY_LABEL
} from "../js/messages.js";
import { DEFAULT_MODE } from "../js/view_mode.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_FONT_PX = 13;   // AC-43：これより小さい文字を使わない

/**
 * ファイルを文字として読む。
 * @param {string} path video-check フォルダからの場所
 * @returns {string} 中身
 * @example read("js/messages.js")
 */
function read(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

/**
 * js フォルダの全ファイルの場所。
 * @returns {string[]} 場所の一覧
 * @example jsFiles()
 */
function jsFiles() {
  return readdirSync(join(ROOT, "js")).filter(function (name) {
    return name.endsWith(".js");
  }).map(function (name) {
    return "js/" + name;
  });
}

/**
 * 画面に出る文章（messages.js の文字列すべて）を1つの文字にまとめる。
 * @param {object} value 文章の入れ物
 * @returns {string} まとめた文字
 * @example collectText({a: "あ", b: {c: "い"}}) // "あ\nい"
 */
function collectText(value) {
  if (typeof value === "string") {
    return value;
  }
  return Object.values(value).map(collectText).join("\n");
}

test("AC-39：2-① の全文が、仕様の文と1字も違わない（動画の扱いに置く）", function () {
  // docs/ は公開しない（.gitignore）ので、CI（docs が無い環境）では仕様との照合だけ飛ばす
  if (existsSync(join(ROOT, "docs/requirements.md"))) {
    assert.ok(read("docs/requirements.md").includes("「" + SAFE_TEXT + "」"), "仕様 2-① と違う");
  }
  assert.ok(SAFE_TEXT.includes(SAFE_ONE_LINE), "1行の文は全文の一部");
  assert.match(read("js/more_view.js"), /part\("動画の扱い", \[SAFE_TEXT\]\)/);
});

test("AC-39：注意書きの文が元の仕様と1字も違わない（大事な1点のすぐ下・人の動画を入れるとき）", function () {
  assert.strictEqual(CAUTION_BASELINE, "基準は伸びるショート動画の目安です。近づけても再生が伸びることは約束できません。");
  assert.strictEqual(OTHERS_VIDEO_NOTE, "端末に保存できた動画を、自分で見て学ぶためだけに使ってください。結果を人に見せるときは、相手の名前や動画が分からない形にしてください。");
  assert.match(read("js/report_view.js"), /keyCard\([^\n]+\), el\("p", "key-caution", CAUTION_BASELINE\)/);
});

test("AC-39：「くわしく知りたい人へ」に 計測・比べている目安・人の動画・話す速さの読み込み・ライセンス・投資の助言ではない がある", function () {
  const more = read("js/more_view.js");
  ["動画の扱い", "計測", "比べている目安", "人の動画を入れるとき", "話す速さの読み込み", "選べる動画", "ライセンス", "このツールについて"].forEach(function (heading) {
    assert.ok(more.includes('"' + heading), heading);
  });
  ["FOOT_ANALYTICS", "FOOT_LICENSE", "FOOT_NOT_ADVICE", "CAUTION_TRANSCRIBE", "baseline.created"].forEach(function (name) {
    assert.ok(more.includes(name), name);
  });
  assert.match(read("js/dom.js"), /el\("details", "fold"\)/, "最初は閉じている（open を付けない）");
  assert.doesNotMatch(read("js/dom.js"), /\.open\s*=|setAttribute\("open"/);
});

test("AC-40：画面のどこにも版番号・本数・「仮」の札・試作の切り替えが出ない", function () {
  ["js/more_view.js", "js/report_view.js", "js/start_view.js", "js/axis_card.js", "js/key_card.js", "js/speech_card.js", "js/progress_view.js"].forEach(function (path) {
    const text = read(path);
    assert.doesNotMatch(text, /baseline\.version|baseline\.count|countText\(|"仮"|仮の基準|確認用・試作/, path);
  });
  const messages = collectText({ AXIS_TEXT, LEVEL_LABEL, MODE_TEXT, START_ERRORS, PICK_NOTE, ITEMS_LEAD, HOW_BASELINE_MADE, BASELINE_TRIAL });
  assert.doesNotMatch(messages, /○本|版番号|もとにした動画/);
  assert.doesNotMatch(read("js/messages.js"), /仮の基準/);
});

test("AC-42：見る人向けの文・はじめの画面の文に、約束・すすめに見える言い方がない", function () {
  const text = collectText({ AXIS_TEXT, MODE_TEXT, KEY_LABEL, PICK_NOTE, ITEMS_LEAD, BASELINE_TRIAL });
  assert.doesNotMatch(text, /おすすめ|オススメ|必ず|伸びます|間違いなく|絶対/);
  assert.doesNotMatch(read("js/start_view.js"), /おすすめ|必ず|伸びます/);
});

test("AC-37：項目名と札が新しい言葉で、古い言い方が単独で出ない・札に赤を使わない", function () {
  assert.deepStrictEqual(LEVEL_LABEL, { ok: "目安どおり", near: "少しずれ", far: "伸びしろあり", none: "未測定" });
  const names = Object.values(AXIS_TEXT).map(function (axis) { return axis.name; });
  assert.deepStrictEqual(names, ["冒頭3秒の絵の動き", "絵の切り替わり", "話す速さ", "音のない時間", "動画の長さ", "終わりと始まりのつながり"]);
  const screenText = collectText({ AXIS_TEXT, LEVEL_LABEL, KEY_LABEL });
  assert.doesNotMatch(screenText, /無音の少なさ|最後の切れ目|少し外れています|絵の変化の頻度/);
  const css = read("css/style.css");
  assert.doesNotMatch(css, /--vc-[a-z]+:\s*#(?:d[0-9a-f]{2}|e[0-9a-f]{2}|f[0-9a-f]{2})0{2}\b/i);
  assert.doesNotMatch(css, /\bred\b|crimson/i);
});

test("AC-36：全体の形のチャートに、軸の数字・点数を描かない", function () {
  const chart = read("js/radar_chart.js");
  assert.doesNotMatch(chart, /r-score|scores\[axisId\]\)\s*\)|String\(score\)/);
  assert.match(read("js/report_view.js"), /sectionTitle\("全体の形"\)/);
  assert.match(read("js/axis_card.js"), /点数 " \+ item\.score \+ " \/ 100（伸びる動画の多くと同じなら80以上）/);
});

test("AC-38：次の行動の2ボタンと「← Yu」が portal を指す。「もう一度」ははじめの画面へ戻る", function () {
  assert.strictEqual(NEXT_AGAIN, "別の動画でもう一度");
  assert.strictEqual(NEXT_BACK, "Yuのページへ戻る");
  assert.strictEqual(PORTAL_URL, "https://yu-ceo.github.io/");
  assert.match(read("index.html"), /class="bar-logo" href="https:\/\/yu-ceo\.github\.io\/"/);
  assert.match(read("js/main.js"), /onRestart: function \(\) \{ showStart\("", ""\); \}/);
});

test("AC-31：はじめの画面に問いかけ・2択（好きな動画が初期）・3つの手順・選ぶボタン・送らない1行がある", function () {
  const start = read("js/start_view.js");
  assert.match(start, /伸びるショート動画は、/);
  assert.match(start, /どこが違う？/);
  assert.match(start, /modeChoice\(options\.mode/);
  assert.match(start, /safeMini\(SAFE_ONE_LINE, true\)/);
  assert.strictEqual(DEFAULT_MODE, "fan");
  assert.strictEqual(MODE_TEXT.fan.name, "好きな動画");
  assert.strictEqual(MODE_TEXT.maker.name, "自分で作った動画");
});

test("AC-20：スマホの待ち時間は 実測するまで画面に出さない（試作の「約2分」を入れない）", function () {
  const config = read("js/config.js");
  assert.match(config, /PHONE_WAIT_TEXT = null/);
  jsFiles().forEach(function (path) {
    assert.doesNotMatch(read(path), /約2分/, path);
  });
});

test("AC-43：CSS に 13px 未満の文字がなく、本文は16px以上、押す場所は44px以上", function () {
  const css = read("css/style.css");
  for (const match of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
    assert.ok(Number(match[1]) >= MIN_FONT_PX, "文字が小さい：" + match[0]);
  }
  assert.match(css, /--fs-body:clamp\(16px/);
  assert.match(css, /--btn-height:52px/);
  assert.match(css, /--btn-height-sub:44px/);
});

test("AC-41：好きな動画の見方でも、通信するコードが増えていない（fetch は基準の表の読み込みだけ）", function () {
  jsFiles().forEach(function (path) {
    const text = read(path);
    if (path === "js/baseline.js") {
      return;
    }
    assert.doesNotMatch(text, /\bfetch\(|new WebSocket|navigator\.sendBeacon|new XMLHttpRequest/, path);
  });
});

test("AC-35：測れた項目が1つも無いときも、注意1行を出す（目安の表が読めないときだけ出さない）", function () {
  const view = read("js/report_view.js");
  assert.match(view, /options\.keyPoint === null\) \{[^}]*key-caution", CAUTION_BASELINE/);
  assert.match(view, /else if \(keyAxisId !== null\)/, "並べている説明は、測れた項目があるときだけ");
});
