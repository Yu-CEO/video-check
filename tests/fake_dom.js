/*
 * fake_dom.js：テスト用の「ニセの画面」（ブラウザが無くても、画面を組み立てる処理を動かして中身を確かめるための道具）
 * 使い方：installFakeDom() を呼ぶと、js/ の画面のファイルが使う document と window の最小限の部分が使えるようになる。
 * 組み立てた部品は、textOf（見える文字だけ集める）・findAll（条件に合う部品を探す）で調べる。
 * 本物のブラウザの代わりではない。見た目（大きさ・色）は確かめられないので、それは実機の目視で確かめる。
 * tests/pictures.test.js から使われる。
 */

class FakeNode {
  /**
   * 部品を1つ作る。
   * @param {string} tag タグの名前
   * @example new FakeNode("div")
   */
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.listeners = {};
    this.className = "";
    this.text = "";
    this.classList = { add: (name) => { this.className = (this.className + " " + name).trim(); } };
  }

  /**
   * 中の文字を入れ替える（中の部品は消える）。
   * @param {string} value 文字
   * @returns {void}
   */
  set textContent(value) {
    this.children = [];
    this.text = String(value);
  }

  /**
   * 中の文字を返す（中の部品の文字も含む）。
   * @returns {string} 文字
   */
  get textContent() {
    return this.text + this.children.map((child) => (typeof child === "string" ? child : child.textContent)).join("");
  }

  /**
   * 決まった絵を文字で入れる（innerHTML）。絵の中身は調べず、絵として扱う。
   * @param {string} value 絵の文字
   * @returns {void}
   */
  set innerHTML(value) {
    this.children = [];
    this.rawHtml = value;
  }

  /**
   * 部品か文字を後ろに足す。
   * @param {...(FakeNode|string)} nodes 足すもの
   * @returns {void}
   */
  append(...nodes) {
    nodes.forEach((node) => { this.children.push(node); });
  }

  /**
   * 中身をすべて入れ替える。
   * @param {...FakeNode} nodes 新しい中身
   * @returns {void}
   */
  replaceChildren(...nodes) {
    this.children = nodes;
    this.text = "";
  }

  /**
   * 属性を入れる。
   * @param {string} name 名前
   * @param {*} value 値
   * @returns {void}
   */
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  /**
   * 属性を返す。
   * @param {string} name 名前
   * @returns {string|null} 値（なければ null）
   */
  getAttribute(name) {
    return name in this.attributes ? this.attributes[name] : null;
  }

  /**
   * 押したときなどの処理を覚える（テストでは呼ばない）。
   * @param {string} type 種類
   * @param {Function} handler 処理
   * @returns {void}
   */
  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }
}

/**
 * ニセの画面の道具を、全体で使えるようにする。
 * @returns {void}
 * @example installFakeDom()
 */
export function installFakeDom() {
  globalThis.document = {
    title: "",
    createElement: (tag) => new FakeNode(tag),
    createElementNS: (namespace, tag) => new FakeNode(tag),
    getElementById: () => null
  };
  globalThis.window = { scrollTo: () => {} };
}

/**
 * 部品の中から、条件に合うものを全部探す（入れ子の中も）。
 * @param {FakeNode} root 探し始める部品
 * @param {(node:FakeNode) => boolean} predicate 条件
 * @returns {FakeNode[]} 見つかった部品
 * @example findAll(app, (node) => node.tagName === "svg")
 */
export function findAll(root, predicate) {
  const found = [];
  if (typeof root === "string") {
    return found;
  }
  if (predicate(root)) {
    found.push(root);
  }
  root.children.forEach((child) => {
    findAll(child, predicate).forEach((node) => { found.push(node); });
  });
  return found;
}

/**
 * 画面に見える文字だけを集める。絵（svg）の中の文字は「図の中の文字」として別に数えるので、ここでは除く。
 * @param {FakeNode} root 集め始める部品
 * @param {{withSvgText:boolean}} [options] 絵の中の文字も含めるなら withSvgText を true に
 * @returns {string} 見える文字をつないだもの
 * @example textOf(app)
 */
export function textOf(root, options) {
  const withSvgText = options && options.withSvgText;
  if (typeof root === "string") {
    return root;
  }
  if (root.tagName === "svg" && !withSvgText) {
    return "";
  }
  return root.text + root.children.map((child) => textOf(child, options)).join("");
}
