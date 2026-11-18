# vendor/：外から持ってきた部品（文字起こし用）

「話す速さも測る」を押したときだけ、`js/transcribe_worker.js` が読み込む。ページを開いただけでは読まない。
中身は変えずにそのまま置いている。

| 場所 | 中身 | 出どころ | ライセンス |
|---|---|---|---|
| `transformers/transformers.min.js` | Transformers.js 3.8.1（ブラウザ版） | npm `@huggingface/transformers@3.8.1` の `dist/` | Apache-2.0（`transformers/LICENSE`） |
| `transformers/ort-wasm-simd-threaded.jsep.mjs`・`.wasm` | ONNX Runtime Web（モデルを動かす部品） | 同じパッケージの `dist/` | MIT（Microsoft。`transformers/LICENSE-onnxruntime`） |
| `models/whisper-tiny/` | Whisper tiny の 8bit 版（`onnx/*_quantized.onnx`）と設定・辞書 | Hugging Face `onnx-community/whisper-tiny`（元は `openai/whisper-tiny`） | Apache-2.0（OpenAI。`models/whisper-tiny/LICENSE`）|

- 大きさ：transformers 約22MB、モデル 約44MB（合計 約66MB）
- 差し替えるときは、`js/config.js` の `MODEL_DOWNLOAD_MB` と README・画面のライセンス表示（`js/messages.js` の `FOOT_LICENSE`）も直す
