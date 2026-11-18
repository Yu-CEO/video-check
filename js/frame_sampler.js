/*
 * frame_sampler.js：<video> の決まった時刻へ順に飛び、そのコマを <canvas> で小さくして色の数字として取り出す
 * 主な関数：sampleFrames（全部のコマを取り出す）、seekTo（1つの時刻へ飛んで待つ）
 * 画面の部品（<video>・<canvas>）を使うのでブラウザの中だけで動く。計算は visual_metrics.js に任せる。
 * analyze.js から使われる。取り出したコマはメモリの中だけに置き、どこにも保存しない。
 */
import { FRAME_WIDTH_PX, SEEK_TIMEOUT_MS } from "./config.js";
import { buildSampleTimes } from "./visual_metrics.js";
import { waitForEvent } from "./video_loader.js";

/**
 * 動画を決まった時刻へ飛ばし、そのコマが表示できるまで待つ。
 * @param {HTMLVideoElement} video 動画
 * @param {number} seconds 時刻（秒）
 * @returns {Promise<void>} 飛び終わったら成功、時間切れなら失敗
 * @example await seekTo(video, 1.5);
 */
export async function seekTo(video, seconds) {
  const done = waitForEvent(video, "seeked", SEEK_TIMEOUT_MS);
  video.currentTime = seconds;
  await done;
}

/**
 * コマを入れる小さな <canvas> を用意する（横32px。縦は動画の縦横の比に合わせる）。
 * @param {HTMLVideoElement} video 動画
 * @returns {{canvas:HTMLCanvasElement, context:CanvasRenderingContext2D}} 描く場所
 * @example const surface = makeSurface(video);
 */
function makeSurface(video) {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_WIDTH_PX;
  canvas.height = Math.max(1, Math.round(FRAME_WIDTH_PX * video.videoHeight / video.videoWidth));
  // 何度も色を読み出すので、読み出しが速い作り方をブラウザに頼む
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return { canvas: canvas, context: context };
}

/**
 * 決まった間隔でコマを取り出す。1コマ取るごとに進み具合（0〜1）を知らせ、「やめる」が押されたら止める。
 * @param {HTMLVideoElement} video openVideo で開いた動画
 * @param {number} durationSec 長さ（秒）
 * @param {(ratio:number) => void} onProgress 進み具合を受け取る関数
 * @param {() => boolean} isCancelled 「やめる」が押されたら true を返す関数
 * @returns {Promise<{time:number, pixels:Uint8ClampedArray}[]|null>} コマの一覧。やめたときは null
 * @example const frames = await sampleFrames(video, 60, ratio => {}, () => false);
 */
export async function sampleFrames(video, durationSec, onProgress, isCancelled) {
  video.pause();
  const times = buildSampleTimes(durationSec);
  const surface = makeSurface(video);
  const frames = [];
  for (let index = 0; index < times.length; index += 1) {
    if (isCancelled()) {
      return null;
    }
    await seekTo(video, times[index]);
    surface.context.drawImage(video, 0, 0, surface.canvas.width, surface.canvas.height);
    const image = surface.context.getImageData(0, 0, surface.canvas.width, surface.canvas.height);
    frames.push({ time: times[index], pixels: image.data });
    onProgress((index + 1) / times.length);
  }
  return frames;
}
