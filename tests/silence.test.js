/*
 * silence.test.js：js/silence.js（無音の区間・割合・最後の無音・音の有無）の自動テスト
 * 合成した音（ピーという音に無音をはさんだもの）で確かめる（AC-12）。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { windowVolumes, findSilences, silenceRatio, endsInSilence, hasAnySound, measureAudio } from "../js/silence.js";
import { toneWithSilence } from "./helpers.js";

const RATE = 16000;   // 本番と同じ1秒16000点

test("AC-12：途中に2秒の無音を入れた60秒の音で、無音の割合が約3%（±1%）", function () {
  const samples = toneWithSilence(60, RATE, [{ start: 20, end: 22 }]);
  const result = measureAudio(samples, RATE, 60);
  assert.ok(Math.abs(result.silence - 3) <= 1, "無音の割合 " + result.silence);
  assert.strictEqual(result.hasSound, true);
});

test("1秒より短い無音は「無音の区間」に数えない", function () {
  const samples = toneWithSilence(10, RATE, [{ start: 3, end: 3.5 }]);
  const silences = findSilences(windowVolumes(samples, RATE));
  assert.strictEqual(silences.length, 0);
});

test("割合の計算：60秒のうち2秒なら3.3%", function () {
  assert.strictEqual(silenceRatio([{ start: 10, end: 12 }], 60), 3.3);
  assert.strictEqual(silenceRatio([], 0), null);
});

test("最後の0.5秒が無音で終わるかどうか", function () {
  const silentEnd = toneWithSilence(10, RATE, [{ start: 9.3, end: 10 }]);
  const soundEnd = toneWithSilence(10, RATE, []);
  assert.strictEqual(endsInSilence(windowVolumes(silentEnd, RATE)), true);
  assert.strictEqual(endsInSilence(windowVolumes(soundEnd, RATE)), false);
});

test("音がまったくない動画は hasSound=false にして、無音の割合は出さない（未測定）", function () {
  const result = measureAudio(new Float32Array(RATE * 5), RATE, 5);
  assert.strictEqual(result.hasSound, false);
  assert.strictEqual(result.silence, null);
  assert.strictEqual(hasAnySound(windowVolumes(new Float32Array(100), RATE)), false);
});

test("話している時間（話す速さに使う）：0.3秒以上の間を除いた長さ", function () {
  const samples = toneWithSilence(10, RATE, [{ start: 2, end: 3 }, { start: 5, end: 5.1 }]);
  const result = measureAudio(samples, RATE, 10);
  assert.ok(Math.abs(result.voicedSec - 9) < 0.05, "話している時間 " + result.voicedSec);
});
