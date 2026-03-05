import * as React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

// Since I don't have cva installed, I'll implement a simpler version or install it.
// Actually, I'll just use clsx and tailwind-merge for now to keep it simple without extra deps if possible,
// but cva is great. I'll stick to simple props for now to avoid installing another package if not needed,
// but wait, I can install class-variance-authority. It's standard.
// Let's just write standard CSS classes for now.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95';
    
    const variants = {
      default: 'bg-white text-purple-900 hover:bg-white/90 shadow-sm',
      outline: 'border border-white/30 bg-transparent hover:bg-white/10 text-white',
      ghost: 'hover:bg-white/10 text-white',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
      success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg',
      icon: 'h-10 w-10',
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
