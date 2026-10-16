"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  format,
  duration = 450,
  className,
}: {
  value: number;
  format: (input: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = displayRef.current;
    const to = Number.isFinite(value) ? value : 0;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      displayRef.current = current;
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
        setDisplay(to);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
