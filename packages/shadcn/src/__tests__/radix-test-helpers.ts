import { fireEvent, screen, within } from '@testing-library/react';

/**
 * Helper for interacting with Radix Select components in tests.
 * Radix Select renders as a trigger button + popover list, not a native <select>.
 *
 * Usage: selectOption('Field', 'Age')
 */
export function selectOption(label: string | RegExp, optionText: string | RegExp): void {
  const trigger = screen.getByLabelText(label);
  fireEvent.click(trigger);
  const option = screen.getByRole('option', { name: optionText });
  fireEvent.click(option);
}

/**
 * Helper for interacting with Radix Select within a specific container.
 */
export function selectOptionWithin(
  container: HTMLElement,
  label: string | RegExp,
  optionText: string | RegExp
): void {
  const trigger = within(container).getByLabelText(label);
  fireEvent.click(trigger);
  const option = within(document.body).getByRole('option', { name: optionText });
  fireEvent.click(option);
}
