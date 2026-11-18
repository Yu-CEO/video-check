/*
 * transcribe_worker.js：Web Worker（画面を固めない裏の処理）の中で、音声を日本語の文字にする
 * 「話す速さも測る」が押されたときに transcribe.js が起こす。ここで初めて文字起こしのライブラリとモデルを読む（AC-13・27）。
 * ライブラリとモデルはこのサイトの vendor/ に置いたものだけを読み、外のサイトからは読まない（allowRemoteModels=false）。
 * やりとり：受け取る {type:"start", chunks:Float32Array[]} → 返す {type:"loading"|"transcribing", percent} ／ {type:"done", text} ／ {type:"error", message}
 */
import { pipeline, env } from "../vendor/transformers/transformers.min.js";

const MODEL_NAME = "whisper-tiny";   // vendor/models/whisper-tiny（Whisper の小さい版・8bit に小さくしたもの）
const MODEL_DTYPE = "q8";            // 8bit 版（ファイル名の _quantized）を使う
const PERCENT = 100;

// 読み込み先をこのサイトの中だけにする
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL("../vendor/models/", import.meta.url).href;
env.backends.onnx.wasm.wasmPaths = new URL("../vendor/transformers/", import.meta.url).href;
// GitHub Pages では複数の裏の処理を同時に使う仕組み（SharedArrayBuffer）が使えないので、1本で動かす
env.backends.onnx.wasm.numThreads = 1;

/**
 * モデルのファイルごとの読み込み量を足して、全体の％を知らせる関数を作る。
 * @returns {(event:object) => void} ライブラリから読み込みの知らせを受け取る関数
 * @example const onLoad = makeLoadReporter();
 */
function makeLoadReporter() {
  const files = {};
  return function (event) {
    if (event.status !== "progress" || !event.total) {
      return;
    }
    files[event.file] = { loaded: event.loaded, total: event.total };
    let loaded = 0;
    let total = 0;
    Object.values(files).forEach(function (item) {
      loaded += item.loaded;
      total += item.total;
    });
    self.postMessage({ type: "loading", percent: Math.round((loaded / total) * PERCENT) });
  };
}

/**
 * 30秒ずつに分けた音声を順に文字にし、1つにつなげる。1つ終わるごとに進み具合を知らせる。
 * @param {Float32Array[]} chunks 30秒ずつの波形（1秒16000点）
 * @returns {Promise<string>} 文字起こしの結果
 * @example const text = await transcribeChunks(chunks);
 */
async function transcribeChunks(chunks) {
  const recognizer = await pipeline("automatic-speech-recognition", MODEL_NAME, {
    dtype: MODEL_DTYPE,
    device: "wasm",
    progress_callback: makeLoadReporter()
  });
  self.postMessage({ type: "transcribing", percent: 0 });
  const texts = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const output = await recognizer(chunks[index], { language: "japanese", task: "transcribe" });
    texts.push(output.text || "");
    self.postMessage({ type: "transcribing", percent: Math.round(((index + 1) / chunks.length) * PERCENT) });
  }
  return texts.join("");
}

self.addEventListener("message", async function (event) {
  if (!event.data || event.data.type !== "start") {
    return;
  }
  try {
    const text = await transcribeChunks(event.data.chunks);
    self.postMessage({ type: "done", text: text });
  } catch (error) {
    self.postMessage({ type: "error", message: String(error && error.message ? error.message : error) });
  }
});
