import React from 'react';
import IconBadge from './IconBadge';

export default function FeatureCard({
  icon,
  badgeVariant = 'amber',
  title,
  description,
  tag,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-card p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-float ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <IconBadge icon={icon} variant={badgeVariant} />
        {tag && (
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {tag}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
