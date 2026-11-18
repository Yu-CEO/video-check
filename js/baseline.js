/*
 * baseline.js：基準の表 data/baseline.json を読み込み、形が正しいかを確かめる
 * 主な関数：validateBaseline（形の確認。純粋な計算）、loadBaseline（ファイルを読んで確認する）
 * 表の数字を書き換えるだけで点数と「基準の範囲」の表示が変わる（コードは変えない＝AC-15）。
 * 形が違う・読めないときは ok:false を返し、main.js が「測った値だけ」を出す（AC-16）。tests/baseline.test.js で確かめる。
 */
import { AXIS_IDS, DIRECTIONS, PERCENTILE_KEYS, BASELINE_URL } from "./config.js";

/**
 * 1つの項目の基準が正しい形か（向きが決まった言葉・分布の5つの数が小さい順）を確かめる。
 * @param {object} axis 例 {unit:"秒", direction:"near", percentiles:{p10:18, p25:28, p50:41, p75:58, p90:75}}
 * @returns {string} 問題の説明。正しければ空の文字
 * @example checkAxis({unit:"秒", direction:"up", percentiles:{}}) // "向き（direction）が…"
 */
function checkAxis(axis) {
  if (!axis || typeof axis !== "object") {
    return "項目がありません";
  }
  if (typeof axis.unit !== "string") {
    return "単位（unit）がありません";
  }
  if (!DIRECTIONS.includes(axis.direction)) {
    return "向き（direction）が near・more・less のどれでもありません";
  }
  const values = PERCENTILE_KEYS.map(function (key) {
    return axis.percentiles ? axis.percentiles[key] : undefined;
  });
  if (!values.every(Number.isFinite)) {
    return "分布の目安（p10〜p90）に数字でないものがあります";
  }
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] < values[index - 1]) {
      return "分布の目安が小さい順に並んでいません";
    }
  }
  return "";
}

/**
 * 基準の表の形を確かめる。正しければ使いやすい形にして返す。
 * @param {object} data JSON を読んだもの
 * @returns {{ok:true, baseline:object}|{ok:false, reason:string}} 結果
 * @example validateBaseline({}) // {ok:false, reason:"版（version）がありません"}
 */
export function validateBaseline(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "表の中身が空です" };
  }
  if (typeof data.version !== "string" || typeof data.created !== "string") {
    return { ok: false, reason: "版（version）か作成日（created）がありません" };
  }
  // 本数は「実際の数」か、まだ入っていない印の null だけを認める（仮の数字を本物に見せない）
  if (!(data.count === null || (Number.isInteger(data.count) && data.count >= 0))) {
    return { ok: false, reason: "本数（count）が整数でも null でもありません" };
  }
  if (!data.axes || typeof data.axes !== "object") {
    return { ok: false, reason: "項目（axes）がありません" };
  }
  const axes = {};
  for (const axisId of AXIS_IDS) {
    const problem = checkAxis(data.axes[axisId]);
    if (problem !== "") {
      return { ok: false, reason: axisId + "：" + problem };
    }
    axes[axisId] = data.axes[axisId];
  }
  return {
    ok: true,
    baseline: {
      version: data.version,
      created: data.created,
      count: data.count,
      source: typeof data.source === "string" ? data.source : "",
      axes: axes
    }
  };
}

/**
 * 基準の表を同じサイトから読み込んで確かめる。通信の失敗・JSON の壊れも ok:false にまとめる。
 * @param {Function} [fetchFunction] fetch（テストでは差し替える）
 * @returns {Promise<{ok:true, baseline:object}|{ok:false, reason:string}>} 結果
 * @example const result = await loadBaseline();
 */
export async function loadBaseline(fetchFunction = globalThis.fetch) {
  try {
    const response = await fetchFunction(BASELINE_URL, { cache: "no-cache" });
    if (!response.ok) {
      return { ok: false, reason: "ファイルが見つかりません（" + response.status + "）" };
    }
    return validateBaseline(await response.json());
  } catch (error) {
    return { ok: false, reason: "読み込めませんでした（" + error.message + "）" };
  }
}
