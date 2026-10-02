/**
 * Motion settings for every animated slide, in one place.
 *
 *   SPEED  playback rate for all diagrams. 1 = as authored, 0.5 = half speed,
 *          2 = double. Each diagram may pass its own multiplier on top
 *          (e.g. the learning loop runs at 0.25 × SPEED).
 *   LOOP   false → plays once, then holds on its final frame until the deck
 *                  changes slide (which resets every Flow clock). Default.
 *          true  → each animation replays forever (wraps at its duration).
 *
 * Rehearsal overrides without a rebuild — add to the URL:
 *   ?speed=0.5        ?loop=1 (replay forever)        ?speed=2&loop=1
 */
export const SPEED = 1;
export const LOOP = false;

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const urlSpeed = params?.get("speed");
const urlLoop = params?.get("loop");

const speedBase = urlSpeed !== null && urlSpeed !== undefined && Number(urlSpeed) > 0 ? Number(urlSpeed) : SPEED;
const loopBase = urlLoop === null || urlLoop === undefined ? LOOP : !["0", "false", "no", "off"].includes(urlLoop.toLowerCase());

/**
 * Props to spread onto <Flow.Root>. `holdAt` is the loop time to park on when
 * not looping — pass the diagram's HOLD (the moment before its fade-out).
 */
export const motion = ({ speed = 1, holdAt }: { speed?: number; holdAt?: number } = {}) => ({
  speed: speedBase * speed,
  loop: loopBase,
  holdAt,
});
