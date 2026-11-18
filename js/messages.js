/*
 * messages.js：画面に出す文章（項目の名前・解説・直すときのヒント・エラー文・注意書き）だけを集めたファイル
 * エラー・解説・ヒント・注意書きなど主な文章はここ。画面ごとの短い文（見出し・ボタン名など）は各 *_view.js・*_card.js に書いている。
 * 上限（3分・200MB）の文は config.js の値から作るので、ここで数字を書き換えない。
 * 言い方のきまり：「伸びるショート動画の目安と比べて」にそろえる。「悪い」・赤い色・再生が伸びる約束は使わない。
 * start_view.js・report_view.js・axis_card.js・speech_card.js などから使われる。
 */

import { MAX_DURATION_SEC, MAX_FILE_BYTES } from "./config.js";

const SECONDS_PER_MINUTE = 60;
const BYTES_PER_MB = 1024 * 1024;
// 上限を画面の言い方にしたもの（config.js の値を変えると、エラー文と最初の画面の案内も一緒に変わる）
export const LIMIT_DURATION_TEXT = MAX_DURATION_SEC / SECONDS_PER_MINUTE + "分";
export const LIMIT_SIZE_TEXT = MAX_FILE_BYTES / BYTES_PER_MB + "MB";
export const PICK_NOTE = LIMIT_DURATION_TEXT + "・" + LIMIT_SIZE_TEXT + "まで／mp4 がいちばん確実です。60秒の動画で約1分（PC）";

// 最初の画面の「送らない・保存しない」の文（仕様 2-① の文そのまま＝AC-2）
export const SAFE_TITLE = "送らない・保存しない";
export const SAFE_FACE = "顔が映っていても、動画はこの端末から出ません";
export const SAFE_TEXT = "動画はこの端末のブラウザの中だけで調べます。動画も結果もサーバーに送らず、保存もしません。ページを閉じると消えます（ページを開いた回数だけを GoatCounter で数えています）";
export const SAFE_MINI_RUNNING = "この端末の中だけで調べています。外には何も送っていません";
export const SAFE_MINI_RESULT = "この結果はこの端末の中にだけあります。ページを閉じると消えます";

// 基準の出どころ（baseline.json に書いていないときの言い方。今の事実）
export const DEFAULT_SOURCE = "自分の動画＋許可を得た動画＋公開されている調査の目安";
export const UNKNOWN_COUNT_MARK = "○";   // 本数が入るまで出す印（仮の数字を本物に見せない）

// 向きの言い方
export const DIRECTION_LABEL = { near: "中央に近いほど良い", less: "少ないほど良い", more: "多いほど良い" };
// 札の言葉（赤は使わない・責めない）
export const LEVEL_LABEL = { ok: "基準の中央の範囲", near: "少し外れています", far: "伸びしろあり", none: "未測定" };

// 6つの項目の文章。{s} には「少し」か空の文字が入る。unit は基準の表が読めないときに使う単位の控え
export const AXIS_TEXT = {
  opening: { unit: "", name: "冒頭3秒の絵の変化", short: "冒頭3秒", what: "最初の3秒で、絵がどれくらい動いているか", unitNote: "（0〜100の目安）",
    low: "冒頭3秒の絵の動きが、基準より{s}小さめです。止まった画面から始まると、先へスワイプされやすい傾向があります。",
    high: "冒頭3秒の絵の動きが、基準より{s}大きめです。動きが多すぎると、何の動画か伝わる前に流れてしまうことがあります。",
    hintLow: "最初の1秒で、画面を切り替える・文字を出す・顔に寄る、のどれか1つを試すと変わりやすいです。",
    hintHigh: "最初の3秒は、伝えたい一言が読める長さだけ、絵を止めてみてください。",
    ok: "冒頭3秒の絵の動きは、基準の中央の範囲です。今の始め方を続けて大丈夫です。" },
  cuts: { unit: "回/分", name: "絵の変化の頻度", short: "絵の変化", what: "1分あたり、絵が大きく変わった回数",
    low: "絵の切り替わりが、基準より{s}少なめです。同じ絵が長く続くと、見ている人の目が慣れやすくなります。",
    high: "絵の切り替わりが、基準より{s}多めです。忙しく感じる人がいるかもしれません。",
    hintLow: "話の区切りごとに、寄り・引き・文字だけの画面などを1つはさむと変わりやすいです。",
    hintHigh: "大事な一言のところは切り替えを止めて、見せる時間をつくると伝わりやすくなります。",
    ok: "絵の切り替わりの回数は、基準の中央の範囲です。" },
  tempo: { unit: "文字/秒", name: "話す速さ", short: "話す速さ", what: "話している時間1秒あたりの文字数（目安）", estimate: true,
    low: "話す速さが、基準より{s}ゆっくりです（目安）。",
    high: "話す速さが、基準より{s}速めです（目安）。聞き取りにくい人がいるかもしれません。",
    hintLow: "言い直しや「えー」の間を編集で詰めると、話す内容を変えずに近づけられます。",
    hintHigh: "一文を短くする・字幕を付けると、速くても伝わりやすくなります。",
    ok: "話す速さは、基準の中央の範囲です（目安）。" },
  silence: { unit: "%", name: "無音の少なさ", short: "無音の少なさ", what: "音が小さい時間が1秒以上続いた部分が、全体の何%か",
    high: "話していない時間が、基準より{s}多めです。",
    hintHigh: "2秒以上の間は、編集で詰めるか、BGMや効果音でつなぐと変わりやすいです。",
    ok: "無音の時間は少なめで、基準の中央の範囲です。" },
  length: { unit: "秒", name: "尺（動画の長さ）", short: "尺", what: "動画の長さ",
    low: "動画が、基準より{s}短めです。短いことは悪いことではありません。",
    high: "動画が、基準より{s}長めです。最後まで見てもらうハードルが少し上がります。",
    hintLow: "伝えきれていないことがあれば、一言だけ足してみてください。",
    hintHigh: "前置きを削る・同じ話を2本に分けると、近づけられます。",
    ok: "動画の長さは、基準の中央の範囲です。" },
  loop: { unit: "%", name: "最後の切れ目（ループ）", short: "ループ", what: "最後の絵と最初の絵の似ている度合い",
    low: "最後の絵と最初の絵が、基準より{s}違っています。終わりに気づかれやすく、そこで離れる人が出やすい形です。",
    hintLow: "最後のコマを最初の絵に近づける・最後の0.5秒まで声や音を残すと、もう一度見てもらいやすくなります。",
    ok: "最後と最初の絵が近く、自然にもう一度再生されやすい形です。" }
};

// 未測定のときの一言
export const NOT_MEASURED = {
  tempoIdle: "上の「話す速さも測る」を押すと測れます。押さなくても、ほかの項目は見られます。",
  tempoFailed: "文字起こしができなかったため、未測定です。ほかの項目はそのまま見られます。",
  noAudio: "音声が入っていないか取り出せなかったため、測れませんでした。",
  noVisual: "映像を取り出せなかったため、測れませんでした。"
};

// 最初の画面のエラー（AC-6・7）。次に何をすればよいかを必ず書く
export const START_ERRORS = {
  tooLong: { title: LIMIT_DURATION_TEXT + "以内の動画を選んでください",
    detail: "この動画は" + LIMIT_DURATION_TEXT + "を超えています。編集アプリで" + LIMIT_DURATION_TEXT + "以内に切ってから選ぶと調べられます。" },
  tooBig: { title: LIMIT_SIZE_TEXT + "までのファイルを選んでください",
    detail: "ファイルが大きすぎます。書き出すときの画質を1080pにすると、多くの場合" + LIMIT_SIZE_TEXT + "より小さくなります。" },
  notVideo: { title: "動画ではないファイルのようです",
    detail: "写真や音声のファイルは調べられません。mp4 などの動画ファイルを選んでください。" },
  cannotOpen: { title: "この動画はこのブラウザで開けません",
    detail: "mp4（H.264）で書き出すか、別のブラウザで試してください。スマホのカメラの設定で、保存の形式を「互換性を優先する」ほうにして撮ると、開けることが多いです。" }
};

// 処理の途中で失敗したとき
export const RUN_FAILED = {
  title: "途中で調べられなくなりました",
  heading: "もう一度試せます",
  detail: "端末のメモリが足りないときなどに起きます。ほかのアプリやタブを閉じてから、もう一度試してください。動画は送っていないので、選び直すだけで大丈夫です。"
};

// 基準の表が読めないとき（AC-16）
export const BASELINE_FAILED = {
  title: "基準の表が読めませんでした。時間をおいて開き直してください",
  detail: "点数とレーダーチャートは出さず、測った値だけを下に表示しています。動画は送っていないので、開き直しても大丈夫です。"
};

// 処理中の手順（進み具合の文。AC-20）
export const PROGRESS_STEPS = ["動画を開く", "映像を調べる", "音を調べる", "基準と比べる"];
export const PROGRESS_NOW = ["動画を開いています", "映像を調べています", "音を調べています", "基準と比べています"];

// レポートの最後の注意書き（AC-21）
export const CAUTION_BASELINE = "基準は伸びるショート動画の目安です。近づけても再生が伸びることは約束できません。";
export const TAIL_SILENT_NOTE = "最後の0.5秒：無音で終わる（最後まで声や音があると、ループに気づかれにくくなります）";
export const TAIL_SOUND_NOTE = "最後の0.5秒：音あり";
export const AXES_LEAD_WITH_BASELINE = "緑の帯が「基準の中央の範囲」、丸があなたの動画です。";
export const AXES_LEAD_NO_BASELINE = "基準が読めないため、測った値だけを出しています。";
export const BASELINE_INFO_MISSING = "基準の作成日・本数：表が読めなかったため表示できません";
export const CAUTION_TRANSCRIBE = "文字起こしは完全ではありません。話す速さは目安として見てください。";
export const HOW_BASELINE_MADE = "TikTok などから動画を自動で集めることはしていません。自分の動画と許可を得た動画を手元のツールで測った値と、出所のある公開調査の目安値を合わせて、項目ごとに「真ん中の半分（25〜75%）」の範囲を作っています。個別の動画やアカウントの情報は入っていません。本数が増えたら基準を更新します。";
export const NO_GENRE_NOTE = "ジャンル（語り・料理・Vlog など）は分けていません。動画の種類によっては、基準から外れていて当たり前の項目もあります。";

// フッター（AC-25：ライセンス表示）
export const FOOT_ANALYTICS = "ページを開いた回数だけを GoatCounter で数えています。動画の名前・測った値・点数は送りません。";
export const FOOT_LICENSE = "使っているもの：文字起こしライブラリ Transformers.js 3.8.1（Apache-2.0。中に ONNX Runtime Web〈MIT〉を含む）・文字起こしモデル Whisper tiny（OpenAI、Apache-2.0。onnx-community が ONNX 形式に変換・8bit に小さくした版）。どちらもこのサイトに置いていて、「話す速さも測る」を押したときだけ読み込みます。";
export const FOOT_NOT_ADVICE = "このツールは動画の見た目と音の傾向を測るだけです。投資の助言ではありません。";
