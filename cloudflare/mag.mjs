// « Le Mag des marchés » du bon trader : une édition par jour (en direct pendant la journée,
// archivée chaque soir) et un récap à chaque fin de mois. Servi par le worker Cloudflare.
//   /mag               édition du jour, en direct (cache 10 min)
//   /mag/AAAA-MM-JJ    édition archivée d'un jour
//   /mag/recap/AAAA-MM récap d'un mois
//   /mag/archives      toutes les éditions et tous les récaps
// Stockage : KV « MAG » (clés ed:AAAA-MM-JJ et recap:AAAA-MM).
import { LESSONS, GLOSSARY } from "./content.mjs";

const UA = { "User-Agent": "Mozilla/5.0 (LeBonTraderMag)" };

const SECTIONS = [
  { id: "eco", title: "Économie & banques centrales", emoji: "🌍", color: "#1f4e8c",
    feeds: [{ url: "https://fr.investing.com/rss/news_14.rss", source: "Investing.com" }] },
  { id: "marches", title: "Marchés & entreprises", emoji: "📈", color: "#0f7a4a",
    feeds: [{ url: "https://fr.investing.com/rss/news.rss", source: "Investing.com", skip: /analyst-ratings/ }] },
  { id: "crypto", title: "Crypto", emoji: "₿", color: "#c26a00",
    feeds: [
      { url: "https://cryptoast.fr/feed/", source: "Cryptoast" },
      { url: "https://journalducoin.com/feed/", source: "Journal du Coin" },
      { url: "https://www.cointribune.com/feed/", source: "Cointribune" },
    ] },
];
const SEC = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

const MARKETS = [
  ["Indices", [["SMI", "^SSMI"], ["S&P 500", "^GSPC"], ["Nasdaq", "^IXIC"], ["DAX", "^GDAXI"]]],
  ["Devises", [["EUR/CHF", "EURCHF=X"], ["USD/CHF", "CHF=X"], ["EUR/USD", "EURUSD=X"]]],
  ["Matières", [["Or", "GC=F"], ["Pétrole", "CL=F"]]],
  ["Crypto", [["Bitcoin", "BTC-USD"], ["Ethereum", "ETH-USD"], ["Solana", "SOL-USD"]]],
  ["Actions", [["Nestlé", "NESN.SW"], ["UBS", "UBSG.SW"], ["Novartis", "NOVN.SW"], ["Apple", "AAPL"], ["Nvidia", "NVDA"], ["Tesla", "TSLA"]]],
];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// ---------- Outils ----------
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const decode = (s) => String(s ?? "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#0?39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&nbsp;/g, " ");
const strip = (s) => decode(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i")); return m ? m[1] : ""; };
const cut = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);
const zurich = (d, opts) => new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", ...opts }).format(new Date(d));
const hhmm = (d) => zurich(d, { hour: "2-digit", minute: "2-digit", hour12: false });
const fmtNum = (n) => n >= 1000 ? n.toLocaleString("fr-CH", { maximumFractionDigits: 0 }) : n.toLocaleString("fr-CH", { minimumFractionDigits: n < 10 ? 4 : 2, maximumFractionDigits: n < 10 ? 4 : 2 });
const fmtChg = (c) => `${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2).replace(".", ",")} %`;

export function dayKey(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
const longDate = (key) => { const [y, m, d] = key.split("-").map(Number); return zurich(Date.UTC(y, m - 1, d, 12), { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
const monthLabel = (mk) => { const [y, m] = mk.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };

function parseDate(s) {
  s = decode(s).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return new Date(s.replace(" ", "T") + "Z");
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

async function readFeed(feed) {
  try {
    const xml = await (await fetch(feed.url, { headers: UA, cf: { cacheTtl: 300 } })).text();
    const items = [];
    for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
      const it = m[0];
      const title = strip(tag(it, "title"));
      const link = strip(tag(it, "link"));
      if (!title || !link || (feed.skip && feed.skip.test(link))) continue;
      const cats = [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((c) => strip(c[1]).toLowerCase());
      if (cats.some((c) => /sponso|affi|partenaire|publi/.test(c))) continue;
      const desc = strip(tag(it, "description")).replace(/L’article .* est apparu en premier sur .*$/i, "").replace(/The post .*$/i, "").trim();
      const date = parseDate(tag(it, "pubDate"));
      if (date) items.push({ title, link, date: date.toISOString(), desc: cut(desc, 220), source: feed.source });
    }
    return items;
  } catch {
    return [];
  }
}

async function quote(sym) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`, { headers: UA });
    const m = (await r.json())?.chart?.result?.[0]?.meta;
    if (!m || m.regularMarketPrice == null) return null;
    const prev = m.previousClose || m.chartPreviousClose;
    return { price: m.regularMarketPrice, cur: m.currency || "", chg: prev ? (m.regularMarketPrice - prev) / prev * 100 : 0 };
  } catch {
    return null;
  }
}

// Performance d'un actif sur un mois civil (clôture du dernier jour du mois précédent → dernier cours)
async function monthPerf(sym, mk) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=3mo&interval=1d`, { headers: UA });
    const res = (await r.json())?.chart?.result?.[0];
    const ts = res?.timestamp || [], cl = res?.indicators?.quote?.[0]?.close || [];
    let base = null, last = null;
    ts.forEach((t, i) => {
      if (cl[i] == null) return;
      const k = dayKey(new Date(t * 1000)).slice(0, 7);
      if (k < mk) base = cl[i];
      else if (k === mk) last = cl[i];
    });
    if (base == null || last == null) return null;
    return { last, cur: res.meta?.currency || "", chg: (last - base) / base * 100 };
  } catch {
    return null;
  }
}

// ---------- Collecte d'une édition ----------
export async function collectEdition(now = new Date()) {
  const since = now.getTime() - 26 * 3600 * 1000;
  const [lists, quotes] = await Promise.all([
    Promise.all(SECTIONS.map(async (s) => {
      const seen = new Set();
      return (await Promise.all(s.feeds.map(readFeed))).flat()
        .filter((i) => new Date(i.date).getTime() >= since && !seen.has(i.title) && seen.add(i.title))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((i) => ({ ...i, sec: s.id }));
    })),
    Promise.all(MARKETS.flatMap(([, list]) => list.map(([, s]) => quote(s)))),
  ]);
  const used = new Set(); // une même actu ne doit apparaître que dans une rubrique
  lists.forEach((l, k) => { lists[k] = l.filter((i) => !used.has(i.link) && used.add(i.link)); });
  let qi = 0;
  const groups = MARKETS.map(([group, list]) => ({ group, rows: list.map(([name]) => ({ name, q: quotes[qi++] })).filter((r) => r.q) }));
  const une = lists.flat().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  const uneLinks = new Set(une.map((i) => i.link));
  return {
    day: dayKey(now),
    updated: now.toISOString(),
    une,
    sections: SECTIONS.map((s, k) => ({ id: s.id, items: lists[k].filter((i) => !uneLinks.has(i.link)).slice(0, 8) })),
    total: lists.reduce((n, l) => n + l.length, 0),
    groups,
  };
}

// ---------- Mise en page commune ----------
const CSS = `:root{--ink:#14161a;--muted:#5d6470;--paper:#faf7f2;--card:#fff;--line:#e7e1d6;--red:#d52b1e;--up:#0f7a4a;--down:#c0262d}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,system-ui,sans-serif;line-height:1.5}
a{color:inherit;text-decoration:none}
.wrap{max-width:1100px;margin:0 auto;padding:0 18px}
header.mast{border-bottom:3px double var(--ink);padding:26px 0 14px;text-align:center}
.kicker{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.logo{font-family:"Playfair Display",Georgia,serif;font-weight:900;font-size:clamp(38px,8vw,72px);line-height:1;margin:8px 0 6px;letter-spacing:-.01em}
.logo b{color:var(--red)}
.edition{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--muted);border-top:1px solid var(--line);margin-top:12px;padding-top:10px}
.edition .live{color:var(--red);font-weight:600}
.edition .live::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--red);margin-right:6px;animation:p 1.6s infinite}
@keyframes p{50%{opacity:.25}}
.banner{margin:14px 0 0;background:#fff3cd;border:1px solid #f1d98a;border-radius:10px;padding:10px 14px;font-size:14px;text-align:center}
.banner a{font-weight:700;color:var(--red)}
nav.tabs{display:flex;gap:8px;overflow-x:auto;padding:12px 0;position:sticky;top:0;background:var(--paper);z-index:5;border-bottom:1px solid var(--line)}
nav.tabs a{white-space:nowrap;font-size:13px;font-weight:600;padding:7px 12px;border:1px solid var(--line);border-radius:999px;background:#fff}
.ticker{overflow:hidden;background:var(--ink);color:#fff;font-size:13px;white-space:nowrap}
.ticker .t{display:inline-block;padding:9px 0;animation:tick 60s linear infinite}
.ticker span{margin:0 18px}.ticker em{font-style:normal}
.ticker .up{color:#6ee7a8}.ticker .down{color:#ff8a8a}
@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
h2{font-family:"Playfair Display",Georgia,serif;font-size:28px;margin:34px 0 14px;display:flex;align-items:center;gap:10px}
.em{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:9px;color:#fff;font-size:17px;font-family:Inter,sans-serif;flex:none}
.une{display:grid;grid-template-columns:2fr 1fr;gap:16px}
.une .side{display:grid;gap:16px}
.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.07)}
.card h3{font-family:"Playfair Display",Georgia,serif;font-size:19px;line-height:1.25;margin:6px 0 8px}
.card.big h3{font-size:clamp(24px,3.4vw,34px)}
.card p{margin:0 0 10px;color:var(--muted);font-size:14.5px}
.card.big p{font-size:16px}
.meta{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.05em}
.dot{width:8px;height:8px;border-radius:50%}
.more{font-size:13px;font-weight:600;color:var(--red)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.markets{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.mgroup{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 16px}
.mgroup h4{margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.mrow{display:grid;grid-template-columns:1fr auto auto;gap:8px;padding:6px 0;border-top:1px solid #f1ece3;font-size:14.5px;align-items:center}
.mrow:first-of-type{border-top:0}.px{font-variant-numeric:tabular-nums;font-weight:600}.px small{color:var(--muted);font-weight:500}
.chg{text-align:right;white-space:nowrap;min-width:84px;font-weight:700;font-variant-numeric:tabular-nums;border-radius:6px;padding:2px 6px}
.chg.up{color:var(--up);background:#e7f5ee}.chg.down{color:var(--down);background:#fbeaea}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-top:14px}
.fact{background:var(--ink);color:#fff;border-radius:14px;padding:14px 16px}
.fact small{display:block;opacity:.7;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
.fact strong{font-family:"Playfair Display",Georgia,serif;font-size:22px}
.learn{display:grid;grid-template-columns:1.4fr 1fr;gap:16px}
.box{background:#fff;border:1px solid var(--line);border-left:5px solid var(--red);border-radius:14px;padding:18px}
.box h3{font-family:"Playfair Display",Georgia,serif;margin:4px 0 8px;font-size:22px}
.box p{margin:0 0 10px;color:#2c3037}
.btn{display:inline-block;background:var(--red);color:#fff;font-weight:700;padding:10px 16px;border-radius:10px;font-size:14px}
.empty{color:var(--muted);font-style:italic}
.timeline{list-style:none;margin:0;padding:0;border-left:3px solid var(--red)}
.timeline li{margin:0 0 14px;padding-left:16px;position:relative}
.timeline li::before{content:"";position:absolute;left:-8px;top:6px;width:13px;height:13px;border-radius:50%;background:#fff;border:3px solid var(--red)}
.timeline .d{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.timeline a{font-family:"Playfair Display",Georgia,serif;font-size:18px;font-weight:700}
.list a{display:flex;justify-content:space-between;gap:10px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:8px;font-weight:600}
.list a span{color:var(--muted);font-weight:500}
footer{margin:40px 0 0;padding:24px 0 40px;border-top:3px double var(--ink);font-size:13px;color:var(--muted);text-align:center}
footer a{color:var(--red);font-weight:600}
@media(max-width:760px){.une,.learn{grid-template-columns:1fr}h2{font-size:24px}.mrow{grid-template-columns:1fr auto auto}}`;

function page(title, body, { refresh = false, ticker = "" } = {}) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="L'essentiel des marchés en français : cours, économie, entreprises, crypto.">
${refresh ? '<meta http-equiv="refresh" content="600">' : ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${ticker}<div class="wrap">${body}
<footer><p><b>Le Mag des marchés</b> par Le bon trader 🇨🇭 · <a href="/mag">Édition du jour</a> · <a href="/mag/archives">Archives et récaps</a></p>
<p>Les titres renvoient vers les articles de leurs auteurs : Investing.com, Cryptoast, Journal du Coin, Cointribune. Cours : Yahoo Finance.</p>
<p>ℹ️ Informations uniquement, pas un conseil en investissement.</p></footer></div></body></html>`;
}

const mast = (kicker, title, infos, banner = "") => `<header class="mast"><div class="kicker">${kicker}</div><div class="logo">${title}</div>
<div class="edition">${infos.map((i) => (i.live ? `<span class="live">${esc(i.text)}</span>` : `<span>${esc(i.text)}</span>`)).join("")}</div>${banner}</header>`;

const card = (i, big = false) => `<a class="card${big ? " big" : ""}" href="${esc(i.link)}" target="_blank" rel="noopener">
<div class="meta"><span class="dot" style="background:${(SEC[i.sec] || SECTIONS[0]).color}"></span>${esc(i.source)} · ${hhmm(i.date)}</div>
<h3>${esc(i.title)}</h3>${i.desc ? `<p>${esc(i.desc)}</p>` : ""}<span class="more">Lire l'article →</span></a>`;

const mrow = (name, q) => `<div class="mrow"><span>${esc(name)}</span><span class="px">${fmtNum(q.price ?? q.last)} <small>${esc(q.cur)}</small></span><span class="chg ${q.chg >= 0 ? "up" : "down"}">${fmtChg(q.chg)}</span></div>`;

// ---------- Édition du jour / archivée ----------
export function renderEdition(ed, { live = false } = {}) {
  const rows = ed.groups.flatMap((g) => g.rows);
  const sorted = [...rows].sort((a, b) => b.q.chg - a.q.chg);
  const best = sorted[0], worst = sorted[sorted.length - 1];
  const dn = Math.floor(Date.parse(ed.day + "T12:00:00Z") / 86400000);
  const lesson = LESSONS[dn % LESSONS.length];
  const keys = Object.keys(GLOSSARY).sort();
  const [wordTitle, wordText] = GLOSSARY[keys[(dn * 7) % keys.length]];
  const lessonIntro = cut(strip(lesson.b.split("\n\n").slice(0, 3).join(" ")), 560);
  const dl = longDate(ed.day);

  const ticker = rows.length ? `<div class="ticker"><div class="t">${[0, 1].map(() => rows.map((r) => `<span>${esc(r.name)} <b>${fmtNum(r.q.price)}</b> <em class="${r.q.chg >= 0 ? "up" : "down"}">${fmtChg(r.q.chg)}</em></span>`).join("")).join("")}</div></div>` : "";

  const body = `${mast("Le bon trader 🇨🇭 présente", "Le <b>Mag</b> des marchés",
    [{ text: `Édition du ${dl}` }, live ? { text: `En direct · mis à jour à ${hhmm(ed.updated)}`, live: true } : { text: `Édition du soir, bouclée à ${hhmm(ed.updated)}` }, { text: `${ed.total} actualités` }],
    live ? "" : `<div class="banner">📁 Édition archivée. <a href="/mag">Voir l'édition du jour →</a></div>`)}
<nav class="tabs"><a href="#une">🔥 À la une</a><a href="#cours">📊 Les cours</a>${SECTIONS.map((s) => `<a href="#${s.id}">${s.emoji} ${esc(s.title)}</a>`).join("")}<a href="#apprendre">💡 Apprendre</a><a href="/mag/archives">📁 Archives</a></nav>
<section id="une"><h2><span class="em" style="background:var(--red)">🔥</span>À la une</h2>
${ed.une.length ? `<div class="une">${card(ed.une[0], true)}<div class="side">${ed.une.slice(1).map((i) => card(i)).join("")}</div></div>` : `<p class="empty">Les premières nouvelles du jour arrivent bientôt.</p>`}</section>
<section id="cours"><h2><span class="em" style="background:#14161a">📊</span>${live ? "Les cours du moment" : "Les cours en fin de journée"}</h2>
<div class="markets">${ed.groups.filter((g) => g.rows.length).map((g) => `<div class="mgroup"><h4>${esc(g.group)}</h4>${g.rows.map((r) => mrow(r.name, r.q)).join("")}</div>`).join("") || `<p class="empty">Cours momentanément indisponibles.</p>`}</div>
${best && worst ? `<div class="facts"><div class="fact"><small>Plus forte hausse</small><strong>${esc(best.name)}</strong> ${fmtChg(best.q.chg)}</div>
<div class="fact"><small>Plus forte baisse</small><strong>${esc(worst.name)}</strong> ${fmtChg(worst.q.chg)}</div>
<div class="fact"><small>En hausse / en baisse</small><strong>${rows.filter((r) => r.q.chg >= 0).length} / ${rows.filter((r) => r.q.chg < 0).length}</strong></div></div>` : ""}</section>
${ed.sections.map((s) => { const S = SEC[s.id]; return `<section id="${s.id}"><h2><span class="em" style="background:${S.color}">${S.emoji}</span>${esc(S.title)}</h2>
${s.items.length ? `<div class="grid">${s.items.map((i) => card(i)).join("")}</div>` : `<p class="empty">Pas de nouvelle dans cette rubrique ce jour-là.</p>`}</section>`; }).join("")}
<section id="apprendre"><h2><span class="em" style="background:#6b3fa0">💡</span>Apprendre en 2 minutes</h2>
<div class="learn"><div class="box"><div class="meta">La leçon du jour</div><h3>${esc(lesson.t)}</h3><p>${esc(lessonIntro)}</p></div>
<div class="box"><div class="meta">Le mot du jour</div><h3>${esc(wordTitle)}</h3><p>${esc(wordText)}</p></div></div></section>`;
  return page(`Le Mag des marchés — ${dl}`, body, { refresh: live, ticker });
}

// ---------- Récap du mois ----------
export async function collectRecap(env, mk) {
  const list = await env.MAG.list({ prefix: `ed:${mk}-` });
  const eds = (await Promise.all(list.keys.map((k) => env.MAG.get(k.name, "json")))).filter(Boolean).sort((a, b) => (a.day < b.day ? -1 : 1));
  const perf = await Promise.all(MARKETS.flatMap(([group, l]) => l.map(async ([name, sym]) => ({ group, name, q: await monthPerf(sym, mk) }))));
  return {
    month: mk,
    built: new Date().toISOString(),
    days: eds.length,
    articles: eds.reduce((n, e) => n + (e.total || 0), 0),
    highlights: eds.map((e) => ({ day: e.day, ...(e.une[0] || {}) })).filter((h) => h.title),
    perf: perf.filter((p) => p.q),
  };
}

export function renderRecap(r) {
  const label = monthLabel(r.month);
  const sorted = [...r.perf].sort((a, b) => b.q.chg - a.q.chg);
  const best = sorted.slice(0, 3), worst = sorted.slice(-3).reverse();
  const byGroup = MARKETS.map(([g]) => ({ g, rows: r.perf.filter((p) => p.group === g) })).filter((x) => x.rows.length);
  const body = `${mast("Le bon trader 🇨🇭 · Récap du mois", `Le <b>Récap</b> de ${esc(label)}`,
    [{ text: `${r.days} éditions du Mag` }, { text: `${r.articles} actualités suivies` }, { text: `Bouclé le ${zurich(r.built, { day: "numeric", month: "long" })}` }])}
<nav class="tabs"><a href="#perf">📊 Performances</a><a href="#podium">🏆 Gagnants et perdants</a><a href="#faits">🗓️ Les faits marquants</a><a href="/mag">📰 Édition du jour</a><a href="/mag/archives">📁 Archives</a></nav>
<section id="podium"><h2><span class="em" style="background:var(--red)">🏆</span>Les gagnants et les perdants du mois</h2>
<div class="facts">${best.map((p, i) => `<div class="fact" style="background:#0f5132"><small>${["🥇", "🥈", "🥉"][i]} Hausse</small><strong>${esc(p.name)}</strong> ${fmtChg(p.q.chg)}</div>`).join("")}
${worst.map((p) => `<div class="fact" style="background:#7a1c1c"><small>📉 Baisse</small><strong>${esc(p.name)}</strong> ${fmtChg(p.q.chg)}</div>`).join("")}</div></section>
<section id="perf"><h2><span class="em" style="background:#14161a">📊</span>Performance sur le mois</h2>
<div class="markets">${byGroup.map((x) => `<div class="mgroup"><h4>${esc(x.g)}</h4>${x.rows.map((p) => mrow(p.name, p.q)).join("")}</div>`).join("") || `<p class="empty">Performances indisponibles.</p>`}</div></section>
<section id="faits"><h2><span class="em" style="background:#1f4e8c">🗓️</span>Les faits marquants, jour après jour</h2>
${r.highlights.length ? `<ul class="timeline">${r.highlights.map((h) => `<li><div class="d">${esc(longDate(h.day))} · <a href="/mag/${h.day}" style="font-family:Inter;font-size:12px;color:var(--red)">l'édition</a></div><a href="${esc(h.link)}" target="_blank" rel="noopener">${esc(h.title)}</a></li>`).join("")}</ul>` : `<p class="empty">Le Mag a démarré ce mois-ci : les faits marquants s'accumuleront au fil des jours.</p>`}</section>`;
  return page(`Le Récap de ${label} — Le Mag des marchés`, body);
}

// ---------- Archives ----------
export async function renderArchives(env) {
  const [eds, recaps] = await Promise.all([env.MAG.list({ prefix: "ed:" }), env.MAG.list({ prefix: "recap:" })]);
  const days = eds.keys.map((k) => k.name.slice(3)).sort().reverse();
  const months = recaps.keys.map((k) => k.name.slice(6)).sort().reverse();
  const body = `${mast("Le bon trader 🇨🇭", "Les <b>archives</b> du Mag", [{ text: `${days.length} éditions` }, { text: `${months.length} récaps mensuels` }])}
<h2><span class="em" style="background:var(--red)">📅</span>Les récaps du mois</h2>
<div class="list">${months.map((m) => `<a href="/mag/recap/${m}">Récap de ${esc(monthLabel(m))}<span>Lire →</span></a>`).join("") || `<p class="empty">Le premier récap paraîtra à la fin du mois.</p>`}</div>
<h2><span class="em" style="background:#14161a">📰</span>Toutes les éditions</h2>
<div class="list"><a href="/mag">Édition du jour (en direct)<span>Lire →</span></a>${days.map((d) => `<a href="/mag/${d}">${esc(longDate(d))}<span>Lire →</span></a>`).join("")}</div>`;
  return page("Archives — Le Mag des marchés", body);
}

// ---------- Routage HTTP ----------
const html = (s, maxAge = 0) => new Response(s, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store" } });

export async function handleMag(req, env, ctx) {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  if (path === "/mag") {
    const cache = caches.default, key = new Request(new URL("/mag", req.url).toString());
    const hit = await cache.match(key);
    if (hit) return hit;
    const res = html(renderEdition(await collectEdition(), { live: true }), 600);
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  }
  if (path === "/mag/archives") return html(await renderArchives(env), 300);
  let m = path.match(/^\/mag\/(\d{4}-\d{2}-\d{2})$/);
  if (m) {
    if (m[1] === dayKey()) return Response.redirect(new URL("/mag", req.url).toString(), 302);
    const ed = await env.MAG.get(`ed:${m[1]}`, "json");
    return ed ? html(renderEdition(ed), 3600) : html(page("Édition introuvable", `<p class="empty" style="margin:60px 0;text-align:center">Pas d'édition pour cette date. <a href="/mag/archives" style="color:#d52b1e">Voir les archives</a></p>`));
  }
  m = path.match(/^\/mag\/recap\/(\d{4}-\d{2})$/);
  if (m) {
    const r = await env.MAG.get(`recap:${m[1]}`, "json");
    return r ? html(renderRecap(r), 3600) : html(page("Récap à venir", `<p class="empty" style="margin:60px 0;text-align:center">Le récap de ${esc(monthLabel(m[1]))} paraîtra le dernier jour du mois. <a href="/mag" style="color:#d52b1e">Lire l'édition du jour</a></p>`));
  }
  return null;
}

// ---------- Tâches planifiées ----------
// Publie dans le canal VIP et dans le canal gratuit (s'il est configuré)
async function post(env, text, button, url) {
  const chats = [env.CHANNEL_ID, env.FREE_CHANNEL_ID].filter(Boolean);
  return Promise.all(chats.map((chat_id) => fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: button, url }]] } }),
  }).then((r) => r.json()).catch((e) => ({ ok: false, description: String(e) }))));
}

// Le matin : annonce de l'édition du jour dans le canal (un seul message)
export async function morningPost(env, origin) {
  const ed = await collectEdition();
  const titles = ed.une.slice(0, 3).map((i) => `• ${esc(i.title)}`).join("\n");
  return post(env, `📰 <b>Le Mag des marchés du ${esc(longDate(ed.day))}</b>\n\nÀ la une ce matin :\n${titles || "• Les premières nouvelles arrivent"}\n\nCours, économie, entreprises, crypto et la leçon du jour : tout est dans le Mag, mis à jour en direct toute la journée.`, "📖 Lire le Mag du jour", `${origin}/`);
}

// Le soir : archive l'édition du jour ; le dernier jour du mois, publie le récap
export async function eveningArchive(env, origin) {
  const ed = await collectEdition();
  await env.MAG.put(`ed:${ed.day}`, JSON.stringify(ed));
  const tomorrow = dayKey(new Date(Date.now() + 24 * 3600 * 1000));
  if (tomorrow.slice(0, 7) !== ed.day.slice(0, 7)) {
    const mk = ed.day.slice(0, 7);
    const r = await collectRecap(env, mk);
    await env.MAG.put(`recap:${mk}`, JSON.stringify(r));
    const top = [...r.perf].sort((a, b) => b.q.chg - a.q.chg);
    const lines = top.length ? `🥇 ${esc(top[0].name)} ${fmtChg(top[0].q.chg)}\n📉 ${esc(top[top.length - 1].name)} ${fmtChg(top[top.length - 1].q.chg)}` : "";
    await post(env, `📅 <b>Le Récap de ${esc(monthLabel(mk))} est en ligne</b>\n\nLes performances du mois, les gagnants et les perdants, et les faits marquants jour après jour.\n\n${lines}`, "📊 Lire le récap du mois", `${origin}/mag/recap/${mk}`);
  }
  return ed.day;
}
