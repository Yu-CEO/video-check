/*
 * silence.js：音の波形から、無音の区間・無音の割合・最後が無音か・話していない時間を計算する
 * 主な関数：windowVolumes（0.01秒ごとの音量）、findSilences（無音の区間）、silenceRatio（全体の何%か）、
 *   endsInSilence（最後の0.5秒が無音か）、hasAnySound（音が入っているか）、measureAudio（まとめて計算）
 * 画面に触らない純粋な計算なので、tests/silence.test.js で画面なしに確かめられる。
 * 音の取り出しは audio_loader.js、呼び出しは analyze.js。考え方は手元の分析ツールと同じ。
 */
import {
  VOLUME_WINDOW_SEC, SILENCE_THRESHOLD_DB, SILENCE_MIN_SEC, PAUSE_MIN_SEC, TAIL_SEC
} from "./config.js";

const QUIET_DB = -120;          // まったく音がない窓の音量。log(0) を避けるための下限
const POWER_FLOOR = 1e-12;      // これより小さい強さは「まったく音がない」とみなす
const PERCENT = 100;

/**
 * 波形を0.01秒ずつに区切って、それぞれの音量（dB。0が最大、小さいほど静か）を出す。
 * @param {Float32Array|number[]} samples 波形（-1〜1）
 * @param {number} sampleRate 1秒あたりの点の数
 * @param {number} [windowSec] 区切る長さ（秒）
 * @returns {number[]} 音量（dB）の並び
 * @example windowVolumes(new Float32Array(160), 16000) // [-120]
 */
export function windowVolumes(samples, sampleRate, windowSec = VOLUME_WINDOW_SEC) {
  const windowSize = Math.max(1, Math.round(sampleRate * windowSec));
  const volumes = [];
  for (let start = 0; start < samples.length; start += windowSize) {
    const end = Math.min(start + windowSize, samples.length);
    let power = 0;
    for (let index = start; index < end; index += 1) {
      power += samples[index] * samples[index];
    }
    power /= end - start;
    volumes.push(power < POWER_FLOOR ? QUIET_DB : 10 * Math.log10(power));
  }
  return volumes;
}

/**
 * 音量がしきい値以下の窓が、決まった秒数以上続いたところを「無音の区間」として返す。
 * @param {number[]} volumes windowVolumes の結果
 * @param {object} [options] {windowSec, thresholdDb, minSec}
 * @returns {{start:number, end:number}[]} 無音の区間（秒）
 * @example findSilences([-60, -60, -10], {windowSec: 1, minSec: 2}) // [{start:0, end:2}]
 */
export function findSilences(volumes, options = {}) {
  const windowSec = options.windowSec ?? VOLUME_WINDOW_SEC;
  const thresholdDb = options.thresholdDb ?? SILENCE_THRESHOLD_DB;
  const minSec = options.minSec ?? SILENCE_MIN_SEC;
  const silences = [];
  let runStart = null;
  // 最後に「音あり」の窓を1つ足して、末尾まで続いた無音も同じ手順で閉じる
  const extended = volumes.concat([Infinity]);
  extended.forEach(function (volume, index) {
    const quiet = volume <= thresholdDb;
    if (quiet && runStart === null) {
      runStart = index;
    } else if (!quiet && runStart !== null) {
      const lengthSec = (index - runStart) * windowSec;
      // 小数の誤差で「ちょうど1秒」が外れないよう、ごくわずかに甘く比べる
      if (lengthSec + 1e-9 >= minSec) {
        silences.push({ start: runStart * windowSec, end: index * windowSec });
      }
      runStart = null;
    }
  });
  return silences;
}

/**
 * 無音の区間の合計が、動画全体の何%かを出す。
 * @param {{start:number, end:number}[]} silences findSilences の結果
 * @param {number} durationSec 動画の長さ（秒）
 * @returns {number|null} 割合（%、小数1桁）。長さが0なら null
 * @example silenceRatio([{start:10, end:12}], 60) // 3.3
 */
export function silenceRatio(silences, durationSec) {
  if (!(durationSec > 0)) {
    return null;
  }
  const total = totalSeconds(silences);
  return Math.round((total / durationSec) * PERCENT * 10) / 10;
}

/**
 * 区間の長さの合計（秒）。
 * @param {{start:number, end:number}[]} ranges 区間
 * @returns {number} 合計（秒）
 * @example totalSeconds([{start:1, end:3}, {start:5, end:6}]) // 3
 */
export function totalSeconds(ranges) {
  return ranges.reduce(function (sum, range) {
    return sum + (range.end - range.start);
  }, 0);
}

/**
 * 最後の0.5秒が、ずっと無音かどうか。
 * @param {number[]} volumes windowVolumes の結果
 * @param {object} [options] {windowSec, thresholdDb, tailSec}
 * @returns {boolean} 最後まで無音なら true
 * @example endsInSilence([-10, -60, -60], {windowSec: 0.25, tailSec: 0.5}) // true
 */
export function endsInSilence(volumes, options = {}) {
  const windowSec = options.windowSec ?? VOLUME_WINDOW_SEC;
  const thresholdDb = options.thresholdDb ?? SILENCE_THRESHOLD_DB;
  const tailSec = options.tailSec ?? TAIL_SEC;
  const tailCount = Math.max(1, Math.round(tailSec / windowSec));
  const tail = volumes.slice(-tailCount);
  return tail.length > 0 && tail.every(function (volume) {
    return volume <= thresholdDb;
  });
}

/**
 * しきい値を超える音が1か所でもあるか（音声が入っていない動画を見分けるため）。
 * @param {number[]} volumes windowVolumes の結果
 * @param {number} [thresholdDb] しきい値（dB）
 * @returns {boolean} 音があれば true
 * @example hasAnySound([-120, -120]) // false
 */
export function hasAnySound(volumes, thresholdDb = SILENCE_THRESHOLD_DB) {
  return volumes.some(function (volume) {
    return volume > thresholdDb;
  });
}

/**
 * 音の値をまとめて計算する。音がまったくないときは hasSound=false にして、ほかは null にする。
 * @param {Float32Array} samples 波形（-1〜1）
 * @param {number} sampleRate 1秒あたりの点の数
 * @param {number} durationSec 動画の長さ（秒）
 * @returns {{hasSound:boolean, silence:number|null, endsSilent:boolean|null, voicedSec:number|null}}
 *   silence＝無音の割合（%）、endsSilent＝最後の0.5秒が無音か、voicedSec＝話す速さに使う「音がある時間」（秒）
 * @example measureAudio(samples, 16000, 60) // {hasSound:true, silence:3.3, endsSilent:false, voicedSec:57.5}
 */
export function measureAudio(samples, sampleRate, durationSec) {
  const volumes = windowVolumes(samples, sampleRate);
  if (!hasAnySound(volumes)) {
    return { hasSound: false, silence: null, endsSilent: null, voicedSec: null };
  }
  const silences = findSilences(volumes);
  const pauses = findSilences(volumes, { minSec: PAUSE_MIN_SEC });
  const audioSec = samples.length / sampleRate;
  return {
    hasSound: true,
    silence: silenceRatio(silences, durationSec),
    endsSilent: endsInSilence(volumes),
    voicedSec: Math.max(0, audioSec - totalSeconds(pauses))
  };
}
