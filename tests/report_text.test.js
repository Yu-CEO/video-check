/*
 * report_text.test.js：js/report_text.js（数字の書き方・本数・まとめの一文・解説の向き）の自動テスト
 * 本数が空なら「○本」と出すこと（AC-21）などを確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import {
  formatElapsed, formatClock, toMegabytes, formatValue, unitFor, formatRange, countText, adviceSide, summaryLines
} from "../js/report_text.js";

test("AC-21：本数が空（null）のあいだは「○本」、数が入れば「12本」", function () {
  assert.strictEqual(countText(null), "○本");
  assert.strictEqual(countText(12), "12本");
});

test("AC-20：処理時間の書き方（1分未満は秒、1分以上は分と秒）", function () {
  assert.strictEqual(formatElapsed(38.4), "38秒");
  assert.strictEqual(formatElapsed(112), "1分52秒");
  assert.strictEqual(formatClock(178), "2:58");
  assert.strictEqual(toMegabytes(5 * 1024 * 1024), 5);
  assert.strictEqual(toMegabytes(10), 1);
});

test("値の書き方：尺は1分以上なら「分秒」、頻度は小数1桁、未測定は「—」", function () {
  assert.strictEqual(formatValue("length", 48.2), "48");
  assert.strictEqual(formatValue("length", 125), "2分05秒");
  assert.strictEqual(unitFor("length", 125, "秒"), "");
  assert.strictEqual(unitFor("length", 48, "秒"), "秒");
  assert.strictEqual(formatValue("cuts", 5), "5.0");
  assert.strictEqual(formatValue("loop", 57.6), "58");
  assert.strictEqual(formatValue("tempo", null), "—");
  assert.strictEqual(formatRange("cuts", { unit: "回/分", percentiles: { p25: 7, p75: 14 } }), "7.0〜14.0回/分");
});

test("解説の向き：少ないほど良い＝多い側、多いほど良い＝少ない側、近いほど良い＝中央との大小", function () {
  assert.strictEqual(adviceSide("less", 10, 4), "high");
  assert.strictEqual(adviceSide("more", 10, 40), "low");
  assert.strictEqual(adviceSide("near", 3, 10), "low");
  assert.strictEqual(adviceSide("near", 30, 10), "high");
});

test("まとめの一文：すべて範囲内／1つもない／一部、と未測定の項目・いちばん低い項目", function () {
  const allGood = summaryLines({ opening: 90, cuts: 90, tempo: 90, silence: 90, length: 90, loop: 90 });
  assert.match(allGood.main, /すべて基準の中央の範囲/);
  assert.strictEqual(allGood.worstId, null);
  const allLow = summaryLines({ opening: 10, cuts: 20, tempo: 30, silence: 40, length: 45, loop: 5 });
  assert.match(allLow.main, /まだありません/);
  assert.strictEqual(allLow.worstId, "loop");
  const some = summaryLines({ opening: 30, cuts: 60, tempo: null, silence: 92, length: 88, loop: 85 });
  assert.strictEqual(some.main, "調べた5つのうち、3つが基準の中央の範囲でした。");
  assert.deepStrictEqual(some.missing, ["話す速さ"]);
  assert.strictEqual(some.worstId, "opening");
});
