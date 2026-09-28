# moshi

A fast CLI for running a [Mothership](https://www.mothershiprpg.com/) game at
the table: checks, saves, Panic Checks, and quick lookups from the books you
own. Every command also takes `--json` for scripts and other tools. A web
interface comes later.

```
moshi use ypsilon             # pick a module (fuzzy match)
moshi show                    # its contents: locations, sections, callouts
moshi show 3                  # location 3; `3-1` for item 1 inside it
moshi table characters d10    # roll on a numbered list
moshi check strength --who=Ana +   # Stat Check from a tracked character, at advantage
moshi panic Ana               # Panic Check; prints the Panic Table entry
moshi clock add lights-out 10m --every   # real-time clock
moshi status                  # location, clocks, cast, flags, recent log
```

## Bring your own books

Mothership is © Tuesday Knight Games. This repository ships none of it: no book
text, tables, stat blocks, maps, handouts, or audio. Every test fixture is made
up. Book content is read live from PDFs you own and cached on your machine. See
[`NOTICE.md`](NOTICE.md) for the few game terms the source does contain.

## Setup

You need [Bun](https://bun.sh) (built against 1.3) and `pdftotext` from
[poppler](https://poppler.freedesktop.org/) (`brew install poppler`).

```sh
bun install          # dev deps; also points git at .githooks
bun test
bun run moshi help

bun link             # optional: puts `moshi` on your PATH
```

## Your PDFs

`moshi` scans these folders recursively for PDFs, in order: `$MOSHI_BOOKS`,
`./books`, the repo's own `books/`, then `~/.config/moshi/books`. A symlink works,
so you can point the repo at the folder where your books already live:

```sh
ln -s ~/path/to/Mothership books
```

The Player's Survival Guide and the Warden's Operations Manual are found by
filename ("survival", "operations"). To override either one, set
`MOSHI_SURVIVAL_PDF` or `MOSHI_WARDEN_PDF`. Every other PDF counts as a module.
A module's id comes from its filename, so `Gradient-Descent-v1.3-for-backers.pdf`
becomes `gradient-descent@1.3`. `moshi use gradient-descent` picks the newest
version.

Extracted text is cached in `~/.cache/moshi/`, keyed on each file's size and
mtime. Session state lives in `~/.local/state/moshi/` (or
`$XDG_STATE_HOME/moshi`, or `$MOSHI_STATE_DIR`).

## Rolling

Checks and saves roll d100 read as 00 to 99. You succeed by rolling under the
target, and 90 to 99 always fails. Doubles are criticals: 00 always succeeds and
99 always fails. A critical failure tells you to make a Panic Check. A failed
check tells you to gain 1 Stress, or adds it to a tracked character's sheet
(see below).

For advantage or disadvantage, pass `+`/`-`, `[+]`/`[-]`, or `--adv`/`--dis`.
Both together cancel. Under advantage `moshi` rolls twice and keeps the better
outcome, so a critical success beats a plain one.

`moshi panic <stress>` rolls d20 and passes above your current Stress. On a
failure it prints the matching Panic Table entry, read from your Survival
Guide.

## Quality

```sh
bun run fmt          # oxfmt
bun run lint         # oxlint
bun run check        # fmt --check + lint + test (the CI gate)
bun run audit        # scan the repo for text copied from your books
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before you change anything.

The pre-commit hook formats, lints, and audits the staged files. The audit
breaks every PDF it can find into overlapping 8-word phrases and fails if a
repo file contains one. Without books configured it prints a warning and passes,
so it never blocks a clone that has no PDFs.

## Running a module

`moshi books` lists the core books and the first-party modules it found. A
module counts as first-party when its PDF names Tuesday Knight Games as the
author, carries a TKG copyright line, or has a TKG product code. `moshi books
--all` includes everything else.

`moshi use <module>` sets the active module. `moshi read` prints all of it
section by section, and `moshi show` gives the contents. Landscape pages are
read as trifold panels, so pamphlet modules come out in reading order. Numbered
headers become locations, all-caps headers become sections, and keyed blocks
before a panel's first header (numbered cassettes, say) become callouts.
`moshi search` looks through the module and both core books, and `moshi page`
prints one whole page. `moshi audio` lists audio files in the module's folder
and plays one with `afplay`.

Each module has its own session on this machine: the crew's location, clocks,
a cast of tracked characters, flags, and a log. Clocks run in real time by
default. Use `--game` for game time and advance it with `moshi time +30m`. A
clock made with `--every` restarts when you mark it done, and `moshi clock
pause` holds every real-time clock during a break. `moshi cast add` tracks
anyone with whatever fields you like (stats, saves, stress, health, status).
`check` and `panic` read from those fields with `--who`, and a failed check
adds the Stress for you. Everything that changes the session goes into the log.
`moshi session new` archives the session and starts over.

## Status

Working: `roll`, `check`/`save`, `panic` (with the Panic Table from your
Survival Guide), `books`, `use`, `read`, `show`, `table`, `search`, `page`,
`audio`, and the session commands.

Next up is a player-facing screen for in-fiction computer terminals, then
Another Bug Hunt, to find out which parsers carry over from a pamphlet to a
full booklet.

## License

Code: MIT (see `LICENSE`). Game content is yours and not covered here.
