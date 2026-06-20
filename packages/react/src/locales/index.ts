import type { FilterBuilderLabels } from '../types';
import { enUS } from './en-US';
import { jaJP } from './ja-JP';
import { zhCN } from './zh-CN';

export { enUS } from './en-US';
export { jaJP } from './ja-JP';
export { zhCN } from './zh-CN';

/** BCP-47 codes for the built-in locales. */
export type LocaleCode = 'en-US' | 'zh-CN' | 'ja-JP';

/** Registry of built-in locales keyed by BCP-47 code, for locale switchers. */
export const locales: Record<LocaleCode, Required<FilterBuilderLabels>> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'ja-JP': jaJP,
};
