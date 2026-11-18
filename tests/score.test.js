/*
 * score.test.js：js/score.js（点数と札）の自動テスト（AC-17）
 * 基準の範囲（25〜75%）の中は高く（80以上）、外れるほど下がることを、画面なしで確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { scoreValue, scoreAll, levelOf } from "../js/score.js";

const NEAR = { direction: "near", percentiles: { p10: 10, p25: 20, p50: 30, p75: 40, p90: 50 } };
const LESS = { direction: "less", percentiles: { p10: 1, p25: 2, p50: 4, p75: 7, p90: 11 } };
const MORE = { direction: "more", percentiles: { p10: 55, p25: 68, p50: 78, p75: 87, p90: 93 } };

test("AC-17：中央は100点、25%・75%の線は80点、10%・90%の線は50点", function () {
  assert.strictEqual(scoreValue(30, NEAR), 100);
  assert.strictEqual(scoreValue(20, NEAR), 80);
  assert.strictEqual(scoreValue(40, NEAR), 80);
  assert.strictEqual(scoreValue(10, NEAR), 50);
  assert.strictEqual(scoreValue(50, NEAR), 50);
});

test("AC-17：基準の範囲の中は80点以上、外れるほど下がり、0点より下にはならない", function () {
  assert.ok(scoreValue(25, NEAR) >= 80 && scoreValue(35, NEAR) >= 80);
  assert.ok(scoreValue(45, NEAR) < 80);
  assert.ok(scoreValue(60, NEAR) < scoreValue(45, NEAR));
  assert.strictEqual(scoreValue(70, NEAR), 0);
  assert.strictEqual(scoreValue(500, NEAR), 0);
  assert.strictEqual(scoreValue(-100, NEAR), 0);
});

test("AC-17：「少ないほど良い」は中央より少なければ100点、多いほど下がる", function () {
  assert.strictEqual(scoreValue(0, LESS), 100);
  assert.strictEqual(scoreValue(7, LESS), 80);
  assert.ok(scoreValue(16, LESS) < 50);
});

test("AC-17：「多いほど良い」は中央より多ければ100点、少ないほど下がる", function () {
  assert.strictEqual(scoreValue(100, MORE), 100);
  assert.strictEqual(scoreValue(68, MORE), 80);
  assert.ok(scoreValue(40, MORE) < 50);
});

test("未測定（null）は点数も null。幅0の基準でもエラーにならない", function () {
  assert.strictEqual(scoreValue(null, NEAR), null);
  const flat = { direction: "near", percentiles: { p10: 5, p25: 5, p50: 5, p75: 5, p90: 5 } };
  assert.strictEqual(scoreValue(5, flat), 100);
  assert.strictEqual(scoreValue(6, flat), 0);
});

test("札：80以上＝範囲内／50〜79＝少し外れ／50未満＝伸びしろあり／null＝未測定", function () {
  assert.strictEqual(levelOf(80), "ok");
  assert.strictEqual(levelOf(79), "near");
  assert.strictEqual(levelOf(50), "near");
  assert.strictEqual(levelOf(49), "far");
  assert.strictEqual(levelOf(null), "none");
});

test("6項目まとめて点数を出す（足りない値は null）", function () {
  const axes = { opening: NEAR, cuts: NEAR, tempo: NEAR, silence: LESS, length: NEAR, loop: MORE };
  const scores = scoreAll({ opening: 30, cuts: 30, silence: 0, length: 30, loop: 100 }, { axes: axes });
  assert.deepStrictEqual(scores, { opening: 100, cuts: 100, tempo: null, silence: 100, length: 100, loop: 100 });
});
