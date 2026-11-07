# ClinicRx — Lightweight Clinic Patient & Prescription Management System
## Technical Design Document (Version 1.0 MVP)

**Date:** 2026-11-07  
**Status:** Ready for Review  
**Project:** ClinicRx (Doctor Script & Prescription Panel)  
**Target Repository:** `Avi-2024/Doctor-System` (`main-snapshot-6202182`)  
**Primary Users:** Doctor (Primary), Clinic Staff / Receptionist (Secondary)  

---

## 1. Intent and the "Why"
Doctors in private clinics frequently use pre-printed prescription pads (featuring embossed logos, clinic address, and registration details at the top) and currently rely on manual handwriting or paper slips for vitals (BP, sugar, weight). This leads to:
1. Repetitive handwriting of patient demographics and frequently prescribed medicines.
2. Inability to instantly retrieve past prescriptions when a patient returns.
3. Inability to print neatly onto existing pre-printed stationery because standard software assumes blank paper and prints over the clinic logo.
4. Missed follow-ups because patients forget their return dates without proactive reminders.

ClinicRx digitizes this entire workflow into a fast, keyboard-friendly, single-screen experience: **Search/Add Patient → Review Vitals & Past Visits → Fast Autocomplete Rx → Calibrated Print on Pre-printed Pad → 1-Click WhatsApp Follow-up Reminder**.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals (Version 1 MVP)
- **Fast Patient Management:** Search by Name, Mobile, or Patient ID (`PT-XXXXXX`) in < 100ms. Quick patient registration and patient detail editing.
- **Master Medicine Catalog & Instant Autocomplete:** Search medicines by typing 2–3 characters (e.g., "Pan" → "Pantoprazole 40mg"), instantly selecting with auto-populated default dosage (1-0-1), timing (Before Food), duration, and instructions. Ability to add/edit medicines in the catalog.
- **Comprehensive Prescription Builder:** Captures visit vitals (BP, Weight, Blood Sugar, Temperature, Pulse, SpO2), Chief Complaints, Diagnosis, Rx table, Advice, and Follow-up scheduling.
- **Configurable A4 Print Alignment for Pre-Printed Pads:**
  - Configurable top offset (slider in mm / inches, e.g., 40mm – 120mm) so printing begins precisely below the doctor's pre-printed letterhead logo.
  - Configurable margins (Left, Right, Bottom).
  - Mode toggle: "Pre-printed Pad Mode" (leaves blank header space) vs "Digital Letterhead Mode" (renders clinic/doctor header for plain paper).
  - Test print page to verify alignment without wasting expensive stationery.
- **Permanent Prescription History & 1-Click Reprint:** Every visit is stored chronologically under the patient's record and can be re-opened, viewed, or reprinted at any time.
- **WhatsApp Integration & Proactive Follow-up Reminders:**
  - 1-click share prescription summary and next follow-up date to patient's WhatsApp (`wa.me`).
  - Proactive "Upcoming Follow-ups (Next 1–2 Days)" reminder dashboard with pre-filled WhatsApp alert templates.
- **Offline-First Resilience:** Instant speed in clinic computers, persistent local storage with JSON backup/restore, with seamless compatibility for future backend database sync.

### Non-Goals (Out of Scope for V1)
- Complex multi-specialty hospital management or inpatient (IPD) bed management.
- Direct payment gateway / online credit card settlement (fees tracked simply).
- Lab sample barcoding or automated DICOM PACS imaging.
- Telemedicine video calls.

### Anti-Goals
- Multi-step modal labyrinths: The doctor must never be forced through 5 clicks when 1 keystroke can do the job.
- Hardcoded print layouts that destroy or overlap pre-printed clinic letterheads.
- Mandatory fields that block the doctor during an urgent patient consultation.

---

## 3. Approaches Considered

### Approach 1: Offline-First High-Performance Client Application (Selected)
- **Architecture:** Upgraded React 18 SPA with dedicated service layer (`localStore.js`), indexed search, custom CSS Print Variables engine, and `wa.me` deep linking.
- **Why Selected:** Delivers zero-latency performance inside clinic consulting rooms, works without internet dependencies or database crashes, requires zero API subscriptions for WhatsApp, and fits directly into the existing repository branch without complex operational overhead. Includes full JSON export/import for data safety.

### Approach 2: Monolithic Backend-Coupled Node.js + MongoDB
- **Architecture:** Node.js Express server + MongoDB instance required to be running locally or in cloud.
- **Trade-off:** High operational barrier for a single-doctor clinic (database server failures, port conflicts, migration setup). Deferred to Phase 2 for multi-branch clinic synchronization.

---

## 4. Key Architectural Modules & Data Models

### 4.1 Data Models (Persistent Storage)

#### `Patient`
```typescript
interface Patient {
  id: string; // PT-000101
  name: string;
  mobile: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  notes?: string;
  lastVisit?: string; // YYYY-MM-DD
  nextFollowUp?: string; // YYYY-MM-DD
  status: 'Active' | 'Follow-up' | 'Stable' | 'Critical';
  createdAt: string;
}
```

#### `Medicine`
```typescript
interface Medicine {
  id: string;
  name: string;
  strength?: string; // "40 mg", "500 mg"
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Ointment';
  defaultDosage: string; // "1-0-1", "1-0-0", "OD", "BD"
  defaultTiming: string; // "Before Food", "After Food", "With Food"
  defaultDuration: string; // "5 Days", "7 Days"
  defaultInstruction?: string; // "Take with warm water"
  isActive: boolean;
}
```

#### `Prescription / Visit`
```typescript
interface PrescriptionItem {
  medicineId?: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string; // "Before Food", "After Food"
  duration: string;
  remarks?: string;
}

interface Vitals {
  bp?: string; // "120/80"
  weight?: string; // "72 kg"
  sugar?: string; // "110 mg/dL"
  temp?: string; // "98.6 F"
  pulse?: string; // "72 bpm"
  spo2?: string; // "98%"
}

interface Prescription {
  id: string; // RX-20261107-XXXX
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientMobile: string;
  date: string; // ISO
  vitals: Vitals;
  symptoms: string; // Chief Complaints
  diagnosis: string;
  medicines: PrescriptionItem[];
  tests?: string[];
  advice?: string;
  followUpDays?: number;
  followUpDate?: string; // YYYY-MM-DD
  status: 'DRAFT' | 'SAVED' | 'PRINTED';
  createdAt: string;
}
```

#### `ClinicSettings`
```typescript
interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  qualification: string;
  regNumber: string;
  phone: string;
  address: string;
  print: {
    paperSize: 'A4';
    padMode: boolean; // true = pre-printed pad mode (blank top offset), false = full digital header
    topOffsetMm: number; // default: 60mm (adjustable 20mm - 140mm)
    bottomOffsetMm: number; // default: 20mm
    leftMarginMm: number; // default: 15mm
    rightMarginMm: number; // default: 15mm
    showVitals: boolean;
    showDiagnosis: boolean;
  };
}
```

---

## 5. Screen & Feature Specifications

### 5.1 Dashboard (`/dashboard`)
- **Prominent Patient Search Bar:** Autofocused or top-level, search by name or 10-digit mobile number with instant dropdown results.
- **Quick Action Buttons:** `+ New Patient`, `New Prescription`.
- **Follow-up Reminders Widget (Smart Alert):**
  - Displays patients whose scheduled follow-up is **Today**, **Tomorrow**, or **In 2 Days**.
  - Includes a direct green **"WhatsApp Reminder"** button that opens WhatsApp with pre-filled text:
    `"Namaste [Name] ji, this is a reminder from Dr. [Doctor] / [Clinic]. Your follow-up visit is scheduled for [Date]. Please visit the clinic between OPD hours. Call [Phone] for queries."`
- **Recent Patients & Recent Prescriptions:** 1-click access to open record or reprint.

### 5.2 Patient Management (`/patients` & `/patients/:id`)
- Patient table with instant filtering, sorting, and pagination.
- **Add Patient Modal:** Name, Mobile, Age, Gender, Address, Blood Group, Allergies, Notes.
- **Edit Patient Modal:** Complete inline update capability.
- **Patient Profile View:**
  - Header: Demographics, Allergies tag, Contact details.
  - Actions: `Start Prescription`, `Edit Details`, `WhatsApp Message`.
  - Chronological Visit Timeline: Displays all past prescriptions with date, diagnosis, vitals, prescribed medicines, and `View/Reprint` button.

### 5.3 Medicine Catalog (`/medicines`)
- Master list of clinic medications.
- Pre-seeded with 30+ top gastro, general, and antibiotic formulations.
- Add New Medicine & Edit Medicine modal (Name, Strength, Form, Default Dosage, Timing, Duration, Instructions).
- Fast search & status toggle (Active/Inactive).

### 5.4 Prescription Builder (`/prescription/new?patientId=...`)
- **Patient Banner:** Name, Age, Gender, Mobile, Patient ID.
- **Vitals Strip:** BP, Weight, Blood Sugar, Temperature, Pulse, SpO2.
- **Clinical Details:** Chief Complaints & Symptoms, Diagnosis (auto-resizing textareas).
- **Fast Medicine Autocomplete Table:**
  - Typing in the "Medicine Name" cell opens an instant dropdown filter of the Medicine Master catalog.
  - Selecting a medicine automatically fills: Dosage (e.g., `1-0-1`), Timing (`Before Food`), Duration (`5 Days`), Remarks. All fields remain editable inline.
  - `+ Add Medicine` button or Enter key to add subsequent rows.
- **Advice & Instructions:** Common quick-advice chips + free text.
- **Follow-up Selector:** Quick chips (7 Days, 14 Days, 1 Month, Custom Date) with auto-calculated calendar date.
- **Action Bar:**
  - `Save Draft`
  - `Print Prescription` (triggers print dialog with configured top offset)
  - `WhatsApp Prescription` (opens WhatsApp with formatted medicine schedule & follow-up date)

### 5.5 Print & Letterhead Engine (`/settings/print` & Print View)
- Real-time **Top Margin Calibration Slider** (20mm to 140mm / 0.8" to 5.5").
- **Live Preview Window:** Shows an A4 page visualization depicting where the pre-printed doctor logo sits and where patient data begins.
- **Test Print Button:** Prints a lightweight calibration ruler sheet to verify exact millimeter alignment on the doctor's actual stationery without wasting full pages.
- Dynamic CSS `@media print` rules using CSS variables so adjustments apply instantly without reloading.

---

## 6. Implementation Plan & Phases

1. **Phase 1: Foundation & Store Architecture**
   - Upgrade `localStore.js` with full schemas for `patients` (with edit/update), `medicines` (with seed catalog), `prescriptions` (with permanent visit link), and `settings` (print calibration).
   - Add JSON Backup & Restore utility so clinic data can be exported and imported with 1 click.

2. **Phase 2: Master Medicine Management & Fast Autocomplete**
   - Implement `/medicines` page with add/edit/search.
   - Build `MedicineAutocomplete` component for lightning-fast dropdown selection inside the prescription table.

3. **Phase 3: Prescription Builder & Patient History**
   - Enhance `PrescriptionPage.jsx` with full vitals, auto-complete medicine rows, follow-up scheduling, and permanent saving to patient visits.
   - Upgrade `PatientsPage.jsx` with Edit Patient modal and Patient Profile view with past prescriptions list & reprint.

4. **Phase 4: Configurable Print Engine & Letterhead Calibration**
   - Implement configurable top offset and margin controls in `SettingsPage.jsx` (and directly accessible from Prescription page).
   - Add Test Print utility and Pad Mode vs Digital Letterhead toggle.

5. **Phase 5: WhatsApp Sharing & Follow-up Reminders**
   - Add 1-click WhatsApp prescription sharing (`wa.me`).
   - Add "Upcoming Follow-ups (Next 1–2 Days)" widget in Dashboard & Patients view with pre-filled WhatsApp reminder alert.

---

## 7. Verification & Acceptance Criteria
- [ ] Patient can be searched in < 1 second by name, mobile, or ID.
- [ ] Patient details can be edited and saved.
- [ ] Doctor can type 2 letters and select a medicine with pre-filled dosage/timing.
- [ ] Prescription is permanently saved in patient visit history.
- [ ] Past prescriptions can be viewed and reprinted.
- [ ] Top print margin can be adjusted to match any physical doctor pad (leaving exact blank space for the logo).
- [ ] Upcoming follow-up patients (in 1–2 days) are highlighted with 1-click WhatsApp reminder links.
