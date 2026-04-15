import ParseError from "./error.ts";

class StringView {
  private data = "";
  private cur = 0;
  private len = 0;

  constructor(data: string) {
    this.data = data;
    this.cur = 0;
    this.len = data.length;
  }

  reset() {
    this.cur = 0;
    this.len = this.data.length;
  }

  mark(): number {
    return (this.cur << 16) | this.len;
  }

  goto(marker: number) {
    this.cur = marker >> 16;
    this.len = marker & 0xFFFF;
  }

  peek(at = this.cur): number {
    const len = this.len;
    const data = this.data;

    if (at >= len) throw new ParseError("peeking empty string");
    if (at < 0) data.charCodeAt(len + at);
    return data.charCodeAt(at);
  }

  peekChar(offset = this.cur): string {
    const ch = this.data.at(offset);
    if (!ch) throw new ParseError("offset is out of bound");
    return ch;
  }

  skip() {
    if (this.cur >= this.len) return;
    this.cur++;
  }

  skipMust(expected: string) {
    const ch = this.peekChar();
    if (expected === ch) this.cur++;
    else throw new ParseError(`expected '${expected}' got '${ch}'`);
  }

  trim() {
    let i = this.cur;
    const len = this.len;
    const data = this.data;

    if (i >= len || data.charCodeAt(i) > 32) return;
    i++;
    while (i < len) {
      const c = data.charCodeAt(i);
      if (c > 32) break;
      i++;
    }
    this.cur = i;
  }

  trimEnd() {
    const len = this.len;
    const start = this.cur;
    const data = this.data;

    let i = this.len - 1;

    if (len <= start || data.charCodeAt(i) > 32) return;
    i--;
    while (i >= start) {
      const c = data.charCodeAt(i);
      if (c > 32) break;
      i--;
    }
    this.len = i + 1;
  }

  consumeUntil(ch: string): string | undefined {
    const start = this.cur;
    const len = this.len;

    if (start >= len) throw new ParseError("already at the end of view");

    const i = this.data.indexOf(ch, start);
    if (i < 0 || i >= len) return undefined;

    this.cur = i;
    return this.toString(start, i);
  }

  validate(
    data: string | undefined,
    typ: "is-alpha" | "is-alpha-num" | "is-space" | "is-num"
  ): data is string {
    if (!data || data.length === 0) return false;

    const len = data.length;
    for (let i = 0; i < len; i++) {
      const c = data.charCodeAt(i);

      switch (typ) {
        case "is-alpha":
          if (!this.isAlpha(c))
            return false;
          break;
        case "is-alpha-num":
          if (!this.isAlphaNum(c))
            return false;
          break;
        case "is-space":
          if (c > 32)
            return false;
          break;
        case "is-num":
          if (!this.isNum(c))
            return false;
          break;
        default:
          throw new ParseError("unknown type");
      }
    }
    return true;
  }

  toAscii(ch: string): number {
    return ch.charCodeAt(0);
  }

  toString(start?: number, end?: number): string {
    start ??= this.cur;
    end ??= this.len;
    return this.data.substring(start, end);
  }

  isAlpha(c: number): boolean {
    const n = ((c | 32) - 97);
    return n >= 0 && n <= 25;
  }

  isNum(c: number): boolean {
    return c >= 48 && c <= 57;
  }

  isAlphaNum(c: number): boolean {
    return this.isAlpha(c) || this.isNum(c);
  }

  isSpace(c: number): boolean {
    return !(c > 32);
  }
}

export default StringView;
