/*
 * axis_card.js：項目ごとのカード（名前・札・何を測ったか・あなたの値・基準の範囲・ものさし・一言・直すなら・点数）を作る
 * 主な関数：axisCard（カード）、scalePosition（ものさしの上の位置％。純粋な計算）
 * 「伸びしろあり」の項目は「直すなら」を一言より先に、薄いオレンジの箱で出す（第21回）。
 * report_view.js から使われる。
 */
import { el } from "./dom.js";
import { levelOf } from "./score.js";
import { formatValue, unitFor, formatRange, adviceSide } from "./report_text.js";
import { AXIS_TEXT, LEVEL_LABEL, DIRECTION_LABEL } from "./messages.js";

const SCALE_PADDING = 0.3;   // ものさしは基準の10〜90%の幅を、左右に30%ずつ広げて描く（外れた値も見えるように）
const PERCENT = 100;

/**
 * ものさしの上の位置（0〜100%）を出す。端を超えた値は端に置く。
 * @param {number} value 値
 * @param {{p10:number, p90:number}} percentiles 基準の分布
 * @returns {number} 位置（%）
 * @example scalePosition(50, {p10:20, p90:80}) // 50
 */
export function scalePosition(value, percentiles) {
  const spread = percentiles.p90 - percentiles.p10;
  const low = percentiles.p10 - spread * SCALE_PADDING;
  const high = percentiles.p90 + spread * SCALE_PADDING;
  if (high <= low) {
    return PERCENT / 2;
  }
  return Math.min(PERCENT, Math.max(0, ((value - low) / (high - low)) * PERCENT));
}

/**
 * ものさし（全体の帯・基準の中央の半分＝緑・中央の線・自分の丸）を作る。
 * @param {string} axisId 項目の名前
 * @param {number} value 測った値
 * @param {object} axis 基準の表の1項目
 * @returns {HTMLElement} ものさし
 * @example scaleBar("length", 48, baseline.axes.length)
 */
function scaleBar(axisId, value, axis) {
  const percentiles = axis.percentiles;
  const bar = el("div", "scale");
  bar.setAttribute("aria-hidden", "true");
  const band = el("span", "band");
  band.style.left = scalePosition(percentiles.p25, percentiles) + "%";
  band.style.width = (scalePosition(percentiles.p75, percentiles) - scalePosition(percentiles.p25, percentiles)) + "%";
  const middle = el("span", "mid");
  middle.style.left = scalePosition(percentiles.p50, percentiles) + "%";
  const dot = el("span", "dot");
  dot.style.left = scalePosition(value, percentiles) + "%";
  const ends = scaleEndWords(axisId, axis.direction);
  bar.append(el("span", "track"), band, middle, dot, el("span", "lbl l", ends[0]), el("span", "lbl r", ends[1]));
  return bar;
}

/**
 * ものさしの左右の言葉。
 * @param {string} axisId 項目の名前
 * @param {string} direction 向き
 * @returns {string[]} [左, 右]
 * @example scaleEndWords("tempo", "near") // ["ゆっくり", "速い"]
 */
function scaleEndWords(axisId, direction) {
  if (axisId === "tempo") {
    return ["ゆっくり", "速い"];
  }
  if (direction === "less") {
    return ["少ない", "多い"];
  }
  return direction === "more" ? ["低い", "高い"] : ["少ない・短い", "多い・長い"];
}

/**
 * 「あなたの動画」と「基準の中央の範囲」の2つの値。
 * @param {string} axisId 項目の名前
 * @param {number|null} value 測った値
 * @param {object|null} axis 基準の表の1項目（読めないときは null。単位は messages.js の控えを使う）
 * @returns {HTMLElement} 値の並び
 * @example valuePair("length", 48, axis)
 */
function valuePair(axisId, value, axis) {
  const text = AXIS_TEXT[axisId];
  const list = el("dl", "vals");
  const mine = el("div");
  const mineValue = el("dd", "me");
  if (value === null) {
    mineValue.textContent = "未測定";
  } else {
    mineValue.append(formatValue(axisId, value));
    const unit = unitFor(axisId, value, axis ? axis.unit : text.unit) + (text.unitNote || "");
    if (unit) {
      mineValue.append(el("small", null, unit));
    }
    if (text.estimate) {
      mineValue.append(el("span", "mark", "目安"));
    }
  }
  mine.append(el("dt", null, "あなたの動画"), mineValue);
  const base = el("div");
  const baseValue = el("dd", "base", axis ? formatRange(axisId, axis) : "読めませんでした");
  if (axis) {
    baseValue.append(el("small", null, "基準の真ん中の半分"));
  }
  base.append(el("dt", null, "基準の中央の範囲"), baseValue);
  list.append(mine, base);
  return list;
}

/**
 * 一言と「直すなら」を付ける（伸びしろありは「直すなら」を先に）。
 * @param {HTMLElement} card 付ける先
 * @param {string} axisId 項目の名前
 * @param {number} value 測った値
 * @param {object} axis 基準の表の1項目
 * @param {string} level 札の種類
 * @returns {void}
 * @example appendAdvice(card, "opening", 3, axis, "far")
 */
function appendAdvice(card, axisId, value, axis, level) {
  const text = AXIS_TEXT[axisId];
  if (level === "ok") {
    card.append(el("p", "say", text.ok));
    return;
  }
  const side = adviceSide(axis.direction, value, axis.percentiles.p50);
  const say = el("p", "say", text[side].replace("{s}", level === "near" ? "少し" : ""));
  const hint = el("div", "hint");
  hint.append(el("b", null, "直すなら"), side === "low" ? text.hintLow : text.hintHigh);
  if (level === "far") {
    hint.classList.add("first");
    card.append(hint, say);
  } else {
    card.append(say, hint);
  }
}

/**
 * 項目のカードを作る。
 * @param {string} axisId 項目の名前
 * @param {{value:number|null, score:number|null, axis:object|null, missingReason:string, tailNote:string}} item
 *   値・点数・基準（読めないときは null）・未測定の理由・ループの補足
 * @returns {HTMLElement} カード
 * @example axisCard("length", {value:48, score:88, axis, missingReason:"", tailNote:""})
 */
export function axisCard(axisId, item) {
  const text = AXIS_TEXT[axisId];
  const level = item.axis ? levelOf(item.score) : "none";
  const card = el("article", "card axis lv-" + level);
  card.id = "ax-" + axisId;
  const head = el("div", "axis-head");
  head.append(el("h3", null, text.name));
  if (item.axis) {
    head.append(el("span", "badge", LEVEL_LABEL[level]));
  }
  const direction = item.axis ? "（" + DIRECTION_LABEL[item.axis.direction] + "）" : "";
  card.append(head, el("p", "axis-what", text.what + direction), valuePair(axisId, item.value, item.axis));
  if (item.value === null) {
    card.append(el("p", "say", item.missingReason));
  } else if (!item.axis) {
    card.append(el("p", "say", "基準が読めないため、比べた解説は出せません。測った値だけを表示しています。"));
  } else {
    card.append(scaleBar(axisId, item.value, item.axis));
    appendAdvice(card, axisId, item.value, item.axis, level);
  }
  if (item.tailNote) {
    card.append(el("p", "score", item.tailNote));
  }
  if (item.axis && item.score !== null) {
    card.append(el("p", "score", "点数 " + item.score + " / 100（基準の中央の範囲に入ると80以上）"));
  }
  return card;
}
