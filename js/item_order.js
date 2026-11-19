/*
 * item_order.js：「ほかの項目」を並べる順番を決める（純粋な計算。画面に触らない）
 * 主な関数：orderItems
 * 自分の動画＝点数の低い順（直したほうがよい順）／好きな動画＝点数の高い順（伸びる作りに近い順）。未測定は最後。
 * 同じ点数のときは項目の決まった順（config.js の AXIS_IDS）。report_view.js から使われる。tests/item_order.test.js で確かめている。
 */
import { AXIS_IDS } from "./config.js";

/**
 * 項目を並べる。
 * @param {"fan"|"maker"} mode 見方
 * @param {object|null} scores 項目ごとの点数（未測定は null。表が読めないときは scores 自体が null）
 * @param {string|null} excludeId 並びから外す項目（「いちばん大事な1点」に出した項目）。なければ null
 * @returns {string[]} 項目の名前の並び
 * @example orderItems("maker", {opening: 30, cuts: 60, tempo: null, silence: 92, length: 88, loop: 85}, "opening")
 *   // ["cuts", "length", "loop", "silence", "tempo"]
 */
export function orderItems(mode, scores, excludeId) {
  const candidates = AXIS_IDS.filter(function (axisId) {
    return axisId !== excludeId;
  });
  const hasScore = function (axisId) {
    return scores && scores[axisId] !== null && scores[axisId] !== undefined;
  };
  const measured = candidates.filter(hasScore);
  const unmeasured = candidates.filter(function (axisId) {
    return !hasScore(axisId);
  });
  measured.sort(function (a, b) {
    const difference = mode === "maker" ? scores[a] - scores[b] : scores[b] - scores[a];
    return difference !== 0 ? difference : AXIS_IDS.indexOf(a) - AXIS_IDS.indexOf(b);
  });
  return measured.concat(unmeasured);
}
