import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'primary',
  trend = { label: '+0.0%', positive: true },
}) {
  const toneStyles = {
    primary: 'bg-teal-50 text-[#287C75] border border-teal-100',
    secondary: 'bg-[#F7FAF8] text-[#123A3A] border border-[#D9E6E2]',
    success: 'bg-emerald-50 text-[#2E7D5B] border border-emerald-100',
    warning: 'bg-amber-50 text-[#B7791F] border border-amber-100',
    info: 'bg-teal-50 text-[#287C75] border border-teal-100',
    accent: 'bg-[#FBF7EE] text-[#C9A45C] border border-[#EEDBBA]',
  };

  const color = toneStyles[tone] || toneStyles.primary;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="app-card rounded-2xl p-5 border border-[#D9E6E2] bg-white shadow-nivara-xs hover:shadow-nivara-sm transition duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#4E6460]">{label}</p>
        {Icon && (
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-4 font-heading font-bold text-3xl text-[#10201F] tracking-tight tabular-nums">
        {value}
      </p>
      {trend && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1 text-xs font-semibold">
          {trend.positive ? (
            <TrendingUp size={13} className="text-[#2E7D5B]" />
          ) : (
            <TrendingDown size={13} className="text-[#B94A48]" />
          )}
          <span className={trend.positive ? 'text-[#2E7D5B]' : 'text-[#B94A48]'}>{trend.label}</span>
        </div>
      )}
    </motion.article>
  );
}

export default StatCard;
