/*
 * messages.js：画面に出す文章（項目の名前・解説・直すときのヒント・エラー文・注意書き）だけを集めたファイル
 * エラー・解説・ヒント・注意書きなど主な文章はここ。画面ごとの短い文（見出し・ボタン名など）は各 *_view.js・*_card.js に書いている。
 * 上限（3分・200MB）の文は config.js の値から作るので、ここで数字を書き換えない。
 * 言い方のきまり：「伸びるショート動画の目安と比べて」にそろえる。「悪い」・赤い色・再生が伸びる約束・「おすすめ」は使わない。
 * start_view.js・report_view.js・axis_card.js・speech_card.js などから使われる。
 */

import { MAX_DURATION_SEC, MAX_FILE_BYTES } from "./config.js";

const SECONDS_PER_MINUTE = 60;
const BYTES_PER_MB = 1024 * 1024;
// 上限を画面の言い方にしたもの（config.js の値を変えると、エラー文と最初の画面の案内も一緒に変わる）
export const LIMIT_DURATION_TEXT = MAX_DURATION_SEC / SECONDS_PER_MINUTE + "分";
export const LIMIT_SIZE_TEXT = MAX_FILE_BYTES / BYTES_PER_MB + "MB";
export const PICK_NOTE = LIMIT_DURATION_TEXT + "・" + LIMIT_SIZE_TEXT + "まで。時間は60秒の動画のときの目安です。";
export const PICKABLE_TEXT = "長さ" + LIMIT_DURATION_TEXT + "・大きさ" + LIMIT_SIZE_TEXT + "まで。mp4 がいちばん確実です。iPhone の動画（mov）も、ブラウザで開ければ調べられます。";

// 最初の画面の「送らない・保存しない」の文
// SAFE_TEXT は仕様 2-① の全文そのまま（「くわしく知りたい人へ」の「動画の扱い」に置く＝AC-39）。画面の1行は SAFE_ONE_LINE（AC-2 の文）
export const SAFE_TEXT = "動画はこの端末のブラウザの中だけで調べます。動画も結果もサーバーに送らず、保存もしません。ページを閉じると消えます（ページを開いた回数だけを GoatCounter で数えています）";
export const SAFE_ONE_LINE = "動画も結果もサーバーに送らず、保存もしません。";
export const SAFE_MINI_RUNNING = "外には何も送っていません";
export const SAFE_MINI_RESULT = "この結果はこの端末の中だけ。ページを閉じると消えます";

// 基準の出どころ（baseline.json に書いていないときの言い方。今の事実）
export const DEFAULT_SOURCE = "自分の動画＋許可を得た動画＋公開されている調査の目安";

// 見方（入れる動画の種類）。処理は同じで、結果の言い方と並び順だけが変わる（仕様 7-2）
export const MODE_CHOICE_TITLE = "どんな動画を入れますか？";
export const MODE_TEXT = {
  fan: { name: "好きな動画", sub: "伸びる作りが分かる", switchTo: "好きな動画として見る（伸びる作りを知る）" },
  maker: { name: "自分で作った動画", sub: "直すところが1つ分かる", switchTo: "自分の動画として見る（直すところを知る）" }
};

// 「いちばん大事な1点」の見出し（key_point.js が選んだ kind ごと。仕様 7-3）
export const KEY_LABEL = {
  "maker-fix": "まず直すなら、ここ1つ",
  "maker-allok": "直すところは見つかりませんでした。いちばん目安に近かったのは",
  "fan-best": "この動画の、伸びる作りにいちばん近いところ",
  "fan-diff": "伸びる動画の目安と、いちばん違ったところ"
};
export const KEY_ALL_OK_TAIL = "今の作り方を続けて大丈夫です。";
export const HINT_FIX = "直すなら";
export const HINT_LOOK = "見てみて";

// 札の言葉（赤は使わない・責めない）
export const LEVEL_LABEL = { ok: "目安どおり", near: "少しずれ", far: "伸びしろあり", none: "未測定" };

// 6つの項目の文章。{s} には「少し」か空の文字が入る。unit は基準の表が読めないときに使う単位の控え
// why・look は「好きな動画」で見る人向け（なぜ効くか／どこに注目すると学べるか）。おすすめ・約束に見える言い方にしない
export const AXIS_TEXT = {
  opening: { unit: "", name: "冒頭3秒の絵の動き", short: "冒頭3秒", what: "最初の3秒で、絵がどれくらい動いているか", unitNote: "（0〜100の目安）",
    why: "最初の3秒で絵が動くと、何の動画かが早く伝わり、先へスワイプされにくくなります。",
    look: "最初の1秒で「画面が切り替わる・文字が出る・顔に寄る」のどれを使っているか、見てみてください。",
    low: "冒頭3秒の絵の動きが、目安より{s}小さめです。止まった画面から始まると、先へスワイプされやすい傾向があります。",
    high: "冒頭3秒の絵の動きが、目安より{s}大きめです。動きが多すぎると、何の動画か伝わる前に流れてしまうことがあります。",
    hintLow: "最初の1秒で、画面を切り替える・文字を出す・顔に寄る、のどれか1つを試してみてください。",
    hintHigh: "最初の3秒は、伝えたい一言が読める長さだけ、絵を止めてみてください。",
    ok: "冒頭3秒の絵の動きは、伸びる動画の多くと同じくらいです。" },
  cuts: { unit: "回/分", name: "絵の切り替わり", short: "切り替わり", what: "1分あたり、絵が大きく変わった回数",
    why: "絵がほどよく切り替わると、見ている人の目が慣れず、最後まで見てもらいやすくなります。",
    look: "何秒ごとに絵が変わるか、数えながら見てみてください。",
    low: "絵の切り替わりが、目安より{s}少なめです。同じ絵が長く続くと、見ている人の目が慣れやすくなります。",
    high: "絵の切り替わりが、目安より{s}多めです。忙しく感じる人がいるかもしれません。",
    hintLow: "話の区切りごとに、寄り・引き・文字だけの画面などを1つはさんでみてください。",
    hintHigh: "大事な一言のところは切り替えを止めて、見せる時間をつくってみてください。",
    ok: "絵の切り替わりの回数は、伸びる動画の多くと同じくらいです。" },
  tempo: { unit: "文字/秒", name: "話す速さ", short: "話す速さ", what: "話している時間1秒あたりの文字数（目安）", estimate: true,
    why: "聞き取りやすい速さで話すと、字幕を読まなくても内容が入ってきます。",
    look: "一文の長さと、間（ま）の取り方に注目してみてください。",
    low: "話す速さが、目安より{s}ゆっくりです（目安）。",
    high: "話す速さが、目安より{s}速めです（目安）。聞き取りにくい人がいるかもしれません。",
    hintLow: "言い直しや「えー」の間を編集で詰めると、話す内容を変えずに近づけられます。",
    hintHigh: "一文を短くする・字幕を付けると、速くても伝わりやすくなります。",
    ok: "話す速さは、伸びる動画の多くと同じくらいです（目安）。" },
  silence: { unit: "%", name: "音のない時間", short: "音のない時間", what: "音が小さい時間が1秒以上続いた部分が、全体の何%か（例：60秒で3秒なら5%）",
    why: "声も音もない時間が短いと、だれずに見られます。",
    look: "話していないところで、BGMや効果音をどう使っているか聴いてみてください。",
    high: "話していない時間が、目安より{s}多めです。",
    hintHigh: "2秒以上の間は、編集で詰めるか、BGMや効果音でつないでみてください。",
    ok: "音のない時間は短く、伸びる動画の多くと同じくらいです。" },
  length: { unit: "秒", name: "動画の長さ", short: "長さ", what: "動画の長さ（尺）",
    why: "長すぎない動画は、最後まで見てもらいやすくなります。",
    look: "前置きがどれくらい短いか、見てみてください。",
    low: "動画が、目安より{s}短めです。短いことは悪いことではありません。",
    high: "動画が、目安より{s}長めです。最後まで見てもらうハードルが少し上がります。",
    hintLow: "伝えきれていないことがあれば、一言だけ足してみてください。",
    hintHigh: "前置きを削る・同じ話を2本に分ける、を試してみてください。",
    ok: "動画の長さは、伸びる動画の多くと同じくらいです。" },
  loop: { unit: "%", name: "終わりと始まりのつながり", short: "つながり", what: "最後の絵と最初の絵の似ている度合い（ループ）",
    why: "最後と最初の絵が近いと、終わりに気づかれず、もう一度再生されやすくなります。",
    look: "最後の1コマと最初の1コマを見比べてみてください。",
    low: "最後の絵と最初の絵が、目安より{s}違っています。終わりに気づかれやすく、そこで離れる人が出やすい形です。",
    hintLow: "最後のコマを最初の絵に近づける・最後の0.5秒まで声や音を残す、を試してみてください。",
    ok: "最後と最初の絵が近く、自然にもう一度再生されやすい形です。" }
};

// 未測定のときの一言
export const NOT_MEASURED = {
  tempoIdle: "下の「話す速さも測る」を押すと測れます。押さなくても、ほかの項目は見られます。",
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
  title: "目安の表が読めませんでした。時間をおいて開き直してください",
  detail: "比べた結果は出さず、測った値だけを下に表示しています。動画は送っていないので、開き直しても大丈夫です。"
};

// 処理中の手順（進み具合の文。AC-20）
export const PROGRESS_STEPS = ["動画を開く", "映像を調べる", "音を調べる", "目安と比べる"];
export const PROGRESS_NOW = ["動画を開いています", "映像を調べています", "音を調べています", "目安と比べています"];

// 注意書き（AC-21）。1文目は大事な1点のすぐ下に常に出す／2文目は話す速さの結果のそば・「くわしく」に出す
export const CAUTION_BASELINE = "基準は伸びるショート動画の目安です。近づけても再生が伸びることは約束できません。";
export const CAUTION_TRANSCRIBE = "文字起こしは完全ではありません。話す速さは目安として見てください。";
export const TAIL_SILENT_NOTE = "最後の0.5秒：無音で終わる（最後まで声や音があると、終わりに気づかれにくくなります）";
export const TAIL_SOUND_NOTE = "最後の0.5秒：音あり";
export const ITEMS_LEAD = { maker: "直したほうがよい順に並べています。押すと、くわしく開きます。", fan: "伸びる動画の作りに近い順に並べています。押すと、くわしく開きます。" };
export const ITEMS_LEAD_NO_BASELINE = "目安が読めないため、測った値だけです。";
export const NO_BASELINE_EXPLAIN = "目安が読めないため、比べた解説は出せません。測った値だけを表示しています。";

// 次の行動（3ツール共通の言葉。仕様 7-5）
export const NEXT_AGAIN = "別の動画でもう一度";
export const NEXT_BACK = "Yuのページへ戻る";
export const NEXT_NOTE = "結果は保存していません。残したいときは、画面の写真を撮ってください。";
export const PORTAL_URL = "https://yu-ceo.github.io/";

// 「くわしく知りたい人へ」（仕様 7-6。どれも消さずに畳む）
export const MORE_TITLE = "くわしく知りたい人へ";
export const FOLD_AXES_TITLE = "調べる6つのこと";
export const BASELINE_TRIAL = "Yuの動画などで作った、試しの目安です。";
export const HOW_BASELINE_MADE = "自分の動画と許可を得た動画を手元で測った値と、出所のある公開調査の目安を合わせて、項目ごとに「伸びる動画の多くが入る範囲（基準の中央の範囲＝真ん中の半分）」を作っています。TikTok などから動画を自動で集めることはしていません。個別の動画やアカウントの情報は入っていません。";
export const NO_GENRE_NOTE = "ジャンル（語り・料理・Vlog など）は分けていないので、動画の種類によっては外れて当たり前の項目もあります。";
export const BASELINE_RENEW = "動画が増えたら目安を新しくします。";
export const BASELINE_DATE_MISSING = "作成日：目安の表が読めなかったため表示できません。";
export const OTHERS_VIDEO_NOTE = "端末に保存できた動画を、自分で見て学ぶためだけに使ってください。結果を人に見せるときは、相手の名前や動画が分からない形にしてください。";
export const SPEECH_LOAD_NOTE = "「話す速さも測る」を押したときだけ、声を文字にする仕組み（文字起こしライブラリ・文字起こしモデル）を、このサイトから読み込みます。2回目からはブラウザに残っているので速くなります。";

// 計測・ライセンス・投資の助言ではない旨（AC-25：ライセンス表示）
export const FOOT_ANALYTICS = "ページを開いた回数だけを GoatCounter で数えています。動画の名前・測った値・点数は送りません。";
export const FOOT_LICENSE = "使っているもの：文字起こしライブラリ Transformers.js 3.8.1（Apache-2.0。中に ONNX Runtime Web〈MIT〉を含む）・文字起こしモデル Whisper tiny（OpenAI、Apache-2.0。onnx-community が ONNX 形式に変換・8bit に小さくした版）。どちらもこのサイトに置いていて、「話す速さも測る」を押したときだけ読み込みます。";
export const FOOT_NOT_ADVICE = "このツールは動画の見た目と音の傾向を測るだけです。投資の助言ではありません。";
