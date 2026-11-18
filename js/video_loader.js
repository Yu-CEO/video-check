/*
 * video_loader.js：選ばれたファイルを確かめ（種類・大きさ・長さ・開けるか）、端末の中だけで <video> に読み込む
 * 主な関数：checkFileBasics（種類と大きさの確認。純粋な計算）、checkDuration（長さの確認）、
 *   openVideo（<video> で開く。開けない形式は時間で打ち切る＝AC-7）、closeVideo（片付け）
 * ファイルはブラウザの中の一時的なURL（blob:）で読むだけで、外へは送らない。main.js・analyze.js から使われる。
 */
import { MAX_DURATION_SEC, MAX_FILE_BYTES, OPEN_TIMEOUT_MS, VIDEO_EXTENSIONS } from "./config.js";

const HUGE_TIME_SEC = 1e101;   // 長さが「わからない」動画で、最後まで飛ばして長さを確かめるための大きな時刻

/**
 * ファイルの種類と大きさを確かめる（開く前にわかることだけ）。
 * @param {{name:string, type:string, size:number}} file 選ばれたファイル
 * @returns {string} 問題の種類（"notVideo"・"tooBig"）。問題がなければ空の文字
 * @example checkFileBasics({name:"a.jpg", type:"image/jpeg", size:10}) // "notVideo"
 */
export function checkFileBasics(file) {
  const type = String(file.type || "");
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  // 一部の端末は種類（type）を空で渡すので、そのときだけ拡張子で判断する
  const looksLikeVideo = type.startsWith("video/") || (type === "" && VIDEO_EXTENSIONS.includes(extension));
  if (!looksLikeVideo) {
    return "notVideo";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "tooBig";
  }
  return "";
}

/**
 * 動画の長さを確かめる。
 * @param {number} durationSec 長さ（秒）
 * @returns {string} 問題の種類（"cannotOpen"・"tooLong"）。問題がなければ空の文字
 * @example checkDuration(200) // "tooLong"
 */
export function checkDuration(durationSec) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return "cannotOpen";
  }
  return durationSec > MAX_DURATION_SEC ? "tooLong" : "";
}

/**
 * <video> の出来事（イベント）を1回だけ待つ。決めた時間を過ぎたら失敗にする（画面を固めないため）。
 * @param {HTMLVideoElement} video 動画の要素
 * @param {string} eventName 待つ出来事の名前
 * @param {number} timeoutMs 待つ時間（ミリ秒）
 * @returns {Promise<void>} 起きたら成功、エラー・時間切れなら失敗
 * @example await waitForEvent(video, "loadeddata", 8000);
 */
export function waitForEvent(video, eventName, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      cleanUp();
      reject(new Error("timeout:" + eventName));
    }, timeoutMs);
    function onDone() {
      cleanUp();
      resolve();
    }
    function onError() {
      cleanUp();
      reject(new Error("error:" + eventName));
    }
    function cleanUp() {
      clearTimeout(timer);
      video.removeEventListener(eventName, onDone);
      video.removeEventListener("error", onError);
    }
    video.addEventListener(eventName, onDone);
    video.addEventListener("error", onError);
  });
}

/**
 * 長さが「わからない（Infinity）」と出る動画（ブラウザで録った webm など）の長さを、最後まで飛ばして確かめる。
 * @param {HTMLVideoElement} video 開いた動画
 * @returns {Promise<number>} 長さ（秒）
 * @example const seconds = await resolveDuration(video);
 */
async function resolveDuration(video) {
  if (Number.isFinite(video.duration)) {
    return video.duration;
  }
  const waiting = waitForEvent(video, "durationchange", OPEN_TIMEOUT_MS);
  video.currentTime = HUGE_TIME_SEC;
  await waiting;
  const duration = video.duration;
  const back = waitForEvent(video, "seeked", OPEN_TIMEOUT_MS);
  video.currentTime = 0;
  await back;
  return duration;
}

/**
 * 最初のコマが読み込まれるまで待つ。iPhone の Safari は再生するまで絵を読まないことがあるため、
 * 音を消したまま一瞬だけ再生して止める（音を消した再生は、ボタンを押さなくても許されている）。
 * @param {HTMLVideoElement} video 開いた動画
 * @returns {Promise<void>} 絵が読めたら成功、時間切れなら失敗
 * @example await ensureFirstFrame(video);
 */
async function ensureFirstFrame(video) {
  const HAVE_CURRENT_DATA = 2;   // ブラウザの決まり：2以上なら今のコマの絵がある
  if (video.readyState >= HAVE_CURRENT_DATA) {
    return;
  }
  const loaded = waitForEvent(video, "loadeddata", OPEN_TIMEOUT_MS);
  // 再生の結果は待たない（開けない形式では返事が来ないことがあるため）。絵が読めたかは loadeddata で判断する
  video.play().then(function () {
    video.pause();
  }).catch(function () {
    // 再生が許されない端末でも、絵の読み込みは続くので何もしない
  });
  await loaded;
}

/**
 * ファイルを <video> で開き、長さと絵の大きさがわかるまで待つ。音は鳴らさない。
 * @param {File} file 選ばれたファイル
 * @returns {Promise<{video:HTMLVideoElement, url:string, duration:number, problem:string}>}
 *   problem が空でなければ開けない・長すぎる（"cannotOpen"・"tooLong"）。そのときは片付け済み
 * @example const opened = await openVideo(file);
 */
export async function openVideo(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const opened = { video: video, url: url, duration: 0, problem: "" };
  try {
    const ready = waitForEvent(video, "loadedmetadata", OPEN_TIMEOUT_MS);
    video.src = url;
    await ready;
    await ensureFirstFrame(video);
    opened.duration = await resolveDuration(video);
    // 音だけ再生できて絵が出ない形式（一部の HEVC など）は、絵の大きさが0になる
    opened.problem = video.videoWidth > 0 ? checkDuration(opened.duration) : "cannotOpen";
  } catch (error) {
    opened.problem = "cannotOpen";
  }
  if (opened.problem !== "") {
    closeVideo(opened);
  }
  return opened;
}

/**
 * 開いた動画を片付ける（一時的なURLを消して、メモリを空ける）。
 * @param {{video:HTMLVideoElement, url:string}} opened openVideo の結果
 * @returns {void}
 * @example closeVideo(opened);
 */
export function closeVideo(opened) {
  if (!opened) {
    return;
  }
  opened.video.removeAttribute("src");
  opened.video.load();
  URL.revokeObjectURL(opened.url);
}
