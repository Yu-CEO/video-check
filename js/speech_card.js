/*
 * speech_card.js：「話す速さも測る」のカードを、状態ごとに作る
 * 状態：idle（押す前）／loading（モデルの読み込み中）／transcribing（文字起こし中）／done（測定済み）／failed（失敗→未測定）／noaudio（音声なし）
 * 押す前に、読み込む大きさ（MB）と時間の目安を出す（AC-13）。押さなくても、ほかの結果はそのまま見られる。
 * report_view.js から使われる。ボタンが押されたときの処理は main.js から受け取る。
 */
import { el } from "./dom.js";
import { MODEL_DOWNLOAD_MB, TRANSCRIBE_SEC_PER_MIN } from "./config.js";
import { UNKNOWN_COUNT_MARK } from "./messages.js";

const PERCENT = 100;

/**
 * 進み具合のバー（白い面の上の版）。
 * @param {string} labelText 左に出す文字
 * @param {number} percent 進み具合（%）
 * @returns {HTMLElement} バー
 * @example lightProgress("文字起こし", 60)
 */
function lightProgress(labelText, percent) {
  const box = el("div", "progress light");
  const label = el("p", "progress-label");
  label.append(el("span", null, labelText), el("span", "pct", percent + "%"));
  const track = el("div", "bar-track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(percent));
  track.setAttribute("aria-label", "話す速さの進み具合");
  const fill = el("div", "bar-fill");
  fill.style.width = percent + "%";
  track.append(fill);
  box.append(label, track);
  return box;
}

/**
 * ボタンを作る。
 * @param {string} className 見た目
 * @param {string} text 文字
 * @param {Function} onClick 押したときの処理
 * @returns {HTMLButtonElement} ボタン
 * @example button("btn btn-main", "もう一度試す", retry)
 */
function button(className, text, onClick) {
  const element = el("button", className, text);
  element.type = "button";
  element.addEventListener("click", onClick);
  return element;
}

/**
 * 押す前のカードの中身（何をするか・大きさ・時間の目安・ボタン）。
 * @param {HTMLElement} card 付ける先
 * @param {Function} onStart 押したときの処理
 * @returns {void}
 * @example idleContent(card, start)
 */
function idleContent(card, onStart) {
  const seconds = TRANSCRIBE_SEC_PER_MIN === null ? UNKNOWN_COUNT_MARK : String(TRANSCRIBE_SEC_PER_MIN);
  card.append(el("h3", null, "話す速さも測る（任意）"),
    el("p", null, "動画の声を文字にして、1秒あたりの文字数を出します。初めてのときだけ、文字起こしのモデルをこのサイトから読み込みます。声も文字も外には送りません。"),
    el("span", "size", "読み込む大きさ 約" + MODEL_DOWNLOAD_MB + "MB・Wi-Fi がおすすめ"),
    el("span", "size", "目安：1分の動画で約" + seconds + "秒"),
    button("btn btn-main", "話す速さも測る（約" + MODEL_DOWNLOAD_MB + "MB）", onStart),
    el("p", null, "押さなくても、ほかの5つの結果はそのまま見られます。"));
}

/**
 * 読み込み中・文字起こし中のカードの中身。
 * @param {HTMLElement} card 付ける先
 * @param {{phase:string, percent:number}} speech 状態と進み具合
 * @param {Function} onCancel 「やめる」の処理
 * @returns {void}
 * @example busyContent(card, {phase:"loading", percent:45}, cancel)
 */
function busyContent(card, speech, onCancel) {
  const loading = speech.phase === "loading";
  const heading = el("h3");
  heading.append(el("span", "spin"), loading ? "文字起こしの準備をしています" : "声を文字にしています");
  const label = loading
    ? Math.round(MODEL_DOWNLOAD_MB * speech.percent / PERCENT) + "MB / " + MODEL_DOWNLOAD_MB + "MB（モデル）"
    : "文字起こし";
  card.append(heading, lightProgress(label, speech.percent),
    el("p", null, loading ? "読み込みは初めての1回だけです。次からはすぐ始まります。待つあいだも、下の結果は見られます。"
      : "画面はこのままでお待ちください。下の結果はそのまま見られます。"),
    button("btn btn-sub", "やめる", onCancel));
}

/**
 * 話す速さのカードを作る。
 * @param {{phase:string, percent:number}} speech 状態（idle・loading・transcribing・done・failed・noaudio）と進み具合
 * @param {{onStart:Function, onCancel:Function}} actions ボタンの処理
 * @returns {HTMLElement} カード
 * @example speechCard({phase:"idle", percent:0}, {onStart, onCancel})
 */
export function speechCard(speech, actions) {
  const card = el("div", "card speech");
  card.setAttribute("aria-live", "polite");
  if (speech.phase === "noaudio") {
    card.classList.add("is-done");
    card.append(el("h3", null, "話す速さ・無音は測れませんでした"),
      el("p", null, "この動画には音声が入っていないか、取り出せませんでした。映像の4つの項目だけを出しています。声やBGMを入れた動画なら、6つすべてを調べられます。"));
  } else if (speech.phase === "idle") {
    idleContent(card, actions.onStart);
  } else if (speech.phase === "loading" || speech.phase === "transcribing") {
    busyContent(card, speech, actions.onCancel);
  } else if (speech.phase === "done") {
    card.classList.add("is-done");
    card.append(el("h3", null, "話す速さを測りました（目安）"),
      el("p", null, "文字起こしは完全ではありません。特に固有名詞・数字・漢字で誤りやすいため、話す速さは目安として見てください。"));
  } else {
    card.classList.add("is-fail");
    card.append(el("h3", null, "文字起こしができませんでした"),
      el("p", null, "話す速さは「未測定」のままにしています。ほかの結果はそのままです。メモリの少ない端末では失敗することがあります。ほかのアプリやタブを閉じてから、もう一度試せます。"),
      button("btn btn-main", "もう一度試す", actions.onStart));
  }
  return card;
}
