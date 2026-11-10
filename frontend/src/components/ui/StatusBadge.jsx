import React from 'react';

const variantStyles = {
  neutral: 'border-[#D9E6E2] bg-[#F7FAF8] text-[#4E6460]',
  info: 'border-teal-200 bg-teal-50 text-[#287C75]',
  success: 'border-emerald-200 bg-emerald-50 text-[#2E7D5B]',
  warning: 'border-amber-200 bg-amber-50 text-[#B7791F]',
  danger: 'border-rose-200 bg-rose-50 text-[#B94A48]',
};

function StatusBadge({ label, variant = 'neutral', className = '' }) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styles} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
