# A birthday gift, one long scroll

A cinematic, scroll-driven 3D birthday website. One continuous scene, reversible in both directions:
a light in the dark → the cake → candles → a wish → blowing them out → an envelope → a letter →
photographs → things you love about her → a galaxy of memories → petals → a particle-text finale →
the cake again, with a P.S.

**Stack:** React 18 · TypeScript (strict) · Tailwind · Three.js + React Three Fiber + drei ·
GSAP ScrollTrigger · Lenis · postprocessing (bloom). Framer Motion is installed but unused; remove it if you like.

## Make it yours (no animation code needed)

Everything personal is in **`src/data/birthdayContent.ts`**:

| To change | Edit |
| --- | --- |
| Her name, your name (the signature) | `momName`, `sender` (**`[YOUR NAME]` is a placeholder**) |
| The letter | `letterParagraphs`. Wrap 1–3 words in `*asterisks*` for a hand-drawn gold underline |
| Photos and captions | `memories`, and drop files into `public/assets/memories/` |
| The list of things you love | `thingsILove.items` (add or remove freely; the timeline re-spaces itself) |
| Number of candles | `settings.candleCount` (1–14 looks best) |
| Overall pace | `settings.scrollLength` (1.4 = 40% more scrolling) |
| Music | replace `public/audio/birthday.mp3` |

> **Please rewrite the sample text.** The letter and the "things I love" lines are placeholders that mention
> specifics (a kitchen, a table, cooking, a jacket at the door). Keep only what is true for your mom.
> The six photos are generated placeholders and the music is a short generated loop; replace both.

Chapter lengths (how long each moment lasts) live in `src/config/chapters.ts`; the camera's route is in
`src/story/cameraPath.ts`; the master script is `src/story/timeline.ts`.

## Run it

```bash
npm install
npm run dev        # develop
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

To put it online, upload the **`dist/`** folder to any static host (Netlify Drop, Vercel, GitHub Pages, Cloudflare Pages).
It must be served from the root of a domain or subdomain (it uses `/assets/...` paths). Opening `index.html` straight from
disk will not work.

## How it works

- A fixed WebGL canvas sits behind the text. **Scrolling scrubs one GSAP timeline** that writes a plain shared object
  (`story`). Every 3D object and every caption reads from it each frame, with no React re-renders. Because everything is a pure
  function of scroll position, scrolling up plays the story backwards and jumping anywhere is always consistent.
- Flames, smoke, particle text, fireworks and the light trails are custom GLSL shaders. Repeated pieces (drips, pearls, petals,
  hearts, photos) are instanced.
- Quality adapts per device (`src/config/quality.ts`): phones get fewer particles, no shadows and no bloom.

## Accessibility and robustness

- `prefers-reduced-motion`: no smooth-scroll inertia, no parallax or sparkle trail, simpler text fades, gentler shader motion.
- All the words are also present as plain text for screen readers (`Transcript.tsx`); the animated copies are `aria-hidden`.
- Music never autoplays. It has a persistent toggle, fades in, and pauses when the tab is hidden.
- Keyboard: normal scrolling keys work; a "Skip to the last message" link appears on focus.
- No WebGL? A plain, readable version of the letter is shown instead.
- The custom cursor, sparkle trail and floating heart only appear with a real mouse.

## Known limits

- Verified in headless Chromium with software rendering (screenshots at desktop, phone and reduced-motion settings). Real-GPU
  frame rate, Safari and Firefox have **not** been measured. Test on the actual devices she'll use.
- The wish and blow moments slow down mouse-wheel scrolling; touch scrolling can't be slowed that way.
- `scripts/` holds optional tooling (placeholder generator, screenshot harness). It is not needed to run the site.
