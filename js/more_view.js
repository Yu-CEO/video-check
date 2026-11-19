/*
 * more_view.js：「くわしく知りたい人へ」（押すと開く箱）と、はじめの画面の「調べる6つのこと」を作る
 * 主な関数：moreFold（くわしく）、axesFold（調べる6つのこと）
 * 長い説明・計測・ライブラリ名・目安の作り方は消さずにここへ畳む（仕様 7-6）。文言は messages.js から使い、ここでは書き換えない。
 * 版番号・本数は出さない（作成日だけ出す）。start_view.js・report_view.js から使われる。
 */
import { el, foldBox } from "./dom.js";
import { AXIS_IDS, MODEL_DOWNLOAD_MB } from "./config.js";
import {
  AXIS_TEXT, SAFE_TEXT, FOOT_ANALYTICS, FOOT_LICENSE, FOOT_NOT_ADVICE, CAUTION_TRANSCRIBE, DEFAULT_SOURCE,
  MORE_TITLE, FOLD_AXES_TITLE, BASELINE_TRIAL, HOW_BASELINE_MADE, NO_GENRE_NOTE, BASELINE_RENEW, BASELINE_DATE_MISSING,
  OTHERS_VIDEO_NOTE, SPEECH_LOAD_NOTE, PICKABLE_TEXT
} from "./messages.js";

/**
 * 小見出しと本文の段落を、ひとまとまりにして作る。
 * @param {string} heading 小見出し
 * @param {string[]} paragraphs 本文の段落
 * @returns {HTMLElement[]} 並べる要素
 * @example part("動画の扱い", ["…"])
 */
function part(heading, paragraphs) {
  const nodes = [el("h3", null, heading)];
  paragraphs.forEach(function (text) {
    nodes.push(el("p", null, text));
  });
  return nodes;
}

/**
 * 「比べている目安」の段落（出どころ・作り方・作成日。版・本数は出さない）。
 * @param {object|null} baseline 読めた基準の表（読めないときは null）
 * @returns {string[]} 段落
 * @example baselineParagraphs(baseline)
 */
function baselineParagraphs(baseline) {
  const source = baseline && baseline.source ? baseline.source : DEFAULT_SOURCE;
  const dateText = baseline ? "作成日：" + baseline.created + "。" + BASELINE_RENEW : BASELINE_DATE_MISSING;
  return [BASELINE_TRIAL + HOW_BASELINE_MADE, "基準の出どころ：" + source + "。", NO_GENRE_NOTE, dateText];
}

/**
 * 「くわしく知りたい人へ」の箱。
 * @param {object|null} baseline 読めた基準の表（読めないときは null）
 * @returns {HTMLElement} 箱（最初は閉じている）
 * @example moreFold(null)
 */
export function moreFold(baseline) {
  const nodes = [].concat(
    part("動画の扱い", [SAFE_TEXT]),
    part("計測", [FOOT_ANALYTICS]),
    part("比べている目安", baselineParagraphs(baseline)),
    part("人の動画を入れるとき", [OTHERS_VIDEO_NOTE]),
    part("話す速さの読み込み（約" + MODEL_DOWNLOAD_MB + "MB）", [SPEECH_LOAD_NOTE, CAUTION_TRANSCRIBE]),
    part("選べる動画", [PICKABLE_TEXT]),
    part("ライセンス", [FOOT_LICENSE]),
    part("このツールについて", [FOOT_NOT_ADVICE])
  );
  return foldBox(MORE_TITLE, nodes);
}

/**
 * 「調べる6つのこと」の箱（名前と、何を測るか）。
 * @returns {HTMLElement} 箱（最初は閉じている）
 * @example axesFold()
 */
export function axesFold() {
  const list = el("ul", "axes6");
  AXIS_IDS.forEach(function (axisId) {
    const text = AXIS_TEXT[axisId];
    const item = el("li");
    const note = axisId === "tempo" ? "。測るかは結果の画面で選べます" : "";
    item.append(el("b", null, text.name), el("span", null, text.what + note));
    list.append(item);
  });
  return foldBox(FOLD_AXES_TITLE, [list]);
}
