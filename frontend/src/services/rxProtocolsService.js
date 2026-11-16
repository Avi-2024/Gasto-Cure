/**
 * 1-Click Clinical Rx Protocols (Protocol Kits) for Gastro Cure Clinic
 *
 * Pre-configured evidence-based clinical protocols for the most common
 * gastrointestinal, hepatology, and acid-peptic disorders.
 *
 * Doctors can apply any protocol in 1 click to auto-fill:
 * - Symptoms / Chief complaints
 * - Clinical diagnosis
 * - Standardized Rx medicine regimen (with frequency, duration, remarks)
 * - Lifestyle & dietary advice
 * - Follow-up scheduling
 *
 * Doctors can also create, customize, and persist their own clinic protocols.
 */

export const DEFAULT_RX_PROTOCOLS = [
  {
    id: 'proto-gerd',
    title: 'GERD & Acid Reflux',
    shortName: 'GERD / Reflux',
    category: 'Upper GI',
    diagnosis: 'GERD / Acid Peptic Disease (APD)',
    symptoms: 'Heartburn & Acidity, Epigastric Pain, Belching & Gas',
    medicines: [
      {
        name: 'Pantoprazole 40mg',
        dosage: '40mg',
        frequency: '1-0-0',
        duration: '14 Days',
        remarks: 'Take empty stomach in the morning',
      },
      {
        name: 'Domperidone 10mg',
        dosage: '10mg',
        frequency: '1-0-1',
        duration: '5 Days',
        remarks: 'Take 30 mins before food',
      },
      {
        name: 'Magaldrate + Simethicone Gel',
        dosage: '10ml',
        frequency: '0-1-1',
        duration: '7 Days',
        remarks: 'Take 2 tsp after meals & bedtime SOS',
      },
    ],
    advice: 'Avoid spicy, fried & oily foods, Avoid tea/coffee on empty stomach, Elevate head of bed by 6 inches, 20–30 mins walk post-dinner',
    followUpDays: 14,
    badgeColor: '#E06D53',
    bgColor: '#FEF2F0',
  },
  {
    id: 'proto-gastritis',
    title: 'Acute Gastritis',
    shortName: 'Acute Gastritis',
    category: 'Upper GI',
    diagnosis: 'Acute Gastritis',
    symptoms: 'Epigastric Pain, Nausea & Vomiting, Loss of Appetite',
    medicines: [
      {
        name: 'Rabeprazole 20mg',
        dosage: '20mg',
        frequency: '1-0-0',
        duration: '7 Days',
        remarks: 'Take empty stomach in the morning',
      },
      {
        name: 'Ondansetron 4mg',
        dosage: '40mg',
        frequency: '1-0-1',
        duration: '3 Days',
        remarks: 'Take 30 mins before food for nausea',
      },
      {
        name: 'Sucralfate Suspension',
        dosage: '10ml',
        frequency: '1-0-1',
        duration: '5 Days',
        remarks: 'Take 1 hr before meals',
      },
    ],
    advice: 'Small frequent meals on fixed timings, Drink 2.5–3L water daily, Avoid spicy, fried & oily foods',
    followUpDays: 7,
    badgeColor: '#287C75',
    bgColor: '#E8F3F1',
  },
  {
    id: 'proto-ibs',
    title: 'Irritable Bowel (IBS)',
    shortName: 'IBS & Bloating',
    category: 'Lower GI',
    diagnosis: 'Irritable Bowel (IBS) with Dyspepsia',
    symptoms: 'Abdominal Bloating, Altered bowel habits, Belching & Gas',
    medicines: [
      {
        name: 'Mebeverine 135mg',
        dosage: '135mg',
        frequency: '1-0-1',
        duration: '14 Days',
        remarks: 'Take 20 mins before meals for abdominal cramps',
      },
      {
        name: 'Probiotic & Prebiotic (Bacillus clausii)',
        dosage: '1 Cap',
        frequency: '1-0-1',
        duration: '10 Days',
        remarks: 'Take after food',
      },
      {
        name: 'Rifaximin 400mg',
        dosage: '400mg',
        frequency: '1-0-1',
        duration: '7 Days',
        remarks: 'Take after meals',
      },
    ],
    advice: 'High fiber diet (fruits & green vegetables), Drink 2.5–3L water daily, Avoid stress & trigger foods, Small frequent meals',
    followUpDays: 14,
    badgeColor: '#6B46C1',
    bgColor: '#F3E8FF',
  },
  {
    id: 'proto-fatty-liver',
    title: 'Fatty Liver (NAFLD)',
    shortName: 'Fatty Liver (NAFLD)',
    category: 'Hepatology',
    diagnosis: 'Fatty Liver (NAFLD) Grade I/II',
    symptoms: 'Right upper quadrant abdominal fullness, Fatigue, Dyspepsia',
    medicines: [
      {
        name: 'Ursodeoxycholic Acid 300mg (UDCA)',
        dosage: '300mg',
        frequency: '1-0-1',
        duration: '30 Days',
        remarks: 'Take with meals',
      },
      {
        name: 'Vitamin E 400 IU (Evion)',
        dosage: '400 IU',
        frequency: '0-1-0',
        duration: '30 Days',
        remarks: 'Take after lunch',
      },
      {
        name: 'Silymarin + L-Ornithine L-Aspartate',
        dosage: '1 Tab',
        frequency: '1-0-1',
        duration: '30 Days',
        remarks: 'Take after meals',
      },
    ],
    advice: 'Strictly avoid alcohol, 30-45 mins brisk walk daily, Low fat & low sugar diet, Weight reduction',
    followUpDays: 30,
    badgeColor: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'proto-hpylori',
    title: 'H. Pylori Eradication Kit',
    shortName: 'H. Pylori Kit',
    category: 'Upper GI',
    diagnosis: 'H. Pylori Infection & Peptic Ulcer Disease',
    symptoms: 'Epigastric burning pain, Bloating, Dyspepsia / Indigestion',
    medicines: [
      {
        name: 'Esomeprazole 40mg',
        dosage: '40mg',
        frequency: '1-0-1',
        duration: '14 Days',
        remarks: 'Take 30 mins before breakfast & dinner',
      },
      {
        name: 'Amoxicillin 1000mg',
        dosage: '1000mg',
        frequency: '1-0-1',
        duration: '14 Days',
        remarks: 'Take after food - Complete full 14 days course',
      },
      {
        name: 'Clarithromycin 500mg',
        dosage: '500mg',
        frequency: '1-0-1',
        duration: '14 Days',
        remarks: 'Take after food - Complete full 14 days course',
      },
    ],
    advice: 'Strictly do not skip doses, Avoid spicy & sour foods, Drink clean boiled water, Complete entire course',
    followUpDays: 14,
    badgeColor: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    id: 'proto-constipation',
    title: 'Chronic Constipation & Dyspepsia',
    shortName: 'Constipation Kit',
    category: 'Lower GI',
    diagnosis: 'Dyspepsia / Indigestion with Chronic Constipation',
    symptoms: 'Constipation, Abdominal Bloating, Belching & Gas',
    medicines: [
      {
        name: 'Lactulose Syrup',
        dosage: '15ml',
        frequency: '0-0-1',
        duration: '7 Days',
        remarks: 'Take 15-30ml at bedtime with warm water',
      },
      {
        name: 'Pantoprazole + Levosulpiride',
        dosage: '1 Cap',
        frequency: '1-0-0',
        duration: '10 Days',
        remarks: 'Take empty stomach in the morning',
      },
      {
        name: 'Ispaghula Husk (Psyllium)',
        dosage: '2 tsp',
        frequency: '0-0-1',
        duration: '14 Days',
        remarks: 'Take 1-2 tsp in full glass of water at bedtime',
      },
    ],
    advice: 'High fiber diet (fruits & green vegetables), Drink 3L water daily, 20–30 mins walk post-dinner',
    followUpDays: 14,
    badgeColor: '#2563EB',
    bgColor: '#DBEAFE',
  },
];

const STORAGE_KEY = 'gastro_cure_rx_protocols';

export const rxProtocolsService = {
  /**
   * Retrieves all available clinical protocols (default + custom)
   */
  getAll: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return JSON.parse(JSON.stringify(DEFAULT_RX_PROTOCOLS));
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : JSON.parse(JSON.stringify(DEFAULT_RX_PROTOCOLS));
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_RX_PROTOCOLS));
    }
  },

  /**
   * Retrieves a protocol by its ID
   */
  getById: (id) => {
    if (!id) return null;
    const protocols = rxProtocolsService.getAll();
    return protocols.find((p) => p.id === id) || null;
  },

  /**
   * Adds or updates a custom clinical protocol
   */
  save: (protocol) => {
    if (!protocol || !protocol.title) return null;
    const protocols = rxProtocolsService.getAll();
    const id = protocol.id || `custom-proto-${Date.now()}`;
    const cleanItem = {
      ...protocol,
      id,
      title: protocol.title.trim(),
      shortName: (protocol.shortName || protocol.title).trim(),
      category: protocol.category || 'General',
      medicines: Array.isArray(protocol.medicines) ? protocol.medicines : [],
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = protocols.findIndex((p) => p.id === id);
    if (existingIdx >= 0) {
      protocols[existingIdx] = cleanItem;
    } else {
      protocols.push(cleanItem);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(protocols));
    } catch {
      // storage unavailable fallback
    }
    return cleanItem;
  },

  /**
   * Removes a custom protocol by ID
   */
  delete: (id) => {
    const protocols = rxProtocolsService.getAll();
    const filtered = protocols.filter((p) => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // noop
    }
    return filtered;
  },

  /**
   * Resets all protocols back to clinic standard defaults
   */
  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
    return JSON.parse(JSON.stringify(DEFAULT_RX_PROTOCOLS));
  },
};

export default rxProtocolsService;
