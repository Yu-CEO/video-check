/*
 * audio_loader.js：動画ファイルから音声を取り出し、1本の波形（モノラル・1秒16000点）にする
 * 主な関数：loadMonoAudio（取り出す）、mixToMono（左右の音を1本にまとめる。純粋な計算）
 * Web Audio API（ブラウザに入っている音の部品）を使うので、取り出しはブラウザの中だけで動く。外へは送らない。
 * analyze.js から使われる。計算は silence.js、文字起こしは transcribe.js に任せる。
 */
import { AUDIO_SAMPLE_RATE } from "./config.js";

/**
 * 左右など複数の音を、平均して1本の波形にまとめる。
 * @param {Float32Array[]} channels 音の並び（同じ長さ）
 * @returns {Float32Array} 1本にまとめた波形
 * @example mixToMono([new Float32Array([1, 0]), new Float32Array([0, 0])]) // [0.5, 0]
 */
export function mixToMono(channels) {
  if (channels.length === 1) {
    return channels[0];
  }
  const length = channels[0].length;
  const mono = new Float32Array(length);
  channels.forEach(function (channel) {
    for (let index = 0; index < length; index += 1) {
      mono[index] += channel[index] / channels.length;
    }
  });
  return mono;
}

/**
 * 音のデータを波形に戻す（古い Safari は返事を「関数」で受け取る形なので、両方に対応する）。
 * @param {BaseAudioContext} context 音の部品
 * @param {ArrayBuffer} bytes ファイルの中身
 * @returns {Promise<AudioBuffer>} 波形
 * @example const buffer = await decode(context, bytes);
 */
function decode(context, bytes) {
  return new Promise(function (resolve, reject) {
    const result = context.decodeAudioData(bytes, resolve, reject);
    if (result && typeof result.then === "function") {
      result.then(resolve, reject);
    }
  });
}

/**
 * 動画ファイルから音声を取り出す。音声が入っていない・取り出せないときは null を返す（エラーにはしない）。
 * @param {File} file 動画ファイル
 * @returns {Promise<{samples:Float32Array, sampleRate:number}|null>} 波形と1秒あたりの点の数
 * @example const audio = await loadMonoAudio(file);
 */
export async function loadMonoAudio(file) {
  const OfflineContext = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OfflineContext) {
    return null;
  }
  try {
    const bytes = await file.arrayBuffer();
    // 1秒16000点の部品で戻すと、ブラウザが自動で点の数をそろえてくれる（文字起こしモデルの受け取る形）
    const context = new OfflineContext(1, 1, AUDIO_SAMPLE_RATE);
    const buffer = await decode(context, bytes);
    const channels = [];
    for (let index = 0; index < buffer.numberOfChannels; index += 1) {
      channels.push(buffer.getChannelData(index));
    }
    return { samples: mixToMono(channels), sampleRate: buffer.sampleRate };
  } catch (error) {
    return null;
  }
}
