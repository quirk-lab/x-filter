import { generateId, type IdGenerator } from './id';
import type { Combinator, FilterGroup, FilterGroupIC, FilterRule } from './types';

type CloneableNode = FilterRule | FilterGroup | FilterGroupIC;
type CloneableChild = CloneableNode | Combinator;

/** Deep-copies a rule value so a clone never shares array/object references. */
export function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Recursively copies a rule/group (standard or IC) assigning a fresh id to every
 * node. IC combinator tokens (plain strings) are passed through unchanged. Rule
 * values are deep-copied so the clone is fully independent of the source.
 */
export function deepCloneWithNewIds(
  node: CloneableChild,
  idGenerator: IdGenerator = generateId
): CloneableChild {
  if (typeof node === 'string') {
    return node;
  }

  if ('children' in node) {
    const group = node as FilterGroup | FilterGroupIC;
    return {
      ...group,
      id: idGenerator(),
      children: group.children.map((child) => deepCloneWithNewIds(child, idGenerator)),
    } as FilterGroup | FilterGroupIC;
  }

  const rule = node as FilterRule;
  return { ...rule, id: idGenerator(), value: cloneValue(rule.value) };
}
