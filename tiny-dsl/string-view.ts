import ParseError from "./error.ts";
import { isSpace } from "./string-utils.ts";

export interface SV {
  data: string;
  start: number;
  len: number;
};

type Predicate = ((ch: string) => boolean) | string;
type Marker = [start: number, end: number];

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

  get at(): number {
    return this.sv.start;
  }

  mark(start?: number, end?: number): Marker {
    return [start ?? this.sv.start, end ?? this.sv.len];
  }

  goto([start, end]: Marker) {
    const totalLen = this.sv.data.length;
    if (start < 0 || start > totalLen || end < 0 || end > totalLen)
      throw new ParseError(`start ${start} and len ${end} are out of range`);
    this.sv.start = start;
    this.sv.len = end;
  }

  peek(at?: number): string {
    at ??= 0;

    if (this.isEmpty())
      throw new ParseError("already at end of input");
    if (at >= this.sv.len)
      throw new ParseError("peeking more than input ends");

    const s = this.sv.data;
    if (at < 0) return s[this._() + at]!;
    return s[this.sv.start + at]!;
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
    if (this.isEmpty()) throw new ParseError(`unexpected end of input`, this.at);

    const ch = this.peek();
    if (typeof predicate == "function") {
      if (predicate(ch)) this.skip();
      else throw new ParseError(`unexpected "${ch}"`, this.at);
    } else {
      if (ch == predicate) this.skip();
      else throw new ParseError(`expected "${predicate}". got "${ch}"`, this.at);
    }
  }

  *iter() {
    const start = this.sv.start;
    while (!this.isEmpty()) {
      yield {
        consumed: this.sv.data[this.sv.start]!,
        toString: () => this.sv.data.substring(start, this.sv.start)!
      }
      this.skip();
    }
  }

  consume(): string {
    if (this.isEmpty()) return "";
    this.sv.start++;
    this.sv.len--;
    return this.sv.data[this.sv.start - 1]!;
  }

  consumeUntil(ch: string, predicate?: (ch: string) => boolean): {
    found: true,
    marker: Marker,
    toString: () => string,
  } | {
    found: false,
    marker: undefined,
    toString: undefined,
  } {
    const [start, end] = this.mark();
    while (!this.isEmpty() && this.peek() != ch) {
      const chNew = this.peek();

      if (!predicate || predicate?.(chNew)) this.skip();
      else throw new ParseError(`char "${chNew}" does not match the predicate ${predicate.name}.`, this.at);
    }
    const startAfterSkip = this.sv.start;

    if (this.isEmpty()) {
      this.goto([start, end]);
      return { found: false, marker: undefined, toString: undefined };
    }
    return {
      found: true,
      marker: this.mark(start, startAfterSkip),
      toString: () => {
        if (this.sv.start != startAfterSkip)
          throw new ParseError("data has been changed! did you mutate the data before calling toString?", this.at);
        return this.toString(start, startAfterSkip)
      }
    };
  }

  trim() {
    while (!this.isEmpty() && isSpace(this.peek())) {
      this.skip();
    }
  }

  trimEnd() {
    while (!this.isEmpty() && isSpace(this.peek(-1))) {
      this.skipEnd();
    }
  }

  toString(start?: number, end?: number): string {
    start ??= this.sv.start;
    end ??= this._();
    return this.sv.data.substring(start, end);
  }

  data(): string {
    return this.sv.data;
  }
}

export default StringView;
