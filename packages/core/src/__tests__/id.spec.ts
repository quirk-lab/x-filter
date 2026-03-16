import { generateId, resetIdCounter } from '../id';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values on consecutive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('generated IDs have the expected format (contains hyphens)', () => {
    const id = generateId();
    expect(id).toMatch(/-/);
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });
});

describe('resetIdCounter', () => {
  it('resets the counter portion', () => {
    generateId();
    generateId();
    resetIdCounter();
    const idAfterReset = generateId();
    const parts = idAfterReset.split('-');
    expect(parts[parts.length - 1]).toBe('0');
  });
});
