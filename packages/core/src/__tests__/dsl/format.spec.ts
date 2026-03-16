import { formatAST, formatDSL } from '../../dsl/format';
import type { ASTCondition, ASTNode, ASTValue } from '../../dsl/types';
import type { Filter } from '../../types';

const cond = (field: string, operator: string, value: ASTValue | null = null): ASTCondition => ({
  type: 'condition',
  field,
  operator,
  value,
  start: 0,
  end: 0,
});

const str = (v: string): ASTValue => ({ type: 'string', value: v });
const num = (v: number): ASTValue => ({ type: 'number', value: v });
const bool = (v: boolean): ASTValue => ({ type: 'boolean', value: v });
const arr = (...items: ASTValue[]): ASTValue => ({ type: 'array', value: items });
const range = (from: ASTValue, to: ASTValue): ASTValue => ({ type: 'range', from, to });

const and = (left: ASTNode, right: ASTNode): ASTNode => ({
  type: 'binary',
  operator: 'and',
  left,
  right,
  start: 0,
  end: 0,
});

const or = (left: ASTNode, right: ASTNode): ASTNode => ({
  type: 'binary',
  operator: 'or',
  left,
  right,
  start: 0,
  end: 0,
});

const not = (operand: ASTNode): ASTNode => ({
  type: 'not',
  operand,
  start: 0,
  end: 0,
});

const group = (expression: ASTNode): ASTNode => ({
  type: 'group',
  expression,
  start: 0,
  end: 0,
});

describe('formatAST', () => {
  describe('conditions', () => {
    it('formats simple condition', () => {
      expect(formatAST(cond('field', 'op', str('value')))).toBe('field:op:value');
    });

    it('formats unary condition (no value)', () => {
      expect(formatAST(cond('field', 'isEmpty'))).toBe('field:isEmpty');
    });

    it('formats condition with number value', () => {
      expect(formatAST(cond('age', 'gt', num(42)))).toBe('age:gt:42');
    });

    it('formats condition with boolean true', () => {
      expect(formatAST(cond('active', 'eq', bool(true)))).toBe('active:eq:true');
    });

    it('formats condition with boolean false', () => {
      expect(formatAST(cond('active', 'eq', bool(false)))).toBe('active:eq:false');
    });
  });

  describe('string quoting', () => {
    it('does not quote simple alphanumeric string', () => {
      expect(formatAST(cond('f', 'eq', str('hello')))).toBe('f:eq:hello');
    });

    it('quotes string with spaces', () => {
      expect(formatAST(cond('f', 'eq', str('hello world')))).toBe('f:eq:"hello world"');
    });

    it('quotes empty string', () => {
      expect(formatAST(cond('f', 'eq', str('')))).toBe('f:eq:""');
    });

    it('quotes keywords (AND, OR, NOT)', () => {
      expect(formatAST(cond('f', 'eq', str('AND')))).toBe('f:eq:"AND"');
      expect(formatAST(cond('f', 'eq', str('or')))).toBe('f:eq:"or"');
      expect(formatAST(cond('f', 'eq', str('not')))).toBe('f:eq:"not"');
    });

    it('quotes boolean-like strings', () => {
      expect(formatAST(cond('f', 'eq', str('true')))).toBe('f:eq:"true"');
      expect(formatAST(cond('f', 'eq', str('false')))).toBe('f:eq:"false"');
    });

    it('quotes numeric-like strings', () => {
      expect(formatAST(cond('f', 'eq', str('42')))).toBe('f:eq:"42"');
      expect(formatAST(cond('f', 'eq', str('3.14')))).toBe('f:eq:"3.14"');
    });

    it('quotes string with special characters', () => {
      expect(formatAST(cond('f', 'eq', str('a@b')))).toBe('f:eq:"a@b"');
    });

    it('quotes string containing dotdot', () => {
      expect(formatAST(cond('f', 'eq', str('a..b')))).toBe('f:eq:"a..b"');
    });

    it('allows dotted identifiers without quoting', () => {
      expect(formatAST(cond('f', 'eq', str('a.b')))).toBe('f:eq:a.b');
    });

    it('escapes quotes in strings', () => {
      expect(formatAST(cond('f', 'eq', str('say "hi"')))).toBe('f:eq:"say \\"hi\\""');
    });

    it('escapes backslashes in strings', () => {
      expect(formatAST(cond('f', 'eq', str('a\\b')))).toBe('f:eq:"a\\\\b"');
    });
  });

  describe('array values', () => {
    it('formats array of strings', () => {
      expect(formatAST(cond('f', 'in', arr(str('a'), str('b'), str('c'))))).toBe('f:in:[a,b,c]');
    });

    it('formats empty array', () => {
      expect(formatAST(cond('f', 'in', arr()))).toBe('f:in:[]');
    });

    it('formats array with quoted strings', () => {
      expect(formatAST(cond('f', 'in', arr(str('a b'), str('c'))))).toBe('f:in:["a b",c]');
    });
  });

  describe('range values', () => {
    it('formats range of numbers', () => {
      expect(formatAST(cond('age', 'between', range(num(1), num(5))))).toBe('age:between:{1..5}');
    });

    it('formats range of strings', () => {
      expect(formatAST(cond('f', 'between', range(str('a'), str('z'))))).toBe('f:between:{a..z}');
    });
  });

  describe('NOT', () => {
    it('formats NOT expression', () => {
      expect(formatAST(not(cond('f', 'eq', str('v'))))).toBe('NOT f:eq:v');
    });

    it('formats nested NOT', () => {
      expect(formatAST(not(not(cond('f', 'eq', str('v')))))).toBe('NOT NOT f:eq:v');
    });
  });

  describe('binary expressions', () => {
    it('formats AND', () => {
      expect(formatAST(and(cond('a', 'eq', num(1)), cond('b', 'eq', num(2))))).toBe(
        'a:eq:1 AND b:eq:2'
      );
    });

    it('formats OR', () => {
      expect(formatAST(or(cond('a', 'eq', num(1)), cond('b', 'eq', num(2))))).toBe(
        'a:eq:1 OR b:eq:2'
      );
    });
  });

  describe('precedence and parenthesization', () => {
    it('does not parenthesize AND inside OR', () => {
      const ast = or(
        cond('a', 'eq', num(1)),
        and(cond('b', 'eq', num(2)), cond('c', 'eq', num(3)))
      );
      expect(formatAST(ast)).toBe('a:eq:1 OR b:eq:2 AND c:eq:3');
    });

    it('parenthesizes OR inside AND', () => {
      const ast = and(
        or(cond('a', 'eq', num(1)), cond('b', 'eq', num(2))),
        cond('c', 'eq', num(3))
      );
      expect(formatAST(ast)).toBe('(a:eq:1 OR b:eq:2) AND c:eq:3');
    });

    it('parenthesizes OR on right side of AND', () => {
      const ast = and(
        cond('a', 'eq', num(1)),
        or(cond('b', 'eq', num(2)), cond('c', 'eq', num(3)))
      );
      expect(formatAST(ast)).toBe('a:eq:1 AND (b:eq:2 OR c:eq:3)');
    });

    it('does not parenthesize AND inside AND', () => {
      const ast = and(
        and(cond('a', 'eq', num(1)), cond('b', 'eq', num(2))),
        cond('c', 'eq', num(3))
      );
      expect(formatAST(ast)).toBe('a:eq:1 AND b:eq:2 AND c:eq:3');
    });

    it('does not parenthesize OR inside OR', () => {
      const ast = or(or(cond('a', 'eq', num(1)), cond('b', 'eq', num(2))), cond('c', 'eq', num(3)));
      expect(formatAST(ast)).toBe('a:eq:1 OR b:eq:2 OR c:eq:3');
    });

    it('formats explicit group node', () => {
      const ast = group(or(cond('a', 'eq', num(1)), cond('b', 'eq', num(2))));
      expect(formatAST(ast)).toBe('(a:eq:1 OR b:eq:2)');
    });
  });

  describe('NOT with binary precedence', () => {
    it('NOT applies to next atom only', () => {
      const ast = and(not(cond('a', 'eq', num(1))), cond('b', 'eq', num(2)));
      expect(formatAST(ast)).toBe('NOT a:eq:1 AND b:eq:2');
    });

    it('NOT with grouped binary', () => {
      const ast = not(group(or(cond('a', 'eq', num(1)), cond('b', 'eq', num(2)))));
      expect(formatAST(ast)).toBe('NOT (a:eq:1 OR b:eq:2)');
    });
  });
});

describe('formatDSL', () => {
  it('formats a simple filter with one rule', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [{ id: '2', field: 'status', operator: 'equals', value: 'active' }],
    };
    expect(formatDSL(filter)).toBe('status:equals:active');
  });

  it('formats a filter with multiple AND rules', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [
        { id: '2', field: 'a', operator: 'eq', value: 'x' },
        { id: '3', field: 'b', operator: 'eq', value: 'y' },
      ],
    };
    expect(formatDSL(filter)).toBe('a:eq:x AND b:eq:y');
  });

  it('formats a filter with OR combinator', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'or',
      conditions: [
        { id: '2', field: 'a', operator: 'eq', value: 'x' },
        { id: '3', field: 'b', operator: 'eq', value: 'y' },
      ],
    };
    expect(formatDSL(filter)).toBe('a:eq:x OR b:eq:y');
  });

  it('formats a filter with NOT on rule', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [{ id: '2', field: 'status', operator: 'eq', value: 'x', not: true }],
    };
    expect(formatDSL(filter)).toBe('NOT status:eq:x');
  });

  it('formats a filter with NOT on group', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      not: true,
      conditions: [
        { id: '2', field: 'a', operator: 'eq', value: 'x' },
        { id: '3', field: 'b', operator: 'eq', value: 'y' },
      ],
    };
    expect(formatDSL(filter)).toBe('NOT (a:eq:x AND b:eq:y)');
  });

  it('formats a filter with nested group', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [
        { id: '2', field: 'a', operator: 'eq', value: 'x' },
        {
          id: '3',
          combinator: 'or',
          conditions: [
            { id: '4', field: 'b', operator: 'eq', value: 'y' },
            { id: '5', field: 'c', operator: 'eq', value: 'z' },
          ],
        },
      ],
    };
    expect(formatDSL(filter)).toBe('a:eq:x AND (b:eq:y OR c:eq:z)');
  });

  it('formats a filter with number value', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [{ id: '2', field: 'age', operator: 'gt', value: 18 }],
    };
    expect(formatDSL(filter)).toBe('age:gt:18');
  });

  it('formats a filter with boolean value', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [{ id: '2', field: 'active', operator: 'eq', value: true }],
    };
    expect(formatDSL(filter)).toBe('active:eq:true');
  });

  it('formats a filter with array value', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [{ id: '2', field: 'tags', operator: 'in', value: ['a', 'b', 'c'] }],
    };
    expect(formatDSL(filter)).toBe('tags:in:[a,b,c]');
  });

  it('formats a filter with undefined value as unary', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [{ id: '2', field: 'status', operator: 'isEmpty', value: undefined }],
    };
    expect(formatDSL(filter)).toBe('status:isEmpty');
  });

  it('formats empty group as empty condition', () => {
    const filter: Filter = {
      id: '1',
      combinator: 'and',
      conditions: [],
    };
    expect(
      formatAST({ type: 'condition', field: '', operator: '', value: null, start: 0, end: 0 })
    ).toBe(':');
    expect(typeof formatDSL(filter)).toBe('string');
  });
});
