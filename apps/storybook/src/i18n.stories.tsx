import type { Meta, StoryObj } from '@storybook/react';
import { AntdFilterBuilder } from '@x-filter/antd';
import type { Filter } from '@x-filter/core';
import type { LocaleCode } from '@x-filter/react';
import { locales } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';
import { issueSchema, pageStyle, panelStyle, StoryIntro } from './scenario-data';

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    { id: 'r-label', field: 'label', operator: 'includes', value: 'bug' },
  ],
};

const localeOptions: { code: LocaleCode; name: string }[] = [
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ja-JP', name: '日本語' },
];

function I18nScenario() {
  const [locale, setLocale] = useState<LocaleCode>('zh-CN');
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const labels = locales[locale];

  return (
    <main style={pageStyle}>
      <StoryIntro title="Built-in localization (labels)">
        Pass a built-in locale to the <code>labels</code> prop. The action buttons and control
        labels switch language instantly — no per-string translation by the consumer (issue #21).
      </StoryIntro>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <span>Locale</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as LocaleCode)}
          style={{ padding: '0.3rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        >
          {localeOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} ({option.code})
            </option>
          ))}
        </select>
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <section style={panelStyle}>
          <strong style={{ fontSize: '0.95rem' }}>shadcn</strong>
          <ShadcnFilterBuilder
            schema={issueSchema}
            value={filter}
            onChange={setFilter}
            labels={labels}
          />
        </section>
        <section style={panelStyle}>
          <strong style={{ fontSize: '0.95rem' }}>Ant Design</strong>
          <AntdFilterBuilder
            schema={issueSchema}
            value={filter}
            onChange={setFilter}
            labels={labels}
          />
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Scenarios/i18n',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <I18nScenario />,
};
