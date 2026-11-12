# 📦 It's in the box! — 초등 4학년 영어 말하기 앱

천재(김) 4학년 **10단원 It's in the box.** 수업용 정적 웹 앱입니다.
설치 없이 `index.html`만 열면 동작하고, GitHub Pages로 올려도 됩니다.

- 질문: **Where is my ___?**  대답: **It's ___ the ___.**
- 계절 테마: 🍁 가을 (주황·단풍 빨강·은행잎 노랑, 헤더에 떨어지는 단풍잎)

## 기능

### 🎨 활동 카드 (초급) / (중급)
1. **1️⃣ 질문을 골라요**: Q1~Q6 버튼(교과서 대화의 물건 6개)(번호·이모지·한국어·영어). 대답을 고르면 ✓와 장소 이모지가 표시돼요.
   | Q | 질문 | 뜻 | 📘 교과서 대답 |
   |---|---|---|---|
   | Q1 📕 | Where is my book? | 내 책 어디 있어? | It's on the sofa. |
   | Q2 ✏️ | Where is my pencil case? | 내 필통 어디 있어? | It's in the bag. |
   | Q3 ⌚ | Where is my watch? | 내 시계 어디 있어? | It's under the chair. |
   | Q4 ⚽ | Where is my ball? | 내 공 어디 있어? | It's in the box. |
   | Q5 🧦 | Where is my sock? | 내 양말 어디 있어? | It's on the desk. |
   | Q6 👟 | Where is my shoe? | 내 신발 어디 있어? | It's under the table. |
2. **말풍선 대화**: 🙋 친구(질문) / 🙆 나(대답, 빈칸 `It's ___ the ___.`), 한국어 뜻, 줄마다 🔊,
   [🔊 대화 듣기] [다음 질문 ▶] [🎤 연습하기로 가기], 상태 안내 문구.
3. **2️⃣ 어디 있는지 골라요**: 필터 [전체] [📘 교과서 표현] [종류 5개] [⭐ (지금 질문)에 어울리는 것만].
4. **카드**: 종류 태그(+📘 교과서, +⭐ 추천), 그림(+찾는 물건 이모지), 문장(단어를 누르면 뜻 풍선 + 발음), 한국어, 🔊,
   **✅ 여기 있어요!** → 지금 질문의 대답이 되고 말풍선 빈칸이 채워지며 질문+대답을 읽어 주고, 연습하기에 바로 담겨요.
   다시 누르면 빠지고, 질문 하나당 대답은 1개(다른 카드를 누르면 바뀜).
   지금 질문의 교과서 대답 카드에는 **📘 교과서 대화** 태그가 붙고, ⭐ 필터에서 맨 앞에 나와요.
- 초급: `It's on the bed.` / 중급: `It's on the bed in my room.`
- 초급·중급 어느 탭에서 골라도 **같은 계획표**에 저장돼요 (질문별 `{id, level}`, localStorage).

### 🎤 연습하기 (탭 배지에 담은 개수 예: 2/6)
- 맨 위 요약: 🎙️ 총 연습 n회 · 📊 평균 정확도 % · ✅ 연습한 문장 n/6, [🧹 기록 지우기] [🔊 전체 듣기] [🖨️ 인쇄하기]
- 📅 나의 계획표 · My Plans: 질문 6줄 (Q·무엇·Q문장·A문장·한국어·그림·🔊·✕). 비어 있으면 `A. It's ___ the ___.` + “활동 카드에서 골라요”.
- 줄마다 말하기 도구: [🎙️ 말하기] [▶ 내 목소리] “이번 % · 평균 % · 최고 % · n회”
  - Web Speech API 음성 인식(en-US, interimResults, maxAlternatives 5, 9초 제한) + MediaRecorder 녹음을 동시에.
  - 말하는 동안 “👂 들리는 말” 실시간 표시, 끝나면 ▶ 내 목소리로 녹음 재생.
  - 기록(횟수·최고·점수 합계→평균)은 localStorage 저장. 녹음은 새로고침하면 사라져요.
  - 음성 인식이 없는 브라우저는 4초 녹음만, 둘 다 없으면 버튼 비활성 + “Chrome 권장”.
- 인쇄하면 계획표만 나와요(버튼·마이크 도구 숨김).

## 채점 방식 (`score.js`)
1. **정리**: 줄임말 펼치기(I'm→i am, it's/its→it is, I'll→i will …), 동음어 통일(too/two→to, four→for …),
   한 글자씩 들린 말 붙이기(“t v”→tv, “p c”→pc).
2. 목표 문장과 들린 말을 단어 **순서대로** 동적 계획법(DP)으로 정렬.
3. 단어 점수: 같음 **1** · 철자 1글자 차이 **0.85** · 소리 비슷 **0.7**(자음만 통일: r/l, f/p, v/b, th/s, c/k … 모음은 유지 → kite≠cat) · 비슷한 편 **0.5** · 그 외 **0**.
4. 가중치: 핵심 단어 **1**(on/in/under, 장소 이름 등) · 작은 단어(a, the, to, my, i, am, is, it …) **0.3** · 지명(대문자 고유명사) **0.6**.
5. 덧붙인 말 개당 **3%**, 최대 **10%** 감점. 보너스 없음.
6. 인식 후보(최대 5개) 중 최고 점수 사용.
- 결과: ⭐ 85%↑ / 👍 60%↑ / 🔁 그 아래, 단어 칩(🟩 맞음 · 🟨 비슷함 · 🟥 놓침, It's 는 한 칩),
  “🔁 다시 들어 볼 단어: 🔊 bed” 버튼, “컴퓨터가 들은 말: …”.
- 기준 예시(`node tests/score.test.js`): “I'm going to fly a kite.” → 정확 100, “fly a cat” 73, “fly a kite”만 55, 순서 뒤섞임 14.
  단원 예: “It's on the bed.”에 “it's in the bed” → 63 (전치사가 핵심 단어라 크게 감점).

## 장소 목록 (5종류 × 12개 = 60개, 📘 = 교과서 표현)
교과서 대화 표현 6개(on the desk / on the sofa / in the box / in the bag / under the table / under the chair)와 처음 요청한 표현 3개(on the bed / under the desk / on the chair)를 모두 📘로 표시했고, 같은 종류 안에서 맨 앞에 있어요.
가을이라 눈사람·스키 같은 장소는 빼고 낙엽 속·단풍나무·은행나무·호박·사과 바구니를 넣었어요.

### 🛏️ 내 방 (중급: “… in my room.”)

| id | 초급 문장 | 뜻 | 어울리는 질문 |
|---|---|---|---|
| on_bed | 📘 It's on the bed. | 그건 침대 위에 있어. | 📕 ⌚ 🧦 |
| in_box | 📘 It's in the box. | 그건 상자 안에 있어. | ⚽ 👟 ⌚ |
| in_bag | 📘 It's in the bag. | 그건 가방 안에 있어. | ✏️ 📕 |
| under_bed | It's under the bed. | 그건 침대 아래에 있어. | ⚽ 👟 🧦 |
| on_shelf | It's on the shelf. | 그건 선반 위에 있어. | 📕 ⌚ |
| in_closet | It's in the closet. | 그건 옷장 안에 있어. | 👟 🧦 |
| on_pillow | It's on the pillow. | 그건 베개 위에 있어. | ⌚ 📕 |
| under_blanket | It's under the blanket. | 그건 이불 아래에 있어. | 🧦 📕 |
| in_drawer | It's in the drawer. | 그건 서랍 안에 있어. | 🧦 ⌚ ✏️ |
| in_toybox | It's in the toy box. | 그건 장난감 상자 안에 있어. | ⚽ |
| under_pillow | It's under the pillow. | 그건 베개 아래에 있어. | ⌚ 📕 |
| in_basket | It's in the basket. | 그건 바구니 안에 있어. | 🧦 ⚽ |

### 🛋️ 거실 (중급: “… in the living room.”)

| id | 초급 문장 | 뜻 | 어울리는 질문 |
|---|---|---|---|
| on_sofa | 📘 It's on the sofa. | 그건 소파 위에 있어. | 📕 ⌚ 🧦 |
| under_sofa | It's under the sofa. | 그건 소파 아래에 있어. | ⚽ 🧦 👟 |
| on_piano | It's on the piano. | 그건 피아노 위에 있어. | 📕 ✏️ |
| under_rug | It's under the rug. | 그건 깔개 아래에 있어. | 📕 |
| on_cushion | It's on the cushion. | 그건 쿠션 위에 있어. | ⌚ 📕 |
| in_fishtank | It's in the fish tank. | 그건 어항 안에 있어. | ⚽ ⌚ |
| in_flowerpot | It's in the flowerpot. | 그건 화분 안에 있어. | ⚽ |
| on_tv | It's on the TV. | 그건 텔레비전 위에 있어. | ⌚ |
| under_lamp | It's under the lamp. | 그건 전등 아래에 있어. | 📕 🧦 |
| on_floor | It's on the floor. | 그건 바닥 위에 있어. | 🧦 👟 ⚽ |
| in_shoebox | It's in the shoe box. | 그건 신발 상자 안에 있어. | 👟 |
| on_stairs | It's on the stairs. | 그건 계단 위에 있어. | ⚽ 👟 |

### 🍳 부엌 (중급: “… in the kitchen.”)

| id | 초급 문장 | 뜻 | 어울리는 질문 |
|---|---|---|---|
| under_table | 📘 It's under the table. | 그건 식탁 아래에 있어. | 👟 ⚽ 🧦 |
| on_table | It's on the table. | 그건 식탁 위에 있어. | 📕 ✏️ ⌚ |
| in_fridge | It's in the fridge. | 그건 냉장고 안에 있어. | ⚽ ⌚ |
| on_fridge | It's on the fridge. | 그건 냉장고 위에 있어. | ⌚ 📕 |
| in_sink | It's in the sink. | 그건 싱크대 안에 있어. | 🧦 ⌚ |
| in_pot | It's in the pot. | 그건 냄비 안에 있어. | ⚽ 🧦 |
| in_cup | It's in the cup. | 그건 컵 안에 있어. | ⌚ |
| on_plate | It's on the plate. | 그건 접시 위에 있어. | ⚽ |
| under_sink | It's under the sink. | 그건 싱크대 아래에 있어. | 👟 ⚽ |
| in_bowl | It's in the bowl. | 그건 그릇 안에 있어. | ⌚ ⚽ |
| in_trashcan | It's in the trash can. | 그건 쓰레기통 안에 있어. | 🧦 ✏️ |
| in_lunchbox | It's in the lunch box. | 그건 도시락 통 안에 있어. | ⌚ |

### 🏫 교실 (중급: “… in the classroom.”)

| id | 초급 문장 | 뜻 | 어울리는 질문 |
|---|---|---|---|
| under_desk | 📘 It's under the desk. | 그건 책상 아래에 있어. | ⚽ 👟 ✏️ |
| on_desk | 📘 It's on the desk. | 그건 책상 위에 있어. | 🧦 📕 ✏️ ⌚ |
| on_chair | 📘 It's on the chair. | 그건 의자 위에 있어. | 📕 ✏️ ⌚ |
| under_chair | 📘 It's under the chair. | 그건 의자 아래에 있어. | ⌚ 👟 ⚽ |
| in_locker | It's in the locker. | 그건 사물함 안에 있어. | 📕 👟 ⚽ |
| on_teachersdesk | It's on the teacher's desk. | 그건 선생님 책상 위에 있어. | 📕 ✏️ ⌚ |
| in_pencilcase | It's in the pencil case. | 그건 필통 안에 있어. | ⌚ |
| on_computer | It's on the computer. | 그건 컴퓨터 위에 있어. | ⌚ |
| on_bookshelf | It's on the bookshelf. | 그건 책꽂이 위에 있어. | 📕 |
| in_umbrellastand | It's in the umbrella stand. | 그건 우산꽂이 안에 있어. | 👟 ⚽ |
| on_windowsill | It's on the windowsill. | 그건 창틀 위에 있어. | ⌚ ✏️ |
| on_shoerack | It's on the shoe rack. | 그건 신발장 위에 있어. | 👟 🧦 |

### 🍂 가을 공원 (중급: “… in the park.”)

| id | 초급 문장 | 뜻 | 어울리는 질문 |
|---|---|---|---|
| under_tree | It's under the tree. | 그건 나무 아래에 있어. | ⚽ 📕 |
| on_bench | It's on the bench. | 그건 벤치 위에 있어. | 📕 ⌚ ✏️ |
| in_leaves | It's in the leaves. | 그건 낙엽 속에 있어. | ⚽ ⌚ 🧦 |
| under_maple | It's under the maple tree. | 그건 단풍나무 아래에 있어. | 📕 👟 |
| in_sandbox | It's in the sandbox. | 그건 모래밭 안에 있어. | 👟 ⚽ |
| on_slide | It's on the slide. | 그건 미끄럼틀 위에 있어. | 👟 ⚽ |
| under_swing | It's under the swing. | 그건 그네 아래에 있어. | ⚽ 👟 |
| in_bikebasket | It's in the bike basket. | 그건 자전거 바구니 안에 있어. | 📕 ⚽ |
| on_swing | It's on the swing. | 그건 그네 위에 있어. | 🧦 📕 |
| in_pumpkin | It's in the pumpkin. | 그건 호박 속에 있어. | ⚽ |
| in_applebasket | It's in the apple basket. | 그건 사과 바구니 안에 있어. | ⚽ |
| under_ginkgo | It's under the ginkgo tree. | 그건 은행나무 아래에 있어. | 📕 👟 |

## 그림 바꾸는 법
- 그림은 `images/<장소 id>.png` 입니다 (예: `images/on_bed.png`). 같은 이름으로 덮어쓰면 바로 바뀌어요.
- 모두 Canva generate-image로 같은 틀로 만들었어요 (aspectRatio `LANDSCAPE_4_3`):
  > Cute flat vector illustration for an elementary school English flashcard: [한국 아이가 물건을 그 장소에서 찾는 구체적 장면]. Warm autumn colors, simple clean shapes, white background, no text, no letters.
- 외부 다운로드가 막혀 Canva 미리보기 크기(약 200×150)로 저장돼 있어요. 카드에서는 `object-fit: contain`, 흰 배경으로 보여 줘요.
  더 선명하게 하려면 Canva에서 큰 크기로 내려받아 같은 이름으로 바꾸세요.
- 그림이 없거나 못 불러오면 장소 이모지 타일로 자동 대체돼요.
- 장소를 추가하면 `data.js`의 `RAW_PLACES`에 항목을 넣고(`id, cat, en, ko, emoji, when, book?`), 새 단어는 `DICT`에 뜻을 넣은 뒤 `node tests/check-data.js`로 확인하세요.

## 파일 구성
| 파일 | 내용 |
|---|---|
| `index.html` | 화면 틀 (탭 3개) |
| `style.css` | 가을 테마, 휴대폰(390px) 대응, 인쇄 스타일 |
| `data.js` | 질문 6개(교과서 짝 pair), 종류 5개, 장소 60개(초급·중급 문장), 단어 뜻 사전 |
| `score.js` | 발음 채점 (브라우저·Node 공용) |
| `app.js` | 카드·말풍선·계획표·음성 합성·음성 인식·녹음·기록 |
| `images/` | Canva 그림 60장 |
| `tests/score.test.js` | 채점 단위 테스트 (Node) |
| `tests/check-data.js` | 데이터 검사: 개수·교과서 표현·교과서 대화 6쌍·사전 누락 0·그림 누락 0 |
| `tests/e2e.js` | Playwright 테스트 (가짜 마이크 + 가짜 SpeechRecognition) |

## 테스트
```bash
node tests/score.test.js
node tests/check-data.js
python3 -m http.server 8765   # 다른 창에서
node tests/e2e.js             # 스크린샷: tests/shots/
```

## 수업 전 확인할 것
- **Chrome(데스크톱/안드로이드) 권장**. 음성 인식(Web Speech API)은 Chrome·Edge에서 가장 잘 돼요. Safari·Firefox는 녹음만 될 수 있어요.
- 마이크 권한을 **허용**해야 해요. 파일을 직접 열면(file://) 매번 권한을 물을 수 있으니 GitHub Pages(https) 사용을 권장해요.
- Chrome 음성 인식은 인터넷 연결이 필요해요.
- 실제 마이크·실제 학생 발음으로는 시험하지 못했어요(가짜 마이크/가짜 음성 인식으로만 테스트). 수업 전에 교실 기기에서 한 번 말해 보세요.
- 영어 읽어 주기 목소리는 기기에 설치된 영어(en-US) 음성을 써요.
