# ShipLog

Turn a week of public GitHub activity into a draft "build in public" update — reviewed and edited by you before anything leaves the page. No auth token, no auto-post.

This repo is not a hand-written demo. It's the literal output of one real run through [Keel](https://github.com/keeldiscovery/spec-kit-keel) (`feature/guided-validation-workflow`), a discovery layer for [Spec Kit](https://github.com/github/spec-kit): a hypothesis, four interviews, a gate that actually blocked and then passed, a brief, and Spec Kit's own `constitution → specify → plan → tasks → implement → converge` pipeline, finishing with a `keel.audit` round-trip check against the original evidence.

The full story — problem statement, interviews, gate output, and the outcome — is written up at **[keeldiscovery.com/showcase](https://keeldiscovery.com/showcase/)**.

## Run it

No build step, no install, no auth token.

```bash
cd app
python3 -m http.server 8000
# open http://localhost:8000/
```

Enter any public GitHub username. If GitHub returns a rate-limit message, that's the real unauthenticated ceiling (60 requests/hour/IP) — wait for the hour to roll over, or try a lower-activity username.

## What's in here

```
keel/                          Discovery artifacts — the "why build this" trail
  hypothesis.md                The idea and the belief behind it
  assumptions.md               6 assumptions the idea depends on, with risk + status
  evidence/E-001.md – E-004.md Four interviews (synthetic — see decisions.md)
  decisions.md                 Evidence-provenance disclosure + the A-003→A-006 supersession
  brief.md                     Evidence-backed brief handed to /speckit-specify
  constitution-input.md        Principles grounded in specific findings, for /speckit-constitution
  audit-report.md              Round-trip diff: does the shipped app match the evidence?

specs/001-shiplog-weekly-digest/  Spec Kit's own pipeline output — spec, plan, tasks, research
.specify/memory/constitution.md  Project principles, filled from constitution-input.md
app/                              The actual app — index.html, app.js, style.css
```

## The honest part

`keel/evidence/*.md` are **synthetic** — written to exercise Keel's gate for this run, not collected from real people. That's disclosed explicitly in `keel/decisions.md` and `keel/brief.md`. Nothing in this repo should be read as evidence that real solo founders want this — the point of publishing it is to show the *mechanism* working end to end (a gate that genuinely blocks and unblocks, traceability that survives from evidence into shipped requirements, an audit that scores drift), not to claim market validation.

## License

Apache-2.0.
