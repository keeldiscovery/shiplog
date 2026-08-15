# Contract: GitHub Public REST API (external dependency)

ShipLog has no API of its own — its only external interface contract is
the subset of GitHub's public REST API it depends on. Documented here
because it is what the app is built against and what could break it.
Shapes below are the **actually observed live shapes** (verified via
`curl` on 2026-08-15 against `sindresorhus`, `torvalds`, `octocat`,
`gaearon`), not the general documented schema — see `research.md` for the
discrepancies that matter.

## `GET https://api.github.com/users/{username}/events/public`

- Auth: none required.
- CORS: `access-control-allow-origin: *` (confirmed) — safe to call from
  a browser `fetch()`.
- Query params used: `per_page=100`, `page` (see pagination in
  `research.md`).
- Success: `200`, JSON array of event objects, newest first. Empty array
  `[]` is a valid, expected response (verified live for `octocat`) — not
  an error.
- Username not found: `404`, `{"message":"Not Found","documentation_url":
  "...","status":"404"}` (verified live).
- Rate limited / unauthenticated cap: `60` requests/hour per client IP
  (verified via `x-ratelimit-limit: 60` response header). On `403` with
  a rate-limit message, or `429`, show the rate-limit error state — do
  not auto-retry in a loop.
- Event object fields the app reads: `id`, `type`, `created_at`,
  `repo.name`, `payload` (shape varies by `type`, see `data-model.md`).
- Event types the app acts on: `PushEvent`, `PullRequestEvent` (only
  `action === 'opened'` or `action === 'closed' && pull_request.merged
  ===` — **note**: `pull_request.merged` is `null` in the trimmed
  payload, so "merged" must come from enrichment, not from the raw
  event), `ReleaseEvent` (only `action === 'published'`). All other
  types (`CreateEvent`, `DeleteEvent`, `IssuesEvent`,
  `IssueCommentEvent`, `PullRequestReviewEvent`, `PublicEvent`, `WatchEvent`,
  `ForkEvent`, etc.) are ignored per spec scope.

## `GET https://api.github.com/repos/{owner}/{repo}/commits/{sha}`

- Auth: none required (verified live).
- Used to enrich a `PushEvent` with a real commit message, reading
  `commit.message` (first line used for display) and `html_url`.
- Called with `owner/repo` from the event's `repo.name` and `sha` from
  `payload.head`.
- Failure (404, rate limit, etc.) degrades gracefully — event still
  renders using the un-enriched fallback text.

## `GET https://api.github.com/repos/{owner}/{repo}/pulls/{number}`

- Auth: none required (verified live).
- Used to enrich a `PullRequestEvent` with the real `title`, `html_url`,
  and `merged` boolean.
- Called with `owner/repo` from the event's `repo.name` and `number`
  from `payload.number`.
- Failure degrades gracefully to "PR #{number} {action}".

## `GET https://api.github.com/users/{username}/repos` (optional, supplementary)

- Auth: none required.
- Used only for optional context (not required for the digest to
  render); failure here MUST NOT block or error the digest.

## Out of scope by design (Constitution Principle III / `keel: A-005`)

- No endpoint requiring an `Authorization` header is ever called.
- No endpoint under `/user` (the authenticated-user namespace) is called.
- No write-method (`POST`/`PATCH`/`PUT`/`DELETE`) call is ever made
  against GitHub or anywhere else.
