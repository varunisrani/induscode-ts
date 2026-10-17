# TUI fixes and verification

## Result and scope

Implemented locally in `/home/varun/indusagi-ts-clean/indusagi-coding-agent`.

The reproduced TUI defects from the prior review have regression coverage and fixes. The final local build succeeds. The final verification loop passed the full suite three consecutive times, then rebuilt and passed the real-PTY matrix.

**This is not a globally type-clean repository:** the final TypeScript check still exits 2 with **138 diagnostics outside `src/console`**. The console itself has **zero diagnostics**. Repo-wide framework/addon/tool typing cleanup remains separate from this TUI implementation.

No commit, push, deployment, paid model run, real login/logout, or credential modification was performed. Existing working-tree edits were preserved.

## Final verified results

| Check | Result |
|---|---|
| Full suite, final loop 1 | 140/140 passed; 46 test files |
| Full suite, final loop 2 | 140/140 passed; 46 test files |
| Full suite, final loop 3 | 140/140 passed; 46 test files |
| New regression coverage versus the original suite | 50 test cases across 23 new test files |
| Build | Successful; regenerated local `dist` bundles |
| Built CLI `node dist/entry.js --help` | Successful |
| Real PTY tests of built public `consoleUi.mountConsole` | 6/6 passed |
| Console TypeScript diagnostics | 0 |
| Project-wide TypeScript diagnostics | 138 outside the console; exit 2 |

The PTY matrix covers busy and idle sessions at **80×24, 40×18, and 120×40**, plus a resize in each case. Busy cases verify that the first Ctrl+C interrupts once without exiting, and deliberate subsequent double Ctrl+C exits cleanly. Idle cases type `ab😀`, remove the emoji with the actual Backspace byte, move left, forward-delete `b`, and verify that the submitted prompt is exactly `a`. Every case verifies restored non-raw stdin at exit.

Models and account services in the UI tests are controlled fixtures. Real Ink rendering, keyboard parsing, POSIX PTYs, and the built console mount are exercised. These are not claims of live-provider or remote-service testing.

## Implemented fixes

| Reviewed issue | Implementation / evidence |
|---|---|
| Ctrl+C exited instead of interrupting | Disabled Ink automatic Ctrl+C exit; app handlers own interruption, including dialogs. Real PTY assertions verify survival after the first interrupt. |
| Transcript budget counted messages rather than rows | Added `ScrollViewport` with measured content height, bounded root dimensions, PgUp/PgDn, bottom following, and anchored manual scrollback. Long transcript and resize regressions pass. |
| Narrow welcome panel collapsed | Banner switches to compact rendering below its usable width; root uses compact chrome in smaller terminals. The editor has explicit cell widths and bounded rows. |
| Queued follow-up erased streamed prefix | Removed input-submission resets of the active answer; lifecycle events own stream resets. Prefix/suffix regression passes. |
| Large-paste history sent orphaned markers | History stores expanded text; paste ordinals remain monotonic across submissions. Recall/resubmit regression passes. |
| Autocomplete selected invisible items | Suggestions window around the selected index instead of always showing the first eight entries. |
| Theme changes did not repaint | Active adapter derives from reducer scheme; initialization reads the persisted scheme. Live settings test verifies adapter changes. |
| Live reasoning was never rendered | Added a live thinking render branch; persisted reasoning/image preferences initialize state. |
| Display settings drifted from UI state | Settings dispatch explicit boolean values, not blind toggles. Editor padding is wired. The unsupported hardware-cursor switch is no longer offered. |
| Emoji deletion / forward Delete | Grapheme-aware movement, deletion and caret display; raw-byte normalization distinguishes terminal Backspace from CSI Delete despite Ink 5 conflating their parsed flags. Both component and PTY regressions pass. |
| Shell output disappeared | Inline shell output is displayed; included output enters current context. Shell execution has bounded captured output and cancellable process-group handling. The real shell regression uses only `printf` and a cancelled `sleep`. |
| Custom-profile models disappeared | Removed ModelBoard's hardcoded auth-file filter. Provider readiness uses the injected vault and environment credentials. `/status` also uses the injected vault. |
| Optional-services modal locked input | Unsupported dialogs render a dismissible fallback. Modal content and agent drill-in are exclusive, preventing shared keyboard ownership. |
| Root absolute-path completion broke | Preserved `/` in completion paths; the directory reader expands `~` appropriately. |
| `/compact` guidance executed shell syntax | Guidance passes as literal text through compaction options to the summarizer; no shell round-trip. |

## Additional fixes found during the loop

- A clean Ink exit could resolve before passive input cleanup restored terminal raw mode. The mount now explicitly restores the prior mode before returning. This was caught by the real PTY loop.
- New-session navigation waits for an aborted in-flight turn before replacing session state; UI streams and display state reset on navigation.
- Compaction cancellation settles the conductor's phase instead of leaving it stuck at `condensing`.
- Model cycling now uses the current model and a direction rather than repeatedly selecting the empty-query default.
- Generic slash failures surface as status errors instead of unhandled rejections.
- Model-selection errors surface rather than silently closing.
- Failed settings saves restore the previous in-memory preference and display an error without crashing the console.
- OAuth overlays abort their flow on close, reject pending code-input prompts, and guard against late routing/model updates. The launcher checks cancellation before credential persistence; the server device-login path propagates cancellation into requests and polling.
- API-key save and logout refresh gateway routing; auth display refreshes when dialog state changes.
- Approval abort listeners are removed when their decisions settle.
- External-editor handoff restores raw mode even on failure; suspend/resume handlers restore cooked/raw modes. These paths have controlled tests, not a complete native-editor/platform matrix.
- Older running agents remain visible ahead of recent completed runs. Agent elapsed-time displays update without requiring new model events.
- Reduced-motion mode uses a stable working label/glyph; the logo gradient is implemented and connected.
- Startup resource counts are displayed; `/release-notes` resolves to the advertised changelog command; misleading static command tips were corrected.
- Removed duplicate per-delta reducer transcript writes that were not used by the renderer.

## Re-run commands

From the project directory:

```sh
# Targeted regression tests
npm run test:tui

# Full-suite loop (default: 3 passes; accepted range: 1–10), then build + PTY + console type check
npm run test:tui:loop -- 3

# PTY matrix only; build first when source changed
npm run build
npm run test:tui:pty

# Full project type check: currently still fails outside src/console
npm run typecheck
```

The loop stops on a failed test, failed build, failed PTY assertion, or console type error. It records global compiler failures separately and explicitly warns that those remain; it does not mislabel the global type-check as passing.

Final evidence from this run:

```text
/tmp/indus-tui-fixes-_d0zjptx/final/verification-summary.json
/tmp/indus-tui-fixes-_d0zjptx/final/loop-1.json
/tmp/indus-tui-fixes-_d0zjptx/final/loop-2.json
/tmp/indus-tui-fixes-_d0zjptx/final/loop-3.json
/tmp/indus-tui-fixes-_d0zjptx/final/pty-results.json
/tmp/indus-tui-fixes-_d0zjptx/final/pty-*.ansi
/tmp/indus-tui-fixes-_d0zjptx/final/typecheck.txt
```

## Limits / residual risk

- The remaining project-wide type diagnostics were not suppressed with new `@ts-nocheck` directives or weaker compiler settings.
- Windows/macOS terminal emulators, real OAuth providers, actual clipboard integration, native editors, and paid/remote model streaming were not end-to-end tested. The real PTY matrix ran on Linux.
- The installed Node runtime is `v26.8.0-alpha.0.0.0`; npm prints a compatibility warning. Test/build commands still completed successfully. A supported stable Node runtime should also be part of release verification.
- This is a local implementation and self-verification handoff, not an independently approved release or proof of absence of all possible TUI defects.
