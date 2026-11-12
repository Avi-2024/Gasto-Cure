# ClinicRx — Patient & Prescription Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ClinicRx, a lightweight doctor-centric clinical panel featuring instant patient search/edit, a pre-seeded medicine catalog with fast autocomplete, a comprehensive prescription builder with configurable top-margin printing for pre-printed letterheads, and 1-click WhatsApp follow-up reminders.

**Architecture:** Offline-first React 18 SPA powered by a modernized `localStore` service with indexed queries, dynamic CSS `@media print` margin variables, fast keyboard-navigable autocomplete, and WhatsApp deep-link generation. Fully decoupled from backend dependencies while remaining schema-compatible for future API sync.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide React, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-07-clinicrx-prescription-system-design.md`](file:///d:/jurnary/Gasto%20Cure/docs/superpowers/specs/2026-11-07-clinicrx-prescription-system-design.md)

---

## Global Constraints

- Storage: All patient, medicine, prescription, and calibration data must persist in `localStorage` under keys `ds_patients`, `ds_medicines`, `ds_visits`, `ds_settings` with backward-compatible defaults.
- Print: Page size must be standard A4. Default top offset must be `60mm` (configurable between `20mm` and `140mm`).
- Printing Modes: Support both "Pre-printed Pad Mode" (leaves blank header offset) and "Digital Letterhead Mode" (prints doctor/clinic header).
- Fast Medicine Autocomplete: Autocomplete must trigger on typing >= 2 characters, support keyboard navigation (Arrow Up/Down, Enter), and auto-fill dosage, timing, duration, and remarks.
- WhatsApp: Must use direct standard URI format `https://wa.me/91<10-digit-mobile>?text=<encoded-message>` with zero external API dependencies or costs.
- Follow-up Reminders: Must highlight patients whose next follow-up date is within the next 2 days (today, tomorrow, or overdue).
- Performance: Patient search and medicine search must filter and render in under 100ms.

## Review Focus

1. **Mobile number formatting for WhatsApp:** User inputs phone as `98765 43210`, `+91-9876543210`, or `09876543210`. The system must sanitize to clean 10-digit/12-digit format so `wa.me` links do not break.
2. **Pre-printed pad top margin persistence:** Doctor sets top margin to 75mm on their clinic laptop. The setting must persist across page refreshes and apply directly to the `@media print` CSS variables without reloading.
3. **Medicine catalog modification vs past prescriptions:** If a medicine's default dosage in the master catalog changes from `1-0-1` to `1-0-0`, previously saved patient prescriptions must preserve their original prescribed dosage snapshot.
4. **Follow-up date calculation with month/year boundaries:** When 30 or 60 days are added at the end of December or a 31-day month, the calculated follow-up date must correctly roll over month and year.
5. **Editing patient details preserves visit history:** When a patient's name, age, or contact is updated, their linked prescription IDs and visit history must remain intact.

---

### Task 1: Environment Setup & Core Data Service Upgrade (`localStore.js`)

**Files:**
- Create: `frontend/src/tests/localStore.test.js`
- Modify: `frontend/src/services/localStore.js`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `localStorage` browser API.
- Produces:
  - `localPatients`: `getAll()`, `getById(id)`, `search(q)`, `add(data)`, `update(id, data)`, `delete(id)`, `seed()`
  - `localMedicines`: `getAll()`, `search(q)`, `add(data)`, `update(id, data)`, `delete(id)`, `seed()`
  - `localVisits`: `save(data)`, `getByPatient(patientId)`, `getById(id)`, `getAll()`, `getUpcomingFollowUps(daysAhead)`
  - `localSettings`: `get()`, `update(data)`
  - `dataBackup`: `exportJson()`, `importJson(jsonString)`

- [ ] **Step 1: Install frontend npm dependencies**
Run `cd frontend && npm install` to install Vite, React, Vitest, and Tailwind dependencies.

- [ ] **Step 2: Write unit tests for upgraded `localStore.js`**
Write tests covering:
  - Patient CRUD and search by name/mobile/ID.
  - Medicine master list seeding (30+ formulations), autocomplete search filtering.
  - Visit saving: generates prescription ID `RX-YYYYMMDD-XXXX`, links `patientId`, saves snapshot of medicines, updates patient's `nextFollowUp` and `lastVisit`.
  - Upcoming follow-up query: correctly filters follow-ups occurring today, tomorrow, or overdue.
  - Print and clinic settings retrieval and persistence.

- [ ] **Step 3: Run tests to verify failure**
Run: `cd frontend && npx vitest run src/tests/localStore.test.js`
Expected: FAIL (missing methods / new modules).

- [ ] **Step 4: Implement enhanced `localStore.js`**
Implement the enhanced schema and methods in `frontend/src/services/localStore.js`:
  - Pre-seed 35+ common Indian clinic medicines (Pantoprazole, Paracetamol, Amoxicillin-Clav, Rabeprazole, Cefixime, Ondansetron, Domperidone, Azithromycin, Metformin, Telmisartan, etc.) with pre-configured forms, dosages, timings, and durations.
  - Implement `update(id, patch)` for patients.
  - Implement `getUpcomingFollowUps(daysAhead)` with date comparison logic.
  - Implement `localSettings` for top margin (`topOffsetMm: 60`), pad mode (`padMode: true`), clinic demographics.
  - Implement JSON backup and restore functions.

- [ ] **Step 5: Run tests to verify pass**
Run: `cd frontend && npx vitest run src/tests/localStore.test.js`
Expected: PASS (all tests green).

- [ ] **Step 6: Commit Task 1**
```bash
git add frontend/package.json frontend/package-lock.json frontend/src/services/localStore.js frontend/src/tests/localStore.test.js
git commit -m "feat: upgrade localStore with medicine master, patient update, follow-up filters, and settings"
```

---

### Task 2: Master Medicine Management Page (`/medicines`)

**Files:**
- Create: `frontend/src/pages/Medicines/MedicinesPage.jsx`
- Create: `frontend/src/pages/Medicines/components/AddEditMedicineModal.jsx`
- Modify: `frontend/src/router/AppRouter.jsx`
- Modify: `frontend/src/components/navigation/Sidebar.jsx`

**Interfaces:**
- Consumes: `localMedicines` from `frontend/src/services/localStore.js`.
- Produces: UI route `/medicines` with medicine search, filtering by form, adding new medicine, editing existing medicine, and toggling active/inactive status.

- [ ] **Step 1: Write component test for Medicines page**
Create `frontend/src/tests/MedicinesPage.test.jsx` verifying:
  - Renders master medicine list from `localMedicines`.
  - Filters medicines by search query (e.g., "Panto").
  - Opens modal to add new medicine and saves to `localMedicines`.
  - Allows editing existing medicine defaults (dosage, timing).

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/tests/MedicinesPage.test.jsx`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `AddEditMedicineModal.jsx` and `MedicinesPage.jsx`**
Create clean medical UI with:
  - Search input and Form filter (All, Tablet, Capsule, Syrup, Injection, Ointment).
  - Add New Medicine button and modal with fields: Name, Strength, Form, Default Dosage, Timing, Duration, Instructions.
  - Action buttons: Edit, Toggle Active/Inactive, Delete.
  - Connect to `localMedicines`.

- [ ] **Step 4: Register route and navigation item**
In `AppRouter.jsx`, add route `<Route path="/medicines" element={<MedicinesPage />} />`.
In `Sidebar.jsx`, add navigation link for "Medicines" with pill icon (`Pill` from `lucide-react`).

- [ ] **Step 5: Run tests and verify pass**
Run: `cd frontend && npx vitest run src/tests/MedicinesPage.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit Task 2**
```bash
git add frontend/src/pages/Medicines/ frontend/src/router/AppRouter.jsx frontend/src/components/navigation/Sidebar.jsx frontend/src/tests/MedicinesPage.test.jsx
git commit -m "feat: add master medicine catalog management page and navigation"
```

---

### Task 3: Fast Medicine Autocomplete Component for Prescription Builder

**Files:**
- Create: `frontend/src/pages/Prescriptions/components/MedicineAutocomplete.jsx`
- Modify: `frontend/src/pages/Prescriptions/components/MedicineTable.jsx`
- Modify: `frontend/src/pages/Prescriptions/PrescriptionPage.css`

**Interfaces:**
- Consumes: `localMedicines.search()`
- Produces: `<MedicineAutocomplete value={med.name} onSelect={(selectedMed) => ...} />` which auto-populates dosage, frequency, timing, duration, and remarks on selection.

- [ ] **Step 1: Write unit test for `MedicineAutocomplete`**
Create `frontend/src/tests/MedicineAutocomplete.test.jsx` verifying:
  - Input responds to typing.
  - Drops down matching medicines when >= 2 chars typed.
  - Arrow Up/Down highlights options, Enter key selects option.
  - Calls `onSelect` with complete medicine object including defaults (`defaultDosage`, `defaultTiming`, `defaultDuration`, `defaultInstruction`).

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/tests/MedicineAutocomplete.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement `MedicineAutocomplete.jsx`**
Build keyboard-friendly accessible autocomplete component:
  - Query state, debounced search from `localMedicines`.
  - Floating suggestions dropdown with Name, Strength, Form badge, and Default dosage preview.
  - Click outside detection and ESC key dismiss.
  - Auto-select on Enter or mouse click.

- [ ] **Step 4: Integrate into `MedicineTable.jsx`**
Update `MedicineTable.jsx`:
  - Replace plain text input with `<MedicineAutocomplete />`.
  - When medicine is chosen, call `onUpdateMedicineFull(rowId, { name, dosage, frequency, duration, remarks })`.
  - Add explicit "Timing / Instructions" column (e.g., Before Food / After Food).

- [ ] **Step 5: Run test to verify pass**
Run: `cd frontend && npx vitest run src/tests/MedicineAutocomplete.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit Task 3**
```bash
git add frontend/src/pages/Prescriptions/components/MedicineAutocomplete.jsx frontend/src/pages/Prescriptions/components/MedicineTable.jsx frontend/src/pages/Prescriptions/PrescriptionPage.css frontend/src/tests/MedicineAutocomplete.test.jsx
git commit -m "feat: implement fast medicine autocomplete in prescription medicine table"
```

---

### Task 4: Configurable Print Alignment & Test Print Engine for Pre-Printed Pads

**Files:**
- Create: `frontend/src/utils/printStyles.js`
- Create: `frontend/src/pages/Settings/tabs/PrintSettingsTab.jsx`
- Create: `frontend/src/pages/Settings/components/TestPrintSheet.jsx`
- Modify: `frontend/src/pages/Settings/SettingsPage.jsx`
- Modify: `frontend/src/pages/Prescriptions/PrescriptionPage.css`

**Interfaces:**
- Consumes: `localSettings.get()`, `localSettings.update()`
- Produces:
  - `applyPrintSettings(settings)`: injects dynamic CSS print rules (top offset in mm, pad mode vs digital header).
  - Print settings tab in `/settings` with Top Offset slider (20mm - 140mm) and live preview.
  - Quick top offset slider on the Prescription screen.
  - Test print calibration sheet showing exact millimeter markers.

- [ ] **Step 1: Write test for print settings utility**
Create `frontend/src/tests/printSettings.test.js` verifying:
  - Saves top offset, margins, and pad mode toggle.
  - Generates valid `@media print` CSS variables string based on millimeters.
  - Sanitizes out-of-bound values (clamps between 10mm and 150mm).

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/tests/printSettings.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement `printStyles.js` and `TestPrintSheet.jsx`**
  - Implement `applyPrintSettings(settings)` to update root CSS variables `--print-top-offset`, `--print-left-margin`, `--print-right-margin`.
  - Update `PrescriptionPage.css` `@media print`:
    - Use `padding-top: var(--print-top-offset, 60mm) !important;`
    - When `padMode` is false (Digital Letterhead), render the clinic header at the top of the printout. When `padMode` is true (Pre-printed pad), hide the digital header and preserve blank top space for doctor logo.
  - Implement `TestPrintSheet.jsx`: A printable ruler page with horizontal lines marked at 30mm, 40mm, 50mm, 60mm, 70mm, 80mm, 90mm, 100mm to test physical paper alignment.

- [ ] **Step 4: Implement `PrintSettingsTab.jsx` in `SettingsPage.jsx`**
Add Settings page with:
  - Doctor & Clinic demographics (Clinic Name, Doctor Name, Qualifications, Registration No., Phone, Address).
  - Print Configuration:
    - Mode Switch: "Pre-printed Pad Mode" (skip logo area) vs "Plain Paper Digital Letterhead".
    - Top Offset Slider (20mm - 140mm / 0.8" - 5.5") with live millimeter display.
    - Left & Right Margins slider (10mm - 30mm).
    - Live visual preview diagram of A4 paper showing the logo space vs printable area.
    - "Test Print Alignment Sheet" button.
    - "Save Print Settings" button.

- [ ] **Step 5: Run tests and verify pass**
Run: `cd frontend && npx vitest run src/tests/printSettings.test.js`
Expected: PASS.

- [ ] **Step 6: Commit Task 4**
```bash
git add frontend/src/utils/printStyles.js frontend/src/pages/Settings/ frontend/src/pages/Prescriptions/PrescriptionPage.css frontend/src/tests/printSettings.test.js
git commit -m "feat: implement configurable top-offset printing engine and calibration settings"
```

---

### Task 5: Comprehensive Prescription Builder & Permanent Visit Storage

**Files:**
- Modify: `frontend/src/pages/Prescriptions/PrescriptionPage.jsx`
- Modify: `frontend/src/pages/Prescriptions/PrescriptionsPage.jsx`
- Create: `frontend/src/pages/Prescriptions/components/PrintPreviewModal.jsx`
- Create: `frontend/src/utils/whatsappHelper.js`

**Interfaces:**
- Consumes: `localPatients`, `localVisits`, `localSettings`, `applyPrintSettings`
- Produces:
  - Complete prescription creation workflow: Vitals, Complaints, Diagnosis, Autocomplete Medicines, Advice, Follow-up date.
  - In-screen Quick Top Margin slider.
  - Permanent saving of prescription into `localVisits` and update of patient's `nextFollowUp` date.
  - 1-Click WhatsApp prescription sharing via `generatePrescriptionWhatsAppLink(patient, prescription, clinic)`.
  - Prescription list page (`/prescriptions`) showing all past prescriptions with 1-click view/reprint.

- [ ] **Step 1: Write test for WhatsApp prescription formatting and visit saving**
Create `frontend/src/tests/prescriptionWorkflow.test.js` verifying:
  - `generatePrescriptionWhatsAppLink`: outputs valid `https://wa.me/91<clean_phone>?text=...` containing patient name, diagnosis, medicines list with dosage, and next follow-up date.
  - Saving prescription creates visit record, assigns RX number, and updates patient's `nextFollowUp` and `lastVisit`.

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/tests/prescriptionWorkflow.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement `whatsappHelper.js`**
Build helper:
  - Phone cleaner: strips spaces, hyphens, leading +91 or 0, ensures 10-digit Indian mobile (or valid international format).
  - Format prescription text with clean bullet points:
    ```text
    *ClinicRx - Prescription Summary*
    Patient: [Name] | Date: [Date]
    Diagnosis: [Diagnosis]
    
    *Medicines (Rx):*
    1. Pantoprazole 40mg - 1-0-1 (Before Food) - 5 Days
    2. Paracetamol 650mg - 1-0-1 (After Food) - 3 Days
    
    *Advice:* [Advice]
    *Next Follow-up:* [FollowUpDate]
    
    Dr. [DoctorName], [ClinicName]
    ```

- [ ] **Step 4: Update `PrescriptionPage.jsx`**
  - Add quick top margin slider in top control bar: `Pad Offset: [ 60 mm ]` with real-time update.
  - Add full Vitals inputs: BP, Weight, Blood Sugar, Temperature, Pulse, SpO2.
  - Add "Pre-printed Pad / Digital Header" toggle button.
  - Connect `MedicineAutocomplete` to medicine rows.
  - Update `handlePrint`:
    1. Validates form.
    2. Saves prescription permanently to `localVisits.save()`.
    3. Updates patient's scheduled `nextFollowUp`.
    4. Triggers `window.print()`.
  - Add "Share WhatsApp" button: triggers `window.open(generatePrescriptionWhatsAppLink(...), '_blank')`.
  - Add "Print Preview" modal toggle so doctor can review on screen before printing.

- [ ] **Step 5: Update `PrescriptionsPage.jsx`**
Replace placeholder page with active prescriptions table:
  - Displays all past prescriptions chronologically with Rx ID, Date, Patient Name, Diagnosis, Medicines count, Actions (`View / Print`, `WhatsApp`).
  - Search by patient name or prescription ID.

- [ ] **Step 6: Run test to verify pass**
Run: `cd frontend && npx vitest run src/tests/prescriptionWorkflow.test.js`
Expected: PASS.

- [ ] **Step 7: Commit Task 5**
```bash
git add frontend/src/utils/whatsappHelper.js frontend/src/pages/Prescriptions/ frontend/src/tests/prescriptionWorkflow.test.js
git commit -m "feat: complete prescription builder with visit persistence, pad offset controls, and WhatsApp sharing"
```

---

### Task 6: Patient Management Upgrade — Edit Patient Details & Full Profile History

**Files:**
- Create: `frontend/src/pages/Patients/components/EditPatientModal.jsx`
- Create: `frontend/src/pages/Patients/components/PatientProfileDrawer.jsx`
- Modify: `frontend/src/pages/Patients/PatientsPage.jsx`

**Interfaces:**
- Consumes: `localPatients`, `localVisits`
- Produces:
  - Edit patient information modal (Name, Mobile, Age, Gender, Address,  Allergies, Notes).
  - Patient Profile drawer/modal showing patient demographics, medical history tags, and chronological past visits with 1-click View/Reprint.
  - Direct WhatsApp quick chat button on patient row.

- [ ] **Step 1: Write test for Patient Edit & History viewing**
Create `frontend/src/tests/PatientManagement.test.jsx` verifying:
  - Editing patient updates `localPatients` without breaking existing visit links.
  - Patient Profile drawer displays all past visits for the selected patient.
  - WhatsApp chat button on patient row opens correct `wa.me` URL.

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/tests/PatientManagement.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement `EditPatientModal.jsx`**
Build modal allowing doctor/staff to edit:
  - Full Name, Age, Gender, Mobile Number, Address,  Allergies, Important Notes.
  - Updates patient record via `localPatients.update(patientId, formData)`.

- [ ] **Step 4: Implement `PatientProfileDrawer.jsx`**
Build profile view showing:
  - Patient header with demographic badges, Allergies alert.
  - Actions: `+ New Prescription`, `Edit Details`, `Open WhatsApp`.
  - Visit History Timeline: Every past prescription date, diagnosis, vitals, prescribed medicines, and `Reprint Prescription` button.

- [ ] **Step 5: Integrate into `PatientsPage.jsx`**
  - Add "Edit" button and "Profile" button on each patient table row.
  - Add 1-click WhatsApp icon button to message patient directly.
  - Show "Next Follow-up" column in the patients table.

- [ ] **Step 6: Run test to verify pass**
Run: `cd frontend && npx vitest run src/tests/PatientManagement.test.jsx`
Expected: PASS.

- [ ] **Step 7: Commit Task 6**
```bash
git add frontend/src/pages/Patients/ frontend/src/tests/PatientManagement.test.jsx
git commit -m "feat: add patient edit modal, profile drawer with past prescriptions timeline, and WhatsApp chat"
```

---

### Task 7: Dashboard Follow-up Reminders (1–2 Days Before) & Prominent Patient Search

**Files:**
- Create: `frontend/src/pages/Dashboard/components/FollowUpRemindersWidget.jsx`
- Create: `frontend/src/pages/Dashboard/components/QuickPatientSearch.jsx`
- Modify: `frontend/src/pages/Dashboard/DashboardPage.jsx`

**Interfaces:**
- Consumes: `localVisits.getUpcomingFollowUps()`, `localPatients.search()`, `generateFollowUpReminderWhatsAppLink()`
- Produces:
  - Top prominent patient search bar on Dashboard with instant results dropdown.
  - Follow-up Reminders Widget highlighting patients with follow-ups scheduled for Today, Tomorrow, or In 2 Days.
  - 1-Click "Send WhatsApp Reminder" button that opens WhatsApp with pre-filled reminder template.

- [ ] **Step 1: Write test for Follow-up Reminders Widget**
Create `frontend/src/tests/FollowUpReminders.test.jsx` verifying:
  - Correctly filters patients with follow-up dates in 1–2 days.
  - Displays "Due Today", "Tomorrow", "In 2 Days", or "Overdue" status badges.
  - Clicking "Send WhatsApp Reminder" generates proper reminder text with patient name, doctor/clinic name, and follow-up date.

- [ ] **Step 2: Run test to verify failure**
Run: `cd frontend && npx vitest run src/tests/FollowUpReminders.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement `FollowUpRemindersWidget.jsx`**
Build widget:
  - Header: "Follow-Up Reminders" with count badge.
  - List of upcoming follow-ups with Patient Name, Mobile, Scheduled Date, Reason/Diagnosis, and Due tag (e.g. "Tomorrow" in amber, "Today" in rose).
  - 1-Click green WhatsApp button: opens `wa.me` with polite message:
    `"Namaste [Name] ji, this is a reminder from Dr. [Doctor] / [Clinic]. Your follow-up consultation is scheduled for [Date]. Please visit the clinic on time. Contact: [Phone]"`
  - "Mark Reminded" action to track reminder sent.

- [ ] **Step 4: Implement `QuickPatientSearch.jsx`**
Build prominent search bar at top of dashboard:
  - Big search input: "Search patient by name, mobile, or ID (e.g. PT-001)..."
  - Instant dropdown results with 1-click actions: "New Prescription", "View Profile", "Add to Queue".
  - "+ Add New Patient" quick action button right beside search.

- [ ] **Step 5: Integrate into `DashboardPage.jsx`**
Mount `QuickPatientSearch` and `FollowUpRemindersWidget` prominently on the doctor dashboard.

- [ ] **Step 6: Run test to verify pass**
Run: `cd frontend && npx vitest run src/tests/FollowUpReminders.test.jsx`
Expected: PASS.

- [ ] **Step 7: Commit Task 7**
```bash
git add frontend/src/pages/Dashboard/ frontend/src/tests/FollowUpReminders.test.jsx
git commit -m "feat: add dashboard follow-up reminders widget with 1-click WhatsApp alerts and prominent patient search"
```

---

### Task 8: End-to-End Verification, Print Calibration Audit & Production Build

**Files:**
- Modify: `frontend/src/app/App.jsx`
- Modify: `frontend/src/utils/printStyles.js`

**Interfaces:**
- Consumes: Complete ClinicRx application.
- Produces: Verified, production-ready build passing all test suites, linting, and manual calibration workflows.

- [ ] **Step 1: Run complete test suite**
Run: `cd frontend && npx vitest run`
Verify all unit and component tests pass without error.

- [ ] **Step 2: Execute production build**
Run: `cd frontend && npm run build`
Verify `dist/` bundle compiles with zero syntax or bundling errors.

- [ ] **Step 3: Verify all 5 Review Focus edge cases**
  - Verify phone number sanitizer formats tricky inputs (`+91 98765-43210`) into valid `wa.me` URLs.
  - Verify top margin slider persists to `localStorage` and updates `@media print` CSS variables immediately.
  - Verify past prescriptions retain their original medicine names and dosage snapshot when master catalog entries are updated.
  - Verify follow-up date calculation across month boundaries.
  - Verify editing patient details preserves existing visit history and patient ID.

- [ ] **Step 4: Final commit and tag**
```bash
git add .
git commit -m "feat: finalize ClinicRx doctor prescription panel with pre-printed pad offset, medicine catalog, and WhatsApp follow-up reminders"
```
