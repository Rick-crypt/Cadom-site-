import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 shadow-sm';
  const variants = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-[0_4px_14px_0_rgba(45,90,39,0.25)] hover:shadow-[0_6px_20px_rgba(45,90,39,0.35)]',
    secondary: 'bg-cadom-bg-alt text-cadom-primary hover:bg-slate-200 hover:shadow-md',
    outline: 'border-2 border-cadom-bg-alt bg-transparent hover:bg-cadom-bg-alt text-cadom-primary',
    danger: 'bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_14px_0_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.35)]',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  return (
    <motion.button ref={ref} whileTap={{ scale: 0.98 }} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </motion.button>
  );
});
Button.displayName = 'Button';
