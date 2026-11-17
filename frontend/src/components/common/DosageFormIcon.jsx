import React from 'react';
import tabletIcon from '../../assets/dosage-forms/form-tablet.png';
import capsuleIcon from '../../assets/dosage-forms/form-capsule.png';
import syrupIcon from '../../assets/dosage-forms/form-syrup.png';
import injectionIcon from '../../assets/dosage-forms/form-injection.png';
import dropsIcon from '../../assets/dosage-forms/form-drops.png';
import gelIcon from '../../assets/dosage-forms/form-gel.png';
import creamIcon from '../../assets/dosage-forms/form-cream.png';
import ointmentIcon from '../../assets/dosage-forms/form-ointment.png';
import sachetIcon from '../../assets/dosage-forms/form-sachet.png';

const ICONS_MAP = {
  tab: tabletIcon,
  tablet: tabletIcon,
  cap: capsuleIcon,
  capsule: capsuleIcon,
  syr: syrupIcon,
  syrup: syrupIcon,
  susp: syrupIcon,
  suspension: syrupIcon,
  inj: injectionIcon,
  injection: injectionIcon,
  drop: dropsIcon,
  drops: dropsIcon,
  gel: gelIcon,
  cream: creamIcon,
  oint: ointmentIcon,
  ointment: ointmentIcon,
  sach: sachetIcon,
  sachet: sachetIcon,
};

export const getDosageFormIconSrc = (form = '') => {
  if (!form || typeof form !== 'string') return tabletIcon;
  const f = form.trim().toLowerCase();
  for (const [key, iconSrc] of Object.entries(ICONS_MAP)) {
    if (f.includes(key)) {
      return iconSrc;
    }
  }
  return tabletIcon;
};

/**
 * Visual Dosage Form Icon Component
 */
export default function DosageFormIcon({
  form = 'Tablet',
  className = 'h-9 w-9',
  imgClassName = 'h-6 w-6 object-contain',
  containerClassName = '',
  showLabel = false,
  labelClassName = 'text-xs font-semibold text-[#10201F]',
}) {
  const iconSrc = getDosageFormIconSrc(form);
  const titleText = `${form} Formulation`;

  return (
    <div
      className={`inline-flex items-center gap-2 ${containerClassName}`}
      title={titleText}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs ${className}`}
      >
        <img
          src={iconSrc}
          alt={titleText}
          className={`select-none ${imgClassName}`}
          loading="lazy"
          draggable="false"
        />
      </div>
      {showLabel && <span className={labelClassName}>{form}</span>}
    </div>
  );
}
