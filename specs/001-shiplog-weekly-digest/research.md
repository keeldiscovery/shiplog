# Phase 0 Research: ShipLog Weekly Digest

All findings below were verified against the **live** GitHub public REST
API on 2026-08-15 with `curl` (not assumed from memory), because the
events payload shape has changed over time and getting it wrong would
mean shipping broken JSON-parsing code. See raw verification commands in
`quickstart.md`.

## Decision: Which GitHub endpoints to call

- **Decision**: `GET https://api.github.com/users/{username}/events/public`
  is the primary source (commits pushed, PR opened/merged, releases
  published, plus other event types we filter out). `GET
  https://api.github.com/users/{username}/repos` is used only for
  optional context (not required for the digest to render).
- **Rationale**: Matches `keel: A-001`/`A-005` and the feature
  description exactly — public, unauthenticated, no token. Verified
  `access-control-allow-origin: *` on the response, so a browser
  `fetch()` from a static page works with no proxy/CORS workaround.
- **Alternatives considered**: GitHub GraphQL API (rejected — requires an
  auth token even for public data, violating `keel: A-005`); GitHub
  Search API for commits (rejected — also effectively requires
  authentication for reasonable rate limits and doesn't return a clean
  per-user activity timeline).

## Critical finding: the public events payload is more trimmed than expected

Verified live against `sindresorhus`, `torvalds`, `gaearon`,
`addyosmani`:

- **`PushEvent.payload` does NOT include a `commits` array.** Only
  `repository_id`, `push_id`, `ref`, `head`, `before` are present. This
  differs from GitHub's classic documented shape (which historically
  included `commits[].message`). GitHub trims this from the public
  events feed now. **Impact**: to show an actual commit message, the app
  must make a follow-up call to `GET /repos/{owner}/{repo}/commits/{head}`
  per push event and read `commit.message` from that response. Verified
  this follow-up call works unauthenticated and returns a real message.
- **`PullRequestEvent.payload.pull_request` has `title`, `html_url`,
  `merged`, and `state` all `null`.** Only `action` and `number` are
  populated. **Impact**: to show a PR title, the app must make a
  follow-up call to `GET /repos/{owner}/{repo}/pulls/{number}` per PR
  event. Verified this returns a real `title`, `html_url`, and `merged`
  boolean unauthenticated.
- **`ReleaseEvent.payload.release`** DOES include a usable `tag_name` and
  `html_url` directly on the event — no follow-up call needed for
  releases. `release.name` is frequently an empty string in practice
  (projects that don't title their releases); fall back to `tag_name`
  when `name` is empty.
- **`repo.name`** (`"owner/repo"`) and `actor.login` ARE present at the
  top level of every event regardless of type — grouping by repository
  does not require any enrichment call.

This is a load-bearing finding for the plan: naive parsing based on the
commonly-remembered/documented PushEvent/PullRequestEvent shape would
silently render commit-less pushes and title-less PRs. The implementation
MUST enrich, not just parse, `PushEvent` and `PullRequestEvent`.

## Decision: Enrichment strategy and rate-limit budget

- **Decision**: After fetching and filtering events to the last 7 days,
  issue one follow-up `GET` per `PushEvent` (commit detail for `head`)
  and one per `PullRequestEvent` (PR detail for `number`), capped at a
  total of 40 enrichment calls per generation. If the cap is reached,
  remaining events of that type render without enrichment (e.g. "Pushed
  to `main`" / "PR #123 opened") rather than blocking the whole digest.
  Any individual enrichment call that fails (404/403/network error) must
  degrade the same way — never fail the whole generation.
- **Rationale**: Unauthenticated GitHub REST calls are capped at 60
  requests/hour **per client IP** (verified via
  `x-ratelimit-limit: 60` on a live response). Base cost is 2 calls
  (events + repos). A single generation for a very active week could
  otherwise need dozens of enrichment calls; capping keeps a single
  generation well under the hourly budget while still surfacing real
  commit messages and PR titles for the common case. Multiple
  generations in the same hour from the same browser will still be able
  to exhaust the 60/hour budget — this is disclosed to the user as a
  possible "GitHub rate limit reached, try again later" error state
  rather than silently retried or hidden.
- **Alternatives considered**: Fetching a token-authenticated session
  (rejected outright — violates `keel: A-005` and Constitution Principle
  III); fetching all commits via the `compare` endpoint in one call per
  push instead of the single-commit endpoint (works, but for the common
  single-commit push case costs the same one call, and for multi-commit
  pushes trades completeness for one more field to parse — deferred as
  an enhancement, not required to satisfy the spec, which only asks for
  "commits (with messages)" not "every commit in every push").

## Decision: Pagination and the 7-day window

- **Decision**: Fetch `events/public` with `per_page=100`, and page
  forward (`page=2`, `page=3`, ...) only if the last event on the current
  page is still within the 7-day window, up to a hard cap of 3 pages
  (300 events, GitHub's documented practical ceiling for this endpoint).
  Stop as soon as an event older than the cutoff is seen — events are
  returned newest-first, so this is a safe short-circuit.
- **Rationale**: A single page (30 events default, up to 100 with
  `per_page`) is enough for the vast majority of solo-founder weeks;
  paging further only for genuinely high-activity users keeps typical
  calls at 1 page while still being correct for outliers, without an
  unbounded loop.
- **Alternatives considered**: Always fetch all available pages
  (rejected — wastes rate-limit budget for the common case where page 1
  already covers 7 days).

## Decision: Zero-activity and error UI states

- **Decision**: Three distinct, plain-language states, all rendered
  in-page (no browser `alert()`, no dead-end blank screen):
  1. Username not found → GitHub returns `404` with
     `{"message":"Not Found",...}` (verified live) → "We couldn't find a
     public GitHub user called '{username}'."
  2. Valid user, zero qualifying events in 7 days (verified live against
     `octocat`, which currently has an empty `events/public` array) →
     "No public activity found for '{username}' in the last 7 days —
     you can still write an update using just the context field below."
  3. Network/rate-limit failure → "GitHub's API isn't responding right
     now (it may be rate-limited) — try again in a few minutes."
- **Rationale**: Directly satisfies FR-010/FR-011 and User Story 4;
  `octocat` having zero live public events on the day of research made
  this trivial to verify as a real, not hypothetical, case.

## Decision: No framework, no build step

- **Decision**: Plain HTML/CSS/JS, three files, no `package.json`
  required to run.
- **Rationale**: Directly required by the Scope Constraints section of
  the constitution and the plan's Technical Context; the app is simple
  enough (single form, one API integration, two output actions) that a
  framework would add ceremony without solving a real problem here.
- **Alternatives considered**: A lightweight framework (e.g., a single
  reactive library via CDN) — rejected as unnecessary for this scope and
  in tension with "no build step, trivial to run and demo."
