import { defaultOperators, getOperators } from '../operators';

describe('getOperators', () => {
  it("getOperators('text') returns 8 operators including equals, contains, isEmpty, isNotEmpty, startsWith, endsWith", () => {
    const ops = getOperators('text');
    expect(ops).toHaveLength(8);
    const names = ops.map((o) => o.name);
    expect(names).toContain('equals');
    expect(names).toContain('contains');
    expect(names).toContain('isEmpty');
    expect(names).toContain('isNotEmpty');
    expect(names).toContain('startsWith');
    expect(names).toContain('endsWith');
  });

  it("getOperators('number') returns 9 operators including between (ternary), gt, gte, lt, lte", () => {
    const ops = getOperators('number');
    expect(ops).toHaveLength(9);
    const names = ops.map((o) => o.name);
    expect(names).toContain('between');
    expect(names).toContain('gt');
    expect(names).toContain('gte');
    expect(names).toContain('lt');
    expect(names).toContain('lte');
    const between = ops.find((o) => o.name === 'between');
    expect(between?.arity).toBe('ternary');
  });

  it("getOperators('date') returns 7 operators including before, after, between", () => {
    const ops = getOperators('date');
    expect(ops).toHaveLength(7);
    const names = ops.map((o) => o.name);
    expect(names).toContain('before');
    expect(names).toContain('after');
    expect(names).toContain('between');
  });

  it("getOperators('select') returns 4 operators", () => {
    const ops = getOperators('select');
    expect(ops).toHaveLength(4);
  });

  it("getOperators('multiSelect') returns 4 operators with contains, notContains", () => {
    const ops = getOperators('multiSelect');
    expect(ops).toHaveLength(4);
    const names = ops.map((o) => o.name);
    expect(names).toContain('contains');
    expect(names).toContain('notContains');
  });

  it("getOperators('boolean') returns 1 operator (equals)", () => {
    const ops = getOperators('boolean');
    expect(ops).toHaveLength(1);
    expect(ops[0].name).toBe('equals');
  });

  it('custom operators override defaults', () => {
    const custom = [{ name: 'custom', label: 'Custom', arity: 'binary' as const }];
    const ops = getOperators('text', custom);
    expect(ops).toHaveLength(1);
    expect(ops[0].name).toBe('custom');
  });

  it("isEmpty has arity 'unary'", () => {
    const ops = getOperators('text');
    const isEmpty = ops.find((o) => o.name === 'isEmpty');
    expect(isEmpty?.arity).toBe('unary');
  });

  it("between has arity 'ternary'", () => {
    const ops = getOperators('number');
    const between = ops.find((o) => o.name === 'between');
    expect(between?.arity).toBe('ternary');
  });

  it("equals has arity 'binary'", () => {
    const ops = getOperators('text');
    const equals = ops.find((o) => o.name === 'equals');
    expect(equals?.arity).toBe('binary');
  });
});

describe('defaultOperators', () => {
  it('has all 6 field types', () => {
    const fieldTypes = ['text', 'number', 'date', 'select', 'multiSelect', 'boolean'] as const;
    for (const ft of fieldTypes) {
      expect(defaultOperators[ft]).toBeDefined();
      expect(Array.isArray(defaultOperators[ft])).toBe(true);
    }
  });
});
