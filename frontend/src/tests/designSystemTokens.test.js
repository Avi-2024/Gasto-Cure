import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import tailwindConfig from '../../tailwind.config.js';

describe('ClinixPulse Design System Tokens & Typography', () => {
  it('defines the official ClinixPulse typography and color palette in tailwind.config.js', () => {
    // Fonts
    expect(tailwindConfig.theme.extend.fontFamily.sans).toContain('Inter');
    expect(tailwindConfig.theme.extend.fontFamily.heading).toContain('Manrope');

    // ClinixPulse Palette
    const clinixpulse = tailwindConfig.theme.extend.colors.clinixpulse;
    expect(clinixpulse).toBeDefined();
    expect(clinixpulse.primary).toBe('#123A3A');
    expect(clinixpulse.secondary).toBe('#287C75');
    expect(clinixpulse.accent).toBe('#C9A45C');
    expect(clinixpulse.canvas).toBe('#F7FAF8');
    expect(clinixpulse.surface).toBe('#FFFFFF');
    expect(clinixpulse.border).toBe('#D9E6E2');
    expect(clinixpulse.text).toBe('#10201F');
    expect(clinixpulse.muted).toBe('#4E6460');
    expect(clinixpulse.subtle).toBe('#7D908C');

    // Backward compatibility aliases in medical palette
    const medical = tailwindConfig.theme.extend.colors.medical;
    expect(medical.primary).toBe('#123A3A');
    expect(medical.secondary).toBe('#287C75');
    expect(medical.background).toBe('#F7FAF8');
    expect(medical.border).toBe('#D9E6E2');
    expect(medical.card).toBe('#FFFFFF');

    // Shadows
    const shadows = tailwindConfig.theme.extend.boxShadow;
    expect(shadows['clinixpulse-xs']).toBe('0 1px 2px rgba(18, 58, 58, 0.04)');
    expect(shadows['clinixpulse-sm']).toBe('0 2px 8px rgba(18, 58, 58, 0.05)');
    expect(shadows['clinixpulse-md']).toBe('0 8px 24px rgba(18, 58, 58, 0.07)');
    expect(shadows['clinixpulse-lg']).toBe('0 16px 36px rgba(18, 58, 58, 0.10)');
  });

  it('declares ClinixPulse CSS custom properties and utility classes in styles.css', () => {
    const stylesPath = path.resolve(__dirname, '../styles.css');
    const stylesContent = fs.readFileSync(stylesPath, 'utf8');

    expect(stylesContent).toContain('--clinixpulse-primary: #123A3A;');
    expect(stylesContent).toContain('--clinixpulse-secondary: #287C75;');
    expect(stylesContent).toContain('--clinixpulse-accent: #C9A45C;');
    expect(stylesContent).toContain('--clinixpulse-canvas: #F7FAF8;');
    expect(stylesContent).toContain('--clinixpulse-surface: #FFFFFF;');
    expect(stylesContent).toContain('--clinixpulse-border: #D9E6E2;');
    expect(stylesContent).toContain('--clinixpulse-text-primary: #10201F;');
    expect(stylesContent).toContain('--clinixpulse-text-secondary: #4E6460;');
    expect(stylesContent).toContain('--clinixpulse-text-muted: #7D908C;');
    expect(stylesContent).toContain('--clinixpulse-success: #2E7D5B;');
    expect(stylesContent).toContain('--clinixpulse-warning: #B7791F;');
    expect(stylesContent).toContain('--clinixpulse-danger: #B94A48;');

    // Component classes
    expect(stylesContent).toContain('.app-card');
    expect(stylesContent).toContain('.btn-primary');
    expect(stylesContent).toContain('.btn-secondary');
    expect(stylesContent).toContain('.field-label');
    expect(stylesContent).toContain('.page-title');
    expect(stylesContent).toContain('.tabular-nums');
    expect(stylesContent).toContain('.font-heading');
  });

  it('configures Google Fonts and platform title in index.html', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    expect(indexContent).toContain('ClinixPulse™ — Secure Outpatient Operations Platform');
    expect(indexContent).toContain('family=Inter');
    expect(indexContent).toContain('family=Manrope');
  });
});
