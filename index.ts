import TinyDsl from "./tiny-dsl";

const dsl = new TinyDsl();

dsl.defineCommand({
  name: "add",
  args: ["int", "int"],
  exec: ([a, b]): number => a + b
});

dsl.defineCommand({
  name: "sayMyName",
  args: ["str"],
  exec: ([name]) => name == "Heisenberg" ? "You're Goddamn Right!" : `Hello ${name}...`
});

dsl.defineCommand({
  name: "greet",
  args: ["str"],
  exec: ([name]) => `Hello ${name}! My name is YeltsaKcir.`
});

dsl.defineCommand({
  name: "grok",
  args: ["str"],
  exec: ([qs]) => {
    const s: string = qs;
    const isAQuestion = s[s.length - 1] === "?";
    if (!isAQuestion) return "It is not a question to ask.";
    return Math.random() >= 0.666 ? `${qs} Yes.` : `${qs} No.`;
  },
});

dsl.defineCommand({
  name: "weather",
  args: ["str"],
  exec: async function*([city]) {

    yield "getting coordinates...";

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
    );

    if (!geoRes.ok) throw new Error(geoRes.statusText);

    const geoJson: any = await geoRes.json();
    const result = geoJson?.results?.[0];
    if (!result) return `City ${city} not found`;

    const { latitude: lat, longitude: lon } = result;

    yield "fetching weather...";

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    if (!weatherRes.ok) throw new Error(weatherRes.statusText);

    const weatherJson: any = await weatherRes.json();
    const weather = weatherJson?.current_weather;

    if (!weather) return `Sorry, can't get weather in ${city}`;

    return `Current weather in ${city} is ${weather.temperature}°C`;
  }
});

console.log(dsl.parse(`sayMyName("WW")`))
console.log(dsl.parse("add(34, 35)"))

// await dsl.stream<string>(
//   dsl.parseAsync<string>(`weather("kolkata")`),
//   console.log,
// );

const out2 = dsl.parse(`greet("rishav")`);
console.log(out2);

const out3 = dsl.parse(`grok("Is Rishav awesome?")`);
console.log(out3);
