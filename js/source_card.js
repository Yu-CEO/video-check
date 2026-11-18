/*
 * source_card.js：「比べる基準について」のカード（出どころ・版・作成日・本数・作り方）を作る
 * 主な関数：sourceCard
 * 本数は baseline.json の count が空（null）のあいだ「○本」と出す（仮の数字を本物に見せない＝AC-21）。
 * start_view.js（短い版）と report_view.js（くわしい版）から使われる。
 */
import { el } from "./dom.js";
import { countText } from "./report_text.js";
import { DEFAULT_SOURCE, HOW_BASELINE_MADE, NO_GENRE_NOTE } from "./messages.js";

/**
 * 基準の出どころのカード。基準が読めないときは、出どころの説明だけを出す。
 * @param {object|null} baseline validateBaseline が返した baseline（読めないときは null）
 * @param {boolean} full くわしい版（ジャンルの注意も出す）なら true
 * @returns {HTMLElement} カード
 * @example sourceCard(baseline, true)
 */
export function sourceCard(baseline, full) {
  const card = el("div", "card src");
  const source = baseline && baseline.source ? baseline.source : DEFAULT_SOURCE;
  card.append(el("p", null, source + "から作った「仮の基準」です。"));
  if (baseline) {
    const list = el("dl");
    [["版", baseline.version], ["作成日", baseline.created], ["もとにした動画", countText(baseline.count) + "（＋公開調査の目安）"]]
      .forEach(function (pair) {
        list.append(el("dt", null, pair[0]), el("dd", null, pair[1]));
      });
    card.append(list);
  }
  const details = el("details");
  details.append(el("summary", null, "基準の作り方をくわしく"), el("p", null, HOW_BASELINE_MADE));
  if (full) {
    details.append(el("p", null, NO_GENRE_NOTE));
  }
  card.append(details);
  return card;
}
