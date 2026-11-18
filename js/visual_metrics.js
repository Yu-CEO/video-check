/*
 * visual_metrics.js：取り出したコマから、映像の4つの値（冒頭3秒の変化・変化の頻度・ループ・尺）を計算する
 * 主な関数：buildSampleTimes（どの時刻のコマを取るか）、frameDifference（2コマの違い）、
 *   openingChange・cutsPerMinute・loopSimilarity（各項目の値）、measureVisual（まとめて計算）
 * 画面（<video>・<canvas>）には触らない純粋な計算なので、tests/visual_metrics.test.js で画面なしに確かめられる。
 * コマの取り出しは frame_sampler.js、呼び出しは analyze.js。
 */
import { SAMPLE_STEP_SEC, END_MARGIN_SEC, OPENING_SEC, CUT_THRESHOLD } from "./config.js";

const CHANNEL_MAX = 255;      // 色の明るさの最大値（0〜255）
const RGBA_STEP = 4;          // 1つの点は 赤・緑・青・透明度 の4つの数で並んでいる
const PERCENT = 100;
const SECONDS_PER_MINUTE = 60;

/**
 * コマを取り出す時刻の一覧を作る。0秒から一定間隔で、最後は終わりの少し手前を必ず入れる。
 * @param {number} durationSec 動画の長さ（秒）
 * @param {number} [stepSec] 間隔（秒）
 * @returns {number[]} 時刻（秒）の一覧（小さい順）
 * @example buildSampleTimes(1.2, 0.5) // [0, 0.5, 1, 1.15]
 */
export function buildSampleTimes(durationSec, stepSec = SAMPLE_STEP_SEC) {
  const lastTime = Math.max(durationSec - END_MARGIN_SEC, 0);
  const times = [];
  for (let index = 0; index * stepSec < lastTime; index += 1) {
    times.push(roundTime(index * stepSec));
  }
  times.push(roundTime(lastTime));
  return times;
}

/**
 * 時刻を1000分の1秒で丸める（0.1＋0.2 のような小数の誤差で同じ時刻が2つできるのを防ぐ）。
 * @param {number} seconds 秒
 * @returns {number} 丸めた秒
 * @example roundTime(0.30000000000000004) // 0.3
 */
function roundTime(seconds) {
  return Math.round(seconds * 1000) / 1000;
}

/**
 * 2つのコマの違いの大きさを 0〜100 で返す（色の差の平均。0＝同じ、100＝白と黒のように正反対）。
 * @param {Uint8ClampedArray|number[]} pixelsA コマA（RGBA の並び）
 * @param {Uint8ClampedArray|number[]} pixelsB コマB（同じ大きさ）
 * @returns {number} 違い（0〜100）
 * @example frameDifference([0,0,0,255], [255,255,255,255]) // 100
 */
export function frameDifference(pixelsA, pixelsB) {
  const length = Math.min(pixelsA.length, pixelsB.length);
  let total = 0;
  let count = 0;
  for (let index = 0; index + 2 < length; index += RGBA_STEP) {
    // 透明度（4つめ）は動画では常に不透明なので比べない
    total += Math.abs(pixelsA[index] - pixelsB[index]);
    total += Math.abs(pixelsA[index + 1] - pixelsB[index + 1]);
    total += Math.abs(pixelsA[index + 2] - pixelsB[index + 2]);
    count += 3;
  }
  if (count === 0) {
    return 0;
  }
  return (total / count / CHANNEL_MAX) * PERCENT;
}

/**
 * となりどうしのコマの違いを順に並べる。
 * @param {{time:number, pixels:Uint8ClampedArray}[]} frames 時刻の順に並んだコマ
 * @returns {{time:number, difference:number}[]} 後ろのコマの時刻と、その前のコマとの違い
 * @example neighborDifferences(frames) // [{time:0.5, difference:3.2}, ...]
 */
export function neighborDifferences(frames) {
  const list = [];
  for (let index = 1; index < frames.length; index += 1) {
    list.push({
      time: frames[index].time,
      difference: frameDifference(frames[index - 1].pixels, frames[index].pixels)
    });
  }
  return list;
}

/**
 * 冒頭3秒の絵の変化：0〜3秒のとなりどうしのコマの違いの平均（0〜100）。
 * 止まった画面なら0に近く、色や場面が入れ替わるほど大きくなる。
 * @param {{time:number, difference:number}[]} differences neighborDifferences の結果
 * @param {number} [openingSec] 冒頭の長さ（秒）
 * @returns {number|null} 値（0〜100、小数1桁）。比べるコマがないときは null
 * @example openingChange([{time:0.5, difference:10}, {time:1, difference:20}]) // 15
 */
export function openingChange(differences, openingSec = OPENING_SEC) {
  const opening = differences.filter(function (item) {
    return item.time <= openingSec + END_MARGIN_SEC;
  });
  if (opening.length === 0) {
    return null;
  }
  const sum = opening.reduce(function (total, item) {
    return total + item.difference;
  }, 0);
  return roundOne(sum / opening.length);
}

/**
 * 絵の変化の頻度：となりのコマとの違いがしきい値を超えた回数を、1分あたりに直す。
 * @param {{time:number, difference:number}[]} differences neighborDifferences の結果
 * @param {number} durationSec 動画の長さ（秒）
 * @param {number} [threshold] 「大きく変わった」とみなす違い（0〜100）
 * @returns {number|null} 回/分（小数1桁）。長さが0のときは null
 * @example cutsPerMinute([{time:5, difference:80}], 60) // 1
 */
export function cutsPerMinute(differences, durationSec, threshold = CUT_THRESHOLD) {
  if (!(durationSec > 0)) {
    return null;
  }
  const cutCount = differences.filter(function (item) {
    return item.difference > threshold;
  }).length;
  return roundOne(cutCount / (durationSec / SECONDS_PER_MINUTE));
}

/**
 * 最後の切れ目（ループ）：最初のコマと最後のコマの似ている度合い（%）。100＝同じ絵。
 * @param {{pixels:Uint8ClampedArray}[]} frames 時刻の順に並んだコマ
 * @returns {number|null} 似ている度合い（0〜100、整数）。コマが2つ未満なら null
 * @example loopSimilarity([{pixels:[0,0,0,255]}, {pixels:[0,0,0,255]}]) // 100
 */
export function loopSimilarity(frames) {
  if (frames.length < 2) {
    return null;
  }
  const difference = frameDifference(frames[0].pixels, frames[frames.length - 1].pixels);
  return Math.round(PERCENT - difference);
}

/**
 * 映像の4つの値をまとめて計算する。
 * @param {{time:number, pixels:Uint8ClampedArray}[]} frames frame_sampler.js が取り出したコマ
 * @param {number} durationSec 動画の長さ（秒）
 * @returns {{opening:number|null, cuts:number|null, loop:number|null, length:number}} 各項目の値
 * @example measureVisual(frames, 48.2) // {opening:9.1, cuts:5, loop:58, length:48.2}
 */
export function measureVisual(frames, durationSec) {
  const differences = neighborDifferences(frames);
  return {
    opening: openingChange(differences),
    cuts: cutsPerMinute(differences, durationSec),
    loop: loopSimilarity(frames),
    length: roundOne(durationSec)
  };
}

/**
 * 小数1桁に丸める（画面に出す桁にそろえる）。
 * @param {number} value 数
 * @returns {number} 丸めた数
 * @example roundOne(3.14159) // 3.1
 */
function roundOne(value) {
  return Math.round(value * 10) / 10;
}
