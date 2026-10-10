// Compass: quiz, result codes and the group views.
// Everything runs in the visitor's browser; the only thing ever sent anywhere is a result
// (or a removal request) the visitor explicitly chooses to send to Teun's Google Form.
(() => {
"use strict";

const Q = window.COMPASS_QUESTIONS;
const SECTIONS = window.COMPASS_SECTIONS;
const CFG = window.COMPASS_CONFIG || {};
const N = Q.length;
const $ = id => document.getElementById(id);

// ============================================================================================
// 1. Result codes
// --------------------------------------------------------------------------------------------
// Layout of a code:  C<version> <answer chars> <2 check chars> <label, 0–3 chars> . <name>
// Each answer has 6 possible states (unanswered + 5 points). All answers are read as one big
// base-6 number, which is then written in base 64 using URL-safe characters: 55 characters for
// 127 answers. The two check characters catch codes that were mistyped or cut off.
//
// Each version only ADDS statements at the end of the list, so an older code still reads fine:
// the statements added after it simply count as unanswered.
//   version 1: the first 100 statements (10 October 2026)
//   version 2: + 27 economy statements = 127
// ============================================================================================
const CODE_LENGTHS = { 1: 100, 2: 127 };
const CODE_VERSION = 2;
if (CODE_LENGTHS[CODE_VERSION] !== N) throw new Error("questions.js has " + N + " statements; update CODE_LENGTHS");
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const ansLen = n => Math.ceil(n * Math.log2(6) / 6);
const ANS_LEN = ansLen(N);
const NAME_MAX = 24;

function checksum(str) {
  let h = 2166136261;                       // FNV-1a hash, folded into 12 bits = 2 characters
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return B64[h & 63] + B64[(h >>> 6) & 63];
}
// Names are percent-encoded so that a code never contains spaces or sentence punctuation.
// A space becomes "_" to keep the name readable inside the code.
function encodeName(name) {
  return encodeURIComponent(name.replace(/_/g, "\u0000"))
    .replace(/[!'()*.~]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "_").replace(/%00/g, "%5F");
}
function decodeName(s) { return decodeURIComponent(s.replace(/_/g, "%20")); }

function cleanName(s) { return (s || "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX); }
function cleanTag(s) { return (s || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 3); }

function encode(name, tag, answers) {
  let n = 0n;
  for (let i = N - 1; i >= 0; i--) n = n * 6n + BigInt(answers[i] === null ? 0 : answers[i] + 1);
  let ans = "";
  for (let k = 0; k < ANS_LEN; k++) { ans = B64[Number(n % 64n)] + ans; n /= 64n; }
  const tail = cleanTag(tag) + "." + encodeName(cleanName(name));
  const prefix = "C" + CODE_VERSION;
  return prefix + ans + checksum(prefix + ans + tail) + tail;
}

// One pattern per version, newest first, because each version has its own answer length.
const CODE_RES = Object.keys(CODE_LENGTHS).map(Number).sort((a, b) => b - a).map(v => ({
  v, count: CODE_LENGTHS[v],
  re: new RegExp("C" + v + "([A-Za-z0-9_-]{" + ansLen(CODE_LENGTHS[v]) + "})([A-Za-z0-9_-]{2})([A-Za-z0-9]{0,3})\\.([A-Za-z0-9_%-]+)")
}));
// Returns {name, tag, answers, code, version} or {error: "old" | "newer" | "broken" | "none"}.
function decode(input) {
  const s = String(input || "").trim();
  if (!s) return { error: "none" };
  let sawCandidate = false;
  for (const { v, count, re } of CODE_RES) {
    const m = s.match(re);
    if (!m) continue;
    sawCandidate = true;
    const [code, ans, chk, tag, nameEnc] = m;
    if (checksum("C" + v + ans + tag + "." + nameEnc) !== chk) continue;
    let n = 0n;
    for (const c of ans) n = n * 64n + BigInt(B64.indexOf(c));
    const answers = [];
    for (let i = 0; i < count; i++) { const d = Number(n % 6n); n /= 6n; answers.push(d === 0 ? null : d - 1); }
    if (n !== 0n) continue;
    while (answers.length < N) answers.push(null);            // statements added after this version
    let name;
    try { name = cleanName(decodeName(nameEnc)); } catch (e) { continue; }
    if (!name) continue;
    return { name, tag, answers, code, version: v };
  }
  if (sawCandidate) return { error: "broken" };
  const newest = Math.max(...Object.keys(CODE_LENGTHS).map(Number));
  const vm = s.match(/(?:^|[^A-Za-z0-9_-])C(\d+)[A-Za-z0-9_-]{40,}/);
  if (vm && Number(vm[1]) > newest) return { error: "newer" };
  if (/eyJ[A-Za-z0-9_-]{16,}/.test(s)) return { error: "old" };
  return { error: "broken" };
}
const CODE_ERRORS = {
  old: "This is a code from the old version of Compass. All the statements have changed since, so old codes can't be used. Take the new test to get a new code.",
  newer: "This code comes from a newer version of Compass. Reload the page and try again.",
  broken: "This code couldn't be read. Check that it was copied completely.",
  none: "Paste a result code first."
};

// ============================================================================================
// 2. Saved state (this browser only)
// ============================================================================================
const KEY = "compass-v1";
const LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
const DISPLAY = [4, 3, 2, 1, 0];               // agree first on screen; stored 0 = strongly disagree … 4 = strongly agree

const blank = () => ({ name: "", tag: "", answers: Array(N).fill(null), i: 0, fill: false, seen: false, sent: null, key: null });
let st = blank();
try {
  const s = JSON.parse(localStorage.getItem(KEY) || "null");
  if (s && Array.isArray(s.answers) && s.answers.length <= N && Object.values(CODE_LENGTHS).includes(s.answers.length)) {
    const answers = s.answers.concat(Array(N - s.answers.length).fill(null));   // new statements start unanswered
    st = { ...blank(), ...s, answers, i: s.answers.length === N ? s.i : 0 };
  }
} catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
const answeredCount = ans => ans.filter(v => v !== null).length;

function removalKey() {
  if (!st.key) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    st.key = [...bytes].map(b => B64[b & 63]).join("");
    save();
  }
  return st.key;
}

// ============================================================================================
// 3. Scores and agreement
// ============================================================================================
// For each axis: average over the statements this person answered that feed the axis,
// scaled to −100…+100. Unanswered statements simply don't count.
const MIN_ON_AXIS = { e: 6, s: 8, h: 4 };
function axisScore(ans, ax) {
  let sum = 0, max = 0, n = 0;
  Q.forEach((q, i) => {
    const k = q[ax], v = ans[i];
    if (!k || v === null || v === undefined) return;
    sum += (v - 2) * k; max += 2 * Math.abs(k); n++;
  });
  return n >= MIN_ON_AXIS[ax] ? Math.round(sum / max * 100) : null;
}
const scoresOf = ans => ({ x: axisScore(ans, "e"), y: axisScore(ans, "s"), h: axisScore(ans, "h") });

// Agreement between two people: 100% minus the average distance between their answers
// (a full disagreement, strongly agree vs strongly disagree, is a distance of 4).
const MIN_SHARED = 15;
function agreement(a, b) {
  let d = 0, n = 0;
  for (let i = 0; i < N; i++) if (a[i] !== null && b[i] !== null) { d += Math.abs(a[i] - b[i]); n++; }
  return n >= MIN_SHARED ? Math.round((1 - d / (4 * n)) * 100) : null;
}

const fmt = n => n === null ? "–" : (n > 0 ? "+" : "") + n;
function word(v, neg, pos) {
  if (v === null) return "not enough answers";
  const a = Math.abs(v), side = v > 0 ? pos : neg;
  if (a <= 10) return "centre";
  if (a <= 35) return "leaning " + side;
  if (a <= 65) return side;
  return "strongly " + side;
}
function axisWords(q) {
  const part = (v, pos, neg, axis) => v ? (v > 0 ? pos : neg) + " (" + axis + (Math.abs(v) < 1 ? ", half weight" : "") + ")" : null;
  const parts = [part(q.e, "right", "left", "economic"), part(q.s, "conservative", "progressive", "social"), part(q.h, "hawk", "dove", "foreign policy")].filter(Boolean);
  return parts.length ? "Agreeing counts as " + parts.join(", ") + "." : "This statement isn't on any axis; it only counts for comparing people.";
}

// ============================================================================================
// 4. Quiz
// ============================================================================================
// The quiz shows statements section by section. Statements added later sit at the end of the
// list (so old codes keep working) but are shown inside their own section. st.i is a position in ORDER.
const ORDER = Q.map((_, i) => i).sort((a, b) => Q[a].sec - Q[b].sec || a - b);
const POS = []; ORDER.forEach((qi, pos) => POS[qi] = pos);

function show(id) { ["intro", "quiz", "result"].forEach(s => $(s).hidden = s !== id); }

$("name").value = st.name;
$("tag").value = st.tag;
const syncStart = () => { $("start").disabled = !cleanName($("name").value); };
$("name").addEventListener("input", syncStart); syncStart();
$("tag").addEventListener("input", () => { const t = cleanTag($("tag").value); if (t !== $("tag").value) $("tag").value = t; });
for (const id of ["name", "tag"]) $(id).addEventListener("keydown", e => { if (e.key === "Enter" && !$("start").disabled) $("start").click(); });
{
  const done = answeredCount(st.answers);
  if (done && !st.seen) { $("resume-note").hidden = false; $("resume-note").textContent = done + " answers saved; Start picks up where you left off."; }
}

$("start").onclick = () => {
  st.name = cleanName($("name").value); st.tag = cleanTag($("tag").value);
  if (st.i >= N) st.i = 0;
  st.fill = false; save(); show("quiz"); renderQ();
};
$("use-code").onclick = () => {
  const r = decode($("old-code").value);
  if (r.error) { $("old-code-note").className = "err"; $("old-code-note").textContent = CODE_ERRORS[r.error]; return; }
  st = { ...st, name: r.name, tag: r.tag, answers: r.answers, i: 0, fill: false };
  $("name").value = r.name; $("tag").value = r.tag; syncStart();
  if (st.sent && st.sent.code !== r.code) st.sent = null;
  save(); showResult();
};

const ansBox = $("answers");
DISPLAY.forEach((v, n) => {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = LABELS[v]; b.dataset.v = v; b.title = "Key " + (n + 1);
  b.onclick = () => pick(v);
  ansBox.appendChild(b);
});

function renderQ() {
  const q = Q[ORDER[st.i]];
  const inSection = Q.filter(x => x.sec === q.sec);
  $("section-tag").textContent = SECTIONS[q.sec] + " · " + (inSection.indexOf(q) + 1) + " of " + inSection.length;
  $("statement").textContent = q.t;
  $("count").textContent = (st.i + 1) + " / " + N;
  $("barfill").style.width = (answeredCount(st.answers) / N * 100) + "%";
  [...ansBox.children].forEach(b => { const on = Number(b.dataset.v) === st.answers[ORDER[st.i]]; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  $("back").style.visibility = st.i === 0 ? "hidden" : "visible";
  $("finish").hidden = answeredCount(st.answers) === 0;
}
function advance() {
  if (st.fill) {                                            // only visiting skipped statements
    const j = ORDER.findIndex((qi, k) => k > st.i && st.answers[qi] === null);
    if (j === -1) { st.fill = false; save(); showResult(); return; }
    st.i = j;
  } else if (st.i + 1 >= N) { st.i = N; save(); showResult(); return; }
  else st.i++;
  save(); renderQ();
}
function pick(v) { st.answers[ORDER[st.i]] = v; advance(); }
$("skip").onclick = () => { st.answers[ORDER[st.i]] = null; advance(); };
$("back").onclick = () => { if (st.i > 0) { st.i--; save(); renderQ(); } };
$("finish").onclick = () => { save(); showResult(); };
document.addEventListener("keydown", e => {
  if ($("quiz").hidden || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key >= "1" && e.key <= "5") pick(DISPLAY[Number(e.key) - 1]);
  else if (e.key === "0" || e.key.toLowerCase() === "s") $("skip").click();
  else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); $("back").click(); }
  else if (e.key === "ArrowRight" && st.answers[ORDER[st.i]] !== null) advance();
});
if (matchMedia("(hover: none)").matches) $("keys-hint").hidden = true;

// ============================================================================================
// 5. Result, sending and removing
// ============================================================================================
const myCode = () => encode(st.name, st.tag, st.answers);
const formReady = () => { const f = CFG.form || {}; return !!(f.action && f.code && f.kind && f.key); };
const xLink = () => '<a href="https://x.com/' + CFG.ownerX + '" target="_blank" rel="noopener">@' + CFG.ownerX + "</a>";

function showResult() {
  st.seen = true; save();
  const { x, y, h } = scoresOf(st.answers);
  $("sx").textContent = fmt(x); $("sx-l").textContent = "Economic · " + word(x, "left", "right");
  $("sy").textContent = fmt(y); $("sy-l").textContent = "Social · " + word(y, "progressive", "conservative");
  $("sh").textContent = fmt(h); $("sh-l").textContent = "Foreign policy · " + word(h, "dove", "hawk");
  const done = answeredCount(st.answers);
  $("answered-note").textContent = "You answered " + done + " of " + N + " statements. Scores use only the ones you answered; −100 to +100 per axis.";
  $("unanswered-row").hidden = done === N;
  const open = N - done, newOnes = st.answers.slice(CODE_LENGTHS[1]).every(a => a === null) && done > 0;
  $("answer-skipped").textContent = newOnes ? "Answer the " + (N - CODE_LENGTHS[1]) + " new economy statements"
    : "Answer the " + open + " statement" + (open === 1 ? "" : "s") + " you skipped";
  $("code").textContent = myCode();
  $("code-note").textContent = "Keep it to continue later, or to compare with friends.";
  renderSend();
  show("result"); renderAll();
}
$("answer-skipped").onclick = () => { st.fill = true; st.i = ORDER.findIndex(qi => st.answers[qi] === null); save(); show("quiz"); renderQ(); };
$("edit").onclick = () => { st.fill = false; st.i = 0; save(); show("quiz"); renderQ(); };
$("retake").onclick = () => {
  const keep = { name: st.name, tag: st.tag, key: st.key, sent: st.sent };
  st = { ...blank(), ...keep }; save(); show("intro"); renderAll();
};
$("copy").onclick = async () => {
  const text = $("code").textContent;
  try { await navigator.clipboard.writeText(text); $("code-note").textContent = "Copied."; }
  catch (e) { getSelection().selectAllChildren($("code")); $("code-note").textContent = "Selected: copy it with Ctrl+C or Cmd+C."; }
};

function renderSend() {
  const ready = formReady();
  const code = myCode();
  $("send-off").hidden = ready;
  if (!ready) $("send-off").innerHTML = "Sending from this page isn't switched on yet. Tick the box, copy your code below and send it to " + xLink() + " on X.";
  $("send-btn").textContent = !ready ? "Copy my code" : st.sent && st.sent.code !== code ? "Send my updated result" : "Add me";
  $("send-btn").disabled = !$("consent").checked || (ready && st.sent && st.sent.code === code);
  if (st.sent && st.sent.code === code) {
    $("send-status").className = "ok";
    $("send-status").textContent = "Sent on " + new Date(st.sent.at).toLocaleDateString() + ". Teun adds results by hand, so it can take a day or two.";
  } else if ($("send-status").className === "ok") $("send-status").textContent = "";
}
$("consent").onchange = renderSend;

async function postToForm(kind, code) {
  const f = CFG.form;
  const body = new URLSearchParams();
  body.set(f.code, code);
  body.set(f.kind, kind);
  body.set(f.key, removalKey());
  if (f.consent) body.set(f.consent, kind === "add"
    ? "Ticked: 16+, store name and answers, show publicly, can be removed (consent v1) at " + new Date().toISOString()
    : "Removal requested at " + new Date().toISOString());
  // Google Forms doesn't allow reading its reply from another website ("CORS"). "no-cors" sends
  // the form anyway; we just can't see the answer, so a network error is the only failure we notice.
  await fetch(f.action, { method: "POST", mode: "no-cors", body });
}
$("send-btn").onclick = async () => {
  if (!$("consent").checked) return;
  const code = myCode();
  if (!formReady()) {
    try { await navigator.clipboard.writeText(code); $("send-status").className = "ok"; $("send-status").textContent = "Copied. Now send it to @" + CFG.ownerX + " on X."; }
    catch (e) { $("send-status").className = "note"; $("send-status").textContent = "Copy the code below and send it to @" + CFG.ownerX + " on X."; }
    return;
  }
  $("send-btn").disabled = true; $("send-status").className = "note"; $("send-status").textContent = "Sending…";
  try {
    await postToForm("add", code);
    st.sent = { code, at: Date.now() }; save();
  } catch (e) {
    $("send-status").className = "err";
    $("send-status").innerHTML = "That didn't go through (no connection?). Try again, or send your code to " + xLink() + " on X.";
    $("send-btn").disabled = false; return;
  }
  renderSend();
};

function openRemove() {
  $("remove").hidden = false;
  const canSelf = formReady() && st.sent && st.key;
  $("remove-actions").hidden = !canSelf;
  $("remove-text").innerHTML = canSelf
    ? "This asks Teun to remove the result you sent from this browser, as <b></b>. He deletes it from the group compass and from his copy of the responses."
    : "Send a message to " + xLink() + " on X with the name you used (or your result code). Your result is then removed from the group compass and from Teun's copy of the responses.";
  if (canSelf) $("remove-text").querySelector("b").textContent = decode(st.sent.code).name || st.name;
  $("remove").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("remove-link").onclick = e => { e.preventDefault(); openRemove(); };
$("remove-btn").onclick = async () => {
  $("remove-btn").disabled = true; $("remove-status").textContent = "Sending…";
  try {
    await postToForm("remove", st.sent.code);
    $("remove-status").className = "ok"; $("remove-status").textContent = "Removal requested. It's done by hand, usually within a few days.";
    st.sent = null; save(); renderSend();
  } catch (e) {
    $("remove-btn").disabled = false; $("remove-status").className = "err"; $("remove-status").textContent = "That didn't go through. Try again, or message Teun on X.";
  }
};

// A shareable picture of your position: white background, plain labels, sized for posts on X.
async function shareImage() {
  const W = 1200, H = 1200, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const font = (w, px) => w + " " + px + "px 'IBM Plex Sans', system-ui, sans-serif";
  try { await Promise.all([document.fonts.load(font(400, 20)), document.fonts.load(font(600, 20)), document.fonts.load(font(700, 20))]); } catch (e) {}
  const { x, y, h } = scoresOf(st.answers);
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#15171c"; g.font = font(700, 56); g.textBaseline = "alphabetic";
  g.fillText(st.name, 80, 120);
  g.fillStyle = "#5f636b"; g.font = font(400, 30);
  g.fillText("Political compass · " + answeredCount(st.answers) + " of " + N + " statements answered", 80, 170);
  const stat = (i, label, v, neg, pos) => {
    const X0 = 80 + i * 360;
    g.fillStyle = "#15171c"; g.font = font(700, 48); g.fillText(fmt(v), X0, 260);
    g.fillStyle = "#5f636b"; g.font = font(400, 26); g.fillText(label + " · " + word(v, neg, pos), X0, 300);
  };
  stat(0, "Economic", x, "left", "right"); stat(1, "Social", y, "progressive", "conservative"); stat(2, "Foreign policy", h, "dove", "hawk");
  // compass
  const L = 280, S = 640, M = v => L + (v + 100) / 200 * S, top = 400, MY = v => top + (v + 100) / 200 * S;
  g.strokeStyle = "#eceef1"; g.lineWidth = 2;
  for (const v of [-50, 50]) { g.beginPath(); g.moveTo(M(v), top); g.lineTo(M(v), top + S); g.moveTo(L, MY(v)); g.lineTo(L + S, MY(v)); g.stroke(); }
  g.strokeStyle = "#dfe0e3"; g.strokeRect(L, top, S, S);
  g.strokeStyle = "#c3c6cc"; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(L, MY(0)); g.lineTo(L + S, MY(0)); g.moveTo(M(0), top); g.lineTo(M(0), top + S); g.stroke();
  g.fillStyle = "#5f636b"; g.font = font(600, 24); g.textAlign = "center";
  g.fillText("PROGRESSIVE", M(0), top - 22); g.fillText("CONSERVATIVE", M(0), top + S + 42);
  g.textAlign = "right"; g.fillText("LEFT", L - 18, MY(0) + 8);
  g.textAlign = "left"; g.fillText("RIGHT", L + S + 18, MY(0) + 8);
  const others = lastList.filter(p => !p.you && p.x !== null && p.y !== null);
  g.fillStyle = "#c9ccd2";
  for (const p of others) { g.beginPath(); g.arc(M(p.x), MY(p.y), 11, 0, 7); g.fill(); }
  if (x !== null && y !== null) {
    g.fillStyle = "#15171c"; g.beginPath(); g.arc(M(x), MY(y), 30, 0, 7); g.fill();
    g.fillStyle = "#c62828"; g.beginPath(); g.arc(M(x), MY(y), 25, 0, 7); g.fill();
  }
  g.fillStyle = "#5f636b"; g.font = font(400, 24); g.textAlign = "left";
  g.fillText(others.length ? "Grey dots: the " + others.length + " other people in the group" : "", 80, H - 50);
  g.textAlign = "right"; g.fillText(location.host + location.pathname.replace(/index\.html$/, ""), W - 80, H - 50);
  const blob = await new Promise(res => c.toBlob(res, "image/png"));
  const file = new File([blob], "compass-" + (st.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "result") + ".png", { type: "image/png" });
  if (navigator.canShare && matchMedia("(hover: none)").matches && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
$("share-img").onclick = () => shareImage();

// ============================================================================================
// 6. The group: who's in it, their labels and colours
// ============================================================================================
let ownerList = null;                          // owner preview replaces the built-in list in this browser
const OWNER = new URLSearchParams(location.search).has("owner");
if (OWNER) try { const o = localStorage.getItem(KEY + "-owner"); if (o !== null) ownerList = o; } catch (e) {}

// 12 colours spread around the colour wheel, all dark enough for white labels.
const PALETTE = ["#c62828", "#c4501a", "#8d6e00", "#558b2f", "#1b7a43", "#00796b", "#0277bd",
                 "#283593", "#6a1b9a", "#ad1457", "#5d4037", "#455a64"];
const hash = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; };

// Label candidates, from most to least preferred. Everyone whose label collides moves to their
// next candidate together, so "Alex" and "Alixxa" become "Ale" and "Ali" rather than one of them
// keeping "Al".
function labelCandidates(name, tag) {
  const words = name.split(" ").map(w => [...w].filter(c => /[\p{L}\p{N}]/u.test(c))).filter(w => w.length);
  const L = words.flat();
  if (!L.length) return tag ? [tag, "?"] : ["?"];
  const cap = arr => arr.map((c, i) => i === 0 ? c.toUpperCase() : c.toLowerCase()).join("");
  const c = [];
  if (tag) c.push(tag);
  if (words.length > 1) c.push(words.slice(0, 3).map(w => w[0].toUpperCase()).join(""));
  c.push(cap(L.slice(0, 2)), cap(L.slice(0, 3)));
  if (L.length > 2) c.push(cap([L[0], L[L.length - 1]]), cap([L[0], L[1], L[L.length - 1]]), cap([L[0], L[2]]));
  for (let i = 3; i < L.length; i++) c.push(cap([L[0], L[1], L[i]]));
  return [...new Set(c)];
}
function assignLabels(list) {
  const cands = list.map(p => labelCandidates(p.name, p.tag));
  const lvl = list.map(() => 0);
  const cur = i => cands[i][Math.min(lvl[i], cands[i].length - 1)];
  for (let round = 0; round < 12; round++) {
    const groups = new Map();
    list.forEach((p, i) => { const k = cur(i).toLowerCase(); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
    let moved = false;
    for (const ids of groups.values()) {
      if (ids.length < 2) continue;
      const same = ids.every(i => list[i].name.toLowerCase() === list[ids[0]].name.toLowerCase() && list[i].tag === list[ids[0]].tag);
      if (same) continue;                                     // identical names: numbered below ("Sa", "Sa2")
      const picked = ids.filter(i => list[i].tag && lvl[i] === 0);
      const bump = picked.length === 1 ? ids.filter(i => i !== picked[0]) : ids;   // a self-chosen label wins
      for (const i of bump) if (lvl[i] < cands[i].length - 1) { lvl[i]++; moved = true; }
    }
    if (!moved) break;
  }
  const seen = new Map();                                    // still equal (same names): number them
  list.forEach((p, i) => {
    let l = cur(i); const k = l.toLowerCase();
    const n = (seen.get(k) || 0) + 1; seen.set(k, n);
    p.label = n === 1 ? l : l.slice(0, 2) + n;
  });
}
function assignColours(list) {
  const used = new Set();
  for (const p of list) {
    let i = hash(p.name.toLowerCase()) % PALETTE.length;
    if (used.size < PALETTE.length) while (used.has(i)) i = (i + 1) % PALETTE.length;
    used.add(i); p.colour = PALETTE[i];
  }
}

let groupWarnings = [];
function people() {
  const list = [], byCode = new Set();
  groupWarnings = [];
  const source = ownerList !== null ? ownerList.split("\n") : (window.COMPASS_RESULTS || []);
  source.forEach((line, n) => {
    if (!String(line).trim()) return;
    const r = decode(line);
    if (r.error) { groupWarnings.push({ n: n + 1, error: r.error }); return; }
    if (byCode.has(r.code)) return;
    byCode.add(r.code);
    list.push({ key: r.code, name: r.name, tag: r.tag, ans: r.answers, you: false, local: false });
  });
  if (st.seen && st.name && answeredCount(st.answers)) {
    const code = myCode();
    const mine = list.find(p => p.key === code) || (st.sent && list.find(p => p.key === st.sent.code));
    if (mine) { mine.you = true; mine.ans = st.answers.slice(); mine.newer = mine.key !== code; }
    else list.push({ key: "local", name: st.name, tag: st.tag, ans: st.answers.slice(), you: true, local: true });
  }
  list.forEach(p => Object.assign(p, scoresOf(p.ans)));
  assignLabels(list); assignColours(list);
  return list;
}

// ============================================================================================
// 7. Drawing
// ============================================================================================
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs, text) { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; }
const ballR = n => n > 80 ? 8 : n > 40 ? 10 : 12;
let focusKey = null;
const isFocus = p => focusKey !== null && p.key === focusKey;
const describe = p => p.name + (p.local ? " (only you see this)" : "") + ": economic " + fmt(p.x) + ", social " + fmt(p.y) + ", hawk–dove " + fmt(p.h);

function htmlBall(p) {
  const b = document.createElement("span");
  b.className = "ball" + (p.you ? " you" : "") + (isFocus(p) ? " focus" : "");
  b.style.background = p.colour;
  b.textContent = p.label;
  b.title = p.name + (p.local ? " (only you see this)" : "");
  return b;
}
function svgBall(p, cx, cy, r) {
  const g = svgEl("g", { class: "ball-svg", tabindex: "0", role: "button" });
  g.appendChild(svgEl("title", {}, describe(p)));
  if (p.you) g.appendChild(svgEl("circle", { class: "you-ring", cx, cy, r: r + 3 }));
  if (isFocus(p)) g.appendChild(svgEl("circle", { class: "focus-ring", cx, cy, r: r + (p.you ? 6 : 3.5) }));
  g.appendChild(svgEl("circle", { class: "dot", cx, cy, r, fill: p.colour }));
  if (r >= 10) g.appendChild(svgEl("text", { x: cx, y: cy + 3.5, "text-anchor": "middle", style: "font-size:" + (p.label.length > 2 ? 9 : 10) + "px" }, p.label));
  g.addEventListener("click", () => setFocus(p.key));
  g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFocus(p.key); } });
  return g;
}
// Nudge overlapping balls apart a little; a thin line shows where a moved ball really belongs.
function relax(pts, r) {
  const min = r * 2 + 1;
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const A = pts[a], B = pts[b];
      let dx = B.cx - A.cx, dy = B.cy - A.cy, d = Math.hypot(dx, dy);
      if (d >= min) continue;
      if (d < 0.01) { const ang = (a * 2.4 + b) % (2 * Math.PI); dx = Math.cos(ang); dy = Math.sin(ang); d = 1; }
      const push = (min - d) / 2;
      A.cx -= dx / d * push; A.cy -= dy / d * push; B.cx += dx / d * push; B.cy += dy / d * push; moved = true;
    }
    for (const o of pts) { o.cx += (o.tx - o.cx) * 0.08; o.cy += (o.ty - o.cy) * 0.08; }
    if (!moved) break;
  }
}

const P = v => 50 + (v + 100) / 200 * 320;
function renderCompass(list) {
  const svg = $("plot"); svg.textContent = "";
  for (const v of [-50, 50]) {
    svg.appendChild(svgEl("line", { class: "grid", x1: P(v), y1: 50, x2: P(v), y2: 370 }));
    svg.appendChild(svgEl("line", { class: "grid", x1: 50, y1: P(v), x2: 370, y2: P(v) }));
  }
  svg.appendChild(svgEl("rect", { class: "frame", x: 50, y: 50, width: 320, height: 320 }));
  svg.appendChild(svgEl("line", { class: "axis", x1: 50, y1: 210, x2: 370, y2: 210 }));
  svg.appendChild(svgEl("line", { class: "axis", x1: 210, y1: 50, x2: 210, y2: 370 }));
  svg.appendChild(svgEl("text", { class: "axlab", x: 210, y: 36, "text-anchor": "middle" }, "Progressive"));
  svg.appendChild(svgEl("text", { class: "axlab", x: 210, y: 394, "text-anchor": "middle" }, "Conservative"));
  svg.appendChild(svgEl("text", { class: "axlab", x: 44, y: 214, "text-anchor": "end" }, "Left"));
  svg.appendChild(svgEl("text", { class: "axlab", x: 376, y: 214 }, "Right"));
  const shown = list.filter(p => p.x !== null && p.y !== null);
  const r = ballR(shown.length);
  const pts = shown.map(p => ({ p, tx: P(p.x), ty: P(p.y), cx: P(p.x), cy: P(p.y) }));
  relax(pts, r);
  for (const o of pts) if (Math.hypot(o.cx - o.tx, o.cy - o.ty) > r * 0.6) {
    svg.appendChild(svgEl("line", { class: "axis", x1: o.tx, y1: o.ty, x2: o.cx, y2: o.cy, "stroke-width": 0.8 }));
    svg.appendChild(svgEl("circle", { cx: o.tx, cy: o.ty, r: 1.8, fill: "var(--mid)" }));
  }
  pts.sort((a, b) => (a.p.you || isFocus(a.p)) - (b.p.you || isFocus(b.p)))
     .forEach(o => svg.appendChild(svgBall(o.p, o.cx, o.cy, r)));
}

// pts: [{p, h}] with h from −100 to +100. Balls that would overlap go into lanes above and below.
function renderBar(svg, pts, leftLabel, rightLabel) {
  const r = ballR(pts.length), X = v => 40 + (v + 100) / 200 * 340, GAP = r * 2 + 3, LANE = r * 2 + 4;
  pts.sort((a, b) => a.h - b.h);
  const placed = [];
  for (const o of pts) {
    o.cx = X(o.h);
    for (const L of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) if (!placed.some(q => q.lane === L && Math.abs(q.cx - o.cx) < GAP)) { o.lane = L; break; }
    if (o.lane === undefined) o.lane = 0;
    placed.push(o);
  }
  const maxL = Math.max(0, ...placed.map(o => Math.abs(o.lane)));
  const base = 18 + maxL * LANE + 12, H = base + maxL * LANE + 12 + 30;
  svg.textContent = ""; svg.setAttribute("viewBox", "0 0 420 " + H);
  svg.appendChild(svgEl("line", { class: "axis", x1: 40, y1: base, x2: 380, y2: base }));
  svg.appendChild(svgEl("line", { class: "grid", x1: 210, y1: base - maxL * LANE - 14, x2: 210, y2: base + maxL * LANE + 14 }));
  svg.appendChild(svgEl("text", { class: "axlab", x: 40, y: H - 8 }, leftLabel));
  svg.appendChild(svgEl("text", { class: "axlab", x: 380, y: H - 8, "text-anchor": "end" }, rightLabel));
  [...placed].sort((a, b) => (a.p.you || isFocus(a.p)) - (b.p.you || isFocus(b.p))).forEach(o => svg.appendChild(svgBall(o.p, o.cx, base + o.lane * LANE, r)));
}
function renderHawk(list) {
  const pts = list.filter(p => p.h !== null).map(p => ({ p, h: p.h }));
  $("hawk").hidden = view !== "2d" || !pts.length;
  if (!$("hawk").hidden) renderBar($("hawk-plot"), pts, "Dove", "Hawk");
}

// ---------- 3D: economic × social × hawk–dove ----------
let view = "2d", yaw = -0.62, pitch = 0.32, lastList = [];
try { if (localStorage.getItem(KEY + "-view") === "3d") view = "3d"; } catch (e) {}
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let spin = null, userTurned = reduceMotion;
function startSpin() {
  if (spin || view !== "3d" || userTurned) return;
  let last = performance.now();
  const step = t => {
    const dt = Math.min(0.1, (t - last) / 1000); last = t;   // cap so a background tab doesn't jump
    yaw += dt * 0.35; render3d(lastList);
    spin = userTurned || view !== "3d" ? null : requestAnimationFrame(step);
  };
  spin = requestAnimationFrame(step);
}
function setView(v) {
  if (spin) { cancelAnimationFrame(spin); spin = null; }
  view = v; userTurned = reduceMotion;
  try { localStorage.setItem(KEY + "-view", v); } catch (e) {}
  renderAll(); startSpin();
}
$("view-2d").onclick = () => setView("2d");
$("view-3d").onclick = () => setView("3d");

function render3d(list) {
  const svg = $("plot3d"); svg.textContent = "";
  const C = 210, R = 100, D = 4.2;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const proj = (X, Y, Z) => {
    const x1 = X * cy + Z * sy, z1 = -X * sy + Z * cy;
    const y2 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp;
    const s = D / (D - z2);
    return { x: C + x1 * R * s, y: C - y2 * R * s, z: z2, s };
  };
  const line = (a, b, cls) => { const p = proj(...a), q = proj(...b); svg.appendChild(svgEl("line", { class: cls, x1: p.x, y1: p.y, x2: q.x, y2: q.y })); };
  const corners = [];
  for (let i = 0; i < 8; i++) corners.push([0, 1, 2].map(d => (i >> d) & 1 ? 1 : -1));
  for (let i = 0; i < 8; i++) for (let d = 0; d < 3; d++) if (((i >> d) & 1) === 0) line(corners[i], corners[i | (1 << d)], "frame");
  line([-1, 0, 0], [1, 0, 0], "axis"); line([0, -1, 0], [0, 1, 0], "axis"); line([0, 0, -1], [0, 0, 1], "axis");
  const label = (pos, text) => { const p = proj(...pos); svg.appendChild(svgEl("text", { class: "axlab", x: p.x, y: p.y + 4, "text-anchor": "middle" }, text)); };
  label([-1.22, 0, 0], "Left"); label([1.22, 0, 0], "Right");
  label([0, 1.22, 0], "Progressive"); label([0, -1.22, 0], "Conservative");
  label([0, 0, -1.22], "Dove"); label([0, 0, 1.22], "Hawk");
  const shown = list.filter(p => p.x !== null && p.y !== null);
  const r0 = ballR(shown.length);
  const pts = shown.map(p => {
    const X = p.x / 100, Y = -p.y / 100, Z = (p.h ?? 0) / 100;
    return { p, X, Y, Z, at: proj(X, Y, Z) };
  }).sort((a, b) => a.at.z - b.at.z);
  for (const o of pts) {                                     // drop line to the economic–hawk floor
    const base = proj(o.X, 0, o.Z);
    svg.appendChild(svgEl("line", { class: "grid", x1: base.x, y1: base.y, x2: o.at.x, y2: o.at.y }));
    svg.appendChild(svgEl("circle", { cx: base.x, cy: base.y, r: 2, fill: "var(--axis)" }));
  }
  for (const o of pts) svg.appendChild(svgBall(o.p, o.at.x, o.at.y, Math.max(7, Math.min(15, r0 * o.at.s))));
}
{
  let drag = null;
  const el = $("plot3d");
  el.addEventListener("pointerdown", e => {
    userTurned = true; drag = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false };
    el.style.cursor = "grabbing";
  });
  el.addEventListener("pointermove", e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;   // a tap still selects a ball
    if (!drag.moved) { drag.moved = true; try { el.setPointerCapture(e.pointerId); } catch (err) {} }
    yaw = drag.yaw + (e.clientX - drag.x) * 0.01;
    pitch = Math.max(-1.35, Math.min(1.35, drag.pitch + (e.clientY - drag.y) * 0.01));
    render3d(lastList);
  });
  const end = () => { drag = null; el.style.cursor = "grab"; };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("keydown", e => {
    const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key];
    if (!k || e.target !== el) return;
    userTurned = true; yaw += k[0]; pitch = Math.max(-1.35, Math.min(1.35, pitch + k[1]));
    e.preventDefault(); render3d(lastList);
  });
}

// ---------- closest people ----------
function matchRow(p, pct) {
  const row = document.createElement("div"); row.className = "match-row";
  const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = p.name + (p.you ? " (you)" : "");
  const meter = document.createElement("div"); meter.className = "meter";
  const fill = document.createElement("span"); fill.style.width = pct + "%"; meter.appendChild(fill);
  const v = document.createElement("span"); v.className = "pct"; v.textContent = pct + "%";
  const ball = htmlBall(p); ball.style.cursor = "pointer"; ball.onclick = () => setFocus(p.key);
  row.append(ball, nm, meter, v);
  return row;
}
function ranked(p, list) {
  return list.filter(o => o !== p).map(o => ({ o, pct: agreement(p.ans, o.ans) })).filter(m => m.pct !== null).sort((a, b) => b.pct - a.pct);
}
function renderClosestYou(list) {
  const me = list.find(p => p.you);
  const r = me ? ranked(me, list) : [];
  $("closest-you").hidden = !r.length;
  const box = $("closest-you-list"); box.textContent = "";
  r.slice(0, 5).forEach(m => box.appendChild(matchRow(m.o, m.pct)));
}
function setFocus(key) {
  focusKey = focusKey === key ? null : key;
  renderAll();
  if (focusKey) $("focus").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$("focus-clear").onclick = () => { focusKey = null; renderAll(); };
function renderFocus(list) {
  const p = list.find(isFocus);
  $("focus").hidden = !p;
  if (!p) { focusKey = null; return; }
  $("focus-title").textContent = p.you ? "You" : p.name;
  $("focus-scores").textContent = "Economic " + fmt(p.x) + " · social " + fmt(p.y) + " · hawk–dove " + fmt(p.h) + " · " + answeredCount(p.ans) + " answers" + (p.local ? " · only you see this" : "") + (p.newer ? " · the group still has your earlier answers" : "");
  const r = ranked(p, list), box = $("focus-list"); box.textContent = "";
  if (!r.length) { box.innerHTML = '<p class="note">Nobody to compare with yet.</p>'; return; }
  const head = t => { const h = document.createElement("p"); h.className = "note"; h.textContent = t; box.appendChild(h); };
  head("Closest");
  r.slice(0, 5).forEach(m => box.appendChild(matchRow(m.o, m.pct)));
  if (r.length > 6) { head("Furthest"); r.slice(-3).reverse().forEach(m => box.appendChild(matchRow(m.o, m.pct))); }
  // Where this person and you disagree most: the statements with the biggest gap between your answers.
  const me = list.find(o => o.you);
  if (me && me !== p) {
    const diffs = Q.map((q, i) => ({ i, d: me.ans[i] === null || p.ans[i] === null ? -1 : Math.abs(me.ans[i] - p.ans[i]) }))
      .filter(x => x.d >= 2).sort((a, b) => b.d - a.d || a.i - b.i).slice(0, 3);
    if (diffs.length) {
      head("Where you differ most");
      for (const { i } of diffs) {
        const div = document.createElement("div"); div.className = "diff";
        const t = document.createElement("p"); t.textContent = Q[i].t;
        const a = document.createElement("p"); a.className = "note";
        a.textContent = "You: " + LABELS[me.ans[i]].toLowerCase() + " · " + p.name + ": " + LABELS[p.ans[i]].toLowerCase();
        div.append(t, a); box.appendChild(div);
      }
    }
  }
}

// ---------- everyone ----------
function renderPeople(list) {
  const shared = list.filter(p => !p.local);
  $("group-count").textContent = shared.length ? shared.length + (shared.length === 1 ? " person" : " people") : "";
  $("group-note").textContent = shared.length ? "Tap a ball or a name to see who they're closest to." : "Nobody has been added to the group yet." + (list.length ? " Your own ball is only visible to you." : "");
  $("people-box").hidden = !list.length;
  $("people-filter").hidden = list.length < 15;
  const f = $("people-filter").value.trim().toLowerCase();
  const me = list.find(p => p.you);
  const box = $("people"); box.textContent = "";
  const rows = [...list].sort((a, b) => b.you - a.you || isFocus(b) - isFocus(a) || a.name.localeCompare(b.name)).filter(p => !f || p.name.toLowerCase().includes(f));
  const cut = !peopleAll && !f && rows.length > PEOPLE_SHORT;
  $("people-more").hidden = rows.length <= PEOPLE_SHORT || !!f;
  $("people-more").textContent = cut ? "Show all " + rows.length : "Show fewer";
  (cut ? rows.slice(0, PEOPLE_SHORT) : rows).forEach(p => {
    const row = document.createElement("button"); row.type = "button";
    row.className = "person" + (isFocus(p) ? " sel" : "");
    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = p.name + (p.you ? " (you)" : "") + (p.local ? " · not in the group yet" : "");
    const sc = document.createElement("span"); sc.className = "sc";
    const pct = me && me !== p ? agreement(me.ans, p.ans) : null;
    sc.textContent = fmt(p.x) + " / " + fmt(p.y) + " / " + fmt(p.h) + (pct !== null ? " · " + pct + "%" : "");
    sc.title = "Economic / social / hawk–dove" + (pct !== null ? " · agreement with you" : "");
    row.append(htmlBall(p), nm, sc);
    row.onclick = () => setFocus(p.key);
    box.appendChild(row);
  });
}
const PEOPLE_SHORT = 12;
let peopleAll = false;
$("people-more").onclick = () => { peopleAll = !peopleAll; renderPeople(lastList); };
$("people-filter").addEventListener("input", () => renderPeople(lastList));

// ============================================================================================
// 8. Compare answers
// ============================================================================================
let cmpOrder = ORDER.slice(), cmpPos = 0;
function spread(list, qi) {
  const vals = list.map(p => p.ans[qi]).filter(v => v !== null);
  if (vals.length < 2) return 0;
  const m = vals.reduce((s, v) => s + v, 0) / vals.length;
  return vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;
}
function renderCompare(list) {
  $("compare").hidden = list.length === 0;
  if (!list.length) return;
  const current = cmpOrder[cmpPos];
  cmpOrder = ORDER.slice();
  if ($("divisive").checked) cmpOrder.sort((a, b) => spread(list, b) - spread(list, a) || POS[a] - POS[b]);
  cmpPos = Math.max(0, cmpOrder.indexOf(current));
  const sel = $("cmp-select"); sel.textContent = "";
  const groups = {};
  cmpOrder.forEach((qi, pos) => {
    const label = $("divisive").checked ? "Most divisive first" : SECTIONS[Q[qi].sec];
    if (!groups[label]) { groups[label] = document.createElement("optgroup"); groups[label].label = label; sel.appendChild(groups[label]); }
    const o = document.createElement("option"); o.value = pos; o.textContent = (POS[qi] + 1) + ". " + Q[qi].t; groups[label].appendChild(o);
  });
  sel.value = cmpPos;
  const qi = cmpOrder[cmpPos];
  $("cmp-tag").textContent = SECTIONS[Q[qi].sec] + " · statement " + (POS[qi] + 1);
  $("cmp-statement").textContent = Q[qi].t;
  $("cmp-axis").textContent = axisWords(Q[qi]);
  $("cmp-prev").disabled = cmpPos === 0; $("cmp-next").disabled = cmpPos === N - 1;
  const cols = $("cols"); cols.textContent = "";
  let agree = 0, neutral = 0, disagree = 0, missing = 0;
  DISPLAY.forEach(v => {
    const col = document.createElement("div"); col.className = "col";
    const h = document.createElement("h3"); h.textContent = LABELS[v]; col.appendChild(h);
    const balls = document.createElement("div"); balls.className = "balls";
    list.filter(p => p.ans[qi] === v).sort((a, b) => b.you - a.you || a.name.localeCompare(b.name)).forEach(p => {
      const b = htmlBall(p); b.style.cursor = "pointer"; b.onclick = () => setFocus(p.key); balls.appendChild(b);
    });
    col.appendChild(balls); cols.appendChild(col);
  });
  list.forEach(p => { const v = p.ans[qi]; if (v === null) missing++; else if (v > 2) agree++; else if (v < 2) disagree++; else neutral++; });
  $("cmp-split").textContent = agree + " agree · " + neutral + " neutral · " + disagree + " disagree" + (missing ? " · " + missing + " skipped" : "");
}
$("cmp-prev").onclick = () => { if (cmpPos > 0) { cmpPos--; renderCompare(lastList); } };
$("cmp-next").onclick = () => { if (cmpPos < N - 1) { cmpPos++; renderCompare(lastList); } };
$("cmp-select").onchange = e => { cmpPos = Number(e.target.value); renderCompare(lastList); };
$("divisive").onchange = () => { cmpPos = 0; cmpOrder = [-1]; renderCompare(lastList); };

// ============================================================================================
// 9. Owner tools (open the page with ?owner at the end of the address)
// ============================================================================================
function renderOwnerCheck(list) {
  if (!OWNER) return;
  const box = $("owner-check"); box.textContent = "";
  const lines = ($("owner-codes").value || "").split("\n");
  for (const w of groupWarnings) {
    const row = document.createElement("div"); row.className = "person";
    row.innerHTML = '<span class="err"></span>';
    row.firstChild.textContent = "Line " + w.n + ": " + CODE_ERRORS[w.error] + "  (" + (lines[w.n - 1] || "").trim().slice(0, 40) + "…)";
    box.appendChild(row);
  }
  const shared = list.filter(p => !p.local);
  $("owner-status").textContent = shared.length + " in the list" + (groupWarnings.length ? ", " + groupWarnings.length + " unreadable" : "") + (ownerList !== null ? " · preview, not published" : "");
}
if (OWNER) {
  $("owner").hidden = false;
  $("owner-codes").value = ownerList !== null ? ownerList : (window.COMPASS_RESULTS || []).join("\n");
  let t = null;
  $("owner-codes").addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      ownerList = $("owner-codes").value;
      try { localStorage.setItem(KEY + "-owner", ownerList); } catch (e) {}
      renderAll();
    }, 250);
  });
  $("owner-reset").onclick = () => {
    ownerList = null; try { localStorage.removeItem(KEY + "-owner"); } catch (e) {}
    $("owner-codes").value = (window.COMPASS_RESULTS || []).join("\n"); renderAll();
  };
  $("owner-copy").onclick = async () => {
    const codes = [];
    for (const line of $("owner-codes").value.split("\n")) { const r = decode(line); if (!r.error && !codes.includes(r.code)) codes.push(r.code); }
    const file = "// The built-in group: everyone added to the public compass, one result code per line.\n" +
      "// Only add codes from people who ticked the consent box (or gave consent in writing).\n" +
      "// To remove someone, delete their line. Codes from an older version are ignored with a warning.\n" +
      "window.COMPASS_RESULTS = [\n" + codes.map(c => '  "' + c + '",').join("\n") + "\n];\n";
    try { await navigator.clipboard.writeText(file); $("owner-status").textContent = "Copied results.js with " + codes.length + " people."; }
    catch (e) { $("owner-status").textContent = "Couldn't copy automatically."; }
  };
}

// ============================================================================================
// 10. Theme, first render
// ============================================================================================
function syncThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("theme").textContent = dark ? "Light" : "Dark";
  $("theme").setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " mode");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#121417" : "#f6f6f4";
}
$("theme").onclick = () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  if (dark) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
  try { localStorage.setItem("compass-theme", dark ? "dark" : "light"); } catch (e) {}
  syncThemeButton();
};
syncThemeButton();

function renderAll() {
  const list = people(); lastList = list;
  const three = view === "3d";
  // SVG elements have no .hidden property (only HTML elements do), so set the attribute itself.
  $("plot").toggleAttribute("hidden", three); $("plot3d").toggleAttribute("hidden", !three);
  $("rotate-hint").hidden = !three;
  $("view-2d").classList.toggle("on", !three); $("view-3d").classList.toggle("on", three);
  if (three) render3d(list); else renderCompass(list);
  renderHawk(list); renderFocus(list); renderPeople(list); renderCompare(list); renderClosestYou(list); renderOwnerCheck(list);
}

if (st.seen && st.name) showResult(); else { show("intro"); renderAll(); }
startSpin();

// Browsers may keep an old copy of results.js for up to 10 minutes (GitHub Pages' cache time).
// So fetch it again, asking the server whether it changed, and redraw when new people were added.
// While the page stays open, repeat that every minute so new arrivals appear without reloading.
async function refreshGroup() {
  if (ownerList !== null) return;                              // the owner preview replaces the list
  try {
    const r = await fetch("results.js", { cache: "no-cache" });
    if (!r.ok) return;
    const text = await r.text(), start = text.indexOf("COMPASS_RESULTS");
    if (start < 0) return;
    const codes = [...text.slice(start).matchAll(/"([^"\n]+)"/g)].map(m => m[1]);
    if (JSON.stringify(codes) === JSON.stringify(window.COMPASS_RESULTS || [])) return;
    window.COMPASS_RESULTS = codes;
    if (OWNER) $("owner-codes").value = codes.join("\n");
    renderAll();
  } catch (e) {}
}
refreshGroup();
setInterval(() => { if (document.visibilityState === "visible") refreshGroup(); }, 60000);
if (location.hash === "#remove") openRemove();

// Small hook for the automated tests (tests/run.py); harmless for visitors.
window.Compass = { encode, decode, agreement, axisScore, labelCandidates, assignLabels, N, ANS_LEN };
})();
