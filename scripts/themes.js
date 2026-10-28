/**
 * Thèmes d'époque : couleurs et polices dans le CSS (classe .cm-t-<id>),
 * ici les textes et le choix du thème.
 */
export const THEMES = ["gaslight", "jazz", "montagnes", "guerre", "seventies", "moderne"];

/** Phrases tirées au hasard sous le titre (clé de traduction CM.Phrase.<theme>.<kind>.<n>). */
export const PHRASES = 4;

/** Petit hasard reproductible : même tirage sur tous les écrans pour un même message. */
export function hashString(s) {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const IO_EPOQUE = { 1890: "gaslight", 1930: "jazz", 1940: "guerre", 1970: "seventies", 2025: "moderne" };
const IO_AMBIANCE = { montagnes: "montagnes", newyork: "jazz", ny2026: "moderne", antarctique2026: "moderne" };
const C7CC = { annees20: "jazz", newyork: "jazz", montagnes: "montagnes", ny2026: "moderne", antarctique2026: "moderne", pulp: "jazz", modern: "moderne" };

/**
 * Thème à utiliser.
 * - réglage du MJ s'il impose un thème ;
 * - Investigateurs de l'Ombre : époque de l'acteur (ou du monde), ambiance de la campagne ;
 * - CoC7 : thème du chat de « Cartes de chat thématiques » (classe c7cc-* sur <body>).
 */
export function themeFor(actor, forced) {
  if (forced && forced !== "auto" && THEMES.includes(forced)) return forced;
  if (game.system.id === "investigateurs-ombre") {
    const ep = actor?.system?.epoque || game.settings.get("investigateurs-ombre", "epoque");
    let amb = "";
    try { amb = game.settings.get("investigateurs-ombre", "ambiance"); } catch { amb = ""; }
    if (ep === "1930" && IO_AMBIANCE[amb]) return IO_AMBIANCE[amb];
    if (ep === "2025" && IO_AMBIANCE[amb] === "moderne") return "moderne";
    return IO_EPOQUE[ep] ?? "jazz";
  }
  for (const [cls, t] of Object.entries(C7CC)) if (document.body.classList.contains(`c7cc-${cls}`)) return t;
  return "jazz";
}
