import { type ClassValue, clsx } from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
};

export function Button({ className, variant = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'destructive' &&
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        variant === 'outline' &&
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        className
      )}
      type={type}
      {...props}
    />
  );
}

export type InputProps = ComponentPropsWithoutRef<'input'>;

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

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithoutRef<'select'>, 'children'> & {
  options?: SelectOption[];
  placeholder?: string;
};

export function Select({ className, options = [], placeholder, multiple, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        multiple && 'h-auto min-h-9 py-2',
        className
      )}
      multiple={multiple}
      {...props}
    >
      {placeholder && !multiple ? (
        <option disabled value="">
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option disabled={option.disabled} key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export type BadgeVariant = 'default' | 'field' | 'operator' | 'value' | 'combinator' | 'group';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  field: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  operator: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  combinator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  group: 'bg-muted text-muted-foreground',
};

export type BadgeProps = ComponentPropsWithoutRef<'span'> & {
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

export type CardProps = ComponentPropsWithoutRef<'div'>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-4 text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

export type CheckboxProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  label?: ReactNode;
};

export function Checkbox({ className, label, ...props }: CheckboxProps) {
  if (!label) {
    return (
      <input
        className={cn(
          'h-4 w-4 rounded border border-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        type="checkbox"
        {...props}
      />
    );
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium">
      <input
        className={cn(
          'h-4 w-4 rounded border border-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        type="checkbox"
        {...props}
      />
      {label}
    </label>
  );
}
