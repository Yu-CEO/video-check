/*
 * visual_metrics.test.js：js/visual_metrics.js（映像の4つの値）の自動テスト
 * 合成したコマ（色だけの絵）で、冒頭3秒の変化・変化の頻度・ループ・尺を確かめる（AC-8〜11）。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import {
  buildSampleTimes, frameDifference, neighborDifferences, openingChange, cutsPerMinute, loopSimilarity, measureVisual
} from "../js/visual_metrics.js";
import { solidFrame, syntheticFrames } from "./helpers.js";

const BLACK = [0, 0, 0];
const RED = [230, 30, 30];
const BLUE = [30, 30, 230];
const COLORS = [[230, 30, 30], [30, 200, 60], [30, 30, 230], [240, 220, 40]];

test("コマを取る時刻：0秒から0.5秒ごと、最後は終わりの0.05秒手前", function () {
  assert.deepStrictEqual(buildSampleTimes(1.2, 0.5), [0, 0.5, 1, 1.15]);
  assert.strictEqual(buildSampleTimes(60).length, 121);
});

test("2つのコマの違い：同じなら0、黒と白なら100", function () {
  assert.strictEqual(frameDifference(solidFrame(BLACK), solidFrame(BLACK)), 0);
  assert.strictEqual(frameDifference(solidFrame([0, 0, 0]), solidFrame([255, 255, 255])), 100);
});

test("AC-8：最初の3秒が真っ黒で止まった動画より、色が入れ替わる動画のほうが「冒頭3秒の絵の変化」が大きい", function () {
  const times = buildSampleTimes(10);
  const still = syntheticFrames(times, function () { return BLACK; });
  const swapping = syntheticFrames(times, function (time) { return Math.floor(time / 0.5) % 2 === 0 ? RED : BLUE; });
  const stillValue = openingChange(neighborDifferences(still));
  const swappingValue = openingChange(neighborDifferences(swapping));
  assert.strictEqual(stillValue, 0);
  assert.ok(swappingValue > stillValue + 30, "色が入れ替わる動画の値 " + swappingValue);
});

test("AC-9：5秒ごとに色が切り替わる60秒の動画で、絵の変化の頻度が約12回/分（±2）", function () {
  const frames = syntheticFrames(buildSampleTimes(60), function (time) {
    return COLORS[Math.floor(time / 5) % COLORS.length];
  });
  const perMinute = cutsPerMinute(neighborDifferences(frames), 60);
  assert.ok(Math.abs(perMinute - 12) <= 2, "頻度 " + perMinute);
});

test("AC-9：わずかな明るさの揺れ（しきい値以下）は「絵の変化」に数えない", function () {
  const frames = syntheticFrames(buildSampleTimes(30), function (time) {
    const shade = 100 + (Math.round(time * 2) % 2) * 10;
    return [shade, shade, shade];
  });
  assert.strictEqual(cutsPerMinute(neighborDifferences(frames), 30), 0);
});

test("AC-10：最初と最後のコマが同じ動画のほうが、まったく違う動画より「ループ」が高い", function () {
  const times = buildSampleTimes(20);
  const same = syntheticFrames(times, function (time) { return time < 10 || time > 19 ? RED : BLUE; });
  const different = syntheticFrames(times, function (time) { return time < 10 ? RED : BLUE; });
  assert.strictEqual(loopSimilarity(same), 100);
  assert.ok(loopSimilarity(same) > loopSimilarity(different));
});

test("AC-11：尺の値が動画の長さと±0.5秒以内で一致する", function () {
  const frames = syntheticFrames(buildSampleTimes(47.3), function () { return BLACK; });
  const result = measureVisual(frames, 47.3);
  assert.ok(Math.abs(result.length - 47.3) <= 0.5);
});

test("コマが足りないときは、値を勝手に作らず null にする", function () {
  assert.strictEqual(openingChange([]), null);
  assert.strictEqual(loopSimilarity([]), null);
  assert.strictEqual(cutsPerMinute([], 0), null);
});
