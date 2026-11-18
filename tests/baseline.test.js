/*
 * baseline.test.js：js/baseline.js（基準の表の読み込みと形の確認）と data/baseline.json の中身の自動テスト
 * 表の数字を変えるとコードを変えずに点数・範囲の表示が変わること（AC-15）、壊れた表を ok:false にすること（AC-16）、
 * 表に個別の動画やアカウントの情報が入っていないこと（AC-18）を確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { validateBaseline, loadBaseline } from "../js/baseline.js";
import { scoreAll } from "../js/score.js";
import { formatRange } from "../js/report_text.js";

const BASELINE_TEXT = readFileSync(new URL("../data/baseline.json", import.meta.url), "utf8");

/**
 * 本物の表のコピーを作る（テストの中で書き換えても元に影響しないように）。
 * @returns {object} 表のコピー
 * @example freshBaseline().axes.length
 */
function freshBaseline() {
  return JSON.parse(BASELINE_TEXT);
}

/**
 * fetch のかわり（決まった中身を返す）。
 * @param {number} status 返すステータス
 * @param {string} body 返す中身
 * @returns {Function} fetch と同じ形の関数
 * @example fakeFetch(200, "{}")
 */
function fakeFetch(status, body) {
  return async function () {
    return { ok: status === 200, status: status, json: async function () { return JSON.parse(body); } };
  };
}

test("data/baseline.json は正しい形で、本数は実数が入るまで null（画面は「○本」）", function () {
  const result = validateBaseline(freshBaseline());
  assert.strictEqual(result.ok, true, result.reason);
  assert.strictEqual(result.baseline.count, null);
});

test("AC-15：表の数字を書き換えると、コードを変えずに点数と「基準の範囲」の表示が変わる", function () {
  const original = validateBaseline(freshBaseline()).baseline;
  const edited = freshBaseline();
  edited.axes.length.percentiles = { p10: 5, p25: 10, p50: 15, p75: 20, p90: 25 };
  const changed = validateBaseline(edited).baseline;
  const values = { opening: 8, cuts: 10, tempo: null, silence: 1, length: 41, loop: 90 };
  assert.notStrictEqual(scoreAll(values, original).length, scoreAll(values, changed).length);
  assert.strictEqual(formatRange("length", original.axes.length), "28〜58秒");
  assert.strictEqual(formatRange("length", changed.axes.length), "10〜20秒");
});

test("AC-16：形が違う表は ok:false と日本語の理由になる", function () {
  const broken = freshBaseline();
  delete broken.axes.loop;
  assert.strictEqual(validateBaseline(broken).ok, false);
  const wrongOrder = freshBaseline();
  wrongOrder.axes.cuts.percentiles.p25 = 100;
  assert.match(validateBaseline(wrongOrder).reason, /小さい順/);
  const wrongDirection = freshBaseline();
  wrongDirection.axes.cuts.direction = "up";
  assert.strictEqual(validateBaseline(wrongDirection).ok, false);
  const fakeCount = freshBaseline();
  fakeCount.count = "たくさん";
  assert.strictEqual(validateBaseline(fakeCount).ok, false);
  assert.strictEqual(validateBaseline(null).ok, false);
});

test("AC-16：表がない（404）・JSON が壊れている・通信が失敗したときも ok:false", async function () {
  assert.strictEqual((await loadBaseline(fakeFetch(404, ""))).ok, false);
  assert.strictEqual((await loadBaseline(fakeFetch(200, "{壊れた"))).ok, false);
  const failing = async function () { throw new Error("offline"); };
  assert.strictEqual((await loadBaseline(failing)).ok, false);
  assert.strictEqual((await loadBaseline(fakeFetch(200, BASELINE_TEXT))).ok, true);
});

test("AC-18：基準の表に、URL・動画のID・アカウント名（@）・動画ファイル名が入っていない", function () {
  assert.doesNotMatch(BASELINE_TEXT, /https?:|www\.|@|\.mp4|\.mov|video_?id|account|user/i);
  const data = freshBaseline();
  const allowedKeys = ["version", "created", "count", "source", "note", "axes"];
  Object.keys(data).forEach(function (key) {
    assert.ok(allowedKeys.includes(key), "予定にない項目 " + key);
  });
});
