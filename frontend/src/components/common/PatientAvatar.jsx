import React from 'react';
import maleAvatar from '../../assets/avatar-male.png';
import femaleAvatar from '../../assets/avatar-female.png';

/**
 * PatientAvatar component:
 * Renders female avatar for female patients and male avatar for male/other patients.
 */
export default function PatientAvatar({
  gender = '',
  name = 'Patient',
  className = 'h-10 w-10',
  imgClassName = '',
}) {
  const isFemale =
    typeof gender === 'string' && gender.trim().toLowerCase().startsWith('f');
  const avatarSrc = isFemale ? femaleAvatar : maleAvatar;
  const altText = `${name} (${isFemale ? 'Female' : 'Male'})`;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full shadow-2xs border border-slate-200/80 bg-white flex items-center justify-center ${className}`}
      title={altText}
    >
      <img
        src={avatarSrc}
        alt={altText}
        className={`h-full w-full object-cover object-center select-none ${imgClassName}`}
        loading="lazy"
        draggable="false"
      />
    </div>
  );
}
