/**
 * Quick Chips Service for Gastro Cure Clinic
 *
 * Manages customizable 1-click clinical suggestions for:
 * 1. Symptoms / Chief Complaints
 * 2. Clinical Diagnoses
 * 3. Dietary & Lifestyle Advice
 *
 * Persists custom additions and deletions to localStorage so doctors
 * can personalize their clinical workflows like a pro.
 */

export const DEFAULT_QUICK_CHIPS = {
  symptoms: [
    'Epigastric Pain',
    'Heartburn & Acidity',
    'Abdominal Bloating',
    'Nausea & Vomiting',
    'Constipation',
    'Loose Stools (Diarrhea)',
    'Loss of Appetite',
    'Belching & Gas',
  ],
  diagnosis: [
    'GERD / Acid Reflux',
    'Acute Gastritis',
    'Irritable Bowel (IBS)',
    'Fatty Liver (NAFLD)',
    'Acid Peptic Disease (APD)',
    'Dyspepsia / Indigestion',
    'H. Pylori Infection',
  ],
  advice: [
    'Avoid spicy, fried & oily foods',
    'Drink 2.5–3L water daily',
    'Small frequent meals on fixed timings',
    'Avoid tea/coffee on empty stomach',
    '20–30 mins walk post-dinner',
    'High fiber diet (fruits & green vegetables)',
    'Elevate head of bed by 6 inches',
  ],
};

const STORAGE_KEY = 'gastro_cure_quick_chips';

export const quickChipsService = {
  /**
   * Retrieves all chip collections with default fallback
   */
  getAll: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return JSON.parse(JSON.stringify(DEFAULT_QUICK_CHIPS));
      const parsed = JSON.parse(stored);
      return {
        symptoms: Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0 ? parsed.symptoms : DEFAULT_QUICK_CHIPS.symptoms,
        diagnosis: Array.isArray(parsed.diagnosis) && parsed.diagnosis.length > 0 ? parsed.diagnosis : DEFAULT_QUICK_CHIPS.diagnosis,
        advice: Array.isArray(parsed.advice) && parsed.advice.length > 0 ? parsed.advice : DEFAULT_QUICK_CHIPS.advice,
      };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_QUICK_CHIPS));
    }
  },

  /**
   * Retrieves chips for a specific category
   * @param {'symptoms' | 'diagnosis' | 'advice'} category
   */
  get: (category) => {
    const all = quickChipsService.getAll();
    return all[category] || DEFAULT_QUICK_CHIPS[category] || [];
  },

  /**
   * Adds a new chip to a category if not already present
   * @param {'symptoms' | 'diagnosis' | 'advice'} category
   * @param {string} text
   */
  add: (category, text) => {
    if (!text || typeof text !== 'string') return quickChipsService.get(category);
    const trimmed = text.trim();
    if (!trimmed) return quickChipsService.get(category);

    const all = quickChipsService.getAll();
    const list = all[category] || [];

    // Avoid duplicate entries (case-insensitive check)
    const exists = list.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      list.push(trimmed);
      all[category] = list;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {}
    }

    return all[category];
  },

  /**
   * Removes a chip from a category
   * @param {'symptoms' | 'diagnosis' | 'advice'} category
   * @param {string} text
   */
  remove: (category, text) => {
    if (!text) return quickChipsService.get(category);
    const all = quickChipsService.getAll();
    const list = all[category] || [];

    const updated = list.filter((item) => item !== text && item.toLowerCase() !== text.toLowerCase());
    all[category] = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}

    return updated;
  },

  /**
   * Resets a category (or all categories) back to clinic defaults
   * @param {'symptoms' | 'diagnosis' | 'advice' | 'ALL'} category
   */
  reset: (category = 'ALL') => {
    const all = quickChipsService.getAll();
    if (category === 'ALL') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return JSON.parse(JSON.stringify(DEFAULT_QUICK_CHIPS));
    }

    if (DEFAULT_QUICK_CHIPS[category]) {
      all[category] = [...DEFAULT_QUICK_CHIPS[category]];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {}
    }

    return all;
  },
};
