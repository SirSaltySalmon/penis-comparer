import { DEFAULT_MEASUREMENT } from "./measurement";
import { parseUrlState, serializeUrlState } from "./urlState";
import { describe, expect, it } from "vitest";

describe("url state", () => {
  it("serializes canonical metric values", () => {
    const query = serializeUrlState({
      lengthCm: 13.12,
      diameterCm: 3.71,
      fatLayerCm: 1,
      color: "#d79b88",
      fatColor: "#f2d2bf",
      tipColor: "#c98278",
      unitMode: "imperial",
      presetId: "custom",
    });

    expect(query).toBe(
      "?l=13.12&d=3.71&f=1&c=d79b88&fc=f2d2bf&tc=c98278&u=imperial&p=custom",
    );
  });

  it("parses valid params", () => {
    const result = parseUrlState(
      "?l=15&d=4&f=0.5&c=abcdef&fc=fedcba&tc=123456&u=imperial&p=custom",
    );

    expect(result.value.lengthCm).toBe(15);
    expect(result.value.diameterCm).toBe(4);
    expect(result.value.fatLayerCm).toBe(0.5);
    expect(result.value.color).toBe("#abcdef");
    expect(result.value.fatColor).toBe("#fedcba");
    expect(result.value.tipColor).toBe("#123456");
    expect(result.value.unitMode).toBe("imperial");
    expect(result.value.presetId).toBe("custom");
    expect(result.invalidFields).toEqual([]);
  });

  it("keeps legacy links without independent color params compatible", () => {
    const result = parseUrlState(
      "?l=15&d=4&f=0.5&c=abcdef&u=metric&p=custom",
    );

    expect(result.value.color).toBe("#abcdef");
    expect(result.value.fatColor).toBe(DEFAULT_MEASUREMENT.fatColor);
    expect(result.value.tipColor).toBe(DEFAULT_MEASUREMENT.tipColor);
    expect(result.invalidFields).toEqual([]);
  });

  it("resets blank numeric params to defaults", () => {
    const result = parseUrlState("?f=");

    expect(result.value.fatLayerCm).toBe(DEFAULT_MEASUREMENT.fatLayerCm);
    expect(result.invalidFields).toEqual(["f"]);
  });

  it("resets whitespace numeric params but accepts explicit zero", () => {
    const blankResult = parseUrlState("?f=%20%20");
    const zeroResult = parseUrlState("?f=0");

    expect(blankResult.value.fatLayerCm).toBe(DEFAULT_MEASUREMENT.fatLayerCm);
    expect(blankResult.invalidFields).toEqual(["f"]);
    expect(zeroResult.value.fatLayerCm).toBe(0);
    expect(zeroResult.invalidFields).toEqual([]);
  });

  it("resets only invalid fields", () => {
    const result = parseUrlState(
      "?l=-1&d=4&f=bad&c=zzzzzz&fc=wrong&tc=nope&u=metric&p=unknown",
    );

    expect(result.value.lengthCm).toBe(DEFAULT_MEASUREMENT.lengthCm);
    expect(result.value.diameterCm).toBe(4);
    expect(result.value.fatLayerCm).toBe(DEFAULT_MEASUREMENT.fatLayerCm);
    expect(result.value.color).toBe(DEFAULT_MEASUREMENT.color);
    expect(result.value.fatColor).toBe(DEFAULT_MEASUREMENT.fatColor);
    expect(result.value.tipColor).toBe(DEFAULT_MEASUREMENT.tipColor);
    expect(result.value.presetId).toBe(DEFAULT_MEASUREMENT.presetId);
    expect(result.invalidFields.sort()).toEqual([
      "c",
      "f",
      "fc",
      "l",
      "p",
      "tc",
    ]);
  });
});
