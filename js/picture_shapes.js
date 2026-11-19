/*
 * picture_shapes.js：絵（ポンチ絵）の「形のデータ」だけをまとめたファイル（〔v2.1〕）
 * 中身：6つの項目の絵・はじめの3つの手順の絵・2択カードの絵・結果の見方の図・話す速さの図
 * 形は「タグの名前と属性」の並び（{tag, attrs, text}）で持つ。画面に描く処理は pictures.js。ここには画面の処理を書かない。
 * すべてオリジナルの線の絵。画像ファイルは使わない（AC-26〜28）。pictures.js・tests/pictures.test.js から使われる。
 */
import { HOWTO_TEXT, SPEECH_TEXT } from "./messages.js";

// 絵の大きさの決まり（仕様 8-7）。図の中の文字は 14px で描き、360px の画面でも縮まないようにする
export const PIC_TEXT_PX = 14;           // 図の中の文字の大きさ（13px 以上にするため）
export const HOWTO_VIEWBOX_WIDTH = 320;  // 結果の見方の図の横幅。360px の画面の中身の幅（320px）以下にして、縮まないようにする
export const SPEECH_VIEWBOX_WIDTH = 280; // 話す速さの図の横幅。カードの中の幅（約284px）以下にして、縮まないようにする

// 図で使う色（白い面の上で読みやすい濃さ。赤は使わない）
const COLOR_OK = "#127a3e";
const COLOR_NEAR = "#2563a8";   // css/style.css の --pic-on-light と同じ値
const COLOR_FAR = "#a14a00";
const COLOR_GRAY = "#5b5f66";
const COLOR_TEXT = "#16171a";
const COLOR_RULER = "#e3e5e9";      // ものさしの灰色
const COLOR_BAND = "#bfe3cc";       // 「伸びる動画の多く」の緑の帯
const COLOR_DOT_FILL = "#ffffff";   // 丸の中

// 結果の見方の図のものさし（座標。帯を動かすときはここだけ直す）
const RULER_LEFT = 10;
const RULER_WIDTH = 300;
const RULER_Y = 39;        // ものさしの上の位置
const RULER_HEIGHT = 10;
const BAND_LEFT = 112;
const BAND_WIDTH = 96;
const BAND_TICK_TOP = 26;  // 帯の端の目盛りの線の上と下
const BAND_TICK_BOTTOM = 34;
const DOT_Y = RULER_Y + RULER_HEIGHT / 2;   // 丸はものさしの真ん中の高さ

/**
 * 形を1つ作る。
 * @param {string} tag SVG のタグの名前（"path" など）
 * @param {object} attrs 属性
 * @param {string} [text] 中に入れる文字
 * @returns {{tag:string, attrs:object, text:(string|undefined)}} 形
 * @example shape("circle", {cx:5, cy:5, r:2})
 */
function shape(tag, attrs, text) {
  return { tag: tag, attrs: attrs, text: text };
}

/**
 * 線だけの道筋（path）。
 * @param {string} d 道筋
 * @param {object} [extra] 足す属性
 * @returns {object} 形
 * @example line("M0 0h5")
 */
function line(d, extra) {
  return shape("path", Object.assign({ d: d }, extra));
}

/**
 * 塗りつぶした道筋（現在の色で塗る）。
 * @param {string} d 道筋
 * @returns {object} 形
 * @example solid("M0 0l4 4z")
 */
function solid(d) {
  return line(d, { fill: "currentColor" });
}

/**
 * 角丸の四角。
 * @param {number} x 左
 * @param {number} y 上
 * @param {number} width 幅
 * @param {number} height 高さ
 * @param {number} radius 角の丸み
 * @param {object} [extra] 足す属性
 * @returns {object} 形
 * @example box(7, 7, 22, 18, 3)
 */
function box(x, y, width, height, radius, extra) {
  return shape("rect", Object.assign({ x: x, y: y, width: width, height: height, rx: radius }, extra));
}

/**
 * 図の中の文字。
 * @param {number} x 横の位置
 * @param {number} y 縦の位置
 * @param {string} text 文字
 * @param {{anchor:string, color:string, weight:number}} style 位置のそろえ方・色・太さ
 * @returns {object} 形
 * @example label(160, 18, "目安どおり", {anchor:"middle", color:"#127a3e", weight:700})
 */
function label(x, y, text, style) {
  return shape("text", {
    x: x, y: y, "text-anchor": style.anchor, "font-size": PIC_TEXT_PX, "font-weight": style.weight,
    fill: style.color, stroke: "none"
  }, text);
}

/**
 * 結果の見方の図の丸（白抜きの丸。縁の色で札が分かる）。
 * @param {number} x 横の位置
 * @param {string} color 縁の色
 * @returns {object} 形
 * @example dot(34, "#a14a00")
 */
function dot(x, color) {
  return shape("circle", { cx: x, cy: DOT_Y, r: 7.5, fill: COLOR_DOT_FILL, stroke: color, "stroke-width": 4 });
}

// 6つの項目の絵（32×32）。冒頭3秒＝画面が動き出す／切り替わり＝絵が次の絵へ／話す速さ＝吹き出し／音のない時間＝音が出ていない／長さ＝ものさし／つながり＝戻る矢印
export const AXIS_SHAPES = {
  opening: [box(7, 7, 22, 18, 3), solid("M15.5 12v8l6-4z"), line("M2 11h2.5M1 16h3.5M2 21h2.5")],
  cuts: [box(13, 4, 16, 13, 2), line("M13 10H3v13h16v-6"), line("M6 28h8m-3-3 3 3-3 3")],
  tempo: [line("M5 6h16a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-9l-5 4v-4H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"), line("M7 11h11M7 15h7"), line("M27 10h3M27 14h4M27 18h3")],
  silence: [line("M4 12h5l7-6v20l-7-6H4z"), line("M21 12l8 8M29 12l-8 8")],
  length: [line("M3 16h26M3 10v12M29 10v12M10 14v4M16 14v4M22 14v4")],
  loop: [line("M26 13a10 10 0 1 0 1 7"), line("M27 5v8h-8")]
};
export const AXIS_VIEWBOX = "0 0 32 32";

// はじめの3つの手順の絵（40×40）。選ぶ＝スマホの動画／待つ＝砂時計／分かる＝6つの点のうち1点が光る（光る色は CSS の pic-key）
export const STEP_SHAPES = [
  [box(11, 3, 18, 34, 4), solid("M17.5 15v10l8-5z")],
  [line("M12 4h16M12 36h16M14 4v3c0 6 12 7 12 13s-12 7-12 13v3M26 4v3c0 6-12 7-12 13s12 7 12 13v3"), line("M17 32h6", { "stroke-width": 3 })],
  [line("M20 6l12.1 7v14L20 34 7.9 27V13z"), line("M20 13l6 4-1 8-5 4-6-5 1-7z", { fill: "currentColor", "fill-opacity": 0.25 }),
    shape("circle", { cx: 20, cy: 6, r: 4.5, class: "pic-key" })]
];
export const STEP_VIEWBOX = "0 0 40 40";

// 2択カードの絵（40×40）。好きな動画＝動画を見て学ぶ（目の中に再生マーク）／自分で作った動画＝動画に直す印（えんぴつ）
export const MODE_SHAPES = {
  fan: [line("M3 20c4-8 10-11 17-11s13 3 17 11c-4 8-10 11-17 11S7 28 3 20z"), solid("M17.5 15v10l8-5z")],
  maker: [box(4, 6, 24, 20, 3), solid("M13 12v8l6-4z"), line("M20 34l1.5-6L33 16.5l4.5 4.5L26 32.5z"), line("M30.5 19l4.5 4.5")]
};
export const MODE_VIEWBOX = "0 0 40 40";

/**
 * 緑の帯の左右の端の目印の線（帯の位置から作るので、帯を動かしても一緒に動く）。
 * @returns {string} path の道筋
 * @example bandTicks() // "M112 26v8M208 26v8"
 */
function bandTicks() {
  const bandRight = BAND_LEFT + BAND_WIDTH;
  const tickLength = BAND_TICK_BOTTOM - BAND_TICK_TOP;
  return "M" + BAND_LEFT + " " + BAND_TICK_TOP + "v" + tickLength + "M" + bandRight + " " + BAND_TICK_TOP + "v" + tickLength;
}

// 結果の見方の図（320×104）。ものさしの緑の帯＝伸びる動画の多く／丸の位置で札が決まる
export const HOWTO_VIEWBOX = "0 0 " + HOWTO_VIEWBOX_WIDTH + " 104";
export const HOWTO_SHAPES = [
  label(160, 18, HOWTO_TEXT.base, { anchor: "middle", color: COLOR_OK, weight: 700 }),
  box(RULER_LEFT, RULER_Y, RULER_WIDTH, RULER_HEIGHT, RULER_HEIGHT / 2, { fill: COLOR_RULER, stroke: "none" }),
  shape("rect", { x: BAND_LEFT, y: RULER_Y, width: BAND_WIDTH, height: RULER_HEIGHT, fill: COLOR_BAND, stroke: "none" }),
  line(bandTicks(), { stroke: COLOR_OK, "stroke-width": 1.5 }),
  dot(34, COLOR_FAR), dot(160, COLOR_OK), dot(232, COLOR_NEAR),
  label(10, 76, HOWTO_TEXT.far, { anchor: "start", color: COLOR_FAR, weight: 700 }),
  label(160, 76, HOWTO_TEXT.ok, { anchor: "middle", color: COLOR_OK, weight: 700 }),
  label(244, 76, HOWTO_TEXT.near, { anchor: "middle", color: COLOR_NEAR, weight: 700 }),
  shape("circle", { cx: 104, cy: 96, r: 5, fill: COLOR_DOT_FILL, stroke: COLOR_GRAY, "stroke-width": 3 }),
  label(116, 100, HOWTO_TEXT.mine, { anchor: "start", color: COLOR_GRAY, weight: 400 })
];

/**
 * 話す速さの図の1つ分（絵と、その下の文字）を作る。
 * @param {number} centerX 中心の横の位置
 * @param {object[]} inner 絵の形
 * @param {string} text 下の文字
 * @returns {object[]} 形の並び（絵のグループと文字）
 * @example speechStep(40, [], "声")
 */
function speechStep(centerX, inner, text) {
  const group = shape("g", { transform: "translate(" + (centerX - 18) + ",2)" });
  group.children = inner;
  return [group, label(centerX, 60, text, { anchor: "middle", color: COLOR_TEXT, weight: 700 })];
}

/**
 * 話す速さの図の矢印。
 * @param {number} x 左の位置
 * @returns {object} 形
 * @example speechArrow(70)
 */
function speechArrow(x) {
  return line("M" + x + " 20h26m-6-5 6 5-6 5", { stroke: COLOR_GRAY });
}

// 話す速さの図（280×66）。声 → 文字 → 速さ
export const SPEECH_VIEWBOX = "0 0 " + SPEECH_VIEWBOX_WIDTH + " 66";
export const SPEECH_SHAPES = [].concat(
  speechStep(40, [line("M4 14v8M10 9v18M16 4v28M22 10v16M28 14v8M33 17v2")], SPEECH_TEXT.voice),
  [speechArrow(70)],
  speechStep(140, [box(6, 2, 24, 32, 3), line("M11 10h14M11 16h14M11 22h9")], SPEECH_TEXT.letters),
  [speechArrow(170)],
  speechStep(240, [line("M4 28a14 14 0 0 1 28 0"), line("M18 28l8-9"), shape("circle", { cx: 18, cy: 28, r: 2, fill: "currentColor" }),
    line("M8 18l2 2M18 13v3M28 18l-2 2")], SPEECH_TEXT.speed)
);
