// SSC CGL 2027 — core config + English, Math and Reasoning syllabus
// Every topic carries its own subtopic breakdown so the Today view can show
// exactly what to cover. Topic order follows the source books/PDFs.

// Plan rebased on resuming after a break. Week 1 is the week of Mon 16 Nov 2026; the
// timetable schedules only what was still outstanding at that point (see RESUME_THROUGH).
const START_DATE = new Date(2026, 10, 16); // Mon, 16 Nov 2026 (month is 0-indexed)
const SCIENCE_START_WEEK = 9; // science enters the planner after roughly two months
const GS_CHAPTERS_PER_WEEK = 2; // GS pace: at most this many chapters a week, one subject at a time

// Work already finished when the plan resumed, given as the last topic completed in each
// subject ("through" = that topic included). Everything after it gets scheduled afresh.
// Subjects not listed had nothing done.
const RESUME_THROUGH = {
  grammar: "Pronoun",
  reasoning: "Analogy & Similarity",
  gs: "Rocks, Continents and Oceans",
};

const GRAMMAR_TOPICS = [
  { t: "Basics", s: ["Parts of speech overview", "Subject, predicate & sentence structure", "Phrase vs clause", "Common error-spotting patterns"] },
  { t: "Pronoun", s: ["Types: personal, reflexive, relative, indefinite", "Case — nominative vs objective", "Pronoun–antecedent agreement", "Frequent SSC pronoun errors"] },
  { t: "Adjective", s: ["Kinds & order of adjectives", "Degrees of comparison", "Comparative/superlative errors", "Adjective vs adverb usage"] },
  { t: "Main Verb", s: ["Transitive vs intransitive", "Finite vs non-finite verbs", "V1/V2/V3 forms", "Common verb-form errors"] },
  { t: "Modals", s: ["Can/could, may/might, shall/should", "Must, ought to, need, dare", "Semi-modals & 'used to'", "Modal + perfect infinitive"] },
  { t: "Noun", s: ["Kinds of nouns", "Number & gender rules", "Countable vs uncountable", "Possessive case & apposition"] },
  { t: "Adverb + Inversion + Present Subjunctive Mood", s: ["Types & position of adverbs", "Inversion after negative adverbials", "Mandative subjunctive forms", "Common inversion traps"] },
  { t: "Article", s: ["A / an / the rules", "Zero article cases", "Articles with proper nouns & superlatives", "Omission & wrong-insertion errors"] },
  { t: "Subject-Verb Agreement", s: ["Basic concord rules", "Collective & compound subjects", "Either/or, neither/nor, each/every", "Distance, money & quantity nouns"] },
  { t: "Tense", s: ["The twelve tense forms", "Sequence of tenses", "Time markers & tense signals", "Common tense-shift errors"] },
  { t: "Conjunction", s: ["Coordinating vs subordinating", "Correlative conjunctions", "Conjunction pairs & parallelism", "Frequently misused conjunctions"] },
  { t: "Preposition", s: ["Prepositions of time, place & direction", "Appropriate prepositions with verbs/adjectives", "Prepositional phrases", "Omission & repetition errors"] },
  { t: "Advance Verb", s: ["Causative verbs", "Gerund vs infinitive", "Participles & dangling modifiers", "Verb + preposition patterns"] },
  { t: "Question Tag", s: ["Basic tag formation", "Tags with modals & imperatives", "Special cases: let's, there is, I am", "Sentences with negative words"] },
  { t: "Superfluous", s: ["Redundant words & pleonasm", "Double comparatives & double negatives", "Unnecessary prepositions", "PYQ superfluous patterns"] },
  { t: "Conditionals", s: ["Zero & first conditional", "Second & third conditional", "Mixed conditionals", "Unless, in case, provided that"] },
  { t: "Voice", s: ["Active–passive rules by tense", "Passive of imperatives & modals", "Passive with two objects", "Voice in questions"] },
  { t: "Narration", s: ["Direct–indirect basic rules", "Change of tense, pronoun & time words", "Reporting questions, commands, exclamations", "Mixed narration"] },
];

const VOCAB_TOPICS = [
  { t: "One Word Substitutions", s: ["Top 200 most-repeated OWS", "SSC PYQ-based OWS set", "OWS from other competitive exams", "Self-test & revision"] },
  { t: "Idioms & Phrases", s: ["Top 200 repeated idioms", "SSC PYQ idioms/phrases", "Idioms from other exams", "Contextual usage practice"] },
  { t: "Synonyms & Antonyms", s: ["Common SSC synonym–antonym list", "Top 100 repeated synonyms", "Top 100 repeated antonyms", "PYQ practice set"] },
  { t: "Homonyms & Homophones", s: ["Confusing word pairs", "Spelling-sound traps", "PYQ practice questions"] },
  { t: "Spelling", s: ["Top 200 repeated spelling questions", "Common misspelling rules", "PYQ spelling practice"] },
  { t: "Phrasal Verbs", s: ["High-frequency phrasal verbs", "Verb + particle meaning shifts", "The Hindu phrasal verbs", "PYQ practice"] },
  { t: "Fixed Prepositions", s: ["Verb + preposition", "Adjective + preposition", "Noun + preposition", "PYQ practice"] },
  { t: "Foreign Words & Phrases (Latin/German/French/Italian)", s: ["Latin phrases", "French phrases", "German & Italian terms", "Usage in sentences"] },
  { t: "Prefixes, Suffixes & Root Words", s: ["Common prefixes", "Common suffixes", "Important root words", "Word-building practice"] },
  { t: "Root words: Phobia, Mania, Phile, Ism", s: ["-phobia word list", "-mania word list", "-phile word list", "-ism word list"] },
  { t: "Root words: Logy, Graphy, Mancy, Loquy", s: ["-logy word list", "-graphy word list", "-mancy word list", "-loquy word list"] },
  { t: "Root words: Phagy, Culture, Somnia", s: ["-phagy word list", "-culture word list", "-somnia word list", "Mixed root revision"] },
];

const MATH_TOPICS = [
  { t: "Number System", s: ["Divisibility rules", "Remainder theorems", "Unit digit & cyclicity", "Factors, factorials & trailing zeros"] },
  { t: "HCF & LCM", s: ["HCF/LCM of numbers & fractions", "Word problems: bells, tiles, ropes", "Remainder-based problems"] },
  { t: "Simplification & Approximation", s: ["BODMAS & surds", "Fractions & decimals", "Algebraic simplification", "Speed techniques"] },
  { t: "Percentage", s: ["Fraction–percentage conversions", "Successive percentage change", "Population, income & exam problems", "Application-based questions"] },
  { t: "Ratio & Proportion", s: ["Ratio basics & compounding", "Proportion, mean & continued proportion", "Partnership", "Age problems"] },
  { t: "Average", s: ["Basic & weighted average", "Average of series", "Replacement & change in average", "Application problems"] },
  { t: "Profit, Loss & Discount", s: ["CP, SP & MP relationships", "Successive discounts", "Dishonest dealer & false weights", "Marked price problems"] },
  { t: "Simple & Compound Interest", s: ["SI formulas & applications", "CI: annual, half-yearly, quarterly", "SI vs CI difference", "Installments"] },
  { t: "Time & Work", s: ["Efficiency & LCM method", "Pipes and cisterns", "Wages & work sharing", "Alternate-day work"] },
  { t: "Time, Speed & Distance (+ Boats & Streams)", s: ["Basics & unit conversion", "Relative speed", "Trains", "Boats & streams"] },
  { t: "Mensuration — 2D", s: ["Triangles & quadrilaterals", "Polygons", "Circle, sector & segment", "Combined & shaded figures"] },
  { t: "Mensuration — 3D", s: ["Cube, cuboid & cylinder", "Cone, sphere & hemisphere", "Prism, pyramid & frustum", "Melting & recasting"] },
  { t: "Algebra", s: ["Basic identities", "Componendo–dividendo & substitution", "Quadratic equations & roots", "Maxima–minima type problems"] },
  { t: "Trigonometry & Heights/Distances", s: ["Ratios & identities", "Complementary angles & standard values", "Maximum–minimum of expressions", "Heights & distances"] },
  { t: "Geometry", s: ["Lines, angles & triangles", "Congruence & similarity", "Circles, chords & tangents", "Centres: centroid, incentre, circumcentre"] },
  { t: "Statistics & Data Interpretation", s: ["Mean, median & mode", "Bar, pie, line & table DI", "Mixed & caselet DI", "Speed-solving practice"] },
  { t: "Mixture & Alligation", s: ["Alligation rule", "Replacement of mixture", "Multiple mixtures", "Mixed with profit & percentage"] },
];

// Reasoning: module order from the syllabus PDF. `w` = the PDF's day estimate,
// used to size the suggested weekly pace. Subtopics are the PDF's own lecture/exercise units.
const REASONING_TOPICS = [
  { t: "Alphabet Test", w: 4, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2(a)", "Exercise 2(b)", "Brainstorming", "QRP revision & notes"] },
  { t: "Coding–Decoding", w: 4, s: ["Concept Lecture 1", "Exercise 1", "Exercise 2", "Concept Lecture 2", "Exercise 3", "Advance Level", "QRP revision & notes"] },
  { t: "Number & Letter Series", w: 5, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Exercise 3", "Concept Lecture 3", "Exercise 4", "Exercise 5", "QRP revision & notes"] },
  { t: "Alphanumeric Series", w: 1, s: ["Concept Lecture 1", "Exercise 1"] },
  { t: "Analogy & Similarity", w: 4, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Concept Lecture 3", "Concept Lecture 4", "Exercise 5", "Exercise 6"] },
  { t: "Classification", w: 3, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Concept Lecture 3"] },
  { t: "Direction Test", w: 3, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Exercise 3"] },
  { t: "Blood Relation", w: 5, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Concept Lecture 3", "Concept Lecture 4", "Exercise 3", "Exercise 4", "QRP revision & notes"] },
  { t: "Order & Ranking", w: 4, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Concept Lecture 3", "Exercise 3", "QRP revision & notes"] },
  { t: "Sitting Arrangement", w: 3, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Exercise 3", "Exercise 4"] },
  { t: "Puzzle", w: 2, s: ["Concept Lecture 1", "Exercise 1", "Exercise 2"] },
  { t: "Syllogism", w: 4, s: ["Concept Lecture 1", "Concept Lecture 2", "Exercise 1", "Exercise 2", "Concept Lecture 3", "Exercise 3", "Concept Lecture 4", "Concept Lecture 5"] },
  { t: "Coded Inequalities", w: 2, s: ["Concept Lecture 1", "Exercise 1", "Exercise 2"] },
  { t: "Calendar", w: 5, s: ["Concept Lecture 1", "Concept Lecture 2", "Concept Lecture 3", "Concept Lecture 4", "Concept Lecture 5", "Exercise 1", "Exercise 2", "QRP revision & notes"] },
  { t: "Clock", w: 3, s: ["Concept Lecture 1", "Concept Lecture 2", "Concept Lecture 3", "Exercise 1", "QRP revision & notes"] },
  { t: "Data Sufficiency", w: 2, s: ["Concept Lecture 1", "Exercise 1", "Exercise 2"] },
  { t: "Word Formation", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Logical Sequence of Words", w: 1, s: ["Concept Lecture 1"] },
  { t: "Mathematical Operations", w: 3, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2", "Exercise 2", "Concept Lecture 3"] },
  { t: "Arithmetical Reasoning", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Input Output", w: 4, s: ["Concept Lecture 1", "Concept Lecture 2", "Exercise 1", "Concept Lecture 3", "Exercise 2", "Exercise 3", "Exercise 4"] },
  { t: "Character Puzzle (Missing Number)", w: 2, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Courses of Action", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Statement & Assumptions", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Statement & Arguments", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Cause and Effect", w: 2, s: ["Concept Lecture 1", "Concept Lecture 2", "Exercise 1"] },
  { t: "Statement & Conclusions", w: 1, s: ["Concept Lecture 1", "Exercise 1"] },
  { t: "Statement & Inferences", w: 1, s: ["Concept Lecture 1"] },
  { t: "Venn Diagram", w: 2, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2"] },
  { t: "Counting of Figures", w: 4, s: ["Concept Lecture 1", "Concept Lecture 2", "Concept Lecture 3", "Exercise 1", "Concept Lecture 4", "Concept Lecture 5", "Exercise 2", "Exercise 3"] },
  { t: "Dice", w: 2, s: ["Concept Lecture 1", "Exercise 1", "Concept Lecture 2"] },
  { t: "Cube and Cuboid", w: 2, s: ["Concept Lecture 1", "Concept Lecture 2", "Exercise 1", "Exercise 2"] },
  { t: "Mirror / Water Image", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Paper Cutting & Folding", w: 2, s: ["Concept Lecture 1", "Concept Lecture 2", "Concept Lecture 3"] },
  { t: "Embedded Figures", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Incomplete Figures", w: 1, s: ["Concept Lecture 1", "Concept Lecture 2"] },
  { t: "Non-Verbal Series", w: 1, s: ["Concept Lecture 1", "Exercise 1"] },
  { t: "Non-Verbal Analogy", w: 1, s: ["Concept Lecture 1"] },
  { t: "Non-Verbal Classification", w: 1, s: ["Concept Lecture 1"] },
  { t: "Dot Situations", w: 1, s: ["Concept Lecture 1"] },
  { t: "Group of Identical Figures", w: 1, s: ["Concept Lecture 1"] },
  { t: "Image Analysis", w: 1, s: ["Concept Lecture 1"] },
  { t: "Matrix", w: 1, s: ["Concept Lecture 1"] },
];

// Which subjects run on each weekday. 0 = Sunday .. 6 = Saturday.
// Science joins the Tue/Thu/Sat slot once it is unlocked (see SCIENCE_DAYS).
const WEEKDAY_SUBJECTS = {
  0: { label: "Self Revision", subjects: [] },
  1: { label: "English + Math", subjects: ["grammar", "vocabulary", "math"] },
  2: { label: "Math + Reasoning + GS", subjects: ["math", "reasoning", "gs"] },
  3: { label: "English + Math", subjects: ["grammar", "vocabulary", "math"] },
  4: { label: "Math + Reasoning + GS", subjects: ["math", "reasoning", "gs"] },
  5: { label: "English + Math", subjects: ["grammar", "vocabulary", "math"] },
  6: { label: "Math + Reasoning + GS", subjects: ["math", "reasoning", "gs"] },
};
const SCIENCE_DAYS = [2, 4, 6];

const SUBJECT_META = {
  grammar: { label: "Grammar", color: "orange" },
  vocabulary: { label: "Vocabulary", color: "yellow" },
  math: { label: "Math", color: "amber" },
  reasoning: { label: "Reasoning", color: "orange" },
  gs: { label: "GS", color: "yellow" },
  science: { label: "Science", color: "amber" },
};
const SUBJECT_ORDER = ["grammar", "vocabulary", "math", "reasoning", "gs", "science"];
