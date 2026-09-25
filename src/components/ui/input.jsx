import React from 'react';
import { cn } from '../../lib/utils.js';

export const Input = React.forwardRef(
  ({ className, type = 'text', mono = false, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-xl border border-bone-300 bg-white px-3.5 py-2 text-sm text-obsidian shadow-soft-sm placeholder:text-bone-400 focus:outline-none focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700 transition-all disabled:cursor-not-allowed disabled:opacity-50',
            mono && 'font-mono text-sm tracking-wide',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-bone-300 bg-white px-3.5 py-2.5 text-sm text-obsidian shadow-soft-sm placeholder:text-bone-400 focus:outline-none focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700 transition-all disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
