// Bot privé « Le bon trader » : webhook Telegram hébergé en fonction Netlify.
// Variables Netlify : TELEGRAM_TOKEN (obligatoire), CHANNEL_ID (accès réservé aux membres du canal),
// ANTHROPIC_API_KEY (optionnel : active l'IA), CLAUDE_MODEL (optionnel), JOIN_LINK (optionnel).
import { LESSONS, GLOSSARY, QUIZ, AI_SYSTEM, AI_CORNER } from "./content.mjs";

const TOKEN = process.env.TELEGRAM_TOKEN || "";
const CHANNEL_ID = process.env.CHANNEL_ID || "";
const AI_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const JOIN_LINK = process.env.JOIN_LINK || "https://t.me/+2CZEYJN0pk0yYTA0";
const UA = { "User-Agent": "Mozilla/5.0 (LeBonTraderBot)" };

// ---------- Outils ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-_]/g, " ").trim();
const num = (s) => parseFloat(String(s).replace(/['\s]/g, "").replace(",", "."));
const fmt = (n, d = 2) => Number(n).toLocaleString("fr-CH", { minimumFractionDigits: d, maximumFractionDigits: d });

async function secret() {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("lbt:" + TOKEN));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

async function tg(method, params) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  return r.json().catch(() => ({ ok: false }));
}

async function send(chat_id, text, keyboard, extra = {}) {
  const base = { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra };
  if (keyboard) base.reply_markup = { inline_keyboard: keyboard };
  let res = await tg("sendMessage", base);
  if (!res.ok && /parse|entit|tag/i.test(res.description || "")) {
    // HTML invalide (souvent une réponse IA) : on renvoie en texte brut
    delete base.parse_mode;
    base.text = text.replace(/<[^>]+>/g, "");
    res = await tg("sendMessage", base);
  }
  return res;
}

async function edit(chat_id, message_id, text, keyboard) {
  const p = { chat_id, message_id, text, parse_mode: "HTML", disable_web_page_preview: true };
  if (keyboard) p.reply_markup = { inline_keyboard: keyboard };
  const res = await tg("editMessageText", p);
  if (!res.ok && !/not modified/.test(res.description || "")) return send(chat_id, text, keyboard);
  return res;
}

const BACK = [[{ text: "🏠 Menu", callback_data: "m" }]];
const MENU = [
  [{ text: "📚 Leçons", callback_data: "L" }, { text: "📖 Lexique", callback_data: "x:0" }],
  [{ text: "🧮 Calculateurs", callback_data: "c" }, { text: "🧠 Quiz", callback_data: "q" }],
  [{ text: "📈 Cours en direct", callback_data: "p" }, { text: "🧰 Coin IA", callback_data: "r" }],
  [{ text: "🤖 Pose ta question", callback_data: "ai" }],
];

// ---------- Accès réservé aux membres du canal ----------
async function isMember(userId) {
  if (!CHANNEL_ID) return true;
  const r = await tg("getChatMember", { chat_id: CHANNEL_ID, user_id: userId });
  return r.ok && ["creator", "administrator", "member", "restricted"].includes(r.result.status);
}

// ---------- Écrans ----------
function welcome(name) {
  return `👋 Salut <b>${esc(name || "trader")}</b>, bienvenue dans ton assistant <b>Le bon trader</b> 🇨🇭

Je suis là pour t'apprendre le trading, pas à pas :
📚 <b>12 leçons</b> claires, des bases à la psychologie
📖 Un <b>lexique</b> de plus de 50 mots
🧮 Des <b>calculateurs</b> : taille de position, R:R, levier…
🧠 Des <b>quiz</b> pour t'entraîner
🧰 Le <b>coin IA</b> : comment utiliser ChatGPT ou Claude pour progresser
📈 Les <b>cours en direct</b> : /prix btc, /prix AAPL
🤖 ${AI_KEY ? "Pose-moi <b>n'importe quelle question</b> en écrivant simplement ton message" : "Écris un mot (ex. <i>levier</i>) et je t'explique"}

<i>Infos pédagogiques uniquement, pas un conseil en investissement.</i>`;
}

function lessonsMenu() {
  const kb = [];
  for (let i = 0; i < LESSONS.length; i += 2) {
    kb.push(LESSONS.slice(i, i + 2).map((l, j) => ({ text: l.t, callback_data: "l:" + (i + j) })));
  }
  kb.push(BACK[0]);
  return ["📚 <b>Les leçons</b>\nChoisis une leçon, dans l'ordre si tu débutes :", kb];
}

function lesson(i) {
  const l = LESSONS[i];
  const nav = [];
  if (i > 0) nav.push({ text: "⬅️ Précédente", callback_data: "l:" + (i - 1) });
  if (i < LESSONS.length - 1) nav.push({ text: "Suivante ➡️", callback_data: "l:" + (i + 1) });
  return [`<b>${esc(l.t)}</b>\n\n${l.b}`, [nav, [{ text: "📚 Toutes les leçons", callback_data: "L" }, { text: "🧠 Quiz", callback_data: "q" }], BACK[0]]];
}

const KEYS = Object.keys(GLOSSARY).sort();
function glossaryPage(p) {
  const per = 12, pages = Math.ceil(KEYS.length / per);
  p = Math.max(0, Math.min(p, pages - 1));
  const slice = KEYS.slice(p * per, p * per + per);
  const kb = [];
  for (let i = 0; i < slice.length; i += 3) kb.push(slice.slice(i, i + 3).map((k) => ({ text: GLOSSARY[k][0].split(" (")[0], callback_data: "d:" + KEYS.indexOf(k) })));
  const nav = [];
  if (p > 0) nav.push({ text: "⬅️", callback_data: "x:" + (p - 1) });
  nav.push({ text: `${p + 1}/${pages}`, callback_data: "x:" + p });
  if (p < pages - 1) nav.push({ text: "➡️", callback_data: "x:" + (p + 1) });
  kb.push(nav, BACK[0]);
  return ["📖 <b>Lexique du trader</b>\nTouche un mot, ou écris <code>/def levier</code> :", kb];
}

function definition(key) {
  const [title, text] = GLOSSARY[key];
  return [`📖 <b>${esc(title)}</b>\n\n${esc(text)}`, [[{ text: "📖 Retour au lexique", callback_data: "x:" + Math.floor(KEYS.indexOf(key) / 12) }], BACK[0]]];
}

function findTerm(q) {
  const n = norm(q).replace(/^(c'?est quoi|qu'?est ce que|definition|def|le|la|les|un|une)\s+/g, "").replace(/[?!.]/g, "").trim();
  if (!n) return null;
  if (GLOSSARY[n]) return n;
  return KEYS.find((k) => n === k || n.includes(k) || (k.length > 3 && k.includes(n))) || null;
}

function quizQuestion(i) {
  const [q, opts] = QUIZ[i];
  const kb = opts.map((o, j) => [{ text: o, callback_data: `a:${i}:${j}` }]);
  kb.push(BACK[0]);
  return [`🧠 <b>Quiz</b> — question ${i + 1}/${QUIZ.length}\n\n${esc(q)}`, kb];
}

function quizAnswer(i, j) {
  const [q, opts, good, why] = QUIZ[i];
  const ok = j === good;
  const next = (i + 1 + Math.floor(Math.random() * (QUIZ.length - 1))) % QUIZ.length;
  return [`🧠 ${esc(q)}\n\n${ok ? "✅ <b>Bonne réponse !</b>" : `❌ <b>Raté.</b> La bonne réponse : <b>${esc(opts[good])}</b>`}\n\n💡 ${esc(why)}`,
    [[{ text: "➡️ Question suivante", callback_data: "a:" + next + ":-1" }], BACK[0]]];
}

const CALC_HELP = `🧮 <b>Calculateurs</b> (sépare les nombres par des espaces)

<b>Taille de position</b>
<code>/position capital risque% entrée stop</code>
ex. <code>/position 5000 1 100 95</code>

<b>Ratio risque/rendement</b>
<code>/rr entrée stop objectif</code>
ex. <code>/rr 100 95 115</code>

<b>Gain nécessaire après une perte</b>
<code>/perte %</code>  ex. <code>/perte 30</code>

<b>Effet de levier</b>
<code>/levier capital levier</code>  ex. <code>/levier 1000 10</code>

<b>Intérêts composés</b>
<code>/interets capital %par_période périodes</code>
ex. <code>/interets 1000 2 12</code>`;

// ---------- Calculateurs ----------
function calc(cmd, a) {
  const v = a.map(num);
  const bad = (u) => `⚠️ Utilisation : <code>${u}</code>`;
  if (cmd === "position") {
    if (v.length < 4 || v.some(isNaN)) return bad("/position capital risque% entrée stop");
    const [cap, r, e, s] = v, risk = cap * r / 100, per = Math.abs(e - s);
    if (!per) return "⚠️ L'entrée et le stop doivent être différents.";
    const units = risk / per;
    return `🧮 <b>Taille de position</b>

Capital : ${fmt(cap)} • Risque : ${fmt(r, 1)} %
Perte max acceptée : <b>${fmt(risk)}</b>
Risque par unité : ${fmt(per, 4)} (entrée ${fmt(e, 4)} → stop ${fmt(s, 4)})

👉 Taille : <b>${fmt(units, units < 10 ? 3 : 0)} unités</b>
Valeur de la position : ${fmt(units * e)}${units * e > cap ? `\n⚠️ Plus grosse que ton capital : il faudrait un levier d'environ x${fmt(units * e / cap, 1)}.` : ""}

Si le stop est touché, tu perds ${fmt(risk)}, pas plus.`;
  }
  if (cmd === "rr") {
    if (v.length < 3 || v.some(isNaN)) return bad("/rr entrée stop objectif");
    const [e, s, t] = v, risk = Math.abs(e - s), rew = Math.abs(t - e);
    if (!risk) return "⚠️ L'entrée et le stop doivent être différents.";
    const R = rew / risk, be = 100 / (1 + R);
    return `🧮 <b>Risque / rendement</b>

Risque : ${fmt(risk, 4)} • Gain visé : ${fmt(rew, 4)}
Ratio : <b>1:${fmt(R, 2)}</b> ${R >= 2 ? "✅" : R >= 1.5 ? "🟡" : "⚠️"}
Taux de réussite minimum pour être rentable : <b>${fmt(be, 1)} %</b>

${R < 1.5 ? "Un ratio sous 1:1,5 demande de gagner très souvent. Cherche un meilleur objectif ou un stop plus serré (logique)." : "Bon ratio : même avec moins d'une victoire sur deux, tu peux être gagnant."}`;
  }
  if (cmd === "perte") {
    const p = v[0];
    if (isNaN(p) || p <= 0 || p >= 100) return bad("/perte 30");
    return `📉 Après une perte de <b>${fmt(p, 1)} %</b>, il faut un gain de <b>${fmt(p / (100 - p) * 100, 1)} %</b> pour revenir au point de départ.\n\nC'est pour ça qu'on coupe les pertes tôt.`;
  }
  if (cmd === "levier") {
    if (v.length < 2 || v.some(isNaN) || v[1] <= 0) return bad("/levier capital levier");
    const [cap, L] = v, expo = cap * L;
    return `⚖️ <b>Effet de levier x${fmt(L, 0)}</b>

Capital : ${fmt(cap)} → position contrôlée : <b>${fmt(expo)}</b>
• Marché +1 % → <b>+${fmt(expo / 100)}</b> (+${fmt(L, 0)} % de ton capital)
• Marché −1 % → <b>−${fmt(expo / 100)}</b> (−${fmt(L, 0)} %)
• Un mouvement d'environ <b>−${fmt(100 / L, 1)} %</b> contre toi efface tout ton capital.

${L > 10 ? "⚠️ Levier élevé : très dangereux sans expérience." : "Garde toujours un stop-loss."}`;
  }
  if (cmd === "interets") {
    if (v.length < 3 || v.some(isNaN)) return bad("/interets capital %par_période périodes");
    const [cap, t, n] = v, fin = cap * Math.pow(1 + t / 100, n);
    return `📈 <b>Intérêts composés</b>\n\n${fmt(cap)} à ${fmt(t, 2)} % pendant ${fmt(n, 0)} périodes → <b>${fmt(fin)}</b>\nGain : +${fmt(fin - cap)} (+${fmt((fin / cap - 1) * 100, 1)} %)\n\n<i>Aucun rendement n'est garanti en trading : c'est une simulation.</i>`;
  }
  return null;
}

// ---------- Cours en direct ----------
const CRYPTO = { btc: "bitcoin", bitcoin: "bitcoin", eth: "ethereum", ethereum: "ethereum", sol: "solana", solana: "solana", xrp: "ripple", ada: "cardano", doge: "dogecoin", bnb: "binancecoin" };
const ALIAS = { or: "GC=F", gold: "GC=F", argent: "SI=F", petrole: "CL=F", smi: "^SSMI", sp500: "^GSPC", "s&p500": "^GSPC", nasdaq: "^IXIC", dax: "^GDAXI", cac: "^FCHI", cac40: "^FCHI", eurchf: "EURCHF=X", usdchf: "CHF=X", eurusd: "EURUSD=X", nestle: "NESN.SW", ubs: "UBSG.SW", novartis: "NOVN.SW", roche: "ROG.SW" };

async function quote(q) {
  const k = norm(q).replace(/[\s/]/g, "");
  if (CRYPTO[k]) {
    const id = CRYPTO[k];
    const d = await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,chf&include_24hr_change=true`, { headers: UA })).json();
    const x = d[id];
    if (!x) return null;
    return { name: id[0].toUpperCase() + id.slice(1), price: x.usd, cur: "USD", chg: x.usd_24h_change || 0, extra: `≈ ${fmt(x.chf)} CHF` };
  }
  const sym = ALIAS[k] || q.toUpperCase();
  const d = await (await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`, { headers: UA })).json();
  const m = d?.chart?.result?.[0]?.meta;
  if (!m || m.regularMarketPrice == null) return null;
  const prev = m.previousClose || m.chartPreviousClose;
  return { name: m.shortName || m.longName || sym, sym, price: m.regularMarketPrice, cur: m.currency || "", chg: prev ? (m.regularMarketPrice - prev) / prev * 100 : 0 };
}

async function priceText(q) {
  try {
    const x = await quote(q);
    if (!x) return `❓ Je ne trouve pas <b>${esc(q)}</b>. Essaie un symbole Yahoo (ex. <code>AAPL</code>, <code>NESN.SW</code>, <code>EURUSD=X</code>) ou <code>btc</code>, <code>or</code>, <code>smi</code>.`;
    return `${x.chg >= 0 ? "🟢" : "🔴"} <b>${esc(x.name)}</b>${x.sym ? ` (${esc(x.sym)})` : ""}\nPrix : <b>${fmt(x.price, x.price < 1 ? 6 : 2)} ${esc(x.cur)}</b>${x.extra ? ` (${x.extra})` : ""}\nVariation : <b>${x.chg >= 0 ? "+" : ""}${fmt(x.chg)} %</b>${x.sym ? " sur la séance" : " sur 24 h"}`;
  } catch {
    return "⚠️ Les cours ne répondent pas pour le moment, réessaie dans une minute.";
  }
}

async function board() {
  const list = ["smi", "sp500", "nasdaq", "or", "eurchf", "btc", "eth"];
  const rows = await Promise.all(list.map(async (s) => {
    try { const x = await quote(s); return x ? `${x.chg >= 0 ? "🟢" : "🔴"} <b>${esc(x.name)}</b> : ${fmt(x.price, x.price < 5 ? 4 : 2)} ${esc(x.cur)} (${x.chg >= 0 ? "+" : ""}${fmt(x.chg)} %)` : null; } catch { return null; }
  }));
  return `📈 <b>Marchés maintenant</b>\n\n${rows.filter(Boolean).join("\n") || "Cours indisponibles pour le moment."}\n\nUn actif précis : <code>/prix AAPL</code>, <code>/prix btc</code>, <code>/prix nestle</code>`;
}

// ---------- IA ----------
async function askAI(question, context) {
  const messages = [];
  if (context) messages.push({ role: "assistant", content: context.slice(0, 3000) });
  messages.push({ role: "user", content: question.slice(0, 2000) });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": AI_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 900, system: AI_SYSTEM, messages }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || "Erreur IA");
  return (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
}

// ---------- Traitement d'un message ----------
async function onMessage(msg) {
  const chat = msg.chat.id;
  if (msg.chat.type !== "private") return;
  const text = (msg.text || "").trim();
  if (!text) return send(chat, "Envoie-moi un message texte 🙂", MENU);

  if (!(await isMember(msg.from.id))) {
    return send(chat, `🔒 Ce bot est réservé aux membres du canal <b>Le bon trader 🇨🇭👨‍💻</b>.\n\nDemande ton accès ici :`, [[{ text: "🔑 Rejoindre le canal", url: JOIN_LINK }]]);
  }

  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.startsWith("/") ? rawCmd.slice(1).split("@")[0].toLowerCase() : null;

  if (cmd === "start" || cmd === "menu") return send(chat, welcome(msg.from.first_name), MENU);
  if (cmd === "aide" || cmd === "help") return send(chat, `${welcome(msg.from.first_name)}\n\n<b>Commandes</b>\n/lecons • /lexique • /def mot • /quiz • /ia\n/position • /rr • /perte • /levier • /interets\n/prix symbole • /marches`, MENU);
  if (cmd === "lecons") return send(chat, ...lessonsMenu());
  if (cmd === "ia" || cmd === "ressources") return send(chat, AI_CORNER, BACK);
  if (cmd === "lexique") return send(chat, ...glossaryPage(0));
  if (cmd === "quiz") return send(chat, ...quizQuestion(Math.floor(Math.random() * QUIZ.length)));
  if (cmd === "calcul" || cmd === "calculateurs") return send(chat, CALC_HELP, BACK);
  if (cmd === "marches") { await tg("sendChatAction", { chat_id: chat, action: "typing" }); return send(chat, await board(), BACK); }
  if (cmd === "prix") {
    if (!args.length) return send(chat, "Utilisation : <code>/prix btc</code>, <code>/prix AAPL</code>, <code>/prix nestle</code>", BACK);
    await tg("sendChatAction", { chat_id: chat, action: "typing" });
    return send(chat, await priceText(args.join(" ")), BACK);
  }
  if (cmd === "def") {
    const k = findTerm(args.join(" "));
    return k ? send(chat, ...definition(k)) : send(chat, `Je n'ai pas « ${esc(args.join(" "))} » dans le lexique.`, [[{ text: "📖 Voir le lexique", callback_data: "x:0" }], BACK[0]]);
  }
  if (cmd) {
    const r = calc(cmd, args);
    if (r) return send(chat, r, [[{ text: "🧮 Autres calculateurs", callback_data: "c" }], BACK[0]]);
    return send(chat, "Commande inconnue. Voici le menu :", MENU);
  }

  // Texte libre : IA si disponible, sinon lexique / leçons
  if (AI_KEY) {
    await tg("sendChatAction", { chat_id: chat, action: "typing" });
    try {
      const ctx = msg.reply_to_message?.from?.is_bot ? msg.reply_to_message.text : null;
      const answer = await askAI(text, ctx);
      return send(chat, answer || "Je n'ai pas de réponse, reformule ta question 🙂", [[{ text: "🏠 Menu", callback_data: "m" }]], { reply_to_message_id: msg.message_id });
    } catch (e) {
      console.log("IA:", e.message);
    }
  }
  const k = findTerm(text);
  if (k) return send(chat, ...definition(k));
  const n = norm(text);
  const li = LESSONS.findIndex((l) => norm(l.t + " " + l.b).includes(n) && n.length > 3);
  if (li >= 0) return send(chat, `Ça se trouve dans la leçon <b>${esc(LESSONS[li].t)}</b> 👇`, [[{ text: "📚 Ouvrir la leçon", callback_data: "l:" + li }], BACK[0]]);
  return send(chat, `Je n'ai pas encore la réponse à ça${AI_KEY ? "" : " (le mode IA arrive bientôt 🤖)"}.\nEssaie un mot du lexique (ex. <i>levier</i>, <i>RSI</i>) ou explore le menu :`, MENU);
}

async function onCallback(cb) {
  const chat = cb.message?.chat?.id, mid = cb.message?.message_id, d = cb.data || "";
  await tg("answerCallbackQuery", { callback_query_id: cb.id });
  if (!chat) return;
  if (!(await isMember(cb.from.id))) return send(chat, "🔒 Réservé aux membres du canal.", [[{ text: "🔑 Rejoindre le canal", url: JOIN_LINK }]]);
  const [k, a, b] = d.split(":");
  if (k === "m") return edit(chat, mid, welcome(cb.from.first_name), MENU);
  if (k === "L") return edit(chat, mid, ...lessonsMenu());
  if (k === "l") return edit(chat, mid, ...lesson(Math.max(0, Math.min(LESSONS.length - 1, +a))));
  if (k === "x") return edit(chat, mid, ...glossaryPage(+a));
  if (k === "d") return KEYS[+a] ? edit(chat, mid, ...definition(KEYS[+a])) : null;
  if (k === "q") return edit(chat, mid, ...quizQuestion(Math.floor(Math.random() * QUIZ.length)));
  if (k === "a") {
    const i = (+a) % QUIZ.length, j = +b;
    return j < 0 ? edit(chat, mid, ...quizQuestion(i)) : edit(chat, mid, ...quizAnswer(i, j));
  }
  if (k === "c") return edit(chat, mid, CALC_HELP, BACK);
  if (k === "r") return edit(chat, mid, AI_CORNER, BACK);
  if (k === "p") return edit(chat, mid, await board(), BACK);
  if (k === "ai") return edit(chat, mid, AI_KEY
    ? "🤖 <b>Pose ta question</b>\n\nÉcris-la simplement dans le chat, par exemple :\n• <i>C'est quoi un pip ?</i>\n• <i>Comment placer mon stop-loss ?</i>\n• <i>Explique-moi le RSI comme si j'avais 12 ans</i>\n\nTu peux aussi répondre à un de mes messages pour approfondir."
    : "🤖 <b>Le mode IA arrive bientôt.</b>\n\nEn attendant, écris un mot (ex. <i>levier</i>, <i>spread</i>, <i>RSI</i>) et je te donne la définition, ou parcours les leçons.", BACK);
}

// ---------- Point d'entrée Netlify ----------
export default async (req, context) => {
  if (!TOKEN) return new Response("TELEGRAM_TOKEN manquant", { status: 500 });
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.has("setup")) {
      const hook = `${url.origin}${url.pathname}`;
      const r = await tg("setWebhook", { url: hook, secret_token: await secret(), allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
      await tg("setMyCommands", { commands: [
        { command: "start", description: "Menu principal" },
        { command: "lecons", description: "Les 12 leçons de trading" },
        { command: "lexique", description: "Le lexique du trader" },
        { command: "quiz", description: "Teste tes connaissances" },
        { command: "ia", description: "Le coin IA du trader" },
        { command: "position", description: "Calcul de taille de position" },
        { command: "rr", description: "Ratio risque/rendement" },
        { command: "levier", description: "Simuler un effet de levier" },
        { command: "prix", description: "Cours d'un actif (ex. /prix btc)" },
        { command: "marches", description: "Les marchés maintenant" },
        { command: "aide", description: "Aide et commandes" },
      ] });
      await tg("setMyDescription", { description: "Ton prof de trading privé 🇨🇭 : leçons, lexique, calculateurs, quiz, cours en direct et réponses à tes questions. Réservé aux membres du canal Le bon trader." });
      return new Response(r.ok ? "✅ Bot activé : webhook enregistré sur " + hook + (AI_KEY ? " (IA active)" : " (IA inactive : ajoute ANTHROPIC_API_KEY)") : "❌ " + JSON.stringify(r), { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    return new Response("Bot Le bon trader en ligne.", { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  if (req.headers.get("x-telegram-bot-api-secret-token") !== (await secret())) return new Response("forbidden", { status: 403 });

  const update = await req.json().catch(() => ({}));
  const work = (async () => {
    try {
      if (update.message) await onMessage(update.message);
      else if (update.callback_query) await onCallback(update.callback_query);
    } catch (e) {
      console.log("Erreur:", e?.message || e);
    }
  })();
  // Répond tout de suite à Telegram, le travail continue en arrière-plan si possible
  if (context && typeof context.waitUntil === "function") context.waitUntil(work);
  else await work;
  return new Response("ok");
};
