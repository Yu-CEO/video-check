/*
 * transcribe.js：文字起こしの Worker（裏の処理）を起こし、進み具合と結果を受け取って、話す速さを返す
 * 主な関数：measureSpeakingRate（文字起こし → 話す速さ）、cancelTranscription（やめる）
 * Worker は「話す速さも測る」が押されたときに初めて作る。押すまではライブラリもモデルも読まない（AC-13・27）。
 * 音が小さいだけの30秒は渡さない（無音で文字が作られてしまう誤りを減らすため）。main.js から使われる。
 */
import { splitIntoChunks, speakingRate } from "./tempo.js";
import { windowVolumes, hasAnySound } from "./silence.js";

let currentWorker = null;

/**
 * 音がある30秒だけを残す。
 * @param {Float32Array[]} chunks 30秒ずつの波形
 * @param {number} sampleRate 1秒あたりの点の数
 * @returns {Float32Array[]} 音がある分だけ
 * @example keepSoundChunks(chunks, 16000).length // 2
 */
function keepSoundChunks(chunks, sampleRate) {
  return chunks.filter(function (chunk) {
    return hasAnySound(windowVolumes(chunk, sampleRate));
  });
}

/**
 * 文字起こしをして話す速さを出す。失敗・やめたときは失敗の Promise になる。
 * @param {{samples:Float32Array, sampleRate:number, voicedSec:number}} audio analyze.js が返した音声
 * @param {(phase:"loading"|"transcribing", percent:number) => void} onProgress 進み具合を受け取る関数
 * @returns {Promise<{rate:number|null, text:string}>} 話す速さ（文字/秒。文字がなければ null）と文字起こしの結果
 * @example const result = await measureSpeakingRate(audio, (phase, pct) => {});
 */
export function measureSpeakingRate(audio, onProgress) {
  cancelTranscription();
  const chunks = keepSoundChunks(splitIntoChunks(audio.samples, audio.sampleRate), audio.sampleRate);
  if (chunks.length === 0) {
    // 音がある部分が1つもないときは、約66MBのモデルを読みに行かずに「未測定」で返す
    return Promise.resolve({ rate: null, text: "" });
  }
  return new Promise(function (resolve, reject) {
    const worker = new Worker(new URL("./transcribe_worker.js", import.meta.url), { type: "module" });
    currentWorker = worker;
    worker.addEventListener("message", function (event) {
      const message = event.data;
      if (message.type === "loading" || message.type === "transcribing") {
        onProgress(message.type, message.percent);
        return;
      }
      finish(worker);
      if (message.type === "done") {
        resolve({ rate: speakingRate(message.text, audio.voicedSec), text: message.text });
      } else {
        reject(new Error(message.message));
      }
    });
    worker.addEventListener("error", function (event) {
      finish(worker);
      reject(new Error(event.message || "worker error"));
    });
    onProgress("loading", 0);
    // 波形の持ち主を Worker に移して、大きなコピーを作らない
    worker.postMessage({ type: "start", chunks: chunks }, chunks.map(function (chunk) {
      return chunk.buffer;
    }));
  });
}

/**
 * 終わった Worker を止めて、モデルが使っていたメモリを空ける（モデルはブラウザのキャッシュに残る）。
 * @param {Worker} worker 止める Worker
 * @returns {void}
 * @example finish(worker);
 */
function finish(worker) {
  worker.terminate();
  if (currentWorker === worker) {
    currentWorker = null;
  }
}

/**
 * 文字起こしを途中でやめる（「やめる」ボタン・別の動画を選んだとき）。
 * @returns {boolean} 止めたものがあれば true
 * @example cancelTranscription();
 */
export function cancelTranscription() {
  if (currentWorker === null) {
    return false;
  }
  finish(currentWorker);
  return true;
}
