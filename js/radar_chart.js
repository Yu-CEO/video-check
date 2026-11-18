/*
 * radar_chart.js：6つの項目の点数をレーダーチャート（SVG）で描く
 * 主な関数：radarChart（チャートを作る）、pointOnAxis（軸の上の点の位置。純粋な計算）
 * 外側の帯（点数80〜100）が「基準の中央の範囲」。未測定の軸は灰色の点線で中心を通し、ラベルを「未測定」にする（第21回）。
 * 色は css/style.css の .r-* のクラスで付ける（CSP で style 属性を使わないため）。report_view.js から使われる。
 */
import { svgEl } from "./dom.js";
import { AXIS_IDS, SCORE_OK } from "./config.js";
import { AXIS_TEXT } from "./messages.js";

// 図の大きさ（SVG の中の単位）。ラベルが360px幅でもはみ出さない余白をとる
const WIDTH = 320;
const HEIGHT = 300;
const CENTER_X = 160;
const CENTER_Y = 150;
const RADIUS = 88;
const LABEL_OFFSET = 30;      // 軸の先からラベルまでの距離
const MIN_DRAW_SCORE = 4;     // 0点でも点が中心に埋もれないよう、描くときだけ4点の位置に置く
const GRID_STEPS = [0.25, 0.5, 0.75];
const DOT_RADIUS = 4;           // 点の大きさ（半径）
const LABEL_NAME_SHIFT_Y = -8;  // 軸の名前は、ラベルの位置より少し上に出す
const LABEL_SCORE_SHIFT_Y = 10; // 点数は、軸の名前のすぐ下に出す
const LINK_TEXT_SHIFT_Y = 30;   // 「測る ›」は点数の下に出す
const LINK_HIT_TOP_Y = 14;      // 「測る ›」の押せる四角の上端（ラベルの位置から下へ）
const LINK_HIT_WIDTH = 56;      // 押せる四角の幅（文字より広くとる）
const LINK_HIT_HEIGHT = 44;     // 押せる四角の高さ（押しやすさの目安 44px 以上）
const FULL_SCORE = 100;

/**
 * 軸の番号と中心からの距離から、点の位置を出す（いちばん上から時計回り）。
 * @param {number} index 軸の番号（0〜5）
 * @param {number} distance 中心からの距離
 * @param {number} [axisCount] 軸の数
 * @returns {number[]} [x, y]
 * @example pointOnAxis(0, 88) // [160, 62]
 */
export function pointOnAxis(index, distance, axisCount = AXIS_IDS.length) {
  const angle = (-90 + (360 / axisCount) * index) * Math.PI / 180;
  return [CENTER_X + Math.cos(angle) * distance, CENTER_Y + Math.sin(angle) * distance];
}

/**
 * 点数を中心からの距離に直す。
 * @param {number} score 点数（0〜100）
 * @returns {number} 距離
 * @example scoreDistance(100) // 88
 */
function scoreDistance(score) {
  return RADIUS * Math.max(MIN_DRAW_SCORE, score) / FULL_SCORE;
}

/**
 * 点の並びを SVG の points の文字にする。
 * @param {number[][]} points 点の並び
 * @returns {string} "x,y x,y ..."
 * @example toPoints([[1,2],[3,4]]) // "1.0,2.0 3.0,4.0"
 */
function toPoints(points) {
  return points.map(function (point) {
    return point[0].toFixed(1) + "," + point[1].toFixed(1);
  }).join(" ");
}

/**
 * 決まった距離の六角形の点。
 * @param {number} distance 中心からの距離
 * @returns {number[][]} 6つの点
 * @example ringPoints(88).length // 6
 */
function ringPoints(distance) {
  return AXIS_IDS.map(function (axisId, index) {
    return pointOnAxis(index, distance);
  });
}

/**
 * 目盛り・基準の帯・軸の線を描く。
 * @param {SVGElement} svg 描く先
 * @param {object} scores 項目ごとの点数（未測定は null）
 * @returns {void}
 * @example drawFrame(svg, scores)
 */
function drawFrame(svg, scores) {
  const outer = "M" + toPoints(ringPoints(RADIUS)).replace(/ /g, "L") + "Z";
  const inner = "M" + toPoints(ringPoints(RADIUS * SCORE_OK / FULL_SCORE)).replace(/ /g, "L") + "Z";
  svg.append(svgEl("path", { d: outer + inner, class: "r-band", "fill-rule": "evenodd" }));
  GRID_STEPS.forEach(function (step) {
    svg.append(svgEl("polygon", { points: toPoints(ringPoints(RADIUS * step)), class: "r-grid" }));
  });
  svg.append(svgEl("polygon", { points: toPoints(ringPoints(RADIUS)), class: "r-band-line" }));
  svg.append(svgEl("polygon", { points: toPoints(ringPoints(RADIUS * SCORE_OK / FULL_SCORE)), class: "r-band-line r-dash" }));
  AXIS_IDS.forEach(function (axisId, index) {
    const end = pointOnAxis(index, RADIUS);
    const missing = scores[axisId] === null;
    svg.append(svgEl("line", { x1: CENTER_X, y1: CENTER_Y, x2: end[0].toFixed(1), y2: end[1].toFixed(1), class: missing ? "r-none-line" : "r-grid" }));
  });
}

/**
 * 自分の形（面・輪郭・点）を描く。未測定の軸は中心を通し、そこへの線は灰色の点線にする。
 * @param {SVGElement} svg 描く先
 * @param {object} scores 項目ごとの点数
 * @returns {void}
 * @example drawMine(svg, scores)
 */
function drawMine(svg, scores) {
  const points = AXIS_IDS.map(function (axisId, index) {
    const score = scores[axisId];
    return score === null ? [CENTER_X, CENTER_Y] : pointOnAxis(index, scoreDistance(score));
  });
  const measured = AXIS_IDS.filter(function (axisId) {
    return scores[axisId] !== null;
  });
  if (measured.length >= 3) {
    svg.append(svgEl("polygon", { points: toPoints(points), class: "r-me-fill" }));
  }
  AXIS_IDS.forEach(function (axisId, index) {
    const nextIndex = (index + 1) % AXIS_IDS.length;
    const bothMeasured = scores[axisId] !== null && scores[AXIS_IDS[nextIndex]] !== null;
    const oneMeasured = scores[axisId] !== null || scores[AXIS_IDS[nextIndex]] !== null;
    if (!oneMeasured) {
      return;
    }
    const from = points[index];
    const to = points[nextIndex];
    svg.append(svgEl("line", { x1: from[0].toFixed(1), y1: from[1].toFixed(1), x2: to[0].toFixed(1), y2: to[1].toFixed(1),
      class: bothMeasured ? "r-me-line" : "r-none-line" }));
  });
  AXIS_IDS.forEach(function (axisId, index) {
    const point = points[index];
    if (scores[axisId] === null) {
      svg.append(svgEl("circle", { cx: CENTER_X, cy: CENTER_Y, r: DOT_RADIUS, class: "r-none-dot" }));
    } else {
      svg.append(svgEl("circle", { cx: point[0].toFixed(1), cy: point[1].toFixed(1), r: DOT_RADIUS, class: "r-me-dot" }));
    }
  });
}

/**
 * 軸の名前と点数のラベルを描く。話す速さが未測定で測れるときは「測る ›」のリンクを付ける。
 * @param {SVGElement} svg 描く先
 * @param {object} scores 項目ごとの点数
 * @param {Function|null} onTempoLink 「測る ›」を押したときの処理（出さないときは null）
 * @returns {void}
 * @example drawLabels(svg, scores, null)
 */
function drawLabels(svg, scores, onTempoLink) {
  AXIS_IDS.forEach(function (axisId, index) {
    const position = pointOnAxis(index, RADIUS + LABEL_OFFSET);
    const x = position[0].toFixed(1);
    const score = scores[axisId];
    svg.append(svgEl("text", { x: x, y: (position[1] + LABEL_NAME_SHIFT_Y).toFixed(1), class: "r-label" }, AXIS_TEXT[axisId].short));
    svg.append(svgEl("text", { x: x, y: (position[1] + LABEL_SCORE_SHIFT_Y).toFixed(1), class: score === null ? "r-score r-score-none" : "r-score" },
      score === null ? "未測定" : String(score)));
    if (score === null && axisId === "tempo" && onTempoLink) {
      const link = svgEl("a", { href: "#speech-sec", "aria-label": "話す速さを測るボタンへ" });
      // 押せる範囲を44px以上にするため、透明な四角を重ねる
      link.append(svgEl("rect", { x: (position[0] - LINK_HIT_WIDTH / 2).toFixed(1), y: (position[1] + LINK_HIT_TOP_Y).toFixed(1),
        width: LINK_HIT_WIDTH, height: LINK_HIT_HEIGHT, class: "r-hit" }));
      link.append(svgEl("text", { x: x, y: (position[1] + LINK_TEXT_SHIFT_Y).toFixed(1), class: "r-link" }, "測る ›"));
      link.addEventListener("click", function (event) {
        event.preventDefault();
        onTempoLink();
      });
      svg.append(link);
    }
  });
}

/**
 * レーダーチャートを作る。
 * @param {object} scores 項目ごとの点数（未測定は null）
 * @param {Function|null} onTempoLink 「測る ›」を押したときの処理（出さないときは null）
 * @returns {SVGElement} チャート
 * @example radarChart({opening:30, cuts:60, tempo:null, silence:92, length:88, loop:85}, scrollToSpeech)
 */
export function radarChart(scores, onTempoLink) {
  const description = AXIS_IDS.map(function (axisId) {
    return AXIS_TEXT[axisId].short + " " + (scores[axisId] === null ? "未測定" : scores[axisId] + "点");
  }).join("、");
  const svg = svgEl("svg", { viewBox: "0 0 " + WIDTH + " " + HEIGHT, class: "radar", role: "img", "aria-label": "レーダーチャート。" + description });
  drawFrame(svg, scores);
  drawMine(svg, scores);
  drawLabels(svg, scores, onTempoLink);
  return svg;
}
