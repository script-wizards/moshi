# moshi

A fast CLI for running a [Mothership](https://www.mothershiprpg.com/) game at
the table: checks, saves, Panic Checks, and quick lookups from the books you
own. Every command also takes `--json` for scripts and other tools. A web
interface comes later.

```
moshi check 35 + --skill=10   # Stat Check or Save at advantage, with a Skill bonus
moshi panic 4                 # Panic Check against 4 Stress
moshi roll 2d10               # plain dice
moshi books                   # core books and modules found on this machine
moshi use ypsilon             # set the active module (fuzzy match)
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
mtime. Session state, such as the active module, lives in
`~/.local/state/moshi/` (or `$XDG_STATE_HOME/moshi`, or `$MOSHI_STATE`).

## Rolling

Checks and saves roll d100 read as 00 to 99. You succeed by rolling under the
target, and 90 to 99 always fails. Doubles are criticals: 00 always succeeds and
99 always fails. A critical failure tells you to make a Panic Check. A failed
check tells you to gain 1 Stress; `moshi` doesn't track Stress yet.

For advantage or disadvantage, pass `+`/`-`, `[+]`/`[-]`, or `--adv`/`--dis`.
Both together cancel. Under advantage `moshi` rolls twice and keeps the better
outcome, so a critical success beats a plain one.

`moshi panic <stress>` rolls d20. It passes above your current Stress, and on a
failure it tells you which Panic Table entry to read. The table itself will come
from your Survival Guide.

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

## Status

Working: `roll`, `check`/`save`, `panic`, `books`, `use`.

Next is The Haunting of Ypsilon 14: location lookups, the cassettes (transcripts
from the PDF, audio from your copy of the files), the module's real-time clocks,
and a player-facing version of its computer terminal. Another Bug Hunt comes
after that, to find out which parsers carry over to other modules.

## License

Code: MIT (see `LICENSE`). Game content is yours and not covered here.
