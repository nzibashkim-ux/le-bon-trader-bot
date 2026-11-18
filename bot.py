#!/usr/bin/env python3
"""Bot Telegram "infos marchés" : poste dans ton canal
- les grosses variations d'actions / cryptos (alertes)
- les news (flux RSS) et tweets (flux RSS de comptes X)
- un résumé quotidien
Aucune librairie à installer : Python standard uniquement.
"""
import json, os, time, html, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE, "config.json")
STATE_PATH = os.path.join(BASE, "state.json")
TOKEN = os.environ.get("TELEGRAM_TOKEN", "")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
UA = {"User-Agent": "Mozilla/5.0 (MarketInfoBot)"}


def load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def send(text):
    """Envoie un message au canal (découpe si > 4000 caractères)."""
    chunks = [text[i:i + 4000] for i in range(0, len(text), 4000)] or [""]
    for chunk in chunks:
        if not TOKEN or not CHAT_ID:
            print("---\n" + chunk)
            continue
        data = urllib.parse.urlencode({
            "chat_id": CHAT_ID, "text": chunk, "parse_mode": "HTML",
            "disable_web_page_preview": "true"}).encode()
        try:
            urllib.request.urlopen(urllib.request.Request(
                f"https://api.telegram.org/bot{TOKEN}/sendMessage", data=data), timeout=20).read()
        except Exception as e:
            print("Erreur Telegram:", e)
        time.sleep(1.2)


# ---------- Cours ----------
def stock_quote(symbol):
    url = ("https://query1.finance.yahoo.com/v8/finance/chart/"
           + urllib.parse.quote(symbol) + "?range=1d&interval=1d")
    m = json.loads(fetch(url))["chart"]["result"][0]["meta"]
    price = m["regularMarketPrice"]
    prev = m.get("previousClose") or m.get("chartPreviousClose")
    change = (price - prev) / prev * 100 if prev else 0.0
    day = datetime.fromtimestamp(m.get("regularMarketTime", time.time()), timezone.utc).strftime("%Y-%m-%d")
    return {"price": price, "change": change, "currency": m.get("currency", ""), "day": day}


def crypto_quotes(ids):
    if not ids:
        return {}
    url = ("https://api.coingecko.com/api/v3/simple/price?ids=" + ",".join(ids)
           + "&vs_currencies=usd&include_24hr_change=true")
    d = json.loads(fetch(url))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return {k: {"price": v["usd"], "change": v.get("usd_24h_change") or 0.0,
                "currency": "USD", "day": today} for k, v in d.items()}


def get_all_quotes(cfg):
    quotes = {}
    for name, sym in cfg.get("actions", {}).items():
        try:
            quotes[name] = stock_quote(sym)
        except Exception as e:
            print("Cours introuvable", sym, e)
    try:
        cq = crypto_quotes(list(cfg.get("cryptos", {}).values()))
        for name, cid in cfg.get("cryptos", {}).items():
            if cid in cq:
                quotes[name] = cq[cid]
    except Exception as e:
        print("Erreur crypto", e)
    return quotes


def fmt_price(q):
    p = q["price"]
    p = f"{p:,.2f}" if p >= 1 else f"{p:.6f}"
    arrow = "🟢" if q["change"] >= 0 else "🔴"
    return f"{arrow} {p} {q['currency']} ({q['change']:+.2f}%)"


def check_alerts(cfg, state, quotes):
    step = float(cfg.get("seuil_alerte_pct", 3))
    alerted = state.setdefault("alerts", {})
    for name, q in quotes.items():
        level = int(abs(q["change"]) // step)  # 3% -> niveau 1, 6% -> niveau 2...
        prev = alerted.get(name, {})
        if prev.get("day") != q["day"]:
            prev = {"day": q["day"], "level": 0}
        if level > prev["level"]:
            sens = "📈 HAUSSE" if q["change"] > 0 else "📉 BAISSE"
            send(f"🚨 <b>{sens} — {html.escape(name)}</b>\n{fmt_price(q)}")
            prev["level"] = level
        alerted[name] = prev


def daily_summary(cfg, state, quotes):
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    if now.hour < int(cfg.get("heure_resume_utc", 7)) or state.get("last_summary") == today:
        return
    if not quotes:
        return
    lines = [f"☀️ <b>Résumé marchés — {now.strftime('%d/%m/%Y')}</b>", ""]
    for name, q in sorted(quotes.items(), key=lambda x: -x[1]["change"]):
        lines.append(f"<b>{html.escape(name)}</b> : {fmt_price(q)}")
    lines += ["", cfg.get("disclaimer", "")]
    send("\n".join(lines))
    state["last_summary"] = today


# ---------- News & tweets (RSS) ----------
def parse_feed(raw):
    root = ET.fromstring(raw)
    items = []
    for it in root.iter():
        tag = it.tag.split("}")[-1]
        if tag not in ("item", "entry"):
            continue
        title = link = guid = ""
        for child in it:
            ct = child.tag.split("}")[-1]
            if ct == "title":
                title = (child.text or "").strip()
            elif ct == "link":
                link = child.get("href") or (child.text or "").strip() or link
            elif ct in ("guid", "id"):
                guid = (child.text or "").strip()
        if title:
            items.append({"title": title, "link": link, "id": guid or link or title})
    return items


def check_feeds(cfg, state, section, emoji):
    seen = state.setdefault("seen", {})
    keywords = [k.lower() for k in cfg.get("mots_cles", [])]
    max_posts = int(cfg.get("max_posts_par_flux", 3))
    for label, url in cfg.get(section, {}).items():
        try:
            items = parse_feed(fetch(url))
        except Exception as e:
            print("Flux en erreur", label, e)
            continue
        known = set(seen.get(url, []))
        first_time = url not in seen
        new = [i for i in items if i["id"] not in known]
        if not first_time:  # au 1er passage on ne poste rien (évite le spam)
            posted = 0
            for i in reversed(new):
                if section == "news" and keywords and not any(k in i["title"].lower() for k in keywords):
                    continue
                if posted >= max_posts:
                    break
                send(f"{emoji} <b>{html.escape(label)}</b>\n{html.escape(i['title'])}\n"
                     f"<a href=\"{html.escape(i['link'])}\">Lire la suite</a>")
                posted += 1
        seen[url] = ([i["id"] for i in items] + list(known))[:300]


def main():
    cfg = load(CONFIG_PATH, {})
    state = load(STATE_PATH, {})
    quotes = get_all_quotes(cfg)
    check_alerts(cfg, state, quotes)
    daily_summary(cfg, state, quotes)
    check_feeds(cfg, state, "news", "📰")
    check_feeds(cfg, state, "tweets", "🐦")
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
