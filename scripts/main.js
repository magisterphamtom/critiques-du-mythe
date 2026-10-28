/**
 * Critiques du Mythe — magisterphamtom
 * Carte plein écran, effets et son quand un jet de d100 donne une réussite critique ou une maladresse.
 * Systèmes : CoC7 (8.x) et Investigateurs de l'Ombre. Habillage selon l'époque.
 */
import { THEMES, PHRASES, hashString, themeFor } from "./themes.js";
import { jouerSynthese, jouerFichier } from "./sons.js";

const ID = "critiques-du-mythe";
const L = (k, d) => (d ? game.i18n.format(`CM.${k}`, d) : game.i18n.localize(`CM.${k}`));
const esc = (s) => foundry.utils.escapeHTML(String(s ?? ""));
const get = (k) => game.settings.get(ID, k);

/* ------------------------------------------------------------------ */
/*  Réglages                                                           */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  const s = (k, d) => game.settings.register(ID, k, d);
  const n = (k) => ({ name: `CM.Reglage.${k}.nom`, hint: `CM.Reglage.${k}.aide` });
  s("critique", { ...n("critique"), scope: "world", config: true, type: Boolean, default: true });
  s("maladresse", { ...n("maladresse"), scope: "world", config: true, type: Boolean, default: true });
  s("pnj", { ...n("pnj"), scope: "world", config: true, type: Boolean, default: true });
  s("theme", {
    ...n("theme"), scope: "world", config: true, type: String, default: "auto",
    choices: Object.fromEntries([["auto", "CM.Theme.auto"], ...THEMES.map((t) => [t, `CM.Theme.${t}`])])
  });
  s("sonCritique", { ...n("sonCritique"), scope: "world", config: true, type: String, default: "", filePicker: "audio" });
  s("sonMaladresse", { ...n("sonMaladresse"), scope: "world", config: true, type: String, default: "", filePicker: "audio" });
  // Préférences de chaque joueur
  s("afficher", { ...n("afficher"), scope: "client", config: true, type: Boolean, default: true });
  s("volume", { ...n("volume"), scope: "client", config: true, type: Number, default: 0.6, range: { min: 0, max: 1, step: 0.05 } });
  s("duree", { ...n("duree"), scope: "client", config: true, type: Number, default: 4, range: { min: 2, max: 8, step: 0.5 } });
  s("tremblement", { ...n("tremblement"), scope: "client", config: true, type: Boolean, default: true });
  s("sobre", { ...n("sobre"), scope: "client", config: true, type: Boolean, default: false });
});

/* ------------------------------------------------------------------ */
/*  Détection                                                          */
/* ------------------------------------------------------------------ */

/** Investigateurs de l'Ombre : niveau de réussite dans les drapeaux du jet. */
function detecterIO(message) {
  const d = message.flags?.["investigateurs-ombre"]?.jet;
  if (!d || !["critique", "maladresse"].includes(d.niveau)) return null;
  return { kind: d.niveau === "critique" ? "critical" : "fumble", acteurUuid: d.acteurUuid, libelle: d.libelle, resultat: d.resultat, cle: "io" };
}

/** CoC7 : chaque jet résolu affiche son total dans <h4 class="dice-total critical|fumble|…">. */
const TOTAUX = /<h4 class="dice-total([^"]*)"[^>]*>\s*(\d+)/g;
function compteCoC7(message) {
  const totaux = [...(message.content ?? "").matchAll(TOTAUX)];
  return {
    crit: totaux.filter((m) => /\bcritical\b/.test(m[1])).length,
    fumble: totaux.filter((m) => /\bfumble\b/.test(m[1])).length,
    dernier: totaux.filter((m) => /\b(critical|fumble)\b/.test(m[1])).at(-1)?.[2] ?? null
  };
}
const vus = new Map(); // id du message → { crit, fumble } déjà joués

function detecterCoC7(message) {
  if (!message.flags?.CoC7) return null;
  const n = compteCoC7(message);
  const avant = vus.get(message.id) ?? { crit: 0, fumble: 0 };
  vus.set(message.id, n);
  let kind = null;
  if (n.fumble > avant.fumble) kind = "fumble";
  else if (n.crit > avant.crit) kind = "critical";
  if (!kind) return null;
  const load = message.flags.CoC7.load ?? {};
  const libelle = (message.flavor || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { kind, acteurUuid: load.actorUuid ?? null, libelle, resultat: n.dernier != null ? Number(n.dernier) : null, cle: "coc7" };
}

async function acteurDe(uuid, message) {
  let a = null;
  try { a = uuid ? await fromUuid(uuid) : null; } catch { a = null; }
  a = a?.actor ?? a;
  return a ?? message.speakerActor ?? (message.speaker?.actor ? game.actors.get(message.speaker.actor) : null);
}

async function examiner(message) {
  try {
    const r = game.system.id === "investigateurs-ombre" ? detecterIO(message) : detecterCoC7(message);
    if (!r) return;
    if (r.kind === "critical" && !get("critique")) return;
    if (r.kind === "fumble" && !get("maladresse")) return;
    if (!get("afficher") || !message.isContentVisible) return;
    const acteur = await acteurDe(r.acteurUuid, message);
    if (!get("pnj") && acteur && !acteur.hasPlayerOwner) return;
    if (game.dice3d?.waitFor3DAnimationByMessageID) {
      try { await game.dice3d.waitFor3DAnimationByMessageID(message.id); } catch { /* rien */ }
    }
    afficher({
      kind: r.kind,
      theme: themeFor(acteur, get("theme")),
      nom: acteur?.name ?? message.speaker?.alias ?? message.author?.name ?? "",
      img: acteur?.img,
      libelle: r.libelle,
      resultat: r.resultat,
      graine: hashString(message.id)
    });
  } catch (e) {
    console.error(`${ID} |`, e);
  }
}

Hooks.on("createChatMessage", examiner);
Hooks.on("updateChatMessage", (message) => { if (game.system.id !== "investigateurs-ombre") examiner(message); });
Hooks.once("ready", () => {
  // Les messages déjà là ne rejouent pas leur effet s'ils sont mis à jour plus tard
  if (game.system.id !== "investigateurs-ombre") for (const m of game.messages) if (m.flags?.CoC7) vus.set(m.id, compteCoC7(m));
  game.modules.get(ID).api = { afficher, tester: (kind = "critical", theme) => afficher({ kind, theme: theme ?? themeFor(game.user.character, get("theme")), nom: game.user.character?.name ?? game.user.name, img: game.user.character?.img, libelle: L("Test.libelle"), resultat: kind === "critical" ? 1 : 100, graine: Date.now() }) };
});

/* ------------------------------------------------------------------ */
/*  Affichage                                                          */
/* ------------------------------------------------------------------ */

let enCours = null;

function particules(kind, graine, nb) {
  let h = graine;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 10000) / 10000;
  return Array.from({ length: nb }, () => {
    const x = Math.round(rnd() * 100), d = (rnd() * 2.5).toFixed(2), t = (2 + rnd() * 3).toFixed(2), s = (0.5 + rnd() * 1.2).toFixed(2);
    return `<i style="--x:${x}%;--d:${d}s;--t:${t}s;--s:${s}"></i>`;
  }).join("");
}

export function afficher({ kind, theme, nom, img, libelle, resultat, graine = Date.now() }) {
  enCours?.remove();
  const sobre = get("sobre");
  const duree = Math.max(2, Number(get("duree")) || 4);
  const crit = kind === "critical";
  const phrase = L(`Phrase.${theme}.${crit ? "critique" : "maladresse"}.${(graine % PHRASES) + 1}`);
  const nombre = resultat != null ? String(resultat).padStart(2, "0") : crit ? "01" : "100";
  const el = document.createElement("div");
  el.id = "cm-overlay";
  el.className = `cm-overlay cm-t-${theme} ${crit ? "cm-crit" : "cm-fumble"} ${sobre ? "cm-sobre" : ""}`;
  el.style.setProperty("--cm-duree", `${duree}s`);
  el.innerHTML = `
    <div class="cm-fond"></div>
    ${sobre ? "" : `<div class="cm-rayons"></div><div class="cm-fissures"></div><div class="cm-tentacules"></div>
    <div class="cm-particules">${particules(kind, graine, crit ? 28 : 22)}</div>`}
    <div class="cm-carte">
      <div class="cm-cadre">
        <div class="cm-orn cm-orn-h"></div>
        <div class="cm-kicker">${L(crit ? "Titre.critique" : "Titre.maladresse")}</div>
        <div class="cm-nombre">${esc(nombre)}</div>
        ${img ? `<img class="cm-portrait" src="${esc(img)}" alt="">` : ""}
        <div class="cm-nom">${esc(nom)}</div>
        ${libelle ? `<div class="cm-libelle">${esc(libelle)}</div>` : ""}
        <div class="cm-phrase">${esc(phrase)}</div>
        <div class="cm-orn cm-orn-b"></div>
      </div>
    </div>`;
  el.addEventListener("click", () => fermer(el));
  document.body.append(el);
  enCours = el;

  // Son
  const vol = Number(get("volume")) || 0;
  const fichier = get(crit ? "sonCritique" : "sonMaladresse");
  if (fichier) jouerFichier(fichier, vol); else jouerSynthese(kind, vol);

  // Tremblement de l'écran (plus fort sur une maladresse)
  if (get("tremblement") && !sobre) {
    document.body.classList.remove("cm-tremble", "cm-tremble-fort");
    void document.body.offsetWidth;
    document.body.classList.add(crit ? "cm-tremble" : "cm-tremble-fort");
    setTimeout(() => document.body.classList.remove("cm-tremble", "cm-tremble-fort"), 1200);
  }
  setTimeout(() => fermer(el), duree * 1000);
}

function fermer(el) {
  if (!el?.isConnected || el.classList.contains("cm-sortie")) return;
  el.classList.add("cm-sortie");
  setTimeout(() => { el.remove(); if (enCours === el) enCours = null; }, 600);
}
