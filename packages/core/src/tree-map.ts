import { isFilterGroupIC } from './ic';
import type { FilterAny, FilterGroup, FilterGroupIC, FilterRule } from './types';
import { isFilterGroup } from './types';

type AnyNode = FilterRule | FilterGroup | FilterGroupIC;

export interface MapTreeVisitor {
  /** Called for every group node. Must return a group (same ref = no change). */
  onGroup?: (group: FilterGroup | FilterGroupIC) => FilterGroup | FilterGroupIC;
  /** Called for every rule node. Must return a rule (same ref = no change). */
  onRule?: (rule: FilterRule) => FilterRule;
}

export function mapTree(filter: FilterAny, visitor: MapTreeVisitor): FilterAny {
  return mapNode(filter, visitor) as FilterAny;
}

function mapNode(node: AnyNode, visitor: MapTreeVisitor): AnyNode {
  if (isFilterGroup(node) || isFilterGroupIC(node)) {
    return mapGroupLike(node, visitor);
  }
  return visitor.onRule ? visitor.onRule(node as FilterRule) : node;
}

function mapGroupLike(
  group: FilterGroup | FilterGroupIC,
  visitor: MapTreeVisitor
): FilterGroup | FilterGroupIC {
  // onGroup transforms the SHELL only (combinator, not, etc). It should NOT
  // change the child refs — if it needs to modify children (e.g. IC splice
  // for remove), it must keep the same rule/group object refs so mapTree's
  // recursion is idempotent. mapTree then recurses into those refs, applying
  // onRule/onGroup, and short-circuits via reference equality when nothing changes.
  const afterOnGroup = visitor.onGroup ? visitor.onGroup(group) : group;

  let changed = afterOnGroup !== group;

  const newChildren = afterOnGroup.children.map((c) => {
    if (typeof c === 'string') return c; // IC combinator passthrough
    const mapped = mapNode(c, visitor);
    if (mapped !== c) changed = true;
    return mapped;
  });

  if (!changed) return group; // short-circuit: return original ref
  return { ...afterOnGroup, children: newChildren };
}

/**
 * Thin helper: transform the node (rule or group) with matching id, leave others.
 * Returns same root ref by reference when id not found.
 */
export function updateById(
  filter: FilterAny,
  id: string,
  updater: (node: AnyNode) => AnyNode
): FilterAny {
  return mapTree(filter, {
    onGroup: (g) => (g.id === id ? (updater(g) as FilterGroup | FilterGroupIC) : g),
    onRule: (r) => (r.id === id ? (updater(r) as FilterRule) : r),
  }) as FilterAny;
}
