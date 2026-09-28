import { expect, test } from "bun:test";
import { parseItems, parseSections, parseStats } from "../src/parse/sections.ts";

const LEFT = `     CREW
 1. VELL. Cook. Hums constantly.
 2. ODA. Pilot. Owes everyone
 money.

!!! THE LODGER
 Something lives in the ducts.
 COMBAT: 42 INSTINCT: 18 WOUNDS: 2(25)
 SPECIAL ABILITIES
  Patient: waits for the lights to fail.
`;

const MIDDLE = `      Green reel.
      Label peeled off.                                    1
AUDIO: Static, then breathing.

      Grey reel.                                           2
AUDIO: A kettle whistling.

      KITCHEN NOTES
Everything tastes faintly of copper.

                                  Printed by Nobody Press
                                  a zine, 2031
`;

const MAP = `             FRONT DOOR

4 GALLEY
Pots hang from hooks. A PANTRY holds tins.
1. TOP SHELF. Salt and a spare fuse.
2. BOTTOM SHELF. A dead mouse.
                    HATCH
12 BILGE
Water to the ankles. ODA [C:30 Wrench 1d5 DMG I:22 W:1] is bailing.
`;

const sections = parseSections([
  { page: 1, panel: 1, text: LEFT },
  { page: 1, panel: 2, text: MIDDLE },
  { page: 2, panel: 1, text: MAP },
]);
const byId = (id: string) => sections.find((s) => s.id === id)!;

test("headed sections, with marks stripped and sub-labels kept inside", () => {
  expect(byId("crew").title).toBe("CREW");
  const lodger = byId("the-lodger");
  expect(lodger.title).toBe("THE LODGER");
  expect(lodger.body).toContain("SPECIAL ABILITIES");
  expect(lodger.body).toContain("Patient");
});

test("numbered locations, and map labels with no body are dropped", () => {
  expect(byId("4")).toMatchObject({ kind: "location", key: "4", title: "GALLEY", page: 2 });
  expect(byId("12")).toMatchObject({ kind: "location", title: "BILGE" });
  expect(sections.find((s) => /FRONT DOOR|HATCH/.test(s.title))).toBeUndefined();
});

test("keyed callouts before the first heading", () => {
  expect(byId("callout-1")).toMatchObject({ kind: "callout", title: "Green reel" });
  expect(byId("callout-1").body).toContain("breathing");
  expect(byId("callout-2").title).toBe("Grey reel");
});

test("trailing page furniture is trimmed", () => {
  expect(byId("kitchen-notes").body).toBe("Everything tastes faintly of copper.");
});

test("numbered items, wrapped lines joined", () => {
  expect(parseItems(byId("crew").body)).toEqual([
    { n: 1, text: "VELL. Cook. Hums constantly." },
    { n: 2, text: "ODA. Pilot. Owes everyone money." },
  ]);
  expect(parseItems(byId("4").body).map((i) => i.n)).toEqual([1, 2]);
});

test("full and inline stat lines", () => {
  expect(parseStats(byId("the-lodger").body)).toEqual({
    combat: 42,
    instinct: 18,
    wounds: 2,
    health: 25,
  });
  expect(parseStats(byId("12").body)).toEqual({ combat: 30, instinct: 22, wounds: 1 });
  expect(parseStats("nothing here")).toBeNull();
});
