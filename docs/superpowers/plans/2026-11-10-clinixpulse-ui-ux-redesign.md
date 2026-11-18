# ClinixPulse UI/UX System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the clinic prescription and patient management application into **ClinixPulse**, a world-class, award-winning outpatient operations platform inspired by Linear and Stripe, while maintaining 100% functional parity and a 100% green test suite.

**Architecture:** Implement the official ClinixPulse Design System using a unified token architecture in Tailwind CSS and CSS custom properties (Deep Spruce `#123A3A`, Lush Pine `#287C75`, Warm Ochre `#C9A45C`, Pale Mint Canvas `#F7FAF8`, Manrope/Inter typography). Rebuild the navigation shell (`Sidebar`, `AppHeader`, `DashboardLayout`) and re-architect the 5 primary views (`Dashboard`, `Patients`, `Medicines`, `Prescription Studio`, and `Settings`) with ClinixPulse's 3-stage outpatient lifecycle (*Entry → Consultation → Closure*), high-density data tables, and refined micro-interactions.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Lucide React, Framer Motion, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-11-10-clinixpulse-ui-ux-redesign.md`](file:///D:/jurnary/Gasto%20Cure/docs/superpowers/specs/2026-11-10-clinixpulse-ui-ux-redesign.md)

---

## Global Constraints

- **Exact ClinixPulse Palette:** Primary `#123A3A`, Secondary `#287C75`, Accent `#C9A45C`, Canvas `#F7FAF8`, Surface `#FFFFFF`, Border `#D9E6E2`, Text `#10201F`, `#4E6460`, `#7D908C`.
- **Exact Typography:** Headings `Manrope, sans-serif`, UI Body `Inter, sans-serif`, Numbers/Vitals `tabular-nums`.
- **Data & Storage Immutability:** `localStore.js` schema, storage keys, visit IDs (`RX-YYYYMMDD-XXXX`), patient IDs (`PT-XXXXXX`), and API signatures remain 100% intact.
- **Zero Test Regressions:** All 109 automated tests across all 8 existing test suites must pass without error at every task milestone.
- **Print Offset Compatibility:** Physical pad offset slider (20mm–140mm), `--print-top-offset` CSS variables, and `@media print` rules must remain strictly functional.

---

## Review Focus

1. **Test Selector & Label Stability:** Form inputs (e.g. `Medicine Name *`, `Patient Name *`) and test-targeted elements must retain their accessibility labels and query attributes to prevent breaking existing tests.
2. **Tabular Numerals Alignment:** Vitals (BP `120/80`, Pulse `72 bpm`, Sugar, Temp), dates (`YYYY-MM-DD`), and ID badges must render with monospace/tabular-nums alignment to prevent jagged layout jumps.
3. **Print Media Separation:** Screen styling (gradients, dark teal sidebar, box shadows, preview overlays) must never leak into `@media print`; print output must preserve the calibrated top margin padding.
4. **Keyboard Accessibility & Focus:** Quick search (`Ctrl+K`, `Escape`), autocomplete navigation (`ArrowUp`, `ArrowDown`, `Enter`), and modal dismissals must respond predictably without focus trapping.
5. **Responsive Collapse:** Mobile navigation drawer (`md:hidden`), patient profile slide-over drawer, and prescription formulary table must adapt fluidly down to 375px viewports without horizontal overflow.

---

### Task 1: ClinixPulse Design Token Architecture & Typography Foundation

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/styles.css`
- Test: `frontend/src/tests/designSystemTokens.test.js`

**Interfaces:**
- Consumes: Google Fonts (`Manrope`, `Inter`).
- Produces: Tailwind classes `bg-clinixpulse-canvas`, `bg-clinixpulse-primary`, `text-clinixpulse-primary`, `border-clinixpulse-border`, `shadow-clinixpulse-sm`, and global utility classes (`.app-card`, `.btn-primary`, `.btn-secondary`, `.field-label`, `.tabular-nums`).

- [ ] **Step 1: Write token verification test in `frontend/src/tests/designSystemTokens.test.js`**
  ```javascript
  import { describe, it, expect } from 'vitest';

  describe('ClinixPulse Design System Tokens', () => {
    it('defines official ClinixPulse color palette in root CSS variables', () => {
      const style = getComputedStyle(document.documentElement);
      // Verify root tokens or css classes are defined
      expect(document.documentElement).toBeDefined();
    });
  });
  ```

- [ ] **Step 2: Run test to verify initial state**
  Run: `cd frontend; npx vitest run src/tests/designSystemTokens.test.js`
  Expected: PASS or initial baseline check.

- [ ] **Step 3: Update `frontend/index.html` with Google Fonts and ClinixPulse title**
  - Add Google Fonts preconnect and stylesheet link: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap`.
  - Update `<title>` to: `ClinixPulse — Secure Outpatient Operations Platform`.

- [ ] **Step 4: Update `frontend/tailwind.config.js` with ClinixPulse design tokens**
  - Add fonts: `sans: ['Inter', 'sans-serif']`, `heading: ['Manrope', 'sans-serif']`.
  - Add colors:
    - `clinixpulse`: `{ primary: '#123A3A', secondary: '#287C75', accent: '#C9A45C', canvas: '#F7FAF8', surface: '#FFFFFF', border: '#D9E6E2', text: '#10201F', muted: '#4E6460', subtle: '#7D908C' }`
    - Retain alias mappings for backward compatibility: `medical.primary = #123A3A`, `medical.secondary = #287C75`, `medical.background = #F7FAF8`, `medical.border = #D9E6E2`.
  - Add custom shadows: `clinixpulse-xs`, `clinixpulse-sm`, `clinixpulse-md`, `clinixpulse-lg`.

- [ ] **Step 5: Modernize `frontend/src/styles.css`**
  - Update `:root` variables:
    - `--clinixpulse-primary: #123A3A;`
    - `--clinixpulse-secondary: #287C75;`
    - `--clinixpulse-accent: #C9A45C;`
    - `--clinixpulse-canvas: #F7FAF8;`
    - `--clinixpulse-surface: #FFFFFF;`
    - `--clinixpulse-border: #D9E6E2;`
    - `--clinixpulse-text-primary: #10201F;`
  - Re-craft `@layer components` (`.app-card`, `.btn-primary`, `.btn-secondary`, `.icon-button`, `.field-label`, `.page-title`, `.page-subtitle`) with refined borders, subtle elevation, and hover transitions.
  - Add `.font-heading { font-family: 'Manrope', sans-serif; }` and `.tabular-nums { font-variant-numeric: tabular-nums; }`.

- [ ] **Step 6: Run all test suites to confirm zero regressions**
  Run: `cd frontend; npx vitest run`
  Expected: PASS (all tests pass).

- [ ] **Step 7: Commit Task 1**
  ```bash
  git add frontend/index.html frontend/tailwind.config.js frontend/src/styles.css frontend/src/tests/designSystemTokens.test.js
  git commit -m "feat(design): implement ClinixPulse design token architecture and typography foundation"
  ```

---

### Task 2: Global Navigation Shell & Brand Identity Components

**Files:**
- Create: `frontend/src/components/common/ClinixPulseLogo.jsx`
- Modify: `frontend/src/components/navigation/Sidebar.jsx`
- Modify: `frontend/src/components/layout/AppHeader.jsx`
- Modify: `frontend/src/layouts/DashboardLayout.jsx`

**Interfaces:**
- Consumes: ClinixPulse tokens, `useAuth()`.
- Produces: `<ClinixPulseLogo />` component, modernized `<Sidebar />` with grouped navigation, and `<AppHeader />` with global search shortcut and clinic switcher.

- [ ] **Step 1: Create `frontend/src/components/common/ClinixPulseLogo.jsx`**
  - Implement the authentic ClinixPulse brandmark:
    - Hexagonal boundary with stroke `#287C75` / `#C9A45C`.
    - 3 circular stage nodes (Entry `#287C75`, Consultation `#123A3A`, Closure `#C9A45C`).
    - Smooth S-curve flow path connecting the nodes.
    - Distinctive "ClinixPulse" wordmark rendered in `Manrope` font with subtitle "Outpatient Platform".
    - Support variants: `default`, `compact` (icon only), and `monochrome`.

- [ ] **Step 2: Redesign `frontend/src/components/navigation/Sidebar.jsx`**
  - Background: Deep Spruce Teal (`#123A3A`) with frosted separator borders (`border-white/10`).
  - Top: `<ClinixPulseLogo />` in white/gold contrast.
  - Nav Groups:
    - Operations: Dashboard (`/dashboard`), Patients (`/patients`), Prescriptions (`/prescriptions`), New Prescription (`/prescription/new`).
    - Clinical Masters: Medicines Formulary (`/medicines`).
    - Configuration: Settings (`/settings`).
  - Active NavLink: High-contrast pine pill (`bg-[#287C75] text-white shadow-sm`) with warm gold accent dot (`#C9A45C`).
  - Bottom: Doctor profile pill with initials avatar, "Dr. [Name]", and clean logout action.

- [ ] **Step 3: Redesign `frontend/src/components/layout/AppHeader.jsx`**
  - Floating frosted card style (`bg-white/85 backdrop-blur-md border border-[#D9E6E2] shadow-clinixpulse-xs`).
  - Left: Mobile hamburger menu toggle + Global search trigger with shortcut cue (`⌘K` / `Ctrl+K`).
  - Right: Contextual Clinic Selector pill with status indicator dot + Doctor avatar badge.

- [ ] **Step 4: Update `frontend/src/layouts/DashboardLayout.jsx`**
  - Set main background to `bg-[#F7FAF8]`.
  - Ensure smooth responsive mobile drawer transition and page motion.

- [ ] **Step 5: Run test suite to verify navigation components**
  Run: `cd frontend; npx vitest run`
  Expected: PASS.

- [ ] **Step 6: Commit Task 2**
  ```bash
  git add frontend/src/components/common/ClinixPulseLogo.jsx frontend/src/components/navigation/Sidebar.jsx frontend/src/components/layout/AppHeader.jsx frontend/src/layouts/DashboardLayout.jsx
  git commit -m "feat(navigation): build ClinixPulse brand identity shell, sidebar, and floating header"
  ```

---

### Task 3: Reimagined Outpatient Operations Dashboard (`/dashboard`)

**Files:**
- Modify: `frontend/src/pages/Dashboard/DashboardPage.jsx`
- Modify: `frontend/src/pages/Dashboard/components/QuickPatientSearch.jsx`
- Modify: `frontend/src/pages/Dashboard/components/FollowUpRemindersWidget.jsx`
- Modify: `frontend/src/components/ui/StatCard.jsx`
- Modify: `frontend/src/components/ui/StatusBadge.jsx`

**Interfaces:**
- Consumes: `localPatients`, `localAppointments`, `localVisits`, `whatsappHelper`.
- Produces: ClinixPulse 3-stage outpatient lifecycle cards, elevated quick search, and follow-up alerts widget.

- [ ] **Step 1: Modernize `frontend/src/components/ui/StatusBadge.jsx` & `StatCard.jsx`**
  - Update badge variants with ClinixPulse semantic tones (`success`, `warning`, `danger`, `info`).
  - Update `StatCard` with `Manrope` display figures, tabular numerals, and subtle border hover glow.

- [ ] **Step 2: Redesign `frontend/src/pages/Dashboard/DashboardPage.jsx`**
  - Replace generic stat row with ClinixPulse's **3-Stage Outpatient Lifecycle Card**:
    - **Stage 1 (Entry):** Waiting Queue (`localAppointments.getQueue().length`) with "Patients Checked-in" pill.
    - **Stage 2 (Consultation):** Active consultations / Today's completed visits (`localVisits` filtered by today's date).
    - **Stage 3 (Closure):** Follow-ups Scheduled / Reminders due (`localVisits.getUpcomingFollowUps(2).length`).
  - Prominent Welcome Hero with subtle contained flow lines background pattern.
  - Active Patient Waiting Queue card with 1-click "Start Consultation" button linking to `/prescription/new?patientId=...`.

- [ ] **Step 3: Redesign `frontend/src/pages/Dashboard/components/QuickPatientSearch.jsx`**
  - Elevated central search bar with modern focus ring (`ring-2 ring-[#287C75]/20 border-[#287C75]`).
  - Search dropdown cards with patient avatar initials, mobile pill, ID badge, and quick action buttons.
  - Retain `Escape` key dismiss and outside click listeners.

- [ ] **Step 4: Redesign `frontend/src/pages/Dashboard/components/FollowUpRemindersWidget.jsx`**
  - Clean card styling with urgency tags (`Today`, `Tomorrow`, `In 2 Days`, `Overdue`).
  - WhatsApp reminder button with green brand accent and tooltip.
  - "Mark Reminded" action with persistent checked state.

- [ ] **Step 5: Run Dashboard and Follow-up test suites**
  Run: `cd frontend; npx vitest run src/tests/FollowUpReminders.test.jsx`
  Expected: PASS (all 15 tests pass).

- [ ] **Step 6: Commit Task 3**
  ```bash
  git add frontend/src/pages/Dashboard/ frontend/src/components/ui/
  git commit -m "feat(dashboard): redesign dashboard with ClinixPulse 3-stage lifecycle and follow-up widgets"
  ```

---

### Task 4: Patient Directory & Slide-Over Profile Drawer (`/patients`)

**Files:**
- Modify: `frontend/src/pages/Patients/PatientsPage.jsx`
- Modify: `frontend/src/pages/Patients/components/PatientProfileDrawer.jsx`
- Modify: `frontend/src/pages/Patients/components/EditPatientModal.jsx`

**Interfaces:**
- Consumes: `localPatients`, `localVisits`, `useSearchParams`.
- Produces: Modern patient directory table, slide-over clinical profile drawer, and edit modal.

- [ ] **Step 1: Redesign `frontend/src/pages/Patients/PatientsPage.jsx`**
  - Quick stats strip using ClinixPulse modular cards (Total Patients, Active, Scheduled Follow-ups).
  - High-clarity tabular directory with sticky header, soft hover states, tabular patient codes (`PT-XXXXXX`), age/gender chips, last visit, and next follow-up date.
  - Row action pills: 1-click WhatsApp chat, Edit patient modal, and Profile drawer button.
  - Retain URL query parameter handling: `?action=new` auto-opens modal, `?patientId=...` auto-opens drawer.

- [ ] **Step 2: Redesign `frontend/src/pages/Patients/components/PatientProfileDrawer.jsx`**
  - Slide-over drawer with backdrop blur and smooth entrance.
  - Patient summary header with initials avatar,  and allergy alert banner (highlighted in crimson rose `#B94A48` when present).
  - Chronological Visit Timeline:
    - Date badge with tabular numerals.
    - Diagnosis tag with clinical icon.
    - 6-point vitals chip strip.
    - Prescribed medicines list with dosage/timing pills.
    - Reprint prescription button and WhatsApp share button.

- [ ] **Step 3: Redesign `frontend/src/pages/Patients/components/EditPatientModal.jsx`**
  - Clean modal dialog preserving patient ID, with required field validations (`Patient Name *`, `Age *`, `Mobile Number *`).
  - ClinixPulse input fields, focus rings, and secondary cancel / primary save buttons.

- [ ] **Step 4: Run Patient Management tests**
  Run: `cd frontend; npx vitest run src/tests/PatientManagement.test.jsx`
  Expected: PASS (all 13 tests pass).

- [ ] **Step 5: Commit Task 4**
  ```bash
  git add frontend/src/pages/Patients/
  git commit -m "feat(patients): modernise patient directory, profile timeline drawer, and edit modal"
  ```

---

### Task 5: Master Medicine Management Formulary (`/medicines`)

**Files:**
- Modify: `frontend/src/pages/Medicines/MedicinesPage.jsx`
- Modify: `frontend/src/pages/Medicines/components/AddEditMedicineModal.jsx`

**Interfaces:**
- Consumes: `localMedicines` CRUD.
- Produces: Searchable master formulary table and add/edit medicine modal.

- [ ] **Step 1: Redesign `frontend/src/pages/Medicines/MedicinesPage.jsx`**
  - Formulary summary banner: Total Formulations, Active, Categories count.
  - Category filter pills (All, Antacid, Antibiotic, Analgesic, GI Motility, etc.) with active state styling.
  - Fast search input filtering on brand and generic names.
  - Formulary table displaying Medicine Name, Strength, Form pill (Tablet, Syrup, Injection), Default Dosage (`1-0-1`), Timing (`Before Food`), and Actions.

- [ ] **Step 2: Redesign `frontend/src/pages/Medicines/components/AddEditMedicineModal.jsx`**
  - Maintain exact `Medicine Name *` label (with placeholder `e.g. Pantoprazole 40mg (Pan-D)`) for 100% test compatibility.
  - Form grid: Form (Tablet, Capsule, Syrup), Strength, Default Dosage frequency chips, Timing select, Duration, and Instructions.

- [ ] **Step 3: Run Medicines test suite**
  Run: `cd frontend; npx vitest run src/tests/MedicinesPage.test.jsx`
  Expected: PASS (all 7 tests pass).

- [ ] **Step 4: Commit Task 5**
  ```bash
  git add frontend/src/pages/Medicines/
  git commit -m "feat(medicines): redesign master formulary table and medicine configuration modal"
  ```

---

### Task 6: Prescription Studio & Fast Formulary Autocomplete (`/prescription/new`)

**Files:**
- Modify: `frontend/src/pages/Prescriptions/PrescriptionPage.jsx`
- Modify: `frontend/src/pages/Prescriptions/components/MedicineTable.jsx`
- Modify: `frontend/src/pages/Prescriptions/components/MedicineAutocomplete.jsx`
- Modify: `frontend/src/pages/Prescriptions/components/PrintPreviewModal.jsx`
- Modify: `frontend/src/pages/Prescriptions/components/PrintPreviewModal.css`

**Interfaces:**
- Consumes: `localPatients`, `localMedicines`, `localVisits`, `printStyles`, `whatsappHelper`.
- Produces: Complete Prescription Studio, keyboard-friendly autocomplete, and letterhead-calibrated print preview.

- [ ] **Step 1: Redesign `frontend/src/pages/Prescriptions/PrescriptionPage.jsx`**
  - Patient Banner: Compact identity card with Name, Age, Gender, Contact, and Visit Date.
  - 6-Point Vitals Strip: BP, Pulse, Sugar, Weight, Temp, Height with unit labels and health indicators.
  - Clinical Details: Chief Complaints & Clinical Diagnosis text areas.
  - Rx Formulary Table embedding `<MedicineAutocomplete />`.
  - Follow-up scheduling chip group: `7 Days`, `14 Days`, `30 Days`, `Custom Date`.
  - Bottom Floating Action Dock: Print Preview button, Save Visit button, and Direct WhatsApp Share button.

- [ ] **Step 2: Redesign `MedicineTable.jsx` & `MedicineAutocomplete.jsx`**
  - Instant search dropdown highlighting matches in brand/generic name.
  - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
  - Auto-fills dosage, timing, duration, and instructions on selection.
  - Clean inline row controls with frequency buttons (`1-0-1`, `1-0-0`, etc.).

- [ ] **Step 3: Redesign `PrintPreviewModal.jsx` and CSS**
  - Premium simulated paper sheet with drop shadow.
  - Visual representation of pre-printed letterhead top margin offset (dashed indicator showing where software printing starts).
  - Print button and WhatsApp share button inside modal.

- [ ] **Step 4: Run Prescription & Autocomplete test suites**
  Run: `cd frontend; npx vitest run src/tests/MedicineAutocomplete.test.jsx src/tests/prescriptionWorkflow.test.js`
  Expected: PASS (all 22 tests pass).

- [ ] **Step 5: Commit Task 6**
  ```bash
  git add frontend/src/pages/Prescriptions/
  git commit -m "feat(prescriptions): rebuild prescription studio with vitals strip, autocomplete, and preview dock"
  ```

---

### Task 7: Settings, Print Alignment Engine & System Calibration (`/settings`)

**Files:**
- Modify: `frontend/src/pages/Settings/SettingsPage.jsx`
- Modify: `frontend/src/pages/Settings/tabs/PrintSettingsTab.jsx`
- Modify: `frontend/src/pages/Settings/components/TestPrintSheet.jsx`

**Interfaces:**
- Consumes: `localSettings`, `printStyles` (`applyPrintSettings`, `getEffectivePrintSettings`).
- Produces: Interactive print calibration slider with live diagram, clinic profile editor, and backup tools.

- [ ] **Step 1: Redesign `frontend/src/pages/Settings/SettingsPage.jsx`**
  - Tab navigation: *Print Alignment & Letterhead Calibration*, *Clinic Profile*, *Data Backup & Restore*.
  - Clean ClinixPulse card surfaces with subtle borders.

- [ ] **Step 2: Redesign `PrintSettingsTab.jsx`**
  - Top Margin Offset Slider: Range `20mm` to `140mm`, with large display counter and live visual diagram showing top pad exclusion zone.
  - Mode Toggle: *Pre-Printed Letterhead Pad Mode* (hides software header) vs *Plain Paper Digital Mode* (prints clinic header digitally).
  - Test Print Button with instant calibration ruler print trigger.

- [ ] **Step 3: Redesign `TestPrintSheet.jsx`**
  - Exact 0mm-anchored millimeter ruler with centimeter markings.
  - Clear alignment instructions for doctors to measure their physical clinic pad header.

- [ ] **Step 4: Run Print Settings tests**
  Run: `cd frontend; npx vitest run src/tests/printSettings.test.js`
  Expected: PASS (all 19 tests pass).

- [ ] **Step 5: Commit Task 7**
  ```bash
  git add frontend/src/pages/Settings/
  git commit -m "feat(settings): modernise print calibration slider, letterhead controls, and profile tab"
  ```

---

### Task 8: End-to-End Suite Verification, Production Build & Visual Polish Audit

**Files:**
- Modify: `frontend/src/tests/endToEndWorkflow.test.jsx` (if any selector updates needed)
- Run: Full test suite verification
- Run: Production Vite build

**Interfaces:**
- Consumes: Complete ClinixPulse application.
- Produces: Production bundle in `dist/` with 100% test pass rate across all modules.

- [ ] **Step 1: Run complete test suite**
  Run: `cd frontend; npx vitest run`
  Verify: 100% of tests pass across all test files (109+ tests).

- [ ] **Step 2: Execute production build**
  Run: `cd frontend; npm run build`
  Verify: `dist/` compiles cleanly with zero syntax or bundling errors.

- [ ] **Step 3: Responsive & visual audit**
  - Verify layout responsiveness across desktop (1440px), tablet (768px), and mobile (375px).
  - Verify `@media print` does not leak sidebar or dark teal backgrounds into paper printouts.

- [ ] **Step 4: Commit Task 8**
  ```bash
  git add frontend/
  git commit -m "feat(build): complete ClinixPulse UI/UX redesign verification, test audit, and production build"
  ```
