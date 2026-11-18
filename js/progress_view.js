/*
 * progress_view.js：② 処理中の画面（ファイルの情報・今の手順と％・バー・4つの手順の印・やめる）と、途中で失敗した画面を描く
 * 主な関数：renderProgress（描いて、進み具合を書き換える関数を返す）、renderRunFailed（失敗の画面）
 * 進み具合は数字とバーだけを書き換える（画面全体を描き直さない＝ちらつかせない）。AC-20。
 * main.js から使われる。
 */
import { el, safeMini, messageBox } from "./dom.js";
import { formatClock, toMegabytes } from "./report_text.js";
import { PROGRESS_STEPS, PROGRESS_NOW, SAFE_MINI_RUNNING, RUN_FAILED } from "./messages.js";

/**
 * ファイルの情報（名前・長さ・大きさ）の箱。
 * @param {{name:string, durationSec:number, bytes:number}} info ファイルの情報（長さがまだなら 0）
 * @returns {HTMLElement} 箱
 * @example fileInfoBox({name:"a.mp4", durationSec:48, bytes:38000000})
 */
function fileInfoBox(info) {
  const box = el("div", "fileinfo");
  const text = el("div");
  const length = info.durationSec > 0 ? "長さ " + formatClock(info.durationSec) + "　" : "";
  text.append(el("b", null, info.name), el("span", null, length + "大きさ " + toMegabytes(info.bytes) + "MB"));
  box.append(el("span", "ic"), text);
  return box;
}

/**
 * 手順の印の見た目を決める（終わった＝done、今＝now、まだ＝空）。
 * @param {number} index 手順の番号
 * @param {number} currentIndex 今の手順の番号
 * @returns {string} 見た目の名前
 * @example stepClass(0, 1) // "done"
 */
function stepClass(index, currentIndex) {
  if (index < currentIndex) {
    return "done";
  }
  return index === currentIndex ? "now" : "";
}

/**
 * 処理中の画面を描く。
 * @param {HTMLElement} app 描く場所
 * @param {{name:string, durationSec:number, bytes:number}} info ファイルの情報
 * @param {Function} onCancel 「やめる」を押したときの処理
 * @returns {(stepIndex:number, percent:number) => void} 進み具合を書き換える関数
 * @example const update = renderProgress(app, info, cancel); update(1, 40);
 */
export function renderProgress(app, info, onCancel) {
  app.textContent = "";
  const top = el("section", "night proc top");
  const wrap = el("div", "wrap");
  const label = el("p", "progress-label");
  label.setAttribute("aria-live", "polite");
  const nowText = el("span", null, PROGRESS_NOW[0]);
  const percentText = el("span", "pct", "0%");
  label.append(nowText, percentText);
  const track = el("div", "bar-track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-label", "進み具合");
  const fill = el("div", "bar-fill");
  track.append(fill);
  const progress = el("div", "progress");
  progress.append(label, track);
  const steps = el("ol", "stepper");
  const stepItems = PROGRESS_STEPS.map(function (name) {
    return el("li", null, name);
  });
  steps.append(...stepItems);
  const cancel = el("button", "btn btn-hero-sub cancel", "やめる");
  cancel.type = "button";
  cancel.addEventListener("click", onCancel);
  wrap.append(el("p", "eyebrow", "CHECKING"), el("h1", "title", "動画を調べています"), fileInfoBox(info), progress, steps,
    el("p", "proc-note", "画面はこのままにしておいてください。ほかのアプリに切り替えると、止まることがあります。"),
    cancel, safeMini(SAFE_MINI_RUNNING));
  top.append(wrap);
  app.append(top);
  window.scrollTo(0, 0);

  return function update(stepIndex, percent) {
    nowText.textContent = PROGRESS_NOW[stepIndex];
    percentText.textContent = percent + "%";
    fill.style.width = percent + "%";
    track.setAttribute("aria-valuenow", String(percent));
    stepItems.forEach(function (item, index) {
      item.className = stepClass(index, stepIndex);
    });
    document.title = "調べています " + percent + "%｜ショート動画のかんたん診断";
  };
}

/**
 * 処理の途中で失敗したときの画面（責めずに、次の行動を2つ出す）。
 * @param {HTMLElement} app 描く場所
 * @param {{name:string, durationSec:number, bytes:number}} info ファイルの情報
 * @param {{onRetry:Function, onPickAnother:Function}} actions 「もう一度試す」「別の動画を選ぶ」の処理
 * @returns {void}
 * @example renderRunFailed(app, info, {onRetry, onPickAnother})
 */
export function renderRunFailed(app, info, actions) {
  app.textContent = "";
  const top = el("section", "night proc top");
  const wrap = el("div", "wrap");
  const buttons = el("div", "actions row");
  const retry = el("button", "btn btn-hero", "もう一度試す");
  retry.type = "button";
  retry.addEventListener("click", actions.onRetry);
  const another = el("button", "btn btn-hero-sub", "別の動画を選ぶ");
  another.type = "button";
  another.addEventListener("click", actions.onPickAnother);
  buttons.append(retry, another);
  wrap.append(el("p", "eyebrow", "CHECKING"), el("h1", "title", RUN_FAILED.title), fileInfoBox(info),
    messageBox(RUN_FAILED.heading, [RUN_FAILED.detail]), buttons,
    safeMini("この端末の中だけで調べていました。外には何も送っていません"));
  top.append(wrap);
  app.append(top);
  document.title = "調べられませんでした｜ショート動画のかんたん診断";
}
