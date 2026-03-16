import { toSQL } from '../../sql/index';
import type { FilterAny } from '../../types';

describe('toSQL', () => {
  it('empty filter returns { sql: "", params: [] }', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [],
    };
    const result = toSQL(filter);
    expect(result).toEqual({ sql: '', params: [] });
  });

  it('single equals rule: name = ? with params [John]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name = ?');
    expect(result.params).toEqual(['John']);
  });

  it('single notEquals: name <> ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'notEquals', value: 'Jane' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name <> ?');
    expect(result.params).toEqual(['Jane']);
  });

  it('AND combination: (name = ? AND age > ?) with correct params', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('(name = ? AND age > ?)');
    expect(result.params).toEqual(['John', 18]);
  });

  it('OR combination: (name = ? OR age > ?)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'or',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('(name = ? OR age > ?)');
    expect(result.params).toEqual(['John', 18]);
  });

  it('contains: name LIKE ? with params [%John%]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'contains', value: 'John' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name LIKE ?');
    expect(result.params).toEqual(['%John%']);
  });

  it('notContains: name NOT LIKE ? with params [%John%]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'notContains', value: 'John' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name NOT LIKE ?');
    expect(result.params).toEqual(['%John%']);
  });

  it('startsWith: name LIKE ? with params [John%]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'startsWith', value: 'John' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name LIKE ?');
    expect(result.params).toEqual(['John%']);
  });

  it('endsWith: name LIKE ? with params [%John]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'endsWith', value: 'John' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name LIKE ?');
    expect(result.params).toEqual(['%John']);
  });

  it('gt: age > ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'age', operator: 'gt', value: 18 }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('age > ?');
    expect(result.params).toEqual([18]);
  });

  it('gte: age >= ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'age', operator: 'gte', value: 18 }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('age >= ?');
    expect(result.params).toEqual([18]);
  });

  it('lt: age < ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'age', operator: 'lt', value: 65 }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('age < ?');
    expect(result.params).toEqual([65]);
  });

  it('lte: age <= ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'age', operator: 'lte', value: 65 }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('age <= ?');
    expect(result.params).toEqual([65]);
  });

  it('between: age BETWEEN ? AND ? with params [18, 65]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'age', operator: 'between', value: [18, 65] }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('age BETWEEN ? AND ?');
    expect(result.params).toEqual([18, 65]);
  });

  it('before (date): birthday < ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'birthday', operator: 'before', value: '2020-01-01' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('birthday < ?');
    expect(result.params).toEqual(['2020-01-01']);
  });

  it('after (date): birthday > ?', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'birthday', operator: 'after', value: '2020-01-01' }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('birthday > ?');
    expect(result.params).toEqual(['2020-01-01']);
  });

  it('isEmpty: name IS NULL with params []', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'isEmpty', value: null }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name IS NULL');
    expect(result.params).toEqual([]);
  });

  it('isNotEmpty: name IS NOT NULL with params []', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'isNotEmpty', value: null }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name IS NOT NULL');
    expect(result.params).toEqual([]);
  });

  it('NOT on rule: NOT (name = ?) with params [John]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('NOT (name = ?)');
    expect(result.params).toEqual(['John']);
  });

  it('NOT on group: wraps group with NOT', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      not: true,
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('NOT (name = ? AND age > ?)');
    expect(result.params).toEqual(['John', 18]);
  });

  it('nested groups with correct parentheses', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            { id: 'r2', field: 'age', operator: 'lt', value: 18 },
            { id: 'r3', field: 'age', operator: 'gt', value: 65 },
          ],
        },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('(name = ? AND (age < ? OR age > ?))');
    expect(result.params).toEqual(['John', 18, 65]);
  });

  it('complex: nested groups with AND/OR/NOT', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'or',
      conditions: [
        {
          id: 'g1',
          combinator: 'and',
          not: true,
          conditions: [
            { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
            { id: 'r2', field: 'age', operator: 'gt', value: 18 },
          ],
        },
        { id: 'r3', field: 'status', operator: 'equals', value: 'active' },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('(NOT (name = ? AND age > ?) OR status = ?)');
    expect(result.params).toEqual(['John', 18, 'active']);
  });

  it('filter with empty nested group produces correct SQL', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'and',
          conditions: [],
        },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('name = ?');
    expect(result.params).toEqual(['John']);
  });

  it('group with only empty subgroups returns empty SQL', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'g1', combinator: 'and', conditions: [] },
        { id: 'g2', combinator: 'or', conditions: [] },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('');
    expect(result.params).toEqual([]);
  });

  it('IC mode filter converts to standard and generates SQL', () => {
    const filter: FilterAny = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('(name = ? AND age > ?)');
    expect(result.params).toEqual(['John', 18]);
  });

  it('NOT on single-condition group', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      not: true,
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      ],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('NOT (name = ?)');
    expect(result.params).toEqual(['John']);
  });

  it('unknown operator falls back to field operator value pattern', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'score', operator: 'customOp', value: 42 }],
    };
    const result = toSQL(filter);
    expect(result.sql).toBe('score customOp ?');
    expect(result.params).toEqual([42]);
  });
});
