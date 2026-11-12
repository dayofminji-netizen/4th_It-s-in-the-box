// node tests/score.test.js
const S = require("../score.js");
let fail = 0;
function near(name, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? "✅" : "❌"} ${name}: ${got} (기대 ${want}±${tol})`);
}
const K = "I'm going to fly a kite.";
near("정확", S.scoreSpeech(K, ["I'm going to fly a kite"]).score, 100, 0);
near("fly a cat", S.scoreSpeech(K, ["I'm going to fly a cat"]).score, 73, 2);
near("fly a kite 만", S.scoreSpeech(K, ["fly a kite"]).score, 55, 2);
near("순서 뒤섞임", S.scoreSpeech(K, ["kite a fly to going am I"]).score, 14, 3);
near("I am 펼침", S.scoreSpeech(K, ["I am going to fly a kite"]).score, 100, 0);
near("후보 중 최고", S.scoreSpeech(K, ["fly a cat", "I'm going too fly a kite"]).score, 100, 0);

const A = "It's on the bed.";
near("단원: 정확", S.scoreSpeech(A, ["it's on the bed"]).score, 100, 0);
near("단원: its 인식", S.scoreSpeech(A, ["its on the bed"]).score, 100, 0);
near("단원: in↔on 틀림", S.scoreSpeech(A, ["it's in the bed"]).score, 58, 15);
near("단원: bad (철자 1글자)", S.scoreSpeech(A, ["it's on the bad"]).score, 93, 3);
near("단원: TV 글자", S.scoreSpeech("It's on the TV.", ["it's on the t v"]).score, 100, 0);
near("단원: 중급", S.scoreSpeech("It's under the desk in the classroom.", ["it's under the desk in the classroom"]).score, 100, 0);
near("빈 입력", S.scoreSpeech(A, [""]).score, 0, 0);

const r = S.scoreSpeech(K, ["I'm going to fly a cat"]);
const chip = r.chips.map(c => c.word + ":" + c.cls).join(" ");
console.log("칩:", chip, "| 다시:", r.retry.join(","));
if (r.chips[0].word !== "I'm" || r.chips.length !== 6) { fail++; console.log("❌ I'm 한 칩"); }
if (r.retry.join() !== "kite") { fail++; console.log("❌ retry kite"); }
if (S.wordSim("kite", "cat") !== 0) { fail++; console.log("❌ kite≠cat"); }
if (S.wordSim("very", "berry") !== 0.7) { fail++; console.log("❌ v/b 소리 비슷"); }
console.log(fail ? `\n${fail}개 실패` : "\n모두 통과");
process.exit(fail ? 1 : 0);
