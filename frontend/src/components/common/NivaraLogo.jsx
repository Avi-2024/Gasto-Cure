import React, { useId } from 'react';

/**
 * Nivara Brand Identity Logo Component
 * Authentic brandmark with hexagonal boundary, 3 stage nodes
 * (Entry, Consultation, Closure) connected by an S-curve clinical flow path.
 *
 * Variants:
 *  - 'default': Full brandmark + "Nivara" wordmark + "Outpatient Platform" subtitle
 *  - 'compact': Icon mark only
 *  - 'monochrome': Single currentColor tone for print/watermark
 */
export default function NivaraLogo({
  variant = 'default',
  theme = 'light',
  size = 'md',
  showSubtitle = true,
  className = '',
  ...props
}) {
  const isCompact = variant === 'compact';
  const isMonochrome = variant === 'monochrome';
  const isDark = theme === 'dark';
  const uniqueId = useId();

  // Dimension scaling
  const iconSizes = {
    sm: { width: 30, height: 30, outer: 'h-7 w-7' },
    md: { width: 38, height: 38, outer: 'h-9 w-9' },
    lg: { width: 48, height: 48, outer: 'h-12 w-12' },
  };

  const currentSize = iconSizes[size] || iconSizes.md;

  const hexGradId = `nivara-hex-gradient-${uniqueId}`;
  const flowGradId = `nivara-flow-${uniqueId}`;
  const darkFlowGradId = `nivara-dark-flow-${uniqueId}`;

  const flowStroke = isMonochrome
    ? 'currentColor'
    : isDark
    ? `url(#${darkFlowGradId})`
    : `url(#${flowGradId})`;

  const entryColor = isMonochrome ? 'currentColor' : '#287C75';
  const consultColor = isMonochrome ? 'currentColor' : isDark ? '#E2EFEA' : '#123A3A';
  const closureColor = isMonochrome ? 'currentColor' : '#C9A45C';

  const titleColor = isMonochrome
    ? 'text-current'
    : isDark
    ? 'text-white'
    : 'text-[#123A3A]';

  const subtitleColor = isMonochrome
    ? 'text-current opacity-70'
    : isDark
    ? 'text-[#C9A45C]'
    : 'text-[#4E6460]';

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      aria-label="Nivara Outpatient Platform"
      {...props}
    >
      {/* Brand Icon SVG */}
      <div className={`relative shrink-0 flex items-center justify-center ${currentSize.outer}`}>
        <svg
          viewBox="0 0 44 44"
          width={currentSize.width}
          height={currentSize.height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200"
          aria-hidden="true"
        >
          <defs>
            {/* Flow path gradient for light surfaces */}
            <linearGradient id={flowGradId} x1="14" y1="16" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#287C75" />
              <stop offset="50%" stopColor="#123A3A" />
              <stop offset="100%" stopColor="#C9A45C" />
            </linearGradient>

            {/* Flow path gradient for dark surfaces */}
            <linearGradient id={darkFlowGradId} x1="14" y1="16" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#52B2A7" />
              <stop offset="50%" stopColor="#E2EFEA" />
              <stop offset="100%" stopColor="#E5C77A" />
            </linearGradient>

            {/* Subtle hexagon stroke gradient */}
            <linearGradient id={hexGradId} x1="5.5" y1="3.5" x2="38.5" y2="40.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#287C75" />
              <stop offset="100%" stopColor="#C9A45C" />
            </linearGradient>
          </defs>

          {/* Hexagonal boundary representing clinical integrity */}
          <polygon
            points="22,4 38.5,13.2 38.5,30.8 22,40 5.5,30.8 5.5,13.2"
            stroke={isMonochrome ? 'currentColor' : `url(#${hexGradId})`}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="opacity-90"
            fill={isDark ? 'rgba(40, 124, 117, 0.12)' : 'rgba(40, 124, 117, 0.05)'}
          />

          {/* Smooth continuous S-curve flow path connecting stage nodes */}
          <path
            d="M 14 16 C 19 16, 17 22, 22 22 C 27 22, 25 28, 30 28"
            stroke={flowStroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Stage Node 1: Entry */}
          <circle
            cx="14"
            cy="16"
            r="3.2"
            fill={entryColor}
            stroke={isDark ? '#123A3A' : '#FFFFFF'}
            strokeWidth="1.2"
          />

          {/* Stage Node 2: Consultation */}
          <circle
            cx="22"
            cy="22"
            r="3.6"
            fill={consultColor}
            stroke={isMonochrome ? 'none' : isDark ? '#287C75' : '#C9A45C'}
            strokeWidth="1.4"
          />

          {/* Stage Node 3: Closure */}
          <circle
            cx="30"
            cy="28"
            r="3.2"
            fill={closureColor}
            stroke={isDark ? '#123A3A' : '#FFFFFF'}
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Wordmark and Subtitle */}
      {!isCompact && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-heading font-extrabold tracking-tight ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'} ${titleColor}`}>
              Nivara
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" aria-hidden="true" />
          </div>
          {showSubtitle && (
            <span className={`mt-1 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] ${subtitleColor}`}>
              Outpatient Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}
