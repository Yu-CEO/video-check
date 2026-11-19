/*
 * key_point.test.js：js/key_point.js（結果の先頭の「いちばん大事な1点」の選び方）の自動テスト
 * 点数を固定した作ったデータだけを使う（AC-22）。AC-32・33 を確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { chooseKeyPoint } from "../js/key_point.js";
import { KEY_LABEL } from "../js/messages.js";

// 冒頭3秒が最低（30）、音のない時間が最高（92）で、話す速さだけ未測定
const MIXED = { opening: 30, cuts: 60, tempo: null, silence: 92, length: 88, loop: 85 };
const ALL_OK = { opening: 96, cuts: 95, tempo: 98, silence: 95, length: 94, loop: 90 };
const ALL_LOW = { opening: 12, cuts: 20, tempo: 25, silence: 18, length: 15, loop: 22 };

test("AC-32：自分の動画は点数がいちばん低い項目を「まず直すなら、ここ1つ」で出す", function () {
  const result = chooseKeyPoint("maker", MIXED);
  assert.deepStrictEqual(result, { axisId: "opening", kind: "maker-fix" });
  assert.strictEqual(KEY_LABEL[result.kind], "まず直すなら、ここ1つ");
});

test("AC-32：同じ点数で好きな動画として見ると、点数がいちばん高い項目を「伸びる作りにいちばん近いところ」で出す", function () {
  const result = chooseKeyPoint("fan", MIXED);
  assert.deepStrictEqual(result, { axisId: "silence", kind: "fan-best" });
  assert.strictEqual(KEY_LABEL[result.kind], "この動画の、伸びる作りにいちばん近いところ");
});

test("AC-33：自分の動画で全部80以上なら、点数がいちばん高い項目を「直すところは見つかりませんでした」で出す", function () {
  const result = chooseKeyPoint("maker", ALL_OK);
  assert.deepStrictEqual(result, { axisId: "tempo", kind: "maker-allok" });
  assert.strictEqual(KEY_LABEL[result.kind], "直すところは見つかりませんでした。いちばん目安に近かったのは");
});

test("AC-33：好きな動画で80以上が無いなら、点数がいちばん低い項目を「いちばん違ったところ」で出す", function () {
  const result = chooseKeyPoint("fan", ALL_LOW);
  assert.deepStrictEqual(result, { axisId: "opening", kind: "fan-diff" });
  assert.strictEqual(KEY_LABEL[result.kind], "伸びる動画の目安と、いちばん違ったところ");
});

test("AC-33：未測定の項目は、最高でも最低でも選ばれない", function () {
  const scores = { opening: null, cuts: 70, tempo: null, silence: 60, length: null, loop: 65 };
  assert.strictEqual(chooseKeyPoint("maker", scores).axisId, "silence");
  assert.strictEqual(chooseKeyPoint("fan", scores).axisId, "silence", "80以上が無いので、最低の項目");
  const noSpeech = { opening: 40, cuts: 90, tempo: null, silence: null, length: 50, loop: 85 };
  assert.strictEqual(chooseKeyPoint("fan", noSpeech).axisId, "cuts");
});

test("AC-33：同じ点数のときは、項目の決まった順（冒頭3秒・切り替わり・話す速さ・音のない時間・長さ・つながり）で先のもの", function () {
  const tie = { opening: 50, cuts: 50, tempo: 50, silence: 50, length: 50, loop: 50 };
  assert.strictEqual(chooseKeyPoint("maker", tie).axisId, "opening");
  assert.strictEqual(chooseKeyPoint("fan", tie).axisId, "opening");
  const highTie = { opening: 60, cuts: 90, tempo: 90, silence: 70, length: 60, loop: 60 };
  assert.strictEqual(chooseKeyPoint("fan", highTie).axisId, "cuts");
});

test("AC-16：目安の表が読めない（点数が無い）・1つも測れないときは null", function () {
  assert.strictEqual(chooseKeyPoint("maker", null), null);
  const none = { opening: null, cuts: null, tempo: null, silence: null, length: null, loop: null };
  assert.strictEqual(chooseKeyPoint("fan", none), null);
});
