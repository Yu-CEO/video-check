/*
 * main.js：入口。全体の流れだけを書く
 *   1. ページを開いたら、基準の表を読み始め、はじめの画面（問いかけ・見方の2択）を出し、開いた回数を1回だけ数える
 *   2. 動画が選ばれたら：種類・大きさを確かめる → 開く（長さ・形式）→ 映像と音を測る → 基準と比べて点数 → レポート
 *   3. 「話す速さも測る」が押されたら：文字起こし → 話す速さ → 点数を出し直してレポートを描き直す
 *   4. 結果の画面で「〜として見る」が押されたら：見方だけ変えて描き直す（測り直さない）
 * 細かい処理は各ファイルに任せる（測る＝analyze.js、点数＝score.js、画面＝*_view.js）。動画・結果はメモリの中だけに置く。
 */
import { checkFileBasics, openVideo, closeVideo } from "./video_loader.js";
import { analyzeVideo, progressPercent } from "./analyze.js";
import { loadBaseline } from "./baseline.js";
import { scoreAll } from "./score.js";
import { measureSpeakingRate, cancelTranscription } from "./transcribe.js";
import { renderStart, updateStartMore } from "./start_view.js";
import { DEFAULT_MODE, otherMode } from "./view_mode.js";
import { renderProgress, renderRunFailed } from "./progress_view.js";
import { renderReport, updateSpeechSection } from "./report_view.js";
import { formatElapsed, toMegabytes } from "./report_text.js";
import { countPageView } from "./analytics.js";

const app = document.getElementById("app");
const fileInput = document.getElementById("file");
// 今の状態。ページを閉じると消える（ブラウザの保存場所には書かない＝AC-5）
// mode＝見方（fan＝好きな動画・最初／maker＝自分で作った動画）。結果の言い方と並び順だけが変わり、測り直さない
const state = {
  baselinePromise: loadBaseline(),   // 基準の表を読む約束（読み終わりを待つのに使う）
  baselineResult: null,              // 読めた結果（まだなら null）
  run: null,                         // 今の測定（「やめる」の印を持つ）
  report: null,                      // 結果の材料
  speechRun: null,                   // 今の文字起こし
  mode: DEFAULT_MODE                 // 見方
};
const COMPARE_STEP = 3;   // 進み具合の4つめの手順「基準と比べる」

/**
 * 読めた基準（読めていなければ null）。
 * @returns {object|null} baseline
 * @example currentBaseline()
 */
function currentBaseline() {
  return state.baselineResult && state.baselineResult.ok ? state.baselineResult.baseline : null;
}

/** 動画を選ぶ画面（端末のファイル選び）を開く。 @returns {void} */
function openPicker() {
  fileInput.click();
}

/**
 * はじめの画面を出す（エラーがあれば一緒に出す）。測った結果はここで捨てる。
 * @param {string} errorKey エラーの種類（なければ空の文字）
 * @param {string} errorFile エラーのときに出すファイルの説明
 * @returns {void}
 * @example showStart("tooLong", "a.mp4（4分12秒）")
 */
function showStart(errorKey, errorFile) {
  cancelTranscription();
  state.run = null;
  state.report = null;
  renderStart(app, {
    mode: state.mode, errorKey: errorKey, errorFile: errorFile, baseline: currentBaseline(), onPick: openPicker,
    onModeChange: function (mode) { state.mode = mode; }
  });
  window.scrollTo(0, 0);
}

/**
 * エラーのときに出すファイルの説明（名前に、長さや大きさを添える）。
 * @param {File} file ファイル
 * @param {string} errorKey エラーの種類
 * @param {number} durationSec 長さ（わからなければ 0）
 * @returns {string} 説明 例 "a.mp4（4分12秒）"
 * @example describeFile(file, "tooBig", 0)
 */
function describeFile(file, errorKey, durationSec) {
  if (errorKey === "tooLong") {
    return file.name + "（" + formatElapsed(durationSec) + "）";
  }
  return errorKey === "tooBig" ? file.name + "（" + toMegabytes(file.size) + "MB）" : file.name;
}

/**
 * 測った値と基準から、レポートの材料を作る。
 * @param {File} file ファイル
 * @param {number} durationSec 長さ（秒）
 * @param {object} measured analyzeVideo の結果
 * @param {number} startedAt 調べ始めた時刻（performance.now のミリ秒）
 * @returns {object} レポートの材料
 * @example buildReport(file, 48, measured, 0)
 */
function buildReport(file, durationSec, measured, startedAt) {
  const baseline = currentBaseline();
  return {
    fileName: file.name,
    durationSec: durationSec,
    elapsedSec: (performance.now() - startedAt) / 1000,
    values: measured.values,
    baseline: baseline,
    scores: baseline ? scoreAll(measured.values, baseline) : null,
    hasSound: measured.hasSound,
    endsSilent: measured.endsSilent,
    audio: measured.audio,
    speech: { phase: measured.hasSound ? "idle" : "noaudio", percent: 0 },
    mode: state.mode
  };
}

/**
 * 選ばれた動画を調べて、レポートを出す（流れの中心）。
 * @param {File} file 選ばれたファイル
 * @returns {Promise<void>}
 * @example checkVideo(file)
 */
async function checkVideo(file) {
  const startedAt = performance.now();
  const basicProblem = checkFileBasics(file);
  if (basicProblem !== "") {
    showStart(basicProblem, describeFile(file, basicProblem, 0));
    return;
  }
  const run = { cancelled: false };
  state.run = run;
  const info = { name: file.name, durationSec: 0, bytes: file.size };
  const update = renderProgress(app, info, function () {
    run.cancelled = true;
    showStart("", "");
  });
  update(0, 0);
  const opened = await openVideo(file);
  if (run.cancelled || opened.problem !== "") {
    if (!run.cancelled) {
      showStart(opened.problem, describeFile(file, opened.problem, opened.duration));
    }
    return;
  }
  // analyzeVideo は「やめる」が押されたとき null を返す。途中のエラーは { failed: true } の形にそろえて見分ける
  const measured = await analyzeVideo(file, opened, update, function () { return run.cancelled; })
    .catch(function () { return { failed: true }; })
    .finally(function () { closeVideo(opened); });
  if (run.cancelled || measured === null) {
    return;
  }
  if (measured.failed) {
    renderRunFailed(app, info, { onRetry: function () { checkVideo(file); }, onPickAnother: openPicker });
    return;
  }
  update(COMPARE_STEP, progressPercent(COMPARE_STEP, 0));
  state.baselineResult = await state.baselinePromise;
  state.report = buildReport(file, opened.duration, measured, startedAt);
  update(COMPARE_STEP, 100);
  showReport(false);
}

// レポートのボタンの処理（話す速さ・別の動画）
const reportActions = {
  onRestart: function () { showStart("", ""); },
  onSpeechStart: startSpeech,
  onSpeechCancel: cancelSpeech,
  onSwitchMode: switchMode
};

/**
 * 見方を切り替えて、測り直さずに結果を描き直す（画面の位置は保つ）。
 * @returns {void}
 * @example switchMode()
 */
function switchMode() {
  state.mode = otherMode(state.mode);
  state.report.mode = state.mode;
  showReport(true);
}

/**
 * レポートを描く。話す速さが測れたあとは、画面の位置を保ったまま描き直す。
 * @param {boolean} keepScroll 今の位置を保つなら true
 * @returns {void}
 * @example showReport(false)
 */
function showReport(keepScroll) {
  const scrollY = window.scrollY;
  renderReport(app, state.report, reportActions);
  window.scrollTo(0, keepScroll ? scrollY : 0);
}

/**
 * 話す速さの状態を変えて、カードだけ描き直す。
 * @param {string} phase 状態
 * @param {number} percent 進み具合（%）
 * @returns {void}
 * @example setSpeech("loading", 40)
 */
function setSpeech(phase, percent) {
  state.report.speech = { phase: phase, percent: percent };
  updateSpeechSection(state.report, reportActions);
}

/**
 * 「話す速さも測る」：文字起こしをして、話す速さと点数を入れてレポートを描き直す。失敗したら「未測定」のまま。
 * @returns {Promise<void>}
 * @example startSpeech()
 */
async function startSpeech() {
  const report = state.report;
  if (!report || !report.audio) {
    return;
  }
  const speechRun = {};
  state.speechRun = speechRun;
  setSpeech("loading", 0);
  let rate = null;
  try {
    const result = await measureSpeakingRate(report.audio, function (phase, percent) {
      if (state.speechRun === speechRun) {
        setSpeech(phase, percent);
      }
    });
    rate = result.rate;
  } catch (error) {
    rate = null;
  }
  if (state.speechRun !== speechRun || state.report !== report) {
    return;   // 途中で「やめる」・別の動画が選ばれた
  }
  report.values.tempo = rate;
  report.scores = report.baseline ? scoreAll(report.values, report.baseline) : null;
  report.speech = { phase: rate === null ? "failed" : "done", percent: 100 };
  showReport(true);
}

/** 話す速さを途中でやめて、押す前の状態に戻す。 @returns {void} */
function cancelSpeech() {
  state.speechRun = null;
  cancelTranscription();
  setSpeech("idle", 0);
}

// ---- ここから、ページを開いたときの流れ ----
fileInput.addEventListener("change", function () {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = "";   // 同じ動画をもう一度選んでも反応するように空にする
  if (file) {
    checkVideo(file);
  }
});
showStart("", "");
state.baselinePromise.then(function (result) {
  state.baselineResult = result;
  if (!result.ok) {
    console.warn("基準の表が読めませんでした：" + result.reason);
  }
  updateStartMore(currentBaseline());
});
countPageView();
