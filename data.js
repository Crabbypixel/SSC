// SSC CGL 2027 — syllabus data
// Plan anchor date: everything ("week N", suggested pace) is computed relative to this.
const START_DATE = new Date(2026, 8, 7); // Mon, 7 Sep 2026 (month is 0-indexed)
const CORE_WEEKS = 22; // core learning window before the plan leans into pure revision/mocks

const GRAMMAR_TOPICS = [
  "Basics", "Pronoun", "Adjective", "Main Verb", "Modals", "Noun",
  "Adverb + Inversion + Present Subjunctive Mood", "Article", "Subject-Verb Agreement",
  "Tense", "Conjunction", "Preposition", "Advance Verb", "Question Tag", "Superfluous",
  "Conditionals", "Voice", "Narration",
];

const VOCAB_TOPICS = [
  "One Word Substitutions", "Idioms & Phrases", "Synonyms & Antonyms",
  "Homonyms & Homophones", "Spelling", "Phrasal Verbs", "Fixed Prepositions",
  "Foreign Words & Phrases (Latin/German/French/Italian)", "Prefixes, Suffixes & Root Words",
  "Root words: Phobia, Mania, Phile, Ism", "Root words: Logy, Graphy, Mancy, Loquy",
  "Root words: Phagy, Culture, Somnia",
];

const MATH_TOPICS = [
  "Number System", "HCF & LCM", "Simplification & Approximation", "Percentage",
  "Ratio & Proportion", "Average", "Profit, Loss & Discount", "Simple & Compound Interest",
  "Time & Work", "Time, Speed & Distance (+ Boats & Streams)", "Mensuration — 2D",
  "Mensuration — 3D", "Algebra", "Trigonometry & Heights/Distances", "Geometry",
  "Statistics & Data Interpretation", "Mixture & Alligation",
];

// Reasoning: sequential module order from the syllabus PDF. `weight` = the PDF's
// "no. of days" effort estimate, used only to size the suggested weekly pace.
const REASONING_TOPICS = [
  { t: "Alphabet Test", w: 4 }, { t: "Coding–Decoding", w: 4 },
  { t: "Number & Letter Series", w: 5 }, { t: "Alphanumeric Series", w: 1 },
  { t: "Analogy & Similarity", w: 4 }, { t: "Classification", w: 3 },
  { t: "Direction Test", w: 3 }, { t: "Blood Relation", w: 5 },
  { t: "Order & Ranking", w: 4 }, { t: "Sitting Arrangement", w: 3 },
  { t: "Puzzle", w: 2 }, { t: "Syllogism", w: 4 }, { t: "Coded Inequalities", w: 2 },
  { t: "Calendar", w: 5 }, { t: "Clock", w: 3 }, { t: "Data Sufficiency", w: 2 },
  { t: "Word Formation", w: 1 }, { t: "Logical Sequence of Words", w: 1 },
  { t: "Mathematical Operations", w: 3 }, { t: "Arithmetical Reasoning", w: 1 },
  { t: "Input Output", w: 4 }, { t: "Character Puzzle (Missing Number)", w: 2 },
  { t: "Courses of Action", w: 1 }, { t: "Statement & Assumptions", w: 1 },
  { t: "Statement & Arguments", w: 1 }, { t: "Cause and Effect", w: 2 },
  { t: "Statement & Conclusions", w: 1 }, { t: "Statement & Inferences", w: 1 },
  { t: "Venn Diagram", w: 2 }, { t: "Counting of Figures", w: 4 }, { t: "Dice", w: 2 },
  { t: "Cube and Cuboid", w: 2 }, { t: "Mirror / Water Image", w: 1 },
  { t: "Paper Cutting & Folding", w: 2 }, { t: "Embedded Figures", w: 1 },
  { t: "Incomplete Figures", w: 1 }, { t: "Non-Verbal Series", w: 1 },
  { t: "Non-Verbal Analogy", w: 1 }, { t: "Non-Verbal Classification", w: 1 },
  { t: "Dot Situations", w: 1 }, { t: "Group of Identical Figures", w: 1 },
  { t: "Image Analysis", w: 1 }, { t: "Matrix", w: 1 },
];

// GS Phase 1 — Math/English/Polity-adjacent core, no science yet.
const GS_PHASE1_SECTIONS = {
  Geography: [
    "Solar System", "Longitude and Latitude", "Earth's Interior and Plate Tectonics",
    "Rocks, Continents and Oceans", "Geomorphology", "Landforms", "Atmosphere",
    "Wind, Ocean Current and Cyclone", "India and its Location", "Himalayas",
    "Peninsular Plateau", "Northern Plains and Islands", "Himalayan River System",
    "Peninsular Rivers", "Dams, Lakes and Waterfalls", "Monsoon", "Forest and Grassland",
    "Soil", "Agriculture", "Minerals", "World Map", "Human Geography", "Transport",
  ],
  "Ancient History": [
    "Stone Age", "Indus Valley Civilization", "Vedic Age", "Sangam Age",
    "Jainism and Buddhism", "Mahajanapadas", "Maurya Dynasty", "Post-Maurya Dynasties",
    "Gupta Dynasty", "Post-Gupta Dynasties", "Tripartite Struggle and Cholas",
  ],
  "Medieval History": [
    "Delhi Sultanate", "Vijayanagara and Bahmani Kingdom", "The Mughal Empire",
    "Marathas", "Bhakti and Sufi Movements",
  ],
  "Modern History": [
    "Advent of Europeans", "Socio-Religious Reforms", "Revolt of 1857",
    "Indian National Congress", "Bengal Partition", "Gandhian Era",
    "Civil Disobedience Movement & Simon Commission", "Quit India Movement",
    "Governor-General and Viceroy",
  ],
  Polity: [
    "Making of the Constitution", "Salient Features of the Constitution", "Preamble",
    "Part 1 and Part 2 of the Constitution", "Fundamental Rights",
    "DPSP and Fundamental Duties", "President and Vice President of India",
    "Prime Minister and Council of Ministers", "Parliament", "State Legislature",
    "Centre-State Relations", "Emergency & Constitutional Amendment",
    "Supreme Court and High Court", "Local Government",
    "Constitutional and Non-Constitutional Bodies", "New Criminal Laws 2023",
    "Important Acts", "Sources of the Indian Constitution", "Noteworthy Points",
  ],
  Economics: [
    "Basics of Economy", "Microeconomics", "National Income", "Budget and Taxation",
    "Inflation and Unemployment", "Banking: Part 1", "Monetary Policy", "Banking: Part 2",
    "Poverty and Balance of Payment", "Five Year Plans and Industrial Policy Resolution",
    "Indices, Reports, International Institutions & Key Economic Concepts",
  ],
};

// GS Phase 2 — unlocked manually once core subjects feel comfortable.
const GS_PHASE2_SECTIONS = {
  Physics: [
    "Motion", "Force and Laws of Motion", "Gravitation and Work Done", "Sound",
    "Reflection and Refraction", "Human Eye and Vision", "Electricity",
    "Magnetic Effect of Electric Current",
  ],
  Chemistry: [
    "Matter", "Atom and its Structure", "Periodic Table", "Chemical Reactions",
    "Metals and Non-Metals", "Acid, Base and Salt", "Carbon and its Compounds",
  ],
  Biology: [
    "Cell", "Plant Tissue and Animal Tissue", "Plant and Animal Kingdom",
    "Nervous System", "Hormones and Plant Movement", "Reproduction",
    "Digestion and Respiration", "Circulatory System and Excretory System", "Diseases",
    "Nutrients", "Heredity and Evolution",
  ],
  Environment: [
    "Basics of Environmental Sciences", "Ecosystem",
    "Trophic Dynamics and Energy Transfer", "Biogeochemical Cycles",
    "Environmental Conventions", "National Parks",
  ],
  "Static GK": [
    "Music and Paintings", "Classical Dance", "Folk Dances of India",
    "Festivals of India", "Census", "Important Days", "Books and Authors", "Sports",
    "International Organisations", "National Organisations", "Awards and Honours",
  ],
};

// Round-robin interleave across sections so GS doesn't grind through one section for weeks.
function interleaveSections(sections) {
  const names = Object.keys(sections);
  const queues = names.map((n) => sections[n].map((title) => ({ title, section: n })));
  const out = [];
  let i = 0;
  let remaining = queues.reduce((s, q) => s + q.length, 0);
  while (remaining > 0) {
    const q = queues[i % names.length];
    if (q.length) {
      out.push(q.shift());
      remaining--;
    }
    i++;
  }
  return out;
}

const GS_PHASE1_TOPICS = interleaveSections(GS_PHASE1_SECTIONS);
const GS_PHASE2_TOPICS = interleaveSections(GS_PHASE2_SECTIONS);

// Which subjects are active on each weekday. 0 = Sunday .. 6 = Saturday.
const WEEKDAY_SUBJECTS = {
  0: { label: "Self Revision", subjects: [] }, // Sunday
  1: { label: "English + Math", subjects: ["grammar", "vocabulary", "math"] },
  2: { label: "Math + Reasoning + GS", subjects: ["math", "reasoning", "gs"] },
  3: { label: "English + Math", subjects: ["grammar", "vocabulary", "math"] },
  4: { label: "Math + Reasoning + GS", subjects: ["math", "reasoning", "gs"] },
  5: { label: "English + Math", subjects: ["grammar", "vocabulary", "math"] },
  6: { label: "Math + Reasoning + GS", subjects: ["math", "reasoning", "gs"] },
};

const SUBJECT_META = {
  grammar: { label: "Grammar", color: "orange" },
  vocabulary: { label: "Vocabulary", color: "yellow" },
  math: { label: "Math", color: "amber" },
  reasoning: { label: "Reasoning", color: "orange" },
  gs: { label: "GS", color: "yellow" },
};
