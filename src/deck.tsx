import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";

export interface SlideDef {
  /** Number of fragment steps beyond the initial state. */
  steps?: number;
  render: () => ReactNode;
}

interface DeckState {
  index: number;
  step: number;
}

const StepContext = createContext(0);

/** Current fragment step for the visible slide (0 = nothing revealed). */
export const useStep = () => useContext(StepContext);

/**
 * Reveals children once the slide's step reaches `at`. `mode="dim"` keeps the
 * children in the layout but faded until revealed (good for lists).
 */
export const Frag = ({
  at,
  mode = "show",
  children,
  className,
  style,
}: {
  at: number;
  mode?: "show" | "dim";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const step = useStep();
  return (
    <div
      className={`frag ${className ?? ""}`}
      data-hidden={step < at}
      data-mode={mode}
      style={style}
    >
      {children}
    </div>
  );
};

const EXPORT =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("export");

const readHash = (max: number): DeckState => {
  const m = /^#\/?(\d+)(?:\.(\d+))?/.exec(window.location.hash);
  const index = Math.min(Math.max(Number(m?.[1] ?? 1) - 1, 0), max - 1);
  const step = Number(m?.[2] ?? 0);
  return { index, step };
};

export const Deck = ({ slides }: { slides: SlideDef[] }) => {
  const [state, setState] = useState<DeckState>(() => readHash(slides.length));
  const [scale, setScale] = useState(1);

  // Fit the 1600x900 viewport into the window. `?export=1` (used by
  // scripts/export-slides.mjs) fills the window exactly and hides the HUD, so
  // a 1600x900 headless screenshot is the bare slide.
  useLayoutEffect(() => {
    const fit = () =>
      setScale(EXPORT ? 1 : Math.min(window.innerWidth / 1600, window.innerHeight / 900) * 0.96);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Sync hash <-> state. A slide change restarts every Flow animation; a
  // fragment step within the same slide parks them on their final frame, so
  // revealing text under a diagram does not replay it.
  const lastIndexRef = useRef<number | null>(null);
  useEffect(() => {
    const h = `#/${state.index + 1}${state.step ? `.${state.step}` : ""}`;
    if (window.location.hash !== h) history.replaceState(null, "", h);
    const sameSlide = lastIndexRef.current === state.index;
    lastIndexRef.current = state.index;
    // After paint, so newly mounted Flow roots have subscribed.
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event(sameSlide ? "flow:hold" : "flow:reset")));
    return () => cancelAnimationFrame(id);
  }, [state]);
  useEffect(() => {
    const onHash = () => setState(readHash(slides.length));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [slides.length]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const nav = useMemo(() => {
    const next = () => {
      // A segmented diagram still playing its segment takes this click to
      // finish it; the step only advances on the next one.
      if (!window.dispatchEvent(new Event("flow:finish", { cancelable: true }))) return;
      // Past the last step of the last slide there is nowhere to go, so the
      // state doesn't change and no hold fires. Park the diagrams instead.
      const s = stateRef.current;
      if (s.index === slides.length - 1 && s.step >= (slides[s.index].steps ?? 0)) {
        window.dispatchEvent(new Event("flow:hold"));
        return;
      }
      setState((s) => {
        const max = slides[s.index].steps ?? 0;
        if (s.step < max) return { ...s, step: s.step + 1 };
        if (s.index < slides.length - 1) return { index: s.index + 1, step: 0 };
        return s;
      });
    };
    const prev = () =>
      setState((s) => {
        if (s.step > 0) return { ...s, step: s.step - 1 };
        if (s.index > 0) {
          const i = s.index - 1;
          return { index: i, step: slides[i].steps ?? 0 };
        }
        return s;
      });
    const nextSlide = () =>
      setState((s) => ({
        index: Math.min(s.index + 1, slides.length - 1),
        step: 0,
      }));
    const prevSlide = () =>
      setState((s) => ({ index: Math.max(s.index - 1, 0), step: 0 }));
    return { next, prev, nextSlide, prevSlide };
  }, [slides]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
        case "j":
          e.preventDefault();
          e.shiftKey ? nav.nextSlide() : nav.next();
          break;
        case "ArrowLeft":
        case "Backspace":
        case "PageUp":
        case "k":
          e.preventDefault();
          e.shiftKey ? nav.prevSlide() : nav.prev();
          break;
        case "ArrowDown":
          e.preventDefault();
          nav.nextSlide();
          break;
        case "ArrowUp":
          e.preventDefault();
          nav.prevSlide();
          break;
        case "Home":
          setState({ index: 0, step: 0 });
          break;
        case "End":
          setState({ index: slides.length - 1, step: 0 });
          break;
        case "f":
          document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav, slides.length]);

  const slide = slides[state.index];
  return (
    <div
      className={EXPORT ? "deck export" : "deck"}
      style={{ "--deck-scale": scale } as React.CSSProperties}
    >
      <div className="slide-viewport">
        <StepContext.Provider value={state.step}>
          <div key={state.index} className="slide-host">
            {slide.render()}
          </div>
        </StepContext.Provider>
      </div>
      {EXPORT ? null : (
        <>
          <div className="hud">
            {state.index + 1} / {slides.length}
            {slide.steps ? ` · ${state.step}/${slide.steps}` : ""}
          </div>
          <div
            className="progress"
            style={{ width: `${((state.index + 1) / slides.length) * 100}%` }}
          />
        </>
      )}
    </div>
  );
};
