import React from 'react';

const VARIANTS = {
  amber: 'bg-amber-50 text-amber-600 border border-amber-100/60',
  emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-100/60',
  indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100/60',
  rose: 'bg-rose-50 text-rose-600 border border-rose-100/60',
  slate: 'bg-slate-50 text-slate-600 border border-slate-100',
};

export default function IconBadge({ icon: Icon, variant = 'amber', className = '', size = 'md' }) {
  const variantClass = VARIANTS[variant] || VARIANTS.amber;
  const sizeClasses = size === 'sm' ? 'w-9 h-9 rounded-lg' : 'w-12 h-12 rounded-xl';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-[22px] w-[22px]';

  return (
    <div
      className={`flex items-center justify-center shrink-0 shadow-sm ${sizeClasses} ${variantClass} ${className}`}
      aria-hidden="true"
    >
      {Icon && <Icon className={iconSize} />}
    </div>
  );
}
