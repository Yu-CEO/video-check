/*
 * report_text.js：レポートに出す数字の書き方と、解説の向きを決める（文字を作るだけ）
 * 主な関数：formatValue（値の書き方）、formatRange（基準の範囲）、formatClock・formatElapsed（時間）、
 *   adviceSide（基準より少ない側か多い側か）
 * 画面に触らない純粋な処理なので、tests/report_text.test.js で画面なしに確かめられる。
 * report_view.js・key_card.js・axis_card.js・main.js・progress_view.js から使われる。
 */
const SECONDS_PER_MINUTE = 60;
const BYTES_PER_MB = 1024 * 1024;
const ONE_DECIMAL_AXES = ["cuts", "tempo", "silence", "opening"];   // 小数1桁で見せる項目

/**
 * 秒を「1分05秒」の形にする（1分未満は「48秒」）。
 * @param {number} seconds 秒
 * @returns {string} 表示用の文字
 * @example formatElapsed(65) // "1分05秒"
 */
export function formatElapsed(seconds) {
  const rounded = Math.max(0, Math.round(seconds));
  if (rounded < SECONDS_PER_MINUTE) {
    return rounded + "秒";
  }
  return Math.floor(rounded / SECONDS_PER_MINUTE) + "分" + String(rounded % SECONDS_PER_MINUTE).padStart(2, "0") + "秒";
}

/**
 * 秒を「0:48」の時計の形にする。
 * @param {number} seconds 秒
 * @returns {string} 表示用の文字
 * @example formatClock(178) // "2:58"
 */
export function formatClock(seconds) {
  const rounded = Math.max(0, Math.round(seconds));
  return Math.floor(rounded / SECONDS_PER_MINUTE) + ":" + String(rounded % SECONDS_PER_MINUTE).padStart(2, "0");
}

/**
 * バイト数を MB にする（1MB未満は1MBと出す）。
 * @param {number} bytes バイト数
 * @returns {number} MB（整数）
 * @example toMegabytes(5 * 1024 * 1024) // 5
 */
export function toMegabytes(bytes) {
  return Math.max(1, Math.round(bytes / BYTES_PER_MB));
}

/**
 * 測った値を、項目に合った書き方にする（単位は別に付ける）。
 * @param {string} axisId 項目の名前
 * @param {number|null} value 値
 * @returns {string} 表示用の文字（未測定は「—」）
 * @example formatValue("length", 125) // "2分05秒"
 */
export function formatValue(axisId, value) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (axisId === "length") {
    return value >= SECONDS_PER_MINUTE ? formatElapsed(value) : String(Math.round(value));
  }
  if (ONE_DECIMAL_AXES.includes(axisId)) {
    return value.toFixed(1);
  }
  return String(Math.round(value));
}

/**
 * 値に付ける単位。尺が1分以上のときは「2分05秒」に単位が入っているので付けない。
 * @param {string} axisId 項目の名前
 * @param {number|null} value 値
 * @param {string} unit 基準の表の単位
 * @returns {string} 単位
 * @example unitFor("length", 125, "秒") // ""
 */
export function unitFor(axisId, value, unit) {
  if (axisId === "length" && value >= SECONDS_PER_MINUTE) {
    return "";
  }
  return unit;
}

/**
 * 基準の中央の範囲（25〜75%）を「28〜58秒」の形にする。
 * @param {string} axisId 項目の名前
 * @param {{unit:string, percentiles:object}} axis 基準の表の1項目
 * @returns {string} 表示用の文字
 * @example formatRange("length", {unit:"秒", percentiles:{p25:28, p75:58}}) // "28〜58秒"
 */
export function formatRange(axisId, axis) {
  const low = axis.percentiles.p25;
  const high = axis.percentiles.p75;
  const unit = axisId === "length" && high >= SECONDS_PER_MINUTE ? "" : axis.unit;
  return formatValue(axisId, low) + "〜" + formatValue(axisId, high) + unit;
}

/**
 * 解説に使う側（基準より少ない側＝low、多い側＝high）を決める。
 * @param {string} direction 向き（near・less・more）
 * @param {number} value 測った値
 * @param {number} median 基準の中央
 * @returns {"low"|"high"} 側
 * @example adviceSide("near", 3, 10) // "low"
 */
export function adviceSide(direction, value, median) {
  if (direction === "less") {
    return "high";
  }
  if (direction === "more") {
    return "low";
  }
  return value < median ? "low" : "high";
}
