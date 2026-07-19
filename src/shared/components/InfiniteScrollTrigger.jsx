import { useEffect, useRef } from 'react';

export function InfiniteScrollTrigger({ enabled, onIntersect }) {
  const triggerRef = useRef(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!enabled || !trigger || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin: '240px 0px' },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [enabled, onIntersect]);

  return <div ref={triggerRef} className="scroll-sentinel" aria-hidden="true" />;
}
