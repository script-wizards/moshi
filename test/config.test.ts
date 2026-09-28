import { expect, test } from "bun:test";
import { matchModule, moduleRef } from "../src/pdf/config.ts";

const FILES = [
  "books/The-Quiet-Hulk-v2.1-for-backers.pdf",
  "books/Quiet-Hulk-v1.9.pdf",
  "books/Mothership-Salt-Choir-v1.0wip.pdf",
  "books/Salt Choir Redux.pdf",
  "books/modules/Ember_Relay.pdf",
];
const MODULES = FILES.map(moduleRef);

test("slug drops prefix, version, and printing notes", () => {
  expect(moduleRef(FILES[0])).toMatchObject({
    id: "the-quiet-hulk@2.1",
    slug: "the-quiet-hulk",
    version: "2.1",
    name: "The Quiet Hulk",
  });
  expect(moduleRef(FILES[2])).toMatchObject({ id: "salt-choir@1.0wip", name: "Salt Choir" });
  expect(moduleRef(FILES[4])).toMatchObject({ id: "ember-relay", version: undefined });
});

test("exact id wins", () => {
  expect(matchModule("quiet-hulk@1.9", MODULES).path).toBe(FILES[1]);
});

test("exact slug picks the newest version", () => {
  const two = [moduleRef("a/Relay-v1.2.pdf"), moduleRef("a/Relay-v1.10.pdf")];
  expect(matchModule("relay", two).version).toBe("1.10");
});

test("unique substring matches", () => {
  expect(matchModule("ember", MODULES).id).toBe("ember-relay");
});

test("ambiguous or missing queries throw", () => {
  expect(() => matchModule("hulk", MODULES)).toThrow(/several/);
  expect(() => matchModule("nowhere", MODULES)).toThrow(/No module/);
});
