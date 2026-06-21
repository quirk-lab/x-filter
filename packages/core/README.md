# @x-filter/core

[![npm version](https://img.shields.io/npm/v/@x-filter/core.svg)](https://www.npmjs.com/package/@x-filter/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

Schema-driven filter query builder core — tree model, immutable mutations, validation, DSL parser/formatter, and query exporters (SQL, JsonLogic, MongoDB, Elasticsearch). Zero runtime dependencies.

## Install

```bash
pnpm add @x-filter/core
# or
npm install @x-filter/core
```

## Usage

```typescript
import { createFilter, addRule, validate } from '@x-filter/core';
import type { FieldSchema } from '@x-filter/core';

const schema: FieldSchema[] = [
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', values: [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ]},
];

const filter = createFilter();
const next = addRule(filter, 'root', {
  id: 'r1',
  field: 'age',
  operator: 'gt',
  value: 18,
});

const result = validate(next, schema);
console.log(result.valid); // true
```

## API

### Tree model

| Export | Description |
| --- | --- |
| `createFilter` | Create an empty filter group (root node). |
| `createRule` | Create a rule with generated or provided id. |
| `createGroup` | Create a nested group. |
| `isFilterGroup` | Type guard for `FilterGroup`. |
| `isFilterRule` | Type guard for `FilterRule`. |
| `isLocked` | Check if a node is locked from edits. |

### Mutations (standard tree)

All mutations are pure — they return a new `Filter` and never mutate the input.

| Export | Description |
| --- | --- |
| `addRule` | Add a rule to a group. |
| `updateRule` | Update a rule's field/operator/value. |
| `removeRule` | Remove a rule by id. |
| `moveRule` | Move a rule between groups. |
| `cloneRule` | Clone a rule with a new id. |
| `addGroup` | Add a nested group. |
| `updateGroup` | Update a group's combinator/not. |
| `removeGroup` | Remove a group by id. |
| `cloneGroup` | Clone a group with new ids. |
| `negateRule` | Toggle `not` on a rule. |
| `negateGroup` | Toggle `not` on a group. |

### Mutations (IC tree)

IC (inline-combinator) mode uses `FilterGroupIC` where combinators sit between children. These functions mirror the standard mutations:

`addRuleIC`, `updateRuleIC`, `removeRuleIC`, `moveRuleIC`, `cloneRuleIC`, `addGroupIC`, `updateGroupIC`, `removeGroupIC`, `cloneGroupIC`, `setCombinatorIC`, `convertToIC`, `convertFromIC`, `isFilterGroupIC`.

### Mutation adapters

| Export | Description |
| --- | --- |
| `standardMutationAdapter` | Adapter that dispatches to standard tree mutations. |
| `icMutationAdapter` | Adapter that dispatches to IC tree mutations. |

### Traversal

| Export | Description |
| --- | --- |
| `traverse` | Depth-first traversal with callback. |
| `walk` | Walk the tree with a visitor callback. |
| `findById` | Find a node by id. |
| `findParent` | Find the parent of a node by id. |
| `getPath` | Get the path from root to a node. |
| `flattenRules` | Flatten all rules into an array. |
| `mapTree` | Map over the tree, returning a new tree. |
| `updateById` | Update a node by id immutably. |

### Validation

| Export | Description |
| --- | --- |
| `validate` | Validate a filter against a schema. Returns `{ valid, errors }`. |

### Serialization

| Export | Description |
| --- | --- |
| `toJSON` | Serialize a filter to a JSON-safe object. |
| `fromJSON` | Deserialize a JSON object back to a filter. |

### DSL

| Export | Description |
| --- | --- |
| `formatDSL` | Convert a `Filter` into DSL text. |
| `parseDSL` | Parse DSL text into a `Filter`. Throws on error. |
| `tryParseDSL` | Parse DSL text, returning `{ filter, errors }` instead of throwing. |
| `tokenize` | Tokenize DSL text into tokens. |
| `parse` | Parse tokens into an AST. |
| `filterToAst` | Convert a `Filter` to an AST. |
| `astToFilter` | Convert an AST back to a `Filter`. |
| `formatAST` | Format an AST to DSL text. |
| `getDslCompletions` | Get autocomplete items for a DSL completion context. |

### Query exporters

Each exporter accepts an optional `fieldMap` to remap field names.

| Export | Sub-path | Output |
| --- | --- | --- |
| `toSQL` | `@x-filter/core/sql` | `{ sql: string, params: unknown[] }` |
| `toJsonLogic` | `@x-filter/core/jsonlogic` | JsonLogic object |
| `toMongoQuery` | `@x-filter/core/mongodb` | MongoDB query object |
| `toElasticQuery` | `@x-filter/core/elasticsearch` | Elasticsearch query object |

`toJsonLogic`, `toMongoQuery`, and `toElasticQuery` are also re-exported from the main entry point.

### Operators

| Export | Description |
| --- | --- |
| `defaultOperators` | Built-in operator definitions. |
| `getOperators` | Get operators for a field type. |

### Types

`Filter`, `FilterGroup`, `FilterGroupIC`, `FilterIC`, `FilterRule`, `FilterAny`, `FieldSchema`, `FieldType`, `OperatorDef`, `Option`, `Combinator`, `SQLResult`, `ValidationError`, `ValidationResult`, `MutationAdapter`, `MutationOptions`, `IdGenerator`.

## License

MIT © [quirk-lab](https://github.com/quirk-lab)
