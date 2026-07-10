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
      unitMode: "imperial",
      presetId: "custom",
    });

    expect(query).toBe("?l=13.12&d=3.71&f=1&c=d79b88&u=imperial&p=custom");
  });

  it("parses valid params", () => {
    const result = parseUrlState("?l=15&d=4&f=0.5&c=abcdef&u=imperial&p=custom");

    expect(result.value.lengthCm).toBe(15);
    expect(result.value.diameterCm).toBe(4);
    expect(result.value.fatLayerCm).toBe(0.5);
    expect(result.value.color).toBe("#abcdef");
    expect(result.value.unitMode).toBe("imperial");
    expect(result.invalidFields).toEqual([]);
  });

  it("resets only invalid fields", () => {
    const result = parseUrlState("?l=-1&d=4&f=bad&c=zzzzzz&u=metric&p=unknown");

    expect(result.value.lengthCm).toBe(DEFAULT_MEASUREMENT.lengthCm);
    expect(result.value.diameterCm).toBe(4);
    expect(result.value.fatLayerCm).toBe(DEFAULT_MEASUREMENT.fatLayerCm);
    expect(result.value.color).toBe(DEFAULT_MEASUREMENT.color);
    expect(result.value.presetId).toBe(DEFAULT_MEASUREMENT.presetId);
    expect(result.invalidFields.sort()).toEqual(["c", "f", "l", "p"]);
  });
});
