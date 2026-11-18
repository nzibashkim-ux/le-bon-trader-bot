// Tableau « MARCHÉS EN DIRECT » du canal, mis à jour par Cloudflare (cron) toutes les 2 minutes.
// Variables : TELEGRAM_TOKEN, CHANNEL_ID, BOARD_ID (id du message épinglé à mettre à jour).
const BOARD = [
  ["Apple", "AAPL"], ["Nvidia", "NVDA"], ["Tesla", "TSLA"], ["Nestlé", "NESN.SW"], ["UBS", "UBSG.SW"],
  ["S&P 500", "^GSPC"], ["Nasdaq", "^IXIC"], ["SMI", "^SSMI"], ["Or", "GC=F"], ["EUR/CHF", "EURCHF=X"],
  ["Bitcoin", "BTC-USD"], ["Ethereum", "ETH-USD"], ["Solana", "SOL-USD"],
];
const UA = { "User-Agent": "Mozilla/5.0 (LeBonTraderBoard)" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function quote(sym) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`, { headers: UA });
  const m = (await r.json())?.chart?.result?.[0]?.meta;
  if (!m || m.regularMarketPrice == null) return null;
  const prev = m.previousClose || m.chartPreviousClose;
  return { price: m.regularMarketPrice, cur: m.currency || "", chg: prev ? (m.regularMarketPrice - prev) / prev * 100 : 0 };
}

function fmtPrice(q) {
  const p = q.price >= 1
    ? q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : q.price.toFixed(6);
  return `${q.chg >= 0 ? "🟢" : "🔴"} ${p} ${q.cur} (${q.chg >= 0 ? "+" : ""}${q.chg.toFixed(2)}%)`;
}

export async function updateBoard(env) {
  const token = env.TELEGRAM_TOKEN, chat = env.CHANNEL_ID, mid = Number(env.BOARD_ID);
  if (!token || !chat || !mid) return "config manquante";
  const quotes = await Promise.all(BOARD.map(([, s]) => quote(s).catch(() => null)));
  if (quotes.every((q) => !q)) return "aucun cours";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const when = `${parts.day}/${parts.month} à ${parts.hour}:${parts.minute}`;
  const lines = ["📊 <b>MARCHÉS EN DIRECT</b>", `<i>Mis à jour le ${when} — actualisé toutes les 2 min</i>`, ""];
  BOARD.forEach(([name], i) => { if (quotes[i]) lines.push(`<b>${esc(name)}</b> : ${fmtPrice(quotes[i])}`); });
  lines.push("", "ℹ️ Infos uniquement, pas un conseil en investissement.");
  const r = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, message_id: mid, text: lines.join("\n"), parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const d = await r.json().catch(() => ({}));
  return d.ok || /not modified/.test(d.description || "") ? "ok" : "erreur: " + d.description;
}
