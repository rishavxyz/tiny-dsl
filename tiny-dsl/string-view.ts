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

  private get end(): number {
    return this.sv.len;
  }

  private set end(n: number) {
    this.sv.len = n;
  }

  private get start(): number {
    return this.sv.start;
  }

  private set start(n: number) {
    this.sv.start = n;
  }

  private get len(): number {
    return this.start + this.end;
  }

  isEmpty(): boolean {
    return this.end == 0;
  }

  reset() {
    this.start = 0;
    this.end = this.data.length;
  }

  get at(): number {
    return this.start;
  }

  get data(): string {
    return this.sv.data;
  }

  mark(start?: number, end?: number): Marker {
    return [start ?? this.start, end ?? this.end];
  }

  goto([start, end]: Marker) {
    const totalLen = this.data.length;
    if (start < 0 || start > totalLen || end < 0 || end > totalLen)
      throw new ParseError(`start ${start} and len ${end} are out of range`);
    this.start = start;
    this.end = end;
  }

  peek(at?: number): string {
    at ??= 0;

    if (this.isEmpty())
      throw new ParseError("already at end of input");
    if (at >= this.end)
      throw new ParseError("peeking more than input ends");

    if (at < 0) return this.data[this.len + at]!;
    return this.data[this.start + at]!;
  }

  skip() {
    if (this.isEmpty()) return;
    this.start++;
    this.end--;
  }

  skipEnd() {
    if (this.isEmpty()) return;
    this.end--;
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
    const start = this.start;
    while (!this.isEmpty()) {
      yield {
        consumed: this.data[this.start]!,
        toString: () => this.data.substring(start, this.start)!
      }
      this.skip();
    }
  }

  consume(): string {
    if (this.isEmpty()) return "";
    this.start++;
    this.end--;
    return this.data[this.start - 1]!;
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
    const startAfterSkip = this.start;

    if (this.isEmpty()) {
      this.goto([start, end]);
      return { found: false, marker: undefined, toString: undefined };
    }
    return {
      found: true,
      marker: this.mark(start, startAfterSkip),
      toString: () => {
        if (this.start != startAfterSkip)
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
    start ??= this.start;
    end ??= this.len;
    return this.data.substring(start, end);
  }
}

export default StringView;
