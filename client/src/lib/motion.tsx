import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { tweenValue } from "./insights";
import { useInView, useReducedMotion } from "./useMotion";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

/** Fades and lifts its content in once, when it first enters the viewport. */
export function Reveal({ children, as: Tag = "div", delay = 0, className = "", style, ...rest }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag ref={ref} className={`sr ${inView ? "in" : ""} ${className}`} style={{ ...style, "--d": `${delay}ms` } as CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Animated number. Counts up from `from` the first time it scrolls into view,
 * then rolls from the old value to the new one whenever `value` changes.
 * `data-counting` is set while it moves, so tests can wait for it to settle.
 */
export function CountUp({
  value,
  format = (n: number) => n.toLocaleString("en-CA"),
  from = 0,
  duration = 1400,
  animateOnMount = true,
  className,
  ...rest
}: {
  value: number;
  format?: (n: number) => string;
  from?: number;
  duration?: number;
  animateOnMount?: boolean;
  className?: string;
  [key: string]: unknown;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLSpanElement>("0px");
  const [shown, setShown] = useState(animateOnMount && !reduced ? from : value);
  const [counting, setCounting] = useState(false);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (!inView) return;
    const start = shownRef.current;
    if (reduced || start === value) {
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    setCounting(true);
    const tick = (now: number) => {
      const v = tweenValue(start, value, now - t0, duration);
      setShown(v);
      if (v !== value || now - t0 < duration) raf = requestAnimationFrame(tick);
      else setCounting(false);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setCounting(false);
    };
  }, [value, inView, reduced, duration]);

  return (
    <span ref={ref} className={className} data-counting={counting ? "" : undefined} {...rest}>
      {format(shown)}
    </span>
  );
}
