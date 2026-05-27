# Antd and Shadcn Deep Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build deep Ant Design and shadcn support with shared React view-model behavior, styled UI adapters, atomic components, optional full builders, DSL editing, DnD, accessibility, Storybook demos, and customization slots.

**Architecture:** `@x-filter/core` remains framework-agnostic. `@x-filter/react` owns shared behavior, view-models, ARIA metadata, slots contracts, and action mapping. `@x-filter/antd` and `@x-filter/shadcn` consume the same contracts to render equivalent styled adapters.

**Tech Stack:** TypeScript, React 18, Jest, Testing Library, jest-axe, Ant Design v5, Tailwind/shadcn-style components, @dnd-kit, Storybook, pnpm workspaces, tsup, Biome.

---

## Ground Rules

- Use TDD for every production behavior change.
- Keep `@x-filter/core` free of React/UI dependencies.
- Keep DnD dependencies out of `@x-filter/react`.
- Make `@x-filter/antd` and `@x-filter/shadcn` API-compatible where practical.
- Prefer small commits after each task.
- Run targeted tests first, then broader checks.

## Task 1: Add UI Adapter Dependencies

**Files:**
- Modify: `packages/antd/package.json`
- Modify: `packages/shadcn/package.json`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Add dependency expectations**

Update `packages/antd/package.json`:

```json
{
  "peerDependencies": {
    "antd": "^5.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@x-filter/react": "workspace:*"
  }
}
```

Update `packages/shadcn/package.json`:

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@x-filter/react": "workspace:*",
    "clsx": "^2.1.1"
  },
  "peerDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

Add test/dev dependencies at root if missing:

```json
{
  "devDependencies": {
    "antd": "^5.0.0",
    "jest-axe": "^9.0.0"
  }
}
```

**Step 2: Install**

Run:

```bash
pnpm install
```

Expected: lockfile updates without peer dependency failures.

**Step 3: Verify current baseline**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: existing tests, typecheck, and build still pass.

**Step 4: Commit**

```bash
git add package.json packages/antd/package.json packages/shadcn/package.json pnpm-lock.yaml
git commit -m "chore: add ui adapter dependencies"
```

## Task 2: Define Shared View-Model Types

**Files:**
- Modify: `packages/react/src/types.ts`
- Modify: `packages/react/src/index.ts`
- Create: `packages/react/src/__tests__/view-model-types.spec.ts`

**Step 1: Write type-focused usage tests**

Create `packages/react/src/__tests__/view-model-types.spec.ts`:

```ts
import type {
  FieldSchema,
  Filter,
  FilterGroup,
  FilterRule,
  ValidationError,
} from '@x-filter/core';
import type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterRuleViewModel,
} from '../types';

const ruleSlot: NonNullable<FilterBuilderSlots['Rule']> = (props) => {
  props.rule.id;
  props.actions.removeRule(props.rule.id);
  return null;
};

const labels: FilterBuilderLabels = {
  addRule: 'Add rule',
  removeRule: 'Remove rule',
};

const classNames: FilterBuilderClassNames = {
  root: 'root',
  rule: 'rule',
};

const ruleVm: FilterRuleViewModel = {
  kind: 'rule',
  id: 'r1',
  rule: { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
  field: { name: 'name', label: 'Name', type: 'text' },
  operator: { name: 'equals', label: 'equals', arity: 'binary' },
  errors: [],
  aria: { label: 'Rule name equals Ada' },
};

const groupVm: FilterGroupViewModel = {
  kind: 'group',
  id: 'root',
  group: { id: 'root', combinator: 'and', conditions: [] },
  depth: 0,
  children: [ruleVm],
  aria: { label: 'Filter group' },
};

test('shared adapter types support slots, labels, classNames, and view models', () => {
  expect(ruleSlot).toBeDefined();
  expect(labels.addRule).toBe('Add rule');
  expect(classNames.rule).toBe('rule');
  expect(groupVm.children[0]).toBe(ruleVm);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec jest --runInBand packages/react/src/__tests__/view-model-types.spec.ts
```

Expected: FAIL because exported types do not exist.

**Step 3: Add shared types**

Add to `packages/react/src/types.ts`:

```ts
import type {
  FieldSchema,
  Filter,
  FilterGroup,
  FilterRule,
  OperatorDef,
  ValidationError,
} from '@x-filter/core';

export type FilterBuilderActionHandlers = {
  addRule: (groupId: string, rule?: Partial<FilterRule>) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => void;
  addGroup: (groupId: string, group?: Partial<FilterGroup>) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>) => void;
  moveItem: (op: MoveOperation) => void;
};

export type FilterRuleViewModel = {
  kind: 'rule';
  id: string;
  rule: FilterRule;
  field?: FieldSchema;
  operator?: OperatorDef;
  errors: ValidationError[];
  aria: { label: string; describedBy?: string };
};

export type FilterGroupViewModel = {
  kind: 'group';
  id: string;
  group: FilterGroup;
  depth: number;
  children: FilterNodeViewModel[];
  aria: { label: string; describedBy?: string };
};

export type FilterNodeViewModel = FilterRuleViewModel | FilterGroupViewModel;

export type FilterBuilderLabels = Partial<{
  addRule: string;
  addGroup: string;
  removeRule: string;
  removeGroup: string;
  field: string;
  operator: string;
  value: string;
  combinator: string;
  not: string;
  dslInput: string;
}>;

export type FilterBuilderClassNames = Partial<{
  root: string;
  group: string;
  rule: string;
  fieldSelector: string;
  operatorSelector: string;
  valueEditor: string;
  actions: string;
  dslEditor: string;
  completionMenu: string;
}>;

export type FilterBuilderSlotProps = {
  filter: Filter;
  schema: FieldSchema[];
  actions: FilterBuilderActionHandlers;
};

export type FilterBuilderSlots = Partial<{
  Root: (props: FilterBuilderSlotProps & { children: React.ReactNode }) => React.ReactNode;
  Group: (props: FilterBuilderSlotProps & { group: FilterGroupViewModel }) => React.ReactNode;
  Rule: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => React.ReactNode;
  FieldSelector: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => React.ReactNode;
  OperatorSelector: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => React.ReactNode;
  ValueEditor: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => React.ReactNode;
}>;
```

Ensure `React.ReactNode` is imported as a type.

**Step 4: Export types**

Modify `packages/react/src/index.ts` to export the new types.

**Step 5: Run test to verify pass**

Run:

```bash
pnpm exec jest --runInBand packages/react/src/__tests__/view-model-types.spec.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/react/src/types.ts packages/react/src/index.ts packages/react/src/__tests__/view-model-types.spec.ts
git commit -m "feat: add shared filter builder adapter types"
```

## Task 3: Implement `useFilterViewModel`

**Files:**
- Create: `packages/react/src/use-filter-view-model.ts`
- Create: `packages/react/src/__tests__/use-filter-view-model.spec.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/types.ts`

**Step 1: Write failing tests**

Create `packages/react/src/__tests__/use-filter-view-model.spec.tsx`:

```tsx
import { renderHook } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { useFilterViewModel } from '../use-filter-view-model';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [{ name: 'gt', label: '>', arity: 'binary' }],
  },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    {
      id: 'g1',
      combinator: 'or',
      conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 30 }],
    },
  ],
};

test('builds nested group and rule view models', () => {
  const { result } = renderHook(() => useFilterViewModel({ filter, schema }));

  expect(result.current.root.kind).toBe('group');
  expect(result.current.root.children).toHaveLength(2);
  expect(result.current.root.children[0]).toMatchObject({
    kind: 'rule',
    id: 'r1',
    field: { name: 'name', label: 'Name' },
    operator: { name: 'equals' },
  });
  expect(result.current.root.children[1]).toMatchObject({
    kind: 'group',
    id: 'g1',
    depth: 1,
  });
});

test('adds validation errors to rule view models', () => {
  const { result } = renderHook(() =>
    useFilterViewModel({
      filter,
      schema,
      errors: {
        r1: [{ type: 'invalidValue', message: 'Bad value' }],
      },
    })
  );

  const rule = result.current.root.children[0];
  expect(rule.kind).toBe('rule');
  if (rule.kind === 'rule') {
    expect(rule.errors[0].message).toBe('Bad value');
    expect(rule.aria.describedBy).toContain('r1');
  }
});
```

**Step 2: Run tests to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/react/src/__tests__/use-filter-view-model.spec.tsx
```

Expected: FAIL because hook does not exist.

**Step 3: Implement hook**

Create `packages/react/src/use-filter-view-model.ts`:

```ts
import type { FieldSchema, Filter, FilterGroup, FilterRule, ValidationError } from '@x-filter/core';
import { getOperators, isFilterGroup } from '@x-filter/core';
import { useMemo } from 'react';
import type { FilterGroupViewModel, FilterNodeViewModel, FilterRuleViewModel } from './types';

export interface UseFilterViewModelOptions {
  filter: Filter;
  schema: FieldSchema[];
  errors?: Record<string, ValidationError[]>;
}

export interface UseFilterViewModelReturn {
  root: FilterGroupViewModel;
  schema: FieldSchema[];
}

function findField(schema: FieldSchema[], fieldName: string): FieldSchema | undefined {
  return schema.find((field) => field.name === fieldName);
}

function buildRule(rule: FilterRule, schema: FieldSchema[], errors: Record<string, ValidationError[]>): FilterRuleViewModel {
  const field = findField(schema, rule.field);
  const operator = field ? getOperators(field.type, field.operators).find((op) => op.name === rule.operator) : undefined;
  const ruleErrors = errors[rule.id] ?? [];

  return {
    kind: 'rule',
    id: rule.id,
    rule,
    field,
    operator,
    errors: ruleErrors,
    aria: {
      label: `Rule ${field?.label ?? rule.field || rule.id}`,
      describedBy: ruleErrors.length > 0 ? `${rule.id}-errors` : undefined,
    },
  };
}

function buildGroup(group: FilterGroup, schema: FieldSchema[], errors: Record<string, ValidationError[]>, depth: number): FilterGroupViewModel {
  const children: FilterNodeViewModel[] = group.conditions.map((condition) =>
    isFilterGroup(condition)
      ? buildGroup(condition, schema, errors, depth + 1)
      : buildRule(condition, schema, errors)
  );

  return {
    kind: 'group',
    id: group.id,
    group,
    depth,
    children,
    aria: {
      label: depth === 0 ? 'Filter builder root group' : `Filter group ${group.id}`,
    },
  };
}

export function useFilterViewModel(options: UseFilterViewModelOptions): UseFilterViewModelReturn {
  const { filter, schema, errors = {} } = options;

  return useMemo(
    () => ({
      root: buildGroup(filter, schema, errors, 0),
      schema,
    }),
    [filter, schema, errors]
  );
}
```

**Step 4: Export hook and types**

Modify `packages/react/src/index.ts`:

```ts
export type { UseFilterViewModelOptions, UseFilterViewModelReturn } from './use-filter-view-model';
export { useFilterViewModel } from './use-filter-view-model';
```

**Step 5: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/react/src/__tests__/use-filter-view-model.spec.tsx
pnpm exec jest --runInBand packages/react/src/__tests__/use-filter-builder.spec.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/react/src/use-filter-view-model.ts packages/react/src/__tests__/use-filter-view-model.spec.tsx packages/react/src/index.ts packages/react/src/types.ts
git commit -m "feat: add shared filter view model"
```

## Task 4: Add Shared DSL Editor View Model

**Files:**
- Create: `packages/react/src/use-dsl-editor.ts`
- Create: `packages/react/src/__tests__/use-dsl-editor.spec.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/types.ts`

**Step 1: Write failing tests**

Create `packages/react/src/__tests__/use-dsl-editor.spec.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { useDslEditor } from '../use-dsl-editor';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [{ value: 'open', label: 'Open' }],
  },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [{ id: 'r1', field: 'status', operator: 'equals', value: 'open' }],
};

test('returns field completions for draft input', () => {
  const onCommit = jest.fn();
  const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

  act(() => result.current.setDraftDSL('sta'));

  expect(result.current.completions[0]).toMatchObject({ kind: 'field', value: 'status' });
});

test('commits valid DSL and keeps invalid DSL as draft error', () => {
  const onCommit = jest.fn();
  const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

  act(() => result.current.setDraftDSL('status:equals:open'));
  act(() => result.current.commit());
  expect(onCommit).toHaveBeenCalledTimes(1);

  act(() => result.current.setDraftDSL('@@@'));
  act(() => result.current.commit());
  expect(result.current.parseError).toBeTruthy();
  expect(onCommit).toHaveBeenCalledTimes(1);
});
```

**Step 2: Run test to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/react/src/__tests__/use-dsl-editor.spec.tsx
```

Expected: FAIL because hook does not exist.

**Step 3: Implement hook**

Create `packages/react/src/use-dsl-editor.ts` as a wrapper around existing DSL primitives:

```ts
import { formatDSL, getDslCompletions, tryParseDSL } from '@x-filter/core';
import { useCallback, useMemo, useState } from 'react';
import type { UseFilterDslOptions } from './types';

export interface UseDslEditorOptions extends UseFilterDslOptions {
  cursor?: number;
}

export function useDslEditor(options: UseDslEditorOptions) {
  const { filter, schema, onCommit, cursor } = options;
  const [draftDSL, setDraftDSL] = useState(() => formatDSL(filter));
  const [parseError, setParseError] = useState<string | null>(null);

  const completions = useMemo(
    () => getDslCompletions({ input: draftDSL, cursor: cursor ?? draftDSL.length, schema }),
    [cursor, draftDSL, schema]
  );

  const commit = useCallback(() => {
    const result = tryParseDSL(draftDSL);
    if (!result.ok) {
      setParseError(result.errors.map((error) => `[${error.code}] ${error.message}`).join('; '));
      return false;
    }
    setParseError(null);
    onCommit(result.filter);
    return true;
  }, [draftDSL, onCommit]);

  return {
    draftDSL,
    setDraftDSL,
    parseError,
    completions,
    commit,
  };
}
```

**Step 4: Export hook**

Modify `packages/react/src/index.ts`:

```ts
export type { UseDslEditorOptions } from './use-dsl-editor';
export { useDslEditor } from './use-dsl-editor';
```

**Step 5: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/react/src/__tests__/use-dsl-editor.spec.tsx
pnpm exec jest --runInBand packages/react/src/__tests__/use-filter-dsl.spec.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/react/src/use-dsl-editor.ts packages/react/src/__tests__/use-dsl-editor.spec.tsx packages/react/src/index.ts packages/react/src/types.ts
git commit -m "feat: add shared dsl editor model"
```

## Task 5: Build Ant Design Atomic Components

**Files:**
- Create: `packages/antd/src/components/field-selector.tsx`
- Create: `packages/antd/src/components/operator-selector.tsx`
- Create: `packages/antd/src/components/value-editor.tsx`
- Create: `packages/antd/src/components/combinator-selector.tsx`
- Create: `packages/antd/src/components/not-toggle.tsx`
- Create: `packages/antd/src/components/rule-row.tsx`
- Create: `packages/antd/src/components/group-block.tsx`
- Create: `packages/antd/src/components/index.ts`
- Create: `packages/antd/src/__tests__/atomic-components.spec.tsx`
- Modify: `packages/antd/src/index.tsx`

**Step 1: Write failing component tests**

Create `packages/antd/src/__tests__/atomic-components.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, FilterRule } from '@x-filter/core';
import { AntdFieldSelector, AntdOperatorSelector, AntdValueEditor } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [{ name: 'gt', label: '>', arity: 'binary' }],
  },
];

const rule: FilterRule = { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' };

test('AntdFieldSelector renders field options and emits field changes', () => {
  const onChange = jest.fn();
  render(<AntdFieldSelector schema={schema} rule={rule} onChange={onChange} />);

  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(screen.getByText('Age'));

  expect(onChange).toHaveBeenCalledWith('age');
});

test('AntdOperatorSelector renders operators for selected field', () => {
  const onChange = jest.fn();
  render(<AntdOperatorSelector schema={schema} rule={rule} onChange={onChange} />);

  expect(screen.getByText('equals')).not.toBeNull();
});

test('AntdValueEditor emits text value changes', () => {
  const onChange = jest.fn();
  render(<AntdValueEditor schema={schema} rule={rule} onChange={onChange} />);

  fireEvent.change(screen.getByDisplayValue('Ada'), { target: { value: 'Grace' } });

  expect(onChange).toHaveBeenCalledWith('Grace');
});
```

**Step 2: Run test to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/atomic-components.spec.tsx
```

Expected: FAIL because components do not exist.

**Step 3: Implement minimal atomic components**

Implement Ant Design components using `Select`, `Input`, `InputNumber`, `DatePicker`, `Checkbox`, `Button`, `Card`, and `Space`.

`AntdValueEditor` behavior:

- `text`, `select`, `multiSelect`: string/select input.
- `number`: `InputNumber`.
- `boolean`: `Checkbox`.
- `date`: `DatePicker` with string conversion.
- unknown/missing field: text `Input`.
- unary operators: disabled input or no value editor.

**Step 4: Export components**

Modify `packages/antd/src/index.tsx`:

```ts
export * from './components';
export type { UseFilterBuilderReturn, UseFilterDslReturn } from '@x-filter/react';
```

Keep legacy `FilteredList` export until explicitly removed.

**Step 5: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/atomic-components.spec.tsx
pnpm --filter @x-filter/antd typecheck
```

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/antd/src
git commit -m "feat: add antd filter atomic components"
```

## Task 6: Build Ant Design Full Builder

**Files:**
- Create: `packages/antd/src/components/filter-builder.tsx`
- Create: `packages/antd/src/__tests__/filter-builder.spec.tsx`
- Modify: `packages/antd/src/components/index.ts`

**Step 1: Write failing builder tests**

Create `packages/antd/src/__tests__/filter-builder.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
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
  conditions: [],
};

test('AntdFilterBuilder adds a rule through the full builder', () => {
  const onChange = jest.fn();
  render(<AntdFilterBuilder schema={schema} value={filter} onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: /add rule/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ field: '' })],
    })
  );
});

test('AntdFilterBuilder renders custom ValueEditor slot', () => {
  render(
    <AntdFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      slots={{ ValueEditor: () => <div>Custom value</div> }}
    />
  );

  expect(screen.getByText('Custom value')).not.toBeNull();
});
```

**Step 2: Run test to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/filter-builder.spec.tsx
```

Expected: FAIL because `AntdFilterBuilder` does not exist.

**Step 3: Implement `AntdFilterBuilder`**

Use:

- `useFilterBuilder` for state.
- `useFilterViewModel` for render tree.
- Ant Design atomics for default rendering.
- `slots` overrides for internal components.
- `labels` defaults:

```ts
const defaultLabels = {
  addRule: 'Add rule',
  addGroup: 'Add group',
  removeRule: 'Remove rule',
  removeGroup: 'Remove group',
};
```

**Step 4: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/filter-builder.spec.tsx packages/antd/src/__tests__/atomic-components.spec.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/antd/src
git commit -m "feat: add antd filter builder"
```

## Task 7: Build shadcn Atomic Components

**Files:**
- Create: `packages/shadcn/src/components/primitives.tsx`
- Create: `packages/shadcn/src/components/field-selector.tsx`
- Create: `packages/shadcn/src/components/operator-selector.tsx`
- Create: `packages/shadcn/src/components/value-editor.tsx`
- Create: `packages/shadcn/src/components/combinator-selector.tsx`
- Create: `packages/shadcn/src/components/not-toggle.tsx`
- Create: `packages/shadcn/src/components/rule-row.tsx`
- Create: `packages/shadcn/src/components/group-block.tsx`
- Create: `packages/shadcn/src/components/index.ts`
- Create: `packages/shadcn/src/__tests__/atomic-components.spec.tsx`
- Modify: `packages/shadcn/src/index.tsx`

**Step 1: Write failing component tests**

Create `packages/shadcn/src/__tests__/atomic-components.spec.tsx` with the same behavioral assertions as Ant Design, importing `ShadcnFieldSelector`, `ShadcnOperatorSelector`, and `ShadcnValueEditor`.

Use native user events:

```tsx
fireEvent.change(screen.getByLabelText(/field/i), { target: { value: 'age' } });
expect(onChange).toHaveBeenCalledWith('age');
```

**Step 2: Run test to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/shadcn/src/__tests__/atomic-components.spec.tsx
```

Expected: FAIL because components do not exist.

**Step 3: Implement shadcn-style primitives**

Create local primitives in `packages/shadcn/src/components/primitives.tsx`:

- `Button`
- `Input`
- `Select`
- `Card`
- `Checkbox`
- `cn`

Use Tailwind/shadcn-style classes and avoid app-specific import aliases.

**Step 4: Implement atomics**

Mirror Ant Design atomics behavior and prop names. Use plain semantic elements plus Tailwind classes.

**Step 5: Export components**

Modify `packages/shadcn/src/index.tsx`:

```ts
export * from './components';
export type { UseFilterBuilderReturn, UseFilterDslReturn } from '@x-filter/react';
```

Keep legacy `ValidatedInput` export until explicitly removed.

**Step 6: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/shadcn/src/__tests__/atomic-components.spec.tsx
pnpm --filter @x-filter/shadcn typecheck
```

Expected: PASS.

**Step 7: Commit**

```bash
git add packages/shadcn/src
git commit -m "feat: add shadcn filter atomic components"
```

## Task 8: Build shadcn Full Builder

**Files:**
- Create: `packages/shadcn/src/components/filter-builder.tsx`
- Create: `packages/shadcn/src/__tests__/filter-builder.spec.tsx`
- Modify: `packages/shadcn/src/components/index.ts`

**Step 1: Write failing builder tests**

Create `packages/shadcn/src/__tests__/filter-builder.spec.tsx` mirroring the Ant Design builder tests:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { ShadcnFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };

test('ShadcnFilterBuilder adds a rule through the full builder', () => {
  const onChange = jest.fn();
  render(<ShadcnFilterBuilder schema={schema} value={filter} onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: /add rule/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ field: '' })],
    })
  );
});
```

**Step 2: Run test to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/shadcn/src/__tests__/filter-builder.spec.tsx
```

Expected: FAIL because `ShadcnFilterBuilder` does not exist.

**Step 3: Implement builder**

Mirror `AntdFilterBuilder` behavior using shadcn atomics. Keep prop names aligned.

**Step 4: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/shadcn/src/__tests__/filter-builder.spec.tsx packages/shadcn/src/__tests__/atomic-components.spec.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/shadcn/src
git commit -m "feat: add shadcn filter builder"
```

## Task 9: Add Shared Adapter Behavior Tests

**Files:**
- Create: `packages/react/src/testing/filter-builder-adapter-contract.tsx`
- Create: `packages/antd/src/__tests__/adapter-contract.spec.tsx`
- Create: `packages/shadcn/src/__tests__/adapter-contract.spec.tsx`

**Step 1: Write shared contract helper**

Create `packages/react/src/testing/filter-builder-adapter-contract.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import type { FieldSchema, Filter } from '@x-filter/core';

export interface FilterBuilderAdapterProps {
  schema: FieldSchema[];
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
}

export function runFilterBuilderAdapterContract(
  name: string,
  Builder: ComponentType<FilterBuilderAdapterProps>
) {
  const schema: FieldSchema[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    },
  ];

  test(`${name}: adds a rule`, () => {
    const onChange = jest.fn();
    render(<Builder schema={schema} value={{ id: 'root', combinator: 'and', conditions: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }));
    expect(onChange).toHaveBeenCalled();
  });
}
```

**Step 2: Use contract in both UI packages**

Create `packages/antd/src/__tests__/adapter-contract.spec.tsx`:

```tsx
import { runFilterBuilderAdapterContract } from '@x-filter/react/testing/filter-builder-adapter-contract';
import { AntdFilterBuilder } from '../index';

runFilterBuilderAdapterContract('antd', AntdFilterBuilder);
```

Create shadcn equivalent.

**Step 3: Run tests to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/adapter-contract.spec.tsx packages/shadcn/src/__tests__/adapter-contract.spec.tsx
```

Expected: initially fail if test export/subpath is missing.

**Step 4: Decide test-only access**

If package exports block test helper imports, keep the helper as test-local duplicated utility under `packages/*/src/__tests__/helpers/adapter-contract.tsx`. Do not add public testing exports unless there is a clear public need.

**Step 5: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/adapter-contract.spec.tsx packages/shadcn/src/__tests__/adapter-contract.spec.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/react/src/testing packages/antd/src/__tests__ packages/shadcn/src/__tests__
git commit -m "test: add ui adapter behavior contract"
```

## Task 10: Add DSL Editor and Completion UI

**Files:**
- Create: `packages/antd/src/components/dsl-editor.tsx`
- Create: `packages/antd/src/components/completion-menu.tsx`
- Create: `packages/antd/src/__tests__/dsl-editor.spec.tsx`
- Create: `packages/shadcn/src/components/dsl-editor.tsx`
- Create: `packages/shadcn/src/components/completion-menu.tsx`
- Create: `packages/shadcn/src/__tests__/dsl-editor.spec.tsx`
- Modify: `packages/antd/src/components/filter-builder.tsx`
- Modify: `packages/shadcn/src/components/filter-builder.tsx`

**Step 1: Write failing Ant Design DSL tests**

Create `packages/antd/src/__tests__/dsl-editor.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [{ value: 'open', label: 'Open' }],
  },
];

const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };

test('AntdFilterBuilder commits valid DSL and shows parse errors for invalid DSL', () => {
  const onChange = jest.fn();
  render(<AntdFilterBuilder schema={schema} value={filter} onChange={onChange} dsl />);

  fireEvent.change(screen.getByLabelText(/dsl/i), { target: { value: 'status:equals:open' } });
  fireEvent.click(screen.getByRole('button', { name: /apply dsl/i }));
  expect(onChange).toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText(/dsl/i), { target: { value: '@@@' } });
  fireEvent.click(screen.getByRole('button', { name: /apply dsl/i }));
  expect(screen.getByText(/unexpected/i)).not.toBeNull();
});
```

**Step 2: Mirror test for shadcn**

Create `packages/shadcn/src/__tests__/dsl-editor.spec.tsx` with same behavior using `ShadcnFilterBuilder`.

**Step 3: Run tests to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/dsl-editor.spec.tsx packages/shadcn/src/__tests__/dsl-editor.spec.tsx
```

Expected: FAIL because DSL UI is missing.

**Step 4: Implement DSL components**

Use `useDslEditor` in builder when `dsl` prop is true.

Required UI:

- Textarea/input with `aria-label="DSL"`
- Apply button with accessible label.
- Parse error display.
- Completion menu using `role="listbox"` and `role="option"`.
- Keyboard navigation for completion menu.

**Step 5: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/dsl-editor.spec.tsx packages/shadcn/src/__tests__/dsl-editor.spec.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add packages/antd/src packages/shadcn/src
git commit -m "feat: add dsl editor ui adapters"
```

## Task 11: Add DnD Adapter Integration

**Files:**
- Create: `packages/antd/src/components/sortable-context.tsx`
- Create: `packages/antd/src/__tests__/dnd-contract.spec.tsx`
- Create: `packages/shadcn/src/components/sortable-context.tsx`
- Create: `packages/shadcn/src/__tests__/dnd-contract.spec.tsx`
- Modify: `packages/antd/src/components/filter-builder.tsx`
- Modify: `packages/shadcn/src/components/filter-builder.tsx`

**Step 1: Write failing adapter-boundary tests**

Avoid testing browser drag internals. Test that adapter exposes keyboard fallback and maps move operations.

Create `packages/antd/src/__tests__/dnd-contract.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text', operators: [{ name: 'equals', label: 'equals', arity: 'binary' }] },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'A' },
    { id: 'r2', field: 'name', operator: 'equals', value: 'B' },
  ],
};

test('AntdFilterBuilder exposes keyboard move action when dnd is enabled', () => {
  const onChange = jest.fn();
  render(<AntdFilterBuilder schema={schema} value={filter} onChange={onChange} dnd />);

  fireEvent.click(screen.getByRole('button', { name: /move r2 up/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r2' }), expect.objectContaining({ id: 'r1' })],
    })
  );
});
```

Mirror for shadcn.

**Step 2: Run tests to verify failure**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/dnd-contract.spec.tsx packages/shadcn/src/__tests__/dnd-contract.spec.tsx
```

Expected: FAIL because DnD controls are missing.

**Step 3: Implement DnD boundary**

- Use `@dnd-kit/core` and `@dnd-kit/sortable` in UI packages.
- Keep keyboard move buttons even if pointer DnD is unavailable in test environments.
- Use `useReorderContract` for move validation and mutation.

**Step 4: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/dnd-contract.spec.tsx packages/shadcn/src/__tests__/dnd-contract.spec.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/antd/src packages/shadcn/src
git commit -m "feat: add dnd support to ui adapters"
```

## Task 12: Add Accessibility Tests

**Files:**
- Create: `packages/antd/src/__tests__/a11y.spec.tsx`
- Create: `packages/shadcn/src/__tests__/a11y.spec.tsx`

**Step 1: Write failing/passing a11y tests**

Create `packages/antd/src/__tests__/a11y.spec.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text', operators: [{ name: 'equals', label: 'equals', arity: 'binary' }] },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
};

test('AntdFilterBuilder has no obvious accessibility violations', async () => {
  const { container } = render(<AntdFilterBuilder schema={schema} value={filter} onChange={jest.fn()} dsl dnd />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Create shadcn equivalent.

**Step 2: Run tests**

Run:

```bash
pnpm exec jest --runInBand packages/antd/src/__tests__/a11y.spec.tsx packages/shadcn/src/__tests__/a11y.spec.tsx
```

Expected: initially may fail due missing labels. Fix labels, not tests.

**Step 3: Add missing labels**

Ensure all inputs/buttons/selects have labels or aria-labels.

**Step 4: Run tests**

Run same command.

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/antd/src packages/shadcn/src
git commit -m "test: add accessibility coverage for ui adapters"
```

## Task 13: Add Storybook Demo App

**Files:**
- Create: `apps/storybook/package.json`
- Create: `apps/storybook/.storybook/main.ts`
- Create: `apps/storybook/.storybook/preview.ts`
- Create: `apps/storybook/src/filter-builder.stories.tsx`
- Modify: `pnpm-workspace.yaml` if needed
- Modify: `package.json`

**Step 1: Add scripts and app**

Add `apps/storybook/package.json`:

```json
{
  "name": "@x-filter/storybook",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@x-filter/antd": "workspace:*",
    "@x-filter/core": "workspace:*",
    "@x-filter/react": "workspace:*",
    "@x-filter/shadcn": "workspace:*",
    "antd": "^5.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "storybook": "^8.0.0"
  }
}
```

**Step 2: Add stories**

Create stories for:

- Ant Design basic tree.
- shadcn basic tree.
- DSL inline.
- DnD.
- Error state.
- Custom slot.

**Step 3: Run**

Run:

```bash
pnpm --filter @x-filter/storybook build
```

Expected: Storybook builds.

**Step 4: Commit**

```bash
git add apps/storybook package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "docs: add ui adapter storybook demos"
```

## Task 14: Documentation and README Updates

**Files:**
- Modify: `packages/antd/README.md`
- Modify: `packages/shadcn/README.md`
- Modify: `packages/react/README.md`
- Modify: `apps/playground/src/App.tsx`

**Step 1: Update READMEs**

Document:

- Installation.
- Required peer dependencies.
- Basic full builder usage.
- Atomic component usage.
- Slots/customization.
- DSL and DnD props.
- Accessibility notes.

**Step 2: Update playground**

Use both `AntdFilterBuilder` and `ShadcnFilterBuilder` in `apps/playground/src/App.tsx` or link to Storybook if playground should remain light.

**Step 3: Run docs-adjacent checks**

Run:

```bash
pnpm --filter @x-filter/playground build
pnpm check
```

Expected: PASS.

**Step 4: Commit**

```bash
git add packages/antd/README.md packages/shadcn/README.md packages/react/README.md apps/playground/src/App.tsx
git commit -m "docs: document antd and shadcn support"
```

## Task 15: Final Verification

**Files:**
- No source changes expected.

**Step 1: Full local verification**

Run:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm check
pnpm build
```

Expected:

- All tests pass.
- Typecheck passes across workspaces.
- Biome lint/check passes.
- Workspace build passes.

**Step 2: Inspect changed package surfaces**

Run:

```bash
pnpm --filter @x-filter/antd build
pnpm --filter @x-filter/shadcn build
pnpm --filter @x-filter/react build
```

Expected: declarations and CJS/ESM outputs are generated.

**Step 3: Review public API exports**

Run:

```bash
grep -R "AntdFilterBuilder\\|ShadcnFilterBuilder\\|useFilterViewModel\\|useDslEditor" packages/*/dist/index.d.ts
```

Expected: expected new public APIs are exported.

**Step 4: Commit if any final fixes were required**

```bash
git add .
git commit -m "fix: finalize ui adapter support"
```

Skip commit if there are no changes.

## Completion Criteria

- `@x-filter/antd` exports Ant Design atomic components and `AntdFilterBuilder`.
- `@x-filter/shadcn` exports shadcn-style atomic components and `ShadcnFilterBuilder`.
- Both UI packages support slots/custom render surfaces.
- Both UI packages support DSL editing.
- Both UI packages support DnD with keyboard fallback.
- Shared behavior lives in `@x-filter/react`.
- A11y tests cover primary builder states.
- Storybook demonstrates parity between Ant Design and shadcn.
- Full workspace verification passes.

