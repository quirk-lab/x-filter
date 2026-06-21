import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter, FilterRule } from '@x-filter/core';
import { ShadcnImportFilterDialog } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Import' }));
  return screen.getByRole('dialog');
}

describe('ShadcnImportFilterDialog', () => {
  it('is closed until the trigger is clicked', () => {
    render(<ShadcnImportFilterDialog schema={schema} onImport={jest.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    openDialog();
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('round-trips a DSL import', () => {
    const onImport = jest.fn();
    render(<ShadcnImportFilterDialog schema={schema} onImport={onImport} />);
    openDialog();

    fireEvent.change(screen.getByLabelText('Filter source'), {
      target: { value: 'status:equals:open' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Parse' }));

    // Preview appears; confirm becomes enabled.
    const confirm = screen.getByRole('button', { name: 'Confirm import' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    expect(onImport).toHaveBeenCalledTimes(1);
    const filter = onImport.mock.calls[0][0] as Filter;
    const rule = filter.children[0] as FilterRule;
    expect(rule).toMatchObject({ field: 'status', operator: 'equals', value: 'open' });
    // dialog closed after import
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('round-trips a JSON import', () => {
    const onImport = jest.fn();
    render(<ShadcnImportFilterDialog schema={schema} onImport={onImport} />);
    openDialog();

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
    fireEvent.change(screen.getByLabelText('Filter source'), {
      target: {
        value: JSON.stringify({
          combinator: 'and',
          children: [{ field: 'status', operator: 'equals', value: 'open' }],
        }),
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Parse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }));

    const filter = onImport.mock.calls[0][0] as Filter;
    const rule = filter.children[0] as FilterRule;
    expect(rule).toMatchObject({ field: 'status', operator: 'equals', value: 'open' });
  });

  it('shows an error and keeps confirm disabled on invalid input', () => {
    const onImport = jest.fn();
    render(<ShadcnImportFilterDialog schema={schema} onImport={onImport} />);
    openDialog();

    fireEvent.change(screen.getByLabelText('Filter source'), {
      target: { value: '@@@ not valid @@@' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Parse' }));

    expect(screen.queryByRole('alert')).not.toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Confirm import' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(onImport).not.toHaveBeenCalled();
  });

  it('reports invalid JSON', () => {
    render(<ShadcnImportFilterDialog schema={schema} onImport={jest.fn()} />);
    openDialog();

    fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
    fireEvent.change(screen.getByLabelText('Filter source'), {
      target: { value: '{ not json }' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Parse' }));

    expect(screen.getByRole('alert').textContent).toMatch(/Invalid JSON/);
  });

  it('disables confirm until a successful parse', () => {
    render(<ShadcnImportFilterDialog schema={schema} onImport={jest.fn()} />);
    openDialog();
    expect(
      (screen.getByRole('button', { name: 'Confirm import' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
