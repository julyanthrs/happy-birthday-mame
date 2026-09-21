/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EVERYTHING PERSONAL LIVES IN THIS FILE.
 *  Edit the text, swap the photos, change the candle count — you never need to
 *  touch the animation code.
 *
 *  Tips
 *  • Wrap 1–3 words in *asterisks* inside a letter paragraph to give them a
 *    hand-drawn golden underline:  "Thank you for being *the person I can
 *    always come home to*."
 *  • Photos live in  public/assets/memories/  — drop your own files in with the
 *    same names, or change the paths below. Any aspect ratio works.
 *  • Music lives at  public/audio/birthday.mp3  — replace it with your song.
 *  • Add or remove entries in `memories` and `thingsILove.items` freely; the
 *    timeline re-spaces itself.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Memory {
  /** Path under /public. Portrait, landscape and square all work. */
  image: string;
  /** Short handwritten caption on the polaroid. */
  caption: string;
  /** Tiny handwritten date/label under the caption (optional). */
  date?: string;
  /** Screen-reader description of the photo. */
  alt: string;
}

export interface LoveItem {
  title: string;
  description: string;
}

const memories: Memory[] = [
  {
    image: '/assets/memories/memory-01.jpg',
    caption: 'Before all of us.',
    date: 'Throwback',
    alt: 'A younger Mame smiling next to a man in a cap, in front of a bamboo wall',
  },
  {
    image: '/assets/memories/memory-02.jpg',
    caption: 'Always reaching for you.',
    date: 'April 2009',
    alt: 'Mame kneeling on a beach with a toddler reaching toward her',
  },
  {
    image: '/assets/memories/memory-03.jpg',
    caption: 'Our little family.',
    date: 'February 2010',
    alt: 'Mame and a man in a green cap holding a toddler on a porch',
  },
  {
    image: '/assets/memories/memory-04.jpg',
    caption: 'Dressed up just to sit next to you.',
    date: 'Growing up',
    alt: 'Mame and a little girl in a purple dress sitting together on the grass',
  },
  {
    image: '/assets/memories/memory-05.jpg',
    caption: 'Then our family grew.',
    date: 'Family',
    alt: 'Mame holding a smiling baby beside a young girl and a man in a blue cap',
  },
  {
    image: '/assets/memories/memory-06.jpg',
    caption: 'Just the two of us.',
    date: 'Adventure day',
    alt: 'Mame and her daughter smiling behind bright yellow flowers',
  },
  {
    image: '/assets/memories/memory-08.jpg',
    caption: 'The three of us.',
    date: 'Family',
    alt: 'A selfie of three family members sitting together',
  },
  {
    image: '/assets/memories/memory-09.jpg',
    caption: 'Best company, honestly.',
    date: 'Christmas',
    alt: 'Mame smiling next to a fluffy dog in a Christmas-decorated room',
  },
  {
    image: '/assets/memories/memory-10.jpg',
    caption: 'All dressed up, all together.',
    date: 'A special night',
    alt: 'The family of four seated together in front of a pink and lilac flower and balloon backdrop',
  },
  {
    image: '/assets/memories/memory-11.jpg',
    caption: 'Smiling for the camera, together.',
    date: 'September 2025',
    alt: 'The family of four posing in front of a wall of pink and white flowers',
  },
  {
    image: '/assets/memories/memory-12.jpg',
    caption: 'White sand, big smiles.',
    date: 'Beach day',
    alt: 'The family of four in white outfits under a leaning palm tree on the beach',
  },
  {
    image: '/assets/memories/memory-13.jpg',
    caption: 'Caught us laughing.',
    date: 'Beach day',
    alt: 'The family laughing with their hands over their mouths on the beach',
  },
  {
    image: '/assets/memories/memory-14.jpg',
    caption: 'Still holding hands.',
    date: 'Beach day',
    alt: 'Mame holding hands with a man on the beach beside a leaning palm tree',
  },
  {
    image: '/assets/memories/memory-15.jpg',
    caption: 'Wherever the road goes.',
    date: 'Together',
    alt: 'Mame and a man posing on a seaside road with mountains behind them',
  },
  {
    image: '/assets/memories/memory-16.jpg',
    caption: 'Fearless, even next to the horse.',
    date: 'London',
    alt: 'Mame standing in front of a Horse Guard on horseback',
  },
  {
    image: '/assets/memories/memory-17.jpg',
    caption: 'Leaning into the moment.',
    date: 'London',
    alt: 'Mame leaning on a red telephone box with Big Ben behind her',
  },
  {
    image: '/assets/memories/memory-18.jpg',
    caption: 'Golden hour looks good on you.',
    date: 'Windsor',
    alt: 'Mame sitting on a bench with a castle tower and shops behind her',
  },
  {
    image: '/assets/memories/memory-19.jpg',
    caption: 'Coffee, croissants, and that smile.',
    date: 'A slow morning',
    alt: 'Mame at a cafe table with a croissant, orange juice and coffee',
  },
];

const thingsILoveItems: LoveItem[] = [
  { title: 'Your kindness', description: 'You care deeply, even when no one is watching.' },
  { title: 'Your strength', description: 'You somehow make difficult things look possible.' },
  { title: 'Your patience', description: 'You let me find my own way and never made me feel late.' },
  { title: 'Your laugh', description: 'The one that starts before the joke is even finished.' },
  { title: 'The way you care', description: 'In small things: a text, a plate, a jacket handed over at the door.' },
  { title: 'Your advice', description: 'I pretend not to listen. I always do, eventually.' },
  { title: 'Your hugs', description: 'They reset the whole day.' },
  { title: 'Your cooking', description: 'Nothing anywhere tastes like home the way yours does.' },
  { title: 'Your courage', description: 'You keep showing up for people, especially on the hard days.' },
  { title: 'Your love', description: 'You never once made me earn it.' },
];

export const birthdayContent = {
  momName: 'Mame',
  /** Your name — used for the signature at the end. */
  sender: 'Jiane',

  /** Animation & pacing settings. */
  settings: {
    /** How many candles are on the cake (1–14 looks best). */
    candleCount: 7,
    /** 1 = default pacing. 1.4 = 40% more scrolling, 0.8 = a little faster. */
    scrollLength: 0.85,
    musicSrc: '/audio/birthday.mp3',
    musicVolume: 0.55,
  },

  // ── Arrival ────────────────────────────────────────────────────────────────
  introMessage: 'Something special is waiting for you.',
  scrollHint: 'Scroll slowly',
  musicCta: 'Play with music',

  // ── Wish & candles ─────────────────────────────────────────────────────────
  wishIntro: 'Before we continue...',
  wishMessage: 'Make a wish, Mame.',
  readyMessage: 'Ready?',
  blowMessage: 'Blow them out.',
  afterBlowMessage: 'Your wish is safe with me.',

  // ── Envelope ───────────────────────────────────────────────────────────────
  envelope: {
    title: 'For Mame',
    subtitle: 'To the woman who made everything feel like home.',
    hint: 'Open it slowly.',
  },

  // ── Letter ─────────────────────────────────────────────────────────────────
  letterGreeting: 'Happy birthday, Mame!',
  letterParagraphs: [
    'I just want to say thank you for everything. Di ko sya masyado nasasabi, pero sobrang naa-appreciate ko lahat ng ginagawa mo for us and especially for me.',
    'I really admire how strong you are. Ang dami mong kayang harapin and somehow you still manage to keep going and take care of everyone. I dream of becoming like the woman you are someday, to have the same strength, courage, and love that you give to the people around you, to be the kindest, most soft-hearted, and most understanding person.',
    "I know we had our fights and differences dati, and I know that we weren't close especially noong Covid but I thank God everyday for the closeness and relationship we have today. I love you so much. I know na super hirap ko dati and I really gave you a hard time but looking back, I'm very grateful na you were there to guide me. I'm sorry sa mga times where I hurt you or gave you a hard time, and thank you so much dahil never mo akong sinukuan, thank you dahil hindi mo ako pinabayaan, and most of all, thank you for being patient with me and thank you for supporting and believing in me in every dreams and hobbies that I discover.",
    'You were the reason why I got better and why I was able to heal, kaya I want you to know that what ever it may be, I will always be here for you rin. As I grow older, I realize how much lucky I am to have you as a mom, I may not always show it pero I notice and appreciate everything. I hope you know how loved and appreciated you are, not just today but every day. You deserve all the good things in life.',
    "And if I had the chance to live a thousand different lives, in a thousand different universes, I'd choose you as my mamalou every single time.",
    'Happy Birthday mame! I love you so much!',
  ],
  letterBridge: "And somehow, one letter still isn't enough.",

  // ── Memories ───────────────────────────────────────────────────────────────
  memories,
  /** Photos floating in the memory galaxy. Defaults to the memory photos. */
  photos: memories.map((m) => ({ image: m.image, alt: m.alt })),

  // ── Things I love ──────────────────────────────────────────────────────────
  thingsILove: {
    heading: 'Things I love about you.',
    items: thingsILoveItems,
  },

  // ── Memory galaxy ──────────────────────────────────────────────────────────
  galaxyMessage: 'All of it, still glowing.',

  // ── Finale ─────────────────────────────────────────────────────────────────
  finale: {
    headlineTop: 'Happy birthday,',
    headlineName: 'Mame.',
    /** Text the golden particles spell out (uppercase looks best). */
    particleLineOne: 'HAPPY BIRTHDAY',
    particleLineTwo: 'MOM',
  },
  finalMessage: 'Thank you for making life feel like home.',
  loveNote: 'I love you. Always.',
  signOff: 'Love,',
  postScript: 'P.S. I hope your wish comes true.',
  replayLabel: 'Experience it again',
} as const;

export type BirthdayContent = typeof birthdayContent;
