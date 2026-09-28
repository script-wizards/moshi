#!/usr/bin/env bun
import { cmdAudio } from "./commands/audio.ts";
import { cmdBooks } from "./commands/books.ts";
import { cmdCast } from "./commands/cast.ts";
import { cmdCheck } from "./commands/check.ts";
import { cmdClock } from "./commands/clock.ts";
import { cmdPanic } from "./commands/panic.ts";
import { cmdRoll } from "./commands/roll.ts";
import { cmdPage, cmdSearch } from "./commands/search.ts";
import { cmdAt, cmdFlag, cmdLog, cmdSession, cmdStatus, cmdTime } from "./commands/session.ts";
import { cmdRead, cmdShow } from "./commands/show.ts";
import { cmdTable } from "./commands/table.ts";
import { cmdUse } from "./commands/use.ts";
import { wantsJson } from "./out.ts";

const HELP = `moshi: Mothership Warden tools

Usage: moshi <command> [args] [--json]

Rolling
  roll [expr] [+|-]        Roll dice, e.g. moshi roll 2d10   (default 1d10)
  check <target|stat> [+|-] Stat Check or Save: d100 under target, criticals on doubles
                             --skill=N   add a Skill bonus
                             --who=NAME  use NAME's tracked stat; a failure adds Stress
  save ...                 Same as check
  panic <stress|name> [+|-] Panic Check: d20 over Stress; prints the Panic Table entry

Books & modules (bring your own PDFs; see README)
  books [--all]            Core books and first-party modules (--all for everything)
  use [module]             Set the active module (fuzzy), or show it
  read                     The whole active module, section by section
  show [query]             Contents, or one section: 3, 3-1, "monster", "warden notes"
  table <section> [dN]     Roll on a numbered list in a section
  search <text>            Search the module and core books  (--in=module|survival|warden)
  page <book> <n>          A whole page: survival, warden, or module
  audio [words]            List the module's audio files, or play one

Session (per module, kept on this machine)
  status                   Location, clocks, cast, flags, recent log
  at <location>            Move the crew there and show it
  clock ...                Real-time or game-time clocks  (moshi clock help)
  time [+30m]              Show or advance game time
  cast ...                 Track PCs and NPCs: stats, stress, health  (moshi cast help)
  flag [k=v ...]           Set or show flags  (flag rm k)
  log [text]               Show the session log, or add a note
  session [new]            Show the session, or archive it and start fresh

  [+] / [-] also accept +, -, --adv, --dis. Both together cancel.
  --json / -j              Structured output for scripts

  help                     This message
`;

const commands: Record<string, (a: string[]) => void> = {
  roll: cmdRoll,
  check: cmdCheck,
  save: cmdCheck,
  panic: cmdPanic,
  books: cmdBooks,
  use: cmdUse,
  read: cmdRead,
  show: cmdShow,
  table: cmdTable,
  search: cmdSearch,
  page: cmdPage,
  audio: cmdAudio,
  status: cmdStatus,
  at: cmdAt,
  clock: cmdClock,
  time: cmdTime,
  cast: cmdCast,
  flag: cmdFlag,
  log: cmdLog,
  session: cmdSession,
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
