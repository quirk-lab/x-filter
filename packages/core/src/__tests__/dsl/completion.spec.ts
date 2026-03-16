import { getDslCompletions } from '../../dsl/completion';
import type { FieldSchema } from '../../types';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'notEquals', label: 'not equals', arity: 'binary' },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'in_progress', label: 'In Progress' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'gt', label: '>', arity: 'binary' },
    ],
  },
  {
    name: 'assignee',
    label: 'Assignee',
    type: 'text',
  },
];

describe('getDslCompletions', () => {
  describe('field completions', () => {
    it('returns all fields for empty input', () => {
      const items = getDslCompletions({ input: '', cursor: 0, schema });
      expect(items).toHaveLength(3);
      expect(items.every((i) => i.kind === 'field')).toBe(true);
      expect(items.map((i) => i.value)).toEqual(['status', 'priority', 'assignee']);
    });

    it('filters fields by prefix', () => {
      const items = getDslCompletions({ input: 'sta', cursor: 3, schema });
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ kind: 'field', value: 'status', label: 'Status' });
    });

    it('filters fields case-insensitively', () => {
      const items = getDslCompletions({ input: 'STA', cursor: 3, schema });
      expect(items).toHaveLength(1);
      expect(items[0].value).toBe('status');
    });

    it('filters by label too', () => {
      const items = getDslCompletions({ input: 'Pri', cursor: 3, schema });
      expect(items).toHaveLength(1);
      expect(items[0].value).toBe('priority');
    });

    it('returns empty array when no fields match', () => {
      const items = getDslCompletions({ input: 'xyz', cursor: 3, schema });
      expect(items).toEqual([]);
    });

    it('includes field type as detail', () => {
      const items = getDslCompletions({ input: '', cursor: 0, schema });
      const statusItem = items.find((i) => i.value === 'status');
      expect(statusItem?.detail).toBe('select');
    });
  });

  describe('operator completions', () => {
    it('returns operators after field colon', () => {
      const items = getDslCompletions({ input: 'status:', cursor: 7, schema });
      expect(items).toHaveLength(2);
      expect(items.every((i) => i.kind === 'operator')).toBe(true);
      expect(items.map((i) => i.value)).toEqual(['equals', 'notEquals']);
    });

    it('filters operators by prefix', () => {
      const items = getDslCompletions({ input: 'status:eq', cursor: 9, schema });
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ kind: 'operator', value: 'equals' });
    });

    it('returns empty when field has no operators', () => {
      const items = getDslCompletions({ input: 'assignee:', cursor: 9, schema });
      expect(items).toEqual([]);
    });

    it('returns empty for unknown field', () => {
      const items = getDslCompletions({ input: 'unknown:', cursor: 8, schema });
      expect(items).toEqual([]);
    });

    it('includes arity as detail', () => {
      const items = getDslCompletions({ input: 'status:', cursor: 7, schema });
      expect(items[0].detail).toBe('binary');
    });
  });

  describe('value completions', () => {
    it('returns values after operator colon', () => {
      const items = getDslCompletions({ input: 'status:equals:', cursor: 14, schema });
      expect(items).toHaveLength(3);
      expect(items.every((i) => i.kind === 'value')).toBe(true);
      expect(items.map((i) => i.value)).toEqual(['open', 'closed', 'in_progress']);
    });

    it('filters values by prefix', () => {
      const items = getDslCompletions({ input: 'status:equals:op', cursor: 16, schema });
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ kind: 'value', value: 'open', label: 'Open' });
    });

    it('filters values case-insensitively', () => {
      const items = getDslCompletions({ input: 'status:equals:CL', cursor: 16, schema });
      expect(items).toHaveLength(1);
      expect(items[0].value).toBe('closed');
    });

    it('filters values by label', () => {
      const items = getDslCompletions({ input: 'status:equals:In', cursor: 16, schema });
      expect(items).toHaveLength(1);
      expect(items[0].value).toBe('in_progress');
    });

    it('returns empty for field without values', () => {
      const items = getDslCompletions({ input: 'priority:equals:', cursor: 16, schema });
      expect(items).toEqual([]);
    });

    it('returns empty for unknown field', () => {
      const items = getDslCompletions({ input: 'unknown:op:', cursor: 11, schema });
      expect(items).toEqual([]);
    });
  });

  describe('context after space (new condition)', () => {
    it('returns all fields after complete condition and space', () => {
      const items = getDslCompletions({ input: 'status:equals:open ', cursor: 19, schema });
      expect(items).toHaveLength(3);
      expect(items.every((i) => i.kind === 'field')).toBe(true);
    });

    it('returns fields after AND keyword and space', () => {
      const items = getDslCompletions({ input: 'status:equals:open AND ', cursor: 23, schema });
      expect(items).toHaveLength(3);
      expect(items.every((i) => i.kind === 'field')).toBe(true);
    });

    it('filters fields after space with partial input', () => {
      const items = getDslCompletions({ input: 'status:equals:open AND pri', cursor: 26, schema });
      expect(items).toHaveLength(1);
      expect(items[0].value).toBe('priority');
    });
  });

  describe('edge cases', () => {
    it('handles cursor at beginning of non-empty input', () => {
      const items = getDslCompletions({ input: 'status:equals:open', cursor: 0, schema });
      expect(items).toHaveLength(3);
    });

    it('handles cursor in middle of field name', () => {
      const items = getDslCompletions({ input: 'status', cursor: 3, schema });
      expect(items).toHaveLength(1);
      expect(items[0].value).toBe('status');
    });

    it('works with empty schema', () => {
      const items = getDslCompletions({ input: '', cursor: 0, schema: [] });
      expect(items).toEqual([]);
    });

    it('returns all field completions after opening paren', () => {
      const items = getDslCompletions({ input: '(', cursor: 1, schema });
      expect(items).toHaveLength(3);
    });
  });
});
