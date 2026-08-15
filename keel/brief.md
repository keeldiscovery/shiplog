# keel/brief.md — ShipLog

*Gate status at time of writing: `keel-gate.sh brief` → OK (4 evidence
files, 2 distinct participant roles, 0 unvalidated high-risk assumptions,
1 open contradiction — superseded, see below). Evidence is synthetic —
see `keel/decisions.md` before treating this as a validated idea.*

## Evidence-backed problem statement

Solo founders who build in public spend real, recurring weekly time
reconstructing their own shipped work from their commit and PR history in
order to write a progress update by hand (Founder-1, Founder-3 —
E-001/E-004). That reconstruction step is the actual chore, not the
writing itself: both founders described going back through GitHub as the
tedious part, and one named it the single task they procrastinate on most
in their week despite it taking under an hour (E-004). Whatever ships has
to remove *that* step, not just generate prose.

## What the evidence ruled out

**Do not build this: a draft based on raw GitHub activity alone,
presented as sufficient without founder input.** The original assumption
that GitHub activity alone carries enough signal for a useful draft
(A-003) was contradicted independently by a founder and a reader of these
updates (E-002, E-003): commit-only output was described, in both cases,
as reading like a changelog rather than an update — accurate but hollow,
missing the *why* behind a decision. This was superseded, not just
downgraded, by A-006 (see `keel/decisions.md`): a founder-editable context
field is a required part of the mechanism, not a nice-to-have.

## What to build

- A weekly digest generated from a founder's public GitHub activity
  (commits, merged PRs, releases), scoped to public repos and requiring no
  auth token (`keel: A-001, A-005`).
- A short, founder-editable free-text field alongside the generated
  digest, for the "why," before anything is finalized — this is not
  optional polish, it's what E-002/E-003 established the raw digest is
  missing (`keel: A-006`).
- A **mandatory** review-and-edit step before the draft can be copied or
  exported anywhere. No auto-post, no auto-send, in this version or any
  future one this evidence would justify — three independent founders
  were unanimous and unconditional on this point (`keel: A-002`, E-002,
  E-004, and consistent with E-001's framing).

## Residual risk carried into build

- The evidence base is small — four interviews, three founders and one
  reader. A-001 and A-002 cleared the gate on genuine independent
  agreement, but three people is a floor, not a ceiling; do not treat
  "supported" here as "validated."
- A-001's magnitude varies across sources (30–40 minutes vs. "under an
  hour") — real, but don't over-specify a time-savings claim in
  marketing copy the evidence doesn't tightly support.
- A-004 (would founders keep using this weekly) is supported, but
  conditionally: the reader evidence (E-003) ties continued engagement to
  the update *reading* as narrative, not to drafting speed alone — which
  is exactly why A-006's context field is load-bearing, not decorative.
  If that field gets cut for scope in a later iteration, A-004 should be
  treated as reopened, not still resolved.
- A-005 (comfort with public, read-only GitHub access) rests on a single
  source (E-004) and was left `open`, not `supported`, on purpose — it's
  low risk, so it didn't block the gate, but it hasn't actually been
  independently corroborated. Scope strictly to public, read-only access;
  don't extend to private repos or write access without new evidence.

## Traceability

Every functional requirement in `specs/*/spec.md` should carry a
`keel: A-00X` marker back to the assumption/evidence behind it.
`/speckit.specify` has no native field for this — it has to be requested
inline in the feature description below, and carried through
`/speckit.plan` and `/speckit.tasks` by whoever is driving, or the markers
silently stop propagating and `keel.audit` will have nothing to check
against.

---

**Feature description to paste into `/speckit-specify`:**

> ShipLog: a single-page web app where a solo founder enters their public
> GitHub username and gets a draft weekly "build in public" update,
> generated from their public commits, merged PRs, and releases over the
> last 7 days, fetched live from GitHub's public REST API with no auth
> token. The generated draft appears in an editable text area alongside a
> short founder-editable "context/why" field (`keel: A-006`) that gets
> woven into the final draft — raw activity alone reads as a changelog,
> not an update (`keel: A-003` — ruled out, see brief). Nothing is ever
> posted or sent automatically; the only actions available are copying the
> final, founder-edited text and exporting it as Markdown (`keel: A-002` —
> mandatory review step, non-negotiable per evidence). Handle the case
> where a username has no public activity in the window gracefully rather
> than erroring. Every functional requirement should carry its `keel:`
> marker per `keel/brief.md`.
