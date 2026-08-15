/*
 * ShipLog — weekly "build in public" digest generator.
 *
 * No backend, no build step, no auth token. Every GitHub call below is an
 * unauthenticated GET against a public endpoint (keel: A-001, A-005 —
 * see specs/001-shiplog-weekly-digest/spec.md and
 * .specify/memory/constitution.md Principle III).
 *
 * IMPORTANT — read before "simplifying" the enrichment calls below:
 * GitHub's public /events/public feed is more trimmed than the commonly
 * remembered/documented shape. Verified live on 2026-08-15 (see
 * specs/001-shiplog-weekly-digest/research.md):
 *   - PushEvent.payload has NO `commits` array (no message text at all).
 *   - PullRequestEvent.payload.pull_request has title/html_url/merged/state
 *     all `null`; only `number` and the top-level `action` are usable.
 *   - ReleaseEvent.payload.release DOES carry a real tag_name/html_url.
 * That's why enrichPushEvent/enrichPullRequestEvent below each make a
 * follow-up GET — without them the digest would just be a list of PR/push
 * IDs with no readable text, which defeats the point of the tool.
 *
 * Rate-limit note: unauthenticated GitHub REST calls are capped at 60
 * requests/hour per client IP. ENRICHMENT_CAP bounds how many follow-up
 * calls a single generation will make; anything beyond the cap still
 * renders, just without enrichment (see buildEnrichedItems).
 */

const WINDOW_DAYS = 7;
const PAGINATION_MAX_PAGES = 3;
const PAGE_SIZE = 100;
const ENRICHMENT_CAP = 40;
const GITHUB_API = 'https://api.github.com';

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

const state = {
  username: '',
  status: 'idle', // idle | loading | ready | empty | error
  errorMessage: null,
  lastDigestText: '', // generated (pre-context) digest text, used to re-weave on context edits
};

let draftManuallyEdited = false;
let els = {};
let confirmTimeout = null;

// ---------------------------------------------------------------------
// DOM wiring
// ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  els = {
    usernameInput: document.getElementById('username'),
    generateBtn: document.getElementById('generate-btn'),
    statusRegion: document.getElementById('status'),
    draftArea: document.getElementById('draft'),
    contextArea: document.getElementById('context'),
    contextHint: document.getElementById('context-hint'),
    copyBtn: document.getElementById('copy-btn'),
    exportBtn: document.getElementById('export-btn'),
    actionConfirm: document.getElementById('action-confirm'),
  };

  els.generateBtn.addEventListener('click', onGenerateClick);
  els.usernameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onGenerateClick();
    }
  });
  els.contextArea.addEventListener('input', onContextInput);
  els.draftArea.addEventListener('input', () => {
    onDraftInput();
    updateActionButtonsState();
  });
  els.copyBtn.addEventListener('click', onCopyClick);
  els.exportBtn.addEventListener('click', onExportClick);

  updateActionButtonsState();
});

// Copy/Export must only ever act on text the founder actually has in
// front of them to review (FR-007) — keep them disabled whenever the
// draft is empty, e.g. before the first Generate, or after a
// not_found/error result left #draft blank.
function updateActionButtonsState() {
  const hasContent = els.draftArea.value.trim().length > 0;
  els.copyBtn.disabled = !hasContent;
  els.exportBtn.disabled = !hasContent;
}

// ---------------------------------------------------------------------
// GitHub fetch + parsing (Foundational)
// ---------------------------------------------------------------------

async function fetchEvents(username) {
  let events = [];
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;

  for (let page = 1; page <= PAGINATION_MAX_PAGES; page++) {
    let response;
    try {
      response = await fetch(
        `${GITHUB_API}/users/${encodeURIComponent(username)}/events/public?per_page=${PAGE_SIZE}&page=${page}`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );
    } catch (err) {
      return { ok: false, kind: 'network' };
    }

    if (response.status === 404) {
      return { ok: false, kind: 'not_found' };
    }
    if (response.status === 403 || response.status === 429) {
      return { ok: false, kind: 'rate_limited' };
    }
    if (!response.ok) {
      return { ok: false, kind: 'network' };
    }

    let pageEvents;
    try {
      pageEvents = await response.json();
    } catch (err) {
      return { ok: false, kind: 'network' };
    }

    if (!Array.isArray(pageEvents) || pageEvents.length === 0) {
      break;
    }

    events = events.concat(pageEvents);

    const last = pageEvents[pageEvents.length - 1];
    const lastTime = new Date(last.created_at).getTime();
    if (lastTime < cutoff) {
      break; // remaining history (if any) is older than the window
    }
    if (pageEvents.length < PAGE_SIZE) {
      break; // that was the last page
    }
  }

  return { ok: true, events };
}

function filterToWindow(events, days = WINDOW_DAYS) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter((event) => new Date(event.created_at).getTime() >= cutoff);
}

function classifyEvent(event) {
  if (event.type === 'PushEvent') {
    return { kind: 'commit' };
  }
  if (event.type === 'PullRequestEvent') {
    const action = event.payload && event.payload.action;
    if (action === 'opened') return { kind: 'pr_opened' };
    if (action === 'closed') return { kind: 'pr_maybe_merged' }; // confirmed via enrichment
    return { kind: null };
  }
  if (event.type === 'ReleaseEvent') {
    const action = event.payload && event.payload.action;
    if (action === 'published') return { kind: 'release' };
    return { kind: null };
  }
  return { kind: null };
}

function parseRepoName(repoName) {
  const [owner, repo] = repoName.split('/');
  return { owner, repo };
}

async function enrichPushEvent(event) {
  const { owner, repo } = parseRepoName(event.repo.name);
  const sha = event.payload && event.payload.head;
  const ref = (event.payload && event.payload.ref) || '';
  const branch = ref.replace('refs/heads/', '') || 'a branch';
  const fallback = { text: `Pushed to ${branch}`, url: null };

  if (!owner || !repo || !sha) return fallback;

  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const rawMessage = data.commit && data.commit.message;
    const message = rawMessage ? rawMessage.split('\n')[0].trim() : null;
    if (!message) return fallback;
    return { text: message, url: data.html_url || null };
  } catch (err) {
    return fallback;
  }
}

async function enrichPullRequestEvent(event) {
  const { owner, repo } = parseRepoName(event.repo.name);
  const number = event.payload && event.payload.number;
  const action = (event.payload && event.payload.action) || 'updated';
  const fallback = { text: `PR #${number} ${action}`, url: null, merged: null };

  if (!owner || !repo || !number) return fallback;

  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const title = data.title || `PR #${number}`;
    return { text: title, url: data.html_url || null, merged: !!data.merged };
  } catch (err) {
    return fallback;
  }
}

function releaseItemFrom(event) {
  const release = (event.payload && event.payload.release) || {};
  const label = release.name && release.name.trim() ? release.name : release.tag_name || 'a new release';
  return { text: `Released ${label}`, url: release.html_url || null };
}

async function buildEnrichedItems(events) {
  const items = [];
  let enrichmentCalls = 0;

  // Events arrive newest-first; keep that order so if the enrichment cap
  // is hit, it's the OLDEST events in the window that lose enrichment.
  for (const event of events) {
    const classification = classifyEvent(event);
    if (!classification.kind) continue;

    const repo = event.repo && event.repo.name;
    if (!repo) continue;
    const timestamp = new Date(event.created_at);

    if (classification.kind === 'commit') {
      let detail;
      if (enrichmentCalls < ENRICHMENT_CAP) {
        detail = await enrichPushEvent(event);
        enrichmentCalls++;
      } else {
        const ref = (event.payload && event.payload.ref) || '';
        const branch = ref.replace('refs/heads/', '') || 'a branch';
        detail = { text: `Pushed to ${branch}`, url: null };
      }
      items.push({ repo, type: 'commit', timestamp, text: detail.text, url: detail.url });
    } else if (classification.kind === 'pr_opened' || classification.kind === 'pr_maybe_merged') {
      let detail;
      if (enrichmentCalls < ENRICHMENT_CAP) {
        detail = await enrichPullRequestEvent(event);
        enrichmentCalls++;
      } else {
        const number = event.payload && event.payload.number;
        detail = { text: `PR #${number}`, url: null, merged: null };
      }

      let type;
      if (classification.kind === 'pr_opened') {
        type = 'pr_opened';
      } else if (detail.merged) {
        type = 'pr_merged';
      } else {
        // Closed without merging (or unknown, because we hit the
        // enrichment cap) — out of spec scope, skip rather than guess.
        continue;
      }
      items.push({ repo, type, timestamp, text: detail.text, url: detail.url });
    } else if (classification.kind === 'release') {
      const detail = releaseItemFrom(event);
      items.push({ repo, type: 'release', timestamp, text: detail.text, url: detail.url });
    }
  }

  return items;
}

function groupByRepo(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.repo)) map.set(item.repo, []);
    map.get(item.repo).push(item);
  }

  const groups = Array.from(map.entries()).map(([repo, repoItems]) => {
    const sorted = repoItems.slice().sort((a, b) => b.timestamp - a.timestamp);
    return { repo, items: sorted, mostRecent: sorted[0].timestamp };
  });

  groups.sort((a, b) => b.mostRecent - a.mostRecent);
  return groups;
}

const TYPE_LABEL = {
  commit: 'Commit',
  pr_opened: 'PR opened',
  pr_merged: 'PR merged',
  release: 'Release',
};

function renderDigestText(repoGroups) {
  if (repoGroups.length === 0) return '';

  const lines = ["## This week's activity", ''];
  for (const group of repoGroups) {
    lines.push(`### ${group.repo}`);
    for (const item of group.items) {
      const label = TYPE_LABEL[item.type] || item.type;
      const link = item.url ? ` ([link](${item.url}))` : '';
      lines.push(`- **${label}**: ${item.text}${link}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

// ---------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------

async function generateDigest(username) {
  state.username = username;
  state.status = 'loading';
  state.errorMessage = null;
  renderStatus();

  const result = await fetchEvents(username);

  if (!result.ok) {
    state.status = 'error';
    state.errorMessage =
      result.kind === 'not_found'
        ? `We couldn't find a public GitHub user called "${username}".`
        : "GitHub's API isn't responding right now (it may be rate-limited) — try again in a few minutes.";
    state.lastDigestText = '';
    renderStatus();
    return;
  }

  const windowed = filterToWindow(result.events);
  const items = await buildEnrichedItems(windowed);
  const groups = groupByRepo(items);
  const digestText = renderDigestText(groups);

  state.lastDigestText = digestText;
  state.status = items.length === 0 ? 'empty' : 'ready';

  renderStatus();
  applyGeneratedDraft();
}

// ---------------------------------------------------------------------
// UI: generate
// ---------------------------------------------------------------------

async function onGenerateClick() {
  const username = els.usernameInput.value.trim();

  if (!username) {
    state.status = 'error';
    state.errorMessage = 'Enter a GitHub username first.';
    renderStatus();
    return;
  }

  els.generateBtn.disabled = true;
  els.usernameInput.disabled = true;
  try {
    await generateDigest(username);
  } finally {
    els.generateBtn.disabled = false;
    els.usernameInput.disabled = false;
  }
}

function renderStatus() {
  const messages = {
    idle: '',
    loading: 'Fetching activity from GitHub…',
    ready: `Draft ready for "${state.username}".`,
    empty: `No public activity found for "${state.username}" in the last 7 days — you can still write an update using just the context field below.`,
    error: state.errorMessage || 'Something went wrong.',
  };
  els.statusRegion.textContent = messages[state.status] || '';
  els.statusRegion.dataset.state = state.status;
}

// ---------------------------------------------------------------------
// UI: context weaving (keel: A-006, A-003)
// ---------------------------------------------------------------------

function weaveContext(digestText, contextText) {
  const trimmedContext = (contextText || '').trim();
  if (!trimmedContext) return digestText || '';
  if (!digestText) return trimmedContext;
  return `${trimmedContext}\n\n${digestText}`;
}

function applyGeneratedDraft() {
  draftManuallyEdited = false;
  els.contextHint.textContent = '';
  els.draftArea.value = weaveContext(state.lastDigestText, els.contextArea.value);
  updateActionButtonsState();
}

function onContextInput() {
  if (draftManuallyEdited) {
    // Don't clobber hand-edits to the draft just because the founder is
    // still refining their context note — surface guidance instead.
    els.contextHint.textContent =
      "You've edited the draft directly — add your context above, then copy it into the draft yourself so your edits aren't lost.";
    return;
  }
  els.contextHint.textContent = '';
  els.draftArea.value = weaveContext(state.lastDigestText, els.contextArea.value);
  updateActionButtonsState();
}

function onDraftInput() {
  draftManuallyEdited = true;
}

// ---------------------------------------------------------------------
// UI: copy / export (keel: A-002 — the only two ways text leaves the app)
// ---------------------------------------------------------------------

async function onCopyClick() {
  const text = els.draftArea.value;
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('Clipboard API unavailable');
    }
    await navigator.clipboard.writeText(text);
    showConfirm('Copied to clipboard.');
  } catch (err) {
    els.draftArea.focus();
    els.draftArea.select();
    showConfirm("Couldn't access the clipboard automatically — the draft text is selected, press Cmd/Ctrl+C to copy.");
  }
}

function onExportClick() {
  const text = els.draftArea.value;
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shiplog-update-${date}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showConfirm('Exported as Markdown.');
}

function showConfirm(message) {
  els.actionConfirm.textContent = message;
  if (confirmTimeout) clearTimeout(confirmTimeout);
  confirmTimeout = setTimeout(() => {
    els.actionConfirm.textContent = '';
  }, 5000);
}
