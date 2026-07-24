import { describe, expect, it } from "vitest";
import {
  EXTINGUISHER_AREA_PER_UNIT_M2,
  getExtinguisherAreaPerUnit,
  isResidentialUnitFacility,
} from "@/lib/facilityRules";
import type { FacilityType } from "@/types/floorplan";

describe("isResidentialUnitFacility", () => {
  it("is true for apartment and villa", () => {
    expect(isResidentialUnitFacility("apartment")).toBe(true);
    expect(isResidentialUnitFacility("villa")).toBe(true);
  });

  it("is false for every other facility type", () => {
    const others: FacilityType[] = [
      "house",
      "commercial",
      "hospital",
      "school",
      "subway",
      "factory",
      "warehouse",
    ];
    for (const facilityType of others) {
      expect(isResidentialUnitFacility(facilityType)).toBe(false);
    }
  });
});

describe("getExtinguisherAreaPerUnit", () => {
  it("uses the 100㎡/200㎡(내화) group for 근린생활시설·운수시설·공장·창고류", () => {
    for (const facilityType of ["house", "commercial", "subway", "factory", "warehouse"] as const) {
      expect(getExtinguisherAreaPerUnit(facilityType)).toEqual({ normal: 100, fireResistant: 200 });
    }
  });

  it("uses the 200㎡/400㎡(내화) group for 의료시설·교육연구시설 (그 밖의 것)", () => {
    for (const facilityType of ["hospital", "school"] as const) {
      expect(getExtinguisherAreaPerUnit(facilityType)).toEqual({ normal: 200, fireResistant: 400 });
    }
  });

  it("covers every facility type with no gaps", () => {
    const keys = Object.keys(EXTINGUISHER_AREA_PER_UNIT_M2);
    expect(keys.sort()).toEqual(
      ["apartment", "villa", "house", "commercial", "hospital", "school", "subway", "factory", "warehouse"].sort()
    );
  });
});
