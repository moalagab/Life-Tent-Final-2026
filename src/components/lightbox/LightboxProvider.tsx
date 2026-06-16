import { useState, useCallback, type ReactNode } from 'react';
import { LightboxContext, type LightboxItem } from './useLightbox';
import { Lightbox } from './Lightbox';

interface State {
  items: LightboxItem[];
  index: number;
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  const open = useCallback((items: LightboxItem[], startIndex = 0) => {
    if (items.length === 0) return;
    setState({ items, index: Math.min(startIndex, items.length - 1) });
  }, []);

  const openSingle = useCallback((item: LightboxItem) => {
    setState({ items: [item], index: 0 });
  }, []);

  const close = useCallback(() => setState(null), []);

  const goTo = useCallback((i: number) => {
    setState(s => s ? { ...s, index: i } : null);
  }, []);

  return (
    <LightboxContext.Provider value={{ open, openSingle, close }}>
      {children}
      {state && (
        <Lightbox
          items={state.items}
          index={state.index}
          onClose={close}
          onGoTo={goTo}
        />
      )}
    </LightboxContext.Provider>
  );
}
