// 주인공 이름 생성기용 태그 인터페이스 및 데이터

export interface Tag {
  id: string;        // 내부용 키 (영문 슬러그)
  short_ko: string;  // UI 칩 표시용 (한국어)
  short_en: string;  // UI 칩 표시용 (영어)
  full_ko: string;   // 프롬프트 전달용 상세 설명 (한국어)
  full_en: string;   // 프롬프트 전달용 상세 설명 (영어)
}

// 성격(Personality) 태그 15개
export const PERSONALITY_TAGS: Tag[] = [
  {
    id: "warm",
    short_ko: "다정함",
    short_en: "Warm",
    full_ko: "다정하고 따뜻한 성격",
    full_en: "Warm and kind-hearted personality",
  },
  {
    id: "cold",
    short_ko: "냉철함",
    short_en: "Cold",
    full_ko: "냉정하고 이성적인 성격",
    full_en: "Cold and rational personality",
  },
  {
    id: "quiet",
    short_ko: "조용함",
    short_en: "Quiet",
    full_ko: "내향적이고 말이 적은 성격",
    full_en: "Quiet and introverted personality",
  },
  {
    id: "bright",
    short_ko: "발랄함",
    short_en: "Bright",
    full_ko: "명랑하고 밝은 성격",
    full_en: "Cheerful and bright personality",
  },
  {
    id: "tsundere",
    short_ko: "츤데레",
    short_en: "Tsundere",
    full_ko: "겉은 차갑지만 속은 따뜻한 성격",
    full_en: "Cold on the outside but warm inside (tsundere)",
  },
  {
    id: "smart",
    short_ko: "뇌섹형",
    short_en: "Smart",
    full_ko: "지적이고 분석적인 성향",
    full_en: "Smart, intellectual and analytical personality",
  },
  {
    id: "charisma",
    short_ko: "카리스마",
    short_en: "Charisma",
    full_ko: "존재감과 리더십이 강한 성격",
    full_en: "Charismatic with strong presence and leadership",
  },
  {
    id: "mysterious",
    short_ko: "신비로움",
    short_en: "Mysterious",
    full_ko: "속내를 알 수 없는 신비로운 분위기",
    full_en: "Mysterious and hard-to-read personality",
  },
  {
    id: "strong_willed",
    short_ko: "강단있음",
    short_en: "Strong",
    full_ko: "강인하고 쉽게 흔들리지 않는 성격",
    full_en: "Strong-willed and mentally tough personality",
  },
  {
    id: "aloof",
    short_ko: "냉담함",
    short_en: "Aloof",
    full_ko: "타인과 거리를 두고 정이 없어 보이는 성향",
    full_en: "Aloof, emotionally distant personality",
  },
  {
    id: "sarcastic",
    short_ko: "빈정거림",
    short_en: "Sharp",
    full_ko: "비꼬거나 날카롭게 말하는 성격",
    full_en: "Sarcastic, sharp-tongued personality",
  },
  {
    id: "gentle",
    short_ko: "온화함",
    short_en: "Gentle",
    full_ko: "부드럽고 침착한 성격",
    full_en: "Gentle and calm personality",
  },
  {
    id: "wild",
    short_ko: "야성적",
    short_en: "Wild",
    full_ko: "자유롭고 본능적으로 움직이는 성향",
    full_en: "Wild, instinct-driven personality",
  },
  {
    id: "obsessive",
    short_ko: "집착형",
    short_en: "Obsessive",
    full_ko: "한 번 대상에 집착하면 깊게 파고드는 성향",
    full_en: "Obsessive and deeply attached personality",
  },
  {
    id: "optimistic",
    short_ko: "낙관적",
    short_en: "Optimistic",
    full_ko: "긍정적이고 희망을 잃지 않는 성격",
    full_en: "Optimistic and hopeful personality",
  },
];

// 특징(Trait) 태그 15개
export const TRAIT_TAGS: Tag[] = [
  {
    id: "noble",
    short_ko: "귀족",
    short_en: "Noble",
    full_ko: "귀족 또는 왕족 혈통을 가진 인물",
    full_en: "Noble or royal bloodline",
  },
  {
    id: "genius",
    short_ko: "천재",
    short_en: "Genius",
    full_ko: "타고난 재능을 지닌 천재형 인물",
    full_en: "Innately gifted, genius-level talent",
  },
  {
    id: "mage",
    short_ko: "마법사",
    short_en: "Mage",
    full_ko: "마탑이나 마법을 연구하는 마법사",
    full_en: "Mage or arcane magic user",
  },
  {
    id: "healer",
    short_ko: "치유자",
    short_en: "Healer",
    full_ko: "치유 능력을 가진 인물",
    full_en: "Healer with restorative powers",
  },
  {
    id: "warrior",
    short_ko: "전사",
    short_en: "Warrior",
    full_ko: "전투에 능한 전사 혹은 용병",
    full_en: "Warrior or mercenary skilled in combat",
  },
  {
    id: "regressor",
    short_ko: "회귀자",
    short_en: "Regressor",
    full_ko: "회귀나 빙의를 경험한 인물",
    full_en: "Regressor or possessed character",
  },
  {
    id: "transcendent",
    short_ko: "초월자",
    short_en: "Ascendant",
    full_ko: "차원이나 한계를 초월한 존재",
    full_en: "Transcendent being beyond normal limits",
  },
  {
    id: "mixedblood",
    short_ko: "혼혈",
    short_en: "Hybrid",
    full_ko: "혼혈 또는 이종족 혈통을 지닌 인물",
    full_en: "Mixed-blood or hybrid lineage",
  },
  {
    id: "cursed",
    short_ko: "저주받음",
    short_en: "Cursed",
    full_ko: "강력한 저주나 봉인을 안고 있는 인물",
    full_en: "Cursed or sealed being",
  },
  {
    id: "scholar",
    short_ko: "학자",
    short_en: "Scholar",
    full_ko: "연구와 지식을 중시하는 학자형 인물",
    full_en: "Scholar or researcher focused on knowledge",
  },
  {
    id: "assassin",
    short_ko: "암살자",
    short_en: "Assassin",
    full_ko: "은밀하게 움직이는 암살자",
    full_en: "Stealthy assassin",
  },
  {
    id: "beastkin",
    short_ko: "수인",
    short_en: "Beastkin",
    full_ko: "짐승의 피를 이어받은 수인",
    full_en: "Beastkin or half-beast race",
  },
  {
    id: "oracle",
    short_ko: "예언자",
    short_en: "Oracle",
    full_ko: "예언과 계시를 받는 예언자",
    full_en: "Prophetic oracle who receives visions",
  },
  {
    id: "guardian",
    short_ko: "수호자",
    short_en: "Guardian",
    full_ko: "누군가를 지키는 역할의 수호자",
    full_en: "Guardian who protects someone or something",
  },
  {
    id: "shadowborn",
    short_ko: "그림자출신",
    short_en: "Shadow",
    full_ko: "그림자나 어둠 속에서 태어난 존재",
    full_en: "Born of shadows or darkness",
  },
];

// 세계관(World) 태그 5개
export const WORLD_TAGS: Tag[] = [
  {
    id: "western_fantasy",
    short_ko: "서양판타지",
    short_en: "Fantasy",
    full_ko: "서양식 왕국, 마법, 엘프 등이 존재하는 판타지 세계관",
    full_en: "Western fantasy with kingdoms, magic, elves",
  },
  {
    id: "norse",
    short_ko: "북유럽",
    short_en: "Norse",
    full_ko: "북유럽 신화 기반 세계관",
    full_en: "Norse-inspired world with warriors, runes and gods",
  },
  {
    id: "greek",
    short_ko: "그리스로마",
    short_en: "Mythic",
    full_ko: "그리스·로마 신화 기반 세계관",
    full_en: "Greek/Roman mythic world",
  },
  {
    id: "medieval",
    short_ko: "중세왕국",
    short_en: "Medieval",
    full_ko: "중세 기사단과 왕국이 중심이 되는 세계관",
    full_en: "Medieval world of knights and kingdoms",
  },
  {
    id: "steampunk",
    short_ko: "스팀펑크",
    short_en: "Steampunk",
    full_ko: "기계와 마법이 융합된 스팀펑크 세계관",
    full_en: "Steampunk / magitech world",
  },
];

