import { isSpace } from "./string-utils.ts";

export interface SV {
  data: string;
  start: number;
  len: number;
};

type Predicate = ((ch: string) => boolean) | string;

class StringView {
  private sv: SV = {
    data: "",
    start: 0,
    len: 0,
  };

  constructor(data: string) {
    this.sv.data = data;
    this.sv.start = 0;
    this.sv.len = data.length;
  }

  private _(): number {
    return this.sv.start + this.sv.len;
  }

  isEmpty(): boolean {
    return this.sv.len == 0;
  }

  reset() {
    this.sv.start = 0;
    this.sv.len = this.sv.data.length;
  }

  mark(): [start: number, len: number] {
    return [this.sv.start, this.sv.len];
  }

  goto([start, len]: [start: number, len: number]) {
    const totalLen = this.sv.data.length;
    if (start < 0 || start > totalLen || len < 0 || len > totalLen)
      throw new Error(`start ${start} and len ${len} are out of range`);
    this.sv.start = start;
    this.sv.len = len;
  }

  head(): string {
    if (this.isEmpty()) return "";
    return this.sv.data[this.sv.start]!;
  }

  last(): string {
    if (this.isEmpty()) return "";
    return this.sv.data[this._() - 1]!;
  }

  next(): string {
    if (this.sv.len <= 1) return "";
    return this.sv.data[this.sv.start + 1]!;
  }

  nextEnd(): string {
    if (this.sv.len <= 1) return "";
    return this.sv.data[this._() - 2]!;
  }

  skip() {
    if (this.isEmpty()) return;
    this.sv.start++;
    this.sv.len--;
  }

  skipEnd() {
    if (this.isEmpty()) return;
    this.sv.len--;
  }

  skipMust(predicate: Predicate) {
    const cur = this.sv.start;

    if (this.isEmpty()) throw new SyntaxError(`${cur}: unexpected end of input`);

    const ch = this.head();

    if (typeof predicate == "function") {
      if (predicate(ch)) this.skip();
      else throw new SyntaxError(`${cur}: unexpected "${ch}"`);
    } else {
      if (ch == predicate) this.skip();
      else throw new SyntaxError(`${cur}: expected "${predicate}". got "${ch}"`);
    }
  }

  skipUntil(predicate: Predicate) {
    while (!this.isEmpty()) {
      let pred = false;
      const ch = this.head();

      if (typeof predicate == "function") {
        pred = predicate(ch);
      } else {
        pred = ch == predicate;
      }

      if (pred) break;
      this.skip();
    }
  }

  consume(): string {
    if (this.isEmpty()) return "";
    this.sv.start++;
    this.sv.len--;
    return this.sv.data[this.sv.start - 1]!;
  }

  consumeUntil(predicate: Predicate): string {
    const b4 = this.sv.start;
    this.skipUntil(predicate);
    return this.sv.data.substring(b4, this.sv.start);
  }

  trim() {
    while (!this.isEmpty() && isSpace(this.head())) {
      this.skip();
    }
  }

  trimEnd() {
    while (!this.isEmpty() && isSpace(this.last())) {
      this.skipEnd();
    }
  }

  toString(): string {
    return this.sv.data.substring(this.sv.start, this._());
  }

  [Symbol.dispose]() {
    this.sv.data = "";
    this.sv.start = 0;
    this.sv.len = 0;
  }
}

export default StringView;
