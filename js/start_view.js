/*
 * start_view.js：① はじめの画面（問いかけ・2択・3つの手順・動画を選ぶボタン・「送らない」の1行・エラー・畳んだ説明）を描く
 * 主な関数：renderStart（画面を描く）、updateStartMore（基準の表が読めたあとに「くわしく」だけ描き直す）
 * 選べなかったとき（3分超・200MB超・動画以外・開けない形式）は、同じ画面に理由と次にすることを出す（AC-6・7）。
 * スマホで待つ時間は、実機で測った値が config.js に入るまで出さない（AC-20）。
 * main.js から使われる。ボタンが押されたときの処理は main.js から受け取る。
 */
import { el, safeMini, messageBox } from "./dom.js";
import { modeChoice } from "./view_mode.js";
import { moreFold, axesFold } from "./more_view.js";
import { PHONE_WAIT_TEXT, PC_WAIT_TEXT } from "./config.js";
import { START_ERRORS, PICK_NOTE, SAFE_ONE_LINE } from "./messages.js";

const PICK_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="4" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 8.5 L18 6 V14 L13 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

/**
 * 待つ時間の言葉（スマホの値がまだ無いあいだは PC だけ）。
 * @returns {string} 例 "PC 約1分"
 * @example waitText()
 */
function waitText() {
  const pc = "PC " + PC_WAIT_TEXT;
  return PHONE_WAIT_TEXT === null ? pc : "スマホ " + PHONE_WAIT_TEXT + "\n" + pc;
}

/**
 * 3つの手順（選ぶ → 待つ → 分かる）。
 * @returns {HTMLElement} 手順の並び
 * @example stepsFlow()
 */
function stepsFlow() {
  const flow = el("ol", "flow");
  [["1", "選ぶ", "動画を1本"], ["2", "待つ", waitText()], ["3", "分かる", "大事な1点から"]].forEach(function (step) {
    const item = el("li");
    item.append(el("i", null, step[0]), el("b", null, step[1]), el("small", null, step[2]));
    flow.append(item);
  });
  return flow;
}

/**
 * 紺の面（問いかけ・2択・手順・選ぶボタン・エラー）を作る。
 * @param {{mode:string, errorKey:string, errorFile:string, onPick:Function, onModeChange:Function}} options 見方・エラーの種類・ファイルの説明・各ボタンの処理
 * @returns {HTMLElement} 紺の面
 * @example heroPart({mode:"fan", errorKey:"", errorFile:"", onPick:() => {}, onModeChange:() => {}})
 */
function heroPart(options) {
  const top = el("header", "night top");
  const wrap = el("div", "wrap");
  const title = el("h1", "title");
  title.append(el("span", null, "伸びるショート動画は、"), el("span", null, "どこが違う？"));
  wrap.append(el("p", "eyebrow", "ショート動画のかんたん診断"), title,
    el("p", "lead", "動画を1本入れるだけで、伸びる動画の目安と6つの点で比べます。"),
    modeChoice(options.mode, options.onModeChange), stepsFlow());
  const button = el("button", "btn btn-hero pick");
  button.type = "button";
  button.id = "pick";
  button.innerHTML = PICK_ICON;   // 決まった絵だけ（利用者の文字は入れない）
  button.append("動画を選ぶ");
  button.addEventListener("click", options.onPick);
  wrap.append(button, safeMini(SAFE_ONE_LINE, true), el("p", "pick-note", PICK_NOTE));
  const error = START_ERRORS[options.errorKey];
  if (error) {
    wrap.append(messageBox(error.title, [options.errorFile, error.detail]));
  }
  top.append(wrap);
  return top;
}

/**
 * 明るい面の畳み（「調べる6つのこと」と「くわしく知りたい人へ」）。
 * @param {object|null} baseline 読めた基準の表
 * @returns {HTMLElement} 区画
 * @example foldsSection(null)
 */
function foldsSection(baseline) {
  const section = el("section", "sec page-end");
  section.id = "start-more";
  section.append(axesFold(), moreFold(baseline));
  return section;
}

/**
 * はじめの画面を描く。
 * @param {HTMLElement} app 描く場所
 * @param {{mode:string, errorKey:string, errorFile:string, baseline:object|null, onPick:Function, onModeChange:Function}} options 表示の材料
 * @returns {void}
 * @example renderStart(app, {mode:"fan", errorKey:"", errorFile:"", baseline:null, onPick:openPicker, onModeChange:setMode})
 */
export function renderStart(app, options) {
  app.textContent = "";
  const main = el("main", "wrap");
  main.append(foldsSection(options.baseline));
  app.append(heroPart(options), main);
  document.title = "伸びるショート動画は、どこが違う？｜ショート動画のかんたん診断";
}

/**
 * 基準の表が読めたあとに、畳んだ説明（作成日）だけを差し替える（画面全体は描き直さない）。
 * @param {object|null} baseline validateBaseline が返した baseline
 * @returns {void}
 * @example updateStartMore(baseline)
 */
export function updateStartMore(baseline) {
  const section = document.getElementById("start-more");
  if (!section) {
    return;
  }
  const opened = Array.from(section.querySelectorAll("details")).map(function (box) {
    return box.open;
  });
  const replaced = foldsSection(baseline);
  Array.from(replaced.querySelectorAll("details")).forEach(function (box, index) {
    box.open = opened[index] === true;
  });
  section.replaceWith(replaced);
}
