# Extract Shared Logic to Headless Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate ~70% line-level duplication between `@x-filter/shadcn` and `@x-filter/antd` by extracting framework-agnostic orchestration logic into `@x-filter/react`.

**Architecture:** Three-layer separation in `@x-filter/react`: (1) pure utility functions (no React, no state), (2) stateful logic hooks (return data/closures, no JSX), (3) JSX assembly stays in UI packages. The orchestrator hook `useFilterBuilderOrchestrator` receives raw props, internally calls `useFilterBuilder`/`useFilterViewModel`/`useReorderContract`, and returns passthrough values + orchestration closures. Render decisions (`resolveRuleRender`/`resolveGroupRender`) return pure enums — UI packages assemble their own JSX. `MoveControls` is an exception: pure native HTML, moves to react package.

**Tech Stack:** TypeScript 5.6+, React 18, Jest 29 + ts-jest (ESM preset), @testing-library/react, Biome linter, tsup bundler, pnpm 9 workspaces.

**Key References:**
- ADR: `docs/adr/0005-filter-builder-orchestrator-in-react.md`
- Glossary: `CONTEXT.md`
- PRD: `specs/004-ui-modules/prd.md` (US-4 勘误)

**Monorepo Structure:**
```
packages/
├── core/     # @x-filter/core — framework-agnostic filter model
├── react/    # @x-filter/react — headless hooks + shared utils (TARGET for extraction)
├── shadcn/   # @x-filter/shadcn — shadcn/Tailwind UI adapters
└── antd/     # @x-filter/antd — Ant Design v5 UI adapters
```

**Test Commands:**
- All tests: `pnpm test` (runs jest with all projects, `--runInBand`)
- Single package: `pnpm exec jest --selectProjects react --runInBand`
- Single test file: `pnpm exec jest --runInBand <path-to-spec-file>`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm check`

**Import Convention:** UI packages import from `@x-filter/react` and `@x-filter/core`. The jest config maps `^@x-filter/(.*)$` to `packages/$1/src`, so imports resolve to source (no build needed for tests).

**Commit Convention:** Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`). Include `Generated with [Devin](https://devin.ai)` footer and Co-Authored-By.

---

## Task 1: Extract `rule-defaults.ts` to `@x-filter/react`

**Files:**
- Create: `packages/react/src/rule-defaults.ts`
- Create: `packages/react/src/__tests__/rule-defaults.spec.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/filter-builder.tsx` (import line)
- Modify: `packages/shadcn/src/components/rule-defaults.ts` (delete file)
- Modify: `packages/antd/src/components/filter-builder.tsx` (import line)
- Modify: `packages/antd/src/components/rule-defaults.ts` (delete file)

**Step 1: Write the failing test**

Create `packages/react/src/__tests__/rule-defaults.spec.ts`:

```typescript
import type { FieldSchema } from '@x-filter/core';
import { getDefaultRuleUpdatesForField } from '../rule-defaults';

const schema: FieldSchema[] = [
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [
      { name: 'gt', label: '>', arity: 'binary' },
      { name: 'isEmpty', label: 'is empty', arity: 'unary' },
    ],
    defaultOperator: 'gt',
    defaultValue: 0,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    values: [{ value: 'active', label: 'Active' }],
  },
];

describe('getDefaultRuleUpdatesForField', () => {
  it('returns field, operator, and default value for a binary field', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'age');
    expect(result).toEqual({ field: 'age', operator: 'gt', value: 0 });
  });

  it('returns undefined value for unary operator', () => {
    const schemaWithUnaryDefault: FieldSchema[] = [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        operators: [{ name: 'isEmpty', label: 'is empty', arity: 'unary' }],
        defaultOperator: 'isEmpty',
      },
    ];
    const result = getDefaultRuleUpdatesForField(schemaWithUnaryDefault, 'name');
    expect(result).toEqual({ field: 'name', operator: 'isEmpty', value: undefined });
  });

  it('falls back to first operator when no defaultOperator', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'status');
    expect(result).toEqual({ field: 'status', operator: '', value: null });
  });

  it('returns null value when field has no defaultValue', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'status');
    expect(result.value).toBeNull();
  });

  it('handles unknown field name', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'nonexistent');
    expect(result).toEqual({ field: 'nonexistent', operator: '', value: null });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/rule-defaults.spec.ts`
Expected: FAIL with "Cannot find module '../rule-defaults'"

**Step 3: Write minimal implementation**

Create `packages/react/src/rule-defaults.ts` — copy the exact content from `packages/shadcn/src/components/rule-defaults.ts`:

```typescript
import { type FieldSchema, type FilterRule, getOperators } from '@x-filter/core';

/**
 * @internal
 * Computes the default rule updates when a field changes.
 * Used by FilterBuilder orchestrator in UI packages.
 */
export function getDefaultRuleUpdatesForField(
  schema: FieldSchema[],
  fieldName: string
): Partial<Omit<FilterRule, 'id'>> {
  const field = schema.find((candidate) => candidate.name === fieldName);
  const operators = field ? getOperators(field.type, field.operators) : [];
  const operator = field?.defaultOperator ?? operators[0]?.name ?? '';
  const operatorDef = operators.find((candidate) => candidate.name === operator);
  const value =
    operatorDef?.arity === 'unary'
      ? undefined
      : field && field.defaultValue !== undefined
        ? field.defaultValue
        : null;

  return { field: fieldName, operator, value };
}
```

**Step 4: Add export to index.ts**

In `packages/react/src/index.ts`, add after the existing exports (before the `useValidatedInput` function or after the type exports block):

```typescript
export { getDefaultRuleUpdatesForField } from './rule-defaults';
```

**Step 5: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/rule-defaults.spec.ts`
Expected: PASS (5 tests)

**Step 6: Update shadcn to import from react package**

In `packages/shadcn/src/components/filter-builder.tsx`, change line 21:

```typescript
// Before:
import { getDefaultRuleUpdatesForField } from './rule-defaults';
// After:
import { getDefaultRuleUpdatesForField } from '@x-filter/react';
```

Delete `packages/shadcn/src/components/rule-defaults.ts`.

**Step 7: Update antd to import from react package**

In `packages/antd/src/components/filter-builder.tsx`, change line 21:

```typescript
// Before:
import { getDefaultRuleUpdatesForField } from './rule-defaults';
// After:
import { getDefaultRuleUpdatesForField } from '@x-filter/react';
```

Delete `packages/antd/src/components/rule-defaults.ts`.

**Step 8: Run full test suite to verify no regressions**

Run: `pnpm test`
Expected: ALL PASS (existing tests should be unaffected — behavior is identical, only import source changed)

**Step 9: Commit**

```bash
git add packages/react/src/rule-defaults.ts packages/react/src/__tests__/rule-defaults.spec.ts packages/react/src/index.ts packages/shadcn/src/components/filter-builder.tsx packages/antd/src/components/filter-builder.tsx
git rm packages/shadcn/src/components/rule-defaults.ts packages/antd/src/components/rule-defaults.ts
git commit -m "$(cat <<'EOF'
refactor: extract rule-defaults to @x-filter/react

Move getDefaultRuleUpdatesForField from shadcn/antd duplicates into
@x-filter/react as a shared @internal utility. UI packages now import
from react package.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 2: Extract schema query utils (`findSchemaField`/`getFieldOperators`/`findOperator`) to `@x-filter/react`

**Files:**
- Create: `packages/react/src/schema-utils.ts`
- Create: `packages/react/src/__tests__/schema-utils.spec.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/operator-selector.tsx` (remove local defs, import from react)
- Modify: `packages/shadcn/src/components/value-editor.tsx` (change import)
- Modify: `packages/antd/src/components/operator-selector.tsx` (remove local defs, import from react)
- Modify: `packages/antd/src/components/value-editor.tsx` (change import)

**Step 1: Write the failing test**

Create `packages/react/src/__tests__/schema-utils.spec.ts`:

```typescript
import type { FieldSchema } from '@x-filter/core';
import { findSchemaField, findOperator, getFieldOperators } from '../schema-utils';

const schema: FieldSchema[] = [
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [
      { name: 'gt', label: '>', arity: 'binary' },
      { name: 'lt', label: '<', arity: 'binary' },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

describe('findSchemaField', () => {
  it('finds a field by name', () => {
    expect(findSchemaField(schema, 'age')?.name).toBe('age');
  });

  it('returns undefined for unknown field', () => {
    expect(findSchemaField(schema, 'nonexistent')).toBeUndefined();
  });

  it('returns undefined when fieldName is undefined', () => {
    expect(findSchemaField(schema, undefined)).toBeUndefined();
  });
});

describe('getFieldOperators', () => {
  it('returns operators for a field', () => {
    const field = findSchemaField(schema, 'age');
    expect(getFieldOperators(field)).toHaveLength(2);
  });

  it('returns empty array when field is undefined', () => {
    expect(getFieldOperators(undefined)).toEqual([]);
  });
});

describe('findOperator', () => {
  it('finds an operator by name', () => {
    const field = findSchemaField(schema, 'age');
    expect(findOperator(field, 'gt')?.name).toBe('gt');
  });

  it('returns undefined for unknown operator', () => {
    const field = findSchemaField(schema, 'age');
    expect(findOperator(field, 'nonexistent')).toBeUndefined();
  });

  it('returns undefined when field is undefined', () => {
    expect(findOperator(undefined, 'gt')).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/schema-utils.spec.ts`
Expected: FAIL with "Cannot find module '../schema-utils'"

**Step 3: Write minimal implementation**

Create `packages/react/src/schema-utils.ts`:

```typescript
import { type FieldSchema, getOperators, type OperatorDef } from '@x-filter/core';

/**
 * @internal
 * Finds a field schema by name from a schema array.
 */
export function findSchemaField(
  schema: FieldSchema[],
  fieldName?: string
): FieldSchema | undefined {
  return schema.find((field) => field.name === fieldName);
}

/**
 * @internal
 * Returns the available operators for a field, or empty array if field is undefined.
 */
export function getFieldOperators(field?: FieldSchema): OperatorDef[] {
  return field ? getOperators(field.type, field.operators) : [];
}

/**
 * @internal
 * Finds an operator definition by name within a field's operators.
 */
export function findOperator(
  field: FieldSchema | undefined,
  operatorName: string
): OperatorDef | undefined {
  return getFieldOperators(field).find((operator) => operator.name === operatorName);
}
```

**Step 4: Add exports to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export { findSchemaField, getFieldOperators, findOperator } from './schema-utils';
```

**Step 5: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/schema-utils.spec.ts`
Expected: PASS

**Step 6: Update shadcn operator-selector.tsx**

In `packages/shadcn/src/components/operator-selector.tsx`, remove the local `getFieldOperators` and `findSchemaField` function definitions (lines 15-24) and change the import to pull them from `@x-filter/react`:

```typescript
import { type FieldSchema, type FilterRule, type OperatorDef } from '@x-filter/core';
import { findSchemaField, getFieldOperators } from '@x-filter/react';
import type { ChangeEvent } from 'react';
import { Select } from './primitives';

export interface ShadcnOperatorSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  field?: FieldSchema;
  value?: string;
  disabled?: boolean;
  className?: string;
  onChange: (operatorName: string) => void;
}

export function ShadcnOperatorSelector({
  schema,
  rule,
  field,
  value,
  disabled,
  className,
  onChange,
}: ShadcnOperatorSelectorProps) {
  const selectedField = field ?? findSchemaField(schema, rule?.field);
  const operators = getFieldOperators(selectedField);

  return (
    <Select
      aria-label="Operator"
      className={className}
      disabled={disabled || operators.length === 0}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      options={operators.map((operator) => ({ value: operator.name, label: operator.label }))}
      placeholder="Select operator"
      value={value ?? rule?.operator ?? ''}
    />
  );
}
```

**Step 7: Update shadcn value-editor.tsx**

In `packages/shadcn/src/components/value-editor.tsx`, change line 3:

```typescript
// Before:
import { findSchemaField, getFieldOperators } from './operator-selector';
// After:
import { findSchemaField, findOperator } from '@x-filter/react';
```

Also remove the local `findOperator` function definition (lines 16-21) since it's now imported from react.

**Step 8: Update antd operator-selector.tsx**

Same pattern as Step 6 — remove local `getFieldOperators`/`findSchemaField` defs, import from `@x-filter/react`:

```typescript
import { type FieldSchema, type FilterRule, type OperatorDef } from '@x-filter/core';
import { findSchemaField, getFieldOperators } from '@x-filter/react';
import { Select } from 'antd';

export interface AntdOperatorSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  field?: FieldSchema;
  value?: string;
  disabled?: boolean;
  className?: string;
  onChange: (operatorName: string) => void;
}

export function AntdOperatorSelector({
  schema,
  rule,
  field,
  value,
  disabled,
  className,
  onChange,
}: AntdOperatorSelectorProps) {
  const selectedField = field ?? findSchemaField(schema, rule?.field);
  const operators = getFieldOperators(selectedField);

  return (
    <Select
      aria-label="Operator"
      className={className}
      disabled={disabled || operators.length === 0}
      onChange={(operatorName) => onChange(operatorName)}
      options={operators.map((operator) => ({ value: operator.name, label: operator.label }))}
      placeholder="Select operator"
      value={value ?? rule?.operator}
    />
  );
}
```

**Step 9: Update antd value-editor.tsx**

In `packages/antd/src/components/value-editor.tsx`, change line 4:

```typescript
// Before:
import { findSchemaField, getFieldOperators } from './operator-selector';
// After:
import { findSchemaField, findOperator } from '@x-filter/react';
```

Remove the local `findOperator` function definition (lines 16-21).

**Step 10: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 11: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract schema query utils to @x-filter/react

Move findSchemaField, getFieldOperators, findOperator from shadcn/antd
duplicates into @x-filter/react as shared @internal utilities.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 3: Extract value conversion utils to `@x-filter/react`

**Files:**
- Create: `packages/react/src/value-utils.ts`
- Create: `packages/react/src/__tests__/value-utils.spec.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/value-editor.tsx` (remove local defs, import from react)
- Modify: `packages/antd/src/components/value-editor.tsx` (remove local defs, import from react)

**Step 1: Write the failing test**

Create `packages/react/src/__tests__/value-utils.spec.ts`:

```typescript
import {
  asStringValue,
  asArrayValue,
  asPairValue,
  parseNumberInput,
  updatePairValue,
} from '../value-utils';

describe('asStringValue', () => {
  it('returns string values as-is', () => {
    expect(asStringValue('hello')).toBe('hello');
  });

  it('returns empty string for null/undefined', () => {
    expect(asStringValue(null)).toBe('');
    expect(asStringValue(undefined)).toBe('');
  });

  it('stringifies other types', () => {
    expect(asStringValue(42)).toBe('42');
    expect(asStringValue(true)).toBe('true');
  });
});

describe('asArrayValue', () => {
  it('returns array elements stringified', () => {
    expect(asArrayValue(['a', 'b'])).toEqual(['a', 'b']);
    expect(asArrayValue([1, 2])).toEqual(['1', '2']);
  });

  it('returns empty array for non-arrays', () => {
    expect(asArrayValue(null)).toEqual([]);
    expect(asArrayValue('hello')).toEqual([]);
    expect(asArrayValue(undefined)).toEqual([]);
  });
});

describe('asPairValue', () => {
  it('extracts first two elements from array', () => {
    expect(asPairValue([10, 20])).toEqual([10, 20]);
    expect(asPairValue([10, 20, 30])).toEqual([10, 20]);
  });

  it('returns undefined pair for non-arrays', () => {
    expect(asPairValue(null)).toEqual([undefined, undefined]);
    expect(asPairValue('hello')).toEqual([undefined, undefined]);
  });
});

describe('parseNumberInput', () => {
  it('parses numeric strings', () => {
    expect(parseNumberInput('42')).toBe(42);
    expect(parseNumberInput('3.14')).toBe(3.14);
  });

  it('returns undefined for empty string', () => {
    expect(parseNumberInput('')).toBeUndefined();
  });
});

describe('updatePairValue', () => {
  it('updates the first element', () => {
    expect(updatePairValue([10, 20], 0, 99)).toEqual([99, 20]);
  });

  it('updates the second element', () => {
    expect(updatePairValue([10, 20], 1, 99)).toEqual([10, 99]);
  });

  it('initializes from non-array value', () => {
    expect(updatePairValue(null, 0, 5)).toEqual([5, undefined]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/value-utils.spec.ts`
Expected: FAIL with "Cannot find module '../value-utils'"

**Step 3: Write minimal implementation**

Create `packages/react/src/value-utils.ts`:

```typescript
/**
 * Converts an unknown value to a string for text inputs.
 * Returns empty string for null/undefined.
 */
export function asStringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

/**
 * Converts an unknown value to a string array for multi-select inputs.
 * Returns empty array for non-arrays.
 */
export function asArrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/**
 * Extracts a pair [first, second] from an unknown value.
 * Returns [undefined, undefined] for non-arrays.
 */
export function asPairValue(value: unknown): [unknown, unknown] {
  return Array.isArray(value) ? [value[0], value[1]] : [undefined, undefined];
}

/**
 * Parses a number from an input string.
 * Returns undefined for empty string.
 */
export function parseNumberInput(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

/**
 * Updates one element of a pair value, preserving the other.
 */
export function updatePairValue(
  value: unknown,
  index: 0 | 1,
  nextValue: unknown
): [unknown, unknown] {
  const pair = asPairValue(value);
  pair[index] = nextValue;
  return pair;
}
```

**Step 4: Add exports to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export {
  asStringValue,
  asArrayValue,
  asPairValue,
  parseNumberInput,
  updatePairValue,
} from './value-utils';
```

**Step 5: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/value-utils.spec.ts`
Expected: PASS

**Step 6: Update shadcn value-editor.tsx**

In `packages/shadcn/src/components/value-editor.tsx`, remove the local definitions of `asStringValue`, `asArrayValue`, `asPairValue`, `parseNumberInput`, `updatePairValue` (lines 23-47). Add import from react:

```typescript
import { asArrayValue, asPairValue, asStringValue, parseNumberInput, updatePairValue } from '@x-filter/react';
```

Keep the local `asNumberInputValue` and `selectedValues` — these are shadcn-specific (UI primitive contract adapters, not shared).

**Step 7: Update antd value-editor.tsx**

In `packages/antd/src/components/value-editor.tsx`, remove the local definitions of `asStringValue`, `asArrayValue`, `asPairValue`, `updatePairValue` (lines 23-43). Add import from react:

```typescript
import { asArrayValue, asPairValue, asStringValue, updatePairValue } from '@x-filter/react';
```

Keep the local `asOptionalNumber` — this is antd-specific (returns `number | undefined` for `InputNumber`).

Note: antd does not use `parseNumberInput` (its `InputNumber` handles parsing internally), so don't import it.

**Step 8: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract value conversion utils to @x-filter/react

Move asStringValue, asArrayValue, asPairValue, parseNumberInput,
updatePairValue from shadcn/antd duplicates into @x-filter/react.
UI-primitive-specific adapters (asNumberInputValue, asOptionalNumber,
selectedValues) remain in their respective UI packages.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 4: Extract DSL completion utils to `@x-filter/react`

**Files:**
- Create: `packages/react/src/dsl-completion-utils.ts`
- Create: `packages/react/src/__tests__/dsl-completion-utils.spec.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/dsl-editor.tsx` (remove local defs, import from react)
- Modify: `packages/antd/src/components/dsl-editor.tsx` (remove local defs, import from react)

**Step 1: Write the failing test**

Create `packages/react/src/__tests__/dsl-completion-utils.spec.ts`:

```typescript
import type { CompletionItem } from '@x-filter/core';
import {
  needsStringQuoting,
  formatCompletionValue,
  replaceCurrentSegment,
} from '../dsl-completion-utils';

describe('needsStringQuoting', () => {
  it('requires quoting for empty string', () => {
    expect(needsStringQuoting('')).toBe(true);
  });

  it('requires quoting for strings with special characters', () => {
    expect(needsStringQuoting('in progress')).toBe(true);
    expect(needsStringQuoting('a/b')).toBe(true);
  });

  it('requires quoting for reserved words', () => {
    expect(needsStringQuoting('AND')).toBe(true);
    expect(needsStringQuoting('or')).toBe(true);
    expect(needsStringQuoting('NOT')).toBe(true);
  });

  it('requires quoting for booleans', () => {
    expect(needsStringQuoting('true')).toBe(true);
    expect(needsStringQuoting('false')).toBe(true);
  });

  it('requires quoting for numbers', () => {
    expect(needsStringQuoting('42')).toBe(true);
    expect(needsStringQuoting('3.14')).toBe(true);
  });

  it('does not require quoting for simple identifiers', () => {
    expect(needsStringQuoting('status')).toBe(false);
    expect(needsStringQuoting('field_name')).toBe(false);
    expect(needsStringQuoting('field.name')).toBe(false);
  });

  it('requires quoting for range syntax', () => {
    expect(needsStringQuoting('1..10')).toBe(true);
  });
});

describe('formatCompletionValue', () => {
  it('returns value as-is for non-value completions', () => {
    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    expect(formatCompletionValue(item)).toBe('status');
  });

  it('returns value as-is for values that do not need quoting', () => {
    const item: CompletionItem = { kind: 'value', value: 'active', label: 'Active' };
    expect(formatCompletionValue(item)).toBe('active');
  });

  it('quotes values that need quoting', () => {
    const item: CompletionItem = { kind: 'value', value: 'in progress', label: 'In progress' };
    expect(formatCompletionValue(item)).toBe('"in progress"');
  });

  it('escapes backslashes and quotes in values', () => {
    const item: CompletionItem = { kind: 'value', value: 'say "hi"', label: 'Say hi' };
    expect(formatCompletionValue(item)).toBe('"say \\"hi\\""');
  });
});

describe('replaceCurrentSegment', () => {
  it('replaces the current segment with a field completion', () => {
    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    const result = replaceCurrentSegment('sta', 3, item);
    expect(result.nextDraft).toBe('status');
    expect(result.nextCursor).toBe(6);
  });

  it('replaces the value segment in a field:operator:value pattern', () => {
    const item: CompletionItem = { kind: 'value', value: 'open', label: 'Open' };
    const result = replaceCurrentSegment('status:equals:op', 16, item);
    expect(result.nextDraft).toBe('status:equals:open');
    expect(result.nextCursor).toBe(18);
  });

  it('handles empty parentheses draft', () => {
    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    const result = replaceCurrentSegment('()', 1, item);
    expect(result.nextDraft).toBe('status');
    expect(result.nextCursor).toBe(6);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/dsl-completion-utils.spec.ts`
Expected: FAIL with "Cannot find module '../dsl-completion-utils'"

**Step 3: Write minimal implementation**

Create `packages/react/src/dsl-completion-utils.ts` — copy the exact logic from the current `dsl-editor.tsx` files:

```typescript
import type { CompletionItem } from '@x-filter/core';

/**
 * Determines whether a DSL value needs to be quoted.
 */
export function needsStringQuoting(value: string): boolean {
  if (value.length === 0) return true;
  if (!/^[a-zA-Z0-9_.]+$/.test(value)) return true;
  if (value.includes('..')) return true;
  const upperValue = value.toUpperCase();
  if (upperValue === 'AND' || upperValue === 'OR' || upperValue === 'NOT') return true;
  if (value === 'true' || value === 'false') return true;
  if (/^\d+(\.\d+)?$/.test(value)) return true;
  return false;
}

/**
 * Formats a completion item's value for insertion into DSL text.
 * Quotes string values that need quoting.
 */
export function formatCompletionValue(item: CompletionItem): string {
  if (item.kind !== 'value' || !needsStringQuoting(item.value)) {
    return item.value;
  }

  return `"${item.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Replaces the current segment in a DSL draft with a completion item.
 * Returns the new draft text and cursor position.
 */
export function replaceCurrentSegment(
  draft: string,
  cursor: number,
  item: CompletionItem
): { nextDraft: string; nextCursor: number } {
  const value = formatCompletionValue(item);

  if (draft === '()') {
    return { nextDraft: value, nextCursor: value.length };
  }

  const beforeCursor = draft.slice(0, cursor);
  const afterCursor = draft.slice(cursor);
  const match = beforeCursor.match(/[\s()][^\s()]*$/);
  const segmentStart = match ? beforeCursor.length - match[0].length + 1 : 0;
  const segment = beforeCursor.slice(segmentStart);
  const parts = segment.split(':');
  const replacement =
    parts.length === 1
      ? value
      : parts.length === 2
        ? `${parts[0]}:${value}`
        : `${parts[0]}:${parts[1]}:${value}`;

  return {
    nextDraft: `${beforeCursor.slice(0, segmentStart)}${replacement}${afterCursor}`,
    nextCursor: segmentStart + replacement.length,
  };
}
```

**Step 4: Add exports to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export { needsStringQuoting, formatCompletionValue, replaceCurrentSegment } from './dsl-completion-utils';
```

**Step 5: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/dsl-completion-utils.spec.ts`
Expected: PASS

**Step 6: Update shadcn dsl-editor.tsx**

In `packages/shadcn/src/components/dsl-editor.tsx`, remove the local `needsStringQuoting`, `formatCompletionValue`, `replaceCurrentSegment` function definitions (lines 18-61). Add import:

```typescript
import { formatCompletionValue, replaceCurrentSegment } from '@x-filter/react';
```

Note: `needsStringQuoting` is only used internally by `formatCompletionValue`, so it doesn't need to be imported by the UI package.

**Step 7: Update antd dsl-editor.tsx**

Same as Step 6 — remove local defs (lines 18-61), add import:

```typescript
import { formatCompletionValue, replaceCurrentSegment } from '@x-filter/react';
```

**Step 8: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract DSL completion utils to @x-filter/react

Move needsStringQuoting, formatCompletionValue, replaceCurrentSegment
from shadcn/antd dsl-editor duplicates into @x-filter/react.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 5: Extract `useDslEditorInteraction` hook to `@x-filter/react`

**Files:**
- Create: `packages/react/src/use-dsl-editor-interaction.ts`
- Create: `packages/react/src/types.ts` (modify — add types)
- Create: `packages/react/src/__tests__/use-dsl-editor-interaction.spec.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/dsl-editor.tsx`
- Modify: `packages/antd/src/components/dsl-editor.tsx`

**Step 1: Add types to types.ts**

In `packages/react/src/types.ts`, add at the end:

```typescript
export interface UseDslEditorInteractionOptions {
  editor: UseDslEditorReturn;
}

export interface UseDslEditorInteractionReturn {
  cursor: number | undefined;
  setCursor: (cursor: number | undefined) => void;
  isCompletionOpen: boolean;
  setIsCompletionOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  visibleCompletions: CompletionItem[];
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  applyCompletion: (item: CompletionItem) => void;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  updateCursor: (target: HTMLTextAreaElement) => void;
}
```

Also add `CompletionItem` to the imports at the top of types.ts if not already imported.

**Step 2: Write the failing test**

Create `packages/react/src/__tests__/use-dsl-editor-interaction.spec.tsx`:

```typescript
import { act, renderHook } from '@testing-library/react';
import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import { useDslEditor } from '../use-dsl-editor';
import { useDslEditorInteraction } from '../use-dsl-editor-interaction';

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
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [{ value: 'high', label: 'High' }],
  },
];

const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };

function renderInteraction() {
  const onCommit = jest.fn();
  return renderHook(() => {
    const editor = useDslEditor({ filter, schema, onCommit });
    return useDslEditorInteraction({ editor });
  });
}

describe('useDslEditorInteraction', () => {
  it('starts with completion closed and activeIndex 0', () => {
    const { result } = renderInteraction();
    expect(result.current.isCompletionOpen).toBe(false);
    expect(result.current.activeIndex).toBe(0);
  });

  it('visibleCompletions is empty when menu is closed', () => {
    const { result } = renderInteraction();
    expect(result.current.visibleCompletions).toEqual([]);
  });

  it('opens completion menu on handleChange', () => {
    const { result } = renderInteraction();
    const fakeEvent = {
      target: { value: 'sta', selectionStart: 3 },
    } as unknown as React.ChangeEvent<HTMLTextAreaElement>;

    act(() => {
      result.current.handleChange(fakeEvent);
    });

    expect(result.current.isCompletionOpen).toBe(true);
    expect(result.current.visibleCompletions.length).toBeGreaterThan(0);
  });

  it('closes completion menu on Escape keydown', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
    });

    const fakeEvent = { key: 'Escape' } as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(fakeEvent);
    });

    expect(result.current.isCompletionOpen).toBe(false);
  });

  it('navigates completions with ArrowDown/ArrowUp', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
    });

    const completionsCount = result.current.visibleCompletions.length;
    expect(completionsCount).toBeGreaterThan(1);

    const downEvent = { key: 'ArrowDown', preventDefault: jest.fn() } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(downEvent);
    });
    expect(result.current.activeIndex).toBe(1);

    const upEvent = { key: 'ArrowUp', preventDefault: jest.fn() } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(upEvent);
    });
    expect(result.current.activeIndex).toBe(0);
  });

  it('applies completion on Enter when menu is open', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
    });

    const enterEvent = { key: 'Enter', preventDefault: jest.fn() } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(enterEvent);
    });

    expect(result.current.isCompletionOpen).toBe(false);
  });

  it('does nothing on Enter when menu is closed', () => {
    const { result } = renderInteraction();

    const enterEvent = { key: 'Enter', preventDefault: jest.fn() } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(enterEvent);
    });

    expect(result.current.isCompletionOpen).toBe(false);
  });

  it('updateCursor sets cursor from textarea selectionStart', () => {
    const { result } = renderInteraction();
    const fakeTextarea = { selectionStart: 5, value: 'hello' } as HTMLTextAreaElement;

    act(() => {
      result.current.updateCursor(fakeTextarea);
    });

    expect(result.current.cursor).toBe(5);
  });

  it('updateCursor falls back to value length when selectionStart is null', () => {
    const { result } = renderInteraction();
    const fakeTextarea = { selectionStart: null, value: 'hello' } as unknown as HTMLTextAreaElement;

    act(() => {
      result.current.updateCursor(fakeTextarea);
    });

    expect(result.current.cursor).toBe(5);
  });

  it('applyCompletion closes menu and resets activeIndex', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
      result.current.setActiveIndex(2);
    });

    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    act(() => {
      result.current.applyCompletion(item);
    });

    expect(result.current.isCompletionOpen).toBe(false);
    expect(result.current.activeIndex).toBe(0);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/use-dsl-editor-interaction.spec.tsx`
Expected: FAIL with "Cannot find module '../use-dsl-editor-interaction'"

**Step 4: Write minimal implementation**

Create `packages/react/src/use-dsl-editor-interaction.ts`:

```typescript
import type { CompletionItem } from '@x-filter/core';
import { useState } from 'react';
import { formatCompletionValue, replaceCurrentSegment } from './dsl-completion-utils';
import type { UseDslEditorInteractionOptions, UseDslEditorInteractionReturn } from './types';

export function useDslEditorInteraction(
  options: UseDslEditorInteractionOptions
): UseDslEditorInteractionReturn {
  const { editor } = options;
  const [cursor, setCursor] = useState<number | undefined>();
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleCompletions = isCompletionOpen ? editor.completions : [];

  const updateCursor = (target: HTMLTextAreaElement) => {
    setCursor(target.selectionStart ?? target.value.length);
  };

  const applyCompletion = (item: CompletionItem) => {
    const cursorPosition = cursor ?? editor.draftDSL.length;
    const { nextDraft, nextCursor } = replaceCurrentSegment(
      editor.draftDSL,
      cursorPosition,
      item
    );

    editor.setDraftDSL(nextDraft);
    setCursor(nextCursor);
    setActiveIndex(0);
    setIsCompletionOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    editor.setDraftDSL(event.target.value);
    updateCursor(event.target);
    setActiveIndex(0);
    setIsCompletionOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      setIsCompletionOpen(false);
      return;
    }

    if (editor.completions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsCompletionOpen(true);
      setActiveIndex((index) => (index + 1) % editor.completions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsCompletionOpen(true);
      setActiveIndex(
        (index) => (index - 1 + editor.completions.length) % editor.completions.length
      );
      return;
    }

    if (event.key === 'Enter' && isCompletionOpen) {
      event.preventDefault();
      applyCompletion(editor.completions[activeIndex] ?? editor.completions[0]);
    }
  };

  return {
    cursor,
    setCursor,
    isCompletionOpen,
    setIsCompletionOpen,
    activeIndex,
    setActiveIndex,
    visibleCompletions,
    handleKeyDown,
    applyCompletion,
    handleChange,
    updateCursor,
  };
}
```

**Step 5: Add export to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export type { UseDslEditorInteractionOptions, UseDslEditorInteractionReturn } from './types';
export { useDslEditorInteraction } from './use-dsl-editor-interaction';
```

**Step 6: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/use-dsl-editor-interaction.spec.tsx`
Expected: PASS

**Step 7: Update shadcn dsl-editor.tsx**

In `packages/shadcn/src/components/dsl-editor.tsx`, replace the local state management and event handlers with the hook. The component should become:

```typescript
import type { FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { useDslEditor, useDslEditorInteraction } from '@x-filter/react';
import type React from 'react';
import { ShadcnCompletionMenu } from './completion-menu';
import { Button, cn } from './primitives';

export interface ShadcnDslEditorProps {
  filter: Filter;
  schema: FieldSchema[];
  className?: string;
  completionMenuClassName?: string;
  labels?: FilterBuilderLabels;
  onCommit: (filter: Filter) => void;
}

export function ShadcnDslEditor({
  filter,
  schema,
  className,
  completionMenuClassName,
  labels,
  onCommit,
}: ShadcnDslEditorProps) {
  const editor = useDslEditor({ filter, schema, onCommit });
  const interaction = useDslEditorInteraction({ editor });
  const inputLabel = labels?.dslInput ?? 'DSL';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <textarea
        aria-label={inputLabel}
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onChange={interaction.handleChange}
        onClick={(event) => interaction.updateCursor(event.currentTarget)}
        onFocus={(event) => {
          interaction.updateCursor(event.currentTarget);
          interaction.setIsCompletionOpen(true);
        }}
        onKeyDown={interaction.handleKeyDown}
        onSelect={(event) => interaction.updateCursor(event.currentTarget)}
        value={editor.draftDSL}
      />
      <Button onClick={editor.commit}>Apply DSL</Button>
      {editor.parseError ? (
        <div
          className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {editor.parseError}
        </div>
      ) : null}
      <ShadcnCompletionMenu
        activeIndex={interaction.activeIndex}
        className={completionMenuClassName}
        items={interaction.visibleCompletions}
        onSelect={interaction.applyCompletion}
      />
    </div>
  );
}
```

**Step 8: Update antd dsl-editor.tsx**

```typescript
import type { FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { useDslEditor, useDslEditorInteraction } from '@x-filter/react';
import { Alert, Button, Input, Space } from 'antd';
import { AntdCompletionMenu } from './completion-menu';

export interface AntdDslEditorProps {
  filter: Filter;
  schema: FieldSchema[];
  className?: string;
  completionMenuClassName?: string;
  labels?: FilterBuilderLabels;
  onCommit: (filter: Filter) => void;
}

export function AntdDslEditor({
  filter,
  schema,
  className,
  completionMenuClassName,
  labels,
  onCommit,
}: AntdDslEditorProps) {
  const editor = useDslEditor({ filter, schema, onCommit });
  const interaction = useDslEditorInteraction({ editor });
  const inputLabel = labels?.dslInput ?? 'DSL';

  return (
    <Space className={className} direction="vertical" size="small" style={{ width: '100%' }}>
      <Input.TextArea
        aria-label={inputLabel}
        autoSize
        onChange={interaction.handleChange}
        onClick={(event) => interaction.updateCursor(event.currentTarget)}
        onFocus={(event) => {
          interaction.updateCursor(event.currentTarget);
          interaction.setIsCompletionOpen(true);
        }}
        onKeyDown={interaction.handleKeyDown}
        onSelect={(event) => interaction.updateCursor(event.currentTarget)}
        value={editor.draftDSL}
      />
      <Button onClick={editor.commit}>Apply DSL</Button>
      {editor.parseError ? <Alert message={editor.parseError} showIcon type="error" /> : null}
      <AntdCompletionMenu
        activeIndex={interaction.activeIndex}
        className={completionMenuClassName}
        items={interaction.visibleCompletions}
        onSelect={interaction.applyCompletion}
      />
    </Space>
  );
}
```

**Step 9: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract useDslEditorInteraction hook to @x-filter/react

Move cursor/completion-menu state management and keyboard/event
handlers from shadcn/antd dsl-editor into shared hook. UI packages
now consume useDslEditorInteraction + useDslEditor and only render JSX.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 6: Extract `canUseAtomicRule`/`canUseAtomicGroup` + `resolveRuleRender`/`resolveGroupRender` to `@x-filter/react`

**Files:**
- Create: `packages/react/src/render-decisions.ts`
- Create: `packages/react/src/__tests__/render-decisions.spec.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/filter-builder.tsx`
- Modify: `packages/antd/src/components/filter-builder.tsx`

**Step 1: Write the failing test**

Create `packages/react/src/__tests__/render-decisions.spec.ts`:

```typescript
import type { FilterBuilderClassNames, FilterBuilderLabels, FilterBuilderSlots } from '../types';
import { canUseAtomicGroup, canUseAtomicRule, resolveGroupRender, resolveRuleRender } from '../render-decisions';

const DEFAULT_LABELS = {
  addRule: 'Add rule',
  addGroup: 'Add group',
  removeRule: 'Remove rule',
  removeGroup: 'Remove group',
} as const;

const resolvedLabels = { ...DEFAULT_LABELS };

describe('canUseAtomicRule', () => {
  it('returns true with default labels, no slots, no classNames', () => {
    expect(canUseAtomicRule(resolvedLabels, undefined, undefined)).toBe(true);
  });

  it('returns false when removeRule label is custom', () => {
    expect(canUseAtomicRule({ ...resolvedLabels, removeRule: 'Delete' }, undefined, undefined)).toBe(false);
  });

  it('returns false when FieldSelector slot is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, { FieldSelector: () => null }, undefined)).toBe(false);
  });

  it('returns false when OperatorSelector slot is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, { OperatorSelector: () => null }, undefined)).toBe(false);
  });

  it('returns false when ValueEditor slot is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, { ValueEditor: () => null }, undefined)).toBe(false);
  });

  it('returns false when fieldSelector className is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, undefined, { fieldSelector: 'custom' })).toBe(false);
  });

  it('returns false when actions className is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, undefined, { actions: 'custom' })).toBe(false);
  });
});

describe('canUseAtomicGroup', () => {
  it('returns true with default labels, no classNames', () => {
    expect(canUseAtomicGroup(resolvedLabels, undefined)).toBe(true);
  });

  it('returns false when addRule label is custom', () => {
    expect(canUseAtomicGroup({ ...resolvedLabels, addRule: 'New' }, undefined)).toBe(false);
  });

  it('returns false when addGroup label is custom', () => {
    expect(canUseAtomicGroup({ ...resolvedLabels, addGroup: 'New' }, undefined)).toBe(false);
  });

  it('returns false when removeGroup label is custom', () => {
    expect(canUseAtomicGroup({ ...resolvedLabels, removeGroup: 'Delete' }, undefined)).toBe(false);
  });

  it('returns false when actions className is provided', () => {
    expect(canUseAtomicGroup(resolvedLabels, { actions: 'custom' })).toBe(false);
  });
});

describe('resolveRuleRender', () => {
  it('returns "slot" when Rule slot is provided', () => {
    const slots: FilterBuilderSlots = { Rule: () => null };
    expect(resolveRuleRender(slots, resolvedLabels, undefined)).toBe('slot');
  });

  it('returns "atomic" when no slots, default labels, no classNames', () => {
    expect(resolveRuleRender(undefined, resolvedLabels, undefined)).toBe('atomic');
  });

  it('returns "fallback" when custom labels prevent atomic', () => {
    expect(resolveRuleRender(undefined, { ...resolvedLabels, removeRule: 'Delete' }, undefined)).toBe('fallback');
  });

  it('returns "fallback" when FieldSelector slot is provided (but no Rule slot)', () => {
    const slots: FilterBuilderSlots = { FieldSelector: () => null };
    expect(resolveRuleRender(slots, resolvedLabels, undefined)).toBe('fallback');
  });
});

describe('resolveGroupRender', () => {
  it('returns "slot" when Group slot is provided', () => {
    const slots: FilterBuilderSlots = { Group: () => null };
    expect(resolveGroupRender(slots, resolvedLabels, undefined)).toBe('slot');
  });

  it('returns "atomic" when no slots, default labels, no classNames', () => {
    expect(resolveGroupRender(undefined, resolvedLabels, undefined)).toBe('atomic');
  });

  it('returns "fallback" when custom labels prevent atomic', () => {
    expect(resolveGroupRender(undefined, { ...resolvedLabels, addRule: 'New' }, undefined)).toBe('fallback');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/render-decisions.spec.ts`
Expected: FAIL with "Cannot find module '../render-decisions'"

**Step 3: Write minimal implementation**

Create `packages/react/src/render-decisions.ts`:

```typescript
import type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlots,
} from './types';

const DEFAULT_LABELS = {
  addRule: 'Add rule',
  addGroup: 'Add group',
  removeRule: 'Remove rule',
  removeGroup: 'Remove group',
} satisfies Required<
  Pick<FilterBuilderLabels, 'addRule' | 'addGroup' | 'removeRule' | 'removeGroup'>
>;

export type ResolvedLabels = {
  addRule: string;
  addGroup: string;
  removeRule: string;
  removeGroup: string;
};

/**
 * @internal
 * Resolves partial labels into a complete set with defaults filled in.
 */
export function resolveLabels(labels?: FilterBuilderLabels): ResolvedLabels {
  return {
    addRule: labels?.addRule ?? DEFAULT_LABELS.addRule,
    addGroup: labels?.addGroup ?? DEFAULT_LABELS.addGroup,
    removeRule: labels?.removeRule ?? DEFAULT_LABELS.removeRule,
    removeGroup: labels?.removeGroup ?? DEFAULT_LABELS.removeGroup,
  };
}

/**
 * @internal
 * Determines whether the atomic FilterRule component can be used
 * (no custom slots, no custom classNames, default removeRule label).
 */
export function canUseAtomicRule(
  labels: ResolvedLabels,
  slots?: FilterBuilderSlots,
  classNames?: FilterBuilderClassNames
): boolean {
  return (
    labels.removeRule === DEFAULT_LABELS.removeRule &&
    !slots?.FieldSelector &&
    !slots?.OperatorSelector &&
    !slots?.ValueEditor &&
    !classNames?.fieldSelector &&
    !classNames?.operatorSelector &&
    !classNames?.valueEditor &&
    !classNames?.actions
  );
}

/**
 * @internal
 * Determines whether the atomic FilterGroup component can be used
 * (no custom classNames, default action labels).
 */
export function canUseAtomicGroup(
  labels: ResolvedLabels,
  classNames?: FilterBuilderClassNames
): boolean {
  return (
    labels.addRule === DEFAULT_LABELS.addRule &&
    labels.addGroup === DEFAULT_LABELS.addGroup &&
    labels.removeGroup === DEFAULT_LABELS.removeGroup &&
    !classNames?.actions
  );
}

export type RenderMode = 'slot' | 'atomic' | 'fallback';

/**
 * @internal
 * Decides which render path to use for a rule:
 * - 'slot' if a Rule slot is provided
 * - 'atomic' if no slots/classNames prevent the atomic component
 * - 'fallback' otherwise (manual JSX assembly)
 */
export function resolveRuleRender(
  slots: FilterBuilderSlots | undefined,
  labels: ResolvedLabels,
  classNames: FilterBuilderClassNames | undefined
): RenderMode {
  if (slots?.Rule) return 'slot';
  if (canUseAtomicRule(labels, slots, classNames)) return 'atomic';
  return 'fallback';
}

/**
 * @internal
 * Decides which render path to use for a group.
 */
export function resolveGroupRender(
  slots: FilterBuilderSlots | undefined,
  labels: ResolvedLabels,
  classNames: FilterBuilderClassNames | undefined
): RenderMode {
  if (slots?.Group) return 'slot';
  if (canUseAtomicGroup(labels, classNames)) return 'atomic';
  return 'fallback';
}
```

**Step 4: Add exports to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export type { RenderMode, ResolvedLabels } from './render-decisions';
export {
  canUseAtomicGroup,
  canUseAtomicRule,
  resolveGroupRender,
  resolveLabels,
  resolveRuleRender,
} from './render-decisions';
```

**Step 5: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/render-decisions.spec.ts`
Expected: PASS

**Step 6: Update shadcn filter-builder.tsx**

In `packages/shadcn/src/components/filter-builder.tsx`:
- Remove the local `DEFAULT_LABELS` const (lines 39-46)
- Remove the local `canUseAtomicGroup` function (lines 48-55)
- Remove the local `canUseAtomicRule` function (lines 57-72)
- Add import from react: `import { canUseAtomicGroup, canUseAtomicRule, resolveLabels } from '@x-filter/react';`
- Replace the `resolvedLabels` inline computation with `const resolvedLabels = resolveLabels(labels);`
- In `renderRule`, replace the `if (slots?.Rule)` / `if (canUseAtomicRule(...))` chain with:
  ```typescript
  if (slots?.Rule) {
    return slots.Rule({ ...slotProps, rule });
  }
  if (canUseAtomicRule(resolvedLabels, slots, classNames)) {
    return ( /* existing atomic JSX */ );
  }
  // existing fallback JSX
  ```
  (The logic is the same — just using the imported functions instead of local ones.)
- Same for `renderGroup` with `canUseAtomicGroup`.

**Step 7: Update antd filter-builder.tsx**

Same changes as Step 6 — remove local `DEFAULT_LABELS`/`canUseAtomicGroup`/`canUseAtomicRule`, import from `@x-filter/react`, use `resolveLabels(labels)`.

**Step 8: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract render decisions to @x-filter/react

Move canUseAtomicRule, canUseAtomicGroup, resolveLabels from
shadcn/antd filter-builder duplicates into @x-filter/react as
shared @internal utilities. UI packages now import and use them.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 7: Extract `MoveControls` component to `@x-filter/react`

**Files:**
- Create: `packages/react/src/move-controls.tsx`
- Create: `packages/react/src/__tests__/move-controls.spec.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/filter-builder.tsx`
- Modify: `packages/antd/src/components/filter-builder.tsx`

**Step 1: Write the failing test**

Create `packages/react/src/__tests__/move-controls.spec.tsx`:

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import type { FilterGroupViewModel, FilterNodeViewModel } from '../types';
import { MoveControls } from '../move-controls';

const makeGroup = (children: FilterNodeViewModel[]): FilterGroupViewModel => ({
  kind: 'group',
  id: 'root',
  group: { id: 'root', combinator: 'and', conditions: [] },
  depth: 0,
  children,
  aria: { label: 'Filter group root' },
});

const makeRule = (id: string): FilterNodeViewModel => ({
  kind: 'rule',
  id,
  rule: { id, field: 'name', operator: 'equals', value: 'test' },
  errors: [],
  aria: { label: 'Rule name equals' },
});

describe('MoveControls', () => {
  it('renders nothing when dnd is false', () => {
    const group = makeGroup([makeRule('r1')]);
    const { container } = render(
      <MoveControls
        dnd={false}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders up and down buttons when dnd is true', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r1 up/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /move r1 down/i })).not.toBeNull();
  });

  it('disables up button at first index', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r1 up/i })).toBeDisabled();
  });

  it('disables down button at last index', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[1]}
        index={1}
        canMoveChild={() => true}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r2 down/i })).toBeDisabled();
  });

  it('calls moveChild with up direction', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    const moveChild = jest.fn();
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[1]}
        index={1}
        canMoveChild={() => true}
        moveChild={moveChild}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /move r2 up/i }));
    expect(moveChild).toHaveBeenCalledWith(group, group.children[1], 1, 'up');
  });

  it('calls moveChild with down direction', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    const moveChild = jest.fn();
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={moveChild}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /move r1 down/i }));
    expect(moveChild).toHaveBeenCalledWith(group, group.children[0], 0, 'down');
  });

  it('disables buttons when canMoveChild returns false', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => false}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r1 up/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /move r1 down/i })).toBeDisabled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/move-controls.spec.tsx`
Expected: FAIL with "Cannot find module '../move-controls'"

**Step 3: Write minimal implementation**

Create `packages/react/src/move-controls.tsx`:

```typescript
import type { FilterGroupViewModel, FilterNodeViewModel } from './types';

export interface MoveControlsProps {
  dnd: boolean;
  group: FilterGroupViewModel;
  child: FilterNodeViewModel;
  index: number;
  canMoveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ) => boolean;
  moveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ) => void;
}

export function MoveControls({
  dnd,
  group,
  child,
  index,
  canMoveChild,
  moveChild,
}: MoveControlsProps) {
  if (!dnd) return null;

  const canMoveUp = canMoveChild(group, child, index - 1);
  const canMoveDown = canMoveChild(group, child, index + 1);

  return (
    <span>
      <button
        aria-label={`Move ${child.id} up`}
        disabled={!canMoveUp}
        type="button"
        onClick={() => moveChild(group, child, index, 'up')}
      >
        Move {child.id} up
      </button>
      <button
        aria-label={`Move ${child.id} down`}
        disabled={!canMoveDown}
        type="button"
        onClick={() => moveChild(group, child, index, 'down')}
      >
        Move {child.id} down
      </button>
    </span>
  );
}
```

**Step 4: Add export to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export type { MoveControlsProps } from './move-controls';
export { MoveControls } from './move-controls';
```

**Step 5: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/move-controls.spec.tsx`
Expected: PASS

**Step 6: Update shadcn filter-builder.tsx**

In `packages/shadcn/src/components/filter-builder.tsx`:
- Add import: `import { MoveControls } from '@x-filter/react';`
- Remove the local `renderMoveControls` function (lines 251-281)
- In `renderGroup`, replace `{renderMoveControls(group, child, index)}` with:
  ```tsx
  <MoveControls
    dnd={dnd}
    group={group}
    child={child}
    index={index}
    canMoveChild={canMoveChild}
    moveChild={moveChild}
  />
  ```

**Step 7: Update antd filter-builder.tsx**

Same changes as Step 6.

**Step 8: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract MoveControls to @x-filter/react

Move the native HTML move-up/move-down buttons from shadcn/antd
filter-builder into @x-filter/react as a shared pure component.
Receives canMoveChild/moveChild closures as props from orchestrator.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 8: Extract `useFilterBuilderOrchestrator` hook to `@x-filter/react`

**Files:**
- Create: `packages/react/src/use-filter-builder-orchestrator.ts`
- Modify: `packages/react/src/types.ts` (add types)
- Create: `packages/react/src/__tests__/use-filter-builder-orchestrator.spec.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/shadcn/src/components/filter-builder.tsx`
- Modify: `packages/antd/src/components/filter-builder.tsx`

**Step 1: Add types to types.ts**

In `packages/react/src/types.ts`, add:

```typescript
export interface UseFilterBuilderOrchestratorOptions {
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  schema: FieldSchema[];
  errors?: Record<string, ValidationError[]>;
}

export interface UseFilterBuilderOrchestratorReturn {
  builder: UseFilterBuilderReturn;
  viewModel: UseFilterViewModelReturn;
  reorder: UseReorderContractReturn;
  actions: FilterBuilderActionHandlers;
  slotProps: FilterBuilderSlotProps;
  canMoveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ) => boolean;
  moveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ) => void;
  handleSortableMove: (group: FilterGroupViewModel, activeId: string, overId: string) => void;
}
```

**Step 2: Write the failing test**

Create `packages/react/src/__tests__/use-filter-builder-orchestrator.spec.tsx`:

```typescript
import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { useFilterBuilderOrchestrator } from '../use-filter-builder-orchestrator';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
];

const emptyFilter: Filter = { id: 'root', combinator: 'and', conditions: [] };

const filterWithRule: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    { id: 'g1', combinator: 'or', conditions: [] },
  ],
};

describe('useFilterBuilderOrchestrator', () => {
  it('returns builder, viewModel, reorder, actions, slotProps', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: emptyFilter })
    );

    expect(result.current.builder).toBeDefined();
    expect(result.current.builder.filter).toEqual(emptyFilter);
    expect(result.current.viewModel).toBeDefined();
    expect(result.current.viewModel.root.id).toBe('root');
    expect(result.current.reorder).toBeDefined();
    expect(result.current.actions).toBeDefined();
    expect(result.current.slotProps).toBeDefined();
    expect(result.current.slotProps.filter).toEqual(emptyFilter);
    expect(result.current.slotProps.schema).toBe(schema);
  });

  it('actions.addRule calls onChange', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: emptyFilter, onChange })
    );

    act(() => {
      result.current.actions.addRule('root');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [expect.objectContaining({ field: '' })],
      })
    );
  });

  it('actions.removeRule calls onChange', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    act(() => {
      result.current.actions.removeRule('r1');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ conditions: [expect.objectContaining({ id: 'g1' })] })
    );
  });

  it('actions.moveItem moves rule to another group', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    act(() => {
      result.current.actions.moveItem({ type: 'rule', id: 'r1', targetGroupId: 'g1', targetIndex: 0 });
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [
          expect.objectContaining({
            id: 'g1',
            conditions: [expect.objectContaining({ id: 'r1' })],
          }),
        ],
      })
    );
  });

  it('canMoveChild returns true for valid adjacent move', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: filterWithRule })
    );

    const root = result.current.viewModel.root;
    const child = root.children[0];
    expect(result.current.canMoveChild(root, child, 1)).toBe(true);
  });

  it('canMoveChild returns false for out-of-bounds index', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: filterWithRule })
    );

    const root = result.current.viewModel.root;
    const child = root.children[0];
    expect(result.current.canMoveChild(root, child, -1)).toBe(false);
    expect(result.current.canMoveChild(root, child, 99)).toBe(false);
  });

  it('moveChild moves rule up', () => {
    const onChange = jest.fn();
    const filterTwoRules: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
        { id: 'r2', field: 'age', operator: 'equals', value: 30 },
      ],
    };
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterTwoRules, onChange })
    );

    const root = result.current.viewModel.root;
    act(() => {
      result.current.moveChild(root, root.children[1], 1, 'up');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [
          expect.objectContaining({ id: 'r2' }),
          expect.objectContaining({ id: 'r1' }),
        ],
      })
    );
  });

  it('handleSortableMove moves item when active and over are found', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    const root = result.current.viewModel.root;
    act(() => {
      result.current.handleSortableMove(root, 'r1', 'g1');
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('handleSortableMove does nothing when active id not found', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    const root = result.current.viewModel.root;
    act(() => {
      result.current.handleSortableMove(root, 'nonexistent', 'g1');
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('actions are memoized (stable references across rerenders)', () => {
    const { result, rerender } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: emptyFilter })
    );

    const firstActions = result.current.actions;
    rerender();
    expect(result.current.actions).toBe(firstActions);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/use-filter-builder-orchestrator.spec.tsx`
Expected: FAIL with "Cannot find module '../use-filter-builder-orchestrator'"

**Step 4: Write minimal implementation**

Create `packages/react/src/use-filter-builder-orchestrator.ts`:

```typescript
import { useMemo } from 'react';
import type {
  FilterBuilderActionHandlers,
  FilterBuilderSlotProps,
  FilterGroupViewModel,
  FilterNodeViewModel,
  UseFilterBuilderOrchestratorOptions,
  UseFilterBuilderOrchestratorReturn,
  UseFilterBuilderReturn,
  UseFilterViewModelReturn,
  UseReorderContractReturn,
} from './types';
import { useFilterBuilder } from './use-filter-builder';
import { useFilterViewModel } from './use-filter-view-model';
import { useReorderContract } from './use-reorder-contract';

export function useFilterBuilderOrchestrator(
  options: UseFilterBuilderOrchestratorOptions
): UseFilterBuilderOrchestratorReturn {
  const { value, defaultValue, onChange, schema, errors } = options;

  const builder = useFilterBuilder({ value, defaultValue, onChange, schema });
  const viewModel = useFilterViewModel({
    filter: builder.filter,
    schema: builder.schema,
    errors,
  });
  const reorder = useReorderContract({ filter: builder.filter, onReorder: builder.setFilter });

  const actions = useMemo<FilterBuilderActionHandlers>(
    () => ({
      addRule: builder.addRule,
      removeRule: builder.removeRule,
      updateRule: builder.updateRule,
      addGroup: builder.addGroup,
      removeGroup: builder.removeGroup,
      updateGroup: builder.updateGroup,
      moveItem: reorder.moveItem,
      canDrop: reorder.canDrop,
    }),
    [
      builder.addRule,
      builder.removeRule,
      builder.updateRule,
      builder.addGroup,
      builder.removeGroup,
      builder.updateGroup,
      reorder.moveItem,
      reorder.canDrop,
    ]
  );

  const slotProps: FilterBuilderSlotProps = useMemo(
    () => ({
      filter: builder.filter,
      schema: builder.schema,
      actions,
    }),
    [builder.filter, builder.schema, actions]
  );

  const canMoveChild = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ): boolean => {
    return (
      targetIndex >= 0 &&
      targetIndex < group.children.length &&
      actions.canDrop(child.id, group.id)
    );
  };

  const moveChild = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ): void => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (!canMoveChild(group, child, targetIndex)) return;

    actions.moveItem({
      type: child.kind,
      id: child.id,
      targetGroupId: group.id,
      targetIndex: child.kind === 'group' && direction === 'down' ? index + 2 : targetIndex,
    });
  };

  const handleSortableMove = (
    group: FilterGroupViewModel,
    activeId: string,
    overId: string
  ): void => {
    const activeIndex = group.children.findIndex((child) => child.id === activeId);
    const overIndex = group.children.findIndex((child) => child.id === overId);
    if (activeIndex === -1 || overIndex === -1) return;

    const child = group.children[activeIndex];
    if (!actions.canDrop(child.id, group.id)) return;

    actions.moveItem({
      type: child.kind,
      id: child.id,
      targetGroupId: group.id,
      targetIndex: child.kind === 'group' && activeIndex < overIndex ? overIndex + 1 : overIndex,
    });
  };

  return {
    builder,
    viewModel,
    reorder,
    actions,
    slotProps,
    canMoveChild,
    moveChild,
    handleSortableMove,
  };
}
```

**Step 5: Add exports to index.ts**

In `packages/react/src/index.ts`, add:

```typescript
export type {
  UseFilterBuilderOrchestratorOptions,
  UseFilterBuilderOrchestratorReturn,
} from './types';
export { useFilterBuilderOrchestrator } from './use-filter-builder-orchestrator';
```

**Step 6: Run test to verify it passes**

Run: `pnpm exec jest --runInBand packages/react/src/__tests__/use-filter-builder-orchestrator.spec.tsx`
Expected: PASS

**Step 7: Update shadcn filter-builder.tsx**

Replace the three hook calls + actions useMemo + slotProps + canMoveChild/moveChild/handleSortableMove with a single orchestrator call. The component should become:

```typescript
import type { FieldSchema, Filter, ValidationError } from '@x-filter/core';
import type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
} from '@x-filter/react';
import {
  canUseAtomicGroup,
  canUseAtomicRule,
  getDefaultRuleUpdatesForField,
  MoveControls,
  resolveLabels,
  useFilterBuilderOrchestrator,
} from '@x-filter/react';
import { ShadcnCombinatorSelector } from './combinator-selector';
import { ShadcnDslEditor } from './dsl-editor';
import { ShadcnFieldSelector } from './field-selector';
import { ShadcnFilterGroup } from './group-block';
import { ShadcnNotToggle } from './not-toggle';
import { ShadcnOperatorSelector } from './operator-selector';
import { Button, Card, cn } from './primitives';
import { ShadcnFilterRule } from './rule-row';
import { SortableFilterContext, SortableFilterItem } from './sortable-context';
import { ShadcnValueEditor } from './value-editor';

export interface ShadcnFilterBuilderProps {
  schema: FieldSchema[];
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  slots?: FilterBuilderSlots;
  labels?: FilterBuilderLabels;
  classNames?: FilterBuilderClassNames;
  errors?: Record<string, ValidationError[]>;
  dsl?: boolean;
  dnd?: boolean;
}

export function ShadcnFilterBuilder({
  schema,
  value,
  defaultValue,
  onChange,
  slots,
  labels,
  classNames,
  errors,
  dsl,
  dnd,
}: ShadcnFilterBuilderProps) {
  const {
    builder,
    viewModel,
    actions,
    slotProps,
    canMoveChild,
    moveChild,
    handleSortableMove,
  } = useFilterBuilderOrchestrator({ value, defaultValue, onChange, schema, errors });
  const resolvedLabels = resolveLabels(labels);

  const renderRule = (rule: FilterRuleViewModel) => {
    if (slots?.Rule) {
      return slots.Rule({ ...slotProps, rule });
    }

    if (canUseAtomicRule(resolvedLabels, slots, classNames)) {
      return (
        <ShadcnFilterRule
          className={classNames?.rule}
          rule={rule}
          schema={builder.schema}
          onChange={actions.updateRule}
          onRemove={actions.removeRule}
        />
      );
    }

    const FieldSelector = slots?.FieldSelector;
    const OperatorSelector = slots?.OperatorSelector;
    const ValueEditor = slots?.ValueEditor;

    return (
      <fieldset
        aria-describedby={rule.aria.describedBy}
        aria-label={rule.aria.label}
        className={cn('flex flex-wrap items-center gap-2', classNames?.rule)}
      >
        <ShadcnNotToggle
          checked={Boolean(rule.rule.not)}
          onChange={(not) => actions.updateRule(rule.id, { not })}
        />
        {FieldSelector ? (
          FieldSelector({ ...slotProps, rule })
        ) : (
          <ShadcnFieldSelector
            className={classNames?.fieldSelector}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(field) =>
              actions.updateRule(rule.id, getDefaultRuleUpdatesForField(builder.schema, field))
            }
          />
        )}
        {OperatorSelector ? (
          OperatorSelector({ ...slotProps, rule })
        ) : (
          <ShadcnOperatorSelector
            className={classNames?.operatorSelector}
            field={rule.field}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(operator) => actions.updateRule(rule.id, { operator })}
          />
        )}
        {ValueEditor ? (
          ValueEditor({ ...slotProps, rule })
        ) : (
          <ShadcnValueEditor
            className={classNames?.valueEditor}
            field={rule.field}
            operator={rule.operator}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(nextValue) => actions.updateRule(rule.id, { value: nextValue })}
          />
        )}
        <span className={classNames?.actions}>
          <Button variant="destructive" onClick={() => actions.removeRule(rule.id)}>
            {resolvedLabels.removeRule}
          </Button>
        </span>
      </fieldset>
    );
  };

  const renderNode = (node: FilterNodeViewModel) => {
    if (node.kind === 'rule') {
      return renderRule(node);
    }
    return renderGroup(node);
  };

  const renderGroup = (group: FilterGroupViewModel) => {
    const children = group.children.map((child, index) =>
      dnd ? (
        <SortableFilterItem key={child.id} id={child.id}>
          <div>
            <MoveControls
              dnd={dnd}
              group={group}
              child={child}
              index={index}
              canMoveChild={canMoveChild}
              moveChild={moveChild}
            />
            {renderNode(child)}
          </div>
        </SortableFilterItem>
      ) : (
        <div key={child.id}>{renderNode(child)}</div>
      )
    );
    const orderedChildren = dnd ? (
      <SortableFilterContext
        items={group.children.map((child) => child.id)}
        onMove={(activeId, overId) => handleSortableMove(group, activeId, overId)}
      >
        {children}
      </SortableFilterContext>
    ) : (
      children
    );

    if (slots?.Group) {
      return slots.Group({ ...slotProps, group, children: orderedChildren });
    }

    const isRoot = group.id === viewModel.root.id;

    if (canUseAtomicGroup(resolvedLabels, classNames)) {
      return (
        <ShadcnFilterGroup
          className={classNames?.group}
          group={group}
          onAddGroup={actions.addGroup}
          onAddRule={actions.addRule}
          onCombinatorChange={(groupId, combinator) => actions.updateGroup(groupId, { combinator })}
          onNotChange={(groupId, not) => actions.updateGroup(groupId, { not })}
          onRemove={isRoot ? undefined : actions.removeGroup}
        >
          {orderedChildren}
        </ShadcnFilterGroup>
      );
    }

    return (
      <Card
        aria-describedby={group.aria.describedBy}
        aria-label={group.aria.label}
        className={classNames?.group}
        role="group"
      >
        <div className="flex flex-col gap-4">
          <div className={cn('flex flex-wrap items-center gap-2', classNames?.actions)}>
            <ShadcnCombinatorSelector
              value={group.group.combinator}
              onChange={(combinator) => actions.updateGroup(group.id, { combinator })}
            />
            <ShadcnNotToggle
              checked={Boolean(group.group.not)}
              onChange={(not) => actions.updateGroup(group.id, { not })}
            />
            <Button variant="outline" onClick={() => actions.addRule(group.id)}>
              {resolvedLabels.addRule}
            </Button>
            <Button variant="outline" onClick={() => actions.addGroup(group.id)}>
              {resolvedLabels.addGroup}
            </Button>
            {isRoot ? null : (
              <Button variant="destructive" onClick={() => actions.removeGroup(group.id)}>
                {resolvedLabels.removeGroup}
              </Button>
            )}
          </div>
          {children.length > 0 ? (
            <div className="flex flex-col gap-3">{orderedChildren}</div>
          ) : null}
        </div>
      </Card>
    );
  };

  const tree = renderGroup(viewModel.root);
  const dslEditor = dsl ? (
    <ShadcnDslEditor
      className={classNames?.dslEditor}
      completionMenuClassName={classNames?.completionMenu}
      filter={builder.filter}
      labels={labels}
      schema={builder.schema}
      onCommit={builder.setFilter}
    />
  ) : null;
  const children = dslEditor ? (
    <div className="flex flex-col gap-4">
      {dslEditor}
      {tree}
    </div>
  ) : (
    tree
  );

  if (slots?.Root) {
    return slots.Root({ ...slotProps, children });
  }

  return <div className={classNames?.root}>{children}</div>;
}
```

**Step 8: Update antd filter-builder.tsx**

Same structural changes as Step 7, but with antd components (`Antd*` instead of `Shadcn*`, `Space` instead of `fieldset`+`cn`, `Button danger` instead of `Button variant="destructive"`, etc.). The orchestrator call and render logic are identical — only the JSX primitives differ.

**Step 9: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

**Step 10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: extract useFilterBuilderOrchestrator to @x-filter/react

Move the 400-line orchestration logic (hook calls, actions memo,
moveChild/canMoveChild/handleSortableMove, slotProps) from
shadcn/antd filter-builder into a shared hook. UI packages now
call useFilterBuilderOrchestrator and only assemble JSX.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 9: Reorganize tests — move orchestration tests to react, slim UI package tests

**Files:**
- Modify: `packages/shadcn/src/__tests__/filter-builder.spec.tsx` (remove orchestration behavior tests)
- Modify: `packages/shadcn/src/__tests__/dsl-editor.spec.tsx` (remove keyboard/completion behavior tests)
- Modify: `packages/antd/src/__tests__/filter-builder.spec.tsx` (remove orchestration behavior tests)
- Modify: `packages/antd/src/__tests__/dsl-editor.spec.tsx` (remove keyboard/completion behavior tests)

**Important:** This task only removes tests that are now covered by the react package tests added in Tasks 1-8. Do NOT remove tests that verify UI rendering (value editor types, classNames to DOM, slot rendering, DSL editor rendering).

**Step 1: Identify tests to remove from shadcn filter-builder.spec.tsx**

Remove these tests (their behavior is now covered by `use-filter-builder-orchestrator.spec.tsx` and `render-decisions.spec.ts`):
- `ShadcnFilterBuilder adds a rule through the full builder` → covered by orchestrator test
- `ShadcnFilterBuilder emits controlled rule updates` → covered by orchestrator test
- `ShadcnFilterBuilder forwards default atomic rule controls` → covered by orchestrator test (actions dispatch)
- `ShadcnFilterBuilder removes child groups but not the root group` → covered by orchestrator test
- `ShadcnFilterBuilder emits group updates through the default group atomic` → covered by orchestrator test
- `ShadcnFilterBuilder moveItem slot action moves rules between groups` → covered by orchestrator test
- `ShadcnFilterBuilder moveItem slot action moves child groups` → covered by orchestrator test
- `ShadcnFilterBuilder canDrop rejects missing drag ids and group descendant targets` → covered by orchestrator test (canDrop via reorder contract)

Keep these tests (UI rendering specific):
- `ShadcnFilterBuilder renders custom ValueEditor slot` → slot rendering
- `ShadcnFilterBuilder passes external validation errors to rule slots` → slot rendering
- `ShadcnFilterBuilder applies classNames and custom action labels` → classNames to DOM
- `ShadcnFilterBuilder wires Root, Group, Rule, FieldSelector, and OperatorSelector slots` → slot wiring + rendering
- `ShadcnFilterBuilder renders default value editors for supported field types` → value editor rendering

**Step 2: Remove identified tests from shadcn filter-builder.spec.tsx**

Delete the test functions listed in Step 1. Keep the schema/filter/helper definitions and the remaining tests.

**Step 3: Identify tests to remove from shadcn dsl-editor.spec.tsx**

Remove these tests (behavior now covered by `use-dsl-editor-interaction.spec.tsx` and `dsl-completion-utils.spec.ts`):
- `ShadcnFilterBuilder applies completions with keyboard navigation and closes with Escape` → keyboard state machine
- `ShadcnFilterBuilder quotes value completions that need DSL string quoting` → `formatCompletionValue` unit test

Keep these tests (UI rendering specific):
- `ShadcnFilterBuilder commits valid DSL and shows parse errors for invalid DSL` → integration smoke test (DSL commit + error rendering)
- `ShadcnFilterBuilder renders field, operator, and value completions with listbox roles` → listbox rendering
- `ShadcnFilterBuilder omits DSL input unless dsl is true` → prop-driven rendering
- `ShadcnFilterBuilder applies DSL editor and completion menu classNames` → classNames to DOM

**Step 4: Remove identified tests from shadcn dsl-editor.spec.tsx**

Delete the two test functions identified in Step 3.

**Step 5: Repeat Steps 1-4 for antd test files**

Apply the same removals to `packages/antd/src/__tests__/filter-builder.spec.tsx` and `packages/antd/src/__tests__/dsl-editor.spec.tsx`. The test names may differ slightly (prefixed with `AntdFilterBuilder` instead of `ShadcnFilterBuilder`) — match by behavior, not exact name.

**Step 6: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS — the removed tests are covered by the new react package tests. Coverage should not drop below thresholds (80% branches, 90% functions/lines/statements globally).

If coverage drops, check which lines are now uncovered. The react package tests should cover the orchestration logic. UI package tests cover rendering. If a gap exists, add a targeted test to the appropriate package.

**Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
test: reorganize tests after orchestration extraction

Remove orchestration behavior tests from shadcn/antd filter-builder
and dsl-editor specs — these are now covered by @x-filter/react
tests (use-filter-builder-orchestrator, use-dsl-editor-interaction,
render-decisions, dsl-completion-utils). UI package tests now focus
on rendering-specific assertions.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Task 10: Final verification and cleanup

**Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors. All imports resolve correctly.

**Step 2: Run lint**

Run: `pnpm check`
Expected: No errors. Fix any formatting issues with `pnpm format` if needed.

**Step 3: Run full test suite with coverage**

Run: `pnpm test`
Expected: ALL PASS, coverage thresholds met (80% branches, 90% functions/lines/statements).

**Step 4: Verify no duplicate code remains**

Check that the following files no longer exist in UI packages:
- `packages/shadcn/src/components/rule-defaults.ts` (deleted in Task 1)
- `packages/antd/src/components/rule-defaults.ts` (deleted in Task 1)

Check that the following functions are no longer defined locally in UI packages (grep):
- `canUseAtomicRule`, `canUseAtomicGroup` in `filter-builder.tsx` (moved in Task 6)
- `asStringValue`, `asArrayValue`, `asPairValue`, `parseNumberInput`, `updatePairValue` in `value-editor.tsx` (moved in Task 3)
- `findSchemaField`, `getFieldOperators`, `findOperator` in `operator-selector.tsx` (moved in Task 2)
- `needsStringQuoting`, `formatCompletionValue`, `replaceCurrentSegment` in `dsl-editor.tsx` (moved in Task 4)
- `renderMoveControls` in `filter-builder.tsx` (moved in Task 7)

Run: `grep -rn "function canUseAtomicRule\|function canUseAtomicGroup\|function asStringValue\|function findSchemaField\|function needsStringQuoting\|function renderMoveControls" packages/shadcn/src/ packages/antd/src/`
Expected: No matches (all moved to react package).

**Step 5: Verify react package exports are correct**

Run: `grep -n "export" packages/react/src/index.ts`
Expected: All new exports present:
- `getDefaultRuleUpdatesForField`
- `findSchemaField`, `getFieldOperators`, `findOperator`
- `asStringValue`, `asArrayValue`, `asPairValue`, `parseNumberInput`, `updatePairValue`
- `needsStringQuoting`, `formatCompletionValue`, `replaceCurrentSegment`
- `useDslEditorInteraction`
- `canUseAtomicRule`, `canUseAtomicGroup`, `resolveLabels`, `resolveRuleRender`, `resolveGroupRender`
- `MoveControls`
- `useFilterBuilderOrchestrator`

**Step 6: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: final cleanup after orchestration extraction

Verify typecheck, lint, and test coverage after extracting shared
logic to @x-filter/react. No duplicate code remains in UI packages.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

## Summary

| Task | What | Lines Eliminated (approx) |
|------|------|---------------------------|
| 1 | `rule-defaults.ts` | 19 × 2 = 38 |
| 2 | schema query utils | 10 × 2 = 20 |
| 3 | value conversion utils | 25 × 2 = 50 |
| 4 | DSL completion utils | 44 × 2 = 88 |
| 5 | `useDslEditorInteraction` | 60 × 2 = 120 |
| 6 | render decisions | 35 × 2 = 70 |
| 7 | `MoveControls` | 30 × 2 = 60 |
| 8 | `useFilterBuilderOrchestrator` | 80 × 2 = 160 |
| 9 | test reorganization | ~300 × 2 = 600 test lines |
| 10 | final verification | — |
| **Total** | | **~600 source + ~600 test lines eliminated** |

Each task is independently committable and testable. The migration is bottom-up: pure functions first, then hooks, then UI package rewrites, then test reorganization.
