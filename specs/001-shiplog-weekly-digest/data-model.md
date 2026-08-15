# Phase 1 Data Model: ShipLog Weekly Digest

This app has no database and no persistence — these are in-memory shapes
that exist for the lifetime of one page load / one generation. Documented
here because the spec's Key Entities section requires it and because the
raw-vs-enriched distinction (see `research.md`) is easy to get wrong.

## DigestRequest

Represents one founder-initiated generation attempt.

| Field | Type | Notes |
|---|---|---|
| username | string | Trimmed, non-empty, required before Generate is enabled |
| windowStart | Date | `now - 7 days`, computed at generation time |
| windowEnd | Date | `now`, computed at generation time |
| status | enum | `idle` \| `loading` \| `ready` \| `empty` \| `error` |
| errorMessage | string \| null | Set only when `status === 'error'` |

## RawEvent (as returned by `/events/public`)

Only the fields the app actually reads, per the verified live shapes in
`research.md`:

| Field | Type | Notes |
|---|---|---|
| id | string | GitHub event id |
| type | string | One of `PushEvent`, `PullRequestEvent`, `ReleaseEvent`, or other (ignored) |
| created_at | ISO string | Used to filter to the 7-day window and to sort |
| repo.name | string | `"owner/repo"` — used for grouping |
| payload | object | Shape depends on `type`; see below |

`payload` by type (fields actually present on the live public feed —
**not** the full documented shape):

- `PushEvent`: `{ ref, head, before, push_id, repository_id }` — no
  `commits` array. `ref` is `refs/heads/{branch}`; strip the prefix for
  display.
- `PullRequestEvent`: `{ action, number, pull_request: { number, title:
  null, html_url: null, merged: null, state: null, ... } }` — only
  `action` and `number` are reliably populated; `title`/`merged` require
  enrichment.
- `ReleaseEvent`: `{ action, release: { tag_name, name, html_url, draft,
  prerelease } }` — usable as-is; `name` may be `""`.

## EnrichedActivityItem

The normalized shape the app actually renders from, produced by mapping
+ enriching `RawEvent`s (see `research.md` enrichment strategy).

| Field | Type | Notes |
|---|---|---|
| repo | string | `"owner/repo"` |
| type | enum | `commit` \| `pr_opened` \| `pr_merged` \| `release` |
| timestamp | Date | From `RawEvent.created_at` |
| text | string | Commit message / PR title / release tag+name; falls back to a generic label (e.g. "Pushed to main", "PR #123") if enrichment failed or was skipped under the rate-limit cap |
| url | string \| null | `html_url` when available from enrichment (commits, PRs, releases); `null` for un-enriched pushes |
| enriched | boolean | `true` if the follow-up detail call succeeded; surfaced only for debugging, not shown in the UI |

## RepoGroup

Derived, not fetched — a grouping of `EnrichedActivityItem[]` by `repo`,
sorted by most recent activity first, used purely for rendering.

## ContextNote

| Field | Type | Notes |
|---|---|---|
| text | string | Founder's free-text "why" notes; may be empty until they type something |

## Draft

| Field | Type | Notes |
|---|---|---|
| generatedText | string | The activity summary as first generated (grouped by repo) |
| text | string | The current, editable, founder-owned draft text shown in the `<textarea>`; seeded from `generatedText` + woven `ContextNote`, then freely editable |

`Draft.text` — and only `Draft.text` at the moment of the click — is what
Copy and Export operate on (Constitution Principle I / FR-012). No other
entity is ever serialized and sent anywhere.
