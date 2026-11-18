/*
 * analytics.test.js：js/analytics.js（ページを開いた回数の計測）の自動テスト（AC-3）
 * 送るURLにページの場所しか入らないこと、手元で開いたとき・追跡しない設定のときは送らないことを確かめる。
 * 実行方法：video-check フォルダで `node --test`
 */
import test from "node:test";
import assert from "node:assert";
import { buildCountUrl } from "../js/analytics.js";

const PAGE = {
  protocol: "https:",
  hostname: "yu-ceo.github.io",
  pathname: "/video-check/",
  referrer: "https://yu-ceo.github.io/?from=toolbox",
  doNotTrack: "",
  randomValue: "abc"
};

test("AC-3：送るのはページの場所・来たページ（? の後ろは除く）・乱数だけ", function () {
  const url = new URL(buildCountUrl(PAGE));
  assert.strictEqual(url.origin, "https://yuceo.goatcounter.com");
  assert.deepStrictEqual(Array.from(url.searchParams.keys()), ["p", "r", "rnd"]);
  assert.strictEqual(url.searchParams.get("p"), "/video-check/");
  assert.strictEqual(url.searchParams.get("r"), "https://yu-ceo.github.io/");
});

test("手元で開いたとき（http・localhost）と、追跡しない設定のときは送らない", function () {
  assert.strictEqual(buildCountUrl({ ...PAGE, protocol: "http:", hostname: "localhost" }), "");
  assert.strictEqual(buildCountUrl({ ...PAGE, doNotTrack: "1" }), "");
});
