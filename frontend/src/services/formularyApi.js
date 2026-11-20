import { apiRequest } from './apiClient';
import { localMedicines } from './localStore';

function normalizeDrug(drug) {
  if (!drug) return null;
  return {
    id: drug.id,
    name: drug.brandName,
    generic: drug.genericName,
    form: drug.dosageForm || 'Tablet',
    strength: drug.strength || '',
    category: drug.category || 'General',
    frequency: drug.defaultFrequency || '1-0-1',
    duration: drug.defaultDuration || '5 Days',
    timing: drug.defaultTiming || 'After Food',
    instructions: drug.instructions || '',
    isActive: true,
  };
}

export const formularyApi = {
  /**
   * Search / List Master Formulary Drugs (Global + Clinic Custom)
   */
  async getDrugs({ query = '', category = '', limit = 100 } = {}) {
    if (import.meta.env.MODE === 'test') {
      localMedicines.seed();
      let list = query ? localMedicines.search(query) : localMedicines.getAll();
      if (category && category !== 'All') {
        list = list.filter((m) => m.category === category);
      }
      return { drugs: list, total: list.length, isOfflineFallback: true };
    }

    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (category && category !== 'All') params.set('category', category);
      if (limit) params.set('limit', String(limit));

      const res = await apiRequest(`/formulary?${params.toString()}`);
      if (res?.success && res?.data?.drugs) {
        return {
          drugs: res.data.drugs.map(normalizeDrug),
          total: res.data.total || res.data.drugs.length,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to fetch drugs');
    } catch (err) {
      console.warn('Formulary API failed, falling back to localStore:', err.message);
      localMedicines.seed();
      let list = query ? localMedicines.search(query) : localMedicines.getAll();
      return { drugs: list, total: list.length, isOfflineFallback: true };
    }
  },

  /**
   * Add Custom Clinic Drug to Formulary
   */
  async createDrug(drugData) {
    if (import.meta.env.MODE === 'test') {
      const added = localMedicines.add(drugData);
      return { success: true, data: added, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest('/formulary', {
        method: 'POST',
        body: {
          brandName: drugData.name?.trim(),
          genericName: drugData.generic?.trim() || drugData.name?.trim(),
          category: drugData.category || 'General Medicine',
          dosageForm: drugData.form || 'Tablet',
          strength: drugData.strength || null,
          defaultFrequency: drugData.frequency || null,
          defaultDuration: drugData.duration || null,
          defaultTiming: drugData.timing || null,
          instructions: drugData.instructions || null,
        },
      });

      if (res?.success && res?.data) {
        localMedicines.add({
          id: res.data.id,
          name: res.data.brandName,
          generic: res.data.genericName,
          form: res.data.dosageForm,
          strength: res.data.strength,
          category: res.data.category,
          frequency: res.data.defaultFrequency,
          duration: res.data.defaultDuration,
          timing: res.data.defaultTiming,
          isActive: true,
        });

        return {
          success: true,
          data: normalizeDrug(res.data),
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to save drug to formulary');
    } catch (err) {
      console.warn('Formulary add failed, falling back to local store:', err.message);
      const added = localMedicines.add(drugData);
      return { success: true, data: added, isOfflineFallback: true };
    }
  },
};
