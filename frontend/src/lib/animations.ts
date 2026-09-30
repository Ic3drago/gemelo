import { animate, createTimeline, onScroll, stagger, svg, text, utils } from 'animejs';

/**
 * Shared anime.js helpers.
 *
 * Conventions for every function in this module:
 *  - SSR safe: it is only ever called from effects/handlers, never at module
 *    scope, and it no-ops when there is no DOM.
 *  - Reduced motion aware: when the user prefers reduced motion the end state is
 *    applied immediately instead of animating, so content is never left hidden.
 *  - Reversible: returns a cleanup that reverts styles and detaches observers,
 *    which is what React effect cleanups should call.
 */

type Target = Parameters<typeof animate>[0];

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolve(target: Target, root?: ParentNode): Target {
  if (typeof target === 'string') {
    return Array.from((root ?? document).querySelectorAll(target));
  }
  return target;
}

/**
 * Reveals elements as they scroll into view, with an optional stagger between
 * siblings. Elements start hidden, so a no-JS/SSR render would be blank; we set
 * the "revealed" state immediately when motion is reduced.
 */
export function revealOnScroll(
  target: Target,
  options: {
    root?: ParentNode;
    threshold?: number;
    y?: number;
    duration?: number;
    gap?: number;
    once?: boolean;
    onReveal?: (el: Element) => void;
  } = {},
) {
  const {
    root = typeof document === 'undefined' ? undefined : document,
    threshold = 0.15,
    y = 24,
    duration = 650,
    gap = 70,
    once = true,
    onReveal,
  } = options;

  if (typeof window === 'undefined') return () => undefined;

  const elements = resolve(target, root);
  const list = Array.isArray(elements) ? elements : [elements];
  const nodes = list.filter((el): el is Element => el instanceof Element);
  if (!nodes.length) return () => undefined;

  const show = (el: Element, delay = 0) => {
    onReveal?.(el);
    if (prefersReducedMotion()) {
      utils.set(el, { opacity: 1, translateY: 0, filter: 'blur(0px)' });
      return;
    }
    animate(el, {
      opacity: [0, 1],
      translateY: [y, 0],
      filter: ['blur(6px)', 'blur(0px)'],
      duration,
      delay,
      ease: 'outExpo',
    });
  };

  utils.set(nodes, { opacity: 0, translateY: y, filter: 'blur(6px)' });

  if (prefersReducedMotion()) {
    nodes.forEach((el) => show(el));
    return () => undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          if (!once) {
            utils.set(entry.target, { opacity: 0, translateY: y, filter: 'blur(6px)' });
          }
          return;
        }
        const index = nodes.indexOf(entry.target);
        show(entry.target, index > 0 ? Math.min(index, 6) * gap : 0);
        if (once) observer.unobserve(entry.target);
      });
    },
    { threshold, rootMargin: '0px 0px -8% 0px' },
  );

  nodes.forEach((el) => observer.observe(el));

  return () => {
    observer.disconnect();
    utils.set(nodes, { opacity: 1, translateY: 0, filter: 'blur(0px)' });
  };
}

/**
 * Staggered entrance for a list of items (cards, pillars, nav links...).
 * Use when the elements are already in the viewport on load.
 */
export function staggerIn(
  target: Target,
  options: { root?: ParentNode; y?: number; x?: number; scale?: number; duration?: number; gap?: number; delay?: number; ease?: string } = {},
) {
  const { root, y = 18, x = 0, scale = 1, duration = 620, gap = 60, delay = 0, ease = 'outQuart' } = options;
  if (typeof window === 'undefined') return () => undefined;

  const elements = resolve(target, root);
  const list = Array.isArray(elements) ? elements : [elements];
  if (!list.length) return () => undefined;

  if (prefersReducedMotion()) return () => undefined;

  const animation = animate(list, {
    opacity: [0, 1],
    translateY: [y, 0],
    translateX: [x, 0],
    scale: [scale, 1],
    duration,
    delay: stagger(gap, { start: delay }),
    ease,
  });

  return () => animation.revert();
}

/**
 * Counts a number up into an element, formatting with the es-BO locale.
 * Parses the current text so it can be re-targeted when the value changes.
 */
export function countUp(
  element: Element,
  options: { to: number; decimals?: number; duration?: number; prefix?: string; suffix?: string; locale?: string } = { to: 0 },
) {
  const { to, decimals = 0, duration = 1400, prefix = '', suffix = '', locale = 'es-BO' } = options;
  if (typeof window === 'undefined') return () => undefined;

  const write = (value: number) => {
    const text = value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    element.textContent = `${prefix}${text}${suffix}`;
  };

  if (prefersReducedMotion()) {
    write(to);
    return () => undefined;
  }

  const from = Number.parseFloat(element.textContent?.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  utils.set(element, { opacity: 0.4 });
  const animation = animate(element, { opacity: 1, duration: duration * 0.4, ease: 'outQuad' });

  // anime.js tweens plain objects, so the counter lives on a local proxy and the
  // formatted text is written from the tween callback. `onUpdate` receives the
  // animation instance, not the tweened value, hence reading the proxy.
  const proxy = { value: from };
  const counter = animate(proxy, {
    value: to,
    duration,
    ease: 'outExpo',
    onUpdate: () => write(proxy.value),
    onComplete: () => write(to),
  });

  return () => {
    animation.revert();
    counter.revert();
  };
}

/** Counts every `[data-count]` element found under `root`. */
export function countUpAll(
  target: Target,
  options: { root?: ParentNode; duration?: number; gap?: number } = {},
) {
  const { root, duration = 1400, gap = 90 } = options;
  if (typeof window === 'undefined') return () => undefined;

  const elements = resolve(target, root);
  const list = Array.isArray(elements) ? elements : [elements];
  const nodes = list.filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (!nodes.length) return () => undefined;

  const cleanups = nodes.map((el, index) =>
    countUp(el, {
      to: Number(el.dataset.count ?? 0),
      decimals: Number(el.dataset.decimals ?? 0),
      prefix: el.dataset.prefix ?? '',
      suffix: el.dataset.suffix ?? '',
      duration,
    }),
  );

  if (!prefersReducedMotion() && nodes.length > 1) {
    utils.set(nodes, { opacity: 0 });
    animate(nodes, { opacity: 1, duration: 400, delay: stagger(gap), ease: 'outQuad' });
  }

  return () => cleanups.forEach((fn) => fn());
}

/** Draws an SVG path/line from 0 to full length, for charts and dividers. */
export function drawLine(target: Target, options: { duration?: number; delay?: number; ease?: string } = {}) {
  const { duration = 1100, delay = 0, ease = 'inOutQuad' } = options;
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => undefined;

  const elements = resolve(target);
  const list = Array.isArray(elements) ? elements : [elements];
  const drawables = svg.createDrawable(list);
  if (!drawables.length) return () => undefined;

  const animation = animate(drawables, {
    draw: ['0 0', '0 1'],
    duration,
    delay,
    ease,
  });

  return () => animation.revert();
}

/**
 * Scroll-linked progress bar. `onScroll({ sync })` binds an animation's timeline
 * to the scroll position, so the browser only scrubs existing keyframes instead
 * of us writing a value on every scroll event.
 */
export function scrollProgress(target: Target, options: { root?: ParentNode } = {}) {
  const { root } = options;
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => undefined;

  const elements = resolve(target, root);
  const list = Array.isArray(elements) ? elements : [elements];
  if (!list.length) return () => undefined;

  utils.set(list, { scaleX: 0, transformOrigin: 'left center' });

  // A target-less observer reports the scroll progress of its container, and
  // `autoplay: observer` makes the animation's timeline follow that progress.
  const observer = onScroll({
    container: (root as Element) ?? document.documentElement,
    sync: 'linear',
  });
  const animation = animate(list, {
    scaleX: [0, 1],
    ease: 'linear',
    autoplay: observer,
  });

  return () => {
    observer.revert();
    animation.revert();
  };
}

/** Timeline for the hero: headline words, copy, buttons and the device mock. */
export function heroIntro(targets: {
  headline?: Target;
  copy?: Target;
  actions?: Target;
  device?: Target;
  floatTag?: Target;
}) {
  if (typeof window === 'undefined') return () => undefined;

  if (prefersReducedMotion()) {
    Object.values(targets).forEach((t) => {
      const el = resolve(t as Target);
      const list = Array.isArray(el) ? el : [el];
      list.forEach((n) => n instanceof HTMLElement && utils.set(n, { opacity: 1, translateY: 0, scale: 1 }));
    });
    return () => undefined;
  }

  const tl = createTimeline({ defaults: { ease: 'outExpo' } });

  if (targets.headline) {
    const splitter = text.split(resolve(targets.headline) as Parameters<typeof text.split>[0], { words: true });
    tl.add(splitter.words, { opacity: [0, 1], translateY: [110, 0], duration: 900, ease: 'outExpo' }, 0);
  }
  if (targets.copy) {
    tl.add(targets.copy as Target, { opacity: [0, 1], translateY: [20, 0], duration: 700 }, 180);
  }
  if (targets.actions) {
    tl.add(targets.actions as Target, { opacity: [0, 1], translateY: [16, 0], duration: 600, delay: stagger(90) }, 300);
  }
  if (targets.device) {
    tl.add(targets.device as Target, { opacity: [0, 1], scale: [0.9, 1], rotate: ['7deg', '3deg'], duration: 1100, ease: 'outElastic(1, .7)' }, 260);
  }
  if (targets.floatTag) {
    tl.add(targets.floatTag as Target, { opacity: [0, 1], translateY: [26, 0], rotate: ['-8deg', '-2deg'], duration: 700 }, 700);
  }

  return () => tl.revert();
}

/** Slow looping float, used for badges and the device mock. */
export function float(target: Target, options: { distance?: number; duration?: number; gap?: number } = {}) {
  const { distance = 10, duration = 3200, gap = 0 } = options;
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => undefined;
  const elements = resolve(target);
  const list = Array.isArray(elements) ? elements : [elements];
  if (!list.length) return () => undefined;
  const animation = animate(list, {
    translateY: [{ to: -distance }, { to: distance }],
    duration,
    delay: stagger(gap),
    loop: true,
    alternate: true,
    ease: 'inOutSine',
  });
  return () => animation.revert();
}

/** Attention pulse for a status dot or badge. */
export function pulse(target: Target, options: { scale?: number; duration?: number; loop?: boolean } = {}) {
  const { scale = 1.18, duration = 1500, loop = true } = options;
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => undefined;
  const elements = resolve(target);
  const list = Array.isArray(elements) ? elements : [elements];
  if (!list.length) return () => undefined;
  const animation = animate(list, {
    scale: [{ to: scale }, { to: 1 }],
    opacity: [{ to: 0.65 }, { to: 1 }],
    duration,
    loop,
    ease: 'inOutQuad',
  });
  return () => animation.revert();
}

/**
 * Subtle 3D tilt on pointer move. Ignores coarse pointers so it never fights
 * with scrolling on touch devices.
 */
export function tiltOnHover(target: Target, options: { max?: number; perspective?: number } = {}) {
  const { max = 6, perspective = 900 } = options;
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => undefined;
  if (window.matchMedia('(pointer: coarse)').matches) return () => undefined;

  const elements = resolve(target);
  const list = Array.isArray(elements) ? elements : [elements];
  const nodes = list.filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (!nodes.length) return () => undefined;

  const cleanups: Array<() => void> = [];

  nodes.forEach((node) => {
    node.style.perspective = `${perspective}px`;
    const inner = node.firstElementChild as HTMLElement | null;
    const surface = inner ?? node;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      animate(surface, { rotateY: px * max * 2, rotateX: -py * max * 2, duration: 500, ease: 'outQuad' });
    };
    const onLeave = () => {
      animate(surface, { rotateY: 0, rotateX: 0, duration: 700, ease: 'outElastic(1, .6)' });
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      node.style.perspective = '';
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** Opens/closes an accordion <details> with a height animation. */
export function animateDisclosure(details: HTMLDetailsElement, open: boolean) {
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => undefined;
  const body = details.querySelector('div');
  if (!body) return () => undefined;

  utils.set(body, { height: open ? 0 : details.scrollHeight, overflow: 'hidden', opacity: open ? 0 : 1 });
  const animation = animate(body, {
    height: open ? details.scrollHeight : 0,
    opacity: open ? 1 : 0,
    duration: 380,
    ease: 'outQuart',
    onComplete: () => utils.set(body, { height: open ? 'auto' : 0, overflow: 'visible' }),
  });
  return () => animation.revert();
}

/* ── React bindings ────────────────────────────────────────────────────────
   Thin wrappers so components stay declarative. The returned cleanup is meant
   to be passed straight to the effect's return value.                      */

import { useEffect, useRef } from 'react';

/**
 * Runs an animation setup once the component is mounted and reverts it on
 * unmount. `setup` receives the element ref and returns a cleanup function.
 */
export function useAnimationEffect<T extends HTMLElement>(
  setup: (element: T | null) => (() => void) | void,
  deps: React.DependencyList = [],
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    return setup(ref.current) ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Reveals `selector` (relative to the returned ref, or the document by
 * default) as it scrolls into view.
 */
export function useRevealOnScroll<T extends HTMLElement>(
  selector: string,
  options: Parameters<typeof revealOnScroll>[1] = {},
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const scope = ref.current;
    return revealOnScroll(scope ? scope.querySelectorAll(selector) : selector, options) ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector]);

  return ref;
}
