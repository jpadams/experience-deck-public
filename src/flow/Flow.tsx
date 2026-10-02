
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./flow.module.css";
import {
  FlowContextProvider,
  useFlow,
  type FlowContextValue,
  type FlowFrameCallback,
} from "./useFlow";
import {
  resolveTrack,
  sampleTrack,
  type FlowSample,
  type FlowTrack,
} from "./timeline";

// ─── Root ──────────────────────────────────────────────────────────────────

interface RootProps {
  /** Loop length in ms. The clock wraps to 0 when it reaches this. */
  duration: number;
  /**
   * Loop time (ms) rendered as the initial/static frame: server markup,
   * pre-hydration paint, and the composition shown under
   * prefers-reduced-motion. Pick a moment where the diagram tells its story.
   */
  posterTime?: number;
  /** Extra external pause source (e.g. a parent-controlled toggle). */
  paused?: boolean;
  /** Pause when the document is hidden (Page Visibility API). Default true. */
  pauseWhenHidden?: boolean;
  /** Pause when the root scrolls out of view (IntersectionObserver). Default true. */
  pauseWhenOffscreen?: boolean;
  /**
   * Presentation chrome: a progress bar + restart button row at the bottom of
   * the frame. Default true; hidden automatically under reduced motion.
   */
  controls?: boolean;
  /** Where reset() rewinds to (default 0). Lets a diagram start mid-loop. */
  resetTime?: number;
  /**
   * Playback rate. 1 = the timings written in the diagram; 0.5 = half speed;
   * 2 = double. Applied to wall-clock dt, so every keyframe scales together.
   */
  speed?: number;
  /**
   * true (default): the clock wraps to 0 at `duration` and the piece replays.
   * false: the clock runs once, then parks at `holdAt` (default `duration`)
   * until the next reset() — e.g. the deck's slide/step change.
   */
  loop?: boolean;
  /** Loop time (ms) to park at when `loop` is false. Use the moment before any fade-out. */
  holdAt?: number;
  /**
   * Segmented playback. When true, the deck's `flow:hold` (fired on a fragment
   * step) releases any hold and lets the clock run on to `holdAt` instead of
   * parking. Pair it with a `holdAt` that grows with the slide's step so each
   * click plays the next segment. A click while a segment is still playing
   * snaps it to its end instead of advancing the step (`flow:finish`).
   * Default false.
   */
  resumeOnStep?: boolean;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  children: ReactNode;
}

/**
 * Rehearsal / export override: `?t=poster` parks every Root on its own poster
 * frame, `?t=hold` on its `holdAt` (the frame `loop=0` ends on), `?t=<ms>` on
 * that loop time. Static, like reduced motion, so a frame can be screenshotted
 * from a headless or hidden tab where requestAnimationFrame never fires.
 */
const FORCED_T: "poster" | "hold" | number | null = (() => {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("t");
  if (v === null || v === "") return null;
  if (v === "poster" || v === "hold") return v;
  return Number(v);
})();

/**
 * Export hook, present only in static mode: `window.__flow.seek(t)` moves every
 * mounted Root's clock to loop time `t` and repaints, `window.__flow.roots()`
 * lists their durations. scripts/export-slides.mjs uses it to render the
 * animations frame by frame.
 */
interface ExportEntry { seek: (t: number) => void; duration: number; holdAt: number }
const exportRegistry = new Set<ExportEntry>();
declare global {
  interface Window {
    __flow?: { seek: (t: number) => void; roots: () => { duration: number; holdAt: number }[] };
  }
}
if (typeof window !== "undefined" && FORCED_T !== null) {
  window.__flow = {
    seek: (t) => { for (const e of exportRegistry) e.seek(t); },
    roots: () => Array.from(exportRegistry, (e) => ({ duration: e.duration, holdAt: e.holdAt })),
  };
}

const Root = ({
  duration,
  posterTime: posterProp = 0,
  paused = false,
  pauseWhenHidden = true,
  pauseWhenOffscreen = true,
  controls = true,
  resetTime = 0,
  speed = 1,
  loop = true,
  holdAt,
  resumeOnStep = false,
  className,
  style,
  "aria-label": ariaLabel,
  children,
}: RootProps) => {
  const posterTime =
    FORCED_T === null || FORCED_T === "poster" ? posterProp
    : FORCED_T === "hold" ? (holdAt ?? posterProp)
    : FORCED_T;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const subscribersRef = useRef<Set<FlowFrameCallback>>(new Set());
  // The clock starts at the poster frame, so a paused Root keeps rendering
  // exactly the frame that was server-rendered rather than snapping to t=0.
  const timeRef = useRef(posterTime);

  const [isStatic, setIsStatic] = useState(false);
  const isStaticRef = useRef(false);
  const posterTimeRef = useRef(posterTime);
  posterTimeRef.current = posterTime;

  // Pause sources union — starts paused by "offscreen" until the
  // IntersectionObserver reports in.
  const pauseSourcesRef = useRef<Set<string>>(
    new Set(pauseWhenOffscreen ? ["offscreen"] : []),
  );
  const [isPaused, setIsPaused] = useState(pauseWhenOffscreen);

  const setPauseSource = useCallback((key: string, value: boolean) => {
    const set = pauseSourcesRef.current;
    const had = set.has(key);
    if (value && !had) set.add(key);
    else if (!value && had) set.delete(key);
    else return;
    setIsPaused(set.size > 0);
  }, []);

  // prefers-reduced-motion → park the clock on the poster frame.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const st = mq.matches || FORCED_T !== null;
      isStaticRef.current = st;
      setIsStatic(st);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Native pause primitives — single AbortController for cleanup.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ac = new AbortController();

    if (pauseWhenHidden) {
      const onVis = () => setPauseSource("hidden", document.hidden);
      document.addEventListener("visibilitychange", onVis, {
        signal: ac.signal,
      });
      onVis();
    }

    let observer: IntersectionObserver | null = null;
    if (pauseWhenOffscreen) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setPauseSource("offscreen", !entry.isIntersecting);
          }
        },
        { threshold: 0 },
      );
      observer.observe(el);
    }

    return () => {
      ac.abort();
      observer?.disconnect();
      setPauseSource("hidden", false);
      setPauseSource("offscreen", false);
    };
  }, [pauseWhenHidden, pauseWhenOffscreen, setPauseSource]);

  // The clock. One rAF loop broadcasts loop time to all subscribed tokens —
  // no React re-renders on the hot path. A low-frequency interval backstop
  // keeps the clock advancing in environments that starve rAF (headless
  // capture under virtual time, aggressive throttling); it shares the same
  // dt accumulation, so the two sources interleave without double-counting.
  const running = !isPaused && !paused && !isStatic;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last: number | null = null;
    let lastFrameAt = 0;
    const step = () => {
      const now = performance.now();
      if (last !== null) {
        // Clamp dt so a janky frame doesn't teleport tokens.
        const dt = Math.min(now - last, 100) * speed;
        const end = Math.min(holdAt ?? duration, duration);
        if (loop) {
          timeRef.current = (timeRef.current + dt) % duration;
        } else if (timeRef.current < end) {
          timeRef.current = Math.min(timeRef.current + dt, end);
        } else {
          // Parked: nothing to broadcast until a reset.
          last = now;
          return;
        }
        for (const fn of subscribersRef.current) fn(timeRef.current);
      }
      last = now;
    };
    const onFrame = () => {
      lastFrameAt = performance.now();
      step();
      raf = requestAnimationFrame(onFrame);
    };
    raf = requestAnimationFrame(onFrame);
    const interval = window.setInterval(() => {
      // Only steps in when rAF has gone quiet.
      if (performance.now() - lastFrameAt > 40) step();
    }, 33);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [running, duration, speed, loop, holdAt]);

  // Static mode: broadcast the poster frame once.
  useEffect(() => {
    if (!isStatic) return;
    timeRef.current = posterTime;
    for (const fn of subscribersRef.current) fn(posterTime);
  }, [isStatic, posterTime]);

  // Static mode: register with the export hook so a script can seek this Root.
  useEffect(() => {
    if (!isStatic) return;
    const entry: ExportEntry = {
      seek: (t) => {
        timeRef.current = t;
        for (const fn of subscribersRef.current) fn(t);
      },
      duration,
      holdAt: holdAt ?? duration,
    };
    exportRegistry.add(entry);
    return () => {
      exportRegistry.delete(entry);
    };
  }, [isStatic, duration, holdAt]);

  const subscribe = useCallback((fn: FlowFrameCallback) => {
    subscribersRef.current.add(fn);
    fn(isStaticRef.current ? posterTimeRef.current : timeRef.current);
    return () => {
      subscribersRef.current.delete(fn);
    };
  }, []);

  const now = useCallback(() => timeRef.current, []);

  /**
   * Rewind the clock to 0 (posterTime under reduced motion) and broadcast
   * immediately, so the composition snaps back whether running or paused.
   */
  const resetCountRef = useRef(0);
  const resets = useCallback(() => resetCountRef.current, []);
  const resetTimeRef = useRef(resetTime);
  resetTimeRef.current = resetTime;

  const reset = useCallback(() => {
    resetCountRef.current += 1;
    setPauseSource("held", false);
    timeRef.current = isStaticRef.current ? posterTimeRef.current : resetTimeRef.current;
    for (const fn of subscribersRef.current) fn(timeRef.current);
  }, [setPauseSource]);

  /**
   * Park on the final frame (`holdAt`, else `duration`) and stop the clock,
   * whether or not the loop had finished. `reset` releases the hold.
   */
  // Assigned during render, not in an effect, so a key press landing right
  // after a step change already sees the new segment end.
  const holdEndRef = useRef(holdAt ?? duration);
  holdEndRef.current = holdAt ?? duration;
  const hold = useCallback(() => {
    timeRef.current = isStaticRef.current ? posterTimeRef.current : holdEndRef.current;
    setPauseSource("held", true);
    for (const fn of subscribersRef.current) fn(timeRef.current);
  }, [setPauseSource]);

  // Deck integration: `flow:reset` on window rewinds this loop and `flow:hold`
  // parks it on its final frame. The deck fires reset on a slide change and
  // hold on a fragment step within the same slide, so revealing text under a
  // finished diagram does not replay it.
  useEffect(() => {
    // Segmented: release any hold so the clock runs on to the new `holdAt`,
    // unless it is already past it (a step back), where it parks there.
    const onHold = resumeOnStep
      ? () => (timeRef.current > holdEndRef.current ? hold() : setPauseSource("held", false))
      : hold;
    window.addEventListener("flow:reset", reset);
    window.addEventListener("flow:hold", onHold);
    return () => {
      window.removeEventListener("flow:reset", reset);
      window.removeEventListener("flow:hold", onHold);
    };
  }, [reset, hold, resumeOnStep, setPauseSource]);

  // Segmented playback: the deck fires a cancelable `flow:finish` before
  // advancing a step. A segment still playing snaps to its end and cancels the
  // event, so that click finishes the segment instead of moving on.
  const loopRef = useRef(loop);
  loopRef.current = loop;
  useEffect(() => {
    if (!resumeOnStep) return;
    const onFinish = (e: Event) => {
      if (isStaticRef.current || loopRef.current) return;
      const end = holdEndRef.current;
      if (timeRef.current >= end) return;
      timeRef.current = end;
      for (const fn of subscribersRef.current) fn(end);
      e.preventDefault();
    };
    window.addEventListener("flow:finish", onFinish);
    return () => window.removeEventListener("flow:finish", onFinish);
  }, [resumeOnStep]);

  // Loop-position progress for the controls row: an internal subscriber writes
  // `--flow-progress` (0..1) on the frame element — same no-render hot path as
  // tokens; the fill is a pure CSS scaleX of that property.
  useEffect(
    () =>
      subscribe((t) => {
        rootRef.current?.style.setProperty(
          "--flow-progress",
          String(t / duration),
        );
      }),
    [subscribe, duration],
  );

  const ctxValue = useMemo<FlowContextValue>(
    () => ({ duration, posterTime, isStatic, subscribe, now, reset, resets }),
    [duration, posterTime, isStatic, subscribe, now, reset, resets],
  );

  return (
    <FlowContextProvider value={ctxValue}>
      {/* Outer frame (bounding box + controls). The stage container below
          keeps role="img" and the consumer className, so interactive controls
          are NOT inside the presentational img subtree. `flow-scope` carries
          the marketing-parity design tokens (see styles/flow-tokens.css). */}
      <div
        ref={rootRef}
        className={`${styles.frame} flow-scope`}
        style={style}
        data-flow-static={isStatic || undefined}
        data-flow-paused={isPaused || paused || undefined}
      >
        <div
          role="img"
          aria-label={ariaLabel}
          className={`${styles.root} ${className ?? ""}`}
        >
          {children}
        </div>
        {controls ? (
          <div className={styles.controls}>
            <div className={styles.progressTrack} aria-hidden="true">
              <div className={styles.progressFill} />
            </div>
            <button
              type="button"
              className={styles.restart}
              onClick={reset}
              aria-label="Restart animation"
            >
              <span className={styles.restartLabel}>[&nbsp;Restart&nbsp;]</span>
            </button>
          </div>
        ) : null}
      </div>
    </FlowContextProvider>
  );
};

// ─── Stage ─────────────────────────────────────────────────────────────────

interface StageProps {
  /** Design-space width. Token x coordinates are in these units. */
  width: number;
  /** Design-space height. Sets the stage's aspect ratio with `width`. */
  height: number;
  className?: string;
  children: ReactNode;
}

/**
 * A responsive coordinate space. The stage exposes `--flow-u` (the rendered
 * size of one design unit) so tokens — and consumer CSS — can size and
 * position everything in design units. Put a `<svg viewBox="0 0 W H">` child
 * first for the static line work; it is absolutely stretched to the stage.
 */
const Stage = ({ width, height, className, children }: StageProps) => (
  <div
    className={`${styles.stage} ${className ?? ""}`}
    style={
      {
        aspectRatio: `${width} / ${height}`,
        "--flow-w": width,
      } as CSSProperties
    }
  >
    {children}
  </div>
);

// ─── Token ─────────────────────────────────────────────────────────────────

interface TokenProps {
  track: FlowTrack;
  /** Applied to the centering wrapper around `children`. */
  className?: string;
  /** The token's visual. Style it off `[data-flow-state="…"]` on the ancestor. */
  children?: ReactNode;
}

const applySample = (el: HTMLElement, s: FlowSample) => {
  el.style.visibility = s.alive ? "" : "hidden";
  if (!s.alive) return;
  el.style.setProperty("--flow-x", String(s.x));
  el.style.setProperty("--flow-y", String(s.y));
  el.style.setProperty("--flow-scale", String(s.scale));
  el.style.opacity = String(s.opacity);
  if (el.dataset.flowState !== s.state) {
    el.dataset.flowState = s.state;
  }
};

/**
 * One element driven by one track. The first render is the poster frame
 * (SSR-safe, deterministic); after mount the loop clock mutates transform /
 * opacity / `data-flow-state` imperatively — React never re-renders per frame.
 */
const Token = ({ track, className, children }: TokenProps) => {
  const { posterTime, subscribe } = useFlow();
  const ref = useRef<HTMLDivElement | null>(null);
  const resolved = useMemo(() => resolveTrack(track), [track]);

  useEffect(
    () =>
      subscribe((t) => {
        const el = ref.current;
        if (el) applySample(el, sampleTrack(resolved, t));
      }),
    [subscribe, resolved],
  );

  const initial = sampleTrack(resolved, posterTime);

  return (
    <div
      ref={ref}
      className={styles.token}
      data-flow-state={initial.state}
      style={
        {
          visibility: initial.alive ? undefined : "hidden",
          opacity: initial.opacity,
          "--flow-x": initial.x,
          "--flow-y": initial.y,
          "--flow-scale": initial.scale,
        } as CSSProperties
      }
    >
      <div className={`${styles.tokenInner} ${className ?? ""}`}>
        {children}
      </div>
    </div>
  );
};

// ─── Namespace export ──────────────────────────────────────────────────────

export const Flow = {
  Root,
  Stage,
  Token,
};
