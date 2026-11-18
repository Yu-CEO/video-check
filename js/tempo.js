/*
 * tempo.js：文字起こしの結果から「話す速さ（文字/秒）」を計算し、文字起こし用に音声を30秒ずつに分ける
 * 主な関数：countSpokenCharacters（話した文字の数）、speakingRate（文字/秒）、splitIntoChunks（音声を分ける）
 * 画面に触らない純粋な計算なので、tests/tempo.test.js で画面なしに確かめられる。
 * 「話している時間」は silence.js の voicedSec（0.3秒以上の間を除いた時間）を使う。transcribe.js・main.js から使われる。
 */
import { TRANSCRIBE_CHUNK_SEC } from "./config.js";

const MIN_VOICED_SEC = 1;   // 話している時間が1秒未満なら、速さは信用できないので出さない
// 文字起こしモデルが付けることのある「[音楽]」「（拍手）」のような注記。話した言葉ではないので数えない
const NOTE_PATTERN = /[\[［(（【][^\]］)）】]*[\]］)）】]/g;
// 正規表現（文字のパターンで探す書き方）で、空白・句読点・記号をまとめて取り除く
const NOT_SPOKEN_PATTERN = /[\s\p{P}\p{S}]/gu;

/**
 * 話した文字の数を数える（空白・句読点・記号・注記は数えない）。
 * @param {string} text 文字起こしの結果
 * @returns {number} 文字の数
 * @example countSpokenCharacters("こんにちは、[音楽] 世界！") // 7
 */
export function countSpokenCharacters(text) {
  const cleaned = String(text || "").replace(NOTE_PATTERN, "").replace(NOT_SPOKEN_PATTERN, "");
  return Array.from(cleaned).length;
}

/**
 * 話す速さ（話している時間1秒あたりの文字数）を出す。
 * @param {string} text 文字起こしの結果
 * @param {number} voicedSec 話している時間（秒）
 * @returns {number|null} 文字/秒（小数1桁）。文字がない・時間が短すぎるときは null（＝未測定）
 * @example speakingRate("あいうえおかきくけこ", 2) // 5
 */
export function speakingRate(text, voicedSec) {
  const characters = countSpokenCharacters(text);
  if (characters === 0 || !(voicedSec >= MIN_VOICED_SEC)) {
    return null;
  }
  return Math.round((characters / voicedSec) * 10) / 10;
}

/**
 * 音声を決まった秒数ずつに分ける（文字起こしモデルは30秒ずつしか聞けないため）。
 * @param {Float32Array} samples 波形
 * @param {number} sampleRate 1秒あたりの点の数
 * @param {number} [chunkSec] 1つの長さ（秒）
 * @returns {Float32Array[]} 分けた波形（元の波形のコピー）
 * @example splitIntoChunks(new Float32Array(70), 1, 30).length // 3
 */
export function splitIntoChunks(samples, sampleRate, chunkSec = TRANSCRIBE_CHUNK_SEC) {
  const chunkSize = Math.max(1, Math.round(sampleRate * chunkSec));
  const chunks = [];
  for (let start = 0; start < samples.length; start += chunkSize) {
    // slice でコピーにする。Worker へ渡すと元の波形が使えなくなるため
    chunks.push(samples.slice(start, start + chunkSize));
  }
  return chunks;
}
