import type { ReactNode } from 'react';

export function ContentTemplateShell({ kind, children }: { kind: string; children: ReactNode }) {
  return <section className={`content-template-shell content-template-shell--${kind}`}>{children}</section>;
}
