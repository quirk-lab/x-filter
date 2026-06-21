import type { Filter } from '@x-filter/core';
import type { FilterPreset } from '@x-filter/react';
import { type ChangeEvent, useState } from 'react';
import { Button, cn, Input, Select } from './primitives';

export interface ShadcnPresetBarLabels {
  namePlaceholder: string;
  save: string;
  loadPlaceholder: string;
  noPresets: string;
  load: string;
  delete: string;
  confirmDelete: string;
  cancel: string;
}

const DEFAULT_LABELS: ShadcnPresetBarLabels = {
  namePlaceholder: 'Preset name',
  save: 'Save',
  loadPlaceholder: 'Load preset…',
  noPresets: 'No saved presets',
  load: 'Load',
  delete: 'Delete',
  confirmDelete: 'Confirm delete',
  cancel: 'Cancel',
};

export interface ShadcnPresetBarProps {
  presets: FilterPreset[];
  /** Filter snapshot persisted when the user saves a new preset. */
  currentFilter: Filter;
  onSave: (name: string, filter: Filter) => void;
  onLoad: (index: number) => void;
  onDelete: (index: number) => void;
  className?: string;
  labels?: Partial<ShadcnPresetBarLabels>;
}

/**
 * Lightweight saved-search bar: name + Save, a preset picker with Load, and a
 * two-step (arm → confirm) Delete. Built on existing primitives so it carries no
 * extra dependency on a dropdown/dialog layer.
 */
export function ShadcnPresetBar({
  presets,
  currentFilter,
  onSave,
  onLoad,
  onDelete,
  className,
  labels,
}: ShadcnPresetBarProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [confirming, setConfirming] = useState(false);

  const selectedIndex = selected === '' ? -1 : Number(selected);
  const hasSelection = selectedIndex >= 0 && selectedIndex < presets.length;
  const canSave = name.trim().length > 0;
  const isEmpty = presets.length === 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(name, currentFilter);
    setName('');
  };

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelected(event.target.value);
    setConfirming(false);
  };

  const handleLoad = () => {
    if (hasSelection) onLoad(selectedIndex);
  };

  const handleDelete = () => {
    if (!hasSelection) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete(selectedIndex);
    setSelected('');
    setConfirming(false);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Input
        aria-label={text.namePlaceholder}
        className="w-40"
        onChange={(event) => setName(event.target.value)}
        placeholder={text.namePlaceholder}
        value={name}
      />
      <Button disabled={!canSave} onClick={handleSave}>
        {text.save}
      </Button>

      <Select
        aria-label={text.loadPlaceholder}
        className="w-44"
        disabled={isEmpty}
        onChange={handleSelect}
        options={presets.map((preset, index) => ({
          value: String(index),
          label: preset.name,
        }))}
        placeholder={isEmpty ? text.noPresets : text.loadPlaceholder}
        value={selected}
      />
      <Button disabled={!hasSelection} onClick={handleLoad} variant="outline">
        {text.load}
      </Button>

      {confirming ? (
        <>
          <Button onClick={handleDelete} variant="destructive">
            {text.confirmDelete}
          </Button>
          <Button onClick={() => setConfirming(false)} variant="ghost">
            {text.cancel}
          </Button>
        </>
      ) : (
        <Button disabled={!hasSelection} onClick={handleDelete} variant="destructive">
          {text.delete}
        </Button>
      )}
    </div>
  );
}
