import { fireEvent, render, screen } from '@testing-library/react';
import type { Filter } from '@x-filter/core';
import type { FilterPreset } from '@x-filter/react';
import { ShadcnPresetBar } from '../index';

const currentFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'a' }],
};

function makePresets(...names: string[]): FilterPreset[] {
  return names.map((name, i) => ({
    name,
    filter: { id: `root-${i}`, combinator: 'and', children: [] },
    createdAt: i,
  }));
}

describe('ShadcnPresetBar', () => {
  it('disables Save until a non-empty name is entered, then saves the current filter', () => {
    const onSave = jest.fn();
    render(
      <ShadcnPresetBar
        presets={[]}
        currentFilter={currentFilter}
        onSave={onSave}
        onLoad={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    const nameInput = screen.getByLabelText('Preset name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My view' } });
    expect(save.disabled).toBe(false);

    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith('My view', currentFilter);
    // Name input resets after save.
    expect(nameInput.value).toBe('');
  });

  it('disables the picker and shows an empty placeholder with no presets', () => {
    render(
      <ShadcnPresetBar
        presets={[]}
        currentFilter={currentFilter}
        onSave={jest.fn()}
        onLoad={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect((screen.getByLabelText('Load preset…') as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByRole('option', { name: 'No saved presets' })).not.toBeNull();
    expect((screen.getByRole('button', { name: 'Load' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('loads the selected preset by index', () => {
    const onLoad = jest.fn();
    render(
      <ShadcnPresetBar
        presets={makePresets('First', 'Second')}
        currentFilter={currentFilter}
        onSave={jest.fn()}
        onLoad={onLoad}
        onDelete={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Load preset…'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(onLoad).toHaveBeenCalledWith(1);
  });

  it('requires a second confirm click before deleting', () => {
    const onDelete = jest.fn();
    render(
      <ShadcnPresetBar
        presets={makePresets('First', 'Second')}
        currentFilter={currentFilter}
        onSave={jest.fn()}
        onLoad={jest.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.change(screen.getByLabelText('Load preset…'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    // Armed, not yet deleted.
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(onDelete).toHaveBeenCalledWith(0);
    // Returns to the un-armed Delete control afterwards.
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeNull();
  });

  it('cancels a pending delete without removing anything', () => {
    const onDelete = jest.fn();
    render(
      <ShadcnPresetBar
        presets={makePresets('First')}
        currentFilter={currentFilter}
        onSave={jest.fn()}
        onLoad={jest.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.change(screen.getByLabelText('Load preset…'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeNull();
  });
});
