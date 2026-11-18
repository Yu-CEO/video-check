/*
 * report_view.js：③ レポートの画面（上部のレーダーチャート・まとめ・話す速さ・6つの項目・基準・注意書き）を描く
 * 主な関数：renderReport（画面全体）、updateSpeechSection（話す速さのカードだけ描き直す）
 * 基準の表が読めないときは、チャートと点数を出さずに測った値だけを出す（AC-16）。最後に注意書きを出す（AC-21）。
 * main.js から使われる。項目カードは axis_card.js、チャートは radar_chart.js、話す速さは speech_card.js。
 */
import { el, safeMini, sectionTitle, messageBox, footer } from "./dom.js";
import { radarChart } from "./radar_chart.js";
import { axisCard } from "./axis_card.js";
import { speechCard } from "./speech_card.js";
import { sourceCard } from "./source_card.js";
import { AXIS_IDS } from "./config.js";
import { formatClock, formatElapsed, countText, summaryLines } from "./report_text.js";
import {
  AXIS_TEXT, NOT_MEASURED, BASELINE_FAILED, SAFE_MINI_RESULT, CAUTION_BASELINE, CAUTION_TRANSCRIBE, DEFAULT_SOURCE,
  TAIL_SILENT_NOTE, TAIL_SOUND_NOTE, AXES_LEAD_WITH_BASELINE, AXES_LEAD_NO_BASELINE, BASELINE_INFO_MISSING
} from "./messages.js";

/**
 * 画面の中の場所へ、なめらかに移動する（動きを減らす設定の人には一気に移動する）。
 * @param {string} id 移動先の要素の id
 * @returns {void}
 * @example scrollToId("speech-sec")
 */
function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/**
 * まとめの一文と「〜を見る」のリンク。
 * @param {object} scores 項目ごとの点数
 * @returns {HTMLElement} まとめの箱
 * @example summaryBox(scores)
 */
function summaryBox(scores) {
  const lines = summaryLines(scores);
  const box = el("div", "summary");
  box.append(el("p", null, lines.main));
  if (lines.missing.length > 0) {
    box.append(el("p", "sub", "未測定：" + lines.missing.join("・")));
  }
  if (lines.worstId) {
    const link = el("a", null, "「" + AXIS_TEXT[lines.worstId].name + "」を見る");
    link.href = "#ax-" + lines.worstId;
    link.addEventListener("click", function (event) {
      event.preventDefault();
      scrollToId("ax-" + lines.worstId);
    });
    box.append(el("p", "sub", "まず見るなら、いちばん伸びしろがある項目から。"), link);
  }
  return box;
}

/**
 * 紺の上部（戻る・見出し・動画の情報・チャートかエラー・まとめ）。
 * @param {object} report レポートの材料（main.js の buildReport を参照）
 * @param {object} actions ボタンの処理
 * @returns {HTMLElement} 上部
 * @example topPart(report, actions)
 */
function topPart(report, actions) {
  const top = el("header", "night report-top");
  const wrap = el("div", "wrap");
  const back = el("button", "back", "別の動画を調べる");
  back.type = "button";
  back.addEventListener("click", actions.onRestart);
  const meta = el("p", "meta");
  [["動画 ", report.fileName], ["長さ ", formatClock(report.durationSec)], ["調べた時間 ", formatElapsed(report.elapsedSec)]]
    .forEach(function (pair) {
      const item = el("span", null, pair[0]);
      item.append(el("b", null, pair[1]));
      meta.append(item);
    });
  wrap.append(back, el("p", "eyebrow", "RESULT"), el("h1", "title", "診断の結果"), meta);
  if (report.scores === null) {
    wrap.append(messageBox(BASELINE_FAILED.title, [BASELINE_FAILED.detail], "nobase"));
  } else {
    const canMeasureTempo = report.speech.phase === "idle" || report.speech.phase === "failed";
    const chartBox = el("div", "radar-box");
    chartBox.append(radarChart(report.scores, canMeasureTempo ? function () { scrollToId("speech-sec"); } : null));
    const legend = el("ul", "legend");
    const mine = el("li");
    mine.append(el("i", "me"), "あなたの動画");
    const band = el("li");
    band.append(el("i", "band"), "基準の中央の範囲");
    legend.append(mine, band);
    wrap.append(chartBox, legend, summaryBox(report.scores));
  }
  wrap.append(safeMini(SAFE_MINI_RESULT));
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
 * 6つの項目カードの区画。
 * @param {object} report レポートの材料
 * @returns {HTMLElement} 区画
 * @example axesSection(report)
 */
function axesSection(report) {
  const section = el("section", "sec");
  let lead = AXES_LEAD_WITH_BASELINE;
  if (report.scores === null) {
    lead = AXES_LEAD_NO_BASELINE;
  }
  section.append(sectionTitle("01", "6つの項目"), el("p", "sec-lead", lead));
  AXIS_IDS.forEach(function (axisId) {
    const value = report.values[axisId];
    let tailNote = "";
    if (axisId === "loop" && value !== null && report.endsSilent === true) {
      tailNote = TAIL_SILENT_NOTE;
    } else if (axisId === "loop" && value !== null && report.endsSilent === false) {
      tailNote = TAIL_SOUND_NOTE;
    }
    section.append(axisCard(axisId, {
      value: value,
      score: report.scores === null ? null : report.scores[axisId],
      axis: report.baseline ? report.baseline.axes[axisId] : null,
      missingReason: missingReason(axisId, report),
      tailNote: tailNote
    }));
  });
  return section;
}

/**
 * 基準の区画と、注意書き・もう一度の区画。
 * @param {object} report レポートの材料
 * @param {object} actions ボタンの処理
 * @returns {HTMLElement[]} 2つの区画
 * @example closingSections(report, actions)
 */
function closingSections(report, actions) {
  const source = el("section", "sec");
  source.append(sectionTitle("02", "比べた基準について"), sourceCard(report.baseline, true));
  const baseline = report.baseline;
  let madeText = BASELINE_INFO_MISSING;
  if (baseline) {
    madeText = "基準の作成日 " + baseline.created + "・もとにした動画 " + countText(baseline.count);
  }
  const sourceText = (baseline && baseline.source) || DEFAULT_SOURCE;
  const cautions = el("ul", "cautions");
  [CAUTION_BASELINE, CAUTION_TRANSCRIBE, madeText + "（" + sourceText + "から作った仮の基準）。"].forEach(function (text) {
    cautions.append(el("li", null, text));
  });
  const card = el("div", "card");
  card.append(cautions);
  const again = el("div", "again");
  const button = el("button", "btn btn-main", "別の動画を調べる");
  button.type = "button";
  button.addEventListener("click", actions.onRestart);
  again.append(button, el("p", null, "この結果は保存していません。残したいときは、画面の写真を撮ってください。"));
  const closing = el("section", "sec");
  closing.append(sectionTitle("03", "注意書き"), card, again);
  return [source, closing];
}

/**
 * レポートの画面を描く。
 * @param {HTMLElement} app 描く場所
 * @param {object} report レポートの材料（main.js の buildReport を参照）
 * @param {{onRestart:Function, onSpeechStart:Function, onSpeechCancel:Function}} actions ボタンの処理
 * @returns {void}
 * @example renderReport(app, report, actions)
 */
export function renderReport(app, report, actions) {
  app.textContent = "";
  const main = el("main", "wrap");
  const speechSection = el("section", "sec");
  speechSection.id = "speech-sec";
  speechSection.append(speechCard(report.speech, { onStart: actions.onSpeechStart, onCancel: actions.onSpeechCancel }));
  main.append(speechSection, axesSection(report), ...closingSections(report, actions));
  app.append(topPart(report, actions), main, footer());
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
