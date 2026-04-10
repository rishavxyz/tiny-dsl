import { isAlpha } from "./string-utils";
import StringView from "./string-view";

export type ArgType = "int" | "str";

export type Command = {
  name: string;
  args: ArgType[];
  exec: (args: any[]) => Promise<any> | any | AsyncGenerator<any, any, any>;
}

class TinyDsl {
  private commands: Record<string, Command> = {};

  constructor() { }

  defineCommand(command: Command) {
    if (this.commands[command.name])
      throw new Error(`function ${command.name}() already declared`);
    this.commands[command.name] = command;
  }

  parse<T>(data: string): T {
    using sv = new StringView(data);
    const cmd = this.fnLookup(sv);
    const args = this.argparse(sv, cmd);
    const out = this.execute(cmd, args);
    return out as T;
  }

  async *parseAsync<T>(data: string): AsyncGenerator<any, T, any> {
    using sv = new StringView(data);
    const cmd = this.fnLookup(sv);
    const args = this.argparse(sv, cmd);
    const out = this.execute(cmd, args);

    if (typeof out == "object" && Symbol.asyncIterator in out) {
      const iter: AsyncIterator<any, T, any> = out[Symbol.asyncIterator]();

      while (true) {
        const { value, done } = await iter.next();
        if (done) return value;
        yield value;
      }
    }

    return out as T;
  }

  async stream<T>(data: AsyncGenerator<any, T, any>, callback: (t: T) => void) {
    if (!(Symbol.asyncIterator in data))
      throw new Error("data is not streamable");
    while (true) {
      const { done, value } = await data.next();
      callback(value);
      if (done) break;
    }
  }

  private fnLookup(sv: StringView): Command {
    sv.trim();
    const start = sv.mark();

    while (sv.head() != "(") {
      const ch = sv.head();
      if (isAlpha(ch)) sv.skip();
      else throw new SyntaxError(`function name must be [a-zA-Z]. got ${ch}`);
    }
    sv.goto(start)

    const fnName = sv.consumeUntil("(");
    const cmd = this.commands[fnName];
    if (!cmd) throw new Error(`unknown function "${fnName}"`);

    sv.skipMust("(");
    sv.trim();

    return cmd;
  }

  private argparse(sv: StringView, cmd: Command) {
    const args: any[] = [];
    cmd.args.forEach((typ, i) => {
      let valRaw = "";

      if (i < cmd.args.length - 1) {
        valRaw = sv.consumeUntil(",");
        sv.skipMust(",");
      } else {
        valRaw = sv.consumeUntil(")");
        sv.skipMust(")");
      }

      using _sv = new StringView(valRaw);
      _sv.trim();
      _sv.trimEnd();
      const val = _sv.toString();

      switch (typ) {
        case "int":
          const n = Number(val);
          if (Number.isNaN(n)) throw new TypeError(`expected a number. got "${val}"`);
          args.push(n);
          break;

        case "str": {
          _sv.skipMust(`"`);
          const val = _sv.consumeUntil(`"`);
          _sv.skipMust(`"`);
          args.push(val);
          break;
        }

        default: throw new TypeError(`unknown type: "${typ}"`);
      }
    });
    return args;
  }

  private execute(cmd: Command, args: any[]) {
    return cmd.exec(args);
  }
}

export default TinyDsl;
