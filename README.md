# tiny-dsl

A small script to make functions

### usage

```js
// start with defining tge function
defineCommand({ name: string, args: ["int", "int"], exec: ([a, b]) => a+b })
// then parse & execute the command
parseCommand(name: string, StringView)
```
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
