/*
 * report_view.js：③ 結果の画面を、見る順番どおりに描く
 *   上（紺）：いちばん大事な1点 → 注意1行 → 見方の切り替え → 「この結果はこの端末の中だけ」
 *   下：ほかの項目 → 話す速さ（任意）→ 全体の形 → 次の行動 → くわしく知りたい人へ
 * 主な関数：renderReport（画面全体）、updateSpeechSection（話す速さのカードだけ描き直す）
 * 目安の表が読めないときは、大事な1点・注意1行・見方の切り替え・全体の形を出さず、測った値だけを出す（AC-16）。
 * main.js から使われる。項目の行は axis_card.js、1点のカードは key_card.js、チャートは radar_chart.js、話す速さは speech_card.js。
 */
import { el, safeMini, sectionTitle, messageBox } from "./dom.js";
import { radarChart } from "./radar_chart.js";
import { axisItem } from "./axis_card.js";
import { keyCard } from "./key_card.js";
import { speechCard } from "./speech_card.js";
import { nextActions } from "./next_actions.js";
import { moreFold } from "./more_view.js";
import { switchViewButton } from "./view_mode.js";
import { chooseKeyPoint } from "./key_point.js";
import { orderItems } from "./item_order.js";
import { formatClock, formatElapsed } from "./report_text.js";
import {
  NOT_MEASURED, BASELINE_FAILED, SAFE_MINI_RESULT, CAUTION_BASELINE, TAIL_SILENT_NOTE, TAIL_SOUND_NOTE,
  ITEMS_LEAD, ITEMS_LEAD_NO_BASELINE, NO_BASELINE_EXPLAIN
} from "./messages.js";

/**
 * 動画名・長さ・調べた時間の1行（AC-20）。
 * @param {object} report レポートの材料（main.js の buildReport を参照）
 * @returns {HTMLElement} 1行
 * @example metaLine(report)
 */
function metaLine(report) {
  const meta = el("p", "meta");
  [["動画 ", report.fileName], ["長さ ", formatClock(report.durationSec)], ["調べた時間 ", formatElapsed(report.elapsedSec)]]
    .forEach(function (pair) {
      const item = el("span", null, pair[0]);
      item.append(el("b", null, pair[1]));
      meta.append(item);
    });
  return meta;
}

/**
 * 紺の上部（見出し・動画の情報・大事な1点・注意1行・見方の切り替え）。
 * @param {object} report レポートの材料
 * @param {{keyPoint:object|null, onSwitchMode:Function}} options 大事な1点と、見方を切り替える処理
 * @returns {HTMLElement} 上部
 * @example topPart(report, {keyPoint, onSwitchMode})
 */
function topPart(report, options) {
  const top = el("header", "night report-top");
  const wrap = el("div", "wrap");
  wrap.append(el("h1", "eyebrow", "診断の結果"), metaLine(report));
  if (report.scores === null) {
    wrap.append(messageBox(BASELINE_FAILED.title, [BASELINE_FAILED.detail], "nobase"));
  } else if (options.keyPoint === null) {
    // 1つも測れなかったときは1点のカードを出さないが、注意1行は常に出す（AC-35）
    wrap.append(el("p", "key-caution", CAUTION_BASELINE));
  } else {
    const axisId = options.keyPoint.axisId;
    const keyItem = { value: report.values[axisId], score: report.scores[axisId], axis: report.baseline.axes[axisId] };
    wrap.append(keyCard(options.keyPoint, keyItem), el("p", "key-caution", CAUTION_BASELINE),
      switchViewButton(report.mode, options.onSwitchMode));
  }
  wrap.append(safeMini(SAFE_MINI_RESULT, false));
  top.append(wrap);
  return top;
}

/**
 * 未測定のときの理由を選ぶ。
 * @param {string} axisId 項目の名前
 * @param {object} report レポートの材料
 * @returns {string} 理由の一言
 * @example missingReason("tempo", report)
 */
function missingReason(axisId, report) {
  if (axisId === "tempo" && report.hasSound) {
    return report.speech.phase === "failed" ? NOT_MEASURED.tempoFailed : NOT_MEASURED.tempoIdle;
  }
  return axisId === "tempo" || axisId === "silence" ? NOT_MEASURED.noAudio : NOT_MEASURED.noVisual;
}

/**
 * 最後の0.5秒の補足（終わりと始まりのつながりの項目だけ）。
 * @param {string} axisId 項目の名前
 * @param {object} report レポートの材料
 * @returns {string} 補足（なければ空の文字）
 * @example tailNoteFor("loop", report)
 */
function tailNoteFor(axisId, report) {
  if (axisId !== "loop" || report.values.loop === null) {
    return "";
  }
  if (report.endsSilent === true) {
    return TAIL_SILENT_NOTE;
  }
  return report.endsSilent === false ? TAIL_SOUND_NOTE : "";
}

/**
 * 「ほかの項目」（目安の表が読めないときは「測った値」）の区画。
 * @param {object} report レポートの材料
 * @param {string|null} keyAxisId 大事な1点に出した項目（並びから外す）
 * @returns {HTMLElement} 区画
 * @example itemsSection(report, "opening")
 */
function itemsSection(report, keyAxisId) {
  const noBaseline = report.scores === null;
  const section = el("section", "sec");
  section.append(sectionTitle(noBaseline ? "測った値" : "ほかの項目"));
  if (noBaseline) {
    section.append(el("p", "sec-lead", ITEMS_LEAD_NO_BASELINE));
  } else if (keyAxisId !== null) {   // 1つも測れなかったときは「並べています」の説明を出さない
    section.append(el("p", "sec-lead", ITEMS_LEAD[report.mode]));
  }
  orderItems(report.mode, report.scores, keyAxisId).forEach(function (axisId) {
    section.append(axisItem(axisId, {
      value: report.values[axisId],
      score: noBaseline ? null : report.scores[axisId],
      axis: report.baseline ? report.baseline.axes[axisId] : null,
      missingReason: missingReason(axisId, report),
      noBaselineText: NO_BASELINE_EXPLAIN,
      tailNote: tailNoteFor(axisId, report),
      mode: report.mode
    }));
  });
  return section;
}

/**
 * 「全体の形」（レーダーチャート・凡例）の区画。
 * @param {object} scores 項目ごとの点数
 * @returns {HTMLElement} 区画
 * @example shapeSection(scores)
 */
function shapeSection(scores) {
  const section = el("section", "sec");
  const card = el("div", "card");
  const box = el("div", "radar-box");
  box.append(radarChart(scores));
  const legend = el("ul", "legend");
  const mine = el("li");
  mine.append(el("i", "me"), "入れた動画");
  const band = el("li");
  band.append(el("i", "band"), "伸びる動画の多く");
  legend.append(mine, band);
  card.append(box, legend);
  section.append(sectionTitle("全体の形"), card);
  return section;
}

/**
 * 結果の画面を描く。
 * @param {HTMLElement} app 描く場所
 * @param {object} report レポートの材料（main.js の buildReport を参照。mode は見方）
 * @param {{onRestart:Function, onSpeechStart:Function, onSpeechCancel:Function, onSwitchMode:Function}} actions ボタンの処理
 * @returns {void}
 * @example renderReport(app, report, actions)
 */
export function renderReport(app, report, actions) {
  app.textContent = "";
  const keyPoint = chooseKeyPoint(report.mode, report.scores);
  const main = el("main", "wrap");
  const speechSection = el("section", "sec");
  speechSection.id = "speech-sec";
  speechSection.append(speechCard(report.speech, { onStart: actions.onSpeechStart, onCancel: actions.onSpeechCancel }));
  const more = el("section", "sec page-end");
  more.append(moreFold(report.baseline));
  main.append(itemsSection(report, keyPoint ? keyPoint.axisId : null), speechSection);
  if (report.scores !== null) {
    main.append(shapeSection(report.scores));
  }
  main.append(nextActions(actions.onRestart), more);
  app.append(topPart(report, { keyPoint: keyPoint, onSwitchMode: actions.onSwitchMode }), main);
  document.title = "診断の結果｜ショート動画のかんたん診断";
}

/**
 * 話す速さのカードだけを描き直す（読み込み中の％など。画面の位置は動かさない）。
 * @param {object} report レポートの材料
 * @param {object} actions ボタンの処理
 * @returns {void}
 * @example updateSpeechSection(report, actions)
 */
export function updateSpeechSection(report, actions) {
  const section = document.getElementById("speech-sec");
  if (!section) {
    return;
  }
  section.replaceChildren(speechCard(report.speech, { onStart: actions.onSpeechStart, onCancel: actions.onSpeechCancel }));
}
