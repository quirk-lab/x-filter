# 统一 Filter 树遍历原语：walk + mapTree

## Context

core 包内四处独立实现了 Filter 树的递归遍历：mutations.ts、negate.ts、ic.ts、validate.ts + serialize-json.ts。negate.ts 仅为切换 `not` 标志（2 行 mutation）却完整复制了 mutations.ts 的遍历骨架（~65 行重复）。IC 模式的 update/remove 又另写一套。变更检测与不可变重建逻辑分散，moveRule 跨组边界靠事后去重修补。

## Decision

提取两个正交原语，取代散落的遍历骨架：

- **`walk(filter, visitor)`** — 只读遍历。visitor 见节点不见胶水（IC 的 combinator 字符串不进回调）。服务于 findById / findParent / flattenRules 等只读场景。
- **`mapTree(filter, { onGroup, onRule? })`** — 不可变 transform。回调必须显式返回节点，内部用引用相等做短路（`updated !== c`）与外壳重建。`onGroup` 为主入口，签名 `(group) => group`，调用方全权处理 children；`onRule` 为可选语法糖。

具体约束：

1. **id 过滤下放到回调**，`mapTree` 不内建 targetId。提供薄 helper `updateById(filter, id, updater)` 作为糖。
2. **IC combinator 不进 visitor**，原样透传。`mapTree` 对 Standard 与 IC 行为对称。
3. **IC remove 保留专用函数**（`removeChildICFromTree`），通过 `mapTree` 的 `onGroup` 接入——splice 节点 + 相邻 combinator 的跨元素逻辑住在 onGroup 实现里，不污染原语接口。
4. **negate.ts 折叠进 mutations.ts**，`negateRule` / `negateGroup` 变成 `updateById` 的一行包装。
5. **moveRule 改为一次遍历**：先 `findById` 只读找 rule，再 `mapTree` 用 closure 捕获 rule/targetGroupId/position，`onGroup` 内源组删、目标组插同时发生。消灭 `removeDuplicateRule` 与两次遍历。同组移动的 position 语义保持"删除后索引"。
6. **validate.ts 不进 walk**。validate 的位置敏感验证（IC 奇偶结构、index % 2 期望类型）与"对每个节点做同一件事"的 walk 形态不匹配；Standard 与 IC 两套验证递归保持独立，因两种结构的验证规则本就该不同。
7. **serialize-json.ts 同样不在本次范围**。它有自己的递归（groupToJSON / groupICToJSON），但形态是"折叠成 JSON 对象"而非"对每个节点做同一件事"，与 walk/mapTree 不匹配。如未来出现其他序列化格式共享需求，再单独评估。

## Considered Options

- **统一 `walk` 用 flag/重载区分读写**： rejected — 接口臃肿，读遍历不需要 changed 跟踪，写 transform 不需要 depth。
- **`mapTree` 内建 targetId 参数**： rejected — id 过滤是调用方关注点，下放回调保持原语纯粹。
- **combinator 进 visitor（onCombinator 钩子）**： rejected — 现有所有 mutation 从不变换 combinator 本身；IC remove 的 splice 是结构级操作不是 combinator 变换。YAGNI。
- **`mapTree` 加 onConditions（整数组变换）钩子容纳 IC remove**： rejected — onGroup 已能拿到整个 group，整数组钩子让接口变胖且与 onGroup 互斥易写错。
- **`mapTree` 加 context 参数供 moveRule 协调源/目标组**： rejected — closure 捕获是 JS 自然方式，不污染原语接口。
- **validate 用 walk 统一**： rejected — 位置敏感验证与 walk 形态不匹配；强行统一会让 walk 长出只有 validate 用的 index/parent 参数。

## Consequences

- 遍历骨架（递归 + 引用短路 + 外壳重建）只此一份，存在于 `mapTree`。
- 变更检测 bug（如 moveRule 跨组边界）只存在于一处。
- negate.ts 删除，减少 ~65 行重复。
- IC remove 是唯一不走"逐元素 visitor"的变更，但它的 splice 逻辑通过 onGroup 接入，仍复用 mapTree 的递归骨架。
- validate 保持两套递归——这是有意的区分，不是待消除的重复。
