/*
 * axis_card.js：「ほかの項目」の1行（押すと開く。値・目安の範囲・ものさし・一言・直すなら／見てみて・点数）を作る
 * 主な関数：axisItem（1行）、scalePosition（ものさしの上の位置％。純粋な計算）、nameParts（長い項目名の折り返し位置）
 * 〔v2.1〕行（閉じているとき）は 絵＋名前＋札だけ。「何を測ったか」の文は開いた中の先頭に出す（仕様 8-4）。
 * 見方（自分の動画／好きな動画）で、開いたときの「直すなら」と「見てみて」が変わる（仕様 7-3）。
 * report_view.js から使われる。
 */
import { el } from "./dom.js";
import { axisPicture } from "./pictures.js";
import { levelOf } from "./score.js";
import { formatValue, unitFor, formatRange, adviceSide } from "./report_text.js";
import { AXIS_TEXT, LEVEL_LABEL, HINT_FIX, HINT_LOOK, SCORE_NOTE } from "./messages.js";

const SCALE_PADDING = 0.3;   // ものさしは基準の10〜90%の幅を、左右に30%ずつ広げて描く（外れた値も見えるように）
const PERCENT = 100;
const LONG_NAME_LENGTH = 10;   // 項目名がこの文字数を超えたら「の」の後で折り返せるようにする（1文字だけ次の行に落ちないように）

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
 * 長い項目名を、「の」の後ろで2つに分ける（折り返しても1文字だけ落ちないように）。
 * @param {string} name 項目名
 * @returns {string[]} 分けた名前（短い名前・「の」が無い名前は1つのまま）
 * @example nameParts("終わりと始まりのつながり") // ["終わりと始まりの", "つながり"]
 */
export function nameParts(name) {
  const cutIndex = name.lastIndexOf("の") + 1;
  if (name.length <= LONG_NAME_LENGTH || cutIndex <= 0 || cutIndex >= name.length) {
    return [name];
  }
  return [name.slice(0, cutIndex), name.slice(cutIndex)];
}

/**
 * 行に出す項目名の要素（長い名前は「の」の後ろで折り返せる）。
 * @param {string} name 項目名
 * @returns {HTMLElement} 名前
 * @example nameElement("動画の長さ")
 */
function nameElement(name) {
  const element = el("span", "nm");
  nameParts(name).forEach(function (part) {
    element.append(el("span", "nm-part", part));
  });
  return element;
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
  return direction === "more" ? ["違う", "似ている"] : ["少ない・短い", "多い・長い"];
}

/**
 * ものさし（全体の帯・伸びる動画の多く＝緑・自分の丸）を作る。
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
  const dot = el("span", "dot");
  dot.style.left = scalePosition(value, percentiles) + "%";
  const ends = scaleEndWords(axisId, axis.direction);
  bar.append(el("span", "track"), band, dot, el("span", "lbl l", ends[0]), el("span", "lbl r", ends[1]));
  return bar;
}

/**
 * 「入れた動画」と「伸びる動画の多く」の2つの値。
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
  mine.append(el("dt", null, "入れた動画"), mineValue);
  const base = el("div");
  base.append(el("dt", null, "伸びる動画の多く"), el("dd", "base", axis ? formatRange(axisId, axis) : "読めませんでした"));
  list.append(mine, base);
  return list;
}

/**
 * 一言と、見方に合わせた「直すなら」または「見てみて」を付ける。
 * @param {HTMLElement} body 付ける先
 * @param {string} axisId 項目の名前
 * @param {{value:number, axis:object, level:string, mode:string}} detail 値・基準・札・見方
 * @returns {void}
 * @example appendAdvice(body, "opening", {value:3, axis, level:"far", mode:"maker"})
 */
function appendAdvice(body, axisId, detail) {
  const text = AXIS_TEXT[axisId];
  if (detail.level === "ok") {
    body.append(el("p", "say", detail.mode === "maker" ? text.ok : text.ok + text.why));
    return;
  }
  const side = adviceSide(detail.axis.direction, detail.value, detail.axis.percentiles.p50);
  body.append(el("p", "say", text[side].replace("{s}", detail.level === "near" ? "少し" : "")));
  const hint = el("div", "hint");
  if (detail.mode === "maker") {
    hint.append(el("b", null, HINT_FIX), side === "low" ? text.hintLow : text.hintHigh);
  } else {
    hint.append(el("b", null, HINT_LOOK), text.look);
  }
  body.append(hint);
}

/**
 * 項目の行を作る（押すと開く）。
 * @param {string} axisId 項目の名前
 * @param {{value:number|null, score:number|null, axis:object|null, missingReason:string, noBaselineText:string, tailNote:string, mode:string}} item
 *   値・点数・基準（読めないときは null）・未測定の理由・基準が読めないときの文・ループの補足・見方
 * @returns {HTMLElement} 行
 * @example axisItem("length", {value:48, score:88, axis, missingReason:"", noBaselineText:"", tailNote:"", mode:"fan"})
 */
export function axisItem(axisId, item) {
  const text = AXIS_TEXT[axisId];
  const level = item.axis ? levelOf(item.score) : "none";
  const row = el("details", "item lv-" + level);
  row.id = "ax-" + axisId;
  const summary = el("summary");
  summary.append(axisPicture(axisId), nameElement(text.name));
  if (item.axis) {
    summary.append(el("span", "badge", LEVEL_LABEL[level]));
  }
  const body = el("div", "item-body");
  body.append(el("p", "wt", text.what), valuePair(axisId, item.value, item.axis));
  if (item.value === null) {
    body.append(el("p", "say", item.missingReason));
  } else if (!item.axis) {
    body.append(el("p", "say", item.noBaselineText));
  } else {
    body.append(scaleBar(axisId, item.value, item.axis));
    appendAdvice(body, axisId, { value: item.value, axis: item.axis, level: level, mode: item.mode });
  }
  if (item.tailNote) {
    body.append(el("p", "score", item.tailNote));
  }
  if (item.axis && item.score !== null) {
    body.append(el("p", "score", "点数 " + item.score + " / 100" + SCORE_NOTE));
  }
  row.append(summary, body);
  return row;
}
