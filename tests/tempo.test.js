/*
 * tempo.test.js：js/tempo.js（話した文字の数・話す速さ・音声の分け方）の自動テスト（AC-14）
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { countSpokenCharacters, speakingRate, splitIntoChunks } from "../js/tempo.js";

test("話した文字だけを数える（空白・句読点・記号・[音楽] などの注記は数えない）", function () {
  assert.strictEqual(countSpokenCharacters("こんにちは、[音楽] 世界！"), 7);
  assert.strictEqual(countSpokenCharacters("（拍手）"), 0);
  assert.strictEqual(countSpokenCharacters(""), 0);
});

test("AC-14：話す速さ（文字/秒）＝ 文字の数 ÷ 話している時間", function () {
  assert.strictEqual(speakingRate("あいうえおかきくけこ", 2), 5);
  assert.strictEqual(speakingRate("今日は投稿の話をします。", 2), 5.5);
});

test("AC-14：文字がない・話している時間が短すぎるときは null（＝未測定）", function () {
  assert.strictEqual(speakingRate("", 10), null);
  assert.strictEqual(speakingRate("あいう", 0.5), null);
  assert.strictEqual(speakingRate("あいう", null), null);
});

test("音声を30秒ずつに分ける（最後は余りの長さ）", function () {
  const chunks = splitIntoChunks(new Float32Array(70), 1, 30);
  assert.deepStrictEqual(chunks.map(function (chunk) { return chunk.length; }), [30, 30, 10]);
});
