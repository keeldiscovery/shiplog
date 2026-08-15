# Assumptions

| ID | Statement | Type | Risk | Evidence | Status |
|----|-----------|------|------|----------|--------|
| A-001 | Solo founders spend real, recurring time each week manually reconstructing their own shipped work into a shareable progress update. | belief | high | E-001, E-004 | supported |
| A-002 | A machine-drafted update is only usable to a founder if they can review and edit it before it's shared — not if it posts on their behalf. | belief | high | E-002, E-004 | supported |
| A-003 | A founder's public GitHub activity (commits, merged PRs, releases) carries enough signal on its own to produce a genuinely useful first draft, without private/internal context. | belief | medium | E-002, E-003 | contradicted |
| A-004 | Founders would keep using a tool like this weekly, not try it once and drop it. | belief | medium | E-001, E-003 | supported |
| A-005 | Founders are comfortable with a tool reading their public GitHub activity via GitHub's public API, with no auth token or private-repo access. | belief | low | E-004 | open |
| A-006 | A short founder-editable context/notes field, layered on top of raw GitHub activity, is necessary for a draft to read as a genuine update rather than a changelog. | belief | medium | E-002, E-003 | supported |

## Interview guide (non-leading)

Questions ask about what the participant already does or has experienced —
never about ShipLog, "a tool that drafts your update," or any named
mechanism. If a question can only be answered by imagining the product,
it's been rewritten below.

1. Walk me through the last time you wrote a public progress update about
   something you built or shipped — what did that actually involve, start
   to finish? *(A-001)*
2. How did you figure out what to include? Where did you look, and how long
   did that take? *(A-001, A-003)*
3. Have you ever had something else — a person, a tool, a generated report —
   draft a summary of your own work for you? What happened when you read
   it? *(A-002)*
4. Would you ever let a summary of your work go out publicly without
   reading it first? Why or why not? *(A-002 — designed to surface
   disconfirming evidence, not just confirm the review-step belief.)*
5. Think about the last few things you shipped in a normal week — commits,
   PRs, a release. Is there anything about *why* you did them that wouldn't
   show up if someone only looked at the commit history? *(A-003 —
   designed to surface disconfirming evidence.)*
6. How often do you currently post a progress update like this — every
   week, occasionally, in bursts? What makes you skip a week? *(A-004)*
7. (Reader-facing variant) When you read someone else's weekly build-in-
   public update, what makes you actually read it versus skip it? *(A-004,
   indirectly — tests whether the output format is worth producing at all)*
8. Do you currently connect any tools to your GitHub account, and what did
   you check or hesitate about before doing that? *(A-005)*
