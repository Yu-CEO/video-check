/*
 * score.js：測った値と基準の表から、項目ごとの点数（0〜100）と札（範囲内／少し外れ／伸びしろあり）を出す
 * 主な関数：scoreValue（1つの値の点数）、scoreAll（6項目まとめて）、levelOf（点数から札）
 * 計算のきまり（README の「点数の出し方」と同じ）：
 *   中央（p50）＝100点、25%・75%の線＝80点、10%・90%の線＝50点、そこから中央〜10%（90%）と同じ距離だけ離れると0点。
 *   線と線のあいだは直線でつなぐ。「少ないほど良い」は中央より少なければ100点、「多いほど良い」は中央より多ければ100点。
 * 画面に触らない純粋な計算なので、tests/score.test.js で画面なしに確かめられる（AC-17）。
 */
import { AXIS_IDS, SCORE_OK, SCORE_NEAR } from "./config.js";

const FULL_SCORE = 100;

/**
 * 中央からの距離を点数にする（片側だけ）。
 * @param {number} distance 中央からの距離（0以上）
 * @param {number} innerWidth 中央〜25%（または75%）の幅
 * @param {number} outerWidth 25%〜10%（または75%〜90%）の幅
 * @returns {number} 点数（0〜100、小数あり）
 * @example sideScore(0, 10, 10) // 100
 */
function sideScore(distance, innerWidth, outerWidth) {
  if (distance <= innerWidth) {
    return innerWidth > 0 ? FULL_SCORE - (FULL_SCORE - SCORE_OK) * (distance / innerWidth) : FULL_SCORE;
  }
  const outerDistance = distance - innerWidth;
  if (outerDistance <= outerWidth) {
    return outerWidth > 0 ? SCORE_OK - (SCORE_OK - SCORE_NEAR) * (outerDistance / outerWidth) : SCORE_OK;
  }
  // 10%（90%）の線より外：中央〜10% と同じ距離だけ離れたところで0点になるよう、まっすぐ下げる
  const tailDistance = outerDistance - outerWidth;
  const tailWidth = Math.max(innerWidth + outerWidth, Number.EPSILON);
  return Math.max(0, SCORE_NEAR - SCORE_NEAR * (tailDistance / tailWidth));
}

/**
 * 1つの値の点数を出す。
 * @param {number|null} value 測った値（null＝未測定）
 * @param {{direction:string, percentiles:{p10:number,p25:number,p50:number,p75:number,p90:number}}} axis 基準の表の1項目
 * @returns {number|null} 点数（0〜100の整数）。未測定なら null
 * @example scoreValue(41, {direction:"near", percentiles:{p10:18,p25:28,p50:41,p75:58,p90:75}}) // 100
 */
export function scoreValue(value, axis) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const percentiles = axis.percentiles;
  const below = value < percentiles.p50;
  if ((axis.direction === "less" && below) || (axis.direction === "more" && !below)) {
    return FULL_SCORE;
  }
  const raw = below
    ? sideScore(percentiles.p50 - value, percentiles.p50 - percentiles.p25, percentiles.p25 - percentiles.p10)
    : sideScore(value - percentiles.p50, percentiles.p75 - percentiles.p50, percentiles.p90 - percentiles.p75);
  return Math.round(raw);
}

/**
 * 6つの項目の点数をまとめて出す。
 * @param {object} values 項目ごとの測った値 例 {opening:9, cuts:5, tempo:null, ...}
 * @param {object} baseline validateBaseline が返した baseline
 * @returns {object} 項目ごとの点数 例 {opening:30, cuts:60, tempo:null, ...}
 * @example scoreAll({length:41}, baseline).length // 100
 */
export function scoreAll(values, baseline) {
  const scores = {};
  AXIS_IDS.forEach(function (axisId) {
    const value = values[axisId] === undefined ? null : values[axisId];
    scores[axisId] = scoreValue(value, baseline.axes[axisId]);
  });
  return scores;
}

/**
 * 点数から札の種類を決める（80以上＝ok、50〜79＝near、50未満＝far、未測定＝none）。
 * @param {number|null} score 点数
 * @returns {"ok"|"near"|"far"|"none"} 札の種類
 * @example levelOf(65) // "near"
 */
export function levelOf(score) {
  if (score === null || score === undefined) {
    return "none";
  }
  if (score >= SCORE_OK) {
    return "ok";
  }
  return score >= SCORE_NEAR ? "near" : "far";
}
