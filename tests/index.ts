import TinyDsl from "../tiny-dsl";
import StringView from "../tiny-dsl/string-view";

const vpool = new Map<string, any>();

const commands = `
  setv("city", kolkata)
  get("weather.com/#[getv(city)]")
  |> jq("results/@1/{latitude,longitude}")
  |> get("weather.com?latitude=#1&longitude=#2")
  |> jq("current_weather/temperature")
  |> say("current weather in #[getv(city)] is #1°c")
`;

const data = `setv("city", kolkata)`
const dataNum = `setv("lat", 32.09)`

const data1 = `getv(city)`

const dsl = new TinyDsl()

dsl.defineCommand({
  name: "setv",
  args: ["str", "any"],
  exec: ([vname, vvalue]) => {
    if (vpool.has(vname)) {
      console.log("var %s already exists", vname);
      return
    }
    vpool.set(vname, vvalue)
  }
});


// BUG: cannot have arrays since placing comma inside arguments will break consume
const jq = `jq('{"foo":{"bar":{"baz": [{"fizz": 1337}] }}}', "foo/bar/baz/0/fizz")`

dsl.defineCommand({
  name: "getv",
  args: ["any"],
  exec: ([vname]) => {
    if (!vpool.has(vname)) {
      console.log("var %s not found", vname)
      return undefined
    }
    return vpool.get(vname)
  }
})

dsl.defineCommand({
  name: "jq",
  args: ["str", "str"],
  exec: ([jstr, s]) => {
    const str: string = s;
    const sv = new StringView(str);

    const data = JSON.parse(jstr);

    const depth: string[] = [];

    while (true) {
      const v = sv.consumeUntil("/");
      if (v) {
        depth.push(v);
        sv.skip();
      } else {
        depth.push(sv.toString());
        break;
      }
    }
    let current = data;
    for (const key of depth) {
      const k = Array.isArray(current) ? Number(key) : key;
      if (current == null || !(k in current)) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }
})

console.log(
  dsl.parse(jq)
);

dsl.defineCommand({
  name: "get",
  args: ["str", "str"],
  exec: async function*([url, typ]) {
    yield "fetching..."
    const req = await fetch(url);
    // @ts-ignore
    const res = await req[typ]();
    return res;
  }
})

dsl.parse(dataNum)
const out = dsl.parse(data)
const out1 = dsl.parse(data1)



