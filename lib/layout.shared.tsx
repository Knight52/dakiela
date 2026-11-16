import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { zhTW } from '@fumadocs/language/zh-tw';
import { i18n } from '@/lib/i18n';

export const translations = i18n.translations().extend(uiTranslations()).preset('cn', zhTW());

export function baseOptions(locale: string = i18n.defaultLanguage): BaseLayoutProps {
  return {
    nav: {
      title: 'The Abledge',
      url: locale === i18n.defaultLanguage ? '/docs' : `/docs/${locale}`,
    },
  };
}
