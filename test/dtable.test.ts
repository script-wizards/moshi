import { expect, test } from "bun:test";
import { parseDieTable } from "../src/parse/dtable.ts";

const at = (col: number, s: string, left = ""): string => left.padEnd(col) + s;

const PAGE = [
  "Some prose about the table that runs",
  at(30, "D6    MISHAP", "down the left side."),
  at(36, "BUTTERFINGERS. Drop what you", "hold."),
  at(30, "1"),
  at(36, "are holding."),
  at(30, "2     SNEEZE. Everyone hears you.", "More prose here"),
  at(36, "TANGLED / STUCK (SUITS). Lose"),
  at(30, "3"),
  at(36, "a round."),
  at(30, "4     FINE. Nothing happens."),
].join("\n");

test("entries found by name, numbered in order, wrapped text joined", () => {
  const e = parseDieTable(PAGE, /D6\s+MISHAP/);
  expect(e.map((x) => [x.n, x.name])).toEqual([
    [1, "BUTTERFINGERS"],
    [2, "SNEEZE"],
    [3, "TANGLED / STUCK (SUITS)"],
    [4, "FINE"],
  ]);
  expect(e[0].text).toBe("BUTTERFINGERS. Drop what you are holding.");
  expect(e[2].text).toBe("TANGLED / STUCK (SUITS). Lose a round.");
});

test("no header, no table", () => {
  expect(parseDieTable(PAGE, /D20\s+NOPE/)).toEqual([]);
});
