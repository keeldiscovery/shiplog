<!--
Sync Impact Report
- Version change: (none) → 1.0.0 (initial ratification)
- Modified principles: n/a (first adoption)
- Added sections: Core Principles (I–III), Scope Constraints, Quality Gates, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md — ⚠ pending manual check for a
    Constitution Check gate referencing these 3 principles (not modified by
    this command per its Scope Guard)
  - .specify/templates/spec-template.md — ⚠ pending manual check that
    functional requirements can carry `keel: A-00X` traceability markers
  - .specify/templates/tasks-template.md — ⚠ pending manual check
- Follow-up TODOs: none — all placeholders resolved, no deferred fields.
-->

# ShipLog Constitution

## Core Principles

### I. No Unreviewed Output Ever Leaves The App
There MUST be no code path — now or in any future feature — that posts,
emails, or otherwise transmits generated text without a human explicitly
confirming it first. Every action that moves the drafted update out of the
app (copy, export, or any future integration) MUST require a direct,
in-the-moment user action on the final, human-reviewed text. Silent,
scheduled, or automatic transmission is prohibited outright, not merely
discouraged.
Rationale: three independent founders (E-001, E-002, E-004) were
unconditional that they would not let a summary with their name on it go
out unread. `keel: A-002`.

### II. Raw Activity Data Is Never Presented As A Finished Product
The UI MUST always pair generated activity data (commits, PRs, releases)
with the founder's own added context before referring to the result as a
"draft" or "update." A context/notes field MUST be a required, visible part
of the generation flow, not an optional or hidden extra.
Rationale: E-002 and E-003 independently described commit-only summaries as
reading like a changelog, not an update — accurate but hollow, missing the
"why" behind a decision. `keel: A-003 (ruled out), A-006`.

### III. Public, Read-Only, Unauthenticated GitHub Access Only
All GitHub API access MUST be limited to public, unauthenticated, read-only
REST endpoints (e.g. public events, public repos). The application MUST
NOT implement OAuth flows, request write scopes, or access private
repositories, and MUST NOT add such capability without new evidence
justifying the expanded trust boundary.
Rationale: the one piece of evidence on this (E-004) distinguished comfort
with read-only public-repo integrations from discomfort with write access
or private repos; that comfort has not been established for anything
broader. `keel: A-005`.

## Scope Constraints

ShipLog MUST remain a single-page, static HTML/CSS/JS web application: no
backend server, no build step or bundler, no framework dependency, and no
GitHub auth token of any kind. All GitHub data MUST be fetched directly
from the browser via `fetch()` against GitHub's public REST API. This
constraint is load-bearing, not a style preference: it is what keeps the
tool something a solo founder can realistically run, demo, and trust
without standing up infrastructure, and it is the only form the evidence
(E-001–E-004) was gathered against. Expanding beyond a static, client-only
app requires new evidence, not just convenience.

## Quality Gates

Every functional requirement written into `specs/*/spec.md` MUST carry a
`keel: A-00X` traceability marker back to the assumption/evidence it is
grounded in, per `keel/brief.md`'s Traceability section. These markers MUST
be preserved through `/speckit-plan` and `/speckit-tasks`, since
`keel.audit` has nothing to check against otherwise. `.specify/extensions/
keel/scripts/bash/keel-gate.sh` MUST be run (and its output noted) before
`/speckit-plan` and before `/speckit-implement`, and `keel-gate.sh audit`
MUST be run after implementation to diff what was built against the
original evidence.

## Governance

This constitution supersedes conflicting ad-hoc practices for this
project. Amendments require: (1) a documented rationale tying the change
to either new evidence or a clarified constraint, (2) an update to the
Sync Impact Report at the top of this file, and (3) a version bump per the
policy below. Pull requests and reviews MUST verify compliance with the
three Core Principles above before merge; any complexity that appears to
violate the Scope Constraints section MUST be justified in writing or
removed. Compliance is additionally checked mechanically via
`keel-gate.sh audit` after implementation.

Versioning policy (semantic versioning applied to this document):
- MAJOR: backward-incompatible removal or redefinition of a Core Principle.
- MINOR: a new principle or materially expanded governance section is added.
- PATCH: wording clarifications and non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-15
