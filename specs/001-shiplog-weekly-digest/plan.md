# Implementation Plan: ShipLog Weekly Digest

**Branch**: `001-shiplog-weekly-digest` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-shiplog-weekly-digest/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

ShipLog is a single static HTML/CSS/JS page. A founder enters a public
GitHub username and clicks Generate; the page calls GitHub's public REST
API directly from the browser (`GET /users/{username}/events/public`,
plus `GET /users/{username}/repos` for repository context) with no auth
token, filters events to the last 7 days, and renders a repo-grouped draft
into an editable `<textarea>`. A second, separate `<textarea>` captures
the founder's "context / why" notes; a "Weave in context" step merges
both into the final editable draft. Exactly two output actions exist —
Copy to clipboard and Export as Markdown — and no other code path
transmits the draft anywhere. Zero-activity and error states render a
plain in-page message rather than breaking. There is no backend, no build
step, and no bundler: the app runs by opening `index.html` or serving the
folder with any static file server.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES2020+, browser-native), HTML5, CSS3 — no transpilation.

**Primary Dependencies**: None (no framework, no npm package, no CDN script). Uses only browser-native `fetch`, `navigator.clipboard`, and `Blob`/`URL.createObjectURL` for export.

**Storage**: N/A — stateless, in-memory only for the life of the page load. No persistence, no localStorage requirement.

**Testing**: Manual/browser-based verification via `quickstart.md` (curl against the real GitHub API to confirm response shapes, then interactive browser testing). No automated test framework is introduced, consistent with the app's deliberate minimalism; this is a documented, accepted simplification (see Complexity Tracking — N/A, no violation).

**Target Platform**: Any modern evergreen browser (desktop-first; the layout should not break on narrower viewports, but mobile optimization is not a goal).

**Project Type**: Single static web page (no frontend/backend split — there is no backend).

**Performance Goals**: Draft appears within a few seconds of clicking Generate for a typical active user (bounded by GitHub API latency, not app logic); no specific numeric SLA required for a solo-user, on-demand tool.

**Constraints**: Must run with zero build step (open `index.html` directly or serve statically); must make zero authenticated requests; must make zero requests that transmit the draft text anywhere (Principle I, `keel: A-002`).

**Scale/Scope**: Single user per page load, single GitHub account looked up at a time. No concurrency concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. No Unreviewed Output Ever Leaves The App | Only two output actions (Copy, Export-as-Markdown), both operating on the founder-edited `<textarea>` value at the moment of the click; no `fetch`/`XHR`/`<form>` submission exists anywhere in the app that sends the draft text out. | PASS |
| II. Raw Activity Data Is Never Presented As A Finished Product | The context/why field is a required, always-visible part of the layout (not hidden/collapsed), and the "draft" is explicitly the merged text, not the raw activity list alone. | PASS |
| III. Public, Read-Only, Unauthenticated GitHub Access Only | Only `GET /users/{username}/events/public` and `GET /users/{username}/repos` are called; no OAuth, no token input field, no write-scope endpoint anywhere in the design. | PASS |
| Scope Constraints (static, no backend, no build step) | Plain `index.html` + `style.css` + `app.js`, no bundler config, no `package.json` required to run. | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-shiplog-weekly-digest/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — GitHub API contract this app depends on
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

This feature does not fit the standard single-project (src/lib/cli) or
frontend+backend template options — there is no backend, no CLI, and no
library boundary. The structure below is a flat static site, which is the
concrete, minimal shape the Scope Constraints section of the constitution
requires.

```text
app/
├── index.html            # Single page: username input, Generate button,
│                          # draft textarea, context/why textarea, Copy +
│                          # Export buttons, status/error region
├── style.css              # All styling, incl. light/dark via prefers-color-scheme
└── app.js                  # Fetch + filter + summarize + weave + copy/export logic
```

**Structure Decision**: Flat `app/` directory of three static files, served
by any static file server (e.g. `python3 -m http.server`) or opened
directly in a browser. No `src/`, `tests/`, `backend/`, or `frontend/`
split — a nested structure would misrepresent a project with no backend
and no build pipeline, and would violate the constitution's Scope
Constraints section without justification.

## Complexity Tracking

*No entries — Constitution Check reported no violations.*
