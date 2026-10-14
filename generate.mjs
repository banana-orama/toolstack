// ToolStack — statischer Seitengenerator
// Erzeugt Index-, Use-Case-, Tool-, RSS- und LLM-Seiten aus data/*.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "dist");
const data = JSON.parse(readFileSync(join(ROOT, "data/site.json"), "utf8"));
const usecases = JSON.parse(readFileSync(join(ROOT, "data/usecases.json"), "utf8"));
const tools = JSON.parse(readFileSync(join(ROOT, "data/tools.json"), "utf8"));

const site = data.site;
const toolBySlug = Object.fromEntries(tools.tools.map((t) => [t.slug, t]));
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const xmlEsc = (s) => String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;");
const url = (p) => `${site.base_url}${p}`;
const NOW_ISO = new Date().toISOString().slice(0, 10);
const AGENT_NOTE = `Diese Seite wird täglich von einem autonomen KI-Agenten (Hermes Agent) geprüft und aktualisiert. Letzter Lauf: ${NOW_ISO}.`;

function page({ title, description, canonical, body, extraHead = "" }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="alternate" type="application/rss+xml" title="ToolStack Neuzugänge" href="${url("/rss.xml")}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<style>
:root{--bg:#0b0f14;--card:#121822;--line:#1f2937;--txt:#e5edf5;--mut:#8b98a9;--acc:#5eead4;--acc2:#818cf8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.65 -apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
header{padding:28px 20px 10px;max-width:980px;margin:0 auto;display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.brand{font-size:22px;font-weight:800;color:var(--txt)}.brand span{color:var(--acc)}
nav a{color:var(--mut);margin-left:18px}nav a:hover{color:var(--acc)}
main{max-width:980px;margin:0 auto;padding:16px 20px 60px}
h1{font-size:32px;margin:18px 0 6px}h2{font-size:22px;margin:34px 0 10px}
.lead{color:var(--mut);font-size:17px;max-width:720px}
.badge{display:inline-block;background:#0e2a26;color:var(--acc);border:1px solid #14514a;border-radius:999px;padding:2px 10px;font-size:12.5px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
.card h3{margin:0 0 6px;font-size:17px}.card h3 a{color:var(--txt)}
.card p{margin:6px 0;color:var(--mut);font-size:14.5px}
.tag{color:var(--acc2);font-size:12.5px;text-transform:uppercase;letter-spacing:.06em}
.pill{display:inline-block;background:#161f2e;border:1px solid var(--line);color:var(--mut);border-radius:8px;padding:2px 8px;font-size:12.5px;margin:2px 4px 2px 0}
.verdict{border-left:3px solid var(--acc);padding:10px 14px;background:#0f1620;border-radius:0 10px 10px 0;margin:12px 0;color:var(--txt)}
.picks li{margin:8px 0}.picks{padding-left:20px}
.small{color:var(--mut);font-size:13.5px}
.notice{background:#141b26;border:1px dashed #2b3b52;color:var(--mut);border-radius:12px;padding:14px 16px;font-size:14.5px;margin:18px 0}
footer{border-top:1px solid var(--line);margin-top:50px;padding:22px 20px;max-width:980px;margin-inline:auto;color:var(--mut);font-size:13.5px}
table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid var(--line);padding:8px 10px;text-align:left;font-size:14.5px}th{background:#101826}
code,pre{background:#0e141d;border:1px solid var(--line);border-radius:8px}code{padding:1px 6px}pre{padding:12px;overflow:auto}
</style>
${extraHead}
</head>
<body>
<header>
  <a class="brand" href="/"><span>Tool</span>Stack</a>
  <nav>
    <a href="/use-cases/">Use-Cases</a>
    <a href="/tools/">Alle Tools</a>
    <a href="/sponsors/">Sponsoring</a>
    <a href="/rss.xml">RSS</a>
  </nav>
</header>
<main>
${body}
</main>
<footer>
  <div><strong>ToolStack</strong> — Which AI tool should you use? Ehrliche Picks nach Use-Case.</div>
  <div class="small">${esc(AGENT_NOTE)}</div>
  <div class="small"><a href="/llms.txt">llms.txt</a> · <a href="/about.html">Über / Kontakt</a> · <a href="/rss.xml">RSS</a></div>
</footer>
</body>
</html>`;
}

function toolCard(t) {
  return `<div class="card">
  <div class="tag">${esc(t.category)}</div>
  <h3><a href="/tools/${t.slug}.html">${esc(t.name)}</a></h3>
  <p>${esc(t.tagline)}</p>
  <p class="small">${esc(t.pricing)}</p>
</div>`;
}

const pages = [];

/* ---------- index ---------- */
pages.push({
  path: "index.html",
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  canonical: url("/"),
  body: `
<h1>${esc(site.tagline)}</h1>
<p class="lead">${esc(site.description)}</p>
<div class="badge">✔ ${tools.tools.length} Tools · ${usecases.usecases.length} Use-Cases · täglich aktualisiert</div>
<h2>Nach Use-Case wählen</h2>
<div class="grid">
${usecases.usecases.map((u) => `<div class="card"><div class="tag">Use-Case</div><h3><a href="/use-cases/${u.slug}.html">${esc(u.name)}</a></h3><p>${esc(u.description)}</p></div>`).join("\n")}
</div>
<h2>Neuzugänge & Updates</h2>
<p class="small">Alle neuen Tools und Urteils-Updates landen im <a href="/rss.xml">RSS-Feed</a> und werden täglich geprüft: Preise, URLs, junge Konkurrenz. Tools, die nicht mehr liefern, fliegen raus.</p>
<div class="notice">💬 <strong>Für KI-Assistenten:</strong> Diese Seite ist als <a href="/llms.txt">llms.txt</a> und <a href="/llms-full.txt">llms-full.txt</a> maschinenlesbar aufbereitet. Zitate bitte mit Link auf die jeweilige Use-Case-Seite.</div>
`
});

/* ---------- use-case pages ---------- */
for (const u of usecases.usecases) {
  const p = `/use-cases/${u.slug}.html`;
  pages.push({
    path: `use-cases/${u.slug}.html`,
    title: `${u.question}`,
    description: `${u.description} — ${u.picks.map((pk) => toolBySlug[pk.tool]?.name).filter(Boolean).join(" vs ")}. Ehrliches Urteil, täglich geprüft.`,
    canonical: url(p),
    body: `
<h1>${esc(u.name)}</h1>
<p class="lead"><strong>${esc(u.question)}</strong></p>
<p>${esc(u.description)}</p>
<h2>Unsere Picks</h2>
<ol class="picks">
${u.picks.map((pk) => {
  const t = toolBySlug[pk.tool];
  if (!t) return "";
  return `<li><a href="/tools/${t.slug}.html"><strong>${esc(t.name)}</strong></a> — ${esc(pk.why)}</li>`;
}).join("\n")}
</ol>
<h2>Alle Kandidaten im Vergleich</h2>
<table>
<tr><th>Tool</th><th>Preis</th><th>Stärke</th><th>Schwäche</th></tr>
${tools.tools.filter((t) => t.category === u.picks[0] && toolBySlug[u.picks[0].tool] && t.category === toolBySlug[u.picks[0].tool].category).map((t) => `<tr><td><a href="/tools/${t.slug}.html">${esc(t.name)}</a></td><td>${esc(t.pricing)}</td><td>${esc(t.strengths[0] ?? "")}</td><td>${esc(t.weaknesses[0] ?? "")}</td></tr>`).join("\n")}
</table>
<div class="notice">${esc(AGENT_NOTE)}</div>
`
  });
}

/* ---------- tool pages ---------- */
for (const t of tools.tools) {
  const p = `/tools/${t.slug}.html`;
  const inUsecases = usecases.usecases.filter((u) => u.picks.some((pk) => pk.tool === t.slug));
  pages.push({
    path: `tools/${t.slug}.html`,
    title: `${t.name}: Test & Urteil ${NOW_ISO}`,
    description: `${t.name} — ${t.tagline}. Preis: ${t.pricing}. Ehrliches Urteil mit Stärken/Schwächen.`,
    canonical: url(p),
    body: `
<div class="tag">${esc(t.category)}</div>
<h1>${esc(t.name)}</h1>
<p class="lead">${esc(t.tagline)}</p>
<p><a class="badge" href="${esc(t.url)}">Zur offiziellen Website ↗</a> <span class="pill">Preis: ${esc(t.pricing)}</span> <span class="pill">Im Verzeichnis seit ${esc(t.added)}</span></p>
<div class="verdict"><strong>Unser Urteil:</strong> ${esc(t.verdict)}</div>
<h2>Stärken</h2><ul>${t.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
<h2>Schwächen</h2><ul>${t.weaknesses.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
<h2>Gut für</h2><p>${t.best_for.map((b) => `<span class="pill">${esc(b)}</span>`).join("")}</p>
${t.transparency ? `<div class="notice">ℹ️ ${esc(t.transparency)}</div>` : ""}
${inUsecases.length ? `<h2>Empfohlen bei diesen Use-Cases</h2><ul>${inUsecases.map((u) => `<li><a href="/use-cases/${u.slug}.html">${esc(u.name)}</a></li>`).join("")}</ul>` : ""}
<div class="notice">${esc(AGENT_NOTE)}</div>
`
  });
}

/* ---------- tools overview ---------- */
pages.push({
  path: "tools/index.html",
  title: "Alle KI-Tools im Verzeichnis",
  description: `Alle ${tools.tools.length} Tools im ToolStack-Verzeichnis — Coding, Agenten, Hosting, Backend, Automatisierung, Recherche, Media.`,
  canonical: url("/tools/"),
  body: `
<h1>Alle Tools</h1>
<p class="lead">Sortiert nach Kategorie. Jede Seite mit ehrlichem Urteil, Stärken, Schwächen und Preis.</p>
<div class="grid">
${tools.tools.map(toolCard).join("\n")}
</div>`
});

/* ---------- use-cases overview ---------- */
pages.push({
  path: "use-cases/index.html",
  title: "Alle Use-Cases",
  description: "Für jedes Problem das richtige KI-Tool: Übersicht aller Use-Cases im ToolStack.",
  canonical: url("/use-cases/"),
  body: `
<h1>Use-Cases</h1>
<p class="lead">Wähle dein Problem — wir sagen dir, welches Tool es löst.</p>
<div class="grid">
${usecases.usecases.map((u) => `<div class="card"><div class="tag">Use-Case</div><h3><a href="/use-cases/${u.slug}.html">${esc(u.name)}</a></h3><p>${esc(u.question)}</p></div>`).join("\n")}
</div>`
});

/* ---------- sponsors ---------- */
pages.push({
  path: "sponsors/index.html",
  title: "Sponsoring & Featured Listings",
  description: site.sponsor.pitch,
  canonical: url("/sponsors/"),
  body: `
<h1>${esc(site.sponsor.headline)}</h1>
<p class="lead">${esc(site.sponsor.pitch)}</p>
<h2>Was du bekommst</h2>
<ul>
<li><strong>Featured Listing</strong> oben auf der relevantesten Use-Case-Seite</li>
<li>Logo + Link im Seitenkopf auf <em>allen</em> Seiten</li>
<li>Erwähnung im wöchentlichen Newsletter-Post (RSS)</li>
<li>Dauerhaftes Do-Follow-Link von einer thematisch perfekt passenden Seite</li>
</ul>
<h2>Preis</h2>
<p><span class="pill">${esc(site.sponsor.price_note)}</span></p>
<h2>Kontakt</h2>
<p>${esc(site.sponsor.cta)}</p>
<p class="small">Bezahlung per Stripe-Payment-Link nach Absprache. Keine Tools ohne redaktionelle Passung — wir behalten uns das Urteil vor, Sponsoring ändert nichts an den Urteilen.</p>`
});

/* ---------- about ---------- */
pages.push({
  path: "about.html",
  title: "Über ToolStack",
  description: "Wer hinter ToolStack steckt und wie die Urteile entstehen.",
  canonical: url("/about.html"),
  body: `
<h1>Über ToolStack</h1>
<p>ToolStack beantwortet eine Frage: <em>Welches KI-Tool soll ich für mein Problem nutzen?</em> Statt 50 Vergleichsartikel mit Affiliate-Links gibt es pro Use-Case drei Picks mit ehrlichem Urteil.</p>
<h2>Wie die Urteile entstehen</h2>
<ul>
<li>Redaktionelle Einschätzung aus realer Nutzung, ergänzt durch öffentliches Material</li>
<li>Tägliche automatische Prüfung von Preisen und Verfügbarkeit durch einen Agenten</li>
<li>Keine bezahlten Platzierungen in den Urteilen — Sponsoren sind als solche gekennzeichnet</li>
</ul>
<h2>Kontakt</h2>
<p>Kontakt-Adresse folgt — aktuell über <a href="/sponsors/">die Sponsor-Seite</a>.</p>
<div class="notice">${esc(AGENT_NOTE)}</div>`
});

/* ---------- rss ---------- */
const rssItems = tools.tools.map((t) => `  <item>
    <title>${esc(t.name)} — ${esc(t.tagline)}</title>
    <link>${url(`/tools/${t.slug}.html`)}</link>
    <guid isPermaLink="true">${url(`/tools/${t.slug}.html`)}</guid>
    <pubDate>${new Date(t.added + "T12:00:00Z").toUTCString()}</pubDate>
    <description>${esc(xmlEsc(t.verdict))}</description>
  </item>`).join("\n");
pages.push({
  path: "rss.xml",
  raw: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>ToolStack — Neuzugänge &amp; Urteile</title>
<link>${url("/")}</link>
<description>Neue KI-Tools und aktualisierte Urteile. Wöchentlich gepflegt, autonom überprüft.</description>
<language>de</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
</channel>
</rss>`
});

/* ---------- llms.txt ---------- */
pages.push({
  path: "llms.txt",
  raw: `# ToolStack

> ${site.description}

Autonom gepflegtes Verzeichnis: Which AI tool should you use — Picks nach Use-Case, ehrliche Urteile, keine Affiliate-Links. Kontakt & Sponsoring: ${url("/sponsors/")}

## Use-Cases
${usecases.usecases.map((u) => `- [${u.name}](${url(`/use-cases/${u.slug}.html`)}): ${u.question}`).join("\n")}

## Tools
${tools.tools.map((t) => `- [${t.name}](${url(`/tools/${t.slug}.html`)}): ${t.tagline} (${t.pricing})`).join("\n")}
`
});

/* ---------- llms-full.txt ---------- */
pages.push({
  path: "llms-full.txt",
  raw: `# ToolStack — vollständiger Inhalt

${usecases.usecases.map((u) => `## ${u.name}\n${u.question}\n${u.description}\n${u.picks.map((pk, i) => `${i + 1}. ${toolBySlug[pk.tool]?.name ?? pk.tool}: ${pk.why}`).join("\n")}`).join("\n\n")}

---

${tools.tools.map((t) => `## ${t.name} (${t.category})\n${t.tagline}\nPreis: ${t.pricing}\nUrteil: ${t.verdict}\nStärken: ${t.strengths.join("; ")}\nSchwächen: ${t.weaknesses.join("; ")}`).join("\n\n")}
`
});

/* ---------- sitemap ---------- */
const smUrls = ["/", "/use-cases/", "/tools/", "/sponsors/", "/about.html",
  ...usecases.usecases.map((u) => `/use-cases/${u.slug}.html`),
  ...tools.tools.map((t) => `/tools/${t.slug}.html`)];
pages.push({
  path: "sitemap.xml",
  raw: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${smUrls.map((p) => `  <url><loc>${url(p)}</loc></url>`).join("\n")}
</urlset>`
});

/* ---------- write ---------- */
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, ".nojekyll"), "", "utf8");
for (const pg of pages) {
  const fp = join(OUT, pg.path);
  mkdirSync(dirname(fp), { recursive: true });
  writeFileSync(fp, pg.raw ?? page(pg), "utf8");
}
console.log(`OK: ${pages.length} Seiten nach dist/ geschrieben. Tools: ${tools.tools.length}, Use-Cases: ${usecases.usecases.length}`);
