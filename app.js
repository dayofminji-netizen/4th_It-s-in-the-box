/* =========================================================
 * It's in the box! — 화면 동작
 *  - 초급/중급 활동 카드 탭(같은 계획표 공유: plans[qid] = {id, level})
 *  - 연습하기 탭: 나의 계획표 + 말하기(음성 인식 + 녹음) + 기록(localStorage)
 * ========================================================= */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const LS_PLANS = "itsinbox.plans.v2";
  const LS_STATS = "itsinbox.stats.v2";
  const LEVEL_KO = { basic: "초급", mid: "중급" };

  /* ---------- 저장 ---------- */
  function load(key, def) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : def; }
    catch (e) { return def; }
  }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 무시 */ } }

  let plans = load(LS_PLANS, {});
  let stats = load(LS_STATS, {});
  const recordings = {}; // qid -> blob URL (새로고침하면 사라짐)
  let currentQ = QUESTIONS[0].id;
  const TOTAL = QUESTIONS.length;
  const filters = { basic: "all", mid: "all" };

  const placeById = id => PLACES.find(p => p.id === id);
  const qById = id => QUESTIONS.find(q => q.id === id);
  const catById = id => CATEGORIES.find(c => c.id === id);
  function planOf(qid) {
    const pl = plans[qid];
    if (!pl) return null;
    const p = placeById(pl.id);
    if (!p) return null;
    const level = pl.level === "mid" ? "mid" : "basic";
    const s = level === "mid" ? p.mid : p.say;
    return { place: p, level, en: s.en, ko: s.ko };
  }
  const planCount = () => QUESTIONS.filter(q => planOf(q.id)).length;

  /* ---------- 음성 합성 ---------- */
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /en[-_]US/i.test(v.lang) && /Google|Samantha|Jenny|Aria/i.test(v.name))
      || vs.find(v => /en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speakQueue(texts, done) {
    if (!("speechSynthesis" in window)) { toast("이 브라우저는 읽어 주기를 지원하지 않아요."); done && done(); return; }
    speechSynthesis.cancel();
    const list = texts.filter(Boolean);
    let i = 0;
    (function next() {
      if (i >= list.length) { done && done(); return; }
      const u = new SpeechSynthesisUtterance(list[i++]);
      u.lang = "en-US"; u.rate = 0.88;
      if (voice) u.voice = voice;
      u.onend = () => setTimeout(next, 250);
      u.onerror = () => next();
      speechSynthesis.speak(u);
    })();
  }
  const speak = (t, done) => speakQueue([t], done);

  /* ---------- 작은 도우미 ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
  }

  function josa(word) { const c = word.charCodeAt(word.length - 1) - 0xAC00; return c >= 0 && c % 28 ? "이" : "가"; }

  /* 문장 → 클릭 가능한 단어 */
  function wordsHtml(sentence) {
    return sentence.split(/(\s+)/).map(tok => {
      if (/^\s+$/.test(tok)) return tok;
      const m = tok.match(/^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/);
      if (!m) return esc(tok);
      return `${esc(m[1])}<span class="w" tabindex="0" data-w="${esc(m[2])}">${esc(m[2])}</span>${esc(m[3])}`;
    }).join("");
  }

  /* 단어 뜻 풍선 */
  const popup = $("#popup");
  function showWord(el) {
    const raw = el.dataset.w;
    const key = raw.toLowerCase();
    const mean = DICT[key] || DICT[key.replace(/'s$/, "")] || "…";
    popup.innerHTML = `<b>${esc(raw)}</b> 🔊<br>${esc(mean)}`;
    popup.classList.remove("hidden");
    const r = el.getBoundingClientRect();
    const pw = Math.min(240, window.innerWidth - 16);
    let left = r.left + window.scrollX;
    left = Math.max(8, Math.min(left, window.scrollX + window.innerWidth - pw - 8));
    popup.style.left = left + "px";
    popup.style.top = (r.bottom + window.scrollY + 6) + "px";
    speak(raw.replace(/'s$/i, "'s"));
  }
  document.addEventListener("click", e => {
    const w = e.target.closest(".w");
    if (w) { e.stopPropagation(); showWord(w); return; }
    if (!e.target.closest("#popup")) popup.classList.add("hidden");
  });
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("w")) { e.preventDefault(); showWord(e.target); }
    if (e.key === "Escape") popup.classList.add("hidden");
  });

  /* 그림(없거나 못 불러오면 이모지 타일) */
  function picHtml(p, extraObj) {
    return `<img src="images/${p.id}.png" alt="${esc(p.en)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'tile',textContent:'${p.emoji}'}))">`
      + (extraObj ? `<span class="obj" title="찾는 물건">${extraObj}</span>` : "");
  }

  /* ---------- 탭 ---------- */
  function showTab(name) {
    document.querySelectorAll(".tab").forEach(t => {
      const on = t.dataset.tab === name;
      t.classList.toggle("active", on); t.setAttribute("aria-selected", on);
    });
    document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + name));
    popup.classList.add("hidden");
    if (name === "practice") renderPractice(); else renderLevel(name);
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));

  /* ---------- 활동 카드 탭 ---------- */
  function renderLevel(level) {
    const panel = $("#panel-" + level);
    const q = qById(currentQ);
    const pl = planOf(currentQ);
    const lv = LEVEL_KO[level];

    const qbtns = QUESTIONS.map((x, i) => {
      const p = planOf(x.id);
      return `<button class="qbtn ${x.id === currentQ ? "active" : ""}" data-q="${x.id}" aria-pressed="${x.id === currentQ}">
        <span class="num">Q${i + 1}</span>${p ? `<span class="done">✓${p.place.emoji}</span>` : ""}
        <span class="emo">${x.emoji}</span><span class="k">${x.ko}</span><span class="e">${x.en}</span></button>`;
    }).join("");

    let ansEn = `It's <span class="blank">___</span> the <span class="blank">___</span>.`;
    if (pl) {
      const extra = pl.level === "mid" ? " " + wordsHtml(catById(pl.place.cat).midEn) : "";
      ansEn = `${wordsHtml("It's")} <span class="filled">${wordsHtml(pl.place.en)}</span>${extra}.`;
    }
    const ansKo = pl ? pl.ko : "그건 ___ 있어.";
    const levelNote = pl && pl.level !== level ? ` <small>(${LEVEL_KO[pl.level]} 카드에서 고름)</small>` : "";

    const cats = CATEGORIES.map(c => `<button class="chip-f ${filters[level] === c.id ? "on" : ""}" data-f="${c.id}">${c.emoji} ${c.ko}</button>`).join("");

    panel.innerHTML = `
      <div class="box">
        <h2>1️⃣ 질문을 골라요</h2>
        <div class="qbtns">${qbtns}</div>
        <div class="chat">
          <div class="line friend">
            <div class="who"><span class="face">🙋</span>친구</div>
            <div class="bubble"><div class="row"><span class="s en">${wordsHtml(q.q)}</span><button class="icon-btn" data-say="q" aria-label="질문 듣기">🔊</button></div>
              <div class="k">${q.qko}</div></div>
          </div>
          <div class="line me">
            <div class="who"><span class="face">🙆</span>나</div>
            <div class="bubble"><div class="row"><span class="s en">${ansEn}</span>${pl ? `<button class="icon-btn" data-say="a" aria-label="대답 듣기">🔊</button>` : ""}</div>
              <div class="k">${esc(ansKo)}${levelNote}</div></div>
          </div>
        </div>
        <div class="chat-btns">
          <button class="btn primary" data-act="dialog">🔊 대화 듣기</button>
          <button class="btn" data-act="next">다음 질문 ▶</button>
          <button class="btn" data-act="go">🎤 연습하기로 가기</button>
        </div>
        <p class="status" id="status-${level}">${pl ? `✅ Q${QUESTIONS.indexOf(q) + 1} 대답 완성! 연습하기에 담겼어요. (${planCount()}/${TOTAL})` : `👇 아래 카드에서 ${q.ko}${josa(q.ko)} 어디 있는지 골라 보세요.`}</p>
      </div>
      <div class="box">
        <h2>2️⃣ 어디 있는지 골라요 <small>(${lv})</small></h2>
        <div class="filters">
          <button class="chip-f ${filters[level] === "all" ? "on" : ""}" data-f="all">전체</button>
          <button class="chip-f ${filters[level] === "book" ? "on" : ""}" data-f="book">📘 교과서 표현</button>
          ${cats}
          <button class="chip-f ${filters[level] === "rec" ? "on" : ""}" data-f="rec">⭐ ${q.ko}에 어울리는 것만</button>
        </div>
        <div class="grid" id="grid-${level}"></div>
      </div>`;

    renderGrid(level);
    bindLevel(panel, level);
  }

  function renderGrid(level) {
    const grid = $("#grid-" + level);
    const f = filters[level];
    const q = qById(currentQ);
    let list = PLACES;
    if (f === "book") list = PLACES.filter(p => p.book);
    else if (f === "rec") list = PLACES.filter(p => p.when.includes(currentQ)).sort((a, b) => (b.id === q.pair) - (a.id === q.pair));
    else if (f !== "all") list = PLACES.filter(p => p.cat === f);
    if (!list.length) { grid.innerHTML = `<p class="empty">카드가 없어요.</p>`; return; }
    const cur = plans[currentQ];
    grid.innerHTML = list.map(p => {
      const s = level === "mid" ? p.mid : p.say;
      const c = catById(p.cat);
      const picked = cur && cur.id === p.id && cur.level === level;
      const rec = p.when.includes(currentQ);
      const pair = q.pair === p.id;
      return `<article class="card ${picked ? "picked" : ""}" data-cat="${p.cat}" data-id="${p.id}">
        <div class="tags"><span class="tag">${c.emoji} ${c.ko}</span>${p.book ? `<span class="tag book">📘 교과서</span>` : ""}${pair ? `<span class="tag pair">📘 교과서 대화</span>` : ""}${rec ? `<span class="tag rec">⭐ 추천</span>` : ""}</div>
        <div class="pic">${picHtml(p, q.emoji)}</div>
        <div class="sent">${wordsHtml(s.en)}</div>
        <div class="k">${esc(s.ko)}</div>
        <div class="acts">
          <button class="pick ${picked ? "on" : ""}" data-pick="${p.id}">${picked ? `✔ 골랐어요<span class="opt"> (빼기)</span>` : "✅ 여기 있어요!"}</button>
          <button class="icon-btn" data-speak="${esc(s.en)}" aria-label="듣기">🔊</button>
        </div>
      </article>`;
    }).join("");
  }

  function bindLevel(panel, level) {
    panel.onclick = e => {
      const t = e.target;
      const qb = t.closest(".qbtn");
      if (qb) { currentQ = qb.dataset.q; renderLevel(level); speak(qById(currentQ).q); return; }
      const fb = t.closest(".chip-f");
      if (fb) { filters[level] = fb.dataset.f; renderLevel(level); return; }
      const sp = t.closest("[data-speak]");
      if (sp) { speak(sp.dataset.speak); return; }
      const say = t.closest("[data-say]");
      if (say) {
        const pl = planOf(currentQ);
        speak(say.dataset.say === "q" ? qById(currentQ).q : pl && pl.en);
        return;
      }
      const pk = t.closest("[data-pick]");
      if (pk) { togglePick(level, pk.dataset.pick); return; }
      const act = t.closest("[data-act]");
      if (act) {
        const a = act.dataset.act;
        const st = $("#status-" + level);
        if (a === "dialog") {
          const pl = planOf(currentQ);
          st.textContent = pl ? "🔊 대화를 읽어 주는 중…" : "🔊 질문을 읽어 줄게요. 아래에서 대답을 골라 보세요.";
          speakQueue([qById(currentQ).q, pl && pl.en], () => { st.textContent = pl ? "✅ 다 들었어요! 따라 말해 보세요." : "👇 카드를 골라 대답을 완성해요."; });
        } else if (a === "next") {
          const i = QUESTIONS.findIndex(x => x.id === currentQ);
          currentQ = QUESTIONS[(i + 1) % QUESTIONS.length].id;
          renderLevel(level); speak(qById(currentQ).q);
        } else if (a === "go") showTab("practice");
      }
    };
  }

  function togglePick(level, id) {
    const cur = plans[currentQ];
    const q = qById(currentQ);
    if (cur && cur.id === id && cur.level === level) {
      delete plans[currentQ];
      save(LS_PLANS, plans);
      updateBadge(); renderLevel(level);
      $("#status-" + level).textContent = `↩️ Q${QUESTIONS.indexOf(q) + 1} 대답을 뺐어요. (${planCount()}/${TOTAL})`;
      return;
    }
    plans[currentQ] = { id, level };
    save(LS_PLANS, plans);
    updateBadge(); renderLevel(level);
    const pl = planOf(currentQ);
    $("#status-" + level).textContent = `✅ 대답 완성! 연습하기에 담았어요. (${planCount()}/${TOTAL})`;
    speakQueue([q.q, pl.en]);
  }

  function updateBadge() { $("#planBadge").textContent = `${planCount()}/${TOTAL}`; }

  /* ---------- 연습하기 ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  function statFor(en) { return stats[en] || { n: 0, best: 0, sum: 0, last: null }; }

  function renderSummary() {
    let n = 0, sum = 0, practiced = 0;
    QUESTIONS.forEach(q => {
      const pl = planOf(q.id); if (!pl) return;
      const s = statFor(pl.en);
      n += s.n; sum += s.sum; if (s.n > 0) practiced++;
    });
    const avg = n ? Math.round(sum / n) : 0;
    $("#sumStats").innerHTML = `🎙️ 총 연습 <span id="sumN">${n}</span>회 · 📊 평균 정확도 <span id="sumAvg">${n ? avg + "%" : "-"}</span> · ✅ 연습한 문장 <span id="sumDone">${practiced}</span>/${TOTAL}`;
    const note = $("#micNote");
    if (!SR && !canRec) note.textContent = "⚠️ 이 브라우저는 말하기 연습을 지원하지 않아요. Chrome 권장.";
    else if (!SR) note.textContent = "ℹ️ 이 브라우저는 음성 인식이 없어 4초 녹음만 돼요. 채점은 Chrome 권장.";
    else note.textContent = "";
  }

  function statsLine(en) {
    const s = statFor(en);
    if (!s.n) return "아직 연습 전이에요";
    return `이번 ${s.last}% · 평균 ${Math.round(s.sum / s.n)}% · 최고 ${s.best}% · ${s.n}회`;
  }

  function renderPractice() {
    updateBadge();
    renderSummary();
    $("#planRows").innerHTML = QUESTIONS.map((q, i) => {
      const pl = planOf(q.id);
      const head = `<div class="when"><span class="q">Q${i + 1}</span> <span class="k">${q.emoji} ${q.ko}</span> <span class="e">${q.en}</span></div>`;
      if (!pl) {
        return `<div class="prow" data-q="${q.id}"><div class="prow-main">${head}
          <div class="qa"><div class="s en">Q. ${esc(q.q)}</div><div class="s en">A. It's ___ the ___.</div><div class="hint">👉 활동 카드에서 골라요</div></div>
          <div class="thumb">❔</div><div class="row-btns"></div></div></div>`;
      }
      const dis = !SR && !canRec ? "disabled" : "";
      return `<div class="prow" data-q="${q.id}"><div class="prow-main">${head}
        <div class="qa"><div class="s en">Q. ${wordsHtml(q.q)}</div><div class="s en ans">A. ${wordsHtml(pl.en)}</div>
          <div class="k">${esc(q.qko)} — ${esc(pl.ko)} <small>(${LEVEL_KO[pl.level]})</small></div></div>
        <div class="thumb">${picHtml(pl.place)}</div>
        <div class="row-btns"><button class="icon-btn" data-act="say" aria-label="듣기">🔊</button><button class="icon-btn" data-act="remove" aria-label="빼기">✕</button></div>
      </div>
      <div class="speak">
        <div class="speak-top">
          <button class="btn rec" data-act="rec" ${dis}>🎙️ 말하기</button>
          <button class="btn" data-act="play" ${recordings[q.id] ? "" : "disabled"}>▶ 내 목소리</button>
          <span class="rec-stats">${statsLine(pl.en)}</span>
          ${dis ? `<span class="heard">Chrome 권장</span>` : ""}
        </div>
        <div class="live"></div>
        <div class="result"></div>
      </div></div>`;
    }).join("");
  }

  $("#planRows").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const row = b.closest(".prow"); const qid = row.dataset.q;
    const pl = planOf(qid);
    const act = b.dataset.act;
    if (act === "say" && pl) speakQueue([qById(qid).q, pl.en]);
    else if (act === "remove") { delete plans[qid]; save(LS_PLANS, plans); renderPractice(); toast("계획에서 뺐어요."); }
    else if (act === "play" && recordings[qid]) { const a = new Audio(recordings[qid]); a.play().catch(() => toast("재생할 수 없어요.")); }
    else if (act === "rec" && pl) startSpeaking(row, qid, pl.en);
    else if (act === "word") speak(b.dataset.w);
  });

  $("#btnClear").addEventListener("click", () => {
    if (!confirm("연습 기록(횟수·점수)을 모두 지울까요?")) return;
    stats = {}; save(LS_STATS, stats);
    Object.keys(recordings).forEach(k => { URL.revokeObjectURL(recordings[k]); delete recordings[k]; });
    renderPractice(); toast("🧹 기록을 지웠어요.");
  });
  $("#btnAll").addEventListener("click", () => {
    const list = [];
    QUESTIONS.forEach(q => { const pl = planOf(q.id); if (pl) list.push(q.q, pl.en); });
    if (!list.length) { toast("먼저 활동 카드에서 대답을 골라요."); return; }
    speakQueue(list);
  });
  $("#btnPrint").addEventListener("click", () => { showTab("practice"); setTimeout(() => window.print(), 100); });

  /* ---------- 말하기: 음성 인식 + 녹음 ---------- */
  let busy = false;
  async function startSpeaking(row, qid, target) {
    if (busy) { toast("지금 듣는 중이에요…"); return; }
    busy = true;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const btn = $('[data-act="rec"]', row);
    const live = $(".live", row);
    const result = $(".result", row);
    btn.classList.add("on"); btn.textContent = "👂 듣는 중…";
    result.innerHTML = ""; live.textContent = "👂 들리는 말: …";

    // 녹음 시작
    let recorder = null, stream = null, chunks = [];
    if (canRec) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
        recorder.start();
      } catch (err) { recorder = null; toast("🎙️ 마이크 권한이 필요해요 (녹음 없이 진행)"); }
    }
    function stopRecording() {
      return new Promise(res => {
        if (!recorder || recorder.state === "inactive") { stream && stream.getTracks().forEach(t => t.stop()); res(); return; }
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (chunks.length) {
            if (recordings[qid]) URL.revokeObjectURL(recordings[qid]);
            recordings[qid] = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          }
          res();
        };
        recorder.stop();
      });
    }
    function finishUI() {
      busy = false;
      btn.classList.remove("on"); btn.textContent = "🎙️ 말하기";
      const play = $('[data-act="play"]', row); if (play) play.disabled = !recordings[qid];
    }

    if (!SR) { // 음성 인식이 없으면 4초 녹음만
      live.textContent = "🎙️ 4초 동안 녹음해요 (채점은 Chrome 권장)";
      setTimeout(async () => { await stopRecording(); finishUI(); live.textContent = recordings[qid] ? "✅ 녹음 완료! ▶ 내 목소리로 들어 보세요." : "녹음하지 못했어요."; }, 4000);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
    let finals = [];   // 결과별 대안 목록
    let interim = "";
    let ended = false;
    const timer = setTimeout(() => { try { rec.stop(); } catch (e) { /* */ } }, 9000);

    rec.onresult = ev => {
      interim = ""; finals = [];
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) {
          const alts = []; for (let k = 0; k < r.length && k < 5; k++) alts.push(r[k].transcript);
          finals.push(alts);
        } else interim += r[0].transcript;
      }
      const shown = finals.map(a => a[0]).join(" ") + (interim ? " " + interim : "");
      live.textContent = "👂 들리는 말: " + (shown.trim() || "…");
    };
    rec.onerror = ev => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") toast("🎙️ 마이크 권한을 허용해 주세요.");
      else if (ev.error === "no-speech") toast("소리가 들리지 않았어요. 다시 해 볼까요?");
    };
    rec.onend = async () => {
      if (ended) return; ended = true;
      clearTimeout(timer);
      await stopRecording();
      // 후보 만들기 (대안 k번째끼리 이어 붙이기, 최대 5개)
      const cands = [];
      const maxK = finals.reduce((m, a) => Math.max(m, a.length), 0);
      for (let k = 0; k < Math.min(5, maxK); k++) cands.push(finals.map(a => a[Math.min(k, a.length - 1)]).join(" "));
      if (!cands.length && interim) cands.push(interim);
      finishUI();
      live.textContent = "";
      if (!cands.length) { result.innerHTML = `<span class="heard">🤔 들은 말이 없어요. 마이크 가까이에서 다시 말해 보세요.</span>`; return; }
      const r = Scorer.scoreSpeech(target, cands);
      const s = statFor(target);
      s.n += 1; s.sum += r.score; s.best = Math.max(s.best, r.score); s.last = r.score;
      stats[target] = s; save(LS_STATS, stats);
      showResult(row, r, target);
      renderSummary();
      $(".rec-stats", row).textContent = statsLine(target);
    };
    try { rec.start(); } catch (e) { clearTimeout(timer); await stopRecording(); finishUI(); toast("음성 인식을 시작하지 못했어요."); }
  }

  function showResult(row, r) {
    const b = Scorer.badge(r.score);
    const msg = r.score >= 85 ? "아주 잘했어요!" : r.score >= 60 ? "좋아요! 조금만 더!" : "다시 해 볼까요?";
    const chips = r.chips.map(c => `<span class="wc ${c.cls}">${esc(c.word)}</span>`).join("");
    const retry = r.retry.length
      ? `<div class="retry">🔁 다시 들어 볼 단어: ${r.retry.map(w => `<button class="btn" data-act="word" data-w="${esc(w)}">🔊 ${esc(w)}</button>`).join("")}</div>` : "";
    $(".result", row).innerHTML = `<div class="big">${b} ${r.score}% — ${msg}</div>
      <div class="wchips">${chips}</div>${retry}
      <div class="heard">🟩 맞음 · 🟨 비슷함 · 🟥 놓침 &nbsp;|&nbsp; 컴퓨터가 들은 말: “${esc(r.heard)}”</div>`;
  }

  /* ---------- 단풍잎 ---------- */
  (function leaves() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = $(".leaves"); const kinds = ["🍁", "🍂", "🍁", "💛"];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.className = "leaf"; s.textContent = kinds[i % kinds.length];
      s.style.left = (Math.random() * 96) + "%";
      s.style.fontSize = (14 + Math.random() * 14) + "px";
      s.style.animationDuration = (6 + Math.random() * 6) + "s";
      s.style.animationDelay = (-Math.random() * 10) + "s";
      box.appendChild(s);
    }
  })();

  /* ---------- 시작 ---------- */
  updateBadge();
  renderLevel("basic");
  renderLevel("mid");
  window.__app = { get plans() { return plans; }, get stats() { return stats; } };
})();
