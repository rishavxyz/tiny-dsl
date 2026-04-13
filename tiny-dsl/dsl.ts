import ParseError from "./error";
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
      throw new ParseError(`function ${command.name}() already declared`);
    this.commands[command.name] = command;
  }

  parse<T>(data: string): T {
    const sv = new StringView(data);
    const cmd = this.fnLookup(sv);
    const args = this.argparse(sv, cmd);
    const out = this.execute(cmd, args);
    return out as T;
  }

  async *parseAsync<T>(data: string): AsyncGenerator<any, T, any> {
    const sv = new StringView(data);
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
      throw new ParseError("data is not streamable");
    while (true) {
      const { done, value } = await data.next();
      callback(value);
      if (done) break;
    }
  }

  private fnLookup(sv: StringView): Command {
    sv.trim();

    const { found, toString } = sv.consumeUntil("(", isAlpha);
    if (!found)
      throw new ParseError("function name must be [a-zA-Z]");

    const fnName = toString()
    const cmd = this.commands[fnName];
    if (!cmd) throw new ParseError(`unknown function "${fnName}"`);

    sv.skipMust("(");
    sv.trim();

    return cmd;
  }

  private argparse(sv: StringView, cmd: Command) {
    const args: any[] = [];
    cmd.args.forEach((typ, i) => {
      const target = i == cmd.args.length - 1 ? ")" : ",";

      const { found, toString } = sv.consumeUntil(target);
      if (!found) {
        throw new ParseError(`invalid syntax. missing "${target}"`, sv.at);
      }
      const valRaw = toString();
      sv.skipMust(target);

      const _sv = new StringView(valRaw);
      _sv.trim();
      _sv.trimEnd();
      const val = _sv.toString();

      switch (typ) {
        case "int":
          const n = Number(val);
          if (Number.isNaN(n)) throw new ParseError(`expected a number. got "${val}"`, sv.at);
          args.push(n);
          break;

        case "str": {
          _sv.skipMust(`"`);
          const { found, toString } = _sv.consumeUntil(`"`);
          if (!found) {
            throw new ParseError(`invalid syntax. missing '"'`, sv.at);
          }
          const val = toString();
          _sv.skipMust(`"`);
          args.push(val);
          break;
        }

        default: throw new ParseError(`unknown type: "${typ}"`);
      }
    });
    return args;
  }

  private execute(cmd: Command, args: any[]) {
    return cmd.exec(args);
  }
}

export default TinyDsl;
