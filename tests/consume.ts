import { isAlphaAscii, isSpaceAscii } from "../tiny-dsl/string-utils";
import StringView from "../tiny-dsl/string-view";

const s = " ".repeat(1e3) + "()"
const sv = new StringView(s);

const t = performance.now();

const marker = sv.mark()
for (let i = 0; i < 1e5; i++) {
  sv.goto(marker);
  const consumed = sv.consumeUntil("(");
  sv.validate(consumed, "is-alpha");
}

console.log("t:", performance.now() - t)
console.log("|%s|", sv.toString())

