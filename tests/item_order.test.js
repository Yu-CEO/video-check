/*
 * item_order.test.js：js/item_order.js（「ほかの項目」の並び順）の自動テスト
 * 自分の動画＝点数の低い順／好きな動画＝高い順。未測定は最後、大事な1点の項目は入れない（AC-34）。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { orderItems } from "../js/item_order.js";
import { chooseKeyPoint } from "../js/key_point.js";

const SCORES = { opening: 30, cuts: 60, tempo: null, silence: 92, length: 88, loop: 85 };

test("AC-34：自分の動画は点数の低い順（直したほうがよい順）で、未測定は最後", function () {
  assert.deepStrictEqual(orderItems("maker", SCORES, null), ["opening", "cuts", "loop", "length", "silence", "tempo"]);
});

test("AC-34：好きな動画は点数の高い順（伸びる作りに近い順）で、未測定は最後", function () {
  assert.deepStrictEqual(orderItems("fan", SCORES, null), ["silence", "length", "loop", "cuts", "opening", "tempo"]);
});

test("AC-34：大事な1点の項目は、並びに入らない（どちらの見方でも）", function () {
  ["maker", "fan"].forEach(function (mode) {
    const keyId = chooseKeyPoint(mode, SCORES).axisId;
    const order = orderItems(mode, SCORES, keyId);
    assert.strictEqual(order.length, 5);
    assert.ok(!order.includes(keyId), mode);
  });
});

test("AC-34：未測定が複数あっても、最後に決まった順で並ぶ", function () {
  const scores = { opening: null, cuts: 70, tempo: 40, silence: null, length: 90, loop: null };
  assert.deepStrictEqual(orderItems("maker", scores, null), ["tempo", "cuts", "length", "opening", "silence", "loop"]);
});

test("AC-34：同じ点数のときは項目の決まった順", function () {
  const tie = { opening: 50, cuts: 50, tempo: 50, silence: 50, length: 50, loop: 50 };
  const expected = ["opening", "cuts", "tempo", "silence", "length", "loop"];
  assert.deepStrictEqual(orderItems("maker", tie, null), expected);
  assert.deepStrictEqual(orderItems("fan", tie, null), expected);
});

test("AC-16：目安の表が読めない（点数が無い）ときは、決まった順で全部を並べる", function () {
  assert.deepStrictEqual(orderItems("fan", null, null), ["opening", "cuts", "tempo", "silence", "length", "loop"]);
});
