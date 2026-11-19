/*
 * key_card.js：結果の先頭の「いちばん大事な1点」のカードを作る
 * 主な関数：keyCard
 * どの項目をどの言い方で出すかは key_point.js が決める。ここは文章を並べるだけ（自分の動画＝直すなら＋理由／好きな動画＝なぜ効くか＋見てみて）。
 * 札の言葉は 目安どおり・少しずれ・伸びしろあり（赤は使わない）。report_view.js から使われる。
 */
import { el } from "./dom.js";
import { levelOf } from "./score.js";
import { adviceSide } from "./report_text.js";
import { AXIS_TEXT, LEVEL_LABEL, KEY_LABEL, KEY_ALL_OK_TAIL, HINT_FIX, HINT_LOOK } from "./messages.js";

/**
 * 「直すなら」「見てみて」の薄い箱。
 * @param {string} title 小見出し
 * @param {string} body 文
 * @param {string} className 見た目（"hint first"・"tip" など）
 * @returns {HTMLElement} 箱
 * @example adviceBox("見てみて", "…", "tip")
 */
function adviceBox(title, body, className) {
  const box = el("div", className);
  box.append(el("b", null, title), body);
  return box;
}

/**
 * 基準より少ない側・多い側の説明文（「少しずれ」のときは「少し」を入れる）。
 * @param {string} axisId 項目の名前
 * @param {{value:number, level:string, axis:object}} item 値・札・基準の1項目
 * @returns {{side:string, say:string}} 側と説明文
 * @example sideSay("opening", {value: 9, level: "far", axis})
 */
function sideSay(axisId, item) {
  const text = AXIS_TEXT[axisId];
  const side = adviceSide(item.axis.direction, item.value, item.axis.percentiles.p50);
  return { side: side, say: text[side].replace("{s}", item.level === "near" ? "少し" : "") };
}

/**
 * いちばん大事な1点のカードを作る。
 * @param {{axisId:string, kind:string}} keyPoint chooseKeyPoint の結果
 * @param {{value:number, score:number, axis:object}} item 測った値・点数・基準の1項目
 * @returns {HTMLElement} カード
 * @example keyCard({axisId:"opening", kind:"maker-fix"}, {value:9, score:30, axis})
 */
export function keyCard(keyPoint, item) {
  const text = AXIS_TEXT[keyPoint.axisId];
  const level = levelOf(item.score);
  const card = el("section", "key lv-" + level);
  card.setAttribute("aria-label", "いちばん大事な1点");
  card.append(el("p", "key-label", KEY_LABEL[keyPoint.kind]), el("h2", null, text.name), el("span", "badge", LEVEL_LABEL[level]));
  const detail = { value: item.value, level: level, axis: item.axis };
  if (keyPoint.kind === "maker-fix") {
    const found = sideSay(keyPoint.axisId, detail);
    const hintText = found.side === "low" ? text.hintLow : text.hintHigh;
    card.append(adviceBox(HINT_FIX, hintText, level === "far" ? "hint first" : "hint"), el("p", "say", found.say));
  } else if (keyPoint.kind === "maker-allok") {
    card.append(el("p", "say", text.ok + KEY_ALL_OK_TAIL));
  } else if (keyPoint.kind === "fan-best") {
    card.append(el("p", "say", text.why), adviceBox(HINT_LOOK, text.look, "tip"));
  } else {   // fan-diff：80以上が無いので、いちばん違った項目
    card.append(el("p", "say", sideSay(keyPoint.axisId, detail).say), adviceBox(HINT_LOOK, text.look, "tip"));
  }
  return card;
}
