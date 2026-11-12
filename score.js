/* =========================================================
 * 발음 채점 (브라우저 + Node 공용)
 *  1) 정리: 소문자, 줄임말 펼치기(I'm→i am, it's→it is …),
 *     동음어 통일(too/two→to, four→for …), 한 글자씩 들린 말 붙이기("t v"→tv)
 *  2) 목표 문장과 들린 말을 단어 "순서대로" 동적 계획법(DP)으로 정렬
 *  3) 단어 점수: 같음 1 · 철자 1글자 차이 0.85 · 소리 비슷 0.7 · 비슷한 편 0.5 · 그 외 0
 *  4) 가중치: 핵심 단어 1 · 작은 단어 0.3 · 지명(대문자 고유명사) 0.6
 *  5) 덧붙인 말 개당 3%, 최대 10% 감점 · 보너스 없음
 *  6) 후보(최대 5개) 중 최고 점수
 * ========================================================= */
(function (root) {
  const CONTRACTIONS = {
    "i'm": "i am", "it's": "it is", "its": "it is", "i'll": "i will", "you're": "you are",
    "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is",
    "that's": "that is", "what's": "what is", "where's": "where is", "there's": "there is",
    "let's": "let us", "don't": "do not", "doesn't": "does not", "can't": "can not",
    "cannot": "can not", "isn't": "is not", "aren't": "are not", "won't": "will not",
    "i've": "i have", "i'd": "i would", "you'll": "you will", "we'll": "we will",
  };
  const HOMOPHONES = {
    "too": "to", "two": "to", "four": "for", "inn": "in", "un": "on",
    "eye": "i", "ay": "a", "thee": "the", "da": "the",
  };
  const SMALL = new Set(["a", "an", "the", "to", "my", "i", "am", "is", "it", "are", "and", "of", "at", "your"]);

  function cleanRaw(s) {
    return String(s || "")
      .replace(/[‘’ʼ`´]/g, "'")
      .replace(/[^A-Za-z0-9'\s-]/g, " ")
      .replace(/-/g, " ");
  }

  /* 원래 단어 → 정규화 토큰들 */
  function expandWord(w) {
    let lw = w.toLowerCase().replace(/^'+|'+$/g, "");
    if (!lw) return [];
    if (CONTRACTIONS[lw]) return CONTRACTIONS[lw].split(" ");
    if (/'s$/.test(lw) && !CONTRACTIONS[lw]) return [lw]; // teacher's 등 소유격은 그대로
    lw = lw.replace(/'/g, "");
    if (HOMOPHONES[lw]) return [HOMOPHONES[lw]];
    return [lw];
  }

  /* 한 글자씩 들린 말 붙이기: "t v" → "tv", "p c" → "pc" (a·i 만으로 된 연속은 제외) */
  function joinLetters(tokens) {
    const out = [];
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i].length === 1) {
        let j = i;
        while (j < tokens.length && tokens[j].length === 1) j++;
        const run = tokens.slice(i, j);
        if (run.length >= 2 && run.some(t => t !== "a" && t !== "i")) out.push(run.join(""));
        else out.push(...run);
        i = j;
      } else out.push(tokens[i++]);
    }
    return out;
  }

  function normalize(s) {
    const words = cleanRaw(s).split(/\s+/).filter(Boolean);
    return joinLetters(words.flatMap(expandWord));
  }

  /* 목표 문장: 원래 단어(칩)별 토큰과 가중치 */
  function targetParts(target) {
    const words = cleanRaw(target).split(/\s+/).filter(Boolean);
    const display = String(target).replace(/[.?!,]/g, "").split(/\s+/).filter(Boolean);
    return words.map((w, idx) => {
      const toks = expandWord(w);
      const proper = idx > 0 && /^[A-Z][a-z]/.test(w);
      return {
        word: display[idx] || w,
        tokens: toks,
        weights: toks.map(t => SMALL.has(t) ? 0.3 : (proper ? 0.6 : 1)),
      };
    });
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(new Array(n).fill(0)));
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  /* 소리 열쇠: 자음만 통일(r/l, f/p, v/b, th/s, c/k …), 모음은 그대로 → kite≠cat */
  function soundKey(w) {
    return w.toLowerCase()
      .replace(/ph/g, "f").replace(/th/g, "s").replace(/ck/g, "k").replace(/sh/g, "s")
      .replace(/[r]/g, "l").replace(/[f]/g, "p").replace(/[v]/g, "b")
      .replace(/[cq]/g, "k").replace(/z/g, "s").replace(/x/g, "ks")
      .replace(/(.)\1+/g, "$1");
  }

  function wordSim(t, h) {
    if (!t || !h) return 0;
    if (t === h) return 1;
    const lev = levenshtein(t, h);
    if (lev === 1 && Math.max(t.length, h.length) >= 3) return 0.85;
    if (soundKey(t) === soundKey(h)) return 0.7;
    const maxLen = Math.max(t.length, h.length);
    if (maxLen >= 4 && lev / maxLen <= 0.4) return 0.5;
    return 0;
  }

  /* 한 후보 채점 */
  function scoreOne(target, heard) {
    const parts = targetParts(target);
    const T = [];
    parts.forEach((p, pi) => p.tokens.forEach((tok, k) => T.push({ tok, w: p.weights[k], pi })));
    const H = normalize(heard);
    const n = T.length, m = H.length;
    const total = T.reduce((s, x) => s + x.w, 0) || 1;

    // DP: 순서를 지키며 (가중치×유사도) 합이 최대가 되도록 정렬
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++)
      for (let j = 1; j <= m; j++) {
        const s = T[i - 1].w * wordSim(T[i - 1].tok, H[j - 1]);
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], s > 0 ? dp[i - 1][j - 1] + s : -1);
      }
    // 되짚기
    const sims = new Array(n).fill(0);
    const usedH = new Array(m).fill(false);
    let i = n, j = m;
    while (i > 0 && j > 0) {
      const s = T[i - 1].w * wordSim(T[i - 1].tok, H[j - 1]);
      if (s > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + s)) < 1e-9) {
        sims[i - 1] = wordSim(T[i - 1].tok, H[j - 1]);
        usedH[j - 1] = true; i--; j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
      else j--;
    }
    const extras = usedH.filter(u => !u).length;
    const penalty = Math.min(0.10, extras * 0.03);
    const raw = dp[n][m] / total;
    const score = Math.max(0, Math.round((raw - penalty) * 100));

    const chips = parts.map((p, pi) => {
      const idx = T.map((x, k) => (x.pi === pi ? k : -1)).filter(k => k >= 0);
      const avg = idx.reduce((s, k) => s + sims[k], 0) / (idx.length || 1);
      const cls = avg >= 0.999 ? "ok" : avg >= 0.5 ? "near" : "miss";
      const small = p.tokens.every(t => SMALL.has(t));
      return { word: p.word, cls, small };
    });
    const retry = chips.filter(c => c.cls !== "ok" && !c.small).map(c => c.word);
    return { score, chips, retry, heard: String(heard || ""), extras };
  }

  /* 후보 최대 5개 중 최고 점수 */
  function scoreSpeech(target, candidates) {
    const list = (Array.isArray(candidates) ? candidates : [candidates]).filter(c => c && String(c).trim()).slice(0, 5);
    if (!list.length) return scoreOne(target, "");
    return list.map(c => scoreOne(target, c)).sort((a, b) => b.score - a.score)[0];
  }

  function badge(score) { return score >= 85 ? "⭐" : score >= 60 ? "👍" : "🔁"; }

  const api = { normalize, wordSim, soundKey, scoreOne, scoreSpeech, badge, levenshtein };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Scorer = api;
})(typeof window !== "undefined" ? window : globalThis);
