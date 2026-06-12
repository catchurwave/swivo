import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from 'react';

type Direction = 'up' | 'left' | 'right' | 'scale';

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  direction?: Direction;
  delay?: number;
  once?: boolean;
};

/**
 * Scroll-triggered reveal wrapper. Uses IntersectionObserver to toggle the
 * .is-visible class defined in index.css. Plays once by default.
 *
 * On the SSR pass the element is rendered "visible" (no JS yet) so crawlers
 * and no-JS users see content. On hydration we briefly reset to hidden, then
 * the observer fires.
 */
export function Reveal({ children, as: Tag = 'div', direction = 'up', delay = 0, once = true, className = '', style, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(typeof window === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [once]);

  const dirClass = direction === 'left' ? 'reveal-left' : direction === 'right' ? 'reveal-right' : direction === 'scale' ? 'reveal-scale' : '';
  const Component = Tag as 'div';

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={`reveal ${dirClass} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Component>
  );
}
