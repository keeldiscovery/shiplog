---
description: "Task list template for feature implementation"
---

# Tasks: ShipLog Weekly Digest

**Input**: Design documents from `/specs/001-shiplog-weekly-digest/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/github-public-api.md, quickstart.md

**Tests**: Not requested in the feature specification. This is a small
static client app; validation is via the manual scenarios in
`quickstart.md` (also encoded as Polish-phase tasks below), not an
automated test suite.

**Organization**: Tasks are grouped by user story (from spec.md) to
enable independent implementation and testing of each story. Because
this is a single-page static app with no backend, "model/service/
endpoint" from the generic template collapses into functions within
`app/app.js`, called out by function name and file path per task.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/functions, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions

Flat static site per plan.md Structure Decision — no `src/`/`tests/`
split:

```text
app/
├── index.html
├── style.css
└── app.js
```

---

## Phase 1: Setup

**Purpose**: Project scaffolding — no dependencies, no build tooling.

- [X] T001 Create `app/` directory with empty `index.html`, `style.css`, `app.js`
- [X] T002 [P] In `app/index.html`, add the base HTML skeleton (doctype, head with title "ShipLog", link to `style.css`, script tag for `app.js` with `defer`)
- [X] T003 [P] In `app/style.css`, set up CSS custom properties for light theme and a `prefers-color-scheme: dark` block per constitution readability goals

**Checkpoint**: Opening `app/index.html` in a browser shows a blank styled page with no console errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared fetch/parsing/state infrastructure that every user story's UI work depends on. Grounded in the live-verified API shapes in `research.md` and `contracts/github-public-api.md` — get this wrong and every story built on top silently breaks.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete.

- [X] T004 In `app/app.js`, implement `fetchEvents(username)` calling `GET https://api.github.com/users/{username}/events/public?per_page=100`, paging up to 3 pages while the last event on the page is within 7 days, per `research.md` pagination decision; return `{ ok: true, events }` or `{ ok: false, kind: 'not_found' | 'rate_limited' | 'network' }` — never throw past this function
- [X] T005 [P] In `app/app.js`, implement `filterToWindow(events, days=7)` that filters a raw events array to `created_at >= now - days` (data-model.md `RawEvent`)
- [X] T006 [P] In `app/app.js`, implement `classifyEvent(event)` that maps a raw event to `{type: 'commit'|'pr_opened'|'pr_merged'|'release'|null, ...}` per the type/action rules in `contracts/github-public-api.md` (PushEvent → commit; PullRequestEvent action `opened` → pr_opened, action `closed` → pr_merged only after enrichment confirms `merged === true`; ReleaseEvent action `published` → release; everything else → `null` and excluded)
- [X] T007 In `app/app.js`, implement `enrichPushEvent(event)` calling `GET /repos/{owner}/{repo}/commits/{head}` (parsed from `event.repo.name` and `event.payload.head`) to get `commit.message` (first line) and `html_url`; on any failure, return the un-enriched fallback `{ text: "Pushed to {branch}", url: null }` per `research.md` — must never throw
- [X] T008 In `app/app.js`, implement `enrichPullRequestEvent(event)` calling `GET /repos/{owner}/{repo}/pulls/{number}` to get real `title`, `html_url`, `merged`; on failure return fallback `{ text: "PR #{number} {action}", url: null, merged: null }` — must never throw
- [X] T009 In `app/app.js`, implement `buildEnrichedItems(events)` that classifies, then enriches PushEvent/PullRequestEvent items up to the 40-call cap from `research.md` (ReleaseEvent items need no enrichment call — read `tag_name`/`name`/`html_url` directly), producing `EnrichedActivityItem[]` per `data-model.md`
- [X] T010 [P] In `app/app.js`, implement `groupByRepo(items)` producing repo-sorted `RepoGroup[]` (most recent activity first)
- [X] T011 [P] In `app/app.js`, implement `renderDigestText(repoGroups)` that turns grouped items into the initial human-readable Markdown-ish draft text (headings per repo, bullet per item, using each item's `text` and `url`)
- [X] T012 In `app/app.js`, wire a top-level `DigestRequest` state object (`username`, `status: idle|loading|ready|empty|error`, `errorMessage`) and a `generateDigest(username)` orchestrator that calls T004→T011 in order and updates state — this is the single entry point the UI (US1) calls

**Checkpoint**: `generateDigest('sindresorhus')` run from the browser console logs a populated, grouped, enriched digest string with real commit messages and PR titles (not just IDs).

---

## Phase 3: User Story 1 - Generate a draft from GitHub activity (Priority: P1) 🎯 MVP

**Goal**: Founder enters a username, clicks Generate, sees a repo-grouped draft of their last 7 days of public activity in an editable textarea.

**Independent Test**: Enter `sindresorhus` (or another real, active public username), click Generate, verify a non-empty, grouped, readable draft with real commit/PR/release text appears in an editable `<textarea>` within a few seconds.

### Implementation for User Story 1

- [X] T013 [US1] In `app/index.html`, add the username `<input>`, "Generate" `<button>`, a status/error message region, and the draft `<textarea id="draft">`
- [X] T014 [US1] In `app/app.js`, wire the Generate button's click handler to call `generateDigest()` (Phase 2 T012), show a loading state on the status region while in flight, and disable the button until it resolves
- [X] T015 [US1] In `app/app.js`, on successful generation, set `#draft` textarea's value to the rendered digest text (T011) and update the status region to a success/ready state
- [X] T016 [US1] In `app/app.js`, on `not_found` result, show "We couldn't find a public GitHub user called '{username}'." in the status region and leave `#draft` empty (no crash)
- [X] T017 [US1] In `app/app.js`, on `rate_limited`/`network` result, show "GitHub's API isn't responding right now (it may be rate-limited) — try again in a few minutes." in the status region
- [X] T018 [US1] In `app/app.js`, add empty-username client-side validation before any fetch is triggered (per Edge Cases in spec.md) — no network call fires for a blank/whitespace-only username
- [X] T019 [P] [US1] In `app/style.css`, style the input row, button, status region, and `#draft` textarea for readable typography and both light/dark themes

**Checkpoint**: User Story 1 fully functional and independently testable/demoable — this alone is a working MVP end (minus context weaving, which US2 adds on top of the same draft text).

---

## Phase 4: User Story 2 - Add context so the draft reads as an update, not a changelog (Priority: P1)

**Goal**: A separate, clearly-labeled context/why field whose text gets woven into the draft, satisfying Constitution Principle II / `keel: A-006`/`A-003`.

**Independent Test**: After a draft is generated (US1), type a sentence into the context/why field and verify the `#draft` textarea's content visibly changes to incorporate it, not just display it in a separate unintegrated panel.

### Implementation for User Story 2

- [X] T020 [US2] In `app/index.html`, add a clearly-labeled context/why `<textarea id="context">` field, always visible (not hidden/collapsed), positioned alongside the draft area
- [X] T021 [US2] In `app/app.js`, implement `weaveContext(digestText, contextText)` that produces the combined draft text — context is prepended as a short narrative lead-in ahead of the grouped activity, not just appended as an afterthought, per Constitution Principle II
- [X] T022 [US2] In `app/app.js`, wire an input listener on `#context` that re-runs `weaveContext` against the last-generated digest text (not the founder's already-hand-edited draft, to avoid clobbering edits) and updates `#draft` — debounce lightly so it doesn't fight the founder's typing; if the founder has already hand-edited `#draft` since generation, weaving on further context edits must not silently overwrite those edits (append a small always-visible instruction instead, e.g. "Add context above, then edit the draft below directly")
- [X] T023 [P] [US2] In `app/style.css`, style `#context` distinctly from `#draft` (clear label, visually secondary but not hidden) for both themes

**Checkpoint**: User Stories 1 AND 2 both work — draft reflects both fetched activity and founder context.

---

## Phase 5: User Story 3 - Review, then copy or export — nothing sent automatically (Priority: P1)

**Goal**: Exactly two output actions on the founder-edited draft text — Copy to clipboard, Export as Markdown — and no code path transmits it anywhere else. Directly implements Constitution Principle I / `keel: A-002`.

**Independent Test**: Edit `#draft` directly, click Copy — verify (via paste) the exact edited text was copied. Click Export — verify a `.md` file downloads containing the exact edited text. Confirm via browser devtools Network tab that neither action fires any network request.

### Implementation for User Story 3

- [X] T024 [US3] In `app/index.html`, add "Copy to clipboard" and "Export as Markdown" `<button>`s below `#draft`, plus a small inline confirmation region
- [X] T025 [US3] In `app/app.js`, implement the Copy handler: read `#draft`'s **current** `.value` at click time, call `navigator.clipboard.writeText(...)`, show a transient "Copied" confirmation; handle the Clipboard API being unavailable with a visible fallback message (select-all text) rather than failing silently
- [X] T026 [US3] In `app/app.js`, implement the Export handler: read `#draft`'s **current** `.value` at click time, construct a `Blob` (`text/markdown`), trigger a client-side download named `shiplog-update-{YYYY-MM-DD}.md` via a temporary `<a download>` + `URL.createObjectURL` — no network call
- [X] T027 [US3] Code-review pass over `app/app.js`: confirm no `fetch`/`XMLHttpRequest`/`<form action>`/`navigator.sendBeacon`/WebSocket call exists anywhere that sends `#draft` or `#context` content anywhere — the only outbound network calls in the whole file must be the GitHub `GET` calls from Phase 2

**Checkpoint**: All three P1 stories work together — this is the full non-negotiable core of the product per the constitution.

---

## Phase 6: User Story 4 - Zero activity in the window (Priority: P2)

**Goal**: A valid username with no public activity in 7 days gets a clear, friendly message and can still produce a context-only draft — not an error or blank screen.

**Independent Test**: Enter `octocat` (verified live to currently have zero public events), click Generate, confirm the friendly empty-state message appears and that context-only generate/edit/copy/export still works from that state.

### Implementation for User Story 4

- [X] T028 [US4] In `app/app.js`, in `generateDigest()` (T012), when `buildEnrichedItems` returns an empty array, set state to `empty` (not `error`) and set `#draft` to a minimal template (or empty) rather than leaving stale content
- [X] T029 [US4] In `app/index.html` / `app/app.js`, show "No public activity found for '{username}' in the last 7 days — you can still write an update using just the context field below." in the status region for the `empty` state
- [X] T030 [US4] Verify (manually, per quickstart.md) that from the `empty` state, typing into `#context` (US2) and then Copy/Export (US3) still work end-to-end with no special-casing needed in those handlers

**Checkpoint**: All four user stories work independently and together.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all stories.

- [X] T031 [P] In `app/style.css`, final pass on responsive layout (no horizontal scroll on a narrow window), spacing, and dark/light contrast
- [X] T032 In `app/app.js`, add a top-of-file comment documenting the enrichment rate-limit cap and pagination cutoff decisions from `research.md` so future edits don't regress them
- [X] T033 Run every scenario in `specs/001-shiplog-weekly-digest/quickstart.md` end-to-end against the running app (`python3 -m http.server` from `app/`) and fix any mismatch between real GitHub API behavior and the app's parsing/UI
- [X] T034 Final `keel:` marker audit — confirm `app/app.js`/`app/index.html` behavior still matches every FR-0XX in `spec.md` that carries a `keel:` marker (A-001, A-002, A-003, A-005, A-006), ahead of running `keel-gate.sh audit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (US1's Generate button has nothing to call without it).
- **User Story 1 (Phase 3)**: Depends on Foundational only. This is the MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (needs `#draft` and a generated digest to weave context into).
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 (needs `#draft` to exist with content to copy/export); independent of US2's weaving logic itself, but weaving should be done before copy/export are considered "final" per Constitution Principle II.
- **User Story 4 (Phase 6)**: Depends on Foundational + US1 (extends the same `generateDigest` state machine with an `empty` branch); independently testable once US1 exists.
- **Polish (Phase 7)**: Depends on all four user stories being complete.

### Parallel Opportunities

- T002/T003 in parallel (different files).
- T005/T006 in parallel (independent pure functions in the same file — different named functions with no shared mutable state, safe for parallel authorship even if not parallel file edits).
- T010/T011 in parallel.
- T019, T023, T031 (CSS-only tasks) can be done in parallel with the JS tasks in their respective phases.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (blocks everything)
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: Generate a real digest for a real username; confirm grouped, enriched output.

### Incremental Delivery

1. Setup + Foundational → nothing user-visible yet, but `generateDigest()` works from the console.
2. + US1 → MVP: generate and read a draft.
3. + US2 → draft is no longer "just a changelog" (constitution-critical).
4. + US3 → draft can actually leave the app safely (constitution-critical).
5. + US4 → the zero-activity edge case doesn't break trust in a slow week.
6. + Polish → verified against real GitHub responses end-to-end.

Given three of the four stories are P1 and constitutionally non-negotiable
(US1 baseline, US2 per Principle II, US3 per Principle I), this feature is
not meaningfully shippable after US1 alone despite it being technically an
"MVP" in the template's sense — treat Phases 3–5 as a single required
increment, with US4 (Phase 6) as the one true P2 that could slip.

---

## Implementation Notes (post-hoc, from actual /speckit-implement run)

All 34 tasks completed. Two documented, intentional deviations from the
task text:

- **T022**: no debounce was added on the `#context` input listener.
  `weaveContext` is a pure, synchronous string operation (no I/O), so
  there is no performance reason to debounce it, and doing so would only
  add latency to what the founder sees while typing. Verified this
  doesn't fight typing because it only ever writes to the separate
  `#draft` field, never back into `#context` itself.
- **T033**: this environment has no connected browser-automation tool
  (Claude in Chrome was not available), so "run every scenario in
  quickstart.md end-to-end" was done via (a) `curl` against the running
  `python3 -m http.server` to confirm `index.html`/`style.css`/`app.js`
  actually serve, and (b) executing the exact same functions from
  `app.js` (fetchEvents, filterToWindow, classifyEvent, enrichPushEvent,
  enrichPullRequestEvent, buildEnrichedItems, groupByRepo,
  renderDigestText, weaveContext) in Node against the **live** GitHub
  API — not mocked — covering `sindresorhus` (all 3 event types),
  `octocat` (zero activity), `torvalds` (high-volume push-only, forces
  pagination), and a nonexistent username (404). All returned correct,
  real, readable output. What was **not** independently verified is the
  literal browser click path (button click → DOM update) and the
  Clipboard/Blob-download APIs, since those require a real browser; the
  handlers for those were code-reviewed instead (see T027) but not
  executed. This is disclosed as a real gap, not papered over.

---

## Phase 8: Convergence

**Convergence Findings** (from `/speckit-converge` assessment against spec.md, plan.md, constitution.md):

| ID | Gap Type | Severity | Source | Evidence | Remaining Work |
|----|----------|----------|--------|----------|----------------|
| F1 | partial | MEDIUM | FR-007 | `app/index.html`/`app/app.js`: `#copy-btn` and `#export-btn` are always enabled, even when `#draft` is empty (initial load, or after a `not_found`/`error` state) — clicking either then copies/downloads an empty string with no indication there was nothing to review | Disable Copy/Export while `#draft` is empty (trimmed), re-enable on any `#draft` input, so the two output actions always operate on something the founder actually reviewed |

**Summary metrics**: 12 functional requirements checked, 5 success criteria checked (buildable subset), 4 user stories / 11 acceptance scenarios checked, 3 constitution principles checked. Findings: 1 (partial, MEDIUM). No CRITICAL/HIGH findings, no constitution violations, no `contradicts` or `unrequested` findings.

- [X] T035 Disable `#copy-btn` and `#export-btn` in `app/index.html`/`app/app.js` whenever `#draft`'s trimmed value is empty, and re-enable them on `#draft` input, so both output actions always require actual reviewed content per FR-007 (partial)

**Outcome**: `tasks_appended` → 1 task appended under Phase 8. Implemented immediately in the same pass (see `app/app.js`/`app/index.html`); a follow-up `/speckit-converge` run against the current code should find zero remaining items.
