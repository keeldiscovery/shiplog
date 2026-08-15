# keel/constitution-input.md — ShipLog

Principles for `/speckit-constitution`, each grounded in a specific
finding — not generic best-practice advice.

1. **No unreviewed output ever leaves the app.** Three independent
   founders (E-001, E-002, E-004) were unconditional that they would not
   let a summary with their name on it go out unread. There must be no
   code path — now or in any future feature — that posts, emails, or
   otherwise transmits generated text without a human confirming it
   first. `keel: A-002`.

2. **Raw activity data is never presented as a finished product.** E-002
   and E-003 independently described commit-only summaries as reading
   like a changelog, not an update. The UI must always pair generated
   activity data with the founder's own added context before calling
   anything a "draft," not just offer the context field as optional.
   `keel: A-003 (ruled out), A-006`.

3. **Scope GitHub access to public, read-only, unauthenticated calls
   only.** The one piece of evidence on this (E-004) explicitly
   distinguished comfort with read-only public-repo integrations from
   discomfort with write access or private repos. Do not add a GitHub
   OAuth flow, write scopes, or private-repo access without new evidence
   to justify the expanded trust boundary. `keel: A-005`.
