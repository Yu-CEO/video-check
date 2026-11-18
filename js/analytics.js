/*
 * analytics.js：ページを開いた回数だけを GoatCounter（アクセス解析）に1回知らせる
 * 主な関数：buildCountUrl（送るURLを作る。純粋な計算）、countPageView（1×1 の画像を読ませて知らせる）
 * 送るのは「ページの場所」と「どのサイトから来たか（ドメインと場所だけ）」だけ。動画の名前・測った値・点数は送らない（AC-3）。
 * 外のスクリプトは読まず、画像の読み込み1回だけにする（軽さ＝AC-26）。手元で開いたとき・「追跡しないで」の設定のときは送らない。
 */
import { ANALYTICS_ENDPOINT, ANALYTICS_HOST_SUFFIX } from "./config.js";

const RANDOM_RANGE = 36 ** 6;   // 同じ画像が使い回されて数え漏れるのを防ぐ乱数の範囲（人を区別する値にはしない）

/**
 * 来たサイトを「ドメイン＋場所」だけにする（? の後ろの細かい情報は送らない）。
 * @param {string} referrer 来たページのURL
 * @returns {string} 短くしたURL。読めなければ空の文字
 * @example shortReferrer("https://example.com/a?b=c") // "https://example.com/a"
 */
function shortReferrer(referrer) {
  try {
    const url = new URL(referrer);
    return url.origin + url.pathname;
  } catch (error) {
    return "";
  }
}

/**
 * 送るURLを作る。送らないとき（手元・追跡しない設定）は空の文字を返す。
 * @param {{protocol:string, hostname:string, pathname:string, referrer:string, doNotTrack:string, randomValue:string}} page ページの情報
 * @returns {string} 送るURL（送らないときは空の文字）
 * @example buildCountUrl({protocol:"https:", hostname:"yu-ceo.github.io", pathname:"/video-check/", referrer:"", doNotTrack:"", randomValue:"a"})
 *   // "https://yuceo.goatcounter.com/count?p=%2Fvideo-check%2F&r=&rnd=a"
 */
export function buildCountUrl(page) {
  if (page.protocol !== "https:" || !String(page.hostname).endsWith(ANALYTICS_HOST_SUFFIX)) {
    return "";
  }
  if (page.doNotTrack === "1") {
    return "";
  }
  return ANALYTICS_ENDPOINT
    + "?p=" + encodeURIComponent(page.pathname)
    + "&r=" + encodeURIComponent(shortReferrer(page.referrer))
    + "&rnd=" + encodeURIComponent(page.randomValue);
}

/**
 * ページを開いたことを1回だけ知らせる。失敗しても画面には何も出さない（ほかの動きを止めない）。
 * @returns {boolean} 送ったら true
 * @example countPageView();
 */
export function countPageView() {
  try {
    const url = buildCountUrl({
      protocol: location.protocol,
      hostname: location.hostname,
      pathname: location.pathname,
      referrer: document.referrer,
      doNotTrack: navigator.doNotTrack,
      randomValue: Math.floor(Math.random() * RANDOM_RANGE).toString(36)
    });
    if (url === "") {
      return false;
    }
    const image = new Image();
    image.alt = "";
    image.src = url;   // ページには置かない。src を入れた時点で読み込みが1回起きる
    return true;
  } catch (error) {
    return false;
  }
}
