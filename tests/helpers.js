/*
 * helpers.js：テスト用の合成データ（色だけのコマ・音の波形）を作る道具
 * 他人の動画・本人の動画は使わず、ここで数字から作った合成のコマと音だけを使う（AC-22）。
 * tests/*.test.js から使われる。
 */

export const FRAME_WIDTH = 8;    // テストのコマは 8×14 の小さな絵（本番の縦横の比に近い）
export const FRAME_HEIGHT = 14;

/**
 * 1色で塗ったコマ（RGBA の並び）を作る。
 * @param {number[]} rgb [赤, 緑, 青]（0〜255）
 * @returns {Uint8ClampedArray} コマの色の並び
 * @example solidFrame([0, 0, 0])
 */
export function solidFrame(rgb) {
  const pixels = new Uint8ClampedArray(FRAME_WIDTH * FRAME_HEIGHT * 4);
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = rgb[0];
    pixels[index + 1] = rgb[1];
    pixels[index + 2] = rgb[2];
    pixels[index + 3] = 255;
  }
  return pixels;
}

/**
 * 時刻ごとに色を決める関数から、コマの一覧を作る（合成動画のかわり）。
 * @param {number[]} times 時刻（秒）の一覧
 * @param {(time:number) => number[]} colorAt 時刻 → 色
 * @returns {{time:number, pixels:Uint8ClampedArray}[]} コマの一覧
 * @example syntheticFrames([0, 0.5], () => [0, 0, 0])
 */
export function syntheticFrames(times, colorAt) {
  return times.map(function (time) {
    return { time: time, pixels: solidFrame(colorAt(time)) };
  });
}

/**
 * 決まった区間だけ無音にした、正弦波（ピーという音）の波形を作る。
 * @param {number} durationSec 長さ（秒）
 * @param {number} sampleRate 1秒あたりの点の数
 * @param {{start:number, end:number}[]} silentRanges 無音にする区間（秒）
 * @returns {Float32Array} 波形
 * @example toneWithSilence(60, 1000, [{start:20, end:22}])
 */
export function toneWithSilence(durationSec, sampleRate, silentRanges) {
  const samples = new Float32Array(Math.round(durationSec * sampleRate));
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const silent = silentRanges.some(function (range) {
      return time >= range.start && time < range.end;
    });
    samples[index] = silent ? 0 : 0.3 * Math.sin(2 * Math.PI * 220 * time);
  }
  return samples;
}
