import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!#$';

export function Scramble({ text, className, speed = 25 }: { text: string; className?: string; speed?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(reduce ? text : '');

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(text);
      return;
    }
    let frame = 0;
    let raf = 0;
    const total = text.length;
    const tick = () => {
      frame++;
      const settled = Math.floor(frame / 2);
      let out = '';
      for (let i = 0; i < total; i++) {
        if (i < settled) out += text[i];
        else if (text[i] === ' ') out += ' ';
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);
      if (settled < total) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, reduce, speed]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display || text}
    </span>
  );
}

export function CountUp({ to, suffix = '', duration = 1.4 }: { to: number; suffix?: string; duration?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const unsub = spring.on('change', (v) => setVal(Math.round(v)));
    mv.set(to);
    return () => unsub();
  }, [inView, to, reduce, mv, spring]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const reduce = useReducedMotion();
  // Duplicate items in each track to ensure full coverage across all desktop and mobile viewports
  const sequence = [...items, ...items];

  return (
    <div
      className={`group relative overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-abyss)] py-3.5 select-none ${className || ''}`}
      role="region"
      aria-label="Services Lineup Ticker"
    >
      <div className="flex w-max">
        {/* Track 1 */}
        <div
          className={`flex shrink-0 items-center gap-12 whitespace-nowrap pr-12 ${
            reduce ? '' : 'animate-services-marquee'
          }`}
        >
          {sequence.map((item, i) => (
            <span
              key={`trk1-${i}`}
              className="flex items-center gap-12 font-display text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <span>{item}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-violet)] shadow-[0_0_8px_var(--color-violet)]" aria-hidden="true" />
            </span>
          ))}
        </div>

        {/* Track 2: Identical duplicate for seamless 0% -> -100% loop with zero jumping */}
        <div
          aria-hidden="true"
          className={`flex shrink-0 items-center gap-12 whitespace-nowrap pr-12 ${
            reduce ? 'hidden' : 'animate-services-marquee'
          }`}
        >
          {sequence.map((item, i) => (
            <span
              key={`trk2-${i}`}
              className="flex items-center gap-12 font-display text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <span>{item}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-violet)] shadow-[0_0_8px_var(--color-violet)]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>

      {/* Smooth edge gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[var(--color-void)] to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[var(--color-void)] to-transparent" aria-hidden="true" />
    </div>
  );
}

export function TiltCard({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const reduce = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((y - centerY) / centerY) * -4.5;
    const rotY = ((x - centerX) / centerX) * 4.5;
    setRot({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setRot({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: 'transform 0.18s ease-out',
      }}
      className={`card-lift ${className}`}
    >
      {children}
    </div>
  );
}
