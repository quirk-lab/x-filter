/**
 * Realistic fixture generator for x-filter benchmarks.
 * Produces filter trees with 50–200 rules across 20+ fields.
 */

import { convertToIC } from '../src/ic';
import type { FieldSchema, Filter, FilterGroup, FilterGroupIC, FilterRule } from '../src/types';

// ── Deterministic PRNG (mulberry32) ───────────────────────────────────

let rngState = 1;
function seedRng(seed: number): void {
  rngState = seed;
}
function random(): number {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

let idCounter = 0;
function makeId(): string {
  return `n${(idCounter++).toString(36)}`;
}

export function resetIds(): void {
  idCounter = 0;
  seedRng(42);
}

// ── 25 fields covering all FieldType variants ──────────────────────────

const ALL_TYPES: FieldSchema['type'][] = [
  'text',
  'number',
  'date',
  'select',
  'multiSelect',
  'boolean',
];

function buildFieldDefs(
  count: number
): Array<{ name: string; label: string; type: FieldSchema['type'] }> {
  const defs: Array<{ name: string; label: string; type: FieldSchema['type'] }> = [];
  for (let i = 0; i < count; i++) {
    const type = ALL_TYPES[i % ALL_TYPES.length];
    defs.push({ name: `field_${i}`, label: `Field ${i}`, type });
  }
  return defs;
}

const FIELD_COUNT = 80;
const FIELD_DEFS = buildFieldDefs(FIELD_COUNT);

const SELECT_OPTIONS = ['opt_a', 'opt_b', 'opt_c', 'opt_d', 'opt_e'];

export function makeSchema(): FieldSchema[] {
  return FIELD_DEFS.map((f) => {
    const s: FieldSchema = { name: f.name, label: f.label, type: f.type };
    if (f.type === 'select') {
      s.values = SELECT_OPTIONS.map((v) => ({ value: v, label: v }));
    }
    return s;
  });
}

// ── Operator sets per field type ───────────────────────────────────────

const TEXT_OPS = [
  'equals',
  'notEquals',
  'contains',
  'startsWith',
  'endsWith',
  'isEmpty',
  'isNotEmpty',
];
const NUM_OPS = [
  'equals',
  'notEquals',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'isEmpty',
  'isNotEmpty',
];
const DATE_OPS = ['equals', 'notEquals', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'];
const SELECT_OPS = ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'];
const MULTI_OPS = ['contains', 'notContains', 'isEmpty', 'isNotEmpty'];
const BOOL_OPS = ['equals'];

function opsForType(type: FieldSchema['type']): string[] {
  switch (type) {
    case 'text':
      return TEXT_OPS;
    case 'number':
      return NUM_OPS;
    case 'date':
      return DATE_OPS;
    case 'select':
      return SELECT_OPS;
    case 'multiSelect':
      return MULTI_OPS;
    case 'boolean':
      return BOOL_OPS;
  }
}

function randomValue(field: FieldSchema): unknown {
  switch (field.type) {
    case 'text':
      return `value_${random().toString(36).slice(2, 8)}`;
    case 'number':
      return Math.floor(random() * 1000);
    case 'date':
      return `2024-${String(Math.floor(random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(random() * 28) + 1).padStart(2, '0')}`;
    case 'select':
      return field.values?.[Math.floor(random() * field.values.length)]?.value ?? 'open';
    case 'multiSelect':
      return field.values?.[0]?.value ?? 'tag1';
    case 'boolean':
      return random() > 0.5;
  }
}

// ── Standard filter tree builder ──────────────────────────────────────

function makeRule(schema: FieldSchema[]): FilterRule {
  const field = schema[Math.floor(random() * schema.length)];
  const ops = opsForType(field.type);
  const op = ops[Math.floor(random() * ops.length)];
  let value: unknown;
  if (op === 'isEmpty' || op === 'isNotEmpty') {
    value = null;
  } else if (op === 'between') {
    value = [randomValue(field), randomValue(field)];
  } else {
    value = randomValue(field);
  }
  return { id: makeId(), field: field.name, operator: op, value };
}

/**
 * Build a standard filter tree with approximately `targetRules` rules,
 * nested up to `maxDepth` levels deep.
 */
export function makeFilter(targetRules: number = 100, maxDepth: number = 3): Filter {
  const schema = makeSchema();
  idCounter = 0;

  function buildGroup(remaining: number, depth: number): FilterGroup {
    const children: (FilterRule | FilterGroup)[] = [];
    let left = remaining;

    while (left > 0) {
      if (depth < maxDepth && left > 5 && random() < 0.25) {
        // nested group
        const groupSize = Math.max(2, Math.floor(left * (0.2 + random() * 0.3)));
        children.push(buildGroup(groupSize, depth + 1));
        left -= groupSize;
      } else {
        children.push(makeRule(schema));
        left--;
      }
    }

    return {
      id: makeId(),
      combinator: random() > 0.3 ? 'and' : 'or',
      children,
    };
  }

  return buildGroup(targetRules, 0);
}

/**
 * Build an IC variant of the same logical tree.
 */
export function makeFilterIC(targetRules: number = 100): FilterGroupIC {
  return convertToIC(makeFilter(targetRules));
}

// ── DSL string builder (for tokenize/parse benchmarks) ────────────────

/**
 * Build a DSL string with `n` conditions joined by AND/OR.
 */
export function makeDslString(n: number = 50): string {
  const schema = makeSchema();
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const field = schema[i % schema.length];
    const ops = opsForType(field.type);
    const op = ops[0];
    let val: string;
    switch (field.type) {
      case 'text':
        val = `"test${i}"`;
        break;
      case 'number':
        val = String(i * 10);
        break;
      case 'date':
        val = `"2024-01-${String((i % 28) + 1).padStart(2, '0')}"`;
        break;
      case 'boolean':
        val = i % 2 === 0 ? 'true' : 'false';
        break;
      default:
        val = `"val${i}"`;
        break;
    }
    const combinator = i % 3 === 0 ? ' OR ' : ' AND ';
    if (op === 'isEmpty' || op === 'isNotEmpty') {
      parts.push(`${field.name}:${op}`);
    } else {
      parts.push(`${field.name}:${op}:${val}`);
    }
    if (i < n - 1) parts.push(combinator);
  }
  return parts.join(' ');
}
