import { afterAll, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appendLog,
  archiveSession,
  loadSession,
  loadState,
  readLog,
  saveSession,
  saveState,
} from "../src/state.ts";

const dir = mkdtempSync(join(tmpdir(), "moshi-state-"));
process.env.MOSHI_STATE_DIR = join(dir, "nested");
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("missing state reads as empty", () => {
  expect(loadState()).toEqual({});
  expect(loadSession("ember-relay").clocks).toEqual([]);
});

test("state and sessions round-trip", () => {
  saveState({ module: { id: "ember-relay", path: "/tmp/Ember_Relay.pdf" } });
  expect(loadState().module?.id).toBe("ember-relay");
  const s = loadSession("ember-relay");
  s.cast.Vell = { stress: 3 };
  saveSession("ember-relay", s);
  expect(loadSession("ember-relay").cast.Vell.stress).toBe(3);
});

test("log appends, and archiving starts clean", () => {
  appendLog("ember-relay", { at: new Date().toISOString(), game: 0, kind: "note", text: "one" });
  appendLog("ember-relay", { at: new Date().toISOString(), game: 5, kind: "note", text: "two" });
  expect(readLog("ember-relay").map((e) => e.text)).toEqual(["one", "two"]);
  const archived = archiveSession("ember-relay");
  expect(archived && existsSync(archived)).toBe(true);
  expect(readLog("ember-relay")).toEqual([]);
  expect(loadSession("ember-relay").cast).toEqual({});
});
