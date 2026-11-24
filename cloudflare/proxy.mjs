// Worker « mag » : sert le Mag sur https://mag.lebontrader.workers.dev (via le worker principal)
// et /ouvrir, qui fait sortir le lecteur du navigateur intégré de Telegram vers Safari (iPhone)
// ou le navigateur par défaut (Android).
const OPEN_PAGE = (target) => `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Le Mag des marchés</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7f2;color:#14161a;font-family:system-ui,-apple-system,sans-serif;text-align:center}
.b{max-width:340px;padding:24px}h1{font-family:Georgia,serif;font-size:30px;margin:0 0 8px}h1 span{color:#d52b1e}p{color:#5d6470;margin:0 0 22px}
a.btn{display:block;background:#d52b1e;color:#fff;text-decoration:none;font-weight:700;padding:14px;border-radius:12px;margin:10px 0}
a.alt{color:#5d6470;font-size:14px}#f{display:none}</style></head>
<body><div class="b"><h1>Le <span>Mag</span> des marchés</h1><p>Ouverture dans ton navigateur…</p>
<div id="f"><a class="btn" id="s" href="${target}">Ouvrir dans Safari</a><a class="alt" href="${target}">ou lire ici</a></div></div>
<script>
var t=${JSON.stringify(target)}, ua=navigator.userAgent, ios=/iPhone|iPad|iPod/.test(ua), and=/Android/.test(ua);
var tg=!!window.TelegramWebviewProxy||/Telegram/i.test(ua);
var webview=ios&&(!/Safari\\//.test(ua)||tg);
if(ios&&webview){document.getElementById('s').href='x-safari-'+t;location.href='x-safari-'+t;}
else if(and&&(tg||/; wv\\)/.test(ua))){document.getElementById('s').textContent='Ouvrir dans le navigateur';var i='intent://'+t.replace(/^https?:\\/\\//,'')+'#Intent;scheme=https;S.browser_fallback_url='+encodeURIComponent(t)+';end';document.getElementById('s').href=i;location.href=i;}
else{location.replace(t);}
setTimeout(function(){document.getElementById('f').style.display='block';},1200);
</script></body></html>`;

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/ouvrir") {
      let p = u.searchParams.get("p") || "/";
      if (!/^\/(mag(\/[\w-]*)*)?$/.test(p)) p = "/";
      return new Response(OPEN_PAGE(u.origin + p), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (u.pathname === "/" || u.pathname === "") u.pathname = "/mag";
    else if (!u.pathname.startsWith("/mag")) return Response.redirect(u.origin + "/", 302);
    return env.BOT.fetch(new Request(u.toString(), req));
  },
};
