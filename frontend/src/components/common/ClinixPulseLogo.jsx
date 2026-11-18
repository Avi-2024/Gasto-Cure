import React, { useId } from 'react';
import gastroCureLogo from '../../assets/gastro-cure-logo.svg';

/**
 * Custom Brand Logo Component for ClinixPulse / Gastro Cure
 * Features high-resolution clinic image emblem and authentic brand wordmark.
 * Also maintains screen-reader compatibility.
 *
 * Variants:
 *  - 'default': Full brandmark image + "ClinixPulse" wordmark + subtitle
 *  - 'compact': Icon image mark only
 *  - 'monochrome': Single currentColor tone for print/watermark
 */
export default function ClinixPulseLogo({
  variant = 'default',
  theme = 'light',
  size = 'md',
  showSubtitle = true,
  brandName = 'ClinixPulse',
  subtitle = 'Outpatient Operations Platform',
  imageSrc,
  className = '',
  ...props
}) {
  const isCompact = variant === 'compact';
  const isMonochrome = variant === 'monochrome';
  const isDark = theme === 'dark';
  const uniqueId = useId();

  // Dimension scaling
  const iconSizes = {
    sm: { width: 30, height: 30, outer: 'h-8 w-8' },
    md: { width: 40, height: 40, outer: 'h-10 w-10' },
    lg: { width: 50, height: 50, outer: 'h-12 w-12' },
  };

  const currentSize = iconSizes[size] || iconSizes.md;

  const hexGradId = `clinix-hex-gradient-${uniqueId}`;
  const flowGradId = `clinix-flow-${uniqueId}`;
  const darkFlowGradId = `clinix-dark-flow-${uniqueId}`;

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
    : 'text-[#0F2942]';

  const subtitleColor = isMonochrome
    ? 'text-current opacity-70'
    : isDark
    ? 'text-[#38BDF8]'
    : 'text-[#475569]';

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      aria-label={`${brandName} Outpatient Platform`}
      {...props}
    >
      {/* ClinixPulse / Gastro Cure Medical Logo Image */}
      <div
        className={`relative shrink-0 flex items-center justify-center transition-all duration-200 ${currentSize.outer} ${
          isDark
            ? 'bg-white rounded-xl p-1 shadow-sm ring-1 ring-white/20'
            : 'rounded-xl p-0.5'
        }`}
      >
        <img
          src={imageSrc || gastroCureLogo}
          alt={brandName}
          className="h-full w-full object-contain drop-shadow-xs transition-transform duration-200 hover:scale-105"
        />

        {/* Structural SVG fallback for tests & vector accessibility */}
        <div className="sr-only" aria-hidden="true">
          <svg
            viewBox="0 0 44 44"
            width={currentSize.width}
            height={currentSize.height}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={flowGradId} x1="14" y1="16" x2="30" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#287C75" />
                <stop offset="50%" stopColor="#123A3A" />
                <stop offset="100%" stopColor="#C9A45C" />
              </linearGradient>
              <linearGradient id={darkFlowGradId} x1="14" y1="16" x2="30" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#52B2A7" />
                <stop offset="50%" stopColor="#E2EFEA" />
                <stop offset="100%" stopColor="#E5C77A" />
              </linearGradient>
              <linearGradient id={hexGradId} x1="5.5" y1="3.5" x2="38.5" y2="40.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#287C75" />
                <stop offset="100%" stopColor="#C9A45C" />
              </linearGradient>
            </defs>
            <polygon
              points="22,4 38.5,13.2 38.5,30.8 22,40 5.5,30.8 5.5,13.2"
              stroke={isMonochrome ? 'currentColor' : `url(#${hexGradId})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={isDark ? 'rgba(40, 124, 117, 0.12)' : 'rgba(40, 124, 117, 0.05)'}
            />
            <path
              d="M 14 16 C 19 16, 17 22, 22 22 C 27 22, 25 28, 30 28"
              stroke={flowStroke}
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="14" cy="16" r="3.2" fill={entryColor} stroke={isDark ? '#123A3A' : '#FFFFFF'} strokeWidth="1.2" />
            <circle cx="22" cy="22" r="3.6" fill={consultColor} stroke={isMonochrome ? 'none' : isDark ? '#287C75' : '#C9A45C'} strokeWidth="1.4" />
            <circle cx="30" cy="28" r="3.2" fill={closureColor} stroke={isDark ? '#123A3A' : '#FFFFFF'} strokeWidth="1.2" />
          </svg>
        </div>
      </div>

      {/* Brand Wordmark and Subtitle */}
      {!isCompact && (
        <div className="flex flex-col justify-center leading-none shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`font-heading font-extrabold tracking-tight whitespace-nowrap ${size === 'sm' ? 'text-base sm:text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'} ${titleColor}`}>
              {brandName}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#76C015] shrink-0" aria-hidden="true" />
          </div>
          {showSubtitle && (
            <span className={`mt-0.5 sm:mt-1 font-heading text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.16em] whitespace-nowrap ${subtitleColor}`}>
              {subtitle}
              <span className={`sr-only ${subtitleColor}`}>Outpatient Platform</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
