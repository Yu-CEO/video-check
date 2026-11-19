/*
 * pictures.test.js：〔v2.1〕説明の文を絵にした所（仕様 8章・AC-46〜52）の自動テスト
 * ニセの画面（tests/fake_dom.js）に はじめの画面・結果の画面を組み立てて、見える文字・絵の読み上げ名・図の文字の大きさを確かめる。
 * 見た目（大きさ・色・360pxで崩れないか）は自動では確かめられないので、実機の目視で確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { installFakeDom, findAll, textOf } from "./fake_dom.js";

installFakeDom();   // js/ の画面のファイルを読み込む前に、ニセの画面を用意する

const { renderStart } = await import("../js/start_view.js");
const { renderReport } = await import("../js/report_view.js");
const { renderProgress } = await import("../js/progress_view.js");
const { speechCard } = await import("../js/speech_card.js");
const { axisPicture, stepPicture, modePicture, howtoPicture, speechPicture } = await import("../js/pictures.js");
const { nameParts } = await import("../js/axis_card.js");
const { scoreAll } = await import("../js/score.js");
const shapes = await import("../js/picture_shapes.js");
const { AXIS_IDS } = await import("../js/config.js");
const { AXIS_TEXT, MODE_TEXT, HOWTO_TEXT, SPEECH_TEXT, STEP_TEXT } = await import("../js/messages.js");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_FONT_PX = 13;   // AC-52：図の中の文字の最小
const MIN_BUTTON_PX = 44; // AC-47：2択カードの高さの最小
const RADAR_BOX_PX = 284;   // 360px の画面でチャートが描かれる幅（中身320px−カードの余白18px×2）
const RADAR_VIEWBOX_PX = 320;  // チャートの図の横幅（js/radar_chart.js の WIDTH）
const REQUIRED_CUT_RATE = 0.15;   // AC-53：結果の文字を v2.0 より15%以上減らす
const SCREEN_CONTENT_PX = 320;    // 360px の画面から左右の余白（20px ずつ）を引いた幅
// v2.0 の公開版で最初に目に入る文字数（design_notes の「減った文字」の表。畳んだ中・図の中の文字は数えない）
const V2_0 = { start: 220, fan: 571, maker: 610 };
const BASELINE = JSON.parse(readFileSync(join(ROOT, "data/baseline.json"), "utf8"));
const VALUES = { opening: 3, cuts: 4, tempo: null, silence: 3, length: 48, loop: 58 };   // 合成の測った値（話す速さだけ未測定）

/**
 * 結果の画面の材料（合成）を作る。
 * @param {"fan"|"maker"} mode 見方
 * @returns {object} レポートの材料
 * @example sampleReport("fan")
 */
function sampleReport(mode) {
  return {
    fileName: "sample.mp4", durationSec: 48, elapsedSec: 40, values: VALUES, baseline: BASELINE,
    scores: scoreAll(VALUES, BASELINE), hasSound: true, endsSilent: false, audio: null,
    speech: { phase: "idle", percent: 0 }, mode: mode
  };
}

/**
 * ニセの画面に、結果の画面を組み立てて返す。
 * @param {"fan"|"maker"} mode 見方
 * @returns {object} 組み立てた画面の外側
 * @example renderedReport("maker")
 */
function renderedReport(mode) {
  const app = document.createElement("div");
  renderReport(app, sampleReport(mode), { onRestart() {}, onSpeechStart() {}, onSpeechCancel() {}, onSwitchMode() {} });
  return app;
}

/**
 * ニセの画面に、はじめの画面を組み立てて返す。
 * @returns {object} 組み立てた画面の外側
 * @example renderedStart()
 */
function renderedStart() {
  const app = document.createElement("div");
  renderStart(app, { mode: "fan", errorKey: "", errorFile: "", baseline: BASELINE, onPick() {}, onModeChange() {} });
  return app;
}

/**
 * 閉じている箱（details）の中身の部分かどうか。
 * @param {object} node 部品
 * @returns {boolean} 中身（fold-body・item-body）なら true
 * @example isFoldedPart(node)
 */
function isFoldedPart(node) {
  const names = node.className.split(" ");
  return names.includes("fold-body") || names.includes("item-body");
}

/**
 * 部品の中の最初の絵（svg）を返す。
 * @param {object} root 探す部品
 * @returns {object} 最初の絵
 * @example firstPicture(card)
 */
function firstPicture(root) {
  return findAll(root, function (node) { return node.tagName === "svg"; })[0];
}

/**
 * 閉じている箱（details）の中の文字を除いた、見える文字を返す。
 * @param {object} app 組み立てた画面
 * @returns {string} 見える文字
 * @example visibleText(app)
 */
function visibleText(app) {
  const hidden = findAll(app, isFoldedPart);
  let text = textOf(app);
  hidden.forEach(function (node) { text = text.replace(textOf(node), ""); });
  return text;
}

test("AC-46：はじめの画面に 見出しの下の1文と、絵＋「選ぶ」「待つ」「分かる」・「PC 約1分」があり、スマホの時間・「仮」が無い", function () {
  const text = textOf(renderedStart());
  assert.ok(text.includes("伸びる動画の目安と、6つの点で比べます。"));
  assert.ok(!text.includes("動画を1本入れるだけで"));
  const flow = findAll(renderedStart(), function (node) { return node.className === "flow"; })[0];
  assert.strictEqual(findAll(flow, function (node) { return node.tagName === "li"; }).length, 3);
  assert.strictEqual(findAll(flow, function (node) { return node.tagName === "svg"; }).length, 3);
  assert.strictEqual(textOf(flow), "選ぶ待つPC 約1分分かる");
  ["スマホ 約", "約2分", "仮"].forEach(function (word) {
    assert.ok(!text.includes(word), word);
  });
  assert.ok(text.includes("3分・200MBまで。時間は60秒の動画の目安です。"));
});

test("AC-46：調べている画面は「PCなら約1分ほど」だけで、スマホの時間を出さない", function () {
  const app = document.createElement("div");
  renderProgress(app, { name: "a.mp4", durationSec: 48, bytes: 1024 * 1024 }, function () {});
  const text = textOf(app);
  assert.ok(text.includes("PCなら約1分ほど"));
  ["スマホ", "約2分", "仮"].forEach(function (word) {
    assert.ok(!text.includes(word), word);
  });
});

test("AC-47：2択カードは 絵＋名前。説明の文は画面の文字に無く、絵の読み上げ名に入っている", function () {
  const group = findAll(renderedStart(), function (node) { return node.tagName === "fieldset"; })[0];
  const cards = findAll(group, function (node) { return node.className === "opt"; });
  assert.strictEqual(cards.length, 2);
  const names = cards.map(function (card) { return textOf(card); });
  assert.deepStrictEqual(names, ["好きな動画", "自分で作った動画"]);
  assert.ok(!textOf(group).includes("伸びる動画の作りが分かる"));
  assert.ok(!textOf(group).includes("直すところが1つ分かる"));
  const labels = cards.map(function (card) {
    const picture = firstPicture(card);
    return picture.getAttribute("aria-label");
  });
  assert.ok(labels[0].includes("伸びる動画の作りが分かる"));
  assert.ok(labels[1].includes("直すところが1つ分かる"));
  const checked = findAll(group, function (node) { return node.tagName === "input" && node.checked === true; });
  assert.strictEqual(checked.length, 1);
  assert.strictEqual(checked[0].value, "fan");
});

test("AC-47：2択カードの高さ44px以上と、選んだ印が色だけでない（CSS を読んで確かめる）", function () {
  const css = readFileSync(join(ROOT, "css/style.css"), "utf8");
  const minHeight = css.match(/\.opt-box\{[^}]*min-height:(\d+)px/);
  assert.ok(minHeight && Number(minHeight[1]) >= MIN_BUTTON_PX, "カードの高さ");
  assert.match(css, /\.opt input:checked \+ \.opt-box\{[^}]*box-shadow:inset/, "選んだ枠の太さ");
  assert.match(css, /\.opt input:checked \+ \.opt-box::before\{[^}]*background/, "選んだまるの塗り");
});

test("AC-48：「調べる6つのこと」は 絵＋名前だけで、説明の文が無い", function () {
  const list = findAll(renderedStart(), function (node) { return node.className === "axes6"; })[0];
  const items = findAll(list, function (node) { return node.tagName === "li"; });
  assert.strictEqual(items.length, 6);
  AXIS_IDS.forEach(function (axisId, index) {
    assert.strictEqual(textOf(items[index]), AXIS_TEXT[axisId].name);
    assert.strictEqual(findAll(items[index], function (node) { return node.tagName === "svg"; }).length, 1);
    assert.ok(!textOf(list).includes(AXIS_TEXT[axisId].what), axisId);
  });
  assert.ok(textOf(renderedStart()).includes("話す速さを測るかは、結果の画面で選べます。"));
});

test("AC-48：結果の「ほかの項目」の行は 絵＋名前＋札だけで、開いた中の先頭に「何を測ったか」がある", function () {
  const rows = findAll(renderedReport("maker"), function (node) { return node.tagName === "details" && node.className.startsWith("item"); });
  assert.strictEqual(rows.length, 5);
  rows.forEach(function (row) {
    const summary = row.children[0];
    const body = row.children[1];
    const axisId = row.id.replace("ax-", "");
    assert.ok(!textOf(summary).includes(AXIS_TEXT[axisId].what), axisId + "の行に説明の文がある");
    assert.strictEqual(findAll(summary, function (node) { return node.tagName === "svg"; }).length, 1);
    assert.strictEqual(body.children[0].className, "wt");
    assert.strictEqual(textOf(body.children[0]), AXIS_TEXT[axisId].what);
  });
  assert.ok(AXIS_TEXT.silence.what.includes("例：60秒で3秒なら5%"));
});

test("AC-48：長い項目名は「の」の後で折り返し、1文字だけ次の行に落ちない", function () {
  assert.deepStrictEqual(nameParts("終わりと始まりのつながり"), ["終わりと始まりの", "つながり"]);
  assert.deepStrictEqual(nameParts("冒頭3秒の絵の動き"), ["冒頭3秒の絵の動き"]);
  assert.deepStrictEqual(nameParts("話す速さ"), ["話す速さ"]);
  AXIS_IDS.forEach(function (axisId) {
    nameParts(AXIS_TEXT[axisId].name).forEach(function (part) {
      assert.ok(part.length >= 2, AXIS_TEXT[axisId].name + "の分け方で1文字が残る");
    });
  });
});

test("AC-49：結果の見方の図が1回だけ出て、上の文が見方で変わり、点数の表示が読み替わる", function () {
  const maker = renderedReport("maker");
  const fan = renderedReport("fan");
  [maker, fan].forEach(function (app) {
    const howtos = findAll(app, function (node) { return node.className === "howto"; });
    assert.strictEqual(howtos.length, 1);
    const figureText = textOf(howtos[0], { withSvgText: true });
    [HOWTO_TEXT.base, HOWTO_TEXT.ok, HOWTO_TEXT.near, HOWTO_TEXT.far, HOWTO_TEXT.mine].forEach(function (word) {
      assert.ok(figureText.includes(word), word);
    });
  });
  assert.ok(textOf(maker).includes("直したほうがよい順。押すと開きます。"));
  assert.ok(textOf(fan).includes("伸びる作りに近い順。押すと開きます。"));
  assert.ok(textOf(maker).includes("点数 "), "点数の行");
  assert.ok(textOf(maker).includes(" / 100（80以上で目安どおり）"));
  assert.ok(!textOf(maker).includes("伸びる動画の多くと同じなら80以上"));
});

test("AC-50：話す速さの欄に 図・「声も文字も外には送りません。」・札2つがボタンの前にあり、モデルの読み込みは始まらない", function () {
  const card = speechCard({ phase: "idle", percent: 0 }, { onStart() {}, onCancel() {} });
  const text = textOf(card);
  assert.ok(text.includes("声も文字も外には送りません。"));
  assert.ok(text.includes("初回だけ 約66MB・Wi-Fiで"));
  assert.ok(text.includes("1分の動画で約20秒"));
  assert.strictEqual(findAll(card, function (node) { return node.tagName === "svg"; }).length, 1);
  const order = card.children.map(function (child) { return child.className || child.tagName; });
  assert.ok(order.indexOf("tags") < order.indexOf("btn btn-main"), "札はボタンの上");
  assert.ok(!text.includes("動画の声を文字にして、1秒あたりの文字数を出します"));
  const speechCardSource = readFileSync(join(ROOT, "js/speech_card.js"), "utf8");
  assert.doesNotMatch(speechCardSource, /import\(|transcribe/, "押す前に文字起こしを読み込まない");
});

test("AC-51：意味のある絵はすべて role=img と読み上げ名を持ち、名前が置き換えた文の中身を含む", function () {
  const meaningful = [
    [stepPicture(0), STEP_TEXT[0].label], [stepPicture(1), STEP_TEXT[1].label], [stepPicture(2), STEP_TEXT[2].label],
    [modePicture("fan"), MODE_TEXT.fan.sub], [modePicture("maker"), MODE_TEXT.maker.sub],
    [howtoPicture(), "帯の中なら目安どおり"], [speechPicture(), "動画の声を文字にして、話す速さを出します"]
  ];
  meaningful.forEach(function (pair) {
    assert.strictEqual(pair[0].getAttribute("role"), "img");
    assert.ok(pair[0].getAttribute("aria-label").includes(pair[1]), pair[1]);
  });
  AXIS_IDS.forEach(function (axisId) {
    const picture = axisPicture(axisId);   // 隣に名前の文字が出る飾りの絵
    assert.strictEqual(picture.getAttribute("aria-hidden"), "true", axisId);
    assert.ok(picture.children.length > 0, axisId + "の絵が空");
  });
  assert.strictEqual(shapes.PIC_TEXT_PX >= MIN_FONT_PX, true);
});

test("AC-51：画像ファイルを読み込まない（絵はすべてインライン SVG・画像のファイルが増えていない）", function () {
  const jsDir = join(ROOT, "js");
  readdirSync(jsDir).filter(function (name) { return name.startsWith("picture"); }).forEach(function (name) {
    const source = readFileSync(join(jsDir, name), "utf8");
    assert.doesNotMatch(source, /\.(png|jpe?g|gif|webp|svg)["'`)]|new Image|<img|fetch\(|innerHTML/, name);
  });
  const files = readdirSync(ROOT, { recursive: true }).map(String).filter(function (name) {
    return !name.startsWith("docs") && !name.startsWith("vendor") && !name.startsWith("node_modules") && !name.startsWith(".git") && /\.(png|jpe?g|gif|webp)$/i.test(name);
  });
  assert.deepStrictEqual(files, []);
  assert.match(readFileSync(join(ROOT, "index.html"), "utf8"), /img-src 'self' https:\/\/yuceo\.goatcounter\.com/);
});

test("AC-52：図の中の文字が14px、図の横幅が360px画面の中身の幅以下で、縮んでも13px以上", function () {
  const texts = shapes.HOWTO_SHAPES.concat(shapes.SPEECH_SHAPES).filter(function (item) { return item.tag === "text"; });
  assert.ok(texts.length >= 8);
  texts.forEach(function (item) {
    assert.ok(item.attrs["font-size"] >= MIN_FONT_PX, item.text);
  });
  assert.ok(shapes.HOWTO_VIEWBOX_WIDTH <= SCREEN_CONTENT_PX);
  assert.ok(shapes.SPEECH_VIEWBOX_WIDTH <= SCREEN_CONTENT_PX);
  assert.ok(findAll(speechPicture(), function (node) { return node.tagName === "text"; }).length === 3);
  assert.deepStrictEqual(findAll(speechPicture(), function (node) { return node.tagName === "text"; }).map(textOf),
    [SPEECH_TEXT.voice, SPEECH_TEXT.letters, SPEECH_TEXT.speed]);
});

test("AC-52：絵のスタイルは CSS の変数で決め（赤を使わない）、図の文字以外の飾りの文字を絵に入れない", function () {
  const css = readFileSync(join(ROOT, "css/style.css"), "utf8");
  ["--pic-on-night:#7cc4ff", "--pic-on-light:#2563a8", "--pic-key-night:#ffb36b", "--pic-step-icon:36px", "--pic-axis-icon:28px"].forEach(function (rule) {
    assert.ok(css.includes(rule), rule);
  });
  [axisPicture("opening"), stepPicture(2), modePicture("maker")].forEach(function (picture) {
    assert.deepStrictEqual(findAll(picture, function (node) { return node.tagName === "text"; }), []);
  });
});

test("AC-53：360px の結果・はじめの最初に目に入る文字が、v2.0 の公開版（はじめ220字・結果 好きな動画571字／自分の動画610字）より減っている", function () {
  const start = visibleText(renderedStart()).length;
  const fan = visibleText(renderedReport("fan")).length;
  const maker = visibleText(renderedReport("maker")).length;
  assert.ok(start < V2_0.start, "はじめ " + start);
  assert.ok(fan <= V2_0.fan * (1 - REQUIRED_CUT_RATE), "好きな動画 " + fan);
  assert.ok(maker <= V2_0.maker * (1 - REQUIRED_CUT_RATE), "自分の動画 " + maker);
});

test("AC-52：「全体の形」の軸の文字が、360px で縮んでも13px以上になる", function () {
  const css = readFileSync(join(ROOT, "css/style.css"), "utf8");
  const size = css.match(/--radar-label-size:(\d+(?:\.\d+)?)px/);
  assert.ok(size, "軸の文字の大きさの設定値がある");
  const effective = Number(size[1]) * RADAR_BOX_PX / RADAR_VIEWBOX_PX;
  assert.ok(effective >= MIN_FONT_PX, "実際の大きさ " + effective.toFixed(1) + "px");
  assert.match(css, /\.r-label\{[^}]*font-size:var\(--radar-label-size\)/);
  assert.match(css, /\.r-none-text\{[^}]*font-size:var\(--radar-label-size\)/);
});
