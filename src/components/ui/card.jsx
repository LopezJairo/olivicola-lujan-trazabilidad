import React from 'react';
import { cn } from '../../lib/utils.js';

export function Card({ className, children, innerClassName, ...props }) {
  return (
    <div
      className={cn(
        'bezel-shell relative overflow-hidden transition-all duration-300',
        className
      )}
      {...props}
    >
      <div className={cn('bezel-core p-5 sm:p-6', innerClassName)}>
        {children}
      </div>
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        'text-base sm:text-lg font-semibold tracking-tight text-obsidian',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs sm:text-sm text-bone-600', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('flex items-center pt-4 border-t border-bone-200 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
