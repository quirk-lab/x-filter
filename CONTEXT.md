# Context — x-filter

## Glossary

### Filter

The serializable, mutable-by-replacement domain tree a user authors. A `Filter`
is a `FilterGroup` whose `conditions` hold `FilterRule`s and nested
`FilterGroup`s. The core mutators (`addRule`, `updateRule`, `moveRule`, ...)
produce a new `Filter` that **structurally shares** every untouched subtree —
unchanged nodes retain `===` identity across a mutation.

### FilterRule / FilterGroup

The two node kinds inside a `Filter`. A rule is a leaf
(`field` / `operator` / `value`); a group is a branch
(`combinator` / `conditions`).

### ViewModel

A React-facing projection of a `Filter` node
(`FilterRuleViewModel` / `FilterGroupViewModel`) carrying resolved
`FieldSchema` / `OperatorDef`, parsed `aria` labels, validation `errors`, and
nested `depth`. ViewModels are **derived**, never user-authored; they are the
shape `<Rule>` / `<Group>` components render against.

### 增量构造 (incremental construction)

Reusing ViewModel nodes whose source `Filter` node is `===` to the previous
render, so only the mutated spine of the tree allocates new ViewModels.

### 增量渲染 (incremental rendering)

Ensuring only the `<Rule>` / `<Group>` components whose ViewModel is
non-`===` actually re-render. Distinct from 增量构造: a structurally-shared
ViewModel tree still triggers a full re-render unless the component layer
opts out via `React.memo` + stable props.

> **Resolved framing (2026-06-20):** the 50-rule keystroke pain is
> *incremental rendering* first, *incremental construction* second. A
> ViewModel-layer-only fix is not visible without the render-layer fix.

### 错误传播 (error propagation)

`ValidationError[]` keyed by `ruleId`. To preserve 增量构造, the `errors`
channel must be **identity-stable per rule**: a rule whose `FilterRule` is
`===` across a mutation must also keep an `===` `errors[ruleId]` array, or
both ViewModel reuse and `React.memo` on `<Rule>` break.

> **Resolved (2026-06-20):** make `validate` identity-aware — carry forward
> the previous `errors[ruleId]` array reference for `===` source rules, the
> same structural-sharing pattern already used in `mutations.ts`. ViewModel
> cache key is the pair `(source ===, errors[ruleId] ===)`.

### 列表虚拟化 (list virtualization)

Windowing the rendered rule list so only visible `<Rule>` components mount.
Orthogonal to 增量构造 / 增量渲染: virtualization bounds **DOM node count**;
identity-sharing bounds **re-render count**. Both can coexist.

> **Resolved scale threshold (2026-06-20):** the identity-aware `useMemo`
> (option A) plus `React.memo` on `<Rule>` is done **unconditionally** —
> ~35 lines, zero API change, net positive at any scale. The per-node
> hook + Context approach (option B) is **rejected**: its refactor cost is
> only justified when A's O(n) `===` walk is itself the profiler-confirmed
> bottleneck, which for human-authored filter trees is effectively never.
> The "50 rules" figure in the original proposal is a **pseudo-threshold**
> (reasoning, not measurement); the real trigger is "profiled re-render
> bottleneck". Large-scale (hundreds of rules) is handled by 列表虚拟化,
> not by B.
