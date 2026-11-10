import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import tailwindConfig from '../../tailwind.config.js';

describe('Nivara Design System Tokens & Typography', () => {
  it('defines the official Nivara typography and color palette in tailwind.config.js', () => {
    // Fonts
    expect(tailwindConfig.theme.extend.fontFamily.sans).toContain('Inter');
    expect(tailwindConfig.theme.extend.fontFamily.heading).toContain('Manrope');

    // Nivara Palette
    const nivara = tailwindConfig.theme.extend.colors.nivara;
    expect(nivara).toBeDefined();
    expect(nivara.primary).toBe('#123A3A');
    expect(nivara.secondary).toBe('#287C75');
    expect(nivara.accent).toBe('#C9A45C');
    expect(nivara.canvas).toBe('#F7FAF8');
    expect(nivara.surface).toBe('#FFFFFF');
    expect(nivara.border).toBe('#D9E6E2');
    expect(nivara.text).toBe('#10201F');
    expect(nivara.muted).toBe('#4E6460');
    expect(nivara.subtle).toBe('#7D908C');

    // Backward compatibility aliases in medical palette
    const medical = tailwindConfig.theme.extend.colors.medical;
    expect(medical.primary).toBe('#123A3A');
    expect(medical.secondary).toBe('#287C75');
    expect(medical.background).toBe('#F7FAF8');
    expect(medical.border).toBe('#D9E6E2');
    expect(medical.card).toBe('#FFFFFF');

    // Shadows
    const shadows = tailwindConfig.theme.extend.boxShadow;
    expect(shadows['nivara-xs']).toBe('0 1px 2px rgba(18, 58, 58, 0.04)');
    expect(shadows['nivara-sm']).toBe('0 2px 8px rgba(18, 58, 58, 0.05)');
    expect(shadows['nivara-md']).toBe('0 8px 24px rgba(18, 58, 58, 0.07)');
    expect(shadows['nivara-lg']).toBe('0 16px 36px rgba(18, 58, 58, 0.10)');
  });

  it('declares Nivara CSS custom properties and utility classes in styles.css', () => {
    const stylesPath = path.resolve(__dirname, '../styles.css');
    const stylesContent = fs.readFileSync(stylesPath, 'utf8');

    expect(stylesContent).toContain('--nivara-primary: #123A3A;');
    expect(stylesContent).toContain('--nivara-secondary: #287C75;');
    expect(stylesContent).toContain('--nivara-accent: #C9A45C;');
    expect(stylesContent).toContain('--nivara-canvas: #F7FAF8;');
    expect(stylesContent).toContain('--nivara-surface: #FFFFFF;');
    expect(stylesContent).toContain('--nivara-border: #D9E6E2;');
    expect(stylesContent).toContain('--nivara-text-primary: #10201F;');
    expect(stylesContent).toContain('--nivara-text-secondary: #4E6460;');
    expect(stylesContent).toContain('--nivara-text-muted: #7D908C;');
    expect(stylesContent).toContain('--nivara-success: #2E7D5B;');
    expect(stylesContent).toContain('--nivara-warning: #B7791F;');
    expect(stylesContent).toContain('--nivara-danger: #B94A48;');

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

    expect(indexContent).toContain('Nivara — Secure Outpatient Operations Platform');
    expect(indexContent).toContain('family=Inter');
    expect(indexContent).toContain('family=Manrope');
  });
});
