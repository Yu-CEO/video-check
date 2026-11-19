/*
 * view_mode.js：「どんな動画を入れますか？」の2択と、結果の画面で見方を切り替えるボタンを作る
 * 主な関数：modeChoice（はじめの画面の2択）、switchViewButton（結果の画面の切り替え）、otherMode（もう一方の見方）
 * 見方は fan（好きな動画・最初の選び方）と maker（自分で作った動画）。処理は同じで、結果の言い方と並び順だけが変わる（仕様 7-2）。
 * 2択カードは 絵＋名前。説明の文は画面の文字から外し、絵の読み上げ用の名前に入れている（〔v2.1〕仕様 8-3）。
 * 今どちらかは main.js が持つ。start_view.js・report_view.js から使われる。
 */
import { el } from "./dom.js";
import { modePicture } from "./pictures.js";
import { MODE_CHOICE_TITLE, MODE_TEXT } from "./messages.js";

export const DEFAULT_MODE = "fan";   // 動画を作らない人も使えるよう、最初は「好きな動画」
const MODE_ORDER = ["fan", "maker"];

/**
 * もう一方の見方を返す。
 * @param {"fan"|"maker"} mode 今の見方
 * @returns {"fan"|"maker"} もう一方
 * @example otherMode("fan") // "maker"
 */
export function otherMode(mode) {
  return mode === "fan" ? "maker" : "fan";
}

/**
 * はじめの画面の2択（ラジオボタン。選ばなくても今の見方のまま進める）。
 * @param {"fan"|"maker"} currentMode 今の見方
 * @param {(mode:"fan"|"maker") => void} onChange 選び直したときの処理
 * @returns {HTMLElement} 2択のまとまり
 * @example modeChoice("fan", function (mode) {})
 */
export function modeChoice(currentMode, onChange) {
  const group = el("fieldset", "opts");
  group.append(el("legend", null, MODE_CHOICE_TITLE));
  const list = el("div", "opt-list");
  MODE_ORDER.forEach(function (mode) {
    const label = el("label", "opt");
    const input = el("input");
    input.type = "radio";
    input.name = "mode";
    input.value = mode;
    input.checked = mode === currentMode;
    input.addEventListener("change", function () {
      onChange(mode);
    });
    const text = el("span", "opt-t");
    text.append(el("b", null, MODE_TEXT[mode].name));
    const box = el("span", "opt-box");
    box.append(modePicture(mode), text);
    label.append(input, box);
    list.append(label);
  });
  group.append(list);
  return group;
}

/**
 * 結果の画面の「〜として見る」ボタン（測り直さず、言い方と並び順だけ変える）。
 * @param {"fan"|"maker"} currentMode 今の見方
 * @param {Function} onSwitch 押したときの処理
 * @returns {HTMLButtonElement} ボタン
 * @example switchViewButton("fan", function () {})
 */
export function switchViewButton(currentMode, onSwitch) {
  const button = el("button", "switch-view", MODE_TEXT[otherMode(currentMode)].switchTo);
  button.type = "button";
  button.addEventListener("click", onSwitch);
  return button;
}
