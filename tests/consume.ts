import StringView from "../tiny-dsl/string-view";

const s = "()" + " ".repeat(1e3)
const sv = new StringView(s);

const t = performance.now();

const start = sv.mark()
for (let i = 0; i < 1e5; i++) {
  sv.goto(start);
  sv.trimEnd();
}

console.log("t:", performance.now() - t)
console.log("|%s|", sv.toString())

