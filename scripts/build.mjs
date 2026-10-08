// Builds the profile cards and the open-source section of README.md from the GitHub API.
// Only public data is used, so the output is the same whichever token runs it.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const LOGIN = process.env.PROFILE_LOGIN || 'Tunaycel';
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('GITHUB_TOKEN is not set');

async function gql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors || body));
  return body.data;
}

const PR_FIELDS = `... on PullRequest {
  title url state createdAt mergedAt additions deletions
  repository { nameWithOwner url isPrivate stargazerCount owner { login } }
}`;

async function searchPrs(q) {
  const out = [];
  let after = null;
  for (;;) {
    const d = await gql(
      `query($q: String!, $after: String) {
        search(query: $q, type: ISSUE, first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { ${PR_FIELDS} }
        }
      }`,
      { q, after },
    );
    out.push(...d.search.nodes.filter((n) => n.repository && !n.repository.isPrivate));
    if (!d.search.pageInfo.hasNextPage) return out;
    after = d.search.pageInfo.endCursor;
  }
}

async function profile() {
  const d = await gql(
    `query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
        }
        repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, first: 100) {
          nodes { name languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } } } }
        }
      }
    }`,
    { login: LOGIN },
  );
  return d.user;
}

// ---------- numbers ----------

function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

function languages(repos) {
  const totals = new Map();
  for (const r of repos) {
    for (const e of r.languages.edges) {
      const cur = totals.get(e.node.name) || { size: 0, color: e.node.color || '#8b949e' };
      cur.size += e.size;
      totals.set(e.node.name, cur);
    }
  }
  const all = [...totals.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.size - a.size);
  const sum = all.reduce((s, l) => s + l.size, 0) || 1;
  const top = all.slice(0, 5);
  const rest = all.slice(5).reduce((s, l) => s + l.size, 0);
  if (rest > 0) top.push({ name: 'Other', size: rest, color: '#6e7681' });
  return top.map((l) => ({ ...l, share: l.size / sum }));
}

const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toLocaleString('en-US'));
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- cards ----------

const THEMES = {
  dark: { bg: '#0d1117', panel: '#161b22', line: '#30363d', text: '#e6edf3', muted: '#8b949e', accent: '#58a6ff', bar: '#2ea043', barDim: '#1b4721' },
  light: { bg: '#ffffff', panel: '#f6f8fa', line: '#d0d7de', text: '#1f2328', muted: '#59636e', accent: '#0969da', bar: '#1a7f37', barDim: '#aceebb' },
};
const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`;

// The header is a dark terminal that replays a short session: it opens on the first screen of it, clears,
// types each command, prints the answer and scrolls like a real shell. Without SMIL it stays on that first screen.
const TERM = {
  bg: '#0d1117', bar: '#161b22', line: '#30363d', text: '#e6edf3', muted: '#8b949e',
  blue: '#58a6ff', green: '#3fb950', cyan: '#39c5cf', yellow: '#d29922', purple: '#bc8cff', red: '#ff7b72',
};

const SESSION = [
  ['whoami', [[['text', 'Hüseyin Tunay Çelik', 700], ['muted', '  software engineer · Wrocław, Poland']]]],
  ['cat role.yml', [[['cyan', 'role'], ['muted', ': '], ['text', '[full-stack, ai-research, agent-orchestration, bug-hunting]']]]],
  ['ls ~/work', [[
    ['blue', 'bluesense/'], ['muted', ' aws infra + 2 apps   '],
    ['blue', 'voxgig/'], ['muted', ' oss contributor   '],
    ['blue', 'nest2move/'], ['muted', ' b2b saas   '],
    ['blue', 'birthday-msg/'], ['muted', ' admin'],
  ]]],
  ['./research --ai', [[
    ['green', '✓'], ['text', ' llm evals   '], ['green', '✓'], ['text', ' ai control   '],
    ['green', '✓'], ['text', ' multi-agent pipelines   '], ['muted', '# since llms went mainstream'],
  ]]],
  ['git log --upstream --oneline', [[
    ['yellow', 'assistant-ui'], ['muted', ' ★12.4k · '], ['yellow', 'control-arena'], ['muted', ' · '],
    ['yellow', 'voxgig/apidef'], ['text', '   reproduce → fix → ship upstream'],
  ]]],
  ['cat thesis.md', [[
    ['purple', '# '], ['text', 'Automated incident response under Zero Trust'],
    ['muted', ' · Sentinel · KQL · Logic Apps · '], ['green', 'MTTR ↓'],
  ]]],
  ['echo $STATUS', [[['green', '●'], ['text', ' open to full-time roles'], ['muted', ' · Wrocław · hybrid · remote (EU)']]]],
];

function headerSvg() {
  const t = TERM;
  const W = 840;
  const FS = 13;
  const CW = FS * 0.6; // forced glyph width, so the caret can follow the typing
  const LH = 21;
  const X0 = 22;
  const XT = X0 + CW * 4;
  const VISIBLE = 8;
  const BODY_TOP = 44;
  const TOP = BODY_TOP + 20;
  const H = BODY_TOP + VISIBLE * LH + 14 + 26;
  const TYPE = 0.06;
  const ENTER = 0.4;
  const READ = 1.2;
  const HOLD = 5;

  const rows = [];
  let t0 = HOLD + 0.8;
  for (const [cmd, out] of SESSION) {
    const typed = t0 + cmd.length * TYPE;
    rows.push({ kind: 'cmd', text: cmd, start: t0, end: typed, appear: t0 - 0.35 });
    out.forEach((segs, i) => rows.push({ kind: 'out', segs, appear: typed + ENTER + i * 0.08 }));
    t0 = typed + ENTER + READ;
  }
  rows.push({ kind: 'end', appear: t0 - READ + 0.2 });
  const CYCLE = t0 + 1.5;
  const k = (s) => (s / CYCLE).toFixed(4);
  const A = `dur="${CYCLE}s" repeatCount="indefinite"`;
  const shown = (r) => `<animate attributeName="opacity" ${A} calcMode="discrete" values="1;0;1" keyTimes="0;${k(HOLD)};${k(r.appear)}"/>`;
  const shiftAt = (n) => Math.max(0, n - (VISIBLE - 1)) * LH;
  const yOf = (n) => TOP + n * LH;

  const prompt = (y) =>
    `<text x="${X0}" y="${y}" fill="${t.blue}" font-family="${MONO}" font-size="${FS}" font-weight="700">~</text><text x="${X0 + CW * 2}" y="${y}" fill="${t.green}" font-family="${MONO}" font-size="${FS}" font-weight="700">❯</text>`;

  const body = rows
    .map((r, n) => {
      const y = yOf(n);
      if (r.kind === 'out') {
        const spans = r.segs
          .map(([c, s, wt]) => `<tspan fill="${t[c]}"${wt ? ` font-weight="${wt}"` : ''}>${esc(s)}</tspan>`)
          .join('');
        return `<text xml:space="preserve" x="${XT}" y="${y}" font-family="${MONO}" font-size="${FS}">${spans}${shown(r)}</text>`;
      }
      if (r.kind === 'end') {
        return `<g>${shown(r)}${prompt(y)}<rect class="caret" x="${XT}" y="${y - 11}" width="${CW}" height="14" fill="${t.text}"/></g>`;
      }
      const w = r.text.length * CW;
      return `<clipPath id="c${n}"><rect x="${XT}" y="${y - 15}" width="${w + 2}" height="${LH}"><animate attributeName="width" ${A} values="${w + 2};${w + 2};0;0;${w + 2};${w + 2}" keyTimes="0;${k(HOLD - 0.01)};${k(HOLD)};${k(r.start)};${k(r.end)};1"/></rect></clipPath>
<g>${shown(r)}${prompt(y)}</g>
<text clip-path="url(#c${n})" x="${XT}" y="${y}" fill="${t.text}" font-family="${MONO}" font-size="${FS}" textLength="${w}" lengthAdjust="spacing">${esc(r.text)}</text>
<rect x="${XT + w + 2}" y="${y - 11}" width="${CW}" height="14" fill="${t.text}" opacity="0"><animate attributeName="opacity" ${A} calcMode="discrete" values="0;1;0" keyTimes="0;${k(r.appear)};${k(r.end + ENTER)}"/><animate attributeName="x" ${A} values="${XT};${XT};${XT + w + 2};${XT + w + 2}" keyTimes="0;${k(r.start)};${k(r.end)};1"/></rect>`;
    })
    .join('\n');

  // scroll: the group moves up a line whenever a new line would fall below the window
  const marks = [[0, 0]];
  rows.forEach((r, n) => marks.push([r.appear, shiftAt(n)]));
  const scroll = `<animateTransform attributeName="transform" type="translate" ${A} calcMode="discrete" values="${marks.map(([, s]) => `0 ${-s}`).join(';')}" keyTimes="${marks.map(([s]) => k(s)).join(';')}"/>`;

  const SB = H - 26;
  const status = [
    `<rect x="0.5" y="${SB}" width="${W - 1}" height="25.5" fill="${t.bar}"/>`,
    `<line x1="0.5" y1="${SB}" x2="${W - 0.5}" y2="${SB}" stroke="${t.line}"/>`,
    `<rect x="10" y="${SB + 5}" width="62" height="16" rx="3" fill="${t.green}"/>`,
    `<text x="41" y="${SB + 17}" text-anchor="middle" fill="${t.bg}" font-family="${MONO}" font-size="11" font-weight="700">NORMAL</text>`,
    `<text x="84" y="${SB + 17}" fill="${t.purple}" font-family="${MONO}" font-size="11.5">git:(main)</text>`,
    `<text x="168" y="${SB + 17}" fill="${t.muted}" font-family="${MONO}" font-size="11.5">~/Tunaycel/README.md</text>`,
    `<text xml:space="preserve" x="${W - 12}" y="${SB + 17}" text-anchor="end" fill="${t.muted}" font-family="${MONO}" font-size="11.5"><tspan fill="${t.blue}">TypeScript</tspan> · <tspan fill="${t.yellow}">Python</tspan> · <tspan fill="${t.red}">Rust</tspan> · AWS · Azure   utf-8   51.1°N 17.0°E</text>`,
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hüseyin Tunay Çelik: full-stack engineer, AI researcher and agent orchestrator, bug hunter. Thesis on automated incident response under Zero Trust on Azure. Open to full-time roles.">
<style>
.caret{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion: reduce){.caret{animation:none}}
</style>
<defs><clipPath id="win"><rect x="0" y="${BODY_TOP + 6}" width="${W}" height="${TOP + (VISIBLE - 1) * LH + 6 - (BODY_TOP + 6)}"/></clipPath>
<clipPath id="frame"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10"/></clipPath></defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${t.bg}"/>
<rect width="${W}" height="34" fill="${t.bar}"/>
<line x1="0" y1="34.5" x2="${W}" y2="34.5" stroke="${t.line}"/>
<circle cx="18" cy="17" r="5.5" fill="#ff5f57"/><circle cx="36" cy="17" r="5.5" fill="#febc2e"/><circle cx="54" cy="17" r="5.5" fill="#28c840"/>
<text x="${W / 2}" y="21.5" text-anchor="middle" fill="${t.muted}" font-family="${MONO}" font-size="12">Hüseyin Tunay Çelik — ~/github/Tunaycel — zsh</text>
<g clip-path="url(#win)"><g>${scroll}
${body}
</g></g>
${status}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${t.line}"/>
</svg>
`;
}

// ---------- link buttons ----------

const ICONS = {
  portfolio: (t) => `<circle cx="12" cy="12" r="9.5" fill="none" stroke="${t.accent}" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="4.2" ry="9.5" fill="none" stroke="${t.accent}" stroke-width="1.6"/><path d="M2.8 9h18.4M2.8 15h18.4" stroke="${t.accent}" stroke-width="1.6"/>`,
  linkedin: () => `<rect width="24" height="24" rx="4.5" fill="#0A66C2"/><circle cx="7" cy="6.9" r="1.95" fill="#fff"/><rect x="5.3" y="9.6" width="3.4" height="9.6" fill="#fff"/><path d="M10.7 9.6h3.25v1.4c.5-.9 1.6-1.65 3.2-1.65 3.1 0 3.65 2 3.65 4.65v5.2h-3.4v-4.6c0-1.1 0-2.5-1.5-2.5s-1.75 1.2-1.75 2.4v4.7h-3.45z" fill="#fff"/>`,
  email: () => `<g transform="translate(0 1.5)"><path d="M1.636 21.002h3.819V11.73L0 7.64v11.726c0 .904.732 1.636 1.636 1.636z" fill="#4285F4"/><path d="M18.545 21.002h3.819c.904 0 1.636-.732 1.636-1.636V7.64l-5.455 4.09z" fill="#34A853"/><path d="M18.545 4.638v7.092L24 7.64V5.457c0-2.023-2.309-3.178-3.927-1.964z" fill="#FBBC04"/><path d="M5.455 11.73V4.64L12 9.548l6.545-4.91v7.092L12 16.64z" fill="#EA4335"/><path d="M0 5.457V7.64l5.455 4.09V4.64L3.927 3.493C2.309 2.28 0 3.434 0 5.457z" fill="#C5221F"/></g>`,
  oracle: () => `<path d="M16.412 4.412h-8.82a7.588 7.588 0 0 0-.008 15.176h8.828a7.588 7.588 0 0 0 0-15.176zm-.193 12.502H7.786a4.915 4.915 0 0 1 0-9.828h8.433a4.914 4.914 0 1 1 0 9.828z" fill="#C74634"/>`,
};
const BUTTONS = {
  portfolio: ['Portfolio', 'huseyintunaycelik.xyz'],
  linkedin: ['LinkedIn', 'huseyin-tunay-celik'],
  email: ['Email', 'h.tunay.celik@gmail.com'],
  oracle: ['Oracle Cloud', 'OCI 2025 Foundations'],
};

function buttonSvg(t, key) {
  const [label, value] = BUTTONS[key];
  const W = 206;
  const H = 56;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${label}: ${value}`)}">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.panel}" stroke="${t.line}"/>
<g transform="translate(14 16)">${ICONS[key](t)}</g>
<text x="50" y="24" fill="${t.muted}" font-family="${FONT}" font-size="11.5">${esc(label)}</text>
<text x="50" y="41" fill="${t.text}" font-family="${FONT}" font-size="12.5" font-weight="600">${esc(value)}</text>
</svg>
`;
}

function metricsSvg(t, m) {
  const W = 840;
  const H = 360;
  const tiles = [
    [fmt(m.mergedPrs), 'merged pull requests', 'public repositories'],
    [fmt(m.ossMerged), 'merged upstream', `${m.ossRepos} ${m.ossRepos === 1 ? 'project' : 'projects'} · ${fmt(m.ossStars)} stars`],
    [fmt(m.contributions), 'contributions', 'last 12 months'],
    [fmt(m.medianPr), 'median lines per PR', 'small, reviewable changes'],
  ];
  const tw = (W - 48 - 3 * 12) / 4;
  const tileSvg = tiles
    .map(([v, label, sub], i) => {
      const x = 24 + i * (tw + 12);
      return `<g transform="translate(${x},24)">
<rect width="${tw}" height="96" rx="10" fill="${t.panel}" stroke="${t.line}"/>
<text x="16" y="42" fill="${t.text}" font-family="${FONT}" font-size="28" font-weight="700">${esc(v)}</text>
<text x="16" y="64" fill="${t.text}" font-family="${FONT}" font-size="13">${esc(label)}</text>
<text x="16" y="82" fill="${t.muted}" font-family="${FONT}" font-size="11.5">${esc(sub)}</text>
</g>`;
    })
    .join('');

  const weeks = m.weekly;
  const max = Math.max(1, ...weeks);
  const chartX = 24;
  const chartY = 160;
  const chartW = W - 48;
  const chartH = 72;
  const bw = chartW / weeks.length;
  const bars = weeks
    .map((v, i) => {
      const h = v === 0 ? 2 : Math.max(3, (v / max) * chartH);
      return `<rect x="${(chartX + i * bw + 1).toFixed(1)}" y="${(chartY + chartH - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${v === 0 ? t.line : t.bar}"/>`;
    })
    .join('');

  let lx = 24;
  const langY = 290;
  const segs = m.langs
    .map((l) => {
      const w = Math.max(2, l.share * (W - 48));
      const r = `<rect x="${lx.toFixed(1)}" y="${langY}" width="${w.toFixed(1)}" height="10" fill="${l.color}"/>`;
      lx += w;
      return r;
    })
    .join('');
  let gx = 24;
  const legend = m.langs
    .map((l) => {
      const label = `${l.name} ${(l.share * 100).toFixed(1)}%`;
      const g = `<circle cx="${gx + 5}" cy="${langY + 30}" r="5" fill="${l.color}"/><text x="${gx + 15}" y="${langY + 34}" fill="${t.text}" font-family="${FONT}" font-size="12">${esc(label)}</text>`;
      gx += 26 + label.length * 6.6;
      return g;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub engineering metrics">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.bg}" stroke="${t.line}"/>
${tileSvg}
<text x="24" y="148" fill="${t.text}" font-family="${FONT}" font-size="13" font-weight="600">Weekly activity</text>
<text x="${W - 24}" y="148" text-anchor="end" fill="${t.muted}" font-family="${FONT}" font-size="12">${m.activeDays} active days · longest streak ${m.longest} days</text>
${bars}
<text x="24" y="278" fill="${t.text}" font-family="${FONT}" font-size="13" font-weight="600">Languages in my public repositories</text>
<clipPath id="lb"><rect x="24" y="${langY}" width="${W - 48}" height="10" rx="5"/></clipPath>
<g clip-path="url(#lb)">${segs}</g>
${legend}
<text x="${W - 24}" y="${H - 14}" text-anchor="end" fill="${t.muted}" font-family="${FONT}" font-size="10.5">updated ${m.updated} from the GitHub API</text>
</svg>
`;
}

// ---------- README section ----------

function ossSection(merged, open) {
  const byRepo = new Map();
  for (const pr of merged) {
    const k = pr.repository.nameWithOwner;
    if (!byRepo.has(k)) byRepo.set(k, { repo: pr.repository, prs: [] });
    byRepo.get(k).prs.push(pr);
  }
  const rows = [...byRepo.values()]
    .sort((a, b) => b.repo.stargazerCount - a.repo.stargazerCount || b.prs.length - a.prs.length)
    .map(({ repo, prs }) => {
      prs.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
      const work = prs
        .slice(0, 3)
        .map((p) => `[${p.title.replace(/[|[\]]/g, '\\$&')}](${p.url})`)
        .join('<br>');
      return `| [**${repo.nameWithOwner}**](${repo.url}) | ★ ${fmt(repo.stargazerCount)} | ${prs.length} | ${work} |`;
    });
  const lines = [
    '| Project | Stars | Merged PRs | Recent work |',
    '|---|---:|---:|---|',
    ...rows,
  ];
  if (open.length) {
    lines.push('', '**In review**', '');
    for (const p of open.sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      lines.push(`- [${p.repository.nameWithOwner}](${p.repository.url}): [${p.title.replace(/[[\]]/g, '\\$&')}](${p.url})`);
    }
  }
  return lines.join('\n');
}

function replaceBetween(text, tag, body) {
  const re = new RegExp(`(<!-- ${tag}:START -->)[\\s\\S]*?(<!-- ${tag}:END -->)`);
  if (!re.test(text)) throw new Error(`README is missing the ${tag} markers`);
  return text.replace(re, `$1\n${body}\n$2`);
}

// ---------- main ----------

const [user, merged, openExternal] = await Promise.all([
  profile(),
  searchPrs(`author:${LOGIN} is:pr is:merged is:public`),
  searchPrs(`author:${LOGIN} is:pr is:open is:public -user:${LOGIN}`),
]);

const external = merged.filter((p) => p.repository.owner.login.toLowerCase() !== LOGIN.toLowerCase());
const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
const metrics = {
  mergedPrs: merged.length,
  ossMerged: external.length,
  ossRepos: new Set(external.map((p) => p.repository.nameWithOwner)).size,
  ossStars: [...new Map(external.map((p) => [p.repository.nameWithOwner, p.repository.stargazerCount])).values()].reduce((a, b) => a + b, 0),
  contributions: user.contributionsCollection.contributionCalendar.totalContributions,
  medianPr: median(merged.map((p) => p.additions + p.deletions)),
  weekly: user.contributionsCollection.contributionCalendar.weeks.map((w) =>
    w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
  ),
  activeDays: days.filter((d) => d.contributionCount > 0).length,
  longest: streaks(days),
  langs: languages(user.repositories.nodes),
  updated: new Date().toISOString().slice(0, 10),
};

await mkdir('assets', { recursive: true });
await writeFile('assets/header.svg', headerSvg());
for (const key of Object.keys(BUTTONS)) await writeFile(`assets/btn-${key}.svg`, buttonSvg(THEMES.dark, key));
for (const [name, theme] of Object.entries(THEMES)) {
  await writeFile(`assets/metrics-${name}.svg`, metricsSvg(theme, metrics));
}

const readme = await readFile('README.md', 'utf8');
await writeFile('README.md', replaceBetween(readme, 'OSS', ossSection(external, openExternal)));

console.log(JSON.stringify({ ...metrics, weekly: undefined, langs: metrics.langs.map((l) => l.name) }));
