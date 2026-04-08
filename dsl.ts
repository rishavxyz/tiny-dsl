import { isAlpha } from "./string-utils";
import StringView from "./string-view";

export type Command = {
  name: string;
  args: string[];
  exec: (args: any[]) => Promise<any> | any;
}

const commands = new Map<string, Command>();

export function defineCommand(command: Command) {
  commands.set(command.name, command);
}

export function parseCommand<T>(name: string, sv: StringView): Promise<T> | T {
  const cmd = commands.get(name);
  if (!cmd) throw new Error("unknown command");

  sv.trim();
  const fnName = sv.consumeUntil(ch => !isAlpha(ch));
  if (fnName != name)
    throw new Error(`expected function ${name}(). got ${fnName}()`);

  sv.skipMust("(");
  sv.trim();

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

    const _sv = new StringView(valRaw);
    _sv.trimEnd();
    const val = _sv.toString();

    switch (typ) {
      case "int":
        const n = Number(val);
        if (Number.isNaN(n)) throw new SyntaxError(`expected a number. got "${val}"`);
        args.push(n);
        break;

      case "str":
        args.push(val);
        break;

      default: throw new TypeError(`unknown type: "${typ}"`);
    }
  });

  return cmd.exec(args);
}

