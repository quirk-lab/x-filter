import type { FilterAny, FilterGroup, FilterGroupIC, FilterRule } from './types';
import { isFilterGroup, isFilterRule } from './types';

type AnyNode = FilterRule | FilterGroup | FilterGroupIC;

function isGroupLike(node: unknown): node is FilterGroup | FilterGroupIC {
  return typeof node === 'object' && node !== null && 'conditions' in node;
}

export function findById(filter: FilterAny, id: string): AnyNode | undefined {
  if (filter.id === id) return filter;

  for (const c of filter.conditions) {
    if (typeof c === 'string') continue;
    if (c.id === id) return c;
    if (isGroupLike(c)) {
      const found = findById(c as FilterAny, id);
      if (found) return found;
    }
  }

  return undefined;
}

export function findParent(filter: FilterAny, id: string): FilterGroup | FilterGroupIC | undefined {
  for (const c of filter.conditions) {
    if (typeof c === 'string') continue;
    if (c.id === id) return filter;
    if (isGroupLike(c)) {
      const found = findParent(c as FilterAny, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function getPath(filter: FilterAny, id: string): string[] {
  const path: string[] = [];
  if (findPathHelper(filter, id, path)) {
    return path;
  }
  return [];
}

function findPathHelper(node: FilterAny, targetId: string, path: string[]): boolean {
  path.push(node.id);
  if (node.id === targetId) return true;

  for (const c of node.conditions) {
    if (typeof c === 'string') continue;
    if (!isGroupLike(c)) {
      if (c.id === targetId) {
        path.push(c.id);
        return true;
      }
    } else {
      if (findPathHelper(c as FilterAny, targetId, path)) {
        return true;
      }
    }
  }

  path.pop();
  return false;
}

export type TraverseCallback = (node: AnyNode, depth: number) => void;

export function traverse(filter: FilterAny, callback: TraverseCallback): void {
  traverseNode(filter, callback, 0);
}

function traverseNode(node: AnyNode, callback: TraverseCallback, depth: number): void {
  callback(node, depth);

  if (isGroupLike(node)) {
    const group = node as FilterGroup | FilterGroupIC;
    for (const c of group.conditions) {
      if (typeof c === 'string') continue;
      traverseNode(c, callback, depth + 1);
    }
  }
}

export function flattenRules(filter: FilterAny): FilterRule[] {
  const rules: FilterRule[] = [];
  traverse(filter, (node) => {
    if (isFilterRule(node) && !isFilterGroup(node)) {
      rules.push(node as FilterRule);
    }
  });
  return rules;
}
