# Quickstart: ShipLog Weekly Digest

## Prerequisites

- Any modern browser.
- Python 3 (for the simplest local static server) — or any other static
  file server / just opening `app/index.html` directly.
- `curl` (used below only to re-verify the live API contract; not
  required to run the app).

## Run it locally

```bash
cd app
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser. No build step, no
`npm install`, no environment variables.

## Validate the external contract is still what the app expects

These are the exact commands used during Phase 0 research to verify
GitHub's live response shapes. Re-run them if GitHub's API behavior is
ever suspected to have changed:

```bash
# A user with real recent Push/PR/Release activity
curl -s "https://api.github.com/users/sindresorhus/events/public" | python3 -m json.tool | less

# Confirm PushEvent payload has NO commits array (must enrich via /commits/{sha})
curl -s "https://api.github.com/users/sindresorhus/events/public" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print([list(e['payload'].keys()) for e in d if e['type']=='PushEvent'][:3])"

# Confirm a zero-activity user renders the empty state, not an error
curl -s "https://api.github.com/users/octocat/events/public"

# Confirm a nonexistent username returns 404 with a JSON message
curl -s -w "\nHTTP:%{http_code}\n" "https://api.github.com/users/this-should-not-exist-zzz/events/public"

# Confirm CORS allows a browser fetch()
curl -sI "https://api.github.com/users/octocat/events/public" | grep -i access-control-allow-origin
```

## End-to-end validation scenarios (manual, browser-based)

1. **Happy path (User Story 1)**: enter `sindresorhus`, click Generate.
   Expect a draft grouped by repo showing recent pushes, PRs, and at
   least one release, each with real text (not just "#123" placeholders)
   within a few seconds.
2. **Context weaving (User Story 2)**: type a sentence into the
   context/why field. Expect the draft textarea's content to visibly
   change to incorporate it.
3. **Copy/Export only (User Story 3)**: edit the draft text directly,
   click "Copy to clipboard" — expect a visible confirmation and the
   clipboard to contain the edited text (paste to confirm). Click
   "Export as Markdown" — expect a `.md` file download containing the
   same edited text. Confirm via browser devtools Network tab that no
   request fires as a result of either button beyond what's expected
   (Copy fires none; Export fires none — both are local operations).
4. **Zero activity (User Story 4)**: enter `octocat`, click Generate.
   Expect the plain "no public activity found" message, not a crash or
   blank page, and confirm Generate → context-only draft → Copy/Export
   still works from that state.
5. **Unknown username (edge case)**: enter a made-up username, click
   Generate. Expect a plain "couldn't find that user" message.
6. **Empty username (edge case)**: click Generate with the field empty.
   Expect inline validation, no network call made.
