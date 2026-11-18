"""
機密チェック（confidential_check.py）

役割：
    GitHubに上がるファイルの中に、外に出してはいけない情報が入っていないかを探す。
    見つかったら「どのファイルの何行目か」を表示して、エラー（終了コード1）で終わる。
    CI（GitHub Actions）と、手元での確認の両方で使う。

探すもの：
    1. 決まった形の情報（メールアドレス・パソコン内の場所・APIキーなど）… このファイルに書いてある
    2. 機密の言葉（会社名など）… このファイルには書かない。次のどちらかで渡す
       - 環境変数 CONFIDENTIAL_WORDS（GitHubの Secrets に登録したものがCIで渡される。1行に1語）
       - 手元のファイル .confidential_words.txt（.gitignore で除外する。1行に1語）

使い方：
    python ci/confidential_check.py                  … 手元での確認（言葉のリストがなくても「注意」を出して続ける）
    python ci/confidential_check.py --require-words  … CIでの確認（言葉のリストが空なら、その時点で失敗にする）
"""

import os
import re
import subprocess
import sys

# --- 設定 -------------------------------------------------------------

# 決まった形の情報。名前は、見つかったときの表示に使う
PATTERNS = {
    "メールアドレス": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "パソコン内の場所（ユーザー名が入る）": re.compile(r"[A-Za-z]:\\Users\\[^\\\s]+", re.IGNORECASE),
    "APIキー（OpenAI・Anthropic形式）": re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    "GitHubのトークン": re.compile(r"gh[pousr]_[A-Za-z0-9]{30,}"),
    "AWSのキー": re.compile(r"AKIA[0-9A-Z]{16}"),
    "秘密鍵": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
}

# メールアドレスのうち、公開してよいもの（GitHubのコミット用の匿名アドレスなど）
ALLOWED_EMAIL_ENDINGS = ("@users.noreply.github.com", "@example.com", "@noreply.anthropic.com")

# 中身を読まないファイル（画像などの文字でないファイル）
SKIP_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".ico", ".mp4", ".wav", ".zip", ".pdf", ".woff", ".woff2")

# このファイル自体は、パターンの説明を含むので調べない
THIS_FILE = "ci/confidential_check.py"

LOCAL_WORDS_FILE = ".confidential_words.txt"

# このオプションを付けると、機密の言葉のリストが空のときに失敗（終了コード1）にする。
# CIで Secrets（CONFIDENTIAL_WORDS）の登録を忘れたまま「合格」になるのを防ぐため。
# 付けないとき（手元での確認）は、これまでどおり「注意」を出して続ける。
REQUIRE_WORDS_OPTION = "--require-words"


# --- 機密の言葉を読み込む ----------------------------------------------

def load_secret_words():
    """
    機密の言葉のリストを読み込む。
    受け取るもの：なし（環境変数と手元のファイルを見る）
    返すもの：言葉のリスト（空行と # で始まる行は除く）
    """
    lines = []
    lines += os.environ.get("CONFIDENTIAL_WORDS", "").splitlines()
    if os.path.exists(LOCAL_WORDS_FILE):
        with open(LOCAL_WORDS_FILE, encoding="utf-8") as file:
            lines += file.read().splitlines()

    words = []
    for line in lines:
        word = line.strip()
        if word and not word.startswith("#"):
            words.append(word)
    return words


# --- 調べるファイルの一覧 -----------------------------------------------

def list_target_files():
    """
    GitHubに上がる予定のファイルの一覧を返す。
    git の管理下なら「git が追跡する＋追跡予定のファイル」（.gitignore で除外したものは入らない）。
    git がない場所では、フォルダの中を全部たどる。
    """
    try:
        result = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            capture_output=True, text=True, encoding="utf-8", check=True,
        )
        return [path for path in result.stdout.splitlines() if path]
    except (subprocess.CalledProcessError, FileNotFoundError):
        files = []
        for folder, subfolders, names in os.walk("."):
            # 作業用のフォルダは調べない
            subfolders[:] = [s for s in subfolders if s not in (".git", ".venv", "node_modules", "__pycache__")]
            for name in names:
                files.append(os.path.relpath(os.path.join(folder, name)).replace("\\", "/"))
        return files


# --- 1つのファイルを調べる ----------------------------------------------

def check_file(path, secret_words):
    """
    1つのファイルを1行ずつ調べる。
    返すもの：見つかったものの一覧 [(行番号, 種類), ...]
    機密の言葉そのものは表示しない（CIのログに残さないため）。
    """
    findings = []
    try:
        with open(path, encoding="utf-8") as file:
            lines = file.read().splitlines()
    except (UnicodeDecodeError, OSError):
        return findings  # 文字のファイルでなければ飛ばす

    for line_number, line in enumerate(lines, start=1):
        for kind, pattern in PATTERNS.items():
            for match in pattern.finditer(line):
                if kind == "メールアドレス" and match.group().lower().endswith(ALLOWED_EMAIL_ENDINGS):
                    continue
                findings.append((line_number, kind))
        for index, word in enumerate(secret_words, start=1):
            if word in line:
                findings.append((line_number, f"機密の言葉（リストの{index}番目）"))
    return findings


# --- 全体の流れ ---------------------------------------------------------

def main():
    # コマンドに --require-words が付いているかどうか
    require_words = REQUIRE_WORDS_OPTION in sys.argv[1:]

    secret_words = load_secret_words()
    if not secret_words and require_words:
        # CIでは、言葉のリストがないまま調べても意味がないので、ここで止める
        print("機密チェック：NG。機密の言葉のリストが空です（--require-words 指定）。")
        print("GitHubの Settings → Secrets and variables → Actions → Secrets に CONFIDENTIAL_WORDS（1行に1語）を登録してください。")
        sys.exit(1)
    if not secret_words:
        print("注意：機密の言葉のリストがありません（CONFIDENTIAL_WORDS / .confidential_words.txt）。決まった形の情報だけを調べます。")

    total = 0
    for path in list_target_files():
        if path == THIS_FILE or path.lower().endswith(SKIP_EXTENSIONS):
            continue
        for line_number, kind in check_file(path, secret_words):
            print(f"見つかりました：{path}:{line_number} — {kind}")
            total += 1

    if total:
        print(f"\n機密チェック：NG（{total}件）。上の場所を直してから、もう一度実行してください。")
        sys.exit(1)
    print("機密チェック：OK")


if __name__ == "__main__":
    main()
