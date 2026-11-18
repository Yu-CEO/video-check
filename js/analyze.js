/*
 * analyze.js：開いた動画を「映像 → 音」の順に測り、5つの値（話す速さ以外）をまとめて返す
 * 主な関数：analyzeVideo（測る流れ）、progressPercent（手順ごとの進み具合を全体の％に直す。純粋な計算）
 * 実際の取り出しは frame_sampler.js・audio_loader.js、計算は visual_metrics.js・silence.js に任せる。
 * main.js から使われる。測った値・波形はメモリの中だけに置き、どこにも送らない・保存しない。
 */
import { sampleFrames } from "./frame_sampler.js";
import { measureVisual } from "./visual_metrics.js";
import { loadMonoAudio } from "./audio_loader.js";
import { measureAudio } from "./silence.js";

// 進み具合のバーで、各手順が全体の何%から何%までを受け持つか（映像がいちばん時間がかかるので広くとる）
export const STEP_RANGES = [
  { from: 0, to: 10 },    // 0 動画を開く
  { from: 10, to: 60 },   // 1 映像を調べる
  { from: 60, to: 90 },   // 2 音を調べる
  { from: 90, to: 100 }   // 3 基準と比べる
];

/**
 * 手順の番号と、その手順の中の進み具合（0〜1）から、全体の％を出す。
 * @param {number} stepIndex 手順の番号（0〜3）
 * @param {number} ratio 手順の中の進み具合（0〜1）
 * @returns {number} 全体の％（整数）
 * @example progressPercent(1, 0.6) // 40
 */
export function progressPercent(stepIndex, ratio) {
  const range = STEP_RANGES[stepIndex];
  const clamped = Math.min(1, Math.max(0, ratio));
  return Math.round(range.from + (range.to - range.from) * clamped);
}

/**
 * 動画を測る。途中で「やめる」が押されたら null を返す。
 * @param {File} file 選ばれたファイル（音声の取り出しに使う）
 * @param {{video:HTMLVideoElement, duration:number}} opened openVideo の結果
 * @param {(stepIndex:number, percent:number) => void} onProgress 進み具合を受け取る関数
 * @param {() => boolean} isCancelled 「やめる」が押されたら true を返す関数
 * @returns {Promise<object|null>} {values, endsSilent, hasSound, audio}。
 *   values＝項目ごとの値（話す速さはまだ null）、audio＝文字起こしに使う波形と話している時間
 * @example const measured = await analyzeVideo(file, opened, (step, pct) => {}, () => false);
 */
export async function analyzeVideo(file, opened, onProgress, isCancelled) {
  onProgress(1, progressPercent(1, 0));
  const frames = await sampleFrames(opened.video, opened.duration, function (ratio) {
    onProgress(1, progressPercent(1, ratio));
  }, isCancelled);
  if (frames === null) {
    return null;
  }
  const visual = measureVisual(frames, opened.duration);

  onProgress(2, progressPercent(2, 0));
  const audio = await loadMonoAudio(file);
  if (isCancelled()) {
    return null;
  }
  const sound = audio ? measureAudio(audio.samples, audio.sampleRate, opened.duration)
    : { hasSound: false, silence: null, endsSilent: null, voicedSec: null };
  onProgress(2, progressPercent(2, 1));

  return {
    values: {
      opening: visual.opening,
      cuts: visual.cuts,
      tempo: null,
      silence: sound.silence,
      length: visual.length,
      loop: visual.loop
    },
    endsSilent: sound.endsSilent,
    hasSound: sound.hasSound,
    audio: sound.hasSound ? { samples: audio.samples, sampleRate: audio.sampleRate, voicedSec: sound.voicedSec } : null
  };
}
