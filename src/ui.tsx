import type { ReactNode } from "react";
import { Blobs, Logo, type Tone } from "./brand/Blobs";

const ON_DARK: Tone[] = ["navy", "teal", "closing"];
/** Tones whose template layout always carries the blob/wave decoration. */
const ALWAYS_DECORATED: Tone[] = ["navy", "teal", "cream", "closing"];

export const Slide = ({
  children,
  className,
  kicker,
  tone = "light",
  blobs,
  footer = tone !== "navy",
  style,
}: {
  children: ReactNode;
  className?: string;
  kicker?: string;
  /**
   * Template layout family:
   *  - light   white content slide (TITLE_AND_BODY)
   *  - navy    hero/title slide (TITLE)
   *  - teal    agenda / emphasis slide (TITLE_AND_BODY_…_1)
   *  - cream   section divider (TITLE_1)
   *  - closing thank-you slide (TITLE_1_1_1_1)
   */
  tone?: Tone;
  /** Force the blob decoration on/off. Light slides default to plain (TITLE_AND_BODY_1). */
  blobs?: boolean;
  /** The template's title layout has no footer; everything else does. */
  footer?: boolean;
  style?: React.CSSProperties;
}) => {
  const decorated = blobs ?? ALWAYS_DECORATED.includes(tone);
  const cls = [
    "slide",
    tone,
    ON_DARK.includes(tone) ? "on-dark" : "on-light",
    decorated ? "has-blobs" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={cls} style={style}>
      {decorated ? <Blobs tone={tone} /> : null}
      {kicker ? <div className="kicker">{kicker}</div> : null}
      <div className="slide-body">{children}</div>
      {footer ? (
        <div className="footer">
          <span className="footer-brand">
            <Logo height={18} />
          </span>
          <span>Experience Is Abundant. Knowledge Is Distilled.</span>
        </div>
      ) : null}
    </section>
  );
};

// ── Tiny syntax highlighter ──────────────────────────────────────────
const KW =
  /\b(const|let|var|function|return|await|async|import|from|export|for|while|if|else|new|class|throw|try|catch|typeof|in|of|null|true|false|def|with|as|match|spawn|enum|test|client|prompt|type|interface|implements|yield|lambda|is|not|and|or|print|self)\b/;
/** Cypher clauses, upper-case only so they never collide with prose or code. */
const CYPHER_KW = /\b(MATCH|OPTIONAL|WHERE|RETURN|WITH|ORDER BY|UNWIND|UNION|LIMIT|DESC|IN|OR|AND|NOT)\b/;
const RULES: [RegExp, string][] = [
  [/(\/\/.*|#(?!").*)/, "tk-cm"],
  [/(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, "tk-str"],
  [KW, "tk-kw"],
  [CYPHER_KW, "tk-kw"],
  [/(\$[a-z_][A-Za-z0-9_]*)/, "tk-fn"],
  [/\b(\d+(?:\.\d+)?)\b/, "tk-num"],
  [/\b([A-Z][A-Za-z0-9_]*)\b/, "tk-ty"],
  [/\b([a-z_][A-Za-z0-9_]*)(?=\()/, "tk-fn"],
];
export const tokenize = (line: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let rest = line;
  let k = 0;
  while (rest.length) {
    let best: { i: number; len: number; cls: string } | null = null;
    for (const [re, cls] of RULES) {
      const m = re.exec(rest);
      if (m && (best === null || m.index < best.i)) {
        best = { i: m.index, len: m[0].length, cls };
      }
    }
    if (!best) {
      out.push(rest);
      break;
    }
    if (best.i > 0) out.push(rest.slice(0, best.i));
    out.push(
      <span key={k++} className={best.cls}>
        {rest.slice(best.i, best.i + best.len)}
      </span>,
    );
    rest = rest.slice(best.i + best.len);
  }
  return out;
};

export const Code = ({
  children,
  title,
  small,
  highlight = [],
  dim = [],
}: {
  children: string;
  title?: string;
  small?: boolean;
  /** 1-indexed lines to highlight. */
  highlight?: number[];
  /** 1-indexed lines to dim. */
  dim?: number[];
}) => {
  const lines = children.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
  return (
    <div className="code-wrap">
      {title ? <div className="code-title">{title}</div> : null}
      <pre className={`code ${small ? "sm" : ""}`}>
        {lines.map((l, i) => (
          <span
            key={i}
            className={
              highlight.includes(i + 1) ? "hl" : dim.includes(i + 1) ? "tk-dim" : ""
            }
          >
            {tokenize(l)}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
};
