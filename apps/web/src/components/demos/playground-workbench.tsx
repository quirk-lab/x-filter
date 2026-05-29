import type { Locale } from '../../site/locales';
import { AdapterParityDemo } from './adapter-parity-demo';

export function PlaygroundWorkbench({ locale = 'en' }: { locale?: Locale }) {
  return <AdapterParityDemo locale={locale} mode="workbench" />;
}
