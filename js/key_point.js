/*
 * key_point.js：結果の先頭に出す「いちばん大事な1点」を選ぶ（純粋な計算。画面に触らない）
 * 主な関数：chooseKeyPoint（見方と点数から、項目と言い方の種類を返す）
 * 未測定の項目は選ばない。同じ点数のときは項目の決まった順（config.js の AXIS_IDS）で先のものにする（仕様 7-3・7-4）。
 * key_card.js・report_view.js から使われる。tests/key_point.test.js で確かめている。
 */
import { AXIS_IDS, SCORE_OK } from "./config.js";

/**
 * 点数が入っている項目を、決まった順で集める。
 * @param {object|null} scores 項目ごとの点数（未測定は null。表が読めないときは scores 自体が null）
 * @returns {string[]} 項目の名前の並び
 * @example measuredIds({opening: 30, cuts: null}) // ["opening"]
 */
function measuredIds(scores) {
  if (!scores) {
    return [];
  }
  return AXIS_IDS.filter(function (axisId) {
    return scores[axisId] !== null && scores[axisId] !== undefined;
  });
}

/**
 * 点数がいちばん高い（または低い）項目を選ぶ。同点は決まった順で先のもの。
 * @param {string[]} ids 項目の名前の並び（決まった順）
 * @param {object} scores 項目ごとの点数
 * @param {boolean} highest 高いほうを選ぶなら true
 * @returns {string} 項目の名前
 * @example pickExtreme(["opening", "cuts"], {opening: 30, cuts: 60}, true) // "cuts"
 */
function pickExtreme(ids, scores, highest) {
  let picked = ids[0];
  ids.forEach(function (axisId) {
    const better = highest ? scores[axisId] > scores[picked] : scores[axisId] < scores[picked];
    if (better) {
      picked = axisId;
    }
  });
  return picked;
}

/**
 * いちばん大事な1点を選ぶ。
 * @param {"fan"|"maker"} mode 見方（fan＝好きな動画／maker＝自分の動画）
 * @param {object|null} scores 項目ごとの点数
 * @returns {{axisId:string, kind:string}|null} 項目と言い方の種類。測れた項目がなければ null
 *   kind：maker-fix（まず直す）／maker-allok（全部80以上）／fan-best（伸びる作りに近い）／fan-diff（80以上が無い）
 * @example chooseKeyPoint("maker", {opening: 30, cuts: 60, tempo: null, silence: 92, length: 88, loop: 85}) // {axisId:"opening", kind:"maker-fix"}
 */
export function chooseKeyPoint(mode, scores) {
  const ids = measuredIds(scores);
  if (ids.length === 0) {
    return null;
  }
  const best = pickExtreme(ids, scores, true);
  const worst = pickExtreme(ids, scores, false);
  const bestIsOk = scores[best] >= SCORE_OK;
  if (mode === "maker") {
    const allOk = scores[worst] >= SCORE_OK;
    return allOk ? { axisId: best, kind: "maker-allok" } : { axisId: worst, kind: "maker-fix" };
  }
  return bestIsOk ? { axisId: best, kind: "fan-best" } : { axisId: worst, kind: "fan-diff" };
}
