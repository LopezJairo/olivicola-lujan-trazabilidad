import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bone-200 text-bone-800 border border-bone-300',
        olive: 'bg-olive-100 text-olive-900 border border-olive-200',
        paleGreen: 'bg-[#EDF3EC] text-[#346538] border border-[#D5E5D4]',
        paleBlue: 'bg-[#E1F3FE] text-[#1F6C9F] border border-[#C5E4FA]',
        paleYellow: 'bg-[#FBF3DB] text-[#956400] border border-[#F4E3B5]',
        paleRed: 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D2D5]',
        outline: 'border border-bone-300 text-bone-700 bg-white/70',
        mono: 'font-mono text-[11px] bg-bone-100 text-bone-900 border border-bone-300 px-2 py-0.5 rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, children, dot, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'paleGreen' || variant === 'olive' ? 'bg-olive-600' : '',
            variant === 'paleYellow' ? 'bg-amber-500' : '',
            variant === 'paleRed' ? 'bg-red-500' : '',
            variant === 'paleBlue' ? 'bg-blue-500' : '',
            variant === 'default' || variant === 'outline' ? 'bg-bone-500' : ''
          )}
        />
      )}
      {children}
    </span>
  );
}
