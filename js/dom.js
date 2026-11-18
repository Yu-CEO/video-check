/*
 * dom.js：画面の部品を作る小さな道具（要素を作る・SVGを作る・盾の印・「送らない」の箱・見出し・フッター）
 * 主な関数：el、svgEl、shieldIcon、safeBox、safeMini、sectionTitle、messageBox、footer
 * 文字は textContent で入れる（ファイル名などに記号が入っていても、画面の部品として動かないようにするため）。
 * start_view.js・progress_view.js・report_view.js などから使われる。
 */
import {
  SAFE_TITLE, SAFE_FACE, SAFE_TEXT, FOOT_ANALYTICS, FOOT_LICENSE, FOOT_NOT_ADVICE
} from "./messages.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * HTML の要素を作る。
 * @param {string} tag 要素の名前（"div" など）
 * @param {string} [className] 見た目の名前（CSS のクラス）
 * @param {string} [text] 中に入れる文字
 * @returns {HTMLElement} 作った要素
 * @example el("p", "lead", "説明")
 */
export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  return element;
}

/**
 * SVG（線や形で描く絵）の要素を作る。
 * @param {string} tag 要素の名前（"path" など）
 * @param {object} attributes 属性 例 {d:"M0 0", class:"r-me"}
 * @param {string} [text] 中に入れる文字
 * @returns {SVGElement} 作った要素
 * @example svgEl("circle", {cx:10, cy:10, r:4})
 */
export function svgEl(tag, attributes, text) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.keys(attributes).forEach(function (name) {
    element.setAttribute(name, String(attributes[name]));
  });
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  return element;
}

/**
 * 盾の印（送らない・保存しない）。画像ファイルは使わず SVG で描く（AC-28）。
 * @param {number} size 大きさ（px）
 * @returns {SVGElement} 盾の絵
 * @example shieldIcon(36)
 */
export function shieldIcon(size) {
  const svg = svgEl("svg", { viewBox: "0 0 36 36", "aria-hidden": "true", width: size, height: size, class: "shield" });
  svg.append(svgEl("path", { d: "M18 3 L31 8 V17 C31 25 25.5 30.5 18 33 C10.5 30.5 5 25 5 17 V8 Z", class: "shield-body" }));
  svg.append(svgEl("path", { d: "M12 18 L16.5 22.5 L24.5 13.5", class: "shield-check" }));
  return svg;
}

/**
 * 「送らない・保存しない」の箱（最初の画面。選ぶボタンのすぐ上＝AC-2）。
 * @returns {HTMLElement} 箱
 * @example safeBox()
 */
export function safeBox() {
  const box = el("div", "safe");
  box.setAttribute("role", "note");
  const body = el("div");
  body.append(el("h2", null, SAFE_TITLE), el("p", "safe-face", SAFE_FACE), el("p", null, SAFE_TEXT));
  box.append(shieldIcon(36), body);
  return box;
}

/**
 * 処理中・結果の画面で出す、短い「送っていません」の1行。
 * @param {string} text 文
 * @returns {HTMLElement} 1行
 * @example safeMini("外には何も送っていません")
 */
export function safeMini(text) {
  const line = el("p", "safe-mini");
  line.append(shieldIcon(18), el("span", null, text));
  return line;
}

/**
 * 区画の見出し（「01 わかること」の形）。
 * @param {string} number 番号の文字
 * @param {string} text 見出し
 * @returns {HTMLElement} 見出し
 * @example sectionTitle("01", "わかること（6つ）")
 */
export function sectionTitle(number, text) {
  const heading = el("h2", "sec-title");
  heading.append(el("span", "num", number), text);
  return heading;
}

/**
 * エラーや注意の白いカード（オレンジの印。赤は使わない）。読み上げソフトにもすぐ伝える。
 * @param {string} title 見出し
 * @param {string[]} lines 本文の行
 * @param {string} [extraClass] 追加の見た目
 * @returns {HTMLElement} カード
 * @example messageBox("3分以内の動画を選んでください", ["a.mp4（4分12秒）", "編集アプリで…"])
 */
export function messageBox(title, lines, extraClass) {
  const box = el("div", "msg" + (extraClass ? " " + extraClass : ""));
  box.setAttribute("role", "alert");
  box.append(el("h2", null, title));
  lines.forEach(function (line, index) {
    box.append(el("p", index === 0 && lines.length > 1 ? "file" : null, line));
  });
  return box;
}

/**
 * フッター（計測の説明・ライセンス表示＝AC-25・投資の助言ではない旨）。
 * @returns {HTMLElement} フッター
 * @example footer()
 */
export function footer() {
  const foot = el("footer", "foot");
  const wrap = el("div", "wrap");
  wrap.append(el("p", null, FOOT_ANALYTICS), el("p", null, FOOT_LICENSE), el("p", null, FOOT_NOT_ADVICE));
  foot.append(wrap);
  return foot;
}
