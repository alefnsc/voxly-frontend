import React from 'react';
import { cn } from 'lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface PurpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-voxly-purple hover:bg-voxly-purple-dark text-white shadow-lg shadow-purple-200 hover:shadow-xl transform hover:scale-[1.02]',
  secondary: 'bg-white text-voxly-purple border border-voxly-purple hover:bg-purple-50',
  outline: 'bg-transparent text-voxly-purple border border-voxly-purple hover:bg-purple-50',
  ghost: 'bg-transparent text-voxly-purple hover:bg-purple-50',
  gradient: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:from-purple-700 hover:to-violet-700 transform hover:scale-[1.02]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const PurpleButton = React.forwardRef<HTMLButtonElement, PurpleButtonProps>(
  ({ variant = 'primary', size = 'md', children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-voxly-purple focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PurpleButton.displayName = 'PurpleButton';

export default PurpleButton;
