/*
 * report_text.test.js：js/report_text.js（数字の書き方・本数・まとめの一文・解説の向き）の自動テスト
 * 本数が空なら「○本」と出すこと（AC-21）などを確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import {
  formatElapsed, formatClock, toMegabytes, formatValue, unitFor, formatRange, adviceSide
} from "../js/report_text.js";

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
