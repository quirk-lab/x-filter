import { render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
};

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  });
}

describe('AntdFilterBuilder responsive layout', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, 'matchMedia', original);
    } else {
      delete (window as { matchMedia?: unknown }).matchMedia;
    }
  });

  test('uses a horizontal Space on desktop (no matchMedia / wide viewport)', () => {
    installMatchMedia(false);
    render(<AntdFilterBuilder schema={schema} value={filter} />);

    const space = screen.getByLabelText('Value').closest('.ant-space');
    expect(space?.className).toContain('ant-space-horizontal');
    expect(space?.className).not.toContain('ant-space-vertical');
  });

  test('stacks the rule controls vertically on a narrow viewport', () => {
    installMatchMedia(true);
    render(<AntdFilterBuilder schema={schema} value={filter} />);

    const space = screen.getByLabelText('Value').closest('.ant-space');
    expect(space?.className).toContain('ant-space-vertical');
  });
});
