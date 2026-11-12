/* =========================================================
 * 천재(김) 4학년 10단원 · It's in the box. 데이터
 *  - 질문: Where is my ___?   대답: It's ___ the ___.
 *  - 질문 6개(Q1~Q6, 교과서 물건) · 장소 5종류 × 12개 = 60개
 *  - 교과서 대화 6쌍: book–on the sofa / pencil case–in the bag / watch–under the chair /
 *      ball–in the box / sock–on the desk / shoe–under the table
 *  - 📘 교과서 표현(book:true) 9개는 같은 종류 안에서 맨 앞
 *      교과서 대화: on the desk / on the sofa / in the box / in the bag / under the table / under the chair
 *      처음 요청에 있던 것: on the bed / under the desk / on the chair
 *  - 계절 테마: 가을(단풍·은행·낙엽·호박·사과 바구니)
 *  - 그림: images/<id>.png (Canva generate-image로 생성)
 * ========================================================= */

const SEASON = "autumn";

/* 질문 6개 (교과서 대화 순서) · pair = 교과서 대답 장소 id */
const QUESTIONS = [
  { id: "book",       emoji: "📕", ko: "내 책",   en: "my book",        q: "Where is my book?",        qko: "내 책 어디 있어?",   pair: "on_sofa" },
  { id: "pencilcase", emoji: "✏️", ko: "내 필통", en: "my pencil case", q: "Where is my pencil case?", qko: "내 필통 어디 있어?", pair: "in_bag" },
  { id: "watch",      emoji: "⌚", ko: "내 시계", en: "my watch",       q: "Where is my watch?",       qko: "내 시계 어디 있어?", pair: "under_chair" },
  { id: "ball",       emoji: "⚽", ko: "내 공",   en: "my ball",        q: "Where is my ball?",        qko: "내 공 어디 있어?",   pair: "in_box" },
  { id: "sock",       emoji: "🧦", ko: "내 양말", en: "my sock",        q: "Where is my sock?",        qko: "내 양말 어디 있어?", pair: "on_desk" },
  { id: "shoe",       emoji: "👟", ko: "내 신발", en: "my shoe",        q: "Where is my shoe?",        qko: "내 신발 어디 있어?", pair: "under_table" },
];

/* 장소 종류 5개 (중급 문장에 붙는 말 midEn / midKo) */
const CATEGORIES = [
  { id: "room",    emoji: "🛏️", ko: "내 방",     midEn: "in my room",        midKo: "내 방" },
  { id: "living",  emoji: "🛋️", ko: "거실",      midEn: "in the living room", midKo: "거실" },
  { id: "kitchen", emoji: "🍳", ko: "부엌",      midEn: "in the kitchen",     midKo: "부엌" },
  { id: "class",   emoji: "🏫", ko: "교실",      midEn: "in the classroom",   midKo: "교실" },
  { id: "park",    emoji: "🍂", ko: "가을 공원", midEn: "in the park",        midKo: "공원" },
];

/* 장소(활동) 60개
 * en: 전치사구(It's ___.)  ko: "그건 ___ 있어."의 빈칸  when: 어울리는 질문 */
const RAW_PLACES = [
  // 🛏️ 내 방
  { id: "on_bed",        cat: "room", en: "on the bed",        ko: "침대 위에",       emoji: "🛏️", when: ["book","watch","sock"], book: true },
  { id: "in_box",        cat: "room", en: "in the box",        ko: "상자 안에",       emoji: "📦", when: ["ball","shoe","watch"], book: true },
  { id: "in_bag",        cat: "room", en: "in the bag",        ko: "가방 안에",       emoji: "🎒", when: ["pencilcase","book"],      book: true },
  { id: "under_bed",     cat: "room", en: "under the bed",     ko: "침대 아래에",     emoji: "🛏️", when: ["ball","shoe","sock"] },
  { id: "on_shelf",      cat: "room", en: "on the shelf",      ko: "선반 위에",       emoji: "🗄️", when: ["book","watch"] },
  { id: "in_closet",     cat: "room", en: "in the closet",     ko: "옷장 안에",       emoji: "🚪", when: ["shoe","sock"] },
  { id: "on_pillow",     cat: "room", en: "on the pillow",     ko: "베개 위에",       emoji: "🛌", when: ["watch","book"] },
  { id: "under_blanket", cat: "room", en: "under the blanket", ko: "이불 아래에",     emoji: "🧣", when: ["sock","book"] },
  { id: "in_drawer",     cat: "room", en: "in the drawer",     ko: "서랍 안에",       emoji: "🗃️", when: ["sock","watch","pencilcase"] },
  { id: "in_toybox",     cat: "room", en: "in the toy box",    ko: "장난감 상자 안에", emoji: "🧸", when: ["ball"] },
  { id: "under_pillow",  cat: "room", en: "under the pillow",  ko: "베개 아래에",     emoji: "💤", when: ["watch","book"] },
  { id: "in_basket",     cat: "room", en: "in the basket",     ko: "바구니 안에",     emoji: "🧺", when: ["sock","ball"] },

  // 🛋️ 거실
  { id: "on_sofa",       cat: "living", en: "on the sofa",       ko: "소파 위에",     emoji: "🛋️", when: ["book","watch","sock"], book: true },
  { id: "under_sofa",    cat: "living", en: "under the sofa",    ko: "소파 아래에",   emoji: "🛋️", when: ["ball","sock","shoe"] },
  { id: "on_piano",      cat: "living", en: "on the piano",      ko: "피아노 위에",   emoji: "🎹", when: ["book","pencilcase"] },
  { id: "under_rug",     cat: "living", en: "under the rug",     ko: "깔개 아래에",   emoji: "🟫", when: ["book"] },
  { id: "on_cushion",    cat: "living", en: "on the cushion",    ko: "쿠션 위에",     emoji: "🟠", when: ["watch","book"] },
  { id: "in_fishtank",   cat: "living", en: "in the fish tank",  ko: "어항 안에",     emoji: "🐠", when: ["ball","watch"] },
  { id: "in_flowerpot",  cat: "living", en: "in the flowerpot",  ko: "화분 안에",     emoji: "🪴", when: ["ball"] },
  { id: "on_tv",         cat: "living", en: "on the TV",         ko: "텔레비전 위에", emoji: "📺", when: ["watch"] },
  { id: "under_lamp",    cat: "living", en: "under the lamp",    ko: "전등 아래에",   emoji: "💡", when: ["book","sock"] },
  { id: "on_floor",      cat: "living", en: "on the floor",      ko: "바닥 위에",     emoji: "🪵", when: ["sock","shoe","ball"] },
  { id: "in_shoebox",    cat: "living", en: "in the shoe box",   ko: "신발 상자 안에", emoji: "👟", when: ["shoe"] },
  { id: "on_stairs",     cat: "living", en: "on the stairs",     ko: "계단 위에",     emoji: "🪜", when: ["ball","shoe"] },

  // 🍳 부엌
  { id: "under_table",   cat: "kitchen", en: "under the table",  ko: "식탁 아래에",   emoji: "🍽️", when: ["shoe","ball","sock"], book: true },
  { id: "on_table",      cat: "kitchen", en: "on the table",     ko: "식탁 위에",     emoji: "🍽️", when: ["book","pencilcase","watch"] },
  { id: "in_fridge",     cat: "kitchen", en: "in the fridge",    ko: "냉장고 안에",   emoji: "🧊", when: ["ball","watch"] },
  { id: "on_fridge",     cat: "kitchen", en: "on the fridge",    ko: "냉장고 위에",   emoji: "🧊", when: ["watch","book"] },
  { id: "in_sink",       cat: "kitchen", en: "in the sink",      ko: "싱크대 안에",   emoji: "🚰", when: ["sock","watch"] },
  { id: "in_pot",        cat: "kitchen", en: "in the pot",       ko: "냄비 안에",     emoji: "🍲", when: ["ball","sock"] },
  { id: "in_cup",        cat: "kitchen", en: "in the cup",       ko: "컵 안에",       emoji: "☕", when: ["watch"] },
  { id: "on_plate",      cat: "kitchen", en: "on the plate",     ko: "접시 위에",     emoji: "🍽️", when: ["ball"] },
  { id: "under_sink",    cat: "kitchen", en: "under the sink",   ko: "싱크대 아래에", emoji: "🚿", when: ["shoe","ball"] },
  { id: "in_bowl",       cat: "kitchen", en: "in the bowl",      ko: "그릇 안에",     emoji: "🥣", when: ["watch","ball"] },
  { id: "in_trashcan",   cat: "kitchen", en: "in the trash can", ko: "쓰레기통 안에", emoji: "🗑️", when: ["sock","pencilcase"] },
  { id: "in_lunchbox",   cat: "kitchen", en: "in the lunch box", ko: "도시락 통 안에", emoji: "🍱", when: ["watch"] },

  // 🏫 교실
  { id: "under_desk",       cat: "class", en: "under the desk",          ko: "책상 아래에",       emoji: "🪑", when: ["ball","shoe","pencilcase"], book: true },
  { id: "on_desk",          cat: "class", en: "on the desk",             ko: "책상 위에",         emoji: "📚", when: ["sock","book","pencilcase","watch"], book: true },
  { id: "on_chair",         cat: "class", en: "on the chair",            ko: "의자 위에",         emoji: "🪑", when: ["book","pencilcase","watch"], book: true },
  { id: "under_chair",      cat: "class", en: "under the chair",         ko: "의자 아래에",       emoji: "🪑", when: ["watch","shoe","ball"], book: true },
  { id: "in_locker",        cat: "class", en: "in the locker",           ko: "사물함 안에",       emoji: "🔐", when: ["book","shoe","ball"] },
  { id: "on_teachersdesk",  cat: "class", en: "on the teacher's desk",   ko: "선생님 책상 위에",  emoji: "👩‍🏫", when: ["book","pencilcase","watch"] },
  { id: "in_pencilcase",    cat: "class", en: "in the pencil case",      ko: "필통 안에",         emoji: "✏️", when: ["watch"] },
  { id: "on_computer",      cat: "class", en: "on the computer",         ko: "컴퓨터 위에",       emoji: "🖥️", when: ["watch"] },
  { id: "on_bookshelf",     cat: "class", en: "on the bookshelf",        ko: "책꽂이 위에",       emoji: "📚", when: ["book"] },
  { id: "in_umbrellastand", cat: "class", en: "in the umbrella stand",   ko: "우산꽂이 안에",     emoji: "☂️", when: ["shoe","ball"] },
  { id: "on_windowsill",    cat: "class", en: "on the windowsill",       ko: "창틀 위에",         emoji: "🪟", when: ["watch","pencilcase"] },
  { id: "on_shoerack",      cat: "class", en: "on the shoe rack",        ko: "신발장 위에",       emoji: "👟", when: ["shoe","sock"] },

  // 🍂 가을 공원
  { id: "under_tree",     cat: "park", en: "under the tree",        ko: "나무 아래에",       emoji: "🌳", when: ["ball","book"] },
  { id: "on_bench",       cat: "park", en: "on the bench",          ko: "벤치 위에",         emoji: "🪑", when: ["book","watch","pencilcase"] },
  { id: "in_leaves",      cat: "park", en: "in the leaves",         ko: "낙엽 속에",         emoji: "🍂", when: ["ball","watch","sock"] },
  { id: "under_maple",    cat: "park", en: "under the maple tree",  ko: "단풍나무 아래에",   emoji: "🍁", when: ["book","shoe"] },
  { id: "in_sandbox",     cat: "park", en: "in the sandbox",        ko: "모래밭 안에",       emoji: "🏖️", when: ["shoe","ball"] },
  { id: "on_slide",       cat: "park", en: "on the slide",          ko: "미끄럼틀 위에",     emoji: "🛝", when: ["shoe","ball"] },
  { id: "under_swing",    cat: "park", en: "under the swing",       ko: "그네 아래에",       emoji: "🎠", when: ["ball","shoe"] },
  { id: "in_bikebasket",  cat: "park", en: "in the bike basket",    ko: "자전거 바구니 안에", emoji: "🚲", when: ["book","ball"] },
  { id: "on_swing",       cat: "park", en: "on the swing",          ko: "그네 위에",         emoji: "🎠", when: ["sock","book"] },
  { id: "in_pumpkin",     cat: "park", en: "in the pumpkin",        ko: "호박 속에",         emoji: "🎃", when: ["ball"] },
  { id: "in_applebasket", cat: "park", en: "in the apple basket",   ko: "사과 바구니 안에",  emoji: "🍎", when: ["ball"] },
  { id: "under_ginkgo",   cat: "park", en: "under the ginkgo tree", ko: "은행나무 아래에",   emoji: "💛", when: ["book","shoe"] },
];

/* 초급/중급 문장 만들기 (mid 은 데이터에 직접 넣어 두어 README·검사 스크립트에서 바로 볼 수 있게) */
const PLACES = RAW_PLACES.map(p => {
  const c = CATEGORIES.find(x => x.id === p.cat);
  return Object.assign({}, p, {
    say: { en: `It's ${p.en}.`, ko: `그건 ${p.ko} 있어.` },
    mid: { en: `It's ${p.en} ${c.midEn}.`, ko: `그건 ${c.midKo} ${p.ko} 있어.` },
  });
});

/* 단어 뜻 사전 (소문자 키) — 모든 질문·초급·중급 문장의 단어 포함 (check-data.js 로 누락 0 확인) */
const DICT = {
  "where": "어디에", "is": "~이다, ~있다", "my": "나의", "it's": "그것은 ~이다 (it is)",
  "it": "그것", "the": "그 (정해진 것 앞에)", "a": "하나의",
  "on": "~ 위에", "in": "~ 안에", "under": "~ 아래에",
  "ball": "공", "book": "책", "watch": "손목시계", "sock": "양말 (한 짝)",
  "room": "방", "living": "생활하는 → living room 거실", "kitchen": "부엌",
  "classroom": "교실", "park": "공원",
  "bed": "침대", "box": "상자", "bag": "가방", "shelf": "선반", "closet": "옷장",
  "pillow": "베개", "blanket": "이불, 담요", "drawer": "서랍", "toy": "장난감",
  "basket": "바구니", "sofa": "소파", "piano": "피아노", "rug": "깔개, 러그",
  "cushion": "쿠션", "fish": "물고기", "tank": "수조 → fish tank 어항",
  "flowerpot": "화분", "tv": "텔레비전", "lamp": "전등, 스탠드", "floor": "바닥",
  "shoe": "신발", "stairs": "계단", "table": "탁자, 식탁", "fridge": "냉장고",
  "sink": "싱크대, 개수대", "pot": "냄비", "cup": "컵", "plate": "접시",
  "bowl": "그릇", "trash": "쓰레기", "can": "통, 깡통 → trash can 쓰레기통",
  "lunch": "점심", "desk": "책상", "chair": "의자", "locker": "사물함",
  "teacher's": "선생님의", "pencil": "연필", "case": "통, 상자 → pencil case 필통",
  "computer": "컴퓨터", "bookshelf": "책꽂이", "umbrella": "우산",
  "stand": "꽂이, 받침대", "windowsill": "창틀", "rack": "선반, 거치대 → shoe rack 신발장",
  "tree": "나무", "bench": "벤치, 긴 의자", "leaves": "나뭇잎들, 낙엽 (leaf의 복수)",
  "maple": "단풍나무", "sandbox": "모래 놀이터, 모래밭", "slide": "미끄럼틀",
  "swing": "그네", "bike": "자전거", "pumpkin": "호박", "apple": "사과",
  "ginkgo": "은행나무",
};

if (typeof module !== "undefined") module.exports = { SEASON, QUESTIONS, CATEGORIES, PLACES, DICT };
