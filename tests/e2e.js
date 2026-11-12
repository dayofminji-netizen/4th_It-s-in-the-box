// node tests/e2e.js  (먼저: python3 -m http.server 8765)
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:8765/index.html";
const OUT = process.env.OUT || "tests/shots";
let fail = 0;
const ok = (c, m) => { console.log((c ? "✅ " : "❌ ") + m); if (!c) fail++; };

const FAKE_SR = `
  window.__fakeSay = [["it's on the sofa"]];
  class FakeSR {
    constructor(){ this.lang=""; this.interimResults=false; this.maxAlternatives=1; }
    start(){
      const alts = window.__fakeSay;
      setTimeout(()=>{ this.onresult && this.onresult(mk(alts[0][0], false)); }, 150);
      setTimeout(()=>{ this.onresult && this.onresult(mk(alts[0], true)); }, 400);
      setTimeout(()=>{ this.onend && this.onend(); }, 600);
    }
    stop(){} abort(){}
  }
  function mk(a, fin){
    const arr = (Array.isArray(a)?a:[a]).map(t=>({transcript:t, confidence:.9}));
    const r = Object.assign(arr, { isFinal: fin });
    return { results: [r], resultIndex: 0 };
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.speechSynthesis && (window.speechSynthesis.speak = function(u){ setTimeout(()=>u.onend&&u.onend(), 10); });
`;

(async () => {
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, permissions: ["microphone"] });
  await ctx.addInitScript(FAKE_SR);
  // 외부 글꼴(CDN)은 테스트 환경에서 막혀 있으므로 빈 CSS로 대체
  const stubFonts = c => c.route(/fonts\.googleapis|cdn\.jsdelivr/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await stubFonts(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("dialog", d => d.accept());
  await page.goto(BASE);
  await page.waitForSelector("#grid-basic .card");

  ok(await page.locator("#grid-basic .card").count() === 60, "초급 카드 60개");
  // 그림 로드
  await page.waitForTimeout(800);
  const broken = await page.$$eval("#grid-basic .pic img", imgs => imgs.filter(i => i.complete && i.naturalWidth === 0).length);
  ok(broken === 0, "그림 깨짐 0");

  // 필터
  await page.click('#panel-basic .chip-f[data-f="book"]');
  ok(await page.locator("#grid-basic .card").count() === 9, "📘 교과서 필터 9개");
  await page.click('#panel-basic .chip-f[data-f="park"]');
  ok(await page.locator("#grid-basic .card").count() === 12, "종류(공원) 필터 12개");
  await page.click('#panel-basic .chip-f[data-f="rec"]');
  const recN = await page.locator("#grid-basic .card").count();
  ok(recN > 0 && recN < 60, "⭐ 추천 필터 " + recN + "개");
  await page.click('#panel-basic .chip-f[data-f="all"]');

  // Q1 카드 선택 (초급)
  await page.click('#grid-basic [data-pick="on_sofa"]');
  ok((await page.textContent("#panel-basic .line.me .s")).includes("It's on the sofa."), "말풍선 빈칸 채움");
  ok((await page.textContent("#planBadge")).trim() === "1/6", "배지 1/6");
  ok(await page.locator("#panel-basic .qbtn.active .done").count() === 1, "질문 버튼 ✓");
  ok(await page.locator("#panel-basic .qbtn").count() === 6, "질문 6개");
  ok(await page.locator('#grid-basic .card[data-id="on_sofa"] .tag.pair').count() === 1, "📘 교과서 대화 태그 (book–on the sofa)");
  await page.click('#panel-basic .chip-f[data-f="rec"]');
  ok(await page.locator("#grid-basic .card").first().getAttribute("data-id") === "on_sofa", "⭐ 필터 맨 앞 = 교과서 짝");
  await page.click('#panel-basic .chip-f[data-f="all"]');

  // 다음 질문 → Q2, 중급 탭에서 고르기 (공유)
  await page.click('#panel-basic [data-act="next"]');
  await page.click('.tab[data-tab="mid"]');
  ok(await page.locator("#panel-mid .qbtn.active").getAttribute("data-q") === "pencilcase", "중급 탭도 Q2");
  await page.click('#grid-mid [data-pick="in_bag"]');
  ok((await page.textContent("#panel-mid .line.me .s")).includes("It's in the bag in my room."), "중급 대답");
  ok((await page.textContent("#planBadge")).trim() === "2/6", "배지 2/6 (초급·중급 공유)");
  // 다른 카드 → 교체
  await page.click('#grid-mid [data-pick="in_box"]');
  ok((await page.textContent("#planBadge")).trim() === "2/6", "같은 질문은 1개만 (교체)");
  // 다시 누르면 빠짐
  await page.click('#grid-mid [data-pick="in_box"]');
  ok((await page.textContent("#planBadge")).trim() === "1/6", "다시 누르면 빠짐");
  await page.click('#grid-mid [data-pick="in_box"]');

  // 단어 뜻 풍선
  await page.click('#grid-mid .card[data-id="in_box"] .w[data-w="box"]');
  ok((await page.textContent("#popup")).includes("상자"), "단어 뜻 풍선");

  await page.screenshot({ path: OUT + "/desktop-mid.png", fullPage: false });

  // 연습하기
  await page.click('.tab[data-tab="practice"]');
  ok(await page.locator('#planRows .prow [data-act="rec"]').count() === 2, "연습하기 2줄 말하기 도구");
  ok((await page.textContent("#planRows")).includes("활동 카드에서 골라요"), "빈 줄 안내");

  // 말하기 (정확)
  const row1 = page.locator('#planRows .prow[data-q="book"]');
  await row1.locator('[data-act="rec"]').click();
  await row1.locator(".result .big").waitFor({ timeout: 8000 });
  ok((await row1.locator(".result .big").textContent()).includes("100%"), "정확 → 100%");
  ok(!(await row1.locator('[data-act="play"]').isDisabled()), "▶ 내 목소리 활성(녹음됨)");
  // 재생
  await row1.locator('[data-act="play"]').click();

  // 틀리게 말하기
  await page.evaluate(() => { window.__fakeSay = [["it's in the sofa", "it's on the sofa"]]; });
  await row1.locator('[data-act="rec"]').click();
  await page.waitForTimeout(1500);
  ok((await row1.locator(".result .big").textContent()).includes("100%"), "후보 5개 중 최고 점수");
  await page.evaluate(() => { window.__fakeSay = [["it's in the sofa"]]; });
  await row1.locator('[data-act="rec"]').click();
  await page.waitForTimeout(1500);
  const txt = await row1.locator(".result").textContent();
  ok(/🔁|👍/.test(txt) && txt.includes("다시 들어 볼 단어"), "틀림 → 다시 들어 볼 단어");
  ok(await row1.locator(".wc.miss").count() >= 1, "🟥 칩");
  ok((await row1.locator(".rec-stats").textContent()).includes("3회"), "횟수 3회");
  const sum = await page.textContent("#sumStats");
  ok(sum.includes("총 연습 3회") && sum.includes("1/6"), "요약: " + sum);
  await page.screenshot({ path: OUT + "/desktop-practice.png", fullPage: true });

  // 새로고침해도 기록 유지
  await page.reload(); await page.click('.tab[data-tab="practice"]');
  ok((await page.textContent("#sumStats")).includes("총 연습 3회"), "localStorage 기록 유지");

  // ✕ 빼기
  await page.click('#planRows .prow[data-q="pencilcase"] [data-act="remove"]');
  ok((await page.textContent("#planBadge")).trim() === "1/6", "✕ 빼기");

  // 기록 지우기
  await page.click("#btnClear");
  ok((await page.textContent("#sumStats")).includes("총 연습 0회"), "기록 지우기");

  // 인쇄 버튼 (window.print 가로채기) + 인쇄 미디어
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click("#btnPrint"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__printed) === 1, "인쇄 버튼");
  await page.emulateMedia({ media: "print" });
  ok(!(await page.isVisible(".tabs")) && !(await page.isVisible('#planRows [data-act="rec"]')) && await page.isVisible("#planRows"), "인쇄: 계획표만");
  await page.emulateMedia({ media: "screen" });

  // 휴대폰 390px
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, permissions: ["microphone"] });
  await m.addInitScript(FAKE_SR);
  await stubFonts(m);
  const mp = await m.newPage();
  mp.on("pageerror", e => errors.push(String(e)));
  await mp.goto(BASE); await mp.waitForSelector("#grid-basic .card");
  await mp.click('#grid-basic [data-pick="in_bag"]');
  const sw = await mp.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(sw[0] <= sw[1], "390px 가로 스크롤 없음 " + sw);
  ok(await mp.isVisible(".tab .short"), "휴대폰 짧은 탭 이름");
  const tabH = await mp.$$eval(".tab", ts => ts.map(t => t.getBoundingClientRect().height));
  ok(Math.max(...tabH) < 60, "탭 한 줄 " + tabH);
  await mp.screenshot({ path: OUT + "/mobile-cards.png" });
  await mp.click('.tab[data-tab="practice"]');
  const sw2 = await mp.evaluate(() => document.documentElement.scrollWidth);
  ok(sw2 <= 390, "390px 연습하기 가로 스크롤 없음 " + sw2);
  await mp.locator('[data-act="rec"]').first().click();
  await mp.locator(".result .big").first().waitFor({ timeout: 8000 });
  await mp.screenshot({ path: OUT + "/mobile-practice.png", fullPage: true });

  ok(errors.length === 0, "콘솔 오류 0 " + errors.join(" | "));
  await browser.close();
  console.log(fail ? `\n${fail}개 실패` : "\n모두 통과");
  process.exit(fail ? 1 : 0);
})();
