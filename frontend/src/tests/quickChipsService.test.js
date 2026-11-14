import { describe, it, expect, beforeEach } from 'vitest';
import { quickChipsService, DEFAULT_QUICK_CHIPS } from '../services/quickChipsService';

describe('quickChipsService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default chips when localStorage is empty', () => {
    const all = quickChipsService.getAll();
    expect(all.symptoms).toEqual(DEFAULT_QUICK_CHIPS.symptoms);
    expect(all.diagnosis).toEqual(DEFAULT_QUICK_CHIPS.diagnosis);
    expect(all.advice).toEqual(DEFAULT_QUICK_CHIPS.advice);
  });

  it('can get specific category chips', () => {
    const symptoms = quickChipsService.get('symptoms');
    expect(symptoms).toContain('Epigastric Pain');
  });

  it('can add new custom chip to a category and avoids duplicate additions', () => {
    quickChipsService.add('symptoms', 'Severe Dysphagia');
    const updated = quickChipsService.get('symptoms');
    expect(updated).toContain('Severe Dysphagia');

    // Attempt to add duplicate (case-insensitive)
    quickChipsService.add('symptoms', 'severe dysphagia');
    const count = quickChipsService.get('symptoms').filter((s) => s.toLowerCase() === 'severe dysphagia').length;
    expect(count).toBe(1);
  });

  it('can remove an existing chip from a category', () => {
    quickChipsService.remove('symptoms', 'Epigastric Pain');
    const updated = quickChipsService.get('symptoms');
    expect(updated).not.toContain('Epigastric Pain');
  });

  it('can reset category back to clinic defaults', () => {
    quickChipsService.add('diagnosis', 'Custom Celiac Sprue');
    quickChipsService.remove('diagnosis', 'GERD / Acid Reflux');
    expect(quickChipsService.get('diagnosis')).toContain('Custom Celiac Sprue');

    quickChipsService.reset('diagnosis');
    const resetList = quickChipsService.get('diagnosis');
    expect(resetList).toEqual(DEFAULT_QUICK_CHIPS.diagnosis);
  });

  it('can reset all categories back to defaults', () => {
    quickChipsService.add('advice', 'Custom Hydrotherapy');
    quickChipsService.reset('ALL');
    const all = quickChipsService.getAll();
    expect(all).toEqual(DEFAULT_QUICK_CHIPS);
  });
});
