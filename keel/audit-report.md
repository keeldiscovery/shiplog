# Keel Audit — 2026-08-15

`keel/brief.md` is present, so this audit diffs the shipped build against
the original evidence (round-trip drift check), not just spec quality.
Ran via `.specify/extensions/keel/commands/audit.md` against
`specs/001-shiplog-weekly-digest/spec.md` (the only spec with `keel:`
markers) and the code in `app/app.js` and `app/index.html`. Every marker
below was checked by reading the actual implementation logic, not by
matching filenames or function names against requirement text.

## Spec quality (checked regardless of `keel/`)

- **`[NEEDS CLARIFICATION]` markers**: none remain in `spec.md` (verified via `grep`).
- **Testability**: all 12 functional requirements (FR-001–FR-012) describe an observable, checkable behavior; none are vague enough to fail a yes/no review.
- **Non-goal still honored**: `keel/brief.md`'s "What the evidence ruled out" states the product must never present raw GitHub activity alone as a sufficient finished draft. `spec.md`'s FR-005/FR-006 and the shipped `weaveContext()` function (`app/app.js:396-401`) still honor this — confirmed below under A-003.

## Marker-by-marker round-trip

| Marker | Requirement | Evidence | Code | Verdict |
|---|---|---|---|---|
| A-001 | FR-001, FR-002, FR-004 — enter username, fetch commits/PRs/releases for 7 days, present grouped human-readable draft | E-001 (C1, C2), E-004 (C3) | `fetchEvents()`, `filterToWindow()`, `buildEnrichedItems()`, `groupByRepo()`, `renderDigestText()` in `app/app.js:97-319`; wired to the Generate button in `onGenerateClick()` | **OK** |
| A-002 | FR-007, FR-008, FR-009, FR-012 — mandatory review before copy/export; exactly two output actions; no auto-transmit; operates on current edited text | E-002 (C1), E-004 (C1) | `#draft` is always an editable `<textarea>` (`app/index.html`); only two output handlers exist, `onCopyClick()`/`onExportClick()` (`app/app.js:431-459`), both reading `els.draftArea.value` fresh at click time; `grep` for `fetch(`/`XMLHttpRequest`/`sendBeacon`/`<form`/`.submit(` across `app/app.js` and `app/index.html` finds only the 3 GitHub `GET` calls — no other outbound call exists anywhere | **OK** (stronger than required: as of Phase 8 convergence, T035 also disables Copy/Export while `#draft` is empty, so there is nothing to trivially "copy nothing" past) |
| A-003 | FR-006 — raw activity must never stand alone as the finished product | E-002 (C2), E-003 (C1) — **contradicted**, superseded by A-006 (see below) | `applyGeneratedDraft()`/`onContextInput()` (`app/app.js:403-421`) always route through `weaveContext()`; the context field (`#context`) is always rendered in the main flow, never hidden or gated behind a toggle | **OK** — code reflects the *replacement* belief (A-006), not the original superseded A-003; see Superseded Assumptions section below |
| A-005 | FR-002, FR-003 — public, read-only, unauthenticated GitHub access only; no write scope, no private repos | E-004 (C2) — single source, status `open`, not `supported` | All three `fetch()` calls target `GET https://api.github.com/users/.../events/public`, `GET /repos/.../commits/{sha}`, `GET /repos/.../pulls/{number}`; `grep -i "authorization\|access_token\|oauth"` across `app/app.js` and `app/index.html` returns nothing | **OK** |
| A-006 | FR-005, FR-006 — separate, clearly-labeled, always-visible context field, woven into the draft, not optional/decorative | E-002 (C2), E-003 (C1) | `#context` `<textarea>` in `app/index.html`, labeled "Context / why", positioned in the main flow (not collapsed/hidden); `weaveContext()` prepends it ahead of the activity summary whenever non-empty (`app/app.js:396-401`), wired on every keystroke via `onContextInput()` | **OK** |

**Not marker-tagged, but worth noting**: `A-004` (would founders keep using this weekly) carries no `keel:` marker in `spec.md` by design — `spec.md`'s Assumptions section explicitly documents it as a downstream outcome contingent on A-006 shipping, not a buildable functional requirement itself. That framing is accurate: A-006 did ship (see table above), so the condition brief.md attached to A-004 remaining "supported" (rather than reopened) is currently satisfied by the build. This is a status observation, not a code drift.

## Overridden assumptions

None. `grep -n "override:" keel/decisions.md` returns no matches — no assumption was gated past the brief gate on an accepted, unresolved risk. Nothing to surface here.

## Superseded assumptions

`keel/decisions.md` records exactly one: **`superseded: A-003`**, replaced by `A-006`.

- A-003 ("GitHub activity alone carries enough signal") was contradicted independently by E-002 and E-003 — both described commit-only output as reading like a changelog, not an update. This is a legitimate discovery, not a risk left hanging: the belief was tested and found false, and replaced.
- The replacement, A-006, is recorded as `supported` (not `validated`) in `keel/assumptions.md` — the audit's table above and `spec.md`'s own rationale text both describe it that way; neither oversells it as confirmed.
- Checked whether the shipped code still reflects the original, superseded A-003 instead of A-006: it does not. There is no code path in `app/app.js`/`app/index.html` that presents `renderDigestText()`'s raw output as a finished draft without the context field being part of the same flow — see the A-003/A-006 row above.

## Downgraded-risk mitigation check

`keel/decisions.md` contains no "downgraded from high to medium because of a specific mitigation" pattern for any assumption — the only entries are the evidence-provenance disclosure and the A-003→A-006 supersession. This special severity rule (unimplemented mitigation reinstating the original risk) does not apply to this build; noted as checked, not skipped.

## Findings

**No CRITICAL or HIGH findings.** Every `keel:`-tagged requirement traces to real, working code that does what the marker's evidence demands, and the one deliberate scope decision (A-004 left unmarked) is accurately reasoned in `spec.md`.

### MEDIUM — Copy/Export were reachable with nothing to review (found and fixed during `/speckit-converge`, not a residual finding)

Before Phase 8 of `specs/001-shiplog-weekly-digest/tasks.md`, `#copy-btn`/`#export-btn` were always enabled, so a founder could trigger Copy or Export against an empty `#draft` (e.g., before ever clicking Generate, or after a `not_found`/error result). This didn't violate A-002 in the sense of leaking anything, but it weakened FR-007's "review before action" framing — there was nothing to review. Fixed via `updateActionButtonsState()` (`app/app.js:83-91`, wired at load and on every `#draft`/context change) disabling both buttons whenever `#draft` is empty. Re-verified against the current code — this is closed, listed here for the audit trail rather than as an open item.

### LOW — Scope addition beyond `keel/brief.md`'s literal wording, not evidence-adverse

`keel/brief.md`'s feature description says "merged PRs" specifically; `spec.md`'s FR-002 (and the shipped code) also include **opened** (not-yet-merged) PRs as activity items. This is a minor, disclosed interpretation broadening "public GitHub activity" slightly past the brief's literal phrase — it is not contradicted by any evidence, isn't in tension with any `keel:`-marked requirement, and a founder's opened-but-unmerged PR is genuinely activity worth surfacing in a "what I did this week" draft. Flagged for visibility, not as a defect.

## Traceability chain (brief → spec → plan/tasks → code)

Confirmed by direct `grep`, not assumption:

- `keel/brief.md`'s pasted feature description carries `keel: A-006`, `keel: A-003`, `keel: A-002` inline, and instructs that "every functional requirement should carry its `keel:` marker."
- `specs/001-shiplog-weekly-digest/spec.md` carries 11 `keel: A-00X` marker instances across FR-001–FR-012 and the Assumptions section, covering A-001, A-002, A-003, A-005, A-006 (A-004 intentionally unmarked, see above).
- `specs/001-shiplog-weekly-digest/plan.md` carries the A-002 marker in its Technical Context constraints.
- `specs/001-shiplog-weekly-digest/tasks.md` carries A-002/A-003/A-006 markers on the User Story 2 and User Story 3 phase goals, and T034 names all five markers explicitly as a pre-audit checklist item.
- `app/app.js` carries A-001/A-002/A-003/A-005/A-006 in code comments directly above the logic that implements each (lines 5, 393, 428).

The chain did not break at any hop. This is the one part of the pipeline Spec Kit has no native support for (per `keel/brief.md`'s own Traceability section) — it survived here because it was carried by hand at every step, exactly as that section warned would be necessary.
