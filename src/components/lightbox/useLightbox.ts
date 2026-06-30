import { createContext, useContext } from 'react';

export interface LightboxItem {
  url:   string;
  name:  string;
  type:  string; // MIME type e.g. "image/jpeg"
  size?: number; // bytes
}

export interface LightboxContextValue {
  open:         (items: LightboxItem[], startIndex?: number) => void;
  openSingle:   (item: LightboxItem) => void;
  close:        () => void;
}

export const LightboxContext = createContext<LightboxContextValue | null>(null);

export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error('useLightbox must be used within LightboxProvider');
  return ctx;
}
