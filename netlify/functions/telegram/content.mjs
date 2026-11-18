// Contenu pédagogique du bot « Le bon trader » (HTML Telegram : <b>, <i>, <code>)

export const LESSONS = [
  {
    t: "1. C'est quoi le trading ?",
    b: `Le <b>trading</b>, c'est acheter et vendre des actifs (actions, devises, crypto, or…) pour profiter des variations de prix, sur des durées courtes à moyennes.

<b>Trader ≠ investisseur</b>
• L'investisseur achète une entreprise pour des années.
• Le trader joue des mouvements de quelques minutes à quelques semaines.

<b>Les styles</b>
• <b>Scalping</b> : quelques secondes/minutes, beaucoup de trades.
• <b>Day trading</b> : tout est fermé avant la fin de la journée.
• <b>Swing trading</b> : quelques jours à quelques semaines. Le plus adapté quand on a un travail à côté.

<b>Acheter ou vendre</b>
• <b>Long</b> (achat) : tu gagnes si le prix monte.
• <b>Short</b> (vente) : tu gagnes si le prix baisse.

⚠️ La majorité des débutants perdent, surtout avec effet de levier. Le but n°1 au début : <b>protéger ton capital</b>, pas devenir riche vite.`,
  },
  {
    t: "2. Lire un graphique (bougies)",
    b: `Un graphique en <b>chandeliers japonais</b> montre pour chaque période (1 min, 1 h, 1 jour…) quatre prix :
• <b>Ouverture</b> (open)
• <b>Plus haut</b> (high)
• <b>Plus bas</b> (low)
• <b>Clôture</b> (close)

🟢 <b>Bougie verte</b> : clôture au-dessus de l'ouverture → les acheteurs ont gagné la période.
🔴 <b>Bougie rouge</b> : clôture en dessous → les vendeurs ont gagné.

Le <b>corps</b> = entre ouverture et clôture. Les <b>mèches</b> = les extrêmes atteints puis rejetés.

<b>Ce qu'il faut lire</b>
• Grand corps = mouvement fort et décidé.
• Longue mèche basse = les vendeurs ont poussé, les acheteurs ont repris le contrôle (rejet du bas).
• Petit corps avec mèches des deux côtés (doji) = indécision.

💡 Une bougie seule ne veut rien dire : regarde toujours <b>où</b> elle se forme (sur un support, une résistance, dans une tendance…).`,
  },
  {
    t: "3. Les types d'ordres",
    b: `<b>Ordre au marché</b> : exécuté tout de suite au meilleur prix dispo. Rapide, mais tu peux subir du <i>slippage</i> (prix un peu moins bon).

<b>Ordre limite</b> : tu fixes ton prix. Achat limite = sous le prix actuel, vente limite = au-dessus. Pas de slippage, mais il peut ne jamais être exécuté.

<b>Ordre stop</b> : se déclenche quand le prix atteint un niveau, puis part au marché.
• <b>Stop-loss (SL)</b> : coupe ta perte automatiquement. <b>Obligatoire sur chaque trade.</b>
• <b>Stop d'entrée</b> : entrer quand le prix casse un niveau.

<b>Take-profit (TP)</b> : encaisse le gain automatiquement à ton objectif.

<b>Trailing stop</b> : un stop qui suit le prix à distance fixe pour protéger les gains.

💡 Règle d'or : tu sais où tu sors <b>avant</b> d'entrer (SL et TP posés dès l'ouverture).`,
  },
  {
    t: "4. Spread, levier et marge",
    b: `<b>Spread</b> : écart entre prix d'achat (ask) et prix de vente (bid). C'est un coût payé à chaque trade : plus tu trades souvent, plus il pèse.

<b>Effet de levier</b> : tu contrôles une position plus grosse que ton capital.
Exemple : 1 000 CHF avec levier x10 = position de 10 000 CHF.
• Le marché bouge de +1 % → +100 CHF (+10 % de ton capital).
• Le marché bouge de −1 % → −100 CHF (−10 %).
Le levier multiplie <b>les gains ET les pertes</b>.

<b>Marge</b> : la somme bloquée par le courtier pour garder ta position ouverte.
<b>Appel de marge / liquidation</b> : si tes pertes mangent la marge, le courtier ferme ta position de force.

💡 Avec un levier x10, un mouvement d'environ −10 % contre toi suffit à tout perdre. Débutant : levier faible, ou pas de levier du tout. Utilise /levier pour simuler.`,
  },
  {
    t: "5. Gestion du risque (le plus important)",
    b: `La gestion du risque, c'est ce qui sépare ceux qui durent de ceux qui explosent leur compte.

<b>Règle des 1 %</b> : ne risque jamais plus de 1 % (max 2 %) de ton capital sur un trade.
Capital 5 000 CHF → perte max par trade = 50 CHF.

<b>Pourquoi ?</b> Même 10 pertes d'affilée (ça arrive !) ne te coûtent qu'environ 10 %.

<b>Les pertes sont asymétriques</b>
• −10 % → il faut +11 % pour revenir
• −25 % → il faut +33 %
• −50 % → il faut +100 %
(essaie /perte 50)

<b>Ratio risque/rendement (R:R)</b> : vise au moins 1:2 (tu risques 1 pour gagner 2). Avec un R:R de 1:2, tu es rentable même en gagnant seulement 34 % de tes trades. Essaie /rr.

<b>Limite journalière</b> : après 2-3 pertes dans la journée, tu arrêtes. Point.`,
  },
  {
    t: "6. Calculer la taille de position",
    b: `On ne choisit pas sa taille « au feeling » : on la <b>calcule</b> à partir du stop.

<b>Formule</b>
Taille = (Capital × Risque %) ÷ (Distance entre entrée et stop)

<b>Exemple</b>
• Capital : 5 000 CHF, risque 1 % → 50 CHF max
• Achat à 100, stop à 95 → 5 CHF de risque par action
• Taille = 50 ÷ 5 = <b>10 actions</b>

Si le stop est touché, tu perds exactement 50 CHF, quel que soit l'actif.

💡 Un stop plus large = une position plus petite. C'est le stop (logique technique) qui décide, puis la taille s'adapte, jamais l'inverse.

👉 Calcule direct : <code>/position 5000 1 100 95</code>`,
  },
  {
    t: "7. Supports et résistances",
    b: `<b>Support</b> : zone où le prix a déjà rebondi vers le haut. Les acheteurs y sont présents.
<b>Résistance</b> : zone où le prix a déjà été rejeté vers le bas. Les vendeurs y sont présents.

<b>Comment les tracer</b>
• Cherche les zones touchées <b>plusieurs fois</b> (2-3 contacts minimum).
• Trace des <b>zones</b>, pas des lignes au centime près.
• Commence sur une unité de temps large (jour, 4 h).

<b>Inversion des rôles</b> : une résistance cassée devient souvent un support (et inversement). Le « retest » de la zone cassée est un point d'entrée classique.

<b>Pièges</b>
• Faux breakout : le prix casse la zone puis revient dedans. Attends une clôture nette.
• Plus une zone est testée, plus elle s'use.

💡 Les chiffres ronds (1.1000, 50 000 $…) agissent souvent comme supports/résistances psychologiques.`,
  },
  {
    t: "8. Tendances et structure de marché",
    b: `<b>Tendance haussière</b> : sommets de plus en plus hauts (HH) et creux de plus en plus hauts (HL).
<b>Tendance baissière</b> : sommets plus bas (LH) et creux plus bas (LL).
<b>Range</b> : le prix oscille entre un support et une résistance.

<b>« The trend is your friend »</b>
• En tendance haussière, cherche surtout des achats sur les replis.
• En tendance baissière, cherche des ventes sur les rebonds.

<b>Changement de tendance</b> : quand la structure casse (ex. en hausse, le prix passe sous le dernier creux HL). Ça ne garantit rien, mais c'est un signal d'alerte.

<b>Multi-unités de temps</b>
• Unité large (jour) → la direction.
• Unité moyenne (4 h / 1 h) → la zone d'entrée.
• Petite unité (15 min) → le timing précis.`,
  },
  {
    t: "9. Les indicateurs utiles",
    b: `Les indicateurs sont des calculs faits à partir du prix. Ils <b>confirment</b>, ils ne prédisent pas.

<b>Moyennes mobiles (MM / EMA)</b>
• Prix au-dessus de la MM 200 → contexte plutôt haussier.
• Elles servent aussi de supports/résistances dynamiques.

<b>RSI (0 à 100)</b>
• Au-dessus de 70 = suracheté, en dessous de 30 = survendu.
• ⚠️ En forte tendance, il peut rester suracheté longtemps : ce n'est pas un signal de vente à lui seul.
• Les <b>divergences</b> (prix fait un plus haut, RSI non) signalent un essoufflement.

<b>MACD</b> : croisements de moyennes pour repérer l'élan (momentum).

<b>Volume</b> : un mouvement avec gros volume est plus crédible.

💡 2-3 indicateurs max. Un graphique surchargé = paralysie. Le prix et la structure passent avant tout.`,
  },
  {
    t: "10. Psychologie du trader",
    b: `80 % du trading se joue dans la tête.

<b>Les pièges classiques</b>
• <b>FOMO</b> : entrer en retard par peur de rater le mouvement.
• <b>Revenge trading</b> : vouloir se « refaire » juste après une perte → grosses tailles, mauvaises décisions.
• <b>Déplacer son stop</b> pour ne pas encaisser la perte.
• <b>Couper les gains trop tôt</b> et laisser courir les pertes.
• <b>Excès de confiance</b> après une série gagnante.

<b>Les antidotes</b>
• Un <b>plan écrit</b> : tu n'improvises pas.
• Une perte = un coût normal du métier, pas un échec.
• Pense en <b>séries de 20 trades</b>, pas trade par trade.
• Pause obligatoire après 2-3 pertes.
• Taille de position qui te laisse dormir tranquille.`,
  },
  {
    t: "11. Construire son plan de trading",
    b: `Un plan de trading, c'est ton mode d'emploi écrit. Sans lui, tu joues.

<b>Il doit répondre à :</b>
1. <b>Quels marchés</b> je trade ? (ex. EUR/USD, or, 3 actions)
2. <b>Quelles heures</b> ? (ex. session de Londres)
3. <b>Ma stratégie</b> : conditions précises d'entrée (ex. rebond sur support en tendance haussière + bougie de rejet).
4. <b>Où je place mon stop</b> et mon objectif.
5. <b>Combien je risque</b> par trade (1 %).
6. <b>Mes limites</b> : perte max par jour / par semaine.
7. <b>Ma routine</b> avant, pendant et après la séance.

<b>Teste avant de risquer</b>
• <b>Backtest</b> : rejoue ta stratégie sur l'historique (50-100 trades).
• <b>Compte démo</b> quelques semaines.
• Puis petit capital réel.`,
  },
  {
    t: "12. Le journal de trading",
    b: `Le journal, c'est ton meilleur prof. Note <b>chaque</b> trade :

• Date, actif, long/short
• Entrée, stop, objectif, taille
• Pourquoi tu es entré (capture du graphique)
• Résultat en CHF et en <b>R</b> (multiple du risque)
• Ton état émotionnel
• As-tu respecté ton plan ? Oui/Non

<b>Chaque semaine, analyse :</b>
• Taux de réussite et R moyen
• Tes erreurs qui reviennent
• Les setups qui marchent le mieux

<b>Espérance de gain</b>
Espérance = (% gagnants × gain moyen) − (% perdants × perte moyenne)
Si elle est positive sur 50+ trades, ta méthode a un avantage.

💡 Un trade perdant qui respecte le plan = bon trade. Un trade gagnant hors plan = mauvais trade.`,
  },
];

// Lexique : clé = mot recherché (minuscules, sans accents)
export const GLOSSARY = {
  "action": ["Action", "Part du capital d'une entreprise cotée en bourse. Son prix varie selon l'offre et la demande et les résultats de l'entreprise."],
  "ask": ["Ask", "Prix auquel tu peux acheter (prix vendeur). Toujours un peu au-dessus du bid ; l'écart est le spread."],
  "backtest": ["Backtest", "Tester une stratégie sur des données passées pour voir si elle aurait été rentable avant d'y mettre de l'argent."],
  "baissier": ["Baissier (bearish)", "Qui anticipe ou constate une baisse des prix."],
  "bid": ["Bid", "Prix auquel tu peux vendre (prix acheteur). Toujours un peu sous l'ask."],
  "bougie": ["Bougie (chandelier)", "Représentation du prix sur une période : ouverture, plus haut, plus bas, clôture. Voir la leçon 2."],
  "breakout": ["Breakout (cassure)", "Le prix sort franchement d'une zone (résistance, range). Attention aux faux breakouts : attends une clôture."],
  "bull": ["Bull / Bear", "Bull (taureau) = marché haussier. Bear (ours) = marché baissier."],
  "capitalisation": ["Capitalisation boursière", "Prix de l'action × nombre d'actions. Mesure la taille d'une entreprise en bourse."],
  "cfd": ["CFD", "Contrat sur la différence : tu spécules sur le prix d'un actif sans le posséder, souvent avec levier. Très risqué pour les débutants."],
  "crypto": ["Cryptomonnaie", "Monnaie numérique décentralisée (Bitcoin, Ethereum…). Marché ouvert 24h/24, très volatil."],
  "day trading": ["Day trading", "Ouvrir et fermer ses positions dans la même journée."],
  "divergence": ["Divergence", "Le prix et un indicateur (RSI, MACD) vont dans des sens opposés : signe d'essoufflement possible du mouvement."],
  "dividende": ["Dividende", "Part des bénéfices versée par une entreprise à ses actionnaires."],
  "doji": ["Doji", "Bougie avec ouverture ≈ clôture : indécision du marché."],
  "drawdown": ["Drawdown", "Baisse de ton capital depuis son plus haut. Ex. de 10 000 à 8 000 = drawdown de 20 %."],
  "ema": ["EMA", "Moyenne mobile exponentielle : donne plus de poids aux prix récents que la moyenne simple."],
  "esperance": ["Espérance de gain", "Gain moyen attendu par trade = (%gagnants × gain moyen) − (%perdants × perte moyenne). Doit être positive."],
  "etf": ["ETF", "Fonds coté qui réplique un indice ou un panier d'actifs (ex. S&P 500). Diversifié et peu coûteux."],
  "fomo": ["FOMO", "Fear Of Missing Out : peur de rater le mouvement, qui pousse à entrer trop tard et sans plan."],
  "forex": ["Forex", "Marché des devises (EUR/USD, USD/CHF…). Le plus grand marché du monde, ouvert 24h/24 en semaine."],
  "gap": ["Gap", "Trou entre la clôture d'une bougie et l'ouverture de la suivante, souvent après une news ou le week-end."],
  "haussier": ["Haussier (bullish)", "Qui anticipe ou constate une hausse des prix."],
  "indice": ["Indice boursier", "Panier d'actions qui représente un marché : SMI (Suisse), S&P 500 et Nasdaq (USA), CAC 40 (France)."],
  "levier": ["Effet de levier", "Contrôler une position plus grosse que son capital. Multiplie gains ET pertes. Voir leçon 4 et /levier."],
  "limite": ["Ordre limite", "Ordre exécuté uniquement à ton prix ou mieux."],
  "liquidite": ["Liquidité", "Facilité à acheter/vendre sans faire bouger le prix. Marché liquide = spreads serrés."],
  "long": ["Long", "Position acheteuse : tu gagnes si le prix monte."],
  "lot": ["Lot", "Unité de taille au forex. 1 lot standard = 100 000 unités de devise, mini-lot = 10 000, micro-lot = 1 000."],
  "macd": ["MACD", "Indicateur de momentum basé sur la différence entre deux moyennes mobiles exponentielles."],
  "marge": ["Marge", "Somme bloquée par le courtier pour maintenir une position à levier."],
  "moyenne mobile": ["Moyenne mobile", "Moyenne des prix sur N périodes (ex. MM 50, MM 200). Lisse le prix et montre la tendance."],
  "pip": ["Pip", "Plus petite variation standard au forex : 0,0001 pour la plupart des paires (0,01 pour les paires en JPY)."],
  "plan": ["Plan de trading", "Règles écrites : marchés, horaires, conditions d'entrée/sortie, risque, limites. Voir leçon 11."],
  "range": ["Range", "Marché sans tendance qui oscille entre un support et une résistance."],
  "resistance": ["Résistance", "Zone de prix où les vendeurs dominent et où le prix a déjà été rejeté. Voir leçon 7."],
  "rr": ["Ratio R:R", "Risque/rendement : ce que tu risques face à ce que tu vises. 1:2 = tu risques 1 pour gagner 2. Voir /rr."],
  "rsi": ["RSI", "Indicateur de 0 à 100 : >70 suracheté, <30 survendu. À utiliser avec le contexte, pas seul."],
  "scalping": ["Scalping", "Trading très court terme : quelques secondes à quelques minutes par trade."],
  "short": ["Short", "Position vendeuse : tu gagnes si le prix baisse."],
  "slippage": ["Slippage", "Différence entre le prix voulu et le prix réellement obtenu, fréquent lors des news."],
  "spread": ["Spread", "Écart entre prix d'achat et prix de vente. C'est un coût à chaque trade."],
  "stop loss": ["Stop-loss", "Ordre qui ferme automatiquement ta position à perte à un niveau défini. Obligatoire !"],
  "support": ["Support", "Zone de prix où les acheteurs dominent et où le prix a déjà rebondi. Voir leçon 7."],
  "swing trading": ["Swing trading", "Garder ses positions quelques jours à quelques semaines pour capter un mouvement."],
  "take profit": ["Take-profit", "Ordre qui encaisse automatiquement le gain quand le prix atteint ton objectif."],
  "tendance": ["Tendance", "Direction générale du prix : haussière (plus hauts et plus bas croissants), baissière ou range. Voir leçon 8."],
  "timeframe": ["Unité de temps (timeframe)", "Durée d'une bougie : M1, M15, H1, H4, D1… Analyse du large vers le petit."],
  "trailing stop": ["Trailing stop", "Stop qui suit le prix à distance fixe pour protéger les gains."],
  "volatilite": ["Volatilité", "Amplitude des variations de prix. Forte volatilité = plus d'opportunités mais plus de risque."],
  "volume": ["Volume", "Quantité échangée sur une période. Confirme la force d'un mouvement."],
};

export const QUIZ = [
  ["Tu as 2 000 CHF et tu appliques la règle du 1 %. Quelle perte max par trade ?", ["2 CHF", "20 CHF", "200 CHF"], 1, "1 % de 2 000 = 20 CHF. C'est ta perte max si le stop est touché."],
  ["Une bougie verte signifie…", ["La clôture est au-dessus de l'ouverture", "Le volume a augmenté", "Le prix va monter demain"], 0, "Verte = clôture > ouverture sur la période. Ça ne prédit rien à elle seule."],
  ["Après une perte de 50 %, combien faut-il gagner pour revenir à zéro ?", ["+50 %", "+75 %", "+100 %"], 2, "De 100 à 50 il faut doubler : +100 %. D'où l'importance de limiter les pertes."],
  ["Quel ordre coupe automatiquement ta perte ?", ["Take-profit", "Stop-loss", "Ordre limite"], 1, "Le stop-loss ferme la position à perte à ton niveau prédéfini."],
  ["Avec un R:R de 1:2, quel taux de réussite minimum pour être rentable (hors frais) ?", ["Environ 34 %", "50 %", "67 %"], 0, "Seuil = 1/(1+2) ≈ 33,3 %. Au-dessus, tu gagnes de l'argent."],
  ["En tendance haussière, les creux sont…", ["De plus en plus bas", "De plus en plus hauts", "Toujours au même niveau"], 1, "Tendance haussière = plus hauts ET plus bas de plus en plus hauts (HH/HL)."],
  ["RSI à 80 : qu'est-ce que ça veut dire ?", ["Il faut vendre tout de suite", "Le marché est en zone de surachat", "Le volume est élevé"], 1, "Suracheté, mais en forte tendance ça peut durer. Ce n'est pas un signal de vente à lui seul."],
  ["Une résistance cassée devient souvent…", ["Un support", "Inutile", "Une résistance plus forte"], 0, "C'est l'inversion des rôles, souvent testée lors d'un « retest »."],
  ["Levier x20 : un mouvement de combien contre toi peut effacer ta marge ?", ["Environ 5 %", "Environ 20 %", "Environ 50 %"], 0, "100 % ÷ 20 = 5 %. Le levier rend chaque petit mouvement énorme."],
  ["Le spread, c'est…", ["Une commission fixe mensuelle", "L'écart entre prix d'achat et de vente", "La distance au stop"], 1, "Ask − bid. Un coût payé à chaque trade."],
  ["Capital 10 000, risque 1 %, entrée 50, stop 48. Combien d'actions ?", ["20", "50", "100"], 1, "Risque = 100 CHF ; 2 par action → 100 ÷ 2 = 50 actions."],
  ["Le FOMO, c'est…", ["Une stratégie de scalping", "La peur de rater un mouvement", "Un indicateur de volume"], 1, "Fear Of Missing Out : il pousse à entrer trop tard, sans plan."],
  ["Que faire après 3 pertes d'affilée dans la journée ?", ["Doubler la taille pour se refaire", "Arrêter pour la journée", "Retirer son stop"], 1, "Limite journalière : on coupe pour éviter le revenge trading."],
  ["Un swing trader garde ses positions…", ["Quelques secondes", "Quelques jours à semaines", "Plusieurs années"], 1, "Le swing vise des mouvements de quelques jours à quelques semaines."],
  ["Quelle unité de temps pour définir la direction générale ?", ["La plus petite (M1)", "La plus large (jour/H4)", "Peu importe"], 1, "On analyse du large vers le petit : le jour donne la direction."],
  ["Un trade perdant qui respecte ton plan est…", ["Un mauvais trade", "Un bon trade", "Une erreur à cacher"], 1, "Le respect du plan compte plus que le résultat d'un seul trade."],
  ["Le SMI est…", ["L'indice des grandes actions suisses", "Une crypto", "Un indicateur technique"], 0, "Swiss Market Index : les 20 plus grosses capitalisations suisses."],
  ["Pour un débutant, le levier idéal c'est…", ["Le plus haut possible", "Faible ou aucun", "x100 pour aller vite"], 1, "Sans expérience, le levier accélère surtout les pertes."],
  ["Un faux breakout, c'est quand…", ["Le prix casse une zone puis revient dedans", "Le marché est fermé", "Le spread s'élargit"], 0, "D'où l'intérêt d'attendre une clôture nette au-delà de la zone."],
  ["Long sur EUR/USD signifie…", ["Tu achètes l'euro contre le dollar", "Tu vends l'euro", "Tu gardes longtemps"], 0, "Long EUR/USD = achat d'euros contre dollars, gagnant si la paire monte."],
];

export const AI_SYSTEM = `Tu es « Le bon trader », un prof de trading francophone (Suisse romande) dans un chat Telegram privé réservé aux membres du canal « Le bon trader ».

Ta mission : expliquer le trading de façon ultra claire, concrète et pédagogique, à des débutants comme à des intermédiaires.

Style :
- Français simple, tutoiement, ton motivant mais honnête.
- Réponses courtes et structurées (idéalement moins de 250 mots) : une idée par ligne, des exemples chiffrés en CHF quand c'est utile.
- Mise en forme Telegram en HTML uniquement : <b>gras</b>, <i>italique</i>, <code>code</code>. Pas de Markdown (pas de **, pas de #), pas d'autres balises. Listes avec « • ».
- Termine si utile par une piste pour aller plus loin (commande du bot : /lecons, /lexique, /position, /rr, /quiz).

Règles :
- Tu ne donnes jamais de conseil d'investissement personnalisé ni de signal (« achète X maintenant », prix cible garanti). Si on te le demande, explique comment analyser soi-même et rappelle que c'est de l'information, pas un conseil.
- Tu insistes sur la gestion du risque (stop-loss, 1 % par trade, levier prudent).
- Tu n'inventes pas de prix ni d'actualités : tu n'as pas accès aux cours en direct (la commande /prix les donne).
- Hors sujet trading/finance : réponds en une phrase et ramène gentiment vers le trading.`;
