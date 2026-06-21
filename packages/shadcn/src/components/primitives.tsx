import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as SelectPrimitive from '@radix-ui/react-select';
import { type ClassValue, clsx } from 'clsx';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Button ────────────────────────────────────────────────────────────────

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'ghost-destructive';
};

export function Button({ className, variant = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' &&
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'destructive' &&
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
        variant === 'outline' &&
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost-destructive' &&
          'border-transparent bg-transparent text-muted-foreground hover:bg-destructive hover:text-destructive-foreground',
        className
      )}
      type={type}
      {...props}
    />
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────

export type InputProps = React.ComponentPropsWithoutRef<'input'>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

// ─── Select (Radix) ────────────────────────────────────────────────────────

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SelectProps = {
  options?: SelectOption[];
  placeholder?: string;
  value?: string | string[];
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | undefined;
  onChange?: (value: string | string[]) => void;
};

const selectTriggerClass =
  'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground';

const selectContentClass =
  'relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95';

const selectViewportClass = 'p-1';

const selectItemClass =
  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50';

function CheckIcon() {
  return (
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
      >
        <title>Checked</title>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 opacity-50"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <title>Chevron down</title>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * Radix Select-based dropdown. For `multiple` mode, renders a native `<select>`
 * with `multiple` — Radix Select doesn't support multi-select, and the
 * multi-select use case benefits from a native checkbox list anyway.
 */
export function Select({
  options = [],
  placeholder,
  value,
  disabled,
  multiple,
  className,
  onChange,
  ...ariaProps
}: SelectProps) {
  if (multiple) {
    return (
      <select
        {...ariaProps}
        className={cn(
          'flex h-auto min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        disabled={disabled}
        multiple
        onChange={(event) => {
          const selected = Array.from(event.target.selectedOptions, (option) => option.value);
          onChange?.(selected);
        }}
        value={Array.isArray(value) ? value : value ? [value] : undefined}
      >
        {options.map((option) => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : undefined;
  const singleValue = typeof value === 'string' ? value : undefined;

  return (
    <SelectPrimitive.Root
      disabled={disabled}
      onValueChange={(val) => onChange?.(val)}
      value={singleValue}
    >
      <SelectPrimitive.Trigger {...ariaProps} className={cn(selectTriggerClass, className)}>
        <SelectPrimitive.Value placeholder={placeholder}>
          {displayValue ?? placeholder}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className={selectContentClass}>
          <SelectPrimitive.Viewport className={selectViewportClass}>
            {placeholder ? (
              <SelectPrimitive.Item className={selectItemClass} disabled value="__placeholder__">
                <span className="text-muted-foreground">{placeholder}</span>
                <SelectPrimitive.ItemIndicator>
                  <CheckIcon />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ) : null}
            {options.map((option) => (
              <SelectPrimitive.Item
                className={selectItemClass}
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemIndicator>
                  <CheckIcon />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ─── Checkbox (Radix) ──────────────────────────────────────────────────────

export type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'onCheckedChange' | 'onChange'
> & {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function Checkbox({
  className,
  label,
  checked,
  disabled,
  onChange,
  'aria-label': ariaLabelProp,
  ...props
}: CheckboxProps) {
  // Ensure the button has an accessible name even when a visible label is
  // provided via the wrapping <label> element — axe requires discernible text
  // on the button itself.
  const ariaLabel = ariaLabelProp ?? (typeof label === 'string' ? label : undefined);
  const checkbox = (
    <CheckboxPrimitive.Root
      aria-label={ariaLabel}
      checked={checked}
      className={cn(
        'h-4 w-4 rounded border border-input shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary',
        className
      )}
      disabled={disabled}
      onCheckedChange={(val) => onChange?.(val === true)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <svg
          aria-hidden="true"
          fill="none"
          height="14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          width="14"
        >
          <title>Checked</title>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return checkbox;

  // Biome requires labels to be associated with controls. Radix Checkbox
  // renders a <button>, not an <input>, so we use aria-label on the button
  // (set above) and render the label text as a sibling span.
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      {checkbox}
      <span>{label}</span>
    </span>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'field' | 'operator' | 'value' | 'combinator' | 'group';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  field: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  operator: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  combinator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  group: 'bg-muted text-muted-foreground',
};

export type BadgeProps = React.ComponentPropsWithoutRef<'span'> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        BADGE_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

export type CardProps = React.ComponentPropsWithoutRef<'div'>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-4 text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

// ─── Dialog (Radix) ────────────────────────────────────────────────────────

export type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <DialogPrimitive.Trigger asChild={asChild}>{children}</DialogPrimitive.Trigger>;
}

export function DialogContent({
  children,
  className,
  titleId,
}: {
  children: ReactNode;
  className?: string;
  titleId?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        aria-labelledby={titleId}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-card p-4 text-card-foreground shadow-lg rounded-lg',
          className
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <DialogPrimitive.Title className="text-base font-semibold leading-none tracking-tight" id={id}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <DialogPrimitive.Description className="text-sm text-muted-foreground">
      {children}
    </DialogPrimitive.Description>
  );
}

export function DialogClose({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <DialogPrimitive.Close asChild={asChild}>{children}</DialogPrimitive.Close>;
}
