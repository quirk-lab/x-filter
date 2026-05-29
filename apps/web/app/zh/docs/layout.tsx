import type { ReactNode } from 'react';
import { DocsFrame } from '../../../src/components/site/docs-frame';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsFrame locale="zh">{children}</DocsFrame>;
}
