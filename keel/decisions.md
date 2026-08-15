# Decisions

## Evidence provenance disclosure

All four interviews in `keel/evidence/` (E-001 through E-004) are
**synthetic** — written to exercise the Keel discovery flow end-to-end for
a showcase/dogfood run of the `feature/guided-validation-workflow` branch
of spec-kit-keel, not collected from real people.
`commands/add-evidence.md` is explicit that this command "processes one
real interview, it does not simulate one" — this project deliberately
does the thing that command tells a real user not to do, for the narrow
purpose of testing whether the gate, the status-derivation judgment calls,
and the downstream brief/build/audit pipeline behave correctly end to end.
Nothing in `keel/brief.md` or the shipped app should be treated as
evidence that real solo founders want this product. Before treating
ShipLog as a validated idea, every evidence file here needs replacing with
a real transcript.

## A-003 superseded by A-006

superseded: A-003

`A-003` ("GitHub activity alone carries enough signal") was contradicted
by E-002 and E-003 — both independently described commit-only output as
reading like a changelog, not an update. Rather than stretch A-003's
wording, the revised belief is captured as a new assumption, `A-006` (a
founder-editable context field is necessary on top of raw activity). This
is documented as `superseded`, not `override`: the original assumption
was resolved (found false), not accepted-as-risk-unresolved. A-003 is
medium risk, so this has no effect on the gate's high-risk block — it's
recorded here for `keel.audit` traceability and because the pattern is
worth exercising for real rather than only unit-tested.
