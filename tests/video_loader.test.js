/*
 * video_loader.test.js：js/video_loader.js のうち、画面なしで動く確認（種類・大きさ・長さ）の自動テスト（AC-6・7）
 * <video> で実際に開く部分は、ブラウザでの目視確認で見る。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { checkFileBasics, checkDuration } from "../js/video_loader.js";
import { START_ERRORS } from "../js/messages.js";

const MB = 1024 * 1024;

test("AC-6：動画でないファイルは notVideo、200MBを超えるファイルは tooBig", function () {
  assert.strictEqual(checkFileBasics({ name: "IMG_1.jpg", type: "image/jpeg", size: MB }), "notVideo");
  assert.strictEqual(checkFileBasics({ name: "a.mp3", type: "audio/mpeg", size: MB }), "notVideo");
  assert.strictEqual(checkFileBasics({ name: "a.mp4", type: "video/mp4", size: 201 * MB }), "tooBig");
  assert.strictEqual(checkFileBasics({ name: "a.mp4", type: "video/mp4", size: 200 * MB }), "");
});

test("種類が空で渡される端末でも、動画の拡張子なら受け付ける", function () {
  assert.strictEqual(checkFileBasics({ name: "a.MOV", type: "", size: MB }), "");
  assert.strictEqual(checkFileBasics({ name: "a.txt", type: "", size: MB }), "notVideo");
});

test("AC-6・7：3分を超える動画は tooLong、長さが読めない動画は cannotOpen", function () {
  assert.strictEqual(checkDuration(181), "tooLong");
  assert.strictEqual(checkDuration(180), "");
  assert.strictEqual(checkDuration(60), "");
  assert.strictEqual(checkDuration(NaN), "cannotOpen");
  assert.strictEqual(checkDuration(Infinity), "cannotOpen");
});

test("AC-6・7：どのエラーにも、次に何をすればよいかの日本語がある", function () {
  ["tooLong", "tooBig", "notVideo", "cannotOpen"].forEach(function (key) {
    assert.ok(START_ERRORS[key].title.length > 0);
    assert.match(START_ERRORS[key].detail, /ください|選ぶと|すると/);
  });
  assert.match(START_ERRORS.cannotOpen.detail, /mp4（H\.264）で書き出すか、別のブラウザで試してください/);
});
