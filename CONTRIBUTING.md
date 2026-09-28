# Contributing

Read this before changing anything.

## Never commit licensed content

Mothership is © Tuesday Knight Games, and no part of it goes into this repo:
no book or module text, tables, stat blocks, NPC rosters, maps, handouts, or
audio. The tool reads PDFs the user owns and caches what it extracts on their
machine. `books`, `data`, PDFs, archives, and audio files are gitignored for
this reason.

The repo is private for now and meant to go public, so treat every commit as
published. Its sister project, dlmnwd, needed a cleanup pass before it could
open, and these are the things that audit found:

- Fixtures that claimed to be invented but were real entries with the names
  changed. Stat lines with the same numbers under a new name still count as
  copied. Invent the numbers too.
- Book sentences and examples quoted in code comments and doc comments.
- Real page numbers and location keys cited next to their descriptions.
- A table copied as a one-per-line list in the book's order. A phrase scan
  can't see that, because the PDF interleaves the columns.

What may appear in the source is structural vocabulary: stat and save names,
field labels such as `Combat` or `Wounds`, and heading styles a parser anchors
on. Names and labels are fine. Content is not.

`bun run audit` compares every repo file against every PDF it can find, in
overlapping 8-word phrases, and the pre-commit hook runs it on staged files.
Keep your books configured (a `books` symlink is easiest) so the hook actually
checks something. It can't catch reordered lists or paraphrases that stay close
to the source, so review fixtures by eye as well.

## Commands

Runtime is [Bun](https://bun.sh) 1.3, TypeScript, ES modules.

```sh
bun install            # also runs `prepare`, which sets core.hooksPath to .githooks
bun test
bun run moshi <command> [args]
bun link               # optional: `moshi` on your PATH

bun run fmt            # oxfmt
bun run lint           # oxlint
bun run check          # CI gate: fmt --check + lint + test
bun run audit          # licensed-content scan (--staged, --n=6 for stricter)
```

The pre-commit hook formats and re-stages, then runs lint and the audit. Either
failure blocks the commit. There is no `tsc` step; `tsconfig.json` is
`noEmit`, and oxlint is the check that runs.

## How it fits together

`src/cli.ts` maps command names to `(args: string[]) => void`. To add a
command, write `src/commands/<name>.ts` exporting `cmd<Name>`, register it, and
add a line to `HELP`.

Each command prints through `emit(args, data, text)` in `src/out.ts`. The data
object is what `--json` prints, so give it every field a script would want, and
keep the text version short enough to read at the table. With `--json`, errors
print as `{"error": "..."}` on stdout and exit 1.

`src/rules.ts` holds the core mechanics as pure functions over rolls that were
already made (`resolveCheck`, `resolvePanic`). The commands do the random
rolling, and tests pass exact rolls. Result tables such as the Panic Table
aren't written into the code. They'll be parsed from the user's Survival
Guide.

`src/pdf/config.ts` is the only place that finds books. It walks the book
folders recursively, recognizes the two core books by filename, and treats
every other PDF as a module with an id derived from its filename
(`moduleRef`). `matchModule` resolves a query to one module.

`src/pdf/extract.ts` shells out to `pdftotext -layout` and caches pages in
`~/.cache/moshi/`. Parsers should take that fixed-width text as input, the way
they do in dlmnwd, so a pdf.js emulation can feed the same parsers in the
browser later. Keep Node-only APIs out of parsers.

`src/state.ts` owns the one machine-local state file. Running a module needs
memory between commands (the active module now; clocks, casualties, and
terminal switches later), and all of it goes there, never into the repo.

## Code conventions

- Keep comments minimal. Write one only when the reason for the code isn't
  obvious, and never quote a book in one.
- `verbatimModuleSyntax` is on, so type-only imports must use `import type`.
- 2-space indent, strict TS, explicit return types on exports.
- Parse flags by hand: positionals via `args.filter(a => !a.startsWith("-"))`,
  options as `--flag=value`. Advantage tokens go through `takeMod` first,
  because `-` is itself a token.
- Anchor repo-relative paths on `import.meta.dir` so `moshi` works from any
  directory.

## Testing

`bun:test`, one `test/<module>.test.ts` per module. The suite needs no PDFs and
no game content.

- Parser tests use invented fixtures written as fixed-width text that looks
  like `pdftotext -layout` output.
- Rules tests feed exact rolls to the pure resolvers. Dice tests loop and
  assert bounds.
- Filenames, module names, NPCs, and locations in tests are invented.

Run `bun run check` before you call anything done, and `bun run audit` with
your books before you push.
