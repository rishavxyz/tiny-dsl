# tiny-dsl

A small script to make functions

## usage

```js
// start with defining tge function
defineCommand({ name: string, args: ["int", "int"], exec: ([a, b]) => a+b })
// then parse & execute the command
parse(data: string)
```

### defineCommand

This is the function you use to create the function.

**params**

`name = string` Name of the function.

`args = ArgType[]` The parameters and its type the function will have.

`exec = AsyncGenerator | Promise | any` It is the function where you define the purpose of your function.

### Streaming

Now added support to execute async functions and stream data.

```js
// outline
dsl.defineCommand({
  name: "weather",
  args: ["str"],
  exec: async function *([city]) {
    yield "getting coordinates..."
    fetch(...)

    yield "fetching weather..."
    fetch(...)

    return `Current weather in ${city} is ${temp}°C`
  }
});

// await stream to output both yield and return value
// last parameter is callback
await dsl.stream(dsl.parse("weather(kolkata)"), console.log);
```

### Preview of weather(city)

Full demo can be found in index.ts file.

![preview](./preview.png)

---

## Installation & Development
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
