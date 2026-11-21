// ClinicRx Offline Local Storage Service
// Handles Patients, Medicines Master, Visits & Prescriptions, Settings, and Data Backup

const KEYS = {
  patients: 'ds_patients',
  appointments: 'ds_appointments',
  visits: 'ds_visits',
  medicines: 'ds_medicines',
  settings: 'ds_settings',
};

const load = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const uid = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const generatePatientId = () => `PT-${Math.floor(100000 + Math.random() * 900000)}`;

const generateMedicineId = () => `MED-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

const generateRxId = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RX-${yyyy}${mm}${dd}-${randPart}`;
};

const getLocalDateString = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const calculateFollowUpDate = (days) => {
  if (!days || isNaN(days)) return null;
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return getLocalDateString(d);
};

// ─── Default Clinic & Print Settings ──────────────────────────────────────────

const DEFAULT_SETTINGS = {
  clinicName: 'ClinicRx Medical Centre',
  clinicTagline: 'Digestive & Liver Health Centre',
  clinicLogo: '',
  watermarkEnabled: false,
  watermarkOpacity: 0.06,
  doctorName: 'Dr. Aarav Sharma',
  qualification: 'MBBS, MD (Medicine)',
  regNumber: 'MCI-12345/2012',
  phone: '9876543210',
  email: 'info@gastrocure.com',
  address: 'Shop 4, Ground Floor, Health Plaza, New Delhi',
  timing: '10:00 AM - 02:00 PM, 06:00 PM - 09:00 PM',
  signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="160" height="48"><path d="M 15 45 C 25 20, 35 15, 45 35 C 55 55, 65 20, 80 25 C 95 30, 105 40, 120 30 C 135 20, 145 35, 160 25 M 35 32 L 85 28 M 100 48 Q 130 52 175 42" fill="none" stroke="%23123A3A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  enableRxProtocols: true, // 1-Click Clinical Rx Protocols (Protocol Kits) toggle
  print: {
    paperSize: 'A4',
    padMode: true, // Default to pre-printed letterhead pad mode
    topOffsetMm: 60, // 60mm default top offset for pre-printed pads
    bottomOffsetMm: 20,
    leftMarginMm: 15,
    rightMarginMm: 15,
    showVitals: true,
    showDiagnosis: true,
  },
};

// ─── Master Medicine Catalog Seed Data (38 Formulations) ──────────────────────

const INITIAL_MEDICINES = [
  {
    name: 'Pantoprazole 40mg',
    strength: '40mg',
    form: 'Tablet',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take empty stomach in the morning',
    category: 'Gastro',
    isActive: true,
  },
  {
    name: 'Rabeprazole 20mg',
    strength: '20mg',
    form: 'Tablet',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take 30 mins before breakfast',
    category: 'Gastro',
    isActive: true,
  },
  {
    name: 'Omeprazole 20mg',
    strength: '20mg',
    form: 'Capsule',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '7 Days',
    defaultInstruction: 'Take before food',
    category: 'Gastro',
    isActive: true,
  },
  {
    name: 'Esomeprazole 40mg',
    strength: '40mg',
    form: 'Tablet',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take on empty stomach',
    category: 'Gastro',
    isActive: true,
  },
  {
    name: 'Pantoprazole + Domperidone (Pan-D)',
    strength: '40mg+30mg',
    form: 'Capsule',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '7 Days',
    defaultInstruction: 'Take on empty stomach in morning',
    category: 'Gastro',
    isActive: true,
  },
  {
    name: 'Rabeprazole + Domperidone (Rablet-D)',
    strength: '20mg+30mg',
    form: 'Capsule',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '7 Days',
    defaultInstruction: 'Take 30 mins before breakfast',
    category: 'Gastro',
    isActive: true,
  },
  {
    name: 'Paracetamol 650mg (Dolo)',
    strength: '650mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'Take after meals for fever or body ache',
    category: 'Analgesic / Antipyretic',
    isActive: true,
  },
  {
    name: 'Paracetamol 500mg',
    strength: '500mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'For mild fever or headache',
    category: 'Analgesic / Antipyretic',
    isActive: true,
  },
  {
    name: 'Amoxicillin-Clav 625mg (Augmentin)',
    strength: '625mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Complete the full antibiotic course',
    category: 'Antibiotic',
    isActive: true,
  },
  {
    name: 'Azithromycin 500mg',
    strength: '500mg',
    form: 'Tablet',
    defaultDosage: '1-0-0',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'Take once daily at the same time',
    category: 'Antibiotic',
    isActive: true,
  },
  {
    name: 'Cefixime 200mg',
    strength: '200mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take after meals',
    category: 'Antibiotic',
    isActive: true,
  },
  {
    name: 'Ciprofloxacin 500mg',
    strength: '500mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Drink plenty of fluids',
    category: 'Antibiotic',
    isActive: true,
  },
  {
    name: 'Ofloxacin + Ornidazole (O2)',
    strength: '200mg+500mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'For intestinal and gastro infections',
    category: 'Antibiotic / GI',
    isActive: true,
  },
  {
    name: 'Metronidazole 400mg',
    strength: '400mg',
    form: 'Tablet',
    defaultDosage: '1-1-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Avoid alcohol during and 48hr after course',
    category: 'Antiprotozoal / Antibiotic',
    isActive: true,
  },
  {
    name: 'Ondansetron 4mg (Emeset)',
    strength: '4mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'Before Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'For nausea and vomiting',
    category: 'Antiemetic',
    isActive: true,
  },
  {
    name: 'Domperidone 10mg (Vomitistop)',
    strength: '10mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'Before Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take 15-30 min before meals',
    category: 'Antiemetic / Prokinetic',
    isActive: true,
  },
  {
    name: 'Metformin 500mg',
    strength: '500mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'With Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take with or right after meals',
    category: 'Antidiabetic',
    isActive: true,
  },
  {
    name: 'Glimepiride 1mg',
    strength: '1mg',
    form: 'Tablet',
    defaultDosage: '1-0-0',
    defaultTiming: 'Before Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take immediately before breakfast',
    category: 'Antidiabetic',
    isActive: true,
  },
  {
    name: 'Telmisartan 40mg',
    strength: '40mg',
    form: 'Tablet',
    defaultDosage: '1-0-0',
    defaultTiming: 'After Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take at the same time each morning',
    category: 'Antihypertensive',
    isActive: true,
  },
  {
    name: 'Amlodipine 5mg',
    strength: '5mg',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take once daily at bedtime',
    category: 'Antihypertensive',
    isActive: true,
  },
  {
    name: 'Atorvastatin 10mg',
    strength: '10mg',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take at bedtime',
    category: 'Lipid Lowering',
    isActive: true,
  },
  {
    name: 'Rosuvastatin 10mg',
    strength: '10mg',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take at night after food',
    category: 'Lipid Lowering',
    isActive: true,
  },
  {
    name: 'Montelukast + Levocetirizine (Montair-LC)',
    strength: '10mg+5mg',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '7 Days',
    defaultInstruction: 'Take at night for allergic rhinitis / cough',
    category: 'Antiallergic',
    isActive: true,
  },
  {
    name: 'Cetirizine 10mg',
    strength: '10mg',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'May cause mild drowsiness; take at night',
    category: 'Antihistamine',
    isActive: true,
  },
  {
    name: 'Levocetirizine 5mg',
    strength: '5mg',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take once daily at bedtime',
    category: 'Antihistamine',
    isActive: true,
  },
  {
    name: 'Ibuprofen 400mg',
    strength: '400mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'Take strictly after meals with water',
    category: 'NSAID / Pain',
    isActive: true,
  },
  {
    name: 'Aceclofenac + Paracetamol (Zerodol-P)',
    strength: '100mg+325mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'Take after meals for joint or body pain',
    category: 'NSAID / Pain',
    isActive: true,
  },
  {
    name: 'Tramadol + Paracetamol (Ultracet)',
    strength: '37.5mg+325mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'For moderate to severe pain as advised',
    category: 'Analgesic',
    isActive: true,
  },
  {
    name: 'Dicyclomine + Paracetamol (Spasmo-Proxyvon / Meftal-Spas)',
    strength: '20mg+325mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'Take for spasmodic abdominal cramps',
    category: 'Antispasmodic',
    isActive: true,
  },
  {
    name: 'Drotaverine 80mg (Drotin-DS)',
    strength: '80mg',
    form: 'Tablet',
    defaultDosage: '1-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '3 Days',
    defaultInstruction: 'Take for stomach cramps or abdominal pain',
    category: 'Antispasmodic',
    isActive: true,
  },
  {
    name: 'Sucralfate Suspension',
    strength: '1000mg/10ml',
    form: 'Syrup',
    defaultDosage: '2 tsp',
    defaultTiming: 'Before Food',
    defaultDuration: '7 Days',
    defaultInstruction: 'Take 1 hour before meals and at bedtime',
    category: 'GI Mucosal Protectant',
    isActive: true,
  },
  {
    name: 'Antacid Gel (Mucaine Gel / Digene)',
    strength: 'Standard',
    form: 'Syrup',
    defaultDosage: '2 tsp',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take after meals and at bedtime for acidity',
    category: 'Antacid',
    isActive: true,
  },
  {
    name: 'ORS (Oral Rehydration Salts)',
    strength: '21.8g Sachet',
    form: 'Sachet',
    defaultDosage: '1 sachet in 1L water',
    defaultTiming: 'As Needed',
    defaultDuration: '2 Days',
    defaultInstruction: 'Mix entire sachet in 1 liter clean water; sip regularly',
    category: 'Rehydration',
    isActive: true,
  },
  {
    name: 'B-Complex with Zinc (Becosules)',
    strength: 'Multivitamin',
    form: 'Capsule',
    defaultDosage: '1-0-0',
    defaultTiming: 'After Food',
    defaultDuration: '15 Days',
    defaultInstruction: 'Daily nutritional supplement',
    category: 'Nutritional',
    isActive: true,
  },
  {
    name: 'Vitamin D3 60k IU (Calcirol)',
    strength: '60,000 IU',
    form: 'Capsule',
    defaultDosage: 'Once Weekly',
    defaultTiming: 'After Food',
    defaultDuration: '8 Weeks',
    defaultInstruction: 'Take 1 capsule once every week with milk',
    category: 'Vitamins',
    isActive: true,
  },
  {
    name: 'Calcium + Vitamin D3 (Shelcal 500)',
    strength: '500mg+250IU',
    form: 'Tablet',
    defaultDosage: '0-1-0',
    defaultTiming: 'After Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take after lunch',
    category: 'Supplements',
    isActive: true,
  },
  {
    name: 'Iron + Folic Acid (Autrin / Dexorange)',
    strength: 'Standard',
    form: 'Tablet',
    defaultDosage: '0-0-1',
    defaultTiming: 'After Food',
    defaultDuration: '30 Days',
    defaultInstruction: 'Take after dinner; avoid milk/tea/coffee around dose',
    category: 'Hematinic',
    isActive: true,
  },
  {
    name: 'Cough Syrup (Ascoril-D / Corex-DX)',
    strength: '100ml',
    form: 'Syrup',
    defaultDosage: '2 tsp (10ml)',
    defaultTiming: 'After Food',
    defaultDuration: '5 Days',
    defaultInstruction: 'Take thrice daily after meals',
    category: 'Respiratory / Cough',
    isActive: true,
  },
];

// ─── Patients Service ─────────────────────────────────────────────────────────

export const localPatients = {
  getAll: () => load(KEYS.patients),

  getById: (id) => {
    if (!id) return null;
    const patients = load(KEYS.patients);
    return patients.find((p) => p.id === id) || null;
  },

  search: (q) => {
    const patients = load(KEYS.patients);
    if (!q || !q.toString().trim()) return patients;
    const query = q.toString().trim().toLowerCase();
    return patients.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const contact = String(p.contact || p.mobile || '').toLowerCase();
      const id = String(p.id || '').toLowerCase();
      return name.includes(query) || contact.includes(query) || id.includes(query);
    });
  },

  add: (data) => {
    const patients = load(KEYS.patients);
    const id = data.id || generatePatientId();
    const contact = data.contact || data.mobile || '';
    const patient = {
      id,
      name: data.name || '',
      age: data.age !== undefined && data.age !== '' ? Number(data.age) : '',
      gender: data.gender || 'Male',
      contact,
      mobile: contact,
      address: data.address || '',
      bloodGroup: data.bloodGroup || '',
      allergies: data.allergies || '',
      notes: data.notes || '',
      status: data.status || 'Active',
      lastVisit: data.lastVisit || new Date().toISOString().split('T')[0],
      nextFollowUp: data.nextFollowUp || null,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    patients.unshift(patient);
    save(KEYS.patients, patients);
    return patient;
  },

  update: (id, patch) => {
    if (!id) return null;
    const patients = load(KEYS.patients);
    const index = patients.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = patients[index];
    const contact = patch.contact || patch.mobile || current.contact || current.mobile || '';
    const updated = {
      ...current,
      ...patch,
      contact,
      mobile: contact,
      updatedAt: new Date().toISOString(),
    };
    patients[index] = updated;
    save(KEYS.patients, patients);
    return updated;
  },

  delete: (id) => {
    if (!id) return false;
    const patients = load(KEYS.patients);
    const initialLen = patients.length;
    const filtered = patients.filter((p) => p.id !== id);
    if (filtered.length === initialLen) return false;
    save(KEYS.patients, filtered);
    return true;
  },

  seed: () => {
    if (load(KEYS.patients).length > 0) return load(KEYS.patients);
    const demo = [
      {
        id: 'PT-001',
        name: 'Aarav Sharma',
        age: 32,
        gender: 'Male',
        contact: '9876543210',
        mobile: '9876543210',
        address: 'Delhi',
        bloodGroup: 'B+',
        allergies: 'None',
        status: 'Active',
        lastVisit: '2026-03-03',
        nextFollowUp: null,
        createdAt: '2026-03-03T10:00:00Z',
      },
      {
        id: 'PT-002',
        name: 'Maya Verma',
        age: 27,
        gender: 'Female',
        contact: '9876543211',
        mobile: '9876543211',
        address: 'Mumbai',
        bloodGroup: 'O+',
        allergies: 'Sulfa Drugs',
        status: 'Follow-up',
        lastVisit: '2026-03-02',
        nextFollowUp: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: '2026-03-02T10:00:00Z',
      },
      {
        id: 'PT-003',
        name: 'Rohan Iyer',
        age: 45,
        gender: 'Male',
        contact: '9876543212',
        mobile: '9876543212',
        address: 'Pune',
        bloodGroup: 'A+',
        allergies: 'None',
        status: 'Active',
        lastVisit: '2026-02-28',
        nextFollowUp: null,
        createdAt: '2026-02-28T10:00:00Z',
      },
      {
        id: 'PT-004',
        name: 'Avi Tamrakar',
        age: 30,
        gender: 'Male',
        contact: '7470562824',
        mobile: '7470562824',
        address: 'Bhopal',
        bloodGroup: 'O+',
        allergies: 'None',
        status: 'Follow-up',
        lastVisit: '2026-03-01',
        nextFollowUp: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        createdAt: '2026-03-01T11:00:00Z',
      },
      {
        id: 'PT-005',
        name: 'Vikram Patel',
        age: 42,
        gender: 'Male',
        contact: '9876543213',
        mobile: '9876543213',
        address: 'Ahmedabad',
        bloodGroup: 'AB+',
        allergies: 'Penicillin',
        status: 'Active',
        lastVisit: '2026-02-25',
        nextFollowUp: null,
        createdAt: '2026-02-25T09:30:00Z',
      },
      {
        id: 'PT-006',
        name: 'Priya Deshmukh',
        age: 29,
        gender: 'Female',
        contact: '9876543214',
        mobile: '9876543214',
        address: 'Nagpur',
        bloodGroup: 'A-',
        allergies: 'None',
        status: 'Follow-up',
        lastVisit: '2026-03-02',
        nextFollowUp: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        createdAt: '2026-03-02T14:15:00Z',
      },
      {
        id: 'PT-007',
        name: 'Rajesh Gupta',
        age: 56,
        gender: 'Male',
        contact: '9876543215',
        mobile: '9876543215',
        address: 'Indore',
        bloodGroup: 'B+',
        allergies: 'Aspirin',
        status: 'Active',
        lastVisit: '2026-02-20',
        nextFollowUp: null,
        createdAt: '2026-02-20T16:00:00Z',
      },
      {
        id: 'PT-008',
        name: 'Sunita Kulkarni',
        age: 48,
        gender: 'Female',
        contact: '9876543216',
        mobile: '9876543216',
        address: 'Nashik',
        bloodGroup: 'O+',
        allergies: 'None',
        status: 'Follow-up',
        lastVisit: '2026-03-01',
        nextFollowUp: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: '2026-03-01T12:00:00Z',
      },
    ];
    save(KEYS.patients, demo);
    return demo;
  },
};

// ─── Master Medicine Catalog Service ──────────────────────────────────────────

export const localMedicines = {
  getAll: () => load(KEYS.medicines),

  getById: (id) => (!id ? null : load(KEYS.medicines).find((m) => m.id === id) || null),

  search: (q) => {
    const list = load(KEYS.medicines);
    if (!q || !q.toString().trim()) return list;
    const query = q.toString().trim().toLowerCase();
    return list.filter((m) => {
      const name = String(m.name || '').toLowerCase();
      const form = String(m.form || '').toLowerCase();
      const strength = String(m.strength || '').toLowerCase();
      const category = String(m.category || '').toLowerCase();
      return (
        name.includes(query) ||
        form.includes(query) ||
        strength.includes(query) ||
        category.includes(query)
      );
    });
  },

  add: (data) => {
    const medicines = load(KEYS.medicines);
    const item = {
      id: data.id || generateMedicineId(),
      name: data.name || '',
      strength: data.strength || '',
      form: data.form || 'Tablet',
      defaultDosage: data.defaultDosage || '1-0-1',
      defaultTiming: data.defaultTiming || 'After Food',
      defaultDuration: data.defaultDuration || '5 Days',
      defaultInstruction: data.defaultInstruction || data.instructions || '',
      category: data.category || 'General',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: new Date().toISOString(),
    };
    medicines.unshift(item);
    save(KEYS.medicines, medicines);
    return item;
  },

  update: (id, patch) => {
    if (!id) return null;
    const medicines = load(KEYS.medicines);
    const index = medicines.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updated = {
      ...medicines[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    medicines[index] = updated;
    save(KEYS.medicines, medicines);
    return updated;
  },

  delete: (id) => {
    if (!id) return false;
    const medicines = load(KEYS.medicines);
    const initialLen = medicines.length;
    const filtered = medicines.filter((m) => m.id !== id);
    if (filtered.length === initialLen) return false;
    save(KEYS.medicines, filtered);
    return true;
  },

  seed: () => {
    const existing = load(KEYS.medicines);
    if (existing.length > 0) return existing;

    const seeded = INITIAL_MEDICINES.map((med, index) => ({
      id: `MED-${String(index + 1).padStart(3, '0')}`,
      ...med,
      createdAt: new Date().toISOString(),
    }));
    save(KEYS.medicines, seeded);
    return seeded;
  },
};

// ─── Appointments / Queue ─────────────────────────────────────────────────────

export const localAppointments = {
  getQueue: () => load(KEYS.appointments).filter((a) => a.status === 'waiting'),

  addToQueue: (patientId, patientName, patientAge, reason = 'General consultation') => {
    const appointments = load(KEYS.appointments);
    const appt = {
      id: uid(),
      patientId,
      patientName,
      patientAge,
      reason,
      status: 'waiting',
      startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    appointments.unshift(appt);
    save(KEYS.appointments, appointments);
    return appt;
  },

  markCompleted: (appointmentId) => {
    const appointments = load(KEYS.appointments).map((a) =>
      a.id === appointmentId ? { ...a, status: 'completed' } : a
    );
    save(KEYS.appointments, appointments);
  },
};

// ─── Visits & Prescriptions ───────────────────────────────────────────────────

export const localVisits = {
  getAll: () => load(KEYS.visits),

  getByPatient: (patientId) =>
    load(KEYS.visits)
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),

  getById: (visitId) => load(KEYS.visits).find((v) => v.id === visitId) || null,

  save: (data) => {
    const visits = load(KEYS.visits);

    // Calculate follow-up date
    let followUpDate = data.followUpDate || data.nextFollowUp || null;
    if (!followUpDate && data.followUpDays) {
      followUpDate = calculateFollowUpDate(data.followUpDays);
    }

    const todayDate = getLocalDateString();

    const existingIndex = data.id ? visits.findIndex((v) => v.id === data.id) : -1;
    let visit;

    if (existingIndex >= 0) {
      visit = {
        ...visits[existingIndex],
        ...data,
        id: data.id,
        vitals: data.vitals || visits[existingIndex].vitals || {},
        medicines: Array.isArray(data.medicines)
          ? JSON.parse(JSON.stringify(data.medicines))
          : visits[existingIndex].medicines,
        followUpDate,
        nextFollowUp: followUpDate,
        status: data.status || visits[existingIndex].status || 'SAVED',
        updatedAt: new Date().toISOString(),
      };
      visits[existingIndex] = visit;
    } else {
      visit = {
        id: data.id || generateRxId(),
        patientId: data.patientId,
        patientName: data.patientName || '',
        patientAge: data.patientAge !== undefined ? data.patientAge : '',
        patientGender: data.patientGender || '',
        patientMobile: data.patientMobile || data.patientContact || '',
        appointmentId: data.appointmentId || null,
        date: data.date || new Date().toISOString(),
        vitals: data.vitals || {},
        symptoms: data.symptoms || data.complaints || '',
        diagnosis: data.diagnosis || '',
        notes: data.notes || '',
        medicines: Array.isArray(data.medicines) ? JSON.parse(JSON.stringify(data.medicines)) : [],
        tests: Array.isArray(data.tests) ? [...data.tests] : [],
        advice: data.advice || '',
        followUpDays: data.followUpDays || null,
        followUpDate,
        nextFollowUp: followUpDate,
        status: data.status || 'SAVED',
        createdAt: data.createdAt || new Date().toISOString(),
      };
      visits.unshift(visit);
    }

    save(KEYS.visits, visits);

    // Side effect: update patient record
    if (data.patientId) {
      const existingPatient = localPatients.getById(data.patientId);
      const visitDate = data.date ? (data.date.includes('T') ? data.date.split('T')[0] : data.date) : todayDate;
      const isNewer = !existingPatient?.lastVisit || visitDate >= existingPatient.lastVisit;

      const patch = {};
      if (isNewer) {
        patch.lastVisit = visitDate;
        if (followUpDate) {
          patch.nextFollowUp = followUpDate;
        }
      } else if (followUpDate && (!existingPatient?.nextFollowUp || followUpDate >= existingPatient.nextFollowUp)) {
        patch.nextFollowUp = followUpDate;
      }
      if (Object.keys(patch).length > 0) {
        localPatients.update(data.patientId, patch);
      }
    }

    return visit;
  },

  getUpcomingFollowUps: (daysAhead = 2) => {
    const visits = load(KEYS.visits);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(today);
    target.setDate(target.getDate() + Number(daysAhead));
    target.setHours(23, 59, 59, 999);

    return visits
      .filter((v) => {
        const fDateStr = v.followUpDate || v.nextFollowUp;
        if (!fDateStr) return false;
        const fDate = new Date(fDateStr);
        fDate.setHours(12, 0, 0, 0);
        return fDate <= target;
      })
      .sort((a, b) => {
        const da = new Date(a.followUpDate || a.nextFollowUp);
        const db = new Date(b.followUpDate || b.nextFollowUp);
        return da - db;
      });
  },
};

// ─── Settings Service ─────────────────────────────────────────────────────────

export const localSettings = {
  get: () => {
    const stored = load(KEYS.settings, null);
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      print: {
        ...DEFAULT_SETTINGS.print,
        ...(stored.print || {}),
      },
    };
  },

  update: (data) => {
    const current = localSettings.get();
    const updated = {
      ...current,
      ...data,
      print: {
        ...current.print,
        ...(data?.print || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    save(KEYS.settings, updated);
    return updated;
  },
};

// ─── Data Backup & Restore Service ───────────────────────────────────────────

export const dataBackup = {
  exportJson: () => {
    const bundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      patients: load(KEYS.patients),
      appointments: load(KEYS.appointments),
      visits: load(KEYS.visits),
      medicines: load(KEYS.medicines),
      settings: localSettings.get(),
    };
    return JSON.stringify(bundle, null, 2);
  },

  importJson: (jsonString) => {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid JSON structure' };
      }

      if (Array.isArray(data.patients)) save(KEYS.patients, data.patients);
      if (Array.isArray(data.appointments)) save(KEYS.appointments, data.appointments);
      if (Array.isArray(data.visits)) save(KEYS.visits, data.visits);
      if (Array.isArray(data.medicines)) save(KEYS.medicines, data.medicines);
      if (data.settings && typeof data.settings === 'object') save(KEYS.settings, data.settings);

      return {
        success: true,
        counts: {
          patients: Array.isArray(data.patients) ? data.patients.length : 0,
          medicines: Array.isArray(data.medicines) ? data.medicines.length : 0,
          visits: Array.isArray(data.visits) ? data.visits.length : 0,
        },
      };
    } catch (err) {
      return { success: false, error: err.message || 'JSON parsing failed' };
    }
  },
};

export { getLocalDateString, calculateFollowUpDate };
