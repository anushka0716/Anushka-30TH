import type { Question } from '../core/types.js';

/**
 * ROUND 2 — BIG BRAIN HOURS
 * 20 multiple-choice trivia questions. Every answer here is a checkable fact.
 */
export const triviaQuestions: Question[] = [
  // ── Architecture & design ─────────────────────────────────────────────
  {
    id: 't01', round: 'trivia', category: 'Architecture & Design', difficulty: 'hard',
    prompt: 'Jørn Utzon quit the Sydney Opera House project and never saw it finished. In what year did he resign?',
    options: [
      { id: 'a', text: '1957' },
      { id: 'b', text: '1963' },
      { id: 'c', text: '1966' },
      { id: 'd', text: '1973' },
    ],
    correctId: 'c',
    explanation: '1966, after a bitter fight over costs and payments. The building opened in 1973 without him — the ultimate “we’ll take it from here”.',
  },
  {
    id: 't02', round: 'trivia', category: 'Architecture & Design', difficulty: 'medium',
    prompt: 'In 1919 Walter Gropius founded the Bauhaus. In which city did it open?',
    options: [
      { id: 'a', text: 'Berlin' },
      { id: 'b', text: 'Weimar' },
      { id: 'c', text: 'Dessau' },
      { id: 'd', text: 'Munich' },
    ],
    correctId: 'b',
    explanation: 'Weimar. It moved to Dessau in 1925 and Berlin in 1932 before closing in 1933. Very nomadic for a school obsessed with grids.',
  },
  {
    id: 't03', round: 'trivia', category: 'Architecture & Design', difficulty: 'hard',
    prompt: 'Mies van der Rohe gave us “Less is more.” Which architect clapped back with “Less is a bore”?',
    options: [
      { id: 'a', text: 'Philip Johnson' },
      { id: 'b', text: 'Frank Gehry' },
      { id: 'c', text: 'Michael Graves' },
      { id: 'd', text: 'Robert Venturi' },
    ],
    correctId: 'd',
    explanation: 'Robert Venturi, in his 1966 book Complexity and Contradiction in Architecture — basically the founding subtweet of postmodernism.',
  },
  {
    id: 't04', round: 'trivia', category: 'Architecture & Design', difficulty: 'hard',
    prompt: 'Which of these is NOT one of Le Corbusier’s “Five Points of Architecture”?',
    options: [
      { id: 'a', text: 'Pilotis (raising the building on columns)' },
      { id: 'b', text: 'The roof garden' },
      { id: 'c', text: 'Exposed raw concrete (béton brut)' },
      { id: 'd', text: 'The horizontal ribbon window' },
    ],
    correctId: 'c',
    explanation: 'Béton brut. The five are pilotis, the free plan, the free façade, the ribbon window and the roof garden. Raw concrete came later and gave us Brutalism.',
  },
  {
    id: 't05', round: 'trivia', category: 'Architecture & Design', difficulty: 'hard',
    prompt: 'Helvetica was released in 1957 under a different name. What was it?',
    options: [
      { id: 'a', text: 'Neue Haas Grotesk' },
      { id: 'b', text: 'Akzidenz-Grotesk' },
      { id: 'c', text: 'Univers' },
      { id: 'd', text: 'Swiss Grotesk' },
    ],
    correctId: 'a',
    explanation: 'Neue Haas Grotesk. It was renamed Helvetica (“Swiss”, in Latin-ish) in 1960 to sell better abroad. Rebranding: it works.',
  },
  {
    id: 't06', round: 'trivia', category: 'Architecture & Design', difficulty: 'hard',
    prompt: 'In 2016 Pantone picked TWO colours of the year for the first time. Which pair?',
    options: [
      { id: 'a', text: 'Living Coral & Ultra Violet' },
      { id: 'b', text: 'Rose Quartz & Serenity' },
      { id: 'c', text: 'Illuminating & Ultimate Gray' },
      { id: 'd', text: 'Marsala & Greenery' },
    ],
    correctId: 'b',
    explanation: 'Rose Quartz and Serenity — the pastel pink and baby blue that launched a thousand millennial-pink brand identities.',
  },

  // ── Film & TV ─────────────────────────────────────────────────────────
  {
    id: 't07', round: 'trivia', category: 'Film & TV', difficulty: 'hard',
    prompt: 'Titanic (1997) was nominated for 14 Academy Awards. How many did it actually win?',
    options: [
      { id: 'a', text: '9' },
      { id: 'b', text: '11' },
      { id: 'c', text: '12' },
      { id: 'd', text: '14' },
    ],
    correctId: 'b',
    explanation: 'Eleven, tying the record with Ben-Hur and The Return of the King. There was room on that door for more trophies, honestly.',
  },
  {
    id: 't08', round: 'trivia', category: 'Film & TV', difficulty: 'medium',
    prompt: 'Clueless (1995) is a loose modern retelling of which Jane Austen novel?',
    options: [
      { id: 'a', text: 'Pride and Prejudice' },
      { id: 'b', text: 'Persuasion' },
      { id: 'c', text: 'Emma' },
      { id: 'd', text: 'Sense and Sensibility' },
    ],
    correctId: 'c',
    explanation: 'Emma. A rich, well-meaning matchmaker meddles in everyone’s love lives. As if.',
  },
  {
    id: 't09', round: 'trivia', category: 'Film & TV', difficulty: 'easy',
    prompt: 'In Friends, what is the name of Joey’s beloved stuffed penguin?',
    options: [
      { id: 'a', text: 'Waddles' },
      { id: 'b', text: 'Pengy' },
      { id: 'c', text: 'Mr. Flippers' },
      { id: 'd', text: 'Hugsy' },
    ],
    correctId: 'd',
    explanation: 'Hugsy, his “bedtime penguin pal”. Joey doesn’t share food, and he definitely doesn’t share Hugsy.',
  },

  // ── Music ─────────────────────────────────────────────────────────────
  {
    id: 't10', round: 'trivia', category: 'Music', difficulty: 'hard',
    prompt: 'OutKast’s “Hey Ya!” appears on which half of their 2003 double album?',
    options: [
      { id: 'a', text: 'The Love Below' },
      { id: 'b', text: 'Speakerboxxx' },
      { id: 'c', text: 'Stankonia' },
      { id: 'd', text: 'Aquemini' },
    ],
    correctId: 'a',
    explanation: 'The Love Below, André 3000’s half. Speakerboxxx was Big Boi’s; the other two are earlier albums entirely.',
  },
  {
    id: 't11', round: 'trivia', category: 'Music', difficulty: 'medium',
    prompt: 'Which band released “Pablo Honey” as their debut album in 1993?',
    options: [
      { id: 'a', text: 'Blur' },
      { id: 'b', text: 'Radiohead' },
      { id: 'c', text: 'Oasis' },
      { id: 'd', text: 'Pulp' },
    ],
    correctId: 'b',
    explanation: 'Radiohead. It’s the album with “Creep” on it — the song they spent the next decade trying to escape.',
  },

  // ── Internet culture ──────────────────────────────────────────────────
  {
    id: 't12', round: 'trivia', category: 'Internet Culture', difficulty: 'medium',
    prompt: 'What is the title of the very first video uploaded to YouTube, in April 2005?',
    options: [
      { id: 'a', text: 'Charlie Bit My Finger' },
      { id: 'b', text: 'Evolution of Dance' },
      { id: 'c', text: 'Me at the zoo' },
      { id: 'd', text: 'Lazy Sunday' },
    ],
    correctId: 'c',
    explanation: '“Me at the zoo” — 19 seconds of co-founder Jawed Karim in front of some elephants. Humble beginnings.',
  },
  {
    id: 't13', round: 'trivia', category: 'Internet Culture', difficulty: 'easy',
    prompt: 'On MySpace, who was automatically everyone’s first friend?',
    options: [
      { id: 'a', text: 'Tom' },
      { id: 'b', text: 'Mark' },
      { id: 'c', text: 'Kevin' },
      { id: 'd', text: 'Jack' },
    ],
    correctId: 'a',
    explanation: 'Tom (Anderson), co-founder and the internet’s most loyal friend. He sold up, left, and now mostly takes travel photos.',
  },
  {
    id: 't14', round: 'trivia', category: 'Internet Culture', difficulty: 'hard',
    prompt: 'Which word was Oxford University Press’s Word of the Year for 2023?',
    options: [
      { id: 'a', text: 'Goblin mode' },
      { id: 'b', text: 'Brain rot' },
      { id: 'c', text: 'Delulu' },
      { id: 'd', text: 'Rizz' },
    ],
    correctId: 'd',
    explanation: 'Rizz (charm, charisma). Goblin mode won in 2022 and brain rot in 2024. Linguistics is thriving.',
  },
  {
    id: 't15', round: 'trivia', category: 'Internet Culture', difficulty: 'hard',
    prompt: 'When it launched in 2006, Twitter was called what?',
    options: [
      { id: 'a', text: 'Tweetr' },
      { id: 'b', text: 'twttr' },
      { id: 'c', text: 'Squawkr' },
      { id: 'd', text: 'Chirp' },
    ],
    correctId: 'b',
    explanation: 'twttr — no vowels, peak 2006 startup energy. It bought the vowels later.',
  },

  // ── General knowledge & things that sound made up ─────────────────────
  {
    id: 't16', round: 'trivia', category: 'General Knowledge', difficulty: 'hard',
    prompt: 'Which letter does not appear in the name of any US state?',
    options: [
      { id: 'a', text: 'J' },
      { id: 'b', text: 'Z' },
      { id: 'c', text: 'X' },
      { id: 'd', text: 'Q' },
    ],
    correctId: 'd',
    explanation: 'Q. New Jersey has the J, Arizona the Z, and Texas and New Mexico the X.',
  },
  {
    id: 't17', round: 'trivia', category: 'General Knowledge', difficulty: 'hard',
    prompt: 'Counting overseas territories, which country spans the most time zones?',
    options: [
      { id: 'a', text: 'Russia' },
      { id: 'b', text: 'United States' },
      { id: 'c', text: 'France' },
      { id: 'd', text: 'United Kingdom' },
    ],
    correctId: 'c',
    explanation: 'France, with 12 — thanks to places like French Polynesia, Réunion and New Caledonia. Russia has 11.',
  },
  {
    id: 't18', round: 'trivia', category: 'General Knowledge', difficulty: 'medium',
    prompt: 'What is a group of flamingos called?',
    options: [
      { id: 'a', text: 'A flamboyance' },
      { id: 'b', text: 'A parliament' },
      { id: 'c', text: 'A murder' },
      { id: 'd', text: 'A congregation' },
    ],
    correctId: 'a',
    explanation: 'A flamboyance. Parliament is owls, murder is crows. Flamingos simply refused anything less dramatic.',
  },
  {
    id: 't19', round: 'trivia', category: 'Art', difficulty: 'hard',
    prompt: 'When the Mona Lisa was stolen from the Louvre in 1911, who actually took it?',
    options: [
      { id: 'a', text: 'Pablo Picasso' },
      { id: 'b', text: 'Vincenzo Peruggia' },
      { id: 'c', text: 'Guillaume Apollinaire' },
      { id: 'd', text: 'Marcel Duchamp' },
    ],
    correctId: 'b',
    explanation: 'Vincenzo Peruggia, a former Louvre handyman who walked out with it under his smock. Apollinaire was arrested and Picasso questioned — both innocent.',
  },
  {
    id: 't20', round: 'trivia', category: 'General Knowledge', difficulty: 'hard',
    prompt: 'Botanically speaking, which of these is a true berry?',
    options: [
      { id: 'a', text: 'Strawberry' },
      { id: 'b', text: 'Raspberry' },
      { id: 'c', text: 'Blackberry' },
      { id: 'd', text: 'Banana' },
    ],
    correctId: 'd',
    explanation: 'The banana. Strawberries, raspberries and blackberries aren’t true berries at all. Botany has no respect for names.',
  },
];
