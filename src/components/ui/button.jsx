import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none group',
  {
    variants: {
      variant: {
        primary:
          'bg-obsidian text-bone-50 hover:bg-obsidian-soft border border-obsidian shadow-soft-sm',
        olive:
          'bg-olive-800 text-bone-50 hover:bg-olive-900 border border-olive-900 shadow-soft-sm',
        secondary:
          'bg-bone-100 text-obsidian hover:bg-bone-200 border border-bone-300',
        outline:
          'bg-white text-obsidian hover:bg-bone-100 border border-bone-300 hover:border-bone-400',
        ghost:
          'text-obsidian hover:bg-bone-200/60',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-soft-sm',
        softDestructive:
          'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        default: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        hero: 'h-14 px-8 text-base font-semibold rounded-2xl',
        icon: 'h-10 w-10 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export function Button({
  className,
  variant,
  size,
  children,
  trailingIcon,
  ...props
}) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <span>{children}</span>
      {trailingIcon && (
        <span className="btn-trailing-icon">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
