# Feature Specification: ShipLog Weekly Digest

**Feature Branch**: `001-shiplog-weekly-digest`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "ShipLog: a single-page web app where a solo founder enters their public GitHub username and gets a draft weekly "build in public" update, generated from their public commits, merged PRs, and releases over the last 7 days, fetched live from GitHub's public REST API with no auth token. The generated draft appears in an editable text area alongside a short founder-editable "context/why" field (keel: A-006) that gets woven into the final draft — raw activity alone reads as a changelog, not an update (keel: A-003 — ruled out, see brief). Nothing is ever posted or sent automatically; the only actions available are copying the final, founder-edited text and exporting it as Markdown (keel: A-002 — mandatory review step, non-negotiable per evidence). Handle the case where a username has no public activity in the window gracefully rather than erroring. Every functional requirement should carry its keel: marker per keel/brief.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a draft from GitHub activity (Priority: P1)

A solo founder who has been shipping all week enters their public GitHub
username and asks for a digest. The app fetches their last 7 days of
public activity (commits, merged PRs, releases) and produces a
first-draft summary grouped by repository, without the founder having to
manually scroll back through GitHub.

**Why this priority**: This is the core chore the tool exists to remove —
the reconstruction step founders described as the actual tedious part of
writing a weekly update. Without this, there is no product.

**Independent Test**: Enter a real public GitHub username with recent
activity and click Generate; verify a draft appears summarizing that
activity grouped by repository, with no manual data entry from GitHub
required.

**Acceptance Scenarios**:

1. **Given** a valid public GitHub username with commits, merged PRs, and
   a release in the last 7 days, **When** the founder clicks Generate,
   **Then** a draft appears listing that activity grouped by repository.
2. **Given** a valid public GitHub username with only commits (no PRs or
   releases) in the last 7 days, **When** the founder clicks Generate,
   **Then** a draft appears summarizing only the commit activity found.
3. **Given** a username that does not exist on GitHub, **When** the
   founder clicks Generate, **Then** the app shows a clear error message
   rather than a blank or broken state.

---

### User Story 2 - Add context so the draft reads as an update, not a changelog (Priority: P1)

Before finishing, the founder adds a short note explaining *why* the
week's work mattered — a decision made, a pivot, a customer conversation
— and that context becomes part of the draft text itself, not a
disconnected sidebar the reader has to reconcile with the activity list.

**Why this priority**: Evidence independently established that
activity-only summaries read as a changelog, not an update, and are
missing the reason readers stay engaged. This is not optional polish —
without it the tool produces exactly the output the evidence said not to
build.

**Independent Test**: After a draft is generated, type a sentence into
the context/why field and verify the final draft text (in the editable
area) visibly incorporates that sentence, not just displays it
side-by-side unintegrated.

**Acceptance Scenarios**:

1. **Given** a generated draft is showing, **When** the founder types a
   note into the context/why field, **Then** the draft text updates to
   weave that note into the narrative.
2. **Given** the founder has not yet typed anything into the context/why
   field, **When** the draft is generated, **Then** the app still visibly
   presents the context/why field as part of the draft-creation flow
   (not hidden, not implied to be optional/skippable window dressing).

---

### User Story 3 - Review, then copy or export — nothing sent automatically (Priority: P1)

Once the founder is satisfied with the edited draft, they either copy it
to their clipboard to paste elsewhere, or export it as a Markdown file to
keep or upload themselves. At no point does the app transmit the text on
its own.

**Why this priority**: Three independent founders were unconditional that
they would not let a summary with their name on it go out unread or
unreviewed. This is a non-negotiable trust boundary, not a convenience
feature — a version of this tool without it would violate the evidence
this project is built on.

**Independent Test**: Edit the generated draft text directly in the text
area, then trigger Copy and separately trigger Export; verify the exact
edited text (not the original unedited draft) is what gets copied/
exported, and verify no network request other than the founder-triggered
export/copy occurs.

**Acceptance Scenarios**:

1. **Given** a founder has edited the draft text, **When** they click
   "Copy to clipboard," **Then** the current (edited) text is copied,
   confirmed with visible feedback.
2. **Given** a founder has edited the draft text, **When** they click
   "Export as Markdown," **Then** a `.md` file containing the current
   (edited) text is downloaded to their device.
3. **Given** any state of the app, **When** the founder has not clicked
   Copy or Export, **Then** no draft text is ever sent to any server,
   endpoint, or third party by the app itself.

---

### User Story 4 - Zero activity in the window (Priority: P2)

A founder enters a valid username that happens to have no public commits,
PRs, or releases in the last 7 days (e.g., a slow week, or a mostly-private
workflow).

**Why this priority**: This is a real, expected edge of normal usage (not
a rare failure) and a broken or blank result here would undermine trust
in the tool during exactly the kind of week a founder might most want
reassurance the tool still works.

**Independent Test**: Use a valid public GitHub username known to have no
public activity in the last 7 days and click Generate; verify a plain,
clear message is shown instead of an error or an empty white screen.

**Acceptance Scenarios**:

1. **Given** a valid public GitHub username with zero public events in
   the last 7 days, **When** the founder clicks Generate, **Then** the
   app shows a clear, friendly message stating no public activity was
   found in that window, without a crash or blank screen.
2. **Given** the zero-activity message is showing, **When** the founder
   adds context/why notes anyway, **Then** they can still generate,
   edit, copy, and export a draft based solely on their own notes.

---

### Edge Cases

- What happens when the entered GitHub username contains invalid
  characters or is empty? → Show a validation message before attempting
  any network call.
- What happens when GitHub's public API is unreachable or rate-limits the
  request? → Show a clear, non-technical error message and allow retry;
  do not silently fail.
- What happens when a founder generates a draft, then changes the
  username and re-generates? → The previous draft and context/why text
  are replaced by the new generation (or the founder is warned unsaved
  edits will be lost), not silently merged.
- What happens when the founder's context/why text is very long? → The
  app must not truncate or silently drop it from the woven draft.
- What happens when activity events include types beyond commits, PRs,
  and releases (e.g., issue comments, stars)? → Those are out of scope
  and excluded from the summary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a founder to enter a public GitHub
  username and trigger generation of a weekly activity digest via a
  single, explicit action (e.g., a "Generate" control). `keel: A-001`
- **FR-002**: The system MUST fetch the entered user's public GitHub
  activity — pushed commits, opened/merged pull requests, and published
  releases — for the trailing 7-day window, directly from GitHub's public
  REST API, without requiring any authentication token from the founder.
  `keel: A-001`, `keel: A-005`
- **FR-003**: The system MUST restrict all GitHub API access to public,
  read-only, unauthenticated endpoints; it MUST NOT request write access
  or access private repository data. `keel: A-005`
- **FR-004**: The system MUST present the fetched activity as a
  human-readable draft, grouped by repository, in an editable text area
  (not a read-only display). `keel: A-001`
- **FR-005**: The system MUST provide a separate, clearly-labeled field
  for the founder's own short "context/why" notes, presented as part of
  the draft-generation flow rather than as an optional afterthought.
  `keel: A-006`
- **FR-006**: The system MUST weave the founder's context/why notes into
  the generated draft text itself, rather than leaving raw activity data
  standing alone as the finished product. `keel: A-006`, `keel: A-003`
- **FR-007**: The system MUST treat the editable draft text as requiring
  founder review before it can be copied or exported — the draft is never
  auto-finalized without the founder having had the opportunity to read
  and edit it. `keel: A-002`
- **FR-008**: The system MUST provide exactly two actions available on
  the final draft text: copying it to the clipboard, and exporting it as
  a downloaded Markdown (`.md`) file. `keel: A-002`
- **FR-009**: The system MUST NOT contain any code path that posts,
  sends, or otherwise transmits the draft text to any server, API, or
  third party automatically or without the founder directly triggering
  the copy or export action in that moment. `keel: A-002`
- **FR-010**: The system MUST handle a valid username with zero public
  activity in the 7-day window by displaying a clear, plain-language
  message rather than an error page or an empty/blank result.
- **FR-011**: The system MUST handle a GitHub username that does not
  exist, or a GitHub API failure (including rate limiting), by displaying
  a clear, non-technical error message rather than crashing or silently
  failing.
- **FR-012**: The system MUST copy or export the founder's current edited
  text exactly as it stands at the moment of the action, not the original
  unedited generated draft. `keel: A-002`

### Key Entities

- **Digest Request**: A single founder-initiated generation attempt,
  identified by the GitHub username entered and the 7-day activity
  window it covers.
- **Activity Item**: A single unit of fetched GitHub activity (a commit,
  a pull request, or a release) with its repository, type, timestamp, and
  descriptive text (commit message, PR title, or release name).
- **Context Note**: The founder's own free-text "why" input, entered
  separately from the fetched activity and woven into the final draft.
- **Draft**: The editable, combined text (activity summary + woven
  context note) that the founder reviews, edits, and ultimately copies or
  exports. The draft's state at the moment of copy/export is what leaves
  the app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A founder with a week of public GitHub activity can go from
  opening the app to having a reviewed, edited draft ready to copy or
  export in under 3 minutes, without visiting github.com directly.
- **SC-002**: 100% of generated drafts that are copied or exported
  reflect the founder's own edits and context notes, not just the raw
  fetched activity.
- **SC-003**: 0 network requests carrying the draft's content occur
  without a direct, in-the-moment founder action (Copy or Export).
- **SC-004**: A founder whose entered username has no public activity in
  the last 7 days still reaches a usable, non-error state 100% of the
  time.
- **SC-005**: A founder can successfully generate a digest for any valid
  public GitHub username using only publicly available information —
  zero authentication steps, sign-ins, or tokens required.

## Assumptions

- Scope is limited to public GitHub activity only; private repositories
  and organizations are out of scope, consistent with `keel: A-005`,
  which is supported by a single source (E-004) and intentionally scoped
  conservatively — no OAuth or private-repo access without new evidence.
- The 7-day window is a fixed, non-configurable lookback for this version;
  a custom date range is out of scope.
- Grouping the draft by repository is a reasonable default for
  readability; it is not itself tied to a specific evidence marker.
- `keel: A-004` (whether founders would keep using this weekly) is not a
  functional requirement of this version — it is a downstream outcome the
  evidence says depends on the context/why field (FR-005/FR-006) actually
  shipping and being used, not on drafting speed alone. If that field
  were ever cut, A-004 should be treated as reopened per `keel/brief.md`.
- The magnitude of time saved (`keel: A-001`) varies across evidence
  sources (30–40 minutes vs. "under an hour"); this spec does not encode
  a specific time-savings claim into any requirement or success
  criterion, per the brief's residual-risk note.
- No user accounts, authentication, or persistence of past digests is in
  scope; each session is stateless once the browser tab is closed.
