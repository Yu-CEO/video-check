/*
 * start_view.js：① はじめの画面（見出し・「送らない・保存しない」・動画を選ぶボタン・わかること・使い方・基準）を描く
 * 主な関数：renderStart（画面を描く）、updateStartSource（基準の表が読めたあとに「基準について」だけ描き直す）
 * 選べなかったとき（3分超・200MB超・動画以外・開けない形式）は、同じ画面に理由と次にすることを出す（AC-6・7）。
 * main.js から使われる。ボタンが押されたときの処理は main.js から受け取る。
 */
import { el, safeBox, sectionTitle, messageBox, footer } from "./dom.js";
import { sourceCard } from "./source_card.js";
import { AXIS_IDS } from "./config.js";
import { AXIS_TEXT, START_ERRORS, PICK_NOTE } from "./messages.js";

const PICK_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="4" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 8.5 L18 6 V14 L13 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const HOW_TO_STEPS = [
  ["「動画を選ぶ」を押して、カメラロールから1本選ぶ", "選んだ動画は、この端末の中から出ません"],
  ["1分ほど待つ", "60秒の動画のとき。画面はこのままにしておいてください"],
  ["レーダーチャートと、6つの項目の解説を見る", "話す速さは、見たい人だけボタンで追加できます"]
];

/**
 * 紺の面（見出し・説明・「送らない」の箱・選ぶボタン・エラー）を作る。
 * @param {{errorKey:string, errorFile:string, onPick:Function}} options エラーの種類・ファイルの説明・選ぶボタンの処理
 * @returns {HTMLElement} 紺の面
 * @example heroPart({errorKey:"", errorFile:"", onPick:() => {}})
 */
function heroPart(options) {
  const top = el("header", "night top");
  const wrap = el("div", "wrap");
  const title = el("h1", "title");
  const first = el("span");
  first.append(el("b", null, "ショート動画の"));
  title.append(first, el("span", null, "かんたん診断"));
  wrap.append(el("p", "eyebrow", "VIDEO CHECK"), title,
    el("p", "lead", "縦のショート動画を選ぶだけで、冒頭3秒・話す速さ・無音など6つの項目を、伸びるショート動画の目安と比べます。"),
    safeBox());
  const button = el("button", "btn btn-hero pick");
  button.type = "button";
  button.id = "pick";
  button.innerHTML = PICK_ICON;   // 決まった絵だけ（利用者の文字は入れない）
  button.append("動画を選ぶ");
  button.addEventListener("click", options.onPick);
  wrap.append(button, el("p", "pick-note", PICK_NOTE));
  const error = START_ERRORS[options.errorKey];
  if (error) {
    wrap.append(messageBox(error.title, [options.errorFile, error.detail]));
  }
  top.append(wrap);
  return top;
}

/**
 * 「わかること（6つ）」の区画。
 * @returns {HTMLElement} 区画
 * @example axesSection()
 */
function axesSection() {
  const section = el("section", "sec");
  section.append(sectionTitle("01", "わかること（6つ）"),
    el("p", "sec-lead", "伸びるショート動画の目安と比べて、どこが近くてどこが離れているかを見ます。"));
  const list = el("ul", "axes6");
  AXIS_IDS.forEach(function (axisId, index) {
    const text = AXIS_TEXT[axisId];
    const item = el("li");
    const body = el("div");
    body.append(el("b", null, text.name), el("span", null, text.what + (axisId === "tempo" ? "。測るかは選べます" : "")));
    item.append(el("span", "n", String(index + 1)), body);
    list.append(item);
  });
  section.append(list);
  return section;
}

/**
 * 「使い方」の区画。
 * @returns {HTMLElement} 区画
 * @example howToSection()
 */
function howToSection() {
  const section = el("section", "sec");
  const list = el("ol", "steps card");
  HOW_TO_STEPS.forEach(function (step) {
    const item = el("li", null, step[0]);
    item.append(el("small", null, step[1]));
    list.append(item);
  });
  section.append(sectionTitle("02", "使い方"), list);
  return section;
}

/**
 * はじめの画面を描く。
 * @param {HTMLElement} app 描く場所
 * @param {{errorKey:string, errorFile:string, baseline:object|null, onPick:Function}} options 表示の材料
 * @returns {void}
 * @example renderStart(app, {errorKey:"", errorFile:"", baseline:null, onPick:openPicker})
 */
export function renderStart(app, options) {
  app.textContent = "";
  const main = el("main", "wrap");
  const sourceSection = el("section", "sec");
  sourceSection.id = "start-source";
  sourceSection.append(sectionTitle("03", "比べる基準について"), sourceCard(options.baseline, false));
  main.append(axesSection(), howToSection(), sourceSection);
  app.append(heroPart(options), main, footer());
  document.title = "ショート動画のかんたん診断｜Yu";
}

/**
 * 基準の表が読めたあとに、「比べる基準について」のカードだけを差し替える（画面全体は描き直さない）。
 * @param {object|null} baseline validateBaseline が返した baseline
 * @returns {void}
 * @example updateStartSource(baseline)
 */
export function updateStartSource(baseline) {
  const section = document.getElementById("start-source");
  if (!section) {
    return;
  }
  section.replaceChildren(sectionTitle("03", "比べる基準について"), sourceCard(baseline, false));
}
