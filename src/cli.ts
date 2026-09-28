#!/usr/bin/env bun
import { cmdBooks } from "./commands/books.ts";
import { cmdCheck } from "./commands/check.ts";
import { cmdPanic } from "./commands/panic.ts";
import { cmdRoll } from "./commands/roll.ts";
import { cmdUse } from "./commands/use.ts";
import { wantsJson } from "./out.ts";

const HELP = `moshi: Mothership Warden tools

Usage: moshi <command> [args] [--json]

Rolling
  roll [expr] [+|-]    Roll dice, e.g. moshi roll 2d10   (default 1d10)
  check <target> [+|-] Stat Check or Save: d100 under target, criticals on doubles
                         --skill=N   add a Skill bonus to the target
  save <target> [+|-]  Same as check
  panic <stress> [+|-] Panic Check: d20 over current Stress

Books & modules (bring your own PDFs; see README)
  books                List the core books and modules found
  use [module]         Set the active module (fuzzy), or show it

  [+] / [-] also accept +, -, --adv, --dis. Both together cancel.
  --json / -j          Structured output for scripts

  help                 This message
`;

const commands: Record<string, (a: string[]) => void> = {
  roll: cmdRoll,
  check: cmdCheck,
  save: cmdCheck,
  panic: cmdPanic,
  books: cmdBooks,
  use: cmdUse,
};

const [cmd, ...args] = process.argv.slice(2);

try {
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    process.exit(0);
  }
  const fn = commands[cmd];
  if (!fn) {
    console.error(`Unknown command: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
  }
  fn(args);
} catch (e) {
  const message = (e as Error).message;
  if (wantsJson(args)) console.log(JSON.stringify({ error: message }));
  else console.error(message);
  process.exit(1);
}
