#!/usr/bin/env node
// Generates the static catalog site for the marketplace from the repository
// contents. Plain Node ESM, no external dependencies. Output: _site/.
//
//   _site/index.html                          — catalog with search + filters
//   _site/<plugin>/index.html                 — plugin page (README + components)
//   _site/<plugin>/<type>s/<name>/index.html   — component page (full content)
//   _site/api/index.json                      — machine-readable catalog
//   _site/assets/{style.css,app.js}           — shared assets
//
// The build FAILS (exit 1) on catalog quality violations — missing
// descriptions or versions, duplicate ids — so CI never deploys a degraded
// catalog.
//
// Usage: node scripts/build-site.mjs

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "_site");
const REPO = process.env.GITHUB_REPOSITORY ?? "ViacheslavKlavdiiev/claude-market";
const SCHEMA_VERSION = 1;

const TYPES = {
  skill: { dir: "skills", label: "Skill" },
  command: { dir: "commands", label: "Command" },
  agent: { dir: "agents", label: "Agent" },
};

// ─── utilities ────────────────────────────────────────────────────────────────

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

async function listDirs(path) {
  try {
    const e = await readdir(path, { withFileTypes: true });
    return e.filter((x) => x.isDirectory()).map((x) => x.name);
  } catch {
    return [];
  }
}

async function listMdFiles(path) {
  try {
    const e = await readdir(path, { withFileTypes: true });
    return e
      .filter((x) => x.isFile() && x.name.toLowerCase().endsWith(".md"))
      .map((x) => x.name);
  } catch {
    return [];
  }
}

/** Recursively lists files under `path`, returning repo-relative-to-`path` names. */
async function walkFiles(path, base = path) {
  const out = [];
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = join(path, e.name);
    if (e.isDirectory()) out.push(...(await walkFiles(abs, base)));
    else if (e.isFile()) out.push(relative(base, abs).split("\\").join("/"));
  }
  return out.sort();
}

/** Last commit date (YYYY-MM-DD) for a repo-relative path, or null. */
function gitDate(relPath) {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", relPath],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

// ─── build-time markdown parser (no dependencies) ────────────────────────────

function parseFrontmatter(raw) {
  const text = raw.replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) {
      let v = kv[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      data[kv[1]] = v;
    }
  }
  return { data, body: text.slice(m[0].length) };
}

function renderInline(text) {
  const codes = [];
  let t = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return ` ${codes.length - 1} `;
  });
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safe = /^(https?:|mailto:|\/|\.\/|#)/i.test(url) ? url : "#";
    return `<a href="${safe.replaceAll('"', "&quot;")}">${label}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  t = t.replace(/ (\d+) /g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  return t;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let para = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${renderInline(para.join(" "))}</p>`);
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      flush();
      i++;
      const buf = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre class="code"><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${renderInline(h[2].trim())}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flush();
      out.push("<hr>");
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderMarkdown(buf.join("\n"))}</blockquote>`);
      continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      out.push(renderTable(rows));
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push(`<ul>${items.map((t) => `<li>${renderInline(t)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(`<ol>${items.map((t) => `<li>${renderInline(t)}</li>`).join("")}</ol>`);
      continue;
    }
    if (line.trim() === "") {
      flush();
      i++;
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flush();
  return out.join("\n");
}

function renderTable(rows) {
  const cells = (r) =>
    r.replace(/^\||\|\s*$/g, "").split("|").map((c) => c.trim());
  const head = cells(rows[0]);
  const bodyRows = rows.slice(2).map(cells);
  const th = head.map((c) => `<th>${renderInline(c)}</th>`).join("");
  const trs = bodyRows
    .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table>\n<thead><tr>${th}</tr></thead>\n<tbody>${trs}</tbody>\n</table>`;
}

/** Renders a file: markdown files as HTML, everything else as a code block. */
function renderFile(name, content) {
  if (/\.md$/i.test(name)) return renderMarkdown(content);
  return `<pre class="code"><code>${esc(content)}</code></pre>`;
}

// ─── data collection ────────────────────────────────────────────────────────

function resolvePluginDir(source, pluginRoot) {
  if (typeof source !== "string" || !source.startsWith("./")) return null;
  const base = pluginRoot ? join(ROOT, pluginRoot) : ROOT;
  return join(base, source.slice(2));
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return value
    ? String(value).split(",").map((s) => s.trim()).filter(Boolean)
    : [];
}

async function collectComponents(plugin, dir, category) {
  const items = [];

  for (const name of await listDirs(join(dir, "skills"))) {
    const skillDir = join(dir, "skills", name);
    const raw = await readText(join(skillDir, "SKILL.md"));
    if (raw == null) continue;
    const { data, body } = parseFrontmatter(raw);
    const extras = [];
    for (const rel of await walkFiles(skillDir)) {
      if (rel === "SKILL.md") continue;
      const content = await readText(join(skillDir, rel));
      if (content != null) extras.push({ name: rel, html: renderFile(rel, content) });
    }
    items.push(
      makeComponent("skill", plugin, data.name || name, data, body, category, {
        primaryFile: `${relative(ROOT, skillDir)}/SKILL.md`,
        extras,
      }),
    );
  }

  for (const file of await listMdFiles(join(dir, "commands"))) {
    const raw = await readText(join(dir, "commands", file));
    if (raw == null) continue;
    const { data, body } = parseFrontmatter(raw);
    items.push(
      makeComponent("command", plugin, file.replace(/\.md$/i, ""), data, body, category, {
        primaryFile: relative(ROOT, join(dir, "commands", file)),
        extras: [],
      }),
    );
  }

  for (const file of await listMdFiles(join(dir, "agents"))) {
    const raw = await readText(join(dir, "agents", file));
    if (raw == null) continue;
    const { data, body } = parseFrontmatter(raw);
    items.push(
      makeComponent("agent", plugin, data.name || file.replace(/\.md$/i, ""), data, body, category, {
        primaryFile: relative(ROOT, join(dir, "agents", file)),
        extras: [],
      }),
    );
  }

  return items;
}

function makeComponent(type, plugin, name, data, body, category, extra) {
  const t = TYPES[type];
  return {
    type,
    plugin,
    name,
    category,
    description: data.description ?? "",
    tags: splitList(data.tags ?? data.keywords),
    frontmatter: data,
    bodyHtml: renderMarkdown(body),
    extras: extra.extras,
    lastModified: gitDate(extra.primaryFile.split("\\").join("/")),
    url: `${plugin}/${t.dir}/${name}/`,
  };
}

// ─── quality gate ─────────────────────────────────────────────────────────────

function validate(plugins, components) {
  const errors = [];

  const seenPlugin = new Set();
  for (const p of plugins) {
    if (!p.name) {
      errors.push("a plugin entry is missing `name`");
      continue;
    }
    if (seenPlugin.has(p.name)) errors.push(`duplicate plugin name "${p.name}"`);
    seenPlugin.add(p.name);
    if (!p.description) errors.push(`plugin "${p.name}" is missing a description`);
    if (!/^\d+\.\d+\.\d+$/.test(p.version ?? "")) {
      errors.push(`plugin "${p.name}" has no valid SemVer version (got "${p.version ?? ""}")`);
    }
  }

  const seenComp = new Set();
  for (const c of components) {
    const id = `${c.plugin}/${c.type}/${c.name}`;
    if (seenComp.has(id)) errors.push(`duplicate component "${id}"`);
    seenComp.add(id);
    if (!c.description) errors.push(`component "${id}" is missing a description`);
  }

  return errors;
}

// ─── page templates ───────────────────────────────────────────────────────────

function typeBadge(type) {
  return `<span class="badge badge-${type}">${TYPES[type].label}</span>`;
}

function updated(date) {
  return date ? `<span class="updated">updated ${esc(date)}</span>` : "";
}

function layout({ title, prefix, body, bodyClass = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="${prefix}assets/style.css" />
  <script>
    (function () {
      try {
        var t = localStorage.getItem("theme");
        if (t) document.documentElement.dataset.theme = t;
      } catch (e) {}
    })();
  </script>
</head>
<body class="${bodyClass}">
  <header class="topbar">
    <a class="brand" href="${prefix}index.html">claude-market</a>
    <div class="topbar-right">
      <a class="ghlink" href="https://github.com/${esc(REPO)}" target="_blank" rel="noopener">GitHub</a>
      <a class="ghlink" href="${prefix}api/index.json">API</a>
      <button class="theme-toggle" type="button" aria-label="Toggle theme">◐</button>
    </div>
  </header>
  ${body}
  <footer class="site-footer">
    Generated from <code>.claude-plugin/marketplace.json</code> and plugin contents.
  </footer>
  <script src="${prefix}assets/app.js"></script>
</body>
</html>
`;
}

function renderIndex({ marketplace, plugins, components }) {
  const marketName = marketplace.name ?? "claude-market";
  const description = marketplace.description ?? "";
  const addCmd = `/plugin marketplace add ${REPO}`;

  const counts = {
    all: components.length,
    skill: components.filter((c) => c.type === "skill").length,
    command: components.filter((c) => c.type === "command").length,
    agent: components.filter((c) => c.type === "agent").length,
  };

  const pill = (filter, label, n) =>
    `<button class="pill${filter === "all" ? " active" : ""}" data-filter="${filter}">${esc(label)} <span class="pill-count">${n}</span></button>`;

  const categories = [...new Set(components.map((c) => c.category).filter(Boolean))].sort();
  const categorySelect =
    categories.length > 1
      ? `<select id="category" class="category-select" aria-label="Filter by category">
        <option value="all">All categories</option>
        ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
      </select>`
      : "";

  const cards = components
    .map((c) => {
      const search = [c.name, c.description, c.plugin, c.category, ...c.tags]
        .join(" ")
        .toLowerCase();
      const tags = c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      return `
      <a class="card" href="${esc(c.url)}" data-type="${c.type}" data-category="${esc(c.category)}" data-search="${esc(search)}">
        <div class="card-top">${typeBadge(c.type)}<span class="card-plugin">${esc(c.plugin)}</span></div>
        <h3 class="card-title">${esc(c.name)}</h3>
        ${c.description ? `<p class="card-desc">${esc(c.description)}</p>` : ""}
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        <div class="card-foot">${updated(c.lastModified)}</div>
      </a>`;
    })
    .join("\n");

  const body = `
  <main class="wrap">
    <section class="hero">
      <h1>${esc(marketName)}</h1>
      ${description ? `<p class="lead">${esc(description)}</p>` : ""}
      <div class="add-block">
        <span class="add-label">Add to Claude Code</span>
        <code class="add-cmd">${esc(addCmd)}</code>
      </div>
    </section>

    <section class="controls">
      <input id="search" class="search" type="search" placeholder="Search by name, description, tags…" autocomplete="off" />
      <div class="filters">
        <div class="pills">
          ${pill("all", "All", counts.all)}
          ${pill("skill", "Skills", counts.skill)}
          ${pill("command", "Commands", counts.command)}
          ${pill("agent", "Agents", counts.agent)}
        </div>
        ${categorySelect}
      </div>
    </section>

    <section id="grid" class="grid">
${cards}
    </section>
    <p id="empty" class="empty" hidden>No matches. Try a different query or clear the filters.</p>
  </main>`;

  return layout({
    title: `${marketName} — Claude Code plugin marketplace`,
    prefix: "",
    body,
    bodyClass: "page-index",
  });
}

function renderPluginPage(plugin, comps, readmeHtml) {
  const prefix = "../";
  const install = `/plugin install ${plugin.name}@claude-market`;
  const compList = comps
    .map(
      (c) => `
      <a class="card" href="../${esc(c.url)}">
        <div class="card-top">${typeBadge(c.type)}</div>
        <h3 class="card-title">${esc(c.name)}</h3>
        ${c.description ? `<p class="card-desc">${esc(c.description)}</p>` : ""}
      </a>`,
    )
    .join("\n");

  const body = `
  <main class="wrap detail">
    <nav class="crumbs"><a href="${prefix}index.html">← All components</a></nav>
    <div class="detail-head">
      <h1>${esc(plugin.name)}</h1>
      ${plugin.version ? `<span class="ver">v${esc(plugin.version)}</span>` : ""}
      ${plugin.description ? `<p class="lead">${esc(plugin.description)}</p>` : ""}
    </div>
    <div class="usage">
      <div class="usage-row"><span class="usage-label">Install</span><code>${esc(install)}</code></div>
    </div>
    <h2>Components</h2>
    <div class="grid">${compList}</div>
    ${readmeHtml ? `<article class="prose">${readmeHtml}</article>` : ""}
  </main>`;

  return layout({
    title: `${plugin.name} — claude-market`,
    prefix,
    body,
    bodyClass: "page-detail",
  });
}

function renderComponentPage(c) {
  const prefix = "../../../";
  const install = `/plugin install ${c.plugin}@claude-market`;
  const invoke = c.type === "agent" ? `Subagent: ${c.name}` : `/${c.plugin}:${c.name}`;

  const fmRows = Object.entries(c.frontmatter)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join("");
  const tags = c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");

  const extras = c.extras.length
    ? `<section class="extras"><h2>Files</h2>${c.extras
        .map(
          (f) =>
            `<details class="file"><summary><code>${esc(f.name)}</code></summary><div class="prose">${f.html}</div></details>`,
        )
        .join("")}</section>`
    : "";

  const body = `
  <main class="wrap detail">
    <nav class="crumbs"><a href="${prefix}index.html">← All components</a> · <a href="../../">${esc(c.plugin)}</a></nav>
    <div class="detail-head">
      <div class="detail-top">${typeBadge(c.type)}<span class="card-plugin">${esc(c.plugin)}</span>${updated(c.lastModified)}</div>
      <h1>${esc(c.name)}</h1>
      ${c.description ? `<p class="lead">${esc(c.description)}</p>` : ""}
      ${tags ? `<div class="tags">${tags}</div>` : ""}
    </div>

    <div class="usage">
      <div class="usage-row"><span class="usage-label">Install</span><code>${esc(install)}</code></div>
      <div class="usage-row"><span class="usage-label">Invoke</span><code>${esc(invoke)}</code></div>
    </div>

    ${fmRows ? `<details class="frontmatter"><summary>frontmatter</summary><table>${fmRows}</table></details>` : ""}

    <article class="prose">
${c.bodyHtml}
    </article>
    ${extras}
  </main>`;

  return layout({
    title: `${c.name} — ${TYPES[c.type].label} · claude-market`,
    prefix,
    body,
    bodyClass: "page-detail",
  });
}

// ─── static assets ─────────────────────────────────────────────────────────────

const STYLE = `
:root {
  --bg: #ffffff; --fg: #17171a; --muted: #6b6b73; --card: #fbfbfc;
  --card-hover: #f4f4f6; --border: #e5e5e9; --accent: #c15f3c;
  --code-bg: #1c1c22; --code-fg: #e8e8ea; --radius: 14px;
  --skill: #c15f3c; --command: #2f7d8a; --agent: #6d5bd0;
}
:root[data-theme="dark"] {
  --bg: #131317; --fg: #e9e9ec; --muted: #9a9aa4; --card: #1c1c22;
  --card-hover: #24242c; --border: #2c2c34; --accent: #e08050;
  --code-bg: #0c0c0f; --code-fg: #e8e8ea;
  --skill: #e08050; --command: #52b5c4; --agent: #9d8cf0;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #131317; --fg: #e9e9ec; --muted: #9a9aa4; --card: #1c1c22;
    --card-hover: #24242c; --border: #2c2c34; --accent: #e08050;
    --code-bg: #0c0c0f; --code-fg: #e8e8ea;
    --skill: #e08050; --command: #52b5c4; --agent: #9d8cf0;
  }
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html { scroll-behavior: smooth; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code, pre { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }

.topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: .75rem 1.25rem; background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(10px); border-bottom: 1px solid var(--border);
}
.brand { font-weight: 700; letter-spacing: -.01em; color: var(--fg); }
.topbar-right { display: flex; align-items: center; gap: 1rem; }
.ghlink { color: var(--muted); font-size: .9rem; }
.theme-toggle {
  border: 1px solid var(--border); background: var(--card); color: var(--fg);
  width: 34px; height: 34px; border-radius: 9px; cursor: pointer; font-size: 1rem;
}
.theme-toggle:hover { background: var(--card-hover); }

.wrap { max-width: 960px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }

.hero h1 { font-size: 2.1rem; margin: 0 0 .4rem; letter-spacing: -.025em; }
.hero .lead { color: var(--muted); font-size: 1.1rem; margin: 0 0 1.5rem; max-width: 620px; }
.add-block {
  display: inline-flex; align-items: center; gap: .75rem; flex-wrap: wrap;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 10px; padding: .5rem .75rem;
}
.add-label { font-size: .85rem; color: var(--muted); }
.add-cmd { background: var(--code-bg); color: var(--code-fg); padding: .4rem .7rem; border-radius: 7px; font-size: .85rem; }

.controls { position: sticky; top: 57px; z-index: 5; padding: 1.5rem 0 1rem; margin-top: 1.5rem; background: var(--bg); }
.search {
  width: 100%; padding: .8rem 1rem; font-size: 1rem;
  background: var(--card); color: var(--fg);
  border: 1px solid var(--border); border-radius: 10px; outline: none;
}
.search:focus { border-color: var(--accent); }
.filters { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: .85rem; }
.pills { display: flex; flex-wrap: wrap; gap: .5rem; }
.pill {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .4rem .8rem; border-radius: 999px; cursor: pointer;
  background: var(--card); color: var(--fg); border: 1px solid var(--border);
  font-size: .9rem;
}
.pill:hover { background: var(--card-hover); }
.pill.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
.pill-count { font-size: .78rem; opacity: .65; }
.category-select {
  padding: .4rem .7rem; border-radius: 9px; background: var(--card); color: var(--fg);
  border: 1px solid var(--border); font-size: .9rem; cursor: pointer;
}

.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
.card {
  display: flex; flex-direction: column; color: var(--fg); background: var(--card);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.15rem 1.25rem; transition: border-color .15s, background .15s, transform .1s;
}
.card:hover { text-decoration: none; background: var(--card-hover); border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); transform: translateY(-1px); }
.card-top, .detail-top { display: flex; align-items: center; gap: .6rem; margin-bottom: .6rem; }
.card-plugin { font-size: .78rem; color: var(--muted); }
.card-title { margin: 0 0 .4rem; font-size: 1.1rem; }
.card-desc { margin: 0 0 .8rem; color: var(--muted); font-size: .92rem; }
.card-foot { margin-top: auto; }
.updated { font-size: .72rem; color: var(--muted); }

.badge {
  font-size: .72rem; font-weight: 600; padding: .12rem .5rem; border-radius: 999px;
  color: #fff; letter-spacing: .01em;
}
.badge-skill { background: var(--skill); }
.badge-command { background: var(--command); }
.badge-agent { background: var(--agent); }

.tags { display: flex; flex-wrap: wrap; gap: .35rem; margin-bottom: .6rem; }
.tag { font-size: .72rem; background: var(--border); color: var(--fg); padding: .12rem .5rem; border-radius: 999px; }

.empty { color: var(--muted); text-align: center; padding: 3rem 0; }

.crumbs { margin-bottom: 1.5rem; font-size: .9rem; }
.detail-head h1 { margin: .5rem 0 .5rem; font-size: 1.9rem; letter-spacing: -.02em; display: inline; }
.detail-head .ver { margin-left: .5rem; font-size: .9rem; color: var(--muted); }
.detail-head .lead { color: var(--muted); font-size: 1.05rem; margin: .6rem 0 .9rem; }
.usage { display: grid; gap: .5rem; margin: 1.5rem 0; padding: 1rem 1.15rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; }
.usage-row { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.usage-label { font-size: .8rem; color: var(--muted); min-width: 64px; }
.usage-row code { background: var(--code-bg); color: var(--code-fg); padding: .35rem .65rem; border-radius: 7px; font-size: .85rem; }
.frontmatter, .file { margin: 1.25rem 0; border: 1px solid var(--border); border-radius: 10px; padding: .5rem 1rem; }
.frontmatter summary, .file summary { cursor: pointer; color: var(--muted); font-size: .9rem; }
.frontmatter table { width: 100%; border-collapse: collapse; margin-top: .5rem; font-size: .9rem; }
.frontmatter th { text-align: left; padding: .3rem .75rem .3rem 0; color: var(--muted); font-weight: 500; vertical-align: top; white-space: nowrap; }
.frontmatter td { padding: .3rem 0; }
.extras h2 { font-size: 1.2rem; margin-top: 2.5rem; }

.prose { margin-top: 1rem; }
.prose h1, .prose h2, .prose h3 { letter-spacing: -.01em; margin: 1.8rem 0 .7rem; }
.prose h1 { font-size: 1.5rem; }
.prose h2 { font-size: 1.25rem; }
.prose h3 { font-size: 1.08rem; }
.prose p { margin: .8rem 0; }
.prose ul, .prose ol { margin: .8rem 0; padding-left: 1.4rem; }
.prose li { margin: .3rem 0; }
.prose code { background: var(--card-hover); padding: .1rem .35rem; border-radius: 5px; font-size: .88em; }
.prose pre.code { background: var(--code-bg); color: var(--code-fg); padding: 1rem 1.15rem; border-radius: 10px; overflow-x: auto; }
.prose pre.code code { background: none; padding: 0; }
.prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .92rem; display: block; overflow-x: auto; }
.prose th, .prose td { border: 1px solid var(--border); padding: .45rem .7rem; text-align: left; }
.prose blockquote { margin: 1rem 0; padding: .1rem 1rem; border-left: 3px solid var(--border); color: var(--muted); }
.prose hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
.prose a { text-decoration: underline; }

.site-footer { max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem; border-top: 1px solid var(--border); color: var(--muted); font-size: .85rem; }
`;

const APP_JS = `
(function () {
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var cur = document.documentElement.dataset.theme;
      var next = cur === "dark" ? "light"
        : cur === "light" ? "dark"
        : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  var search = document.getElementById("search");
  if (!search) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var pills = Array.prototype.slice.call(document.querySelectorAll(".pill"));
  var category = document.getElementById("category");
  var empty = document.getElementById("empty");
  var activeType = "all";

  function apply() {
    var q = search.value.trim().toLowerCase();
    var cat = category ? category.value : "all";
    var visible = 0;
    cards.forEach(function (card) {
      var okType = activeType === "all" || card.getAttribute("data-type") === activeType;
      var okCat = cat === "all" || card.getAttribute("data-category") === cat;
      var okText = !q || (card.getAttribute("data-search") || "").indexOf(q) !== -1;
      var show = okType && okCat && okText;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  search.addEventListener("input", apply);
  if (category) category.addEventListener("change", apply);
  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      pills.forEach(function (p) { p.classList.remove("active"); });
      pill.classList.add("active");
      activeType = pill.getAttribute("data-filter");
      apply();
    });
  });
})();
`;

// ─── API catalog ────────────────────────────────────────────────────────────

function buildApi(marketplace, pluginMap, components) {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString().slice(0, 10),
    repo: REPO,
    marketplace: {
      name: marketplace.name,
      description: marketplace.description ?? "",
      version: marketplace.metadata?.version ?? null,
      owner: marketplace.owner ?? null,
    },
    plugins: [...pluginMap.values()].map((p) => ({
      name: p.name,
      description: p.description ?? "",
      version: p.version ?? null,
      category: p.category ?? null,
      keywords: p.keywords ?? [],
      author: p.author ?? null,
      url: `${p.name}/`,
      components: components
        .filter((c) => c.plugin === p.name)
        .map((c) => ({
          type: c.type,
          name: c.name,
          description: c.description,
          tags: c.tags,
          url: c.url,
          lastModified: c.lastModified,
        })),
    })),
  };
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const marketplace = await readJson(
    join(ROOT, ".claude-plugin", "marketplace.json"),
  );
  if (!marketplace) {
    console.error("Could not read .claude-plugin/marketplace.json");
    process.exit(1);
  }
  const pluginRoot = marketplace.metadata?.pluginRoot;
  const entries = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];

  const pluginMap = new Map();
  const components = [];
  for (const e of entries) {
    if (!e?.name) {
      pluginMap.set(Symbol(), { name: undefined, description: e?.description });
      continue;
    }
    const dir = resolvePluginDir(e.source, pluginRoot);
    const manifest = dir ? await readJson(join(dir, ".claude-plugin", "plugin.json")) : null;
    const category = e.category ?? manifest?.category ?? "";
    const plugin = {
      name: e.name,
      description: e.description ?? manifest?.description ?? "",
      version: manifest?.version ?? e.version ?? null,
      category,
      keywords: splitList(e.keywords ?? manifest?.keywords),
      author: e.author ?? manifest?.author ?? null,
      dir,
    };
    pluginMap.set(e.name, plugin);
    if (dir && existsSync(dir)) {
      components.push(...(await collectComponents(e.name, dir, category)));
    }
  }
  components.sort(
    (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
  );

  // Quality gate — fail the build before writing anything.
  const errors = validate(
    [...pluginMap.values()].filter((p) => p.name !== undefined),
    components,
  );
  if (errors.length) {
    console.error("Catalog quality check failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // Assets
  await mkdir(join(OUT_DIR, "assets"), { recursive: true });
  await writeFile(join(OUT_DIR, "assets", "style.css"), STYLE.trim() + "\n", "utf8");
  await writeFile(join(OUT_DIR, "assets", "app.js"), APP_JS.trim() + "\n", "utf8");

  // Index
  await writeFile(
    join(OUT_DIR, "index.html"),
    renderIndex({ marketplace, plugins: [...pluginMap.values()], components }),
    "utf8",
  );

  // Plugin pages
  for (const p of pluginMap.values()) {
    if (!p.name || !p.dir) continue;
    const readme = await readText(join(p.dir, "README.md"));
    const readmeHtml = readme ? renderMarkdown(parseFrontmatter(readme).body) : "";
    const comps = components.filter((c) => c.plugin === p.name);
    const outPath = join(OUT_DIR, p.name, "index.html");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, renderPluginPage(p, comps, readmeHtml), "utf8");
  }

  // Component pages
  for (const c of components) {
    const outPath = join(OUT_DIR, c.url, "index.html");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, renderComponentPage(c), "utf8");
  }

  // API catalog
  await mkdir(join(OUT_DIR, "api"), { recursive: true });
  await writeFile(
    join(OUT_DIR, "api", "index.json"),
    JSON.stringify(buildApi(marketplace, pluginMap, components), null, 2) + "\n",
    "utf8",
  );

  console.log(
    `Site built: _site/ (${pluginMap.size} plugin(s), ${components.length} component(s): ` +
      `${components.filter((c) => c.type === "skill").length} skill, ` +
      `${components.filter((c) => c.type === "command").length} command, ` +
      `${components.filter((c) => c.type === "agent").length} agent)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
