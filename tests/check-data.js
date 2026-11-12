// node tests/check-data.js — 데이터 검사: 개수, 교과서 표현, 사전 누락, 그림 누락
const fs = require("fs"), path = require("path");
const D = require("../data.js");
let fail = 0;
const bad = m => { fail++; console.log("❌ " + m); };
if (D.PLACES.length !== 60) bad("장소 수 " + D.PLACES.length);
D.CATEGORIES.forEach(c => { const n = D.PLACES.filter(p => p.cat === c.id).length; if (n !== 12) bad(c.id + " " + n + "개"); });
const ids = new Set(); D.PLACES.forEach(p => { if (ids.has(p.id)) bad("중복 id " + p.id); ids.add(p.id); });
const BOOK = ["on the desk","on the sofa","in the box","in the bag","under the table","under the chair", // 교과서 대화
              "on the bed","under the desk","on the chair"];                                         // 처음 요청
if (D.PLACES.filter(p => p.book).length !== BOOK.length) bad("📘 개수 " + D.PLACES.filter(p => p.book).length);
// 교과서 대화 6쌍
const PAIRS = [["Where is my book?","It's on the sofa."],["Where is my pencil case?","It's in the bag."],
  ["Where is my watch?","It's under the chair."],["Where is my ball?","It's in the box."],
  ["Where is my sock?","It's on the desk."],["Where is my shoe?","It's under the table."]];
PAIRS.forEach(([q, a]) => {
  const Q = D.QUESTIONS.find(x => x.q === q); const P = Q && D.PLACES.find(p => p.id === Q.pair);
  if (!Q || !P || P.say.en !== a || !P.book || !P.when.includes(Q.id) || P.when[0] !== Q.id) bad("교과서 대화 " + q + " / " + a);
  else console.log("✅ " + q + " — " + a);
});
BOOK.forEach(b => { const p = D.PLACES.find(x => x.en === b); if (!p || !p.book) bad("교과서 표현 누락 " + b); });
// 📘 은 같은 종류 안에서 맨 앞
D.CATEGORIES.forEach(c => { const l = D.PLACES.filter(p => p.cat === c.id); let seenNon = false; l.forEach(p => { if (!p.book) seenNon = true; else if (seenNon) bad("📘가 맨 앞이 아님 " + p.id); }); });
// 사전
const sentences = [...D.QUESTIONS.map(q => q.q), ...D.PLACES.flatMap(p => [p.say.en, p.mid.en])];
const missing = new Set();
sentences.forEach(s => s.split(/\s+/).forEach(w => { const k = w.replace(/[^A-Za-z']/g, "").toLowerCase(); if (k && !D.DICT[k]) missing.add(k); }));
console.log(`단어 뜻 누락: ${missing.size}개 ${[...missing].join(", ")}`);
if (missing.size) fail++;
// 그림
const miss = D.PLACES.filter(p => !fs.existsSync(path.join(__dirname, "..", "images", p.id + ".png"))).map(p => p.id);
console.log(`그림 누락: ${miss.length}개 ${miss.join(", ")}`);
if (miss.length) fail++;
D.PLACES.forEach(p => p.when.forEach(q => { if (!D.QUESTIONS.find(x => x.id === q)) bad("when 오류 " + p.id); }));
console.log(fail ? "실패 " + fail : `✅ 데이터 OK (장소 ${D.PLACES.length}개, 문장 ${sentences.length}개)`);
process.exit(fail ? 1 : 0);
