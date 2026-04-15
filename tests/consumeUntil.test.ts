import { describe, expect, it } from "bun:test";
import StringView from "../tiny-dsl/string-view";

describe(`StringView('weather("kolkata")'`, () => {
  it("should return name up until '('", () => {
    const sv = new StringView(`weather("kolkata")`);
    const consumed = sv.consumeUntil("(");
    expect(consumed).toBe("weather");
  });
  it("should move the view to '(\"kolkata\")'", () => {
    const sv = new StringView(`weather("kolkata")`);
    sv.consumeUntil("(");
    expect(sv.toString()).toBe(`("kolkata")`);
  })
  it("should consume nothing; return undefined", () => {
    const sv = new StringView(`weather("kolkata")`);
    const consumed = sv.consumeUntil("R");
    expect(consumed).toBeUndefined();
  })
  it("should not move the view", () => {
    const sv = new StringView(`weather("kolkata")`);
    sv.consumeUntil("R");
    expect(sv.toString()).toBe(`weather("kolkata")`);
  })
})

describe(`validation`, () => {
  it(`should return true`, () => {
    const sv = new StringView(`weather("kolkata")`);
    const consumed = sv.consumeUntil("(");
    expect(sv.validate(consumed, "is-alpha")).toBeTrue();
  })
  it(`should return false`, () => {
    const sv = new StringView(`weather("kolkata")`);
    const consumed = sv.consumeUntil("(");
    expect(sv.validate(consumed, "is-num")).toBeFalse();
  })
  it(`should return false`, () => {
    const sv = new StringView(`weather("kolkata")`);
    const consumed = sv.consumeUntil("(");
    expect(sv.validate(consumed, "is-space")).toBeFalse();
  })
  it(`should return false`, () => {
    const sv = new StringView(`weather82("kolkata")`);
    const consumed = sv.consumeUntil("(");
    expect(sv.validate(consumed, "is-alpha")).toBeFalse();
  })
  it(`should return true`, () => {
    const sv = new StringView(`weath3r("kolkata")`);
    const consumed = sv.consumeUntil("(");
    expect(sv.validate(consumed, "is-alpha-num")).toBeTrue();
  })
})
