/**
 * x-filter core benchmark harness.
 * Measures wall-clock time for all hot paths in packages/core.
 * Outputs "METRIC name=value" lines for autoresearch consumption.
 */

import { performance } from 'node:perf_hooks';
import { getDslCompletions } from '../src/dsl/completion';
import { astToFilter } from '../src/dsl/convert';
import { formatDSL } from '../src/dsl/format';
import { parse, parseDSL } from '../src/dsl/parse';
import { tokenize } from '../src/dsl/tokenize';
import { convertFromIC, convertToIC } from '../src/ic';
import { addRule, moveRule, removeRule, updateRule } from '../src/mutations';
import { fromJSON, toJSON } from '../src/serialize-json';
import { toSQL } from '../src/sql/index';
import { findById, findParent, flattenRules, walk } from '../src/traverse';
import { mapTree } from '../src/tree-map';
import type { Filter, FilterGroupIC } from '../src/types';
import { validate } from '../src/validate';
import { makeDslString, makeFilter, makeSchema, resetIds } from './fixture';

// ── Helpers ────────────────────────────────────────────────────────────

function bench(label: string, fn: () => void, iterations: number = 100): number {
  for (let i = 0; i < Math.min(10, iterations); i++) fn();

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const total = times.reduce((s, t) => s + t, 0);
  console.log(
    `  ${label}: median=${median.toFixed(3)}ms  p95=${p95.toFixed(3)}ms  total=${total.toFixed(1)}ms  n=${iterations}`
  );
  console.log(`METRIC ${label}=${median.toFixed(3)}`);
  return median;
}

// ── Fixture setup ──────────────────────────────────────────────────────

const RULE_COUNTS = [50, 100, 200];
const schema = makeSchema();

function buildFixtures(): Array<{
  label: string;
  filter: Filter;
  filterIC: FilterGroupIC;
  dsl: string;
}> {
  return RULE_COUNTS.map((n) => {
    resetIds();
    const filter = makeFilter(n);
    const filterIC = convertToIC(filter);
    const dsl = makeDslString(n);
    return { label: `${n}rules`, filter, filterIC, dsl };
  });
}

// ── Benchmarks ─────────────────────────────────────────────────────────

console.log('\n=== x-filter core benchmarks ===\n');

const fixtures = buildFixtures();

for (const fx of fixtures) {
  const L = fx.label;
  console.log(`\n--- ${L} ---`);

  // 1. tokenize
  const tokens = tokenize(fx.dsl);
  bench(`${L}_tokenize`, () => {
    tokenize(fx.dsl);
  });

  // 2. parse (token → AST)
  const parseResult = parse(tokens);
  if (!parseResult.ok || !parseResult.ast) throw new Error('bench fixture parse failed');
  const ast = parseResult.ast;
  bench(`${L}_parse`, () => {
    parse(tokens);
  });

  // 3. astToFilter (AST → Filter)
  bench(`${L}_astToFilter`, () => {
    astToFilter(ast);
  });

  // 4. parseDSL (full pipeline: string → Filter)
  bench(`${L}_parseDSL`, () => {
    parseDSL(fx.dsl);
  });
  // 4b. inline pipeline (tokenize+parse+astToFilter, no wrapper)
  bench(`${L}_dsl_inline`, () => {
    const t = tokenize(fx.dsl);
    const r = parse(t);
    if (r.ok && r.ast) astToFilter(r.ast);
  });

  // 4. formatDSL (Filter → DSL string)
  bench(`${L}_formatDSL`, () => {
    formatDSL(fx.filter);
  });

  // 5. validate (cold — no prevState)
  bench(`${L}_validate_cold`, () => {
    validate(fx.filter, schema);
  });

  // 6. validate (identity — with prevState, same filter ref)
  const firstValidation = validate(fx.filter, schema);
  bench(`${L}_validate_identity`, () => {
    validate(fx.filter, schema, { filter: fx.filter, errors: firstValidation.errors });
  });

  // 7. validate (mutated — update one rule, validate with prevState)
  const rules = flattenRules(fx.filter);
  const targetRule = rules[Math.floor(rules.length / 2)];
  const targetGroupId = findParent(fx.filter, targetRule.id)?.id ?? fx.filter.id;
  const mutatedFilter = updateRule(fx.filter, targetRule.id, { value: 'mutated' });
  const prevValidation = validate(fx.filter, schema);
  bench(`${L}_validate_after_mutation`, () => {
    validate(mutatedFilter, schema, { filter: fx.filter, errors: prevValidation.errors });
  });

  // 8. updateRule
  bench(`${L}_updateRule`, () => {
    updateRule(fx.filter, targetRule.id, { value: 'x' });
  });

  // 9. addRule
  const rootId = fx.filter.id;
  bench(`${L}_addRule`, () => {
    addRule(fx.filter, rootId, { field: 'status', operator: 'equals', value: 'open' });
  });

  // 10. removeRule
  const lastRule = rules[rules.length - 1];
  bench(`${L}_removeRule`, () => {
    removeRule(fx.filter, lastRule.id);
  });

  // 11. moveRule (same group, position 0)
  bench(`${L}_moveRule`, () => {
    moveRule(fx.filter, targetRule.id, targetGroupId, 0);
  });

  // 12. toSQL (standard)
  bench(`${L}_toSQL_standard`, () => {
    toSQL(fx.filter);
  });

  // 13. toSQL (IC — includes convertFromIC)
  bench(`${L}_toSQL_IC`, () => {
    toSQL(fx.filterIC);
  });

  // 14. convertToIC
  bench(`${L}_convertToIC`, () => {
    convertToIC(fx.filter);
  });

  // 15. convertFromIC
  bench(`${L}_convertFromIC`, () => {
    convertFromIC(fx.filterIC);
  });

  // 16. mapTree (full walk, identity visitor)
  bench(`${L}_mapTree_identity`, () => {
    mapTree(fx.filter, { onGroup: (g) => g, onRule: (r) => r });
  });

  // 17. walk (full traversal)
  bench(`${L}_walk`, () => {
    walk(fx.filter, () => {});
  });

  // 18. findById (last rule)
  bench(`${L}_findById_last`, () => {
    findById(fx.filter, lastRule.id);
  });

  // 19. flattenRules
  bench(`${L}_flattenRules`, () => {
    flattenRules(fx.filter);
  });

  // 20. toJSON
  bench(`${L}_toJSON`, () => {
    toJSON(fx.filter);
  });

  // 21. fromJSON
  const json = toJSON(fx.filter);
  bench(`${L}_fromJSON`, () => {
    fromJSON(json);
  });

  // 22. getDslCompletions (field prefix)
  bench(`${L}_getDslCompletions_field`, () => {
    getDslCompletions({ input: 'sta', cursor: 3, schema });
  });

  // 23. getDslCompletions (operator prefix — needs tokenize)
  bench(`${L}_getDslCompletions_operator`, () => {
    getDslCompletions({ input: 'status:eq', cursor: 9, schema });
  });

  // 24. getDslCompletions (value prefix — needs tokenize + field lookup)
  bench(`${L}_getDslCompletions_value`, () => {
    getDslCompletions({ input: 'status:equals:op', cursor: 15, schema });
  });

  // 25. validate IC (cold)
  bench(`${L}_validate_IC_cold`, () => {
    validate(fx.filterIC, schema);
  });
}

console.log('\n=== done ===\n');
