import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-linear-to-br from-accent-purple to-accent-violet text-white shadow-lg shadow-accent-purple/20',
    success: 'bg-linear-to-br from-accent-green to-emerald-600 text-white shadow-lg shadow-accent-green/20',
    danger: 'bg-linear-to-br from-accent-red to-rose-600 text-white shadow-lg shadow-accent-red/20',
    warning: 'bg-linear-to-br from-accent-orange to-amber-600 text-white shadow-lg shadow-accent-orange/20',
    outline: 'bg-transparent border border-border-subtle text-text-primary hover:bg-white/5',
  };

  return (
    <motion.button
      whileHover={{ translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};
