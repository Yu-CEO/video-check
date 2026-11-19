/*
 * config.js：設定値（上限・測り方のしきい値・ファイルの場所・モデルの大きさ）を1か所にまとめる
 * 画面・計算・文字起こしのファイルから import して使う。ここには数字と場所だけを書き、処理は書かない。
 * 数字を変えるときは、README の「測り方」とテスト（tests/）も一緒に見直す。
 * 上限（MAX_DURATION_SEC・MAX_FILE_BYTES）の画面の文（エラー文・最初の画面の案内）は messages.js がここから作るので、自動で変わる。
 */

// ---- 動画の上限（仕様 2-①。仮の値） ----
export const MAX_DURATION_SEC = 180;                 // 3分。ショート動画の想定より長いものは調べない
export const MAX_FILE_BYTES = 200 * 1024 * 1024;     // 200MB。端末のメモリで扱える大きさの目安
export const OPEN_TIMEOUT_MS = 8000;                 // 8秒。開けない形式で画面が固まらないよう、ここで打ち切る（AC-7）
export const SEEK_TIMEOUT_MS = 5000;                 // 5秒。1コマの取り出しがこれより遅いときは失敗にする
export const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "webm"];  // ファイルの種類が空のとき（一部の端末）に拡張子で判断する

// ---- 映像の測り方（仕様 2-②） ----
export const SAMPLE_STEP_SEC = 0.5;    // 0.5秒ごとにコマを取り出す。5秒ごとの切り替えを取りこぼさず、60秒で121コマに収まる
export const FRAME_WIDTH_PX = 32;      // コマを横32pxまで小さくして比べる。絵の大きな変化だけを見たいので細部は要らない
export const END_MARGIN_SEC = 0.05;    // 最後のコマは終わりの0.05秒手前。ちょうど終わりの時刻は黒い画面になる端末があるため
export const OPENING_SEC = 3;          // 「冒頭3秒」の長さ
export const CUT_THRESHOLD = 20;       // コマどうしの違い（0〜100）がこれを超えたら「絵が大きく変わった」と数える

// ---- 音の測り方（仕様 2-③） ----
export const AUDIO_SAMPLE_RATE = 16000;   // 1秒16000点。文字起こしモデルが受け取る形にそろえ、メモリも減らす
export const VOLUME_WINDOW_SEC = 0.01;    // 音量は0.01秒ずつ測る（手元版と同じ）
export const SILENCE_THRESHOLD_DB = -40;  // この音量（dB）以下を「無音」とみなす（手元版と同じ）
export const SILENCE_MIN_SEC = 1.0;       // 無音が1秒以上続いたところだけを「無音の区間」に数える（手元版と同じ）
export const PAUSE_MIN_SEC = 0.3;         // 話す速さでは、0.3秒以上の間を「話していない時間」として除く（手元版の最短区間と同じ）
export const TAIL_SEC = 0.5;              // 「最後の0.5秒が無音で終わっていないか」を見る長さ

// ---- 文字起こし（仕様 2-③。押したときだけ読み込む＝AC-13・27） ----
export const TRANSCRIBE_CHUNK_SEC = 30;   // Whisper は30秒ずつ聞くモデルなので、30秒ずつに分けて渡す
export const MODEL_DOWNLOAD_MB = 66;      // 読み込む大きさ：モデル 約44MB＋文字起こしの部品 約22MB（vendor/ の実際の合計）
export const TRANSCRIBE_SEC_PER_MIN = 20;  // 1分の動画の文字起こしにかかる秒数の目安（PCで実測。2回目以降・モデル読み込み後）

// ---- 待ち時間の言葉（仕様 7-2・AC-20）。60秒の動画・話す速さなしのとき ----
export const PC_WAIT_TEXT = "約1分";      // PC の目安（実測済み）
export const PHONE_WAIT_TEXT = null;     // スマホの目安。実機で測った値を入れるまで null＝画面に出さない（試作の仮の値は入れない）

// ---- 基準の表（仕様 2-④） ----
export const BASELINE_URL = "data/baseline.json";
// 6つの項目の名前（基準の表・点数・レーダーチャートで共通。並びはチャートの時計回りの順）
export const AXIS_IDS = ["opening", "cuts", "tempo", "silence", "length", "loop"];
export const DIRECTIONS = ["near", "more", "less"];   // 近いほど良い／多いほど良い／少ないほど良い
export const PERCENTILE_KEYS = ["p10", "p25", "p50", "p75", "p90"];   // 分布の目安（下位10%・25%・中央・75%・90%）

// ---- 点数（仕様 2-④。計算は score.js、境目は README に書く） ----
export const SCORE_OK = 80;     // 80点以上＝札「目安どおり」（25〜75%に入ると80点以上になる）
export const SCORE_NEAR = 50;   // 50〜79点＝「少しずれ」、50点未満＝「伸びしろあり」

// ---- ページを開いた回数の計測（GoatCounter。ページの場所だけを送る） ----
export const ANALYTICS_ENDPOINT = "https://yuceo.goatcounter.com/count";
export const ANALYTICS_HOST_SUFFIX = ".github.io";   // 公開サイトで開いたときだけ数える（手元での確認は数えない）
