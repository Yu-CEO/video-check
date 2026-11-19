/*
 * next_actions.js：結果の後の「別の動画でもう一度」「Yuのページへ戻る」の2ボタンと、保存していない旨の1行
 * 主な関数：nextActions
 * 3ツール（simulator・fx-simulator・video-check）で同じ言葉・同じ場所にそろえる（仕様 7-5）。report_view.js から使われる。
 */
import { el } from "./dom.js";
import { NEXT_AGAIN, NEXT_BACK, NEXT_NOTE, PORTAL_URL } from "./messages.js";

/**
 * 次の行動の区画を作る。
 * @param {Function} onRestart 「別の動画でもう一度」を押したときの処理（はじめの画面へ戻る）
 * @returns {HTMLElement} 区画
 * @example nextActions(function () {})
 */
export function nextActions(onRestart) {
  const section = el("section", "sec");
  const next = el("div", "next");
  const row = el("div", "row");
  const again = el("button", "btn btn-main", NEXT_AGAIN);
  again.type = "button";
  again.addEventListener("click", onRestart);
  const back = el("a", "btn btn-sub", NEXT_BACK);
  back.href = PORTAL_URL;
  row.append(again, back);
  next.append(row, el("p", null, NEXT_NOTE));
  section.append(next);
  return section;
}
