/**
 * Sons de synthèse (Web Audio) : aucun fichier à fournir.
 * Réussite critique : accord qui monte et scintille. Maladresse : grondement grave, choc et dissonance.
 * Le MJ peut les remplacer par ses propres fichiers dans les réglages.
 */
let ctx = null;
const audio = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());

function env(g, t0, a, d, v) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

function note(c, out, freq, t0, dur, type = "sine", vol = 0.2, detune = 0) {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
  env(g, t0, 0.02, dur, vol);
  o.connect(g).connect(out); o.start(t0); o.stop(t0 + dur + 0.1);
}

function bruit(c, out, t0, dur, vol, filtre = 400) {
  const n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = n;
  const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filtre;
  const g = c.createGain(); env(g, t0, 0.01, dur, vol);
  s.connect(f).connect(g).connect(out); s.start(t0);
}

export function jouerSynthese(kind, volume = 0.6) {
  if (volume <= 0) return;
  let c;
  try { c = audio(); if (c.state === "suspended") c.resume(); } catch { return; }
  const out = c.createGain(); out.gain.value = volume; out.connect(c.destination);
  const t = c.currentTime + 0.02;
  if (kind === "critical") {
    // Arpège de cloches qui monte, puis accord tenu qui scintille
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(c, out, f, t + i * 0.09, 1.4, "triangle", 0.16));
    [523.25, 783.99, 1046.5, 1318.5].forEach((f) => note(c, out, f, t + 0.42, 2.2, "sine", 0.09, 6));
    for (let i = 0; i < 8; i++) note(c, out, 2093 + Math.random() * 1500, t + 0.5 + i * 0.12, 0.25, "sine", 0.04);
  } else {
    // Choc sourd, grondement, cluster dissonant qui glisse vers le grave
    bruit(c, out, t, 1.6, 0.55, 180);
    note(c, out, 55, t, 2.4, "sawtooth", 0.18);
    note(c, out, 58.3, t + 0.05, 2.4, "sawtooth", 0.14);
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "square"; o.frequency.setValueAtTime(220, t + 0.15); o.frequency.exponentialRampToValueAtTime(62, t + 1.8);
    env(g, t + 0.15, 0.05, 1.8, 0.07); o.connect(g).connect(out); o.start(t + 0.15); o.stop(t + 2.2);
    [311.1, 329.6, 349.2].forEach((f) => note(c, out, f, t + 0.3, 1.6, "triangle", 0.05, -15));
  }
}

export function jouerFichier(src, volume = 0.6) {
  if (!src || volume <= 0) return;
  foundry.audio.AudioHelper.play({ src, volume, autoplay: true, loop: false }, false);
}
