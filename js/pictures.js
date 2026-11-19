/*
 * pictures.js：絵（ポンチ絵）を画面の部品（SVG）にして返す〔v2.1〕
 * 主な関数：axisPicture（6項目）、stepPicture（3つの手順）、modePicture（2択カード）、howtoPicture（結果の見方）、speechPicture（話す速さ）
 * 形のデータは picture_shapes.js、読み上げ用の名前は messages.js にある。ここは「組み立てるだけ」で、文章は持たない。
 * 意味のある絵は role="img"＋読み上げ用の名前を付ける（画面読み上げでは文が減らないように）。飾りだけの絵は aria-hidden（読み上げない印）にする。
 * start_view.js・view_mode.js・more_view.js・axis_card.js・report_view.js・speech_card.js から使われる。
 */
import { svgEl } from "./dom.js";
import {
  AXIS_SHAPES, AXIS_VIEWBOX, STEP_SHAPES, STEP_VIEWBOX, MODE_SHAPES, MODE_VIEWBOX,
  HOWTO_SHAPES, HOWTO_VIEWBOX, SPEECH_SHAPES, SPEECH_VIEWBOX
} from "./picture_shapes.js";
import { STEP_TEXT, MODE_PICTURE_LABEL, HOWTO_TEXT, SPEECH_TEXT } from "./messages.js";

const LINE_WIDTH = 2;   // 線の太さ（絵の座標での値。32〜40の大きさの絵で細すぎず太すぎない）

/**
 * 形のデータを SVG の要素にする（入れ子の形にも対応）。
 * @param {{tag:string, attrs:object, text:(string|undefined), children:(object[]|undefined)}} item 形
 * @returns {SVGElement} 要素
 * @example buildShape({tag:"path", attrs:{d:"M0 0h5"}})
 */
function buildShape(item) {
  const element = svgEl(item.tag, item.attrs, item.text);
  if (item.children) {
    item.children.forEach(function (child) {
      element.append(buildShape(child));
    });
  }
  return element;
}

/**
 * 絵の入れ物（svg）を作る。読み上げ用の名前があれば意味のある絵、なければ飾りの絵にする。
 * @param {string} viewBox 絵の座標の範囲
 * @param {object[]} shapes 形のデータ
 * @param {string} [readingLabel] 読み上げ用の名前（飾りだけなら省く）
 * @returns {SVGElement} 絵
 * @example makePicture("0 0 32 32", AXIS_SHAPES.loop, "終わりと始まりのつながり")
 */
function makePicture(viewBox, shapes, readingLabel) {
  const svg = svgEl("svg", {
    viewBox: viewBox, fill: "none", stroke: "currentColor", "stroke-width": LINE_WIDTH,
    "stroke-linecap": "round", "stroke-linejoin": "round", focusable: "false"
  });
  if (readingLabel) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", readingLabel);
  } else {
    svg.setAttribute("aria-hidden", "true");
  }
  shapes.forEach(function (item) {
    svg.append(buildShape(item));
  });
  return svg;
}

/**
 * 6つの項目の絵。隣に名前の文字が出るので、飾りの絵にする（読み上げは名前の文字に任せる）。
 * @param {string} axisId 項目の名前（"opening" など）
 * @returns {SVGElement} 絵
 * @example axisPicture("silence")
 */
export function axisPicture(axisId) {
  return makePicture(AXIS_VIEWBOX, AXIS_SHAPES[axisId], "");
}

/**
 * はじめの3つの手順の絵（0＝選ぶ、1＝待つ、2＝分かる）。
 * @param {number} index 手順の番号（0〜2）
 * @returns {SVGElement} 絵
 * @example stepPicture(1)
 */
export function stepPicture(index) {
  return makePicture(STEP_VIEWBOX, STEP_SHAPES[index], STEP_TEXT[index].label);
}

/**
 * 2択カードの絵。読み上げ用の名前に、画面から外した説明の文を入れる。
 * @param {"fan"|"maker"} mode 見方
 * @returns {SVGElement} 絵
 * @example modePicture("fan")
 */
export function modePicture(mode) {
  return makePicture(MODE_VIEWBOX, MODE_SHAPES[mode], MODE_PICTURE_LABEL[mode]);
}

/**
 * 結果の見方の図（ものさしと丸3つ）。
 * @returns {SVGElement} 図
 * @example howtoPicture()
 */
export function howtoPicture() {
  return makePicture(HOWTO_VIEWBOX, HOWTO_SHAPES, HOWTO_TEXT.label);
}

/**
 * 話す速さの図（声 → 文字 → 速さ）。
 * @returns {SVGElement} 図
 * @example speechPicture()
 */
export function speechPicture() {
  const svg = makePicture(SPEECH_VIEWBOX, SPEECH_SHAPES, SPEECH_TEXT.label);
  svg.setAttribute("class", "speech-pic");
  return svg;
}
