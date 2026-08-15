# Hypothesis

## The idea

ShipLog: a small web app for solo indie founders who "build in public." You
give it a GitHub username. It pulls that person's public activity for the
past week — commits, merged pull requests, tagged releases, repos touched —
straight from GitHub's public REST API (no token, no private data), and
turns it into a draft weekly "build in public" update: the kind of post
people write by hand for X/Twitter, Indie Hackers, or a devlog. The founder
reviews and edits the draft before they post it anywhere. ShipLog never
posts on their behalf.

## The underlying belief

Solo founders who build in public lose real time every week doing the same
manual chore: scrolling back through their own commit history and PR list
to remember what they actually shipped, then writing that up in prose.
That reconstruction step — not the writing itself — is what a tool could
remove, as long as what comes out the other end is a draft the founder
still controls, not an autoposted summary they didn't see first.

## Who it's for

Primary: a solo (or very small team) indie founder actively building a
product in public, posting some form of weekly progress update as part of
their audience-building habit. Secondary, for a different angle of
evidence: people who follow and read those updates — if the update format
itself isn't something readers value, drafting it faster doesn't matter.

## Why now

Honestly: mostly founder intuition, not evidence yet. Two real things make
it plausible — GitHub's public REST API exposes enough public-activity data
without auth to attempt a first-draft summary, and "build in public" has
become a common enough habit among indie founders that the target audience
clearly exists — but neither of those confirms that the specific chore
(writing the weekly update) is actually painful enough, or that founders
will trust a machine-drafted first pass, or that GitHub activity alone
carries enough signal to be useful without the founder's own private
context. That's exactly what this discovery pass exists to find out before
any of it becomes a spec.
